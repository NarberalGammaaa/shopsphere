package com.shopsphere.controller;

import com.shopsphere.dto.Dtos.*;
import com.shopsphere.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    /** Public: tells the frontend whether online payment is available (and the public key id). */
    @GetMapping("/config")
    public PaymentConfig config() {
        return paymentService.config();
    }

    @PostMapping("/verify")
    public Map<String, String> verify(Authentication auth, @Valid @RequestBody VerifyRequest req) {
        paymentService.verify(auth.getName(), req);
        return Map.of("status", "paid");
    }

    /** "Complete payment" for an order that was placed but not paid yet. */
    @PostMapping("/{checkoutId}/init")
    public PaymentInit init(Authentication auth, @PathVariable String checkoutId) {
        return paymentService.init(auth.getName(), checkoutId);
    }

    /** Called by Razorpay's servers. Public, but every call is checked against the webhook signature. */
    @PostMapping("/webhook")
    public ResponseEntity<Void> webhook(@RequestBody String body,
                                        @RequestHeader(value = "X-Razorpay-Signature", required = false) String signature) {
        paymentService.handleWebhook(body, signature);
        return ResponseEntity.ok().build();
    }
}
