package com.learntrack.intervention.web;

import com.fasterxml.jackson.databind.JsonNode;
import com.learntrack.common.tenant.TenantContext;
import com.learntrack.intervention.domain.Intervention;
import com.learntrack.intervention.domain.InterventionSession;
import com.learntrack.intervention.domain.InterventionStatus;
import com.learntrack.intervention.service.InterventionService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/v1/interventions")
public class InterventionController {

    private final InterventionService service;

    public InterventionController(InterventionService service) {
        this.service = service;
    }

    @GetMapping
    public List<Intervention> list(@RequestParam(required = false) String status) {
        InterventionStatus parsed = parseStatus(status);
        return service.list(tenantId(), parsed);
    }

    @GetMapping("/summary")
    public JsonNode summary() {
        return service.summary(tenantId());
    }

    @GetMapping("/{id}")
    public Intervention get(@PathVariable Long id) {
        return service.get(tenantId(), id);
    }

    @GetMapping("/{id}/sessions")
    public List<InterventionSession> sessions(@PathVariable Long id) {
        return service.sessions(tenantId(), id);
    }

    @PostMapping
    public ResponseEntity<Intervention> create(@RequestBody InterventionDtos.CreateRequest req) {
        if (req.employeeId() == null || req.interventionType() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "employeeId and interventionType are required");
        }
        Intervention iv = service.create(
                tenantId(),
                req.employeeId(),
                req.employeeName(),
                req.riskId(),
                req.interventionType(),
                req.description(),
                req.startDate(),
                req.endDate(),
                req.totalSessions() == null ? 0 : req.totalSessions(),
                req.assignedTrainer());
        return ResponseEntity.status(HttpStatus.CREATED).body(iv);
    }

    @PutMapping("/{id}/approve")
    public Intervention approve(@PathVariable Long id) {
        requireRole("LD_MANAGER", "LD_ADMIN");
        return service.approve(tenantId(), id);
    }

    @PutMapping("/{id}/reject")
    public Intervention reject(@PathVariable Long id) {
        requireRole("LD_MANAGER", "LD_ADMIN");
        return service.reject(tenantId(), id);
    }

    @PostMapping("/{id}/sessions")
    public ResponseEntity<InterventionSession> logSession(@PathVariable Long id,
                                                          @RequestBody InterventionDtos.LogSessionRequest req) {
        InterventionSession session = service.logSession(
                tenantId(),
                id,
                req.sessionDate(),
                req.attended() != null && req.attended(),
                req.notes());
        return ResponseEntity.status(HttpStatus.CREATED).body(session);
    }

    @PutMapping("/{id}/complete")
    public Intervention complete(@PathVariable Long id, @RequestBody InterventionDtos.CompleteRequest req) {
        return service.complete(tenantId(), id, req.preValue(), req.postValue());
    }

    private String tenantId() {
        String t = TenantContext.tenantId();
        if (t == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "No tenant context");
        }
        return t;
    }

    private void requireRole(String... roles) {
        TenantContext.Principal p = TenantContext.get();
        boolean allowed = false;
        if (p != null) {
            for (String role : roles) {
                if (p.hasRole(role)) {
                    allowed = true;
                    break;
                }
            }
        }
        if (!allowed) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Requires one of roles: " + String.join(",", roles));
        }
    }

    private InterventionStatus parseStatus(String status) {
        if (status == null || status.isBlank()) {
            return null;
        }
        try {
            return InterventionStatus.valueOf(status.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown status: " + status);
        }
    }
}
