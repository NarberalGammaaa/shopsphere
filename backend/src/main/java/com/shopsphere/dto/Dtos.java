package com.shopsphere.dto;

import com.shopsphere.entity.PaymentMethod;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

/** All request/response shapes in one place. Records keep them short and immutable. */
public final class Dtos {

    private Dtos() {}

    // ---- auth ----
    public record RegisterRequest(
            @NotBlank @Size(max = 100) String name,
            @NotBlank @Email @Size(max = 150) String email,
            @NotBlank @Size(min = 8, max = 72) String password) {}

    public record SellerRegisterRequest(
            @NotBlank @Size(max = 100) String name,
            @NotBlank @Email @Size(max = 150) String email,
            @NotBlank @Size(min = 8, max = 72) String password,
            @NotBlank @Size(max = 120) String storeName,
            @NotBlank @Pattern(regexp = "[1-9][0-9]{5}", message = "must be a valid 6-digit PIN code") String warehousePincode) {}

    public record LoginRequest(@NotBlank @Email String email, @NotBlank String password) {}

    public record UserDto(Long id, String name, String email, String role, String storeName, String warehousePincode) {}

    public record AuthResponse(String token, UserDto user) {}

    // ---- catalogue ----
    public record CategoryDto(Long id, String name, String slug) {}

    public record ProductDto(Long id, String name, String description, BigDecimal price, BigDecimal salePrice,
                             int discountPercent, int stock, String imageUrl, double rating,
                             Long categoryId, String categoryName, String sellerName) {}

    public record ProductRequest(
            @NotBlank @Size(max = 200) String name,
            @Size(max = 5000) String description,
            @NotNull @DecimalMin("0.01") BigDecimal price,
            @Min(0) int stock,
            @NotBlank @Size(max = 600) String imageUrl,
            @NotNull Long categoryId,
            @DecimalMin("0.0") @DecimalMax("5.0") Double rating) {}

    // ---- offers (store-wide sale) ----
    public record OfferDto(Long id, String title, int discountPercent, Instant startsAt, Instant endsAt,
                           boolean active, boolean running) {}

    public record OfferRequest(
            @NotBlank @Size(max = 120) String title,
            @Min(1) @Max(90) int discountPercent,
            @NotNull Instant startsAt,
            @NotNull Instant endsAt) {}

    // ---- orders ----
    public record OrderItemRequest(@NotNull Long productId, @Min(1) @Max(100) int quantity) {}

    public record OrderRequest(
            @NotEmpty @Valid List<OrderItemRequest> items,
            @NotBlank @Size(max = 100) String shippingName,
            @NotBlank @Pattern(regexp = "[6-9][0-9]{9}", message = "must be a 10-digit mobile number") String shippingPhone,
            @NotBlank @Size(max = 400) String shippingAddress,
            @NotBlank @Pattern(regexp = "[1-9][0-9]{5}", message = "must be a valid 6-digit PIN code") String shippingPincode,
            @NotNull PaymentMethod paymentMethod) {}

    public record OrderItemDto(Long productId, String name, String imageUrl, int quantity, BigDecimal unitPrice) {}

    public record OrderDto(Long id, String checkoutId, String status, String paymentMethod, BigDecimal total,
                           Instant createdAt, Instant paidAt, Instant shippedAt, Instant deliveredAt,
                           LocalDate estimatedDelivery, String shippingName, String shippingPhone,
                           String shippingAddress, String shippingPincode, String customerEmail,
                           String sellerName, List<OrderItemDto> items) {}

    public record StatusRequest(@NotBlank String status) {}

    // ---- payments ----
    public record PaymentConfig(boolean enabled, String keyId, String currency) {}

    public record PaymentInit(String keyId, String razorpayOrderId, long amountPaise, String currency) {}

    public record VerifyRequest(
            @NotBlank String razorpayOrderId,
            @NotBlank String razorpayPaymentId,
            @NotBlank String razorpaySignature) {}

    public record CheckoutResponse(List<OrderDto> orders, PaymentInit payment) {}

    // ---- delivery ----
    public record DeliveryEstimate(Long productId, String productName, String sellerName, String fromPincode,
                                   String zone, int transitDays, LocalDate earliest, LocalDate latest) {}

    // ---- seller dashboard ----
    public record SellerStats(long productCount, long lowStock, long orderCount, long toShip, BigDecimal revenue) {}

    // ---- chat assistant ----
    public record ChatTurn(@NotBlank String role, @NotBlank @Size(max = 2000) String content) {}

    public record ChatRequest(
            @NotBlank @Size(max = 600) String message,
            @Size(max = 20) @Valid List<ChatTurn> history) {}

    public record ChatReply(String reply) {}

    // ---- paging ----
    public record PageResponse<T>(List<T> content, int page, int totalPages, long totalElements) {}
}
