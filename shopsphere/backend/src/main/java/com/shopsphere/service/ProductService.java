package com.shopsphere.service;

import com.shopsphere.dto.Dtos.*;
import com.shopsphere.entity.Category;
import com.shopsphere.entity.Product;
import com.shopsphere.exception.ApiException;
import com.shopsphere.repository.CategoryRepository;
import com.shopsphere.repository.ProductRepository;
import com.shopsphere.util.Mapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository products;
    private final CategoryRepository categories;

    @Transactional(readOnly = true)
    public PageResponse<ProductDto> search(String q, Long categoryId, int page, int size, String sort) {
        Sort order = switch (sort == null ? "" : sort) {
            case "priceAsc" -> Sort.by("price").ascending();
            case "priceDesc" -> Sort.by("price").descending();
            case "rating" -> Sort.by("rating").descending();
            default -> Sort.by("id").descending();
        };
        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 48), order);
        Page<Product> result = products.search(q == null ? "" : q.trim(), categoryId, pageable);
        List<ProductDto> content = result.getContent().stream().map(Mapper::product).toList();
        return new PageResponse<>(content, result.getNumber(), result.getTotalPages(), result.getTotalElements());
    }

    @Transactional(readOnly = true)
    public ProductDto get(Long id) {
        return Mapper.product(find(id));
    }

    @Transactional(readOnly = true)
    public List<CategoryDto> categories() {
        return categories.findAll(Sort.by("name")).stream().map(Mapper::category).toList();
    }

    @Transactional
    public ProductDto create(ProductRequest req) {
        Product p = new Product();
        apply(p, req);
        return Mapper.product(products.save(p));
    }

    @Transactional
    public ProductDto update(Long id, ProductRequest req) {
        Product p = find(id);
        apply(p, req);
        return Mapper.product(products.save(p));
    }

    @Transactional
    public void delete(Long id) {
        if (!products.existsById(id)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Product not found");
        }
        products.deleteById(id);
        products.flush(); // surface FK violations (product already ordered) here -> handled as 409
    }

    private Product find(Long id) {
        return products.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Product not found"));
    }

    private void apply(Product p, ProductRequest req) {
        Category c = categories.findById(req.categoryId())
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Unknown category"));
        p.setName(req.name().trim());
        p.setDescription(req.description());
        p.setPrice(req.price());
        p.setStock(req.stock());
        p.setImageUrl(req.imageUrl().trim());
        p.setCategory(c);
        if (req.rating() != null) {
            p.setRating(req.rating());
        }
    }
}
