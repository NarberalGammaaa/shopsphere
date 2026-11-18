package com.shopsphere.util;

import com.shopsphere.dto.Dtos.*;
import com.shopsphere.entity.*;

import java.time.Instant;

/** Entity -> DTO conversion. Call inside a transaction when lazy collections are touched. */
public final class Mapper {

    private Mapper() {}

    public static UserDto user(User u) {
        return new UserDto(u.getId(), u.getName(), u.getEmail(), u.getRole().name(),
                u.getStoreName(), u.getWarehousePincode());
    }

    public static CategoryDto category(Category c) {
        return new CategoryDto(c.getId(), c.getName(), c.getSlug());
    }

    public static ProductDto product(Product p, int discountPercent) {
        Category c = p.getCategory();
        return new ProductDto(p.getId(), p.getName(), p.getDescription(), p.getPrice(),
                Pricing.sale(p.getPrice(), discountPercent), Math.max(discountPercent, 0),
                p.getStock(), p.getImageUrl(), p.getRating(),
                c == null ? null : c.getId(), c == null ? null : c.getName(),
                p.getSeller() == null ? null : p.getSeller().getStoreName());
    }

    public static OfferDto offer(Offer o) {
        Instant now = Instant.now();
        boolean running = o.isActive() && !o.getStartsAt().isAfter(now) && o.getEndsAt().isAfter(now);
        return new OfferDto(o.getId(), o.getTitle(), o.getDiscountPercent(), o.getStartsAt(), o.getEndsAt(),
                o.isActive(), running);
    }

    public static OrderDto order(Order o) {
        var items = o.getItems().stream()
                .map(i -> new OrderItemDto(i.getProduct().getId(), i.getProduct().getName(),
                        i.getProduct().getImageUrl(), i.getQuantity(), i.getUnitPrice()))
                .toList();
        return new OrderDto(o.getId(), o.getCheckoutId(), o.getStatus().name(), o.getPaymentMethod().name(),
                o.getTotal(), o.getCreatedAt(), o.getPaidAt(), o.getShippedAt(), o.getDeliveredAt(),
                o.getEstimatedDelivery(), o.getShippingName(), o.getShippingPhone(), o.getShippingAddress(),
                o.getShippingPincode(), o.getUser().getEmail(), o.getSeller().getStoreName(), items);
    }
}
