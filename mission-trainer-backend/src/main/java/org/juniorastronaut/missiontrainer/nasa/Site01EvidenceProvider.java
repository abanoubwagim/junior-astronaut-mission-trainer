package org.juniorastronaut.missiontrainer.nasa;

import org.juniorastronaut.missiontrainer.api.MissionDtos.DatasetHash;
import org.juniorastronaut.missiontrainer.api.MissionDtos.EvidenceProvenance;
import org.juniorastronaut.missiontrainer.api.MissionDtos.EvidenceSource;
import org.juniorastronaut.missiontrainer.api.MissionDtos.ProjectedCoordinate;
import org.juniorastronaut.missiontrainer.api.MissionDtos.ScientificEvidence;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Loads the reviewed Site01 evidence snapshot from the application classpath.
 * The provider never contacts NASA and never loads the large source binaries.
 * It validates bundled-file checksums separately from original NASA hashes.
 */
@Component
public final class Site01EvidenceProvider {
    private static final String PACKAGE_ROOT = "nasa-evidence/site01/v1.0.1/";
    private static final String REVIEW_RESOURCE = "nasa-evidence/site01/independent-review/v1/independent-verification.json";
    private static final String EXPECTED_MANIFEST_ID = "moonbase-site01-day1-shadow-v1.0.1";
    private static final String EXPECTED_VERSION = "1.0.1";
    private static final String EXPECTED_CANDIDATE = "ROI5_C1";
    private static final String EXPECTED_FRAME = "MOON_ME_DE421";
    private static final String EXPECTED_EPOCH = "2024-03-28T12:00:00Z";
    private static final double EXPECTED_X = -11152.5;
    private static final double EXPECTED_Y = -12052.5;
    private static final String COMPLETE_LDEC_SHA256 = "16D6ED21020AD48FA71D94E7437492ACF5BF04118F52BCD292F57F22EAD4CD23";
    private static final List<String> EXPECTED_MODELS = List.of("ORIGINAL", "CLONE_001", "CLONE_050", "CLONE_100");
    private static final Set<String> BUNDLED_ARTIFACTS = Set.of(
            "datasets.json", "day1-shadow-replay.json", "evidence.json", "kernels.json",
            "limitations.json", "manifest.json", "manifest.schema.json", "methodology.json",
            "README.md", "reproducibility-report.json", "VERSION_HISTORY.md"
    );

    private final ScientificEvidence dayOneEvidence;

    public Site01EvidenceProvider() {
        this.dayOneEvidence = loadAndValidate();
    }

    public ScientificEvidence dayOneEvidence() {
        return dayOneEvidence;
    }

