package com.reconciliation.repository;
import com.reconciliation.model.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    List<AuditLog> findByEntityTypeAndEntityIdOrderByTimestampDesc(String type, Long id);
    List<AuditLog> findAllByOrderByTimestampDesc();
}
