package com.reconciliation.model;
import com.reconciliation.enums.UploadStatus;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity @Table(name = "upload_jobs")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class UploadJob {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String fileName;
    private String fileHash;
    private Long uploadedBy;
    private String uploadedByUsername;
    private Integer totalRecords;
    private Integer processedRecords;

    @Enumerated(EnumType.STRING)
    private UploadStatus status;

    private String errorMessage;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() { createdAt = LocalDateTime.now(); }
}
