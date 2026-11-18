package com.shopsphere.service;

import com.shopsphere.dto.Dtos.CheckoutResponse;
import com.shopsphere.dto.Dtos.OrderDto;
import com.shopsphere.dto.Dtos.OrderRequest;
import com.shopsphere.dto.Dtos.PaymentInit;
import com.shopsphere.entity.PaymentMethod;
import com.shopsphere.exception.ApiException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/**
 * Deliberately NOT @Transactional: the orders are committed first, then the (slow) call to the
 * payment provider happens without holding any database locks. If the provider call fails,
 * the orders are cancelled and stock is returned.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CheckoutService {

    private final OrderService orderService;
    private final RazorpayClient razorpay;

    public CheckoutResponse checkout(String email, OrderRequest req) {
        boolean online = req.paymentMethod() == PaymentMethod.ONLINE;
        if (online && !razorpay.enabled()) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Online payment is not set up on this server. Please choose cash on delivery.");
        }

        String checkoutId = UUID.randomUUID().toString();
        List<OrderDto> placed = orderService.createOrders(email, req, checkoutId);
        if (!online) {
            return new CheckoutResponse(placed, null);
        }

        BigDecimal total = placed.stream().map(OrderDto::total).reduce(BigDecimal.ZERO, BigDecimal::add);
        try {
            String razorpayOrderId = razorpay.createOrder(PaymentService.toPaise(total), checkoutId);
            orderService.attachGatewayOrder(checkoutId, razorpayOrderId);
            PaymentInit init = new PaymentInit(razorpay.keyId(), razorpayOrderId, PaymentService.toPaise(total), "INR");
            return new CheckoutResponse(placed, init);
        } catch (RuntimeException e) {
            log.error("Could not create the Razorpay order for checkout {}", checkoutId, e);
            orderService.cancelCheckout(checkoutId);
            throw new ApiException(HttpStatus.BAD_GATEWAY, "We could not start the payment. Please try again.");
        }
    }
}
