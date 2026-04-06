package com.freshgreens.app.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class AuthRequest {

    @NotBlank(message = "Firebase ID token is required")
    private String idToken;
}
