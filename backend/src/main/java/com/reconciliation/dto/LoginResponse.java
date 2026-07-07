package com.reconciliation.dto;
import lombok.*;
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class LoginResponse {
    private String token;
    private String username;
    private String role;
    private String fullName;
}
