package com.reconciliation.service;
import com.reconciliation.model.AuditLog;
import com.reconciliation.repository.AuditLogRepository;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service @RequiredArgsConstructor

public class AuditService {
    private final AuditLogRepository repo;

    public void log(String entityType, Long entityId, String action,
                    String performedBy, String username,
                    String oldVal, String newVal, String source) {
        repo.save(AuditLog.builder()
            .entityType(entityType).entityId(entityId).action(action)
            .performedBy(performedBy).performedByUsername(username)
            .oldValue(oldVal).newValue(newVal).source(source)
            .build());
    }

    public List<AuditLog> getAll() { return repo.findAllByOrderByTimestampDesc(); }

    public List<AuditLog> getForEntity(String type, Long id) {
        return repo.findByEntityTypeAndEntityIdOrderByTimestampDesc(type, id);
    }
}