    private ScientificEvidence loadAndValidate() {
        try {
            verifyBundledArtifactChecksums();
            Map<String, Object> manifest = object(readJson("manifest.json"), "manifest");
            Map<String, Object> evidence = object(readJson("evidence.json"), "evidence");
            Map<String, Object> replay = object(readJson("day1-shadow-replay.json"), "replay fixture");
            Map<String, Object> datasets = object(readJson("datasets.json"), "datasets");
            Map<String, Object> methodology = object(readJson("methodology.json"), "methodology");
            Map<String, Object> limitations = object(readJson("limitations.json"), "limitations");
            Map<String, Object> review = object(readResourceJson(REVIEW_RESOURCE), "independent review");

            validateManifest(manifest);
            validateMethodology(methodology);
            validateReplay(replay, manifest);

            List<Object> records = array(evidence, "records", "evidence.records");
            if (records.size() != 8) throw invalid("expected exactly eight frozen evidence records, found " + records.size());
            Set<String> modelIds = new HashSet<>();
            double minimumMargin = Double.POSITIVE_INFINITY;
            for (Object value : records) {
                Map<String, Object> record = object(value, "evidence record");
                if (!"TEAM_DERIVED".equals(text(record, "evidence_classification", "evidence record classification"))) throw invalid("every Site01 evidence record must remain TEAM_DERIVED");
                modelIds.add(text(record, "dem_model_id", "evidence DEM model"));
                minimumMargin = Math.min(minimumMargin, number(objectField(record, "terrain_obstruction_result", "terrain obstruction result"), "obstruction_margin_deg", "obstruction margin"));
            }
            if (!new HashSet<>(EXPECTED_MODELS).equals(modelIds)) throw invalid("frozen model set is incomplete or unexpected");

            Map<String, Object> primary = findRecord(records, "evidence_record_id", "S01-ROI5C1-20240328T120000Z-ORIGINAL-H1M");
            Map<String, Object> sourceRecord = findRecord(array(manifest, "source_records", "manifest.source_records"), "source_id", "PGDA-SITE01");
            Map<String, Object> primaryDataset = findRecord(array(datasets, "datasets", "datasets.datasets"), "dataset_id", "PGDA_SITE01_SURF");
            validateIndependentReview(review);

            EvidenceSource nasaSource = new EvidenceSource(
                    text(sourceRecord, "organization", "NASA source organization"),
                    text(sourceRecord, "title", "NASA source title"),
                    text(sourceRecord, "url", "NASA source URL"),
                    text(sourceRecord, "data_url", "NASA source data URL")
            );
            EvidenceProvenance provenance = new EvidenceProvenance(
                    text(primary, "methodology_id", "methodology identifier"),
                    stringList(primary, "source_dataset_ids", "source dataset IDs"),
                    stringList(primary, "source_kernel_ids", "source kernel IDs"),
                    originalDatasetHashes(manifest),
                    "VERIFIED_BUNDLED_ARTIFACTS_ONLY"
            );

            return new ScientificEvidence(
                    text(primary, "evidence_record_id", "evidence identifier"),
                    text(manifest, "semantic_version", "manifest version"),
                    text(primary, "evidence_classification", "evidence classification"),
                    nasaSource,
                    "PGDA_SITE01_SURF",
                    text(primaryDataset, "dataset_identifier", "primary dataset identifier"),
                    text(manifest, "reference_site", "research site"),
                    text(objectField(manifest, "candidate", "candidate"), "id", "candidate identifier"),
                    new ProjectedCoordinate(EXPECTED_X, EXPECTED_Y),
                    text(primary, "coordinate_system", "projection description"),
                    text(primary, "reference_frame", "reference frame"),
                    text(primary, "epoch_utc", "reference epoch"),
                    integerList(array(manifest, "heights_analyzed_m", "manifest.heights_analyzed_m")),
                    text(primary, "idealized_horizon_visibility", "idealized horizon result"),
                    text(primary, "local_terrain_horizon_visibility", "local terrain result"),
                    EXPECTED_MODELS,
                    text(review, "decision", "independent verification classification"),
                    text(review, "frameBlockerStatus", "frame review status"),
                    text(review, "day1ScientificDecision", "Day 1 scientific decision"),
                    text(replay, "scientific_interpretation", "scientific explanation"),
                    text(replay, "child_friendly_explanation", "child-friendly explanation"),
                    text(evidence, "source_interpretation", "team analysis summary"),
                    minimumMargin,
                    limitationStatements(limitations),
                    provenance,
                    "UNAVAILABLE"
            );
        } catch (IOException | RuntimeException exception) {
            if (exception instanceof RuntimeException runtimeException) throw runtimeException;
            throw invalid("could not load bundled Site01 evidence: " + exception.getMessage());
        }
    }

    private void validateManifest(Map<String, Object> manifest) {
        if (!EXPECTED_MANIFEST_ID.equals(text(manifest, "manifest_id", "manifest identifier")) || !EXPECTED_VERSION.equals(text(manifest, "semantic_version", "manifest version"))) throw invalid("bundled evidence is not Site01 frozen version 1.0.1");
        Map<String, Object> candidate = objectField(manifest, "candidate", "candidate");
        if (!EXPECTED_CANDIDATE.equals(text(candidate, "id", "candidate identifier"))) throw invalid("bundled evidence candidate is not ROI5_C1");
        Map<String, Object> coordinates = objectField(candidate, "projected_coordinates_m", "candidate coordinates");
        requireNumber(coordinates, "x", EXPECTED_X, "candidate X coordinate");
        requireNumber(coordinates, "y", EXPECTED_Y, "candidate Y coordinate");
        if (!EXPECTED_FRAME.equals(text(candidate, "reference_frame", "candidate reference frame"))) throw invalid("bundled evidence must use MOON_ME_DE421");
        if (!EXPECTED_EPOCH.equals(text(objectField(manifest, "reference_epoch", "reference epoch"), "utc", "reference epoch"))) throw invalid("bundled evidence epoch is not the reviewed Site01 epoch");
        if (!"TEAM_DERIVED".equals(text(manifest, "classification", "manifest classification"))) throw invalid("bundled evidence must remain TEAM_DERIVED");
        if (!"NONE".equals(text(manifest, "application_integration", "application integration status"))) throw invalid("frozen evidence must not claim application integration");
        if (!COMPLETE_LDEC_SHA256.equals(text(objectField(manifest, "input_dataset_hashes", "original dataset hashes"), "PGDA_SITE01_LDEC_COMPLETE", "complete LDEC hash"))) throw invalid("required complete LDEC hash is missing");
    }

