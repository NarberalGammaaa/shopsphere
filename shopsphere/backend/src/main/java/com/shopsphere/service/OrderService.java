package com.shopsphere.service;

import com.shopsphere.dto.Dtos.*;
import com.shopsphere.entity.*;
import com.shopsphere.exception.ApiException;
import com.shopsphere.repository.OrderRepository;
import com.shopsphere.repository.ProductRepository;
import com.shopsphere.repository.UserRepository;
import com.shopsphere.util.Mapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orders;
    private final ProductRepository products;
    private final UserRepository users;

    /**
     * Prices and stock always come from the database, never from the client,
     * so a tampered cart cannot change what the customer pays.
     */
    @Transactional
    public OrderDto place(String email, OrderRequest req) {
        User user = users.findByEmail(email)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "User not found"));

        // Merge duplicate lines and sort by id so row locks are always taken in the same order.
        Map<Long, Integer> wanted = new TreeMap<>();
        for (OrderItemRequest line : req.items()) {
            wanted.merge(line.productId(), line.quantity(), Integer::sum);
        }

        Order order = new Order();
        order.setUser(user);
        order.setShippingAddress(req.shippingAddress().trim());

        BigDecimal total = BigDecimal.ZERO;
        for (Map.Entry<Long, Integer> line : wanted.entrySet()) {
            Long productId = line.getKey();
            int qty = line.getValue();
            Product p = products.findByIdForUpdate(productId)
                    .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Product " + productId + " no longer exists"));
            if (p.getStock() < qty) {
                throw new ApiException(HttpStatus.CONFLICT,
                        "Only " + p.getStock() + " left of " + p.getName());
            }
            p.setStock(p.getStock() - qty);

            OrderItem item = new OrderItem();
            item.setProduct(p);
            item.setQuantity(qty);
            item.setUnitPrice(p.getPrice());
            order.addItem(item);
            total = total.add(p.getPrice().multiply(BigDecimal.valueOf(qty)));
        }
        order.setTotal(total);
        return Mapper.order(orders.save(order));
    }

    @Transactional(readOnly = true)
    public List<OrderDto> mine(String email) {
        User user = users.findByEmail(email)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "User not found"));
        return orders.findByUserOrderByCreatedAtDesc(user).stream().map(Mapper::order).toList();
    }

    @Transactional(readOnly = true)
    public List<OrderDto> all() {
        return orders.findAllByOrderByCreatedAtDesc().stream().map(Mapper::order).toList();
    }

    @Transactional
    public OrderDto updateStatus(Long id, String status) {
        Order order = orders.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Order not found"));
        OrderStatus next;
        try {
            next = OrderStatus.valueOf(status.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Unknown status: " + status);
        }
        if (order.getStatus() == OrderStatus.CANCELLED) {
            throw new ApiException(HttpStatus.CONFLICT, "A cancelled order cannot be changed");
        }
        if (next == OrderStatus.CANCELLED) { // put the stock back
            for (OrderItem item : order.getItems()) {
                Product p = item.getProduct();
                p.setStock(p.getStock() + item.getQuantity());
            }
        }
        order.setStatus(next);
        return Mapper.order(order);
    }
}
