package com.reconciliation.service;
import com.opencsv.CSVReader;
import com.reconciliation.enums.UploadStatus;
import com.reconciliation.model.*;
import com.reconciliation.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.*;
import java.math.BigDecimal;
import java.security.MessageDigest;
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service @RequiredArgsConstructor @Slf4j
public class FileProcessingService {

    private final UploadJobRepository         jobRepo;
    private final TransactionRecordRepository recordRepo;
    private final ReconciliationEngine        engine;
    private final AuditService                audit;

    // ── Hash computed on main thread before file disappears ─────────────────
    public String hash(MultipartFile file) throws Exception {
        byte[] hash = MessageDigest.getInstance("SHA-256").digest(file.getBytes());
        StringBuilder sb = new StringBuilder();
        for (byte b : hash) sb.append(String.format("%02x", b));
        return sb.toString();
    }

    // ── Read bytes on main thread before passing to async ───────────────────
    public byte[] readBytes(MultipartFile file) throws Exception {
        return file.getBytes();
    }

    // ── Preview — called on main thread, file still exists ──────────────────
    public List<Map<String, String>> preview(MultipartFile file) throws Exception {
        byte[] bytes = file.getBytes();
        return isCsv(bytes) ? previewCsvBytes(bytes) : previewExcelBytes(bytes);
    }

    // ── Async processing — receives bytes, not MultipartFile ────────────────
    @Async
    public void processAsync(Long jobId, byte[] fileBytes, String originalFilename,
                             Map<String, String> mapping,
                             String userId, String username) {
        UploadJob job = jobRepo.findById(jobId).orElseThrow();
        try {
            job.setStatus(UploadStatus.PROCESSING);
            job.setStartedAt(LocalDateTime.now());
            jobRepo.save(job);

            List<Map<String, String>> allRows = isCsv(fileBytes)
                ? parseCsvBytes(fileBytes)
                : parseExcelBytes(fileBytes);

            log.info("Job {} — parsed {} rows", jobId, allRows.size());
            job.setTotalRecords(allRows.size());
            jobRepo.save(job);

            int saved = 0;
            for (Map<String, String> row : allRows) {
                try {
                    TransactionRecord rec = toRecord(row, mapping, jobId);
                    if (rec.getTransactionId() == null || rec.getTransactionId().isBlank()) continue;
                    recordRepo.save(rec);
                    saved++;
                    if (saved % 500 == 0) { job.setProcessedRecords(saved); jobRepo.save(job); }
                } catch (Exception e) {
                    log.warn("Job {} — skipping bad row: {}", jobId, e.getMessage());
                }
            }

            job.setProcessedRecords(saved);
            jobRepo.save(job);
            log.info("Job {} — saved {} records, starting reconciliation", jobId, saved);

            engine.reconcile(jobId);

            job.setStatus(UploadStatus.COMPLETED);
            job.setCompletedAt(LocalDateTime.now());
            jobRepo.save(job);
            audit.log("UPLOAD_JOB", jobId, "COMPLETED", userId, username, null, saved + " records", "SYSTEM");
            log.info("Job {} — COMPLETED", jobId);

        } catch (Exception e) {
            log.error("Job {} failed: {}", jobId, e.getMessage(), e);
            job.setStatus(UploadStatus.FAILED);
            job.setErrorMessage(e.getMessage());
            job.setCompletedAt(LocalDateTime.now());
            jobRepo.save(job);
            audit.log("UPLOAD_JOB", jobId, "FAILED", userId, username, null, e.getMessage(), "SYSTEM");
        }
    }

    // ── Detect CSV from bytes (magic bytes, not filename) ───────────────────
    private boolean isCsv(byte[] bytes) {
        if (bytes.length < 2) return true;
        if (bytes[0] == 0x50 && bytes[1] == 0x4B) return false;          // PK = xlsx
        if ((bytes[0] & 0xFF) == 0xD0 && (bytes[1] & 0xFF) == 0xCF) return false; // OLE = xls
        return true;
    }

    // ── Preview CSV from bytes ───────────────────────────────────────────────
    private List<Map<String, String>> previewCsvBytes(byte[] bytes) throws Exception {
        List<Map<String, String>> rows = new ArrayList<>();
        try (CSVReader reader = new CSVReader(new InputStreamReader(new ByteArrayInputStream(bytes)))) {
            String[] headers = reader.readNext();
            if (headers == null) return rows;
            String[] line; int count = 0;
            while ((line = reader.readNext()) != null && count++ < 20) {
                Map<String, String> row = new LinkedHashMap<>();
                for (int i = 0; i < headers.length; i++)
                    row.put(headers[i].trim(), i < line.length ? line[i].trim() : "");
                rows.add(row);
            }
        }
        return rows;
    }

