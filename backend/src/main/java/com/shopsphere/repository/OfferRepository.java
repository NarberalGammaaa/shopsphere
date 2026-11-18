package com.shopsphere.repository;

import com.shopsphere.entity.Offer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.Optional;

public interface OfferRepository extends JpaRepository<Offer, Long> {
    /** The sale that is running now, or (if none is running) the next one that has not ended yet. */
    Optional<Offer> findFirstByActiveTrueAndEndsAtAfterOrderByStartsAtAsc(Instant now);
}
