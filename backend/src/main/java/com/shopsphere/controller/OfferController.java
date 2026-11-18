package com.shopsphere.controller;

import com.shopsphere.dto.Dtos.OfferDto;
import com.shopsphere.service.OfferService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/offers")
@RequiredArgsConstructor
public class OfferController {

    private final OfferService offerService;

    /** The running sale, or the next upcoming one. 204 when there is none. */
    @GetMapping("/current")
    public ResponseEntity<OfferDto> current() {
        return offerService.current()
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }
}
