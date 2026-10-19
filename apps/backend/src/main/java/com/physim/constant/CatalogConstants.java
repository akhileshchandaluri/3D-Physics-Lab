package com.physim.constant;

import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

public final class CatalogConstants {

    private CatalogConstants() {
    }

    public static final String OHMS_LAW = "ohms-law";
    public static final String LATTICE_CONSTANT = "lattice-constant";
    public static final String LYCOPODIUM_LASER = "lycopodium-laser";
    public static final String YOUNGS_MODULUS = "youngs-modulus";
    public static final String CREEP_CONSTANT = "creep-constant";
    public static final String HALL_EFFECT = "hall-effect";
    public static final String PLANCKS_CONSTANT = "plancks-constant";
    public static final String SOLAR_CELL = "solar-cell";
    public static final String LASER_GRATING = "laser-grating";

    public static final List<String> CANONICAL_EXPERIMENT_IDS = Collections.unmodifiableList(Arrays.asList(
        OHMS_LAW,
        LATTICE_CONSTANT,
        LYCOPODIUM_LASER,
        YOUNGS_MODULUS,
        CREEP_CONSTANT,
        HALL_EFFECT,
        PLANCKS_CONSTANT,
        SOLAR_CELL,
        LASER_GRATING
    ));

    public static final int MAX_STATE_DATA_BYTES = 65536; // 64 KB limit

    public static boolean isValidExperimentId(String experimentId) {
        return experimentId != null && CANONICAL_EXPERIMENT_IDS.contains(experimentId);
    }

    public static boolean isWithinStateDataLimit(String stateData) {
        if (stateData == null) return false;
        return stateData.getBytes(StandardCharsets.UTF_8).length <= MAX_STATE_DATA_BYTES;
    }
}
