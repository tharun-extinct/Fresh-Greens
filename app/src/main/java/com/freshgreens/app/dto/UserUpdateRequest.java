package com.freshgreens.app.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class UserUpdateRequest {

    @Size(max = 25, message = "Display name must be under 25 characters")
    private String displayName;

    @Email(message = "Invalid email format")
    private String email;

    @Size(max = 20, message = "Phone number must be under 20 characters")
    private String phone;

    @Size(max = 200)
    private String city;

    @Size(max = 10)
    private String pincode;
}
