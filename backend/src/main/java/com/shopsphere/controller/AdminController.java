package com.shopsphere.controller;

import com.shopsphere.dto.Dtos.*;
import com.shopsphere.service.OfferService;
import com.shopsphere.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Everything under /api/admin/** is restricted to ROLE_ADMIN in SecurityConfig. */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final OrderService orderService;
    private final OfferService offerService;

    @GetMapping("/orders")
    public List<OrderDto> allOrders() {
        return orderService.all();
    }

    @PatchMapping("/orders/{id}/status")
    public OrderDto updateStatus(@PathVariable Long id, @Valid @RequestBody StatusRequest req) {
        return orderService.adminUpdateStatus(id, req.status());
    }

    @GetMapping("/offers")
    public List<OfferDto> offers() {
        return offerService.list();
    }

    @PostMapping("/offers")
    @ResponseStatus(HttpStatus.CREATED)
    public OfferDto createOffer(@Valid @RequestBody OfferRequest req) {
        return offerService.create(req);
    }

    @DeleteMapping("/offers/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteOffer(@PathVariable Long id) {
        offerService.delete(id);
    }
}
