package com.learntrack.consent.web;

import com.fasterxml.jackson.databind.JsonNode;
import com.learntrack.common.tenant.TenantContext;
import com.learntrack.consent.domain.Consent;
import com.learntrack.consent.service.ConsentService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/v1/consents")
public class ConsentController {

    private final ConsentService service;

    public ConsentController(ConsentService service) {
        this.service = service;
    }

    @GetMapping("/disclosures")
    public JsonNode disclosures(@RequestParam(required = false) String jurisdiction) {
        return service.disclosures(jurisdiction);
    }

    @GetMapping("/{employeeId}")
    public List<Consent> forEmployee(@PathVariable String employeeId) {
        return service.listForEmployee(tenantId(), employeeId);
    }

    @PostMapping
    public Consent upsert(@RequestBody ConsentDtos.UpsertRequest req) {
        if (req.employeeId() == null || req.purpose() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "employeeId and purpose are required");
        }
        return service.apply(tenantId(), actorId(), req.employeeId(), req.purpose(), req.action(), req.jurisdiction());
    }

    @DeleteMapping("/{employeeId}/purpose/{purpose}")
    public Consent withdraw(@PathVariable String employeeId, @PathVariable String purpose) {
        return service.withdraw(tenantId(), actorId(), employeeId, purpose);
    }

    private String tenantId() {
        String t = TenantContext.tenantId();
        if (t == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "No tenant context");
        }
        return t;
    }

    private String actorId() {
        return TenantContext.userId();
    }
}
