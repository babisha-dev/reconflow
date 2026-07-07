package com.reconciliation.service;
import com.reconciliation.enums.MatchStatus;
import com.reconciliation.model.*;
import com.reconciliation.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.util.*;

@Service @RequiredArgsConstructor @Slf4j
public class ReconciliationEngine {
    private final TransactionRecordRepository    recordRepo;
    private final ReconciliationResultRepository resultRepo;

    @Value("${reconciliation.amount-variance-percentage:2.0}")
    private double variancePct;

    public void reconcile(Long jobId) {
        List<TransactionRecord> uploaded = recordRepo.findByUploadJobId(jobId);

        // Count transaction IDs to detect duplicates
        Map<String, Long> idCount = new HashMap<>();
        for (TransactionRecord r : uploaded) {
            idCount.merge(r.getTransactionId(), 1L, Long::sum);
        }

        for (TransactionRecord rec : uploaded) {
            try {
                MatchStatus status;
                TransactionRecord sysRec = null;
                String mismatches = null;

                if (idCount.get(rec.getTransactionId()) > 1) {
                    // ① DUPLICATE — same TXN ID appears more than once
                    status = MatchStatus.DUPLICATE;

                } else {
                    var exactOpt = recordRepo.findSystemByTransactionId(rec.getTransactionId());

                    if (exactOpt.isPresent() && amountsEqual(rec.getAmount(), exactOpt.get().getAmount())) {
                        // ② MATCHED — Transaction ID + exact amount
                        status  = MatchStatus.MATCHED;
                        sysRec  = exactOpt.get();

                    } else if (rec.getReferenceNumber() != null) {
                        var byRef = recordRepo.findSystemByReferenceNumber(rec.getReferenceNumber());
                        if (!byRef.isEmpty() && withinVariance(rec.getAmount(), byRef.get(0).getAmount())) {
                            // ③ PARTIALLY_MATCHED — Ref number + amount within ±variance%
                            sysRec    = byRef.get(0);
                            status    = MatchStatus.PARTIALLY_MATCHED;
                            mismatches = mismatchFields(rec, sysRec);
                        } else {
                            status = MatchStatus.NOT_MATCHED;
                        }
                    } else {
                        // ④ NOT_MATCHED
                        status = MatchStatus.NOT_MATCHED;
                    }
                }

                BigDecimal variance = null;
                if (rec.getAmount() != null && sysRec != null && sysRec.getAmount() != null) {
                    variance = rec.getAmount().subtract(sysRec.getAmount()).abs();
                }

                resultRepo.save(ReconciliationResult.builder()
                    .uploadJobId(jobId)
                    .transactionId(rec.getTransactionId())
                    .uploadedRecordId(rec.getId())
                    .systemRecordId(sysRec != null ? sysRec.getId() : null)
                    .matchStatus(status)
                    .uploadedAmount(rec.getAmount())
                    .systemAmount(sysRec != null ? sysRec.getAmount() : null)
                    .amountVariance(variance)
                    .mismatchedFields(mismatches)
                    .build());

            } catch (Exception e) {
                log.warn("Failed to reconcile record {}: {}", rec.getTransactionId(), e.getMessage());
            }
        }
    }

    private boolean amountsEqual(BigDecimal a, BigDecimal b) {
        return a != null && b != null && a.compareTo(b) == 0;
    }

    private boolean withinVariance(BigDecimal uploaded, BigDecimal system) {
        if (uploaded == null || system == null) return false;
        BigDecimal allowed = system.multiply(BigDecimal.valueOf(variancePct / 100.0));
        return uploaded.subtract(system).abs().compareTo(allowed) <= 0;
    }

    private String mismatchFields(TransactionRecord u, TransactionRecord s) {
        List<String> list = new ArrayList<>();
        if (!amountsEqual(u.getAmount(), s.getAmount()))              list.add("amount");
        if (!Objects.equals(u.getTransactionDate(), s.getTransactionDate())) list.add("date");
        if (!Objects.equals(u.getDescription(),     s.getDescription()))     list.add("description");
        return String.join(",", list);
    }
}
