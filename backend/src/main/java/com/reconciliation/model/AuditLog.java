package com.reconciliation.model;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity @Table(name = "audit_logs")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class AuditLog {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String entityType;
    private Long   entityId;
    private String action;
    private String performedBy;
    private String performedByUsername;

    @Column(columnDefinition = "TEXT") private String oldValue;
    @Column(columnDefinition = "TEXT") private String newValue;

    private String source;
    private String ipAddress;

    @Column(updatable = false, nullable = false)
    private LocalDateTime timestamp;

    @PrePersist
    protected void onCreate() { timestamp = LocalDateTime.now(); }
}
