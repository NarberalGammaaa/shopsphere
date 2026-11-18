package com.shopsphere.repository;

import com.shopsphere.entity.Product;
import com.shopsphere.entity.User;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, Long> {

    @Query("""
            select p from Product p
            where lower(p.name) like lower(concat('%', :q, '%'))
              and (:categoryId is null or p.category.id = :categoryId)
            """)
    Page<Product> search(@Param("q") String q, @Param("categoryId") Long categoryId, Pageable pageable);

    /** Row lock used while placing an order so two buyers cannot take the last item. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from Product p where p.id = :id")
    Optional<Product> findByIdForUpdate(@Param("id") Long id);

    Page<Product> findBySeller(User seller, Pageable pageable);

    long countBySeller(User seller);

    long countBySellerAndStockLessThanEqual(User seller, int stock);
}
