package com.freshgreens.app.config;

import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
@SecurityScheme(
        name = "sessionCookie",
        type = SecuritySchemeType.APIKEY,
        in = io.swagger.v3.oas.annotations.enums.SecuritySchemeIn.COOKIE,
        paramName = "JSESSIONID",
        description = "Session-based authentication cookie. Obtain by calling /api/auth/login first."
)
public class OpenApiConfig {

    @Bean
    public OpenAPI freshGreensOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Fresh Greens API")
                        .description("REST APIs for Fresh Greens e-market platform. Includes authentication, products, cart, orders, and profile management.")
                        .version("v1")
                        .contact(new Contact().name("Fresh Greens Team"))
                        .license(new License().name("Proprietary")))
                .servers(List.of(
                        new Server().url("http://localhost:8080").description("Local"),
                        new Server().url("/").description("Relative")
                ));
    }
}
