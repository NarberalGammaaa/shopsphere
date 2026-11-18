package com.shopsphere.service;

import com.shopsphere.dto.Dtos.*;
import com.shopsphere.entity.Category;
import com.shopsphere.entity.Product;
import com.shopsphere.entity.User;
import com.shopsphere.exception.ApiException;
import com.shopsphere.repository.CategoryRepository;
import com.shopsphere.repository.ProductRepository;
import com.shopsphere.repository.UserRepository;
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
    private final UserRepository users;
    private final OfferService offers;

    // ---------------- storefront (public) ----------------

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
        int discount = offers.runningDiscountPercent();
        List<ProductDto> content = result.getContent().stream().map(p -> Mapper.product(p, discount)).toList();
        return new PageResponse<>(content, result.getNumber(), result.getTotalPages(), result.getTotalElements());
    }

    @Transactional(readOnly = true)
    public ProductDto get(Long id) {
        return Mapper.product(find(id), offers.runningDiscountPercent());
    }

    @Transactional(readOnly = true)
    public List<CategoryDto> categories() {
        return categories.findAll(Sort.by("name")).stream().map(Mapper::category).toList();
    }

    // ---------------- seller area ----------------

    @Transactional(readOnly = true)
    public PageResponse<ProductDto> mine(String sellerEmail, int page, int size) {
        User seller = seller(sellerEmail);
        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 48), Sort.by("id").descending());
        Page<Product> result = products.findBySeller(seller, pageable);
        List<ProductDto> content = result.getContent().stream().map(p -> Mapper.product(p, 0)).toList();
        return new PageResponse<>(content, result.getNumber(), result.getTotalPages(), result.getTotalElements());
    }

    @Transactional
    public ProductDto create(String sellerEmail, ProductRequest req) {
        Product p = new Product();
        p.setSeller(seller(sellerEmail));
        apply(p, req);
        return Mapper.product(products.save(p), 0);
    }

    @Transactional
    public ProductDto update(String sellerEmail, Long id, ProductRequest req) {
        Product p = owned(sellerEmail, id);
        apply(p, req);
        return Mapper.product(products.save(p), 0);
    }

    @Transactional
    public void delete(String sellerEmail, Long id) {
        Product p = owned(sellerEmail, id);
        products.delete(p);
        products.flush(); // surface FK violations (product already ordered) here -> handled as 409
    }

    // ---------------- helpers ----------------

    private User seller(String email) {
        return users.findByEmail(email)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "User not found"));
    }

    private Product find(Long id) {
        return products.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Product not found"));
    }

    private Product owned(String sellerEmail, Long id) {
        Product p = find(id);
        if (!p.getSeller().getEmail().equals(sellerEmail)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "You can only manage your own products");
        }
        return p;
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
