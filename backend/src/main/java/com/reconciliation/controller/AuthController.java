package com.reconciliation.controller;
import com.reconciliation.dto.*;
import com.reconciliation.model.User;
import com.reconciliation.repository.UserRepository;
import com.reconciliation.security.JwtUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.*;
import org.springframework.security.core.userdetails.*;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api/auth")
@RequiredArgsConstructor @Tag(name = "1 - Authentication")
public class AuthController {
    private final AuthenticationManager authMgr;
    private final UserDetailsService    uds;
    private final JwtUtil               jwtUtil;
    private final UserRepository        userRepo;

    @PostMapping("/login")
    @Operation(summary = "Login — returns JWT token")
    public ResponseEntity<ApiResponse<LoginResponse>> login(@Valid @RequestBody LoginRequest req) {
        try {
            authMgr.authenticate(
                new UsernamePasswordAuthenticationToken(req.getUsername(), req.getPassword()));
            UserDetails ud = uds.loadUserByUsername(req.getUsername());
            User user = userRepo.findByUsername(req.getUsername()).orElseThrow();
            String token = jwtUtil.generate(ud, user.getRole().name());
            return ResponseEntity.ok(ApiResponse.ok(LoginResponse.builder()
                .token(token).username(user.getUsername())
                .role(user.getRole().name()).fullName(user.getFullName()).build()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(401)
                    .body(ApiResponse.error(e.getClass().getName() + " : " + e.getMessage()));
        }
    }
}
