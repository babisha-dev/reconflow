package com.reconciliation.model;
import com.reconciliation.enums.MatchStatus;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "reconciliation_results", indexes = {
    @Index(name = "idx_recon_txn",  columnList = "transactionId"),
    @Index(name = "idx_recon_job",  columnList = "uploadJobId"),
    @Index(name = "idx_recon_status", columnList = "matchStatus")
})
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ReconciliationResult {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String  transactionId;
    private Long    uploadJobId;
    private Long    uploadedRecordId;
    private Long    systemRecordId;

    @Enumerated(EnumType.STRING)
    private MatchStatus matchStatus;

    private BigDecimal uploadedAmount;
    private BigDecimal systemAmount;
    private BigDecimal amountVariance;

    @Column(columnDefinition = "TEXT")
    private String mismatchedFields;

    private String    manuallyResolvedBy;
    private String    manualNote;
    private LocalDateTime resolvedAt;

    @Column(updatable = false) private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist  protected void onCreate() { createdAt = updatedAt = LocalDateTime.now(); }
    @PreUpdate   protected void onUpdate() { updatedAt = LocalDateTime.now(); }
}
