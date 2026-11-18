package com.shopsphere.service;

import com.shopsphere.dto.Dtos.OfferDto;
import com.shopsphere.dto.Dtos.OfferRequest;
import com.shopsphere.entity.Offer;
import com.shopsphere.exception.ApiException;
import com.shopsphere.repository.OfferRepository;
import com.shopsphere.util.Mapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class OfferService {

    private final OfferRepository offers;

    /** The running sale, or the next upcoming one. Used by the countdown banner. */
    @Transactional(readOnly = true)
    public Optional<OfferDto> current() {
        return offers.findFirstByActiveTrueAndEndsAtAfterOrderByStartsAtAsc(Instant.now()).map(Mapper::offer);
    }

    /** Discount that applies to prices right now (0 when no sale is running). */
    @Transactional(readOnly = true)
    public int runningDiscountPercent() {
        Instant now = Instant.now();
        return offers.findFirstByActiveTrueAndEndsAtAfterOrderByStartsAtAsc(now)
                .filter(o -> !o.getStartsAt().isAfter(now))
                .map(Offer::getDiscountPercent)
                .orElse(0);
    }

    @Transactional(readOnly = true)
    public List<OfferDto> list() {
        return offers.findAll(Sort.by("startsAt").descending()).stream().map(Mapper::offer).toList();
    }

    @Transactional
    public OfferDto create(OfferRequest req) {
        if (!req.endsAt().isAfter(req.startsAt())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "The end time must be after the start time");
        }
        Offer o = new Offer();
        o.setTitle(req.title().trim());
        o.setDiscountPercent(req.discountPercent());
        o.setStartsAt(req.startsAt());
        o.setEndsAt(req.endsAt());
        return Mapper.offer(offers.save(o));
    }

    @Transactional
    public void delete(Long id) {
        if (!offers.existsById(id)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Offer not found");
        }
        offers.deleteById(id);
    }
}