    private void validateMethodology(Map<String, Object> methodology) {
        Map<String, Object> coordinates = objectField(methodology, "coordinate_system", "methodology coordinate system");
        Map<String, Object> transform = objectField(coordinates, "pixel_center_transform", "pixel-center transform");
        if (!"-4000 + 2.5 - 5 * row".equals(text(transform, "y", "Y pixel-center transform"))) throw invalid("bundled evidence has an invalid Y pixel-center transform");
        Map<String, Object> firstCenter = objectField(coordinates, "first_pixel_center_m", "first pixel center");
        requireNumber(firstCenter, "x", -18997.5, "first pixel-center X");
        requireNumber(firstCenter, "y", -3997.5, "first pixel-center Y");
        if (!EXPECTED_FRAME.equals(text(coordinates, "reference_frame", "methodology reference frame"))) throw invalid("methodology reference frame is not MOON_ME_DE421");
    }

    private void validateReplay(Map<String, Object> replay, Map<String, Object> manifest) {
        if (!EXPECTED_MANIFEST_ID.equals(text(replay, "manifest_id", "replay manifest identifier")) || !EXPECTED_VERSION.equals(text(replay, "manifest_version", "replay manifest version"))) throw invalid("replay fixture does not reference Site01 frozen version 1.0.1");
        if (!EXPECTED_CANDIDATE.equals(text(replay, "candidate_id", "replay candidate"))) throw invalid("replay fixture candidate is not ROI5_C1");
        Map<String, Object> coordinate = objectField(replay, "coordinate", "replay coordinate");
        requireNumber(coordinate, "projected_x_m", EXPECTED_X, "replay X coordinate");
        requireNumber(coordinate, "projected_y_m", EXPECTED_Y, "replay Y coordinate");
        if (!EXPECTED_FRAME.equals(text(coordinate, "reference_frame", "replay reference frame"))) throw invalid("replay fixture reference frame is not MOON_ME_DE421");
        if (!stringList(manifest, "dem_models_analyzed", "manifest DEM models").equals(stringList(replay, "tested_dem_identifiers", "replay DEM models"))) throw invalid("replay DEM model identifiers do not match the manifest");
        Map<String, Object> outcomes = objectField(replay, "expected_outcomes", "replay expected outcomes");
        if (!"ILLUMINATED".equals(text(outcomes, "idealized_horizon_visibility", "idealized replay outcome")) || !"OBSTRUCTED".equals(text(outcomes, "local_terrain_horizon_visibility", "local replay outcome"))) throw invalid("replay fixture does not preserve the horizon distinction");
    }

    private void validateIndependentReview(Map<String, Object> review) {
        if (!"CONFIRMED_WITH_LIMITATIONS".equals(text(review, "decision", "independent verification classification")) || !"TEAM_DERIVED".equals(text(review, "classification", "independent review classification")) || !"CLOSED_WITH_LIMITATIONS".equals(text(review, "frameBlockerStatus", "frame review status")) || !"READY_WITH_LIMITATIONS".equals(text(review, "day1ScientificDecision", "Day 1 scientific decision"))) throw invalid("supplementary independent review does not contain the reviewed limited status");
    }

    private void verifyBundledArtifactChecksums() throws IOException {
        Map<String, String> expected = new HashMap<>();
        for (String line : readText("SHA256SUMS.txt").split("\\R")) {
            if (line.isBlank()) continue;
            String[] parts = line.split("  ", 2);
            if (parts.length != 2 || !parts[0].matches("[0-9A-Fa-f]{64}") || !BUNDLED_ARTIFACTS.contains(parts[1])) throw invalid("invalid bundled SHA256SUMS entry: " + line);
            expected.put(parts[1], parts[0].toUpperCase());
        }
        if (!expected.keySet().equals(BUNDLED_ARTIFACTS)) throw invalid("bundled SHA256SUMS does not cover every compact evidence artifact");
        for (Map.Entry<String, String> entry : expected.entrySet()) if (!sha256(readBytes(entry.getKey())).equals(entry.getValue())) throw invalid("bundled evidence checksum mismatch for " + entry.getKey());
    }

