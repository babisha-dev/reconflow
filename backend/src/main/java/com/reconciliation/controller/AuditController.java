package com.reconciliation.controller;
import com.reconciliation.dto.ApiResponse;
import com.reconciliation.model.AuditLog;
import com.reconciliation.service.AuditService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController @RequestMapping("/api/audit")
@RequiredArgsConstructor @Tag(name = "4 - Audit Trail")
@SecurityRequirement(name = "bearerAuth")
public class AuditController {
    private final AuditService svc;

    @GetMapping
    @Operation(summary = "All audit logs (newest first)")
    public ResponseEntity<ApiResponse<List<AuditLog>>> all() {
        return ResponseEntity.ok(ApiResponse.ok(svc.getAll()));
    }

    @GetMapping("/{entityType}/{entityId}")
    @Operation(summary = "Audit logs for a specific record")
    public ResponseEntity<ApiResponse<List<AuditLog>>> forEntity(
            @PathVariable String entityType, @PathVariable Long entityId) {
        return ResponseEntity.ok(ApiResponse.ok(svc.getForEntity(entityType, entityId)));
    }
}
