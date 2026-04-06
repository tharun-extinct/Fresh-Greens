package com.freshgreens.app.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
//import org.hibernate.annotations.UpdateTimestamp;

import java.io.Serializable;
import java.time.LocalDateTime;

@Entity
@Table(name = "users", indexes = {
    @Index(name = "idx_user_firebase_uid", columnList = "firebaseUid", unique = true),
    @Index(name = "idx_user_email", columnList = "email")
})
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class User implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 128)
    private String firebaseUid;

    @Column(length = 100)
    private String displayName;

    @Column(length = 255)
    private String email;

    @Column(length = 20)
    private String phone;

    @Column(length = 512)
    private String photoUrl;

    @Column(nullable = false, length = 20)
    private String provider; // google, github

    @Column(length = 200)
    private String city;

    @Column(length = 10)
    private String pincode;

    private boolean emailVerified;

    private boolean phoneVerified;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    @Builder.Default
    private Role role = Role.BUYER;

    @Builder.Default
    private boolean active = true;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    // @UpdateTimestamp
    // private LocalDateTime updatedAt;

    public enum Role {
        BUYER, SELLER, ADMIN
    }
}
