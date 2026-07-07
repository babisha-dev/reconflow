package com.reconciliation.repository;
import com.reconciliation.model.ReconciliationResult;
import com.reconciliation.enums.MatchStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface ReconciliationResultRepository extends JpaRepository<ReconciliationResult, Long> {
    List<ReconciliationResult> findByUploadJobId(Long uploadJobId);
    List<ReconciliationResult> findByMatchStatus(MatchStatus status);
    long countByMatchStatus(MatchStatus status);
}
