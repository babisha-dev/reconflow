package com.reconciliation.repository;
import com.reconciliation.model.TransactionRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.Optional;

public interface TransactionRecordRepository extends JpaRepository<TransactionRecord, Long> {

    List<TransactionRecord> findByUploadJobId(Long uploadJobId);

    @Query("SELECT r FROM TransactionRecord r WHERE r.isSystemRecord = true AND r.transactionId = ?1")
    Optional<TransactionRecord> findSystemByTransactionId(String transactionId);

    @Query("SELECT r FROM TransactionRecord r WHERE r.isSystemRecord = true AND r.referenceNumber = ?1")
    List<TransactionRecord> findSystemByReferenceNumber(String referenceNumber);
}