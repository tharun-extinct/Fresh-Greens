package com.freshgreens.app.config;


// DataInitializer.java
import com.freshgreens.app.model.Category;
import com.freshgreens.app.model.Product;
import com.freshgreens.app.model.User;
import com.freshgreens.app.repository.CategoryRepository;
import com.freshgreens.app.repository.ProductRepository;
import com.freshgreens.app.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

/**
 * Seeds the database with categories and sample products on first startup.
 * Only runs if categories table is empty (idempotent).
 */
@Component
@Profile("!test")
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    @Override
    public void run(String... args) {
        if (categoryRepository.count() > 0) {
            log.info("Database already seeded — skipping data initialization.");
            return;
        }

        log.info("Seeding database with initial categories and products...");

        // ── Categories ──────────────────────────────────────────
        Category vegetables = saveCategory("Vegetables", "Fresh farm vegetables", "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=300", 1);
        Category fruits     = saveCategory("Fruits",     "Seasonal fresh fruits",  "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=300", 2);
        Category leafy      = saveCategory("Leafy Greens", "Organic leafy vegetables", "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=300", 3);
        Category herbs       = saveCategory("Herbs & Spices", "Fresh herbs and spices", "https://images.unsplash.com/photo-1509358271058-aef76a09cd6d?w=300", 4);
        Category organic     = saveCategory("Organic",    "Certified organic produce",  "https://images.unsplash.com/photo-1542838132-92c53300491e?w=300", 5);
        Category dairy       = saveCategory("Dairy & Eggs", "Farm-fresh dairy products", "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=300", 6);

        log.info("Seeded {} categories.", 6);

        // ── Demo seller ─────────────────────────────────────────
        User seller = userRepository.findByFirebaseUid("SEED_DEMO_SELLER").orElseGet(() -> {
            User u = new User();
            u.setFirebaseUid("SEED_DEMO_SELLER");
            u.setDisplayName("Fresh Greens Demo Store");
            u.setEmail("demo@freshgreens.local");
            u.setProvider("seed");
            u.setCity("Chennai");
            u.setPincode("600001");
            u.setRole(User.Role.SELLER);
            return userRepository.save(u);
        });

        // ── Products ────────────────────────────────────────────
        List<Object[]> productData = List.of(
            // title, description, price, unit, stock, category, imageUrl
            new Object[]{"Organic Tomatoes",      "Vine-ripened organic tomatoes, rich in flavor.", new BigDecimal("45.00"), "kg",    50, vegetables, "https://images.unsplash.com/photo-1546470427-0d4db154ceb8?w=400"},
            new Object[]{"Fresh Spinach Bunch",    "Tender baby spinach, pesticide-free.",           new BigDecimal("30.00"), "bunch", 80, leafy,      "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400"},
            new Object[]{"Alphonso Mangoes",       "Premium Ratnagiri Alphonso mangoes.",            new BigDecimal("350.00"),"dozen", 25, fruits,     "https://images.unsplash.com/photo-1553279768-865429fa0078?w=400"},
            new Object[]{"Farm Fresh Eggs",        "Free-range country eggs, pack of 12.",           new BigDecimal("90.00"), "dozen", 40, dairy,      "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=400"},
            new Object[]{"Green Capsicum",         "Crunchy bell peppers, perfect for salads.",      new BigDecimal("60.00"), "kg",    35, vegetables, "https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=400"},
            new Object[]{"Fresh Coriander",        "Aromatic coriander leaves, freshly harvested.",  new BigDecimal("15.00"), "bunch", 100,herbs,      "https://images.unsplash.com/photo-1509358271058-aef76a09cd6d?w=400"},
            new Object[]{"Organic Carrots",        "Sweet, crunchy organic carrots.",                new BigDecimal("40.00"), "kg",    60, organic,    "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400"},
            new Object[]{"Bananas",                "Naturally ripened bananas, rich in potassium.",   new BigDecimal("50.00"), "dozen", 70, fruits,     "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400"},
            new Object[]{"Red Onions",             "Premium Nashik red onions.",                     new BigDecimal("35.00"), "kg",    90, vegetables, "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400"},
            new Object[]{"Fresh Mint Leaves",      "Cool and refreshing mint, great for chutneys.",  new BigDecimal("10.00"), "bunch", 120,herbs,      "https://images.unsplash.com/photo-1628556270448-4d4e4148e09a?w=400"},
            new Object[]{"Broccoli",               "Farm-fresh broccoli florets.",                   new BigDecimal("80.00"), "piece", 30, organic,    "https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=400"},
            new Object[]{"Sweet Potatoes",         "Naturally sweet, high-fiber root vegetable.",     new BigDecimal("55.00"), "kg",    45, vegetables, "https://images.unsplash.com/photo-1590165482129-1b8b27698780?w=400"}
        );

        int count = 0;
        for (Object[] pd : productData) {
            Product p = new Product();
            p.setTitle((String) pd[0]);
            p.setDescription((String) pd[1]);
            p.setPrice((BigDecimal) pd[2]);
            p.setUnit((String) pd[3]);
            p.setStockQuantity((int) pd[4]);
            p.setCategory((Category) pd[5]);
            p.setImageUrl((String) pd[6]);
            p.setSeller(seller);
            p.setCity("Chennai");
            p.setPincode("600001");
            p.setStatus(Product.Status.ACTIVE);
            productRepository.save(p);
            count++;
        }

        log.info("Seeded {} sample products. Data initialization complete.", count);
    }

    private Category saveCategory(String name, String desc, String imageUrl, int order) {
        Category c = new Category();
        c.setName(name);
        c.setDescription(desc);
        c.setImageUrl(imageUrl);
        c.setDisplayOrder(order);
        c.setActive(true);
        return categoryRepository.save(c);
    }
}
