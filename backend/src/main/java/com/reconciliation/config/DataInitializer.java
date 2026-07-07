package com.reconciliation.config;
import com.reconciliation.enums.Role;
import com.reconciliation.model.User;
import com.reconciliation.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component @RequiredArgsConstructor @Slf4j
public class DataInitializer implements CommandLineRunner {
    private final UserRepository repo;
    private final PasswordEncoder encoder;

    @Override
    public void run(String... args) {
        seed("admin",    "admin@recon.com",    "admin123",    Role.ADMIN,   "System Admin");
        seed("analyst1", "analyst@recon.com",  "analyst123",  Role.ANALYST, "John Analyst");
        seed("viewer1",  "viewer@recon.com",   "viewer123",   Role.VIEWER,  "Jane Viewer");
        log.info("Default users ready");
        System.out.println(
                "Password matches = " +
                        encoder.matches(
                                "admin123",
                                repo.findByUsername("admin").get().getPassword()
                        )
        );
    }

    private void seed(String username, String email, String pass, Role role, String name) {
        if (!repo.existsByUsername(username)) {
            repo.save(User.builder()
                .username(username).email(email)
                .password(encoder.encode(pass))
                .role(role).fullName(name).active(true).build());
        }
    }
}
