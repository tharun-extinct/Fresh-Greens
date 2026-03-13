package com.freshgreens.app.dto;

import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class AdminUserResponse {

    private Long id;
    private String displayName;
    private String email;
    private String phone;
    private String role;
    private boolean active;
    private boolean phoneVerified;
    private boolean emailVerified;
    private String createdAt;
}
