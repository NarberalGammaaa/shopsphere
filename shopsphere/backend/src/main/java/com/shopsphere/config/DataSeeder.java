package com.shopsphere.config;

import com.shopsphere.entity.Category;
import com.shopsphere.entity.Product;
import com.shopsphere.entity.Role;
import com.shopsphere.entity.User;
import com.shopsphere.repository.CategoryRepository;
import com.shopsphere.repository.ProductRepository;
import com.shopsphere.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

/** Inserts demo accounts and a starter catalogue on first start (only when tables are empty). */
@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final UserRepository users;
    private final CategoryRepository categories;
    private final ProductRepository products;
    private final PasswordEncoder encoder;

    @Value("${app.seed.admin-email}") private String adminEmail;
    @Value("${app.seed.admin-password}") private String adminPassword;
    @Value("${app.seed.demo-email}") private String demoEmail;
    @Value("${app.seed.demo-password}") private String demoPassword;

    @Override
    public void run(String... args) {
        if (!users.existsByEmail(adminEmail)) {
            saveUser("Store Admin", adminEmail, adminPassword, Role.ADMIN);
        }
        if (!users.existsByEmail(demoEmail)) {
            saveUser("Demo Shopper", demoEmail, demoPassword, Role.USER);
        }
        if (products.count() == 0) {
            seedCatalogue();
        }
    }

    private void saveUser(String name, String email, String rawPassword, Role role) {
        User u = new User();
        u.setName(name);
        u.setEmail(email.toLowerCase());
        u.setPassword(encoder.encode(rawPassword));
        u.setRole(role);
        users.save(u);
    }

    private void seedCatalogue() {
        Category electronics = category("Electronics", "electronics");
        Category footwear = category("Footwear", "footwear");
        Category fashion = category("Fashion", "fashion");
        Category accessories = category("Accessories", "accessories");

        product("Studio Wireless Headphones", "Over-ear Bluetooth headphones with active noise cancelling and 30-hour battery life.",
                "129.99", 40, 4.7, "photo-1505740420928-5e560c06d30e", electronics);
        product("Pro Mirrorless Camera", "24MP mirrorless body with fast autofocus, 4K video and a compact magnesium frame.",
                "899.00", 12, 4.8, "photo-1526170375885-4d8ecf77b99f", electronics);
        product("Ultrabook 14\" Laptop", "Thin and light 14-inch laptop with a sharp display, 16GB RAM and all-day battery.",
                "1199.00", 15, 4.6, "photo-1496181133206-80ce9b88a853", electronics);
        product("Smartwatch Series X", "Fitness tracking, heart-rate monitoring, GPS and week-long battery in a slim case.",
                "249.00", 30, 4.4, "photo-1546868871-7041f2a55e12", electronics);
        product("Mechanical Keyboard", "Hot-swappable mechanical keyboard with tactile switches and white backlight.",
                "89.00", 50, 4.5, "photo-1587829741301-dc798b83add3", electronics);
        product("Smartphone 128GB", "6.1-inch OLED smartphone with a dual camera and two-day battery.",
                "699.00", 25, 4.3, "photo-1511707171634-5f897ff02aa9", electronics);

        product("Velocity Running Shoes", "Lightweight cushioned running shoes with a breathable knit upper.",
                "119.00", 60, 4.6, "photo-1542291026-7eec264c27ff", footwear);
        product("Court Classic Sneakers", "Everyday leather sneakers with a cushioned insole and durable rubber sole.",
                "95.00", 45, 4.2, "photo-1595950653106-6c9ebd614d3a", footwear);

        product("Everyday Cotton Hoodie", "Heavyweight brushed-cotton hoodie with a roomy fit and kangaroo pocket.",
                "59.00", 80, 4.5, "photo-1556821840-3a63f95609a7", fashion);
        product("Aviator Sunglasses", "Polarised aviator sunglasses with UV400 lenses and a lightweight metal frame.",
                "79.00", 70, 4.1, "photo-1572635196237-14b3f281503f", fashion);

        product("Classic Analog Watch", "Stainless-steel analog watch with a sapphire-coated glass and leather strap.",
                "159.00", 35, 4.7, "photo-1523275335684-37898b6baf30", accessories);
        product("Urban Backpack", "Water-resistant 22L backpack with a padded laptop sleeve and hidden pocket.",
                "69.00", 55, 4.6, "photo-1553062407-98eeb64c6a62", accessories);
    }

    private Category category(String name, String slug) {
        Category c = new Category();
        c.setName(name);
        c.setSlug(slug);
        return categories.save(c);
    }

    private void product(String name, String description, String price, int stock, double rating,
                         String unsplashPhotoId, Category category) {
        Product p = new Product();
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
