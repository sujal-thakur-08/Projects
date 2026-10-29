package com.example.journalApp.Controller;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class HealthCheckTest {

    @Test
    void healthCheckReturnsOk() {
        HealthCheck healthCheck = new HealthCheck();

        assertEquals("OK", healthCheck.healthCheck());
    }
}