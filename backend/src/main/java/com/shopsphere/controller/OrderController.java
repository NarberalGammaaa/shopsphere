package com.shopsphere.controller;

import com.shopsphere.dto.Dtos.*;
import com.shopsphere.service.CheckoutService;
import com.shopsphere.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final CheckoutService checkoutService;
    private final OrderService orderService;

    /** Places the order(s). For online payment the response also carries what the Razorpay window needs. */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CheckoutResponse checkout(Authentication auth, @Valid @RequestBody OrderRequest req) {
        return checkoutService.checkout(auth.getName(), req);
    }

    @GetMapping("/my")
    public List<OrderDto> mine(Authentication auth) {
        return orderService.mine(auth.getName());
    }

    @GetMapping("/{id}")
    public OrderDto one(Authentication auth, @PathVariable Long id) {
        return orderService.getMine(auth.getName(), id);
    }
}
