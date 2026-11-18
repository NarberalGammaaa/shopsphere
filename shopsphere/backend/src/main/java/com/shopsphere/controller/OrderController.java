package com.shopsphere.controller;

import com.shopsphere.dto.Dtos.*;
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

    private final OrderService orderService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public OrderDto place(Authentication auth, @Valid @RequestBody OrderRequest req) {
        return orderService.place(auth.getName(), req);
    }

    @GetMapping("/my")
    public List<OrderDto> mine(Authentication auth) {
        return orderService.mine(auth.getName());
    }
}
