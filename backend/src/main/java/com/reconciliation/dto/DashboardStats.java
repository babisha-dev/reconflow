package com.reconciliation.dto;
import lombok.*;
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class DashboardStats {
    private long totalRecords;
    private long matchedRecords;
    private long partiallyMatchedRecords;
    private long unmatchedRecords;
    private long duplicateRecords;
    private double reconciliationAccuracy;
    private long totalJobs;
}
