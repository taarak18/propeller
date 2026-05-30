package com.learntrack.ingestion.web;

import java.util.List;
import java.util.Map;

/**
 * Generic ingest request body: {@code { "records": [ { ... } ] }}.
 * Each record is kept as a free-form map so the original shape is forwarded
 * verbatim in the {@code data.ingested} event payload.
 */
public class IngestRequest {

    private List<Map<String, Object>> records;

    public List<Map<String, Object>> getRecords() { return records; }
    public void setRecords(List<Map<String, Object>> records) { this.records = records; }
}
