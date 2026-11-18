package com.shopsphere.service;

import com.shopsphere.dto.Dtos.*;
import com.shopsphere.entity.*;
import com.shopsphere.exception.ApiException;
import com.shopsphere.repository.OrderRepository;
import com.shopsphere.repository.ProductRepository;
import com.shopsphere.repository.UserRepository;
import com.shopsphere.util.Mapper;
import com.shopsphere.util.Pricing;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderService {

    private final OrderRepository orders;
    private final ProductRepository products;
    private final UserRepository users;
    private final OfferService offers;

    // ====================== placing orders ======================

    /**
     * Prices (including any running sale) and stock always come from the database, never from the
     * client. Items are grouped by seller, so one checkout can create several orders.
     */
    @Transactional
    public List<OrderDto> createOrders(String email, OrderRequest req, String checkoutId) {
        User buyer = users.findByEmail(email)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "User not found"));
        int discount = offers.runningDiscountPercent();
        OrderStatus initial = req.paymentMethod() == PaymentMethod.ONLINE
                ? OrderStatus.AWAITING_PAYMENT : OrderStatus.PENDING;

        // Merge duplicate lines and sort by id so row locks are always taken in the same order.
        Map<Long, Integer> wanted = new TreeMap<>();
        for (OrderItemRequest line : req.items()) {
            wanted.merge(line.productId(), line.quantity(), Integer::sum);
        }

        Map<Long, Order> bySeller = new LinkedHashMap<>();
        for (Map.Entry<Long, Integer> line : wanted.entrySet()) {
            Long productId = line.getKey();
            int qty = line.getValue();
            Product p = products.findByIdForUpdate(productId)
                    .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Product " + productId + " no longer exists"));
            if (p.getStock() < qty) {
                throw new ApiException(HttpStatus.CONFLICT, "Only " + p.getStock() + " left of " + p.getName());
            }
            p.setStock(p.getStock() - qty);

            User seller = p.getSeller();
            Order order = bySeller.get(seller.getId());
            if (order == null) {
                order = newOrder(buyer, seller, req, checkoutId, initial);
                bySeller.put(seller.getId(), order);
            }
            BigDecimal unitPrice = Pricing.sale(p.getPrice(), discount);
            OrderItem item = new OrderItem();
            item.setProduct(p);
            item.setQuantity(qty);
            item.setUnitPrice(unitPrice);
            order.addItem(item);
            order.setTotal(order.getTotal().add(unitPrice.multiply(BigDecimal.valueOf(qty))));
        }
        return orders.saveAll(bySeller.values()).stream().map(Mapper::order).toList();
    }

    private Order newOrder(User buyer, User seller, OrderRequest req, String checkoutId, OrderStatus initial) {
        Order o = new Order();
        o.setUser(buyer);
        o.setSeller(seller);
        o.setCheckoutId(checkoutId);
        o.setStatus(initial);
        o.setPaymentMethod(req.paymentMethod());
        o.setShippingName(req.shippingName().trim());
        o.setShippingPhone(req.shippingPhone());
        o.setShippingAddress(req.shippingAddress().trim());
        o.setShippingPincode(req.shippingPincode());
        o.setEstimatedDelivery(DeliveryService.estimatedDate(
                seller.getWarehousePincode(), req.shippingPincode(), Instant.now(), false));
        return o;
    }

    // ====================== payment bookkeeping ======================

    @Transactional
    public void attachGatewayOrder(String checkoutId, String razorpayOrderId) {
        orders.findByCheckoutId(checkoutId).forEach(o -> o.setRazorpayOrderId(razorpayOrderId));
    }

    /** Cancels a checkout that never got paid and returns the stock. */
    @Transactional
    public void cancelCheckout(String checkoutId) {
        for (Order o : orders.findByCheckoutId(checkoutId)) {
            if (o.getStatus() == OrderStatus.AWAITING_PAYMENT) {
                cancelAndRestock(o);
            }
        }
    }

    @Transactional
    public int cancelStaleUnpaid(Instant cutoff) {
        List<Order> stale = orders.findByStatusAndCreatedAtBefore(OrderStatus.AWAITING_PAYMENT, cutoff);
        stale.forEach(this::cancelAndRestock);
        return stale.size();
    }

    /**
     * Marks the orders of one gateway payment as paid. Safe to call twice (browser verify + webhook).
     * requiredEmail, when given, must own the orders. Returns how many orders matched the payment.
     */
    @Transactional
    public int markPaid(String razorpayOrderId, String paymentId, String requiredEmail) {
        List<Order> list = orders.findByRazorpayOrderId(razorpayOrderId);
        for (Order o : list) {
            if (requiredEmail != null && !o.getUser().getEmail().equals(requiredEmail)) {
                throw new ApiException(HttpStatus.FORBIDDEN, "This payment belongs to another account");
            }
        }
        for (Order o : list) {
            if (o.getStatus() == OrderStatus.AWAITING_PAYMENT) {
                o.setStatus(OrderStatus.PAID);
                o.setPaidAt(Instant.now());
                o.setRazorpayPaymentId(paymentId);
            } else if (o.getStatus() == OrderStatus.CANCELLED) {
                log.warn("Payment {} arrived for already-cancelled order {}: refund it in the Razorpay dashboard",
                        paymentId, o.getId());
            }
        }
        return list.size();
    }

    // ====================== reading ======================

    @Transactional(readOnly = true)
    public List<OrderDto> mine(String email) {
        User user = users.findByEmail(email)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "User not found"));
        return orders.findByUserOrderByCreatedAtDesc(user).stream().map(Mapper::order).toList();
    }

    @Transactional(readOnly = true)
    public OrderDto getMine(String email, Long id) {
        Order o = find(id);
        if (!o.getUser().getEmail().equals(email)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Order not found");
        }
        return Mapper.order(o);
    }

    @Transactional(readOnly = true)
    public List<OrderDto> forSeller(String sellerEmail) {
        User seller = users.findByEmail(sellerEmail)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "User not found"));
        return orders.findBySellerAndStatusNotOrderByCreatedAtDesc(seller, OrderStatus.AWAITING_PAYMENT)
                .stream().map(Mapper::order).toList();
    }

    @Transactional(readOnly = true)
    public List<OrderDto> all() {
        return orders.findAllByOrderByCreatedAtDesc().stream().map(Mapper::order).toList();
    }

    @Transactional(readOnly = true)
    public SellerStats sellerStats(String sellerEmail) {
        User seller = users.findByEmail(sellerEmail)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "User not found"));
        BigDecimal revenue = orders.revenueBySeller(seller,
                List.of(OrderStatus.PAID, OrderStatus.SHIPPED, OrderStatus.DELIVERED));
        return new SellerStats(
                products.countBySeller(seller),
                products.countBySellerAndStockLessThanEqual(seller, 5),
                orders.countBySellerAndStatusIn(seller,
                        List.of(OrderStatus.PENDING, OrderStatus.PAID, OrderStatus.SHIPPED, OrderStatus.DELIVERED)),
                orders.countBySellerAndStatusIn(seller, List.of(OrderStatus.PENDING, OrderStatus.PAID)),
                revenue == null ? BigDecimal.ZERO : revenue);
    }

    // ====================== status changes ======================

    /** Sellers can only move their own orders forward: ship, deliver, or cancel before shipping. */
    @Transactional
    public OrderDto sellerUpdateStatus(String sellerEmail, Long id, String status) {
        Order o = find(id);
        if (!o.getSeller().getEmail().equals(sellerEmail)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Order not found");
        }
        OrderStatus next = parse(status);
        OrderStatus current = o.getStatus();
        boolean allowed = switch (next) {
            case SHIPPED -> current == OrderStatus.PENDING || current == OrderStatus.PAID;
            case DELIVERED -> current == OrderStatus.SHIPPED;
            case CANCELLED -> current == OrderStatus.PENDING || current == OrderStatus.PAID;
            default -> false;
        };
        if (!allowed) {
            throw new ApiException(HttpStatus.CONFLICT, "An order that is " + current + " cannot be changed to " + next);
        }
        apply(o, next);
        return Mapper.order(o);
    }

    /** Admins may set any status except on cancelled orders. */
    @Transactional
    public OrderDto adminUpdateStatus(Long id, String status) {
        Order o = find(id);
        OrderStatus next = parse(status);
        if (o.getStatus() == OrderStatus.CANCELLED) {
            throw new ApiException(HttpStatus.CONFLICT, "A cancelled order cannot be changed");
        }
        if (o.getStatus() != next) {
            apply(o, next);
        }
        return Mapper.order(o);
    }

    // ====================== helpers ======================

    private void apply(Order o, OrderStatus next) {
        if (next == OrderStatus.CANCELLED) {
            cancelAndRestock(o);
            return;
        }
        Instant now = Instant.now();
        o.setStatus(next);
        switch (next) {
            case PAID -> {
                if (o.getPaidAt() == null) o.setPaidAt(now);
            }
            case SHIPPED -> {
                o.setShippedAt(now);
                o.setEstimatedDelivery(DeliveryService.estimatedDate(
                        o.getSeller().getWarehousePincode(), o.getShippingPincode(), now, true));
            }
            case DELIVERED -> {
                o.setDeliveredAt(now);
                if (o.getPaidAt() == null) o.setPaidAt(now); // cash collected on delivery
            }
            default -> { }
        }
    }

    private void cancelAndRestock(Order o) {
        for (OrderItem item : o.getItems()) {
            Product p = item.getProduct();
            p.setStock(p.getStock() + item.getQuantity());
        }
        o.setStatus(OrderStatus.CANCELLED);
    }

    private Order find(Long id) {
        return orders.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Order not found"));
    }

    private OrderStatus parse(String status) {
        try {
            return OrderStatus.valueOf(status.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Unknown status: " + status);
        }
    }
}
