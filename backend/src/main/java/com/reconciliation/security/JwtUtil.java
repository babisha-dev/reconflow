package com.reconciliation.security;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import java.security.Key;
import java.util.*;

@Component
public class JwtUtil {
    @Value("${jwt.secret}")     private String secret;
    @Value("${jwt.expiration}") private Long expiration;

    private Key key() { return Keys.hmacShaKeyFor(secret.getBytes()); }

    public String generate(UserDetails u, String role) {
        return Jwts.builder()
            .setClaims(Map.of("role", role))
            .setSubject(u.getUsername())
            .setIssuedAt(new Date())
            .setExpiration(new Date(System.currentTimeMillis() + expiration))
            .signWith(key(), SignatureAlgorithm.HS256)
            .compact();
    }

    public String username(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(key())
                .build()
                .parseClaimsJws(token)
                .getBody()
                .getSubject();
    }

    public boolean valid(String token, UserDetails u) {
        try {
            return username(token).equals(u.getUsername()) &&
                   !Jwts.parserBuilder()
                           .setSigningKey(key())
                           .build()
                           .parseClaimsJws(token)//
                           .getBody()
                           .getExpiration()
                           .before(new Date());
        } catch (Exception e) { return false; }
    }
}
