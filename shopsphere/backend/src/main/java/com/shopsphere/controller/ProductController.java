package com.shopsphere.controller;

import com.shopsphere.dto.Dtos.*;
import com.shopsphere.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @GetMapping("/products")
    public PageResponse<ProductDto> list(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(defaultValue = "newest") String sort) {
        return productService.search(q, categoryId, page, size, sort);
    }

    @GetMapping("/products/{id}")
    public ProductDto one(@PathVariable Long id) {
        return productService.get(id);
    }

    @GetMapping("/categories")
    public List<CategoryDto> categories() {
        return productService.categories();
    }
}
