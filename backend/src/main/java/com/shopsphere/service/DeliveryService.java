package com.shopsphere.service;

import com.shopsphere.dto.Dtos.DeliveryEstimate;
import com.shopsphere.entity.Product;
import com.shopsphere.entity.User;
import com.shopsphere.exception.ApiException;
import com.shopsphere.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

/**
 * Delivery time estimates from the seller's PIN code to the customer's PIN code.
 * Indian PIN codes are hierarchical: the more leading digits two PINs share, the closer they are.
 * This is an estimate by region, not live courier tracking.
 */
@Service
@RequiredArgsConstructor
public class DeliveryService {

    private static final ZoneId STORE_ZONE = ZoneId.of("Asia/Kolkata");
    private static final int PROCESSING_DAYS = 1;
    private static final Pattern PIN = Pattern.compile("[1-9][0-9]{5}");

    private final ProductRepository products;

    public static int transitDays(String from, String to) {
        if (from == null || to == null || from.length() != 6 || to.length() != 6) return 7;
        if (from.equals(to)) return 1;
        if (from.regionMatches(0, to, 0, 3)) return 2;
        if (from.regionMatches(0, to, 0, 2)) return 3;
        if (from.charAt(0) == to.charAt(0)) return 5;
        return 7;
    }

    public static String zone(String from, String to) {
        if (from == null || to == null || from.length() != 6 || to.length() != 6) return "across India";
        if (from.equals(to)) return "same PIN code area";
        if (from.regionMatches(0, to, 0, 3)) return "same city area";
        if (from.regionMatches(0, to, 0, 2)) return "same region";
        if (from.charAt(0) == to.charAt(0)) return "same postal zone";
        return "across India";
    }

    /** Expected delivery date for an order. Pass shipped=true once the parcel has left the seller. */
    public static LocalDate estimatedDate(String fromPin, String toPin, Instant base, boolean alreadyShipped) {
        if (fromPin == null || toPin == null) return null;
        LocalDate start = base.atZone(STORE_ZONE).toLocalDate();
        return start.plusDays((alreadyShipped ? 0 : PROCESSING_DAYS) + transitDays(fromPin, toPin));
    }

    @Transactional(readOnly = true)
    public List<DeliveryEstimate> estimate(String pincode, List<Long> productIds) {
        if (pincode == null || !PIN.matcher(pincode).matches()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Enter a valid 6-digit PIN code");
        }
        List<DeliveryEstimate> result = new ArrayList<>();
        for (Long id : productIds.stream().distinct().limit(30).toList()) {
            Product p = products.findById(id).orElse(null);
            if (p == null) continue;
            User seller = p.getSeller();
            String from = seller.getWarehousePincode();
            int transit = transitDays(from, pincode);
            LocalDate earliest = LocalDate.now(STORE_ZONE).plusDays(PROCESSING_DAYS + transit);
            result.add(new DeliveryEstimate(p.getId(), p.getName(), seller.getStoreName(), from,
                    zone(from, pincode), transit, earliest, earliest.plusDays(1)));
        }
        return result;
    }
}
