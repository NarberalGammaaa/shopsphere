package com.shopsphere.util;

import java.math.BigDecimal;
import java.math.RoundingMode;

public final class Pricing {

    private Pricing() {}

    /** Price after a percentage discount, rounded to 2 decimals. 0% returns the price unchanged. */
    public static BigDecimal sale(BigDecimal price, int discountPercent) {
        if (discountPercent <= 0) {
            return price;
        }
        return price.multiply(BigDecimal.valueOf(100L - discountPercent))
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
    }
}
