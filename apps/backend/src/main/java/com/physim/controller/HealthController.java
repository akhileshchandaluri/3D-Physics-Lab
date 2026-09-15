package com.physim.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.lang.management.ManagementFactory;
import java.time.Instant;
import java.util.Map;

@RestController
@Tag(name = "Health", description = "System liveness and diagnostics probe")
public class HealthController {

    private static final Instant START_TIME = Instant.now();

    @GetMapping("/api/health")
    @Operation(summary = "Liveness probe", description = "Returns system operational status and uptime.")
    public ResponseEntity<Map<String, Object>> getHealth() {
        double uptimeSeconds = (double) ManagementFactory.getRuntimeMXBean().getUptime() / 1000.0;

        return ResponseEntity.ok(Map.of(
                "status", "ok",
                "uptime", uptimeSeconds,
                "timestamp", Instant.now().toString(),
                "version", "1.0.0"
        ));
    }
}
