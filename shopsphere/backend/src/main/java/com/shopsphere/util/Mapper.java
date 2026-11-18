package com.shopsphere.util;

import com.shopsphere.dto.Dtos.*;
import com.shopsphere.entity.*;

/** Entity -> DTO conversion. Call inside a transaction when lazy collections are touched. */
public final class Mapper {

    private Mapper() {}

    public static UserDto user(User u) {
        return new UserDto(u.getId(), u.getName(), u.getEmail(), u.getRole().name());
    }

    public static CategoryDto category(Category c) {
        return new CategoryDto(c.getId(), c.getName(), c.getSlug());
    }

    public static ProductDto product(Product p) {
        Category c = p.getCategory();
        return new ProductDto(p.getId(), p.getName(), p.getDescription(), p.getPrice(), p.getStock(),
                p.getImageUrl(), p.getRating(), c == null ? null : c.getId(), c == null ? null : c.getName());
    }

    public static OrderDto order(Order o) {
        var items = o.getItems().stream()
                .map(i -> new OrderItemDto(i.getProduct().getId(), i.getProduct().getName(),
                        i.getProduct().getImageUrl(), i.getQuantity(), i.getUnitPrice()))
                .toList();
        return new OrderDto(o.getId(), o.getStatus().name(), o.getTotal(), o.getCreatedAt(),
                o.getShippingAddress(), o.getUser().getEmail(), items);
    }
}