    // ── Preview Excel from bytes ─────────────────────────────────────────────
    private List<Map<String, String>> previewExcelBytes(byte[] bytes) throws Exception {
        List<Map<String, String>> rows = new ArrayList<>();
        try (Workbook wb = WorkbookFactory.create(new ByteArrayInputStream(bytes))) {
            Sheet sheet = wb.getSheetAt(0);
            Row headerRow = sheet.getRow(0);
            if (headerRow == null) return rows;
            List<String> headers = new ArrayList<>();
            headerRow.forEach(c -> headers.add(c.toString().trim()));
            for (int i = 1; i <= Math.min(20, sheet.getLastRowNum()); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;
                Map<String, String> rowMap = new LinkedHashMap<>();
                for (int j = 0; j < headers.size(); j++) {
                    Cell cell = row.getCell(j);
                    rowMap.put(headers.get(j), cell != null ? cell.toString().trim() : "");
                }
                rows.add(rowMap);
            }
        }
        return rows;
    }

    // ── Parse full CSV from bytes ────────────────────────────────────────────
    private List<Map<String, String>> parseCsvBytes(byte[] bytes) throws Exception {
        List<Map<String, String>> rows = new ArrayList<>();
        try (CSVReader reader = new CSVReader(new InputStreamReader(new ByteArrayInputStream(bytes)))) {
            String[] headers = reader.readNext();
            if (headers == null) return rows;
            String[] line;
            while ((line = reader.readNext()) != null) {
                Map<String, String> row = new LinkedHashMap<>();
                for (int i = 0; i < headers.length; i++)
                    row.put(headers[i].trim(), i < line.length ? line[i].trim() : "");
                rows.add(row);
            }
        }
        return rows;
    }

    // ── Parse full Excel from bytes ──────────────────────────────────────────
    private List<Map<String, String>> parseExcelBytes(byte[] bytes) throws Exception {
        List<Map<String, String>> rows = new ArrayList<>();
        try (Workbook wb = WorkbookFactory.create(new ByteArrayInputStream(bytes))) {
            Sheet sheet = wb.getSheetAt(0);
            Row headerRow = sheet.getRow(0);
            if (headerRow == null) return rows;
            List<String> headers = new ArrayList<>();
            headerRow.forEach(c -> headers.add(c.toString().trim()));
            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;
                Map<String, String> rowMap = new LinkedHashMap<>();
                for (int j = 0; j < headers.size(); j++) {
                    Cell cell = row.getCell(j);
                    rowMap.put(headers.get(j), cell != null ? cell.toString().trim() : "");
                }
                rows.add(rowMap);
            }
        }
        return rows;
    }

    // ── Map row to entity ────────────────────────────────────────────────────
    private TransactionRecord toRecord(Map<String, String> row, Map<String, String> mapping, Long jobId) {
        String txnId  = get(row, mapping, "transactionId",  "Transaction ID");
        String amtStr = get(row, mapping, "amount",          "Amount");
        String ref    = get(row, mapping, "referenceNumber", "Reference Number");
        String date   = get(row, mapping, "date",            "Date");
        String desc   = get(row, mapping, "description",     "Description");

        BigDecimal amount = null;
        if (amtStr != null && !amtStr.isBlank()) {
            try { amount = new BigDecimal(amtStr.replaceAll("[^0-9.]", "")); }
            catch (Exception ignored) {}
        }

        LocalDate txnDate = null;
        if (date != null && !date.isBlank()) {
            for (String fmt : new String[]{"yyyy-MM-dd","MM/dd/yyyy","dd-MM-yyyy","dd/MM/yyyy","M/d/yyyy","d/M/yyyy"}) {
                try { txnDate = LocalDate.parse(date, DateTimeFormatter.ofPattern(fmt)); break; }
                catch (Exception ignored) {}
            }
        }

        return TransactionRecord.builder()
            .transactionId(txnId).amount(amount).referenceNumber(ref)
            .transactionDate(txnDate).description(desc)
            .uploadJobId(jobId).isSystemRecord(false).build();
    }

    private String get(Map<String, String> row, Map<String, String> mapping, String key, String fallback) {
        String col = mapping.get(key);
        if (col != null && row.containsKey(col)) return row.get(col);
        if (row.containsKey(fallback)) return row.get(fallback);
        for (var e : row.entrySet())
            if (e.getKey().equalsIgnoreCase(fallback)) return e.getValue();
        return null;
    }
}