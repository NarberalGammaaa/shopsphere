package com.shopsphere.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.Map;

/**
 * Minimal Razorpay client (Orders API + signature checks) using Spring's RestClient,
 * so no extra SDK dependency is needed. Keys come from environment variables:
 * RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET and (optional) RAZORPAY_WEBHOOK_SECRET.
 */
@Component
public class RazorpayClient {

    private final String keyId;
    private final String keySecret;
    private final String webhookSecret;
    private final RestClient http;

    public RazorpayClient(@Value("${RAZORPAY_KEY_ID:}") String keyId,
                          @Value("${RAZORPAY_KEY_SECRET:}") String keySecret,
                          @Value("${RAZORPAY_WEBHOOK_SECRET:}") String webhookSecret) {
        this.keyId = keyId.trim();
        this.keySecret = keySecret.trim();
        this.webhookSecret = webhookSecret.trim();
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(5_000);
        factory.setReadTimeout(15_000);
        this.http = RestClient.builder()
                .baseUrl("https://api.razorpay.com/v1")
                .requestFactory(factory)
                .build();
    }

    public boolean enabled() {
        return !keyId.isEmpty() && !keySecret.isEmpty();
    }

    /** The public key id is safe to send to the browser. The secret never leaves the server. */
    public String keyId() {
        return keyId;
    }

    /** Creates a Razorpay order for the amount (in paise) and returns its id, e.g. "order_Nxyz...". */
    @SuppressWarnings("unchecked")
    public String createOrder(long amountPaise, String receipt) {
        Map<String, Object> body = Map.of("amount", amountPaise, "currency", "INR", "receipt", receipt);
        Map<String, Object> response = http.post()
                .uri("/orders")
                .headers(h -> h.setBasicAuth(keyId, keySecret))
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve()
                .body(Map.class);
        if (response == null || response.get("id") == null) {
            throw new IllegalStateException("Razorpay did not return an order id");
        }
        return String.valueOf(response.get("id"));
    }

    /** Checks the signature the browser got after a successful payment: HMAC_SHA256(orderId|paymentId). */
    public boolean verifyPayment(String razorpayOrderId, String razorpayPaymentId, String signature) {
        if (!enabled() || signature == null) return false;
        return constantTimeEquals(hmacHex(keySecret, razorpayOrderId + "|" + razorpayPaymentId), signature);
    }

    /** Checks the X-Razorpay-Signature header of a webhook call (HMAC of the raw body). Fails closed. */
    public boolean verifyWebhook(String rawBody, String signature) {
        if (webhookSecret.isEmpty() || signature == null) return false;
        return constantTimeEquals(hmacHex(webhookSecret, rawBody), signature);
    }

    private static String hmacHex(String secret, String data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return HexFormat.of().formatHex(mac.doFinal(data.getBytes(StandardCharsets.UTF_8)));
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("HMAC failure", e);
        }
    }

    private static boolean constantTimeEquals(String a, String b) {
        return MessageDigest.isEqual(a.getBytes(StandardCharsets.UTF_8), b.getBytes(StandardCharsets.UTF_8));
    }
}
