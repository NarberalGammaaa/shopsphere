package com.shopsphere.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.shopsphere.dto.Dtos.PaymentConfig;
import com.shopsphere.dto.Dtos.PaymentInit;
import com.shopsphere.dto.Dtos.VerifyRequest;
import com.shopsphere.entity.Order;
import com.shopsphere.entity.OrderStatus;
import com.shopsphere.exception.ApiException;
import com.shopsphere.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {

    private final RazorpayClient razorpay;
    private final OrderService orderService;
    private final OrderRepository orders;
    private final ObjectMapper objectMapper;

    public static long toPaise(BigDecimal rupees) {
        return rupees.movePointRight(2).setScale(0, RoundingMode.HALF_UP).longValueExact();
    }

    public PaymentConfig config() {
        boolean on = razorpay.enabled();
        return new PaymentConfig(on, on ? razorpay.keyId() : null, "INR");
    }

    /** Called by the browser after the Razorpay window reports success. The signature proves it. */
    public void verify(String email, VerifyRequest req) {
        if (!razorpay.verifyPayment(req.razorpayOrderId(), req.razorpayPaymentId(), req.razorpaySignature())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Payment could not be verified");
        }
        if (orderService.markPaid(req.razorpayOrderId(), req.razorpayPaymentId(), email) == 0) {
            throw new ApiException(HttpStatus.NOT_FOUND, "No order found for this payment");
        }
    }

    /** Backup path: Razorpay calls this even if the customer closed the browser right after paying. */
    public void handleWebhook(String rawBody, String signature) {
        if (!razorpay.verifyWebhook(rawBody, signature)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid webhook signature");
        }
        try {
            JsonNode root = objectMapper.readTree(rawBody);
            String event = root.path("event").asText();
            if ("payment.captured".equals(event) || "order.paid".equals(event)) {
                JsonNode payment = root.path("payload").path("payment").path("entity");
                String orderId = payment.path("order_id").asText();
                String paymentId = payment.path("id").asText();
                if (!orderId.isEmpty() && !paymentId.isEmpty()) {
                    orderService.markPaid(orderId, paymentId, null);
                }
            }
        } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Malformed webhook body");
        }
    }

    /** Re-opens payment for a checkout that is still unpaid ("Complete payment" button). */
    @Transactional(readOnly = true)
    public PaymentInit init(String email, String checkoutId) {
        if (!razorpay.enabled()) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "Online payments are not configured");
        }
        List<Order> unpaid = orders.findByCheckoutId(checkoutId).stream()
                .filter(o -> o.getUser().getEmail().equals(email)
                        && o.getStatus() == OrderStatus.AWAITING_PAYMENT
                        && o.getRazorpayOrderId() != null)
                .toList();
        if (unpaid.isEmpty()) {
            throw new ApiException(HttpStatus.CONFLICT, "There is nothing left to pay for this order");
        }
        BigDecimal total = unpaid.stream().map(Order::getTotal).reduce(BigDecimal.ZERO, BigDecimal::add);
        return new PaymentInit(razorpay.keyId(), unpaid.get(0).getRazorpayOrderId(), toPaise(total), "INR");
    }
}
