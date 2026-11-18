package com.shopsphere.config;

import com.shopsphere.entity.*;
import com.shopsphere.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

/**
 * Inserts demo accounts, two demo sellers, a starter catalogue and a festive sale on first start
 * (only when the tables are empty). Prices are in Indian rupees.
 */
@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final UserRepository users;
    private final CategoryRepository categories;
    private final ProductRepository products;
    private final OfferRepository offers;
    private final PasswordEncoder encoder;

    @Value("${app.seed.admin-email}") private String adminEmail;
    @Value("${app.seed.admin-password}") private String adminPassword;
    @Value("${app.seed.demo-email}") private String demoEmail;
    @Value("${app.seed.demo-password}") private String demoPassword;

    @Override
    public void run(String... args) {
        if (!users.existsByEmail(adminEmail)) {
            saveUser("Store Admin", adminEmail, adminPassword, Role.ADMIN, null, null);
        }
        if (!users.existsByEmail(demoEmail)) {
            saveUser("Demo Shopper", demoEmail, demoPassword, Role.CUSTOMER, null, null);
        }
        if (products.count() == 0) {
            User techSeller = users.findByEmail("tech@shopsphere.com").orElseGet(() ->
                    saveUser("Gadget Seller", "tech@shopsphere.com", "Seller@123", Role.SELLER, "Kolkata Gadget Hub", "700001"));
            User styleSeller = users.findByEmail("style@shopsphere.com").orElseGet(() ->
                    saveUser("Style Seller", "style@shopsphere.com", "Seller@123", Role.SELLER, "Mumbai Style Co", "400001"));
            seedCatalogue(techSeller, styleSeller);
        }
        if (offers.count() == 0) {
            Offer sale = new Offer();
            sale.setTitle("Festive Season Sale");
            sale.setDiscountPercent(20);
            sale.setStartsAt(Instant.now().minus(1, ChronoUnit.HOURS));
            sale.setEndsAt(Instant.now().plus(5, ChronoUnit.DAYS));
            offers.save(sale);
        }
    }

    private User saveUser(String name, String email, String rawPassword, Role role, String storeName, String pincode) {
        User u = new User();
        u.setName(name);
        u.setEmail(email.toLowerCase());
        u.setPassword(encoder.encode(rawPassword));
        u.setRole(role);
        u.setStoreName(storeName);
        u.setWarehousePincode(pincode);
        return users.save(u);
    }

    private void seedCatalogue(User tech, User style) {
        Category electronics = category("Electronics", "electronics");
        Category footwear = category("Footwear", "footwear");
        Category fashion = category("Fashion", "fashion");
        Category accessories = category("Accessories", "accessories");

        // ---- sold by Kolkata Gadget Hub ----
        product(tech, "Studio Wireless Headphones", "Over-ear Bluetooth headphones with active noise cancelling and 30-hour battery life.",
                "4999.00", 40, 4.7, "photo-1505740420928-5e560c06d30e", electronics);
        product(tech, "Pro Mirrorless Camera", "24MP mirrorless body with fast autofocus, 4K video and a compact magnesium frame.",
                "64999.00", 12, 4.8, "photo-1526170375885-4d8ecf77b99f", electronics);
        product(tech, "Ultrabook 14\" Laptop", "Thin and light 14-inch laptop with a sharp display, 16GB RAM and all-day battery.",
                "84999.00", 15, 4.6, "photo-1496181133206-80ce9b88a853", electronics);
        product(tech, "Smartwatch Series X", "Fitness tracking, heart-rate monitoring, GPS and week-long battery in a slim case.",
                "12999.00", 30, 4.4, "photo-1546868871-7041f2a55e12", electronics);
        product(tech, "Mechanical Keyboard", "Hot-swappable mechanical keyboard with tactile switches and white backlight.",
                "3499.00", 50, 4.5, "photo-1587829741301-dc798b83add3", electronics);
        product(tech, "Smartphone 128GB", "6.1-inch OLED smartphone with a dual camera and two-day battery.",
                "24999.00", 25, 4.3, "photo-1511707171634-5f897ff02aa9", electronics);

        // ---- sold by Mumbai Style Co ----
        product(style, "Velocity Running Shoes", "Lightweight cushioned running shoes with a breathable knit upper.",
                "3999.00", 60, 4.6, "photo-1542291026-7eec264c27ff", footwear);
        product(style, "Court Classic Sneakers", "Everyday leather sneakers with a cushioned insole and durable rubber sole.",
                "2999.00", 45, 4.2, "photo-1595950653106-6c9ebd614d3a", footwear);
        product(style, "Everyday Cotton Hoodie", "Heavyweight brushed-cotton hoodie with a roomy fit and kangaroo pocket.",
                "1799.00", 80, 4.5, "photo-1556821840-3a63f95609a7", fashion);
        product(style, "Aviator Sunglasses", "Polarised aviator sunglasses with UV400 lenses and a lightweight metal frame.",
                "1299.00", 70, 4.1, "photo-1572635196237-14b3f281503f", fashion);
        product(style, "Classic Analog Watch", "Stainless-steel analog watch with a sapphire-coated glass and leather strap.",
                "5999.00", 35, 4.7, "photo-1523275335684-37898b6baf30", accessories);
        product(style, "Urban Backpack", "Water-resistant 22L backpack with a padded laptop sleeve and hidden pocket.",
                "1999.00", 55, 4.6, "photo-1553062407-98eeb64c6a62", accessories);
    }

    private Category category(String name, String slug) {
        Category c = new Category();
        c.setName(name);
        c.setSlug(slug);
        return categories.save(c);
    }

    private void product(User seller, String name, String description, String price, int stock, double rating,
                         String unsplashPhotoId, Category category) {
        Product p = new Product();
        p.setSeller(seller);
        p.setName(name);
        p.setDescription(description);
        p.setPrice(new BigDecimal(price));
        p.setStock(stock);
        p.setRating(rating);
        p.setImageUrl("https://images.unsplash.com/" + unsplashPhotoId + "?auto=format&fit=crop&w=900&q=80");
        p.setCategory(category);
        products.save(p);
    }
}
