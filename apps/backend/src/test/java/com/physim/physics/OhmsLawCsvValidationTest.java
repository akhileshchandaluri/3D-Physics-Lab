package com.physim.physics;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Automates the existing Ohm's Law validation.csv test cases against the canonical
 * physics formulas defined in src/experiments/ohmsLaw/physics.ts.
 */
class OhmsLawCsvValidationTest {

    private static final double ALPHA_COPPER = 0.004;
    private static final double T_ROOM = 25.0;

    record TestCase(
            String name,
            double voltage,
            double resistance,
            double temperature,
            double expectedCurrent,
            double expectedEffectiveResistance,
            double expectedPower,
            String notes
    ) {}

    @Test
    @DisplayName("Validate all Ohm's Law validation.csv test cases")
    void testAllValidationCsvRows() throws Exception {
        File csvFile = new File("src/experiments/ohmsLaw/validation.csv");
        if (!csvFile.exists()) {
            // Also check parent directory if running from different working directory
            csvFile = new File("apps/backend/src/experiments/ohmsLaw/validation.csv");
        }
        assertTrue(csvFile.exists(), "validation.csv must exist at: " + csvFile.getAbsolutePath());

        List<TestCase> testCases = new ArrayList<>();
        try (BufferedReader reader = new BufferedReader(new FileReader(csvFile))) {
            String line;
            while ((line = reader.readLine()) != null) {
                line = line.trim();
                if (line.isEmpty() || line.startsWith("#") || line.startsWith("Test Case")) {
                    continue; // Skip comments and header
                }
                String[] parts = line.split(",");
                if (parts.length >= 7) {
                    testCases.add(new TestCase(
                            parts[0].trim(),
                            Double.parseDouble(parts[1].trim()),
                            Double.parseDouble(parts[2].trim()),
                            Double.parseDouble(parts[3].trim()),
                            Double.parseDouble(parts[4].trim()),
                            Double.parseDouble(parts[5].trim()),
                            Double.parseDouble(parts[6].trim()),
                            parts.length > 7 ? parts[7].trim() : ""
                    ));
                }
            }
        }

        assertFalse(testCases.isEmpty(), "Must have loaded test cases from validation.csv");
        assertEquals(5, testCases.size(), "validation.csv contains exactly 5 test scenarios");

        for (TestCase tc : testCases) {
            double effectiveResistance = tc.resistance * (1.0 + ALPHA_COPPER * (tc.temperature - T_ROOM));
            double current = tc.voltage / effectiveResistance;
            double power = tc.voltage * current;

            assertEquals(tc.expectedEffectiveResistance, effectiveResistance, 1e-3,
                    "Effective resistance mismatch for case: " + tc.name);
            assertEquals(tc.expectedCurrent, current, 1e-3,
                    "Current mismatch for case: " + tc.name);
            assertEquals(tc.expectedPower, power, 1e-3,
                    "Power mismatch for case: " + tc.name);
        }
    }
}
