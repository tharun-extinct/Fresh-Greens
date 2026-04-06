package com.freshgreens.app.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class FrontendRedirectController {

    @Value("${app.frontend.admin-url:http://localhost:5174}")
    private String adminConsoleUrl;

    @GetMapping({"/admin", "/admin/", "/admin.html"})
    public String redirectToAdminConsole() {
        return "redirect:" + adminConsoleUrl;
    }
}
