package com.shopsphere.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

/** All request/response shapes in one place. Records keep them short and immutable. */
public final class Dtos {

    private Dtos() {}

    // ---- auth ----
    public record RegisterRequest(
            @NotBlank @Size(max = 100) String name,
            @NotBlank @Email @Size(max = 150) String email,
            @NotBlank @Size(min = 8, max = 72) String password) {}

    public record LoginRequest(@NotBlank @Email String email, @NotBlank String password) {}

    public record UserDto(Long id, String name, String email, String role) {}

    public record AuthResponse(String token, UserDto user) {}

    // ---- catalogue ----
    public record CategoryDto(Long id, String name, String slug) {}

    public record ProductDto(Long id, String name, String description, BigDecimal price, int stock,
                             String imageUrl, double rating, Long categoryId, String categoryName) {}

    public record ProductRequest(
            @NotBlank @Size(max = 200) String name,
            @Size(max = 5000) String description,
            @NotNull @DecimalMin("0.01") BigDecimal price,
            @Min(0) int stock,
            @NotBlank @Size(max = 600) String imageUrl,
            @NotNull Long categoryId,
            @DecimalMin("0.0") @DecimalMax("5.0") Double rating) {}

    // ---- orders ----
    public record OrderItemRequest(@NotNull Long productId, @Min(1) @Max(100) int quantity) {}

    public record OrderRequest(
            @NotEmpty @Valid List<OrderItemRequest> items,
            @NotBlank @Size(max = 500) String shippingAddress) {}

    public record OrderItemDto(Long productId, String name, String imageUrl, int quantity, BigDecimal unitPrice) {}

    public record OrderDto(Long id, String status, BigDecimal total, Instant createdAt,
                           String shippingAddress, String customerEmail, List<OrderItemDto> items) {}

    public record StatusRequest(@NotBlank String status) {}

    // ---- paging ----
    public record PageResponse<T>(List<T> content, int page, int totalPages, long totalElements) {}
}
