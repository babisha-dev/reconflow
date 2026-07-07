package com.reconciliation.controller;
import com.reconciliation.dto.*;
import com.reconciliation.enums.MatchStatus;
import com.reconciliation.model.ReconciliationResult;
import com.reconciliation.repository.*;
import com.reconciliation.service.AuditService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.List;

@RestController @RequestMapping("/api/reconciliation")
@RequiredArgsConstructor @Tag(name = "3 - Reconciliation")
@SecurityRequirement(name = "bearerAuth")
public class ReconciliationController {
    private final ReconciliationResultRepository resultRepo;
    private final UploadJobRepository            jobRepo;
    private final AuditService                   audit;

    @GetMapping("/dashboard")
    @Operation(summary = "Dashboard summary statistics")
    public ResponseEntity<ApiResponse<DashboardStats>> dashboard() {
        long total     = resultRepo.count();
        long matched   = resultRepo.countByMatchStatus(MatchStatus.MATCHED);
        long partial   = resultRepo.countByMatchStatus(MatchStatus.PARTIALLY_MATCHED);
        long unmatched = resultRepo.countByMatchStatus(MatchStatus.NOT_MATCHED);
        long duplicate = resultRepo.countByMatchStatus(MatchStatus.DUPLICATE);
        double accuracy = total > 0 ? Math.round(((double)(matched + partial) / total) * 10000.0) / 100.0 : 0;
        return ResponseEntity.ok(ApiResponse.ok(DashboardStats.builder()
            .totalRecords(total).matchedRecords(matched).partiallyMatchedRecords(partial)
            .unmatchedRecords(unmatched).duplicateRecords(duplicate)
            .reconciliationAccuracy(accuracy).totalJobs(jobRepo.count())
            .build()));
    }

    @GetMapping("/results/{jobId}")
    @Operation(summary = "Results for a specific upload job")
    public ResponseEntity<ApiResponse<List<ReconciliationResult>>> resultsByJob(@PathVariable Long jobId) {
        return ResponseEntity.ok(ApiResponse.ok(resultRepo.findByUploadJobId(jobId)));
    }

    @GetMapping("/results")
    @Operation(summary = "All results, optionally filtered by status")
    public ResponseEntity<ApiResponse<List<ReconciliationResult>>> allResults(
            @RequestParam(required = false) String status) {
        var data = (status != null)
            ? resultRepo.findByMatchStatus(MatchStatus.valueOf(status.toUpperCase()))
            : resultRepo.findAll();
        return ResponseEntity.ok(ApiResponse.ok(data));
    }

    @PutMapping("/correct/{id}")
    @Operation(summary = "Manually correct / annotate a reconciliation record")
    public ResponseEntity<ApiResponse<ReconciliationResult>> correct(
            @PathVariable Long id,
            @RequestBody ManualCorrectionRequest req,
            Authentication auth) {
        return resultRepo.findById(id).map(r -> {
            String old = r.getMatchStatus().name();
            r.setManuallyResolvedBy(auth.getName());
            r.setManualNote(req.getNote());
            r.setResolvedAt(LocalDateTime.now());
            resultRepo.save(r);
            audit.log("RECONCILIATION_RESULT", id, "MANUAL_CORRECTION",
                auth.getName(), auth.getName(), old, "Note: " + req.getNote(), "USER");
            return ResponseEntity.ok(ApiResponse.ok("Corrected", r));
        }).orElse(ResponseEntity.notFound().build());
    }
}
