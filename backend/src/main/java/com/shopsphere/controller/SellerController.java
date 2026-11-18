package com.shopsphere.controller;

import com.shopsphere.dto.Dtos.*;
import com.shopsphere.service.OrderService;
import com.shopsphere.service.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Everything under /api/seller/** (except /auth) requires ROLE_SELLER; sellers only see their own data. */
@RestController
@RequestMapping("/api/seller")
@RequiredArgsConstructor
public class SellerController {

    private final ProductService productService;
    private final OrderService orderService;

    @GetMapping("/stats")
    public SellerStats stats(Authentication auth) {
        return orderService.sellerStats(auth.getName());
    }

    @GetMapping("/products")
    public PageResponse<ProductDto> products(Authentication auth,
                                             @RequestParam(defaultValue = "0") int page,
                                             @RequestParam(defaultValue = "12") int size) {
        return productService.mine(auth.getName(), page, size);
    }

    @PostMapping("/products")
    @ResponseStatus(HttpStatus.CREATED)
    public ProductDto create(Authentication auth, @Valid @RequestBody ProductRequest req) {
        return productService.create(auth.getName(), req);
    }

    @PutMapping("/products/{id}")
    public ProductDto update(Authentication auth, @PathVariable Long id, @Valid @RequestBody ProductRequest req) {
        return productService.update(auth.getName(), id, req);
    }

    @DeleteMapping("/products/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(Authentication auth, @PathVariable Long id) {
        productService.delete(auth.getName(), id);
    }

    @GetMapping("/orders")
    public List<OrderDto> orders(Authentication auth) {
        return orderService.forSeller(auth.getName());
    }

    @PatchMapping("/orders/{id}/status")
    public OrderDto updateStatus(Authentication auth, @PathVariable Long id, @Valid @RequestBody StatusRequest req) {
        return orderService.sellerUpdateStatus(auth.getName(), id, req.status());
    }
}
