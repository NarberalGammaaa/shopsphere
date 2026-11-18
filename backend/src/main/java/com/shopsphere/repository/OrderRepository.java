package com.shopsphere.repository;

import com.shopsphere.entity.Order;
import com.shopsphere.entity.OrderStatus;
import com.shopsphere.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Collection;
import java.util.List;

public interface OrderRepository extends JpaRepository<Order, Long> {

    List<Order> findByUserOrderByCreatedAtDesc(User user);

    List<Order> findAllByOrderByCreatedAtDesc();

    List<Order> findByCheckoutId(String checkoutId);

    List<Order> findByRazorpayOrderId(String razorpayOrderId);

    /** A seller's orders. Unpaid online orders are hidden because they may never be paid. */
    List<Order> findBySellerAndStatusNotOrderByCreatedAtDesc(User seller, OrderStatus status);

    List<Order> findByStatusAndCreatedAtBefore(OrderStatus status, Instant cutoff);

    long countBySellerAndStatusIn(User seller, Collection<OrderStatus> statuses);

    @Query("select sum(o.total) from ShopOrder o where o.seller = :seller and o.status in :statuses")
    BigDecimal revenueBySeller(@Param("seller") User seller, @Param("statuses") Collection<OrderStatus> statuses);
}