    private List<DatasetHash> originalDatasetHashes(Map<String, Object> manifest) {
        List<DatasetHash> result = new ArrayList<>();
        Map<String, Object> hashes = objectField(manifest, "input_dataset_hashes", "original dataset hashes");
        for (String datasetId : stringList(manifest, "input_dataset_ids", "manifest input dataset IDs")) result.add(new DatasetHash(datasetId, text(hashes, datasetId, "original dataset hash for " + datasetId)));
        return List.copyOf(result);
    }

    private List<String> limitationStatements(Map<String, Object> limitations) {
        List<String> result = new ArrayList<>();
        for (Object value : array(limitations, "limitations", "limitations.limitations")) result.add(text(object(value, "limitation"), "statement", "limitation statement"));
        return List.copyOf(result);
    }

    private Object readJson(String filename) throws IOException { return readResourceJson(PACKAGE_ROOT + filename); }

    private Object readResourceJson(String resourceName) throws IOException {
        try (InputStream input = new ClassPathResource(resourceName).getInputStream()) {
            return SimpleJsonParser.parse(new String(input.readAllBytes(), StandardCharsets.UTF_8));
        }
    }

    private byte[] readBytes(String filename) throws IOException {
        try (InputStream input = new ClassPathResource(PACKAGE_ROOT + filename).getInputStream()) {
            return input.readAllBytes();
        }
    }

    private String readText(String filename) throws IOException { return new String(readBytes(filename), StandardCharsets.UTF_8); }

    private static Map<String, Object> findRecord(List<Object> values, String key, String expected) {
        for (Object value : values) {
            Map<String, Object> record = object(value, "record");
            if (expected.equals(text(record, key, key))) return record;
        }
        throw invalid("missing record " + key + "=" + expected);
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> object(Object value, String label) {
        if (!(value instanceof Map<?, ?>)) throw invalid(label + " is not a JSON object");
        return (Map<String, Object>) value;
    }

    private static Map<String, Object> objectField(Map<String, Object> parent, String field, String label) { return object(field(parent, field, label), label); }

    @SuppressWarnings("unchecked")
    private static List<Object> array(Map<String, Object> parent, String field, String label) {
        Object value = field(parent, field, label);
        if (!(value instanceof List<?>)) throw invalid(label + " is not a JSON array");
        return (List<Object>) value;
    }

    private static Object field(Map<String, Object> parent, String field, String label) {
        if (!parent.containsKey(field) || parent.get(field) == null) throw invalid(label + " is missing");
        return parent.get(field);
    }

    private static String text(Map<String, Object> parent, String field, String label) {
        Object value = field(parent, field, label);
        if (!(value instanceof String string) || string.isBlank()) throw invalid(label + " is not text");
        return string;
    }

    private static double number(Map<String, Object> parent, String field, String label) {
        Object value = field(parent, field, label);
        if (!(value instanceof Number number)) throw invalid(label + " is not numeric");
        return number.doubleValue();
    }

    private static void requireNumber(Map<String, Object> parent, String field, double expected, String label) {
        if (Double.compare(number(parent, field, label), expected) != 0) throw invalid(label + " expected " + expected);
    }

    private static List<String> stringList(Map<String, Object> parent, String field, String label) {
        List<String> result = new ArrayList<>();
        for (Object value : array(parent, field, label)) {
            if (!(value instanceof String string) || string.isBlank()) throw invalid(label + " contains an invalid value");
            result.add(string);
        }
        return List.copyOf(result);
    }

    private static List<Integer> integerList(List<Object> values) {
        List<Integer> result = new ArrayList<>();
        for (Object value : values) {
            if (!(value instanceof Number number) || number.doubleValue() != number.intValue()) throw invalid("height list contains a non-integer value");
            result.add(number.intValue());
        }
        return List.copyOf(result);
    }

    private static String sha256(byte[] bytes) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(bytes);
            StringBuilder result = new StringBuilder(digest.length * 2);
            for (byte value : digest) result.append(String.format("%02X", value));
            return result.toString();
        } catch (NoSuchAlgorithmException exception) {
            throw invalid("SHA-256 is unavailable in this Java runtime");
        }
    }

    private static IllegalStateException invalid(String message) { return new IllegalStateException("Invalid bundled Site01 evidence: " + message); }
}
