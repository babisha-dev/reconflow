package com.reconciliation.model;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "records", indexes = {
    @Index(name = "idx_txn_id", columnList = "transactionId"),
    @Index(name = "idx_ref_num", columnList = "referenceNumber"),
    @Index(name = "idx_job_id",  columnList = "uploadJobId")
})
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class TransactionRecord {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String transactionId;

    private BigDecimal amount;
    private String referenceNumber;
    private LocalDate transactionDate;
    private String description;
    private String currency;
    private String accountNumber;
    private Long uploadJobId;
    private Boolean isSystemRecord = false;

    @Column(columnDefinition = "TEXT")
    private String additionalData;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() { createdAt = LocalDateTime.now(); }
}
