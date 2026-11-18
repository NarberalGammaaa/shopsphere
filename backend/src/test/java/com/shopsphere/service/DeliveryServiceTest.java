package com.shopsphere.service;

import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class DeliveryServiceTest {

    @Test
    void closerPinCodesDeliverFaster() {
        assertEquals(1, DeliveryService.transitDays("700001", "700001")); // same PIN
        assertEquals(2, DeliveryService.transitDays("700001", "700091")); // same city area (first 3 digits)
        assertEquals(3, DeliveryService.transitDays("700001", "701001")); // same region (first 2 digits)
        assertEquals(5, DeliveryService.transitDays("700001", "743001")); // same postal zone (first digit)
        assertEquals(7, DeliveryService.transitDays("700001", "400001")); // across India
    }

    @Test
    void missingPinFallsBackToTheSlowestEstimate() {
        assertEquals(7, DeliveryService.transitDays(null, "700001"));
    }

    @Test
    void estimatedDateAddsOneDayForPackingUntilShipped() {
        Instant noonIst = Instant.parse("2026-11-10T06:30:00Z"); // 12:00 in India
        assertEquals(LocalDate.of(2026, 11, 13), DeliveryService.estimatedDate("700001", "700091", noonIst, false)); // 1 + 2
        assertEquals(LocalDate.of(2026, 11, 12), DeliveryService.estimatedDate("700001", "700091", noonIst, true));  // 2
        assertNull(DeliveryService.estimatedDate(null, "700091", noonIst, false));
    }
}
