package com.shopsphere.service;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class RazorpayClientTest {

    private final RazorpayClient client = new RazorpayClient("rzp_test_key", "test_secret", "whsec");

    @Test
    void acceptsAValidPaymentSignature() {
        assertTrue(client.verifyPayment("order_123", "pay_456", "6c343620f1910da483982cf25b9dc33d709afdd25930f08964ef60b65aefa831"));
    }

    @Test
    void rejectsATamperedPayment() {
        assertFalse(client.verifyPayment("order_123", "pay_999", "6c343620f1910da483982cf25b9dc33d709afdd25930f08964ef60b65aefa831"));
        assertFalse(client.verifyPayment("order_123", "pay_456", null));
    }

    @Test
    void verifiesWebhookSignatureOverTheRawBody() {
        assertTrue(client.verifyWebhook("{\"event\":\"payment.captured\"}", "4673dd707ef4c41b987cb7fefe1583142dc702388c93145b7814b9ad3d3c183e"));
        assertFalse(client.verifyWebhook("{\"event\":\"payment.failed\"}", "4673dd707ef4c41b987cb7fefe1583142dc702388c93145b7814b9ad3d3c183e"));
    }

    @Test
    void notConfiguredMeansDisabledAndFailsClosed() {
        RazorpayClient off = new RazorpayClient("", "", "");
        assertFalse(off.enabled());
        assertFalse(off.verifyPayment("order_123", "pay_456", "6c343620f1910da483982cf25b9dc33d709afdd25930f08964ef60b65aefa831"));
        assertFalse(off.verifyWebhook("{}", "anything"));
    }
}
