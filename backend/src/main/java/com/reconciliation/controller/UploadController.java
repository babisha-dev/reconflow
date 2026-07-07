package com.reconciliation.controller;
import com.reconciliation.dto.*;
import com.reconciliation.enums.UploadStatus;
import com.reconciliation.model.UploadJob;
import com.reconciliation.repository.UploadJobRepository;
import com.reconciliation.service.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.time.LocalDateTime;
import java.util.*;

@RestController @RequestMapping("/api/upload")
@RequiredArgsConstructor @Tag(name = "2 - File Upload")
@SecurityRequirement(name = "bearerAuth")
public class UploadController {
    private final FileProcessingService  svc;
    private final UploadJobRepository    jobRepo;
    private final AuditService           audit;

    /** Preview first 20 rows before mapping columns */
    @PostMapping("/preview")
    @Operation(summary = "Preview first 20 rows of the file")
    public ResponseEntity<ApiResponse<List<Map<String,String>>>> preview(
            @RequestParam("file") MultipartFile file) {
        try {
            return ResponseEntity.ok(ApiResponse.ok(svc.preview(file)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Preview failed: " + e.getMessage()));
        }
    }

    /** Submit file for async processing — returns immediately with a job ID */
    @PostMapping("/submit")
    @Operation(summary = "Submit file for async background processing")
    public ResponseEntity<ApiResponse<UploadJob>> submit(
            @RequestParam("file") MultipartFile file,
            @RequestParam Map<String,String> params,
            Authentication auth) {
        try {
            // Idempotency: same file → return existing result
            String hash = svc.hash(file);
            var existing = jobRepo.findByFileHash(hash);
            if (existing.isPresent() && existing.get().getStatus() == UploadStatus.COMPLETED) {
                return ResponseEntity.ok(ApiResponse.ok("File already processed", existing.get()));
            }

            // Extract column mapping from form params (prefix: mapping_)
            Map<String,String> mapping = new HashMap<>();
            params.forEach((k,v) -> { if (k.startsWith("mapping_")) mapping.put(k.substring(8), v); });

            var job = UploadJob.builder()
                .fileName(file.getOriginalFilename())
                .fileHash(hash)
                .uploadedByUsername(auth.getName())
                .uploadedBy(0L)
                .status(UploadStatus.PROCESSING)
                .startedAt(LocalDateTime.now())
                .build();
            jobRepo.save(job);

            audit.log("UPLOAD_JOB", job.getId(), "UPLOAD_INITIATED",
                auth.getName(), auth.getName(), null, file.getOriginalFilename(), "USER");

            // Kick off background processing — returns immediately
byte[] fileBytes = svc.readBytes(file);
svc.processAsync(job.getId(), fileBytes, file.getOriginalFilename(), mapping, auth.getName(), auth.getName());
return ResponseEntity.ok(ApiResponse.ok("Processing started", job));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Upload failed: " + e.getMessage()));
        }
    }

    @GetMapping("/jobs")
    @Operation(summary = "List all upload jobs")
    public ResponseEntity<ApiResponse<List<UploadJob>>> jobs() {
        return ResponseEntity.ok(ApiResponse.ok(jobRepo.findAllByOrderByCreatedAtDesc()));
    }

    @GetMapping("/jobs/{id}")
    @Operation(summary = "Get status of a specific upload job")
    public ResponseEntity<ApiResponse<UploadJob>> job(@PathVariable Long id) {
        return jobRepo.findById(id)
            .map(j -> ResponseEntity.ok(ApiResponse.ok(j)))
            .orElse(ResponseEntity.notFound().build());
    }
}
