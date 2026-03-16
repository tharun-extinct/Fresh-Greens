package com.freshgreens.app.controller;

import java.util.List;

import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.freshgreens.app.dto.ApiResponse;
import com.freshgreens.app.model.Category;
import com.freshgreens.app.repository.CategoryRepository;


@RestController
@RequestMapping("/api/categories")
public class CategoryController {

    private final CategoryRepository categoryRepository;

    public CategoryController(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    /**
     * GET /api/categories — Public: List all active categories (cached 30 min)
     */
    
    @GetMapping
    public ResponseEntity<ApiResponse<List<Category>>> getCategories() {
        return ResponseEntity.ok(ApiResponse.success(getCategoriesCached()));
    }

    @Cacheable(value = "categories")
    public List<Category> getCategoriesCached() {
        return categoryRepository.findByActiveTrueOrderByDisplayOrderAsc();
    }
}
