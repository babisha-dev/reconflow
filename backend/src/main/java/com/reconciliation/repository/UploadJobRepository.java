package com.reconciliation.repository;
import com.reconciliation.model.UploadJob;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;
public interface UploadJobRepository extends JpaRepository<UploadJob, Long> {
    Optional<UploadJob> findByFileHash(String fileHash);
    List<UploadJob> findAllByOrderByCreatedAtDesc();
}
