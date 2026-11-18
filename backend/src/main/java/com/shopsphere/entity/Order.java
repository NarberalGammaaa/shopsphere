package com.shopsphere.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * One order belongs to exactly one seller. A checkout that contains products from several
 * sellers is split into several orders that share the same checkoutId (and one payment).
 */
@Entity(name = "ShopOrder")
@Table(name = "orders")
@Getter @Setter @NoArgsConstructor
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(optional = false)
    @JoinColumn(name = "seller_id")
    private User seller;

    @Column(nullable = false, length = 40)
    private String checkoutId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private OrderStatus status = OrderStatus.PENDING;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private PaymentMethod paymentMethod = PaymentMethod.COD;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal total = BigDecimal.ZERO;

    // ---- delivery details ----
    @Column(nullable = false, length = 100)
    private String shippingName;

    @Column(nullable = false, length = 15)
    private String shippingPhone;

    @Column(nullable = false, length = 400)
    private String shippingAddress;

    @Column(nullable = false, length = 6)
    private String shippingPincode;

    private LocalDate estimatedDelivery;

    // ---- payment gateway references ----
    @Column(length = 60)
    private String razorpayOrderId;

    @Column(length = 60)
    private String razorpayPaymentId;

    // ---- timeline ----
    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    private Instant paidAt;
    private Instant shippedAt;
    private Instant deliveredAt;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderItem> items = new ArrayList<>();

    public void addItem(OrderItem item) {
        item.setOrder(this);
        items.add(item);
    }
}
