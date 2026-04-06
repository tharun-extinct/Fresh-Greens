package com.freshgreens.app.dto;

import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class AuthResponse {

    private Long userId;
    private String displayName;
    private String email;
    private String photoUrl;
    private String role;
    private boolean newUser;
}
