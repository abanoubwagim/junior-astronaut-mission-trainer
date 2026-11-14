#!/usr/bin/env python3
"""Validate the frozen Site01 evidence snapshot and deterministic replay fixture.

This validator is deliberately standard-library-only.  It validates snapshot
integrity, references, and replay expectations; it does not call NASA, load
SPICE, or recompute the DEM ray trace.  A successful run therefore proves
snapshot integrity and fixture consistency, not a new astronomical calculation.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
from datetime import datetime
from pathlib import Path
from typing import Any


ALLOWED_CLASSIFICATIONS = {
    "NASA_PUBLISHED",
    "TEAM_DERIVED",
    "GAME_DESIGN",
    "CONTEXT_ONLY",
    "EDUCATIONAL_EXPLANATION",
    "UNAVAILABLE",
    "NOT_APPLICABLE",
}

REQUIRED_PACKAGE_FILES = (
    "manifest.json",
    "manifest.schema.json",
    "evidence.json",
    "day1-shadow-replay.json",
    "datasets.json",
    "kernels.json",
    "methodology.json",
    "limitations.json",
    "README.md",
    "VERSION_HISTORY.md",
)

EXPECTED_INPUT_IDS = {
    "PGDA_SITE01_SURF",
    "PGDA_SITE01_SLP",
    "PGDA_SITE01_LDEC_COMPLETE",
    "PGDA_SITE01_TOTERR",
    "PGDA_SITE01_SLPERR",
    "PGDA_SITE01_ROI_ARCHIVE",
    "PGDA_SITE01_ROI_SHP",
    "PGDA_SITE01_CLONE_001",
    "PGDA_SITE01_CLONE_050",
    "PGDA_SITE01_CLONE_100",
}

EXPECTED_KERNEL_IDS = {
    "NAIF_DE421",
    "NAIF_MOON_PA_DE421_1900_2050",
    "NAIF_MOON_080317_TF",
    "NAIF_NAIF0012_TLS",
    "NAIF_PCK00010_TPC",
}

COMPLETE_LDEC_SHA256 = (
    "16D6ED21020AD48FA71D94E7437492ACF5BF04118F52BCD292F57F22EAD4CD23"
)


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest().upper()


def read_json(path: Path) -> Any:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def write_json(path: Path, value: Any) -> None:
    path.write_text(
        json.dumps(value, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
        newline="\n",
    )


def is_utc_timestamp(value: Any) -> bool:
    if not isinstance(value, str) or not value.endswith("Z"):
        return False
    try:
        parsed = datetime.fromisoformat(value[:-1] + "+00:00")
    except ValueError:
        return False
    return parsed.utcoffset() is not None


def repo_root_for(package: Path) -> Path:
    # .../<repo>/docs/nasa-research/frozen/site01/v1
    return package.resolve().parents[4]


def resolve_path(value: str, package: Path, research_root: Path | None) -> Path:
    candidate = Path(value)
    if candidate.is_absolute():
        return candidate
    if research_root is not None:
        rooted = research_root / candidate
        if rooted.exists():
            return rooted
    return repo_root_for(package) / candidate


def add_error(errors: list[str], message: str) -> None:
    errors.append(message)


def validate_manifest_shape(manifest: dict[str, Any], schema: dict[str, Any], errors: list[str]) -> None:
    if schema.get("type") != "object":
        add_error(errors, "manifest.schema.json must declare an object root")
    for field in schema.get("required", []):
        if field not in manifest:
            add_error(errors, f"manifest missing required field: {field}")
    if not re.fullmatch(r"\d+\.\d+\.\d+", str(manifest.get("semantic_version", ""))):
        add_error(errors, "manifest semantic_version is not semantic version X.Y.Z")
    if not is_utc_timestamp(manifest.get("created_utc")):
        add_error(errors, "manifest created_utc is not an explicit UTC timestamp")
    if manifest.get("classification") not in ALLOWED_CLASSIFICATIONS:
        add_error(errors, "manifest classification is not an allowed classification")
    if manifest.get("review_status") != "PRELIMINARY_RESEARCH_REVIEWED":
        add_error(errors, "manifest review_status must remain PRELIMINARY_RESEARCH_REVIEWED")
    if manifest.get("status") in {"NASA_VERIFIED", "NASA_APPROVED"}:
        add_error(errors, "manifest must not claim NASA verification or approval")

    candidate = manifest.get("candidate")
    if not isinstance(candidate, dict):
        add_error(errors, "manifest candidate must be an object")
    else:
        for field in ("id", "projected_coordinates_m", "coordinate_system", "reference_frame", "ephemeris"):
            if field not in candidate:
                add_error(errors, f"manifest candidate missing field: {field}")
        coords = candidate.get("projected_coordinates_m")
        if not isinstance(coords, dict) or not all(isinstance(coords.get(axis), (int, float)) for axis in ("x", "y")):
            add_error(errors, "manifest candidate projected_coordinates_m must contain numeric x and y")
        if "latitude" in candidate or "longitude" in candidate:
            add_error(errors, "manifest candidate must not relabel projected X/Y as latitude/longitude")

    reference_epoch = manifest.get("reference_epoch")
    if not isinstance(reference_epoch, dict) or not is_utc_timestamp(reference_epoch.get("utc")):
        add_error(errors, "manifest reference_epoch.utc is not an explicit UTC timestamp")
    if not isinstance(reference_epoch, dict) or not isinstance(reference_epoch.get("spice_et_s"), (int, float)):
        add_error(errors, "manifest reference_epoch.spice_et_s is missing or non-numeric")

    if manifest.get("heights_analyzed_m") != [1, 5]:
        add_error(errors, "manifest heights_analyzed_m must be exactly [1, 5]")


def validate_manifest_schema_contract(manifest: dict[str, Any], schema: dict[str, Any], errors: list[str]) -> None:
    """Validate the v1.0.1 manifest schema contract without adding a dependency."""

    if schema.get("additionalProperties") is True:
        return
    allowed_root = set(schema.get("properties", {}))
    unknown_root = sorted(set(manifest) - allowed_root)
    for field in unknown_root:
        add_error(errors, f"SCHEMA_VALIDATION: unknown manifest property: {field}")

    candidate = manifest.get("candidate")
    candidate_schema = schema.get("properties", {}).get("candidate", {})
    if isinstance(candidate, dict) and candidate_schema.get("additionalProperties") is False:
        allowed_candidate = set(candidate_schema.get("properties", {}))
        for field in sorted(set(candidate) - allowed_candidate):
            add_error(errors, f"SCHEMA_VALIDATION: unknown candidate property: {field}")

    reference_epoch = manifest.get("reference_epoch")
    epoch_schema = schema.get("properties", {}).get("reference_epoch", {})
    if isinstance(reference_epoch, dict) and epoch_schema.get("additionalProperties") is False:
        allowed_epoch = set(epoch_schema.get("properties", {}))
        for field in sorted(set(reference_epoch) - allowed_epoch):
            add_error(errors, f"SCHEMA_VALIDATION: unknown reference_epoch property: {field}")

    correction = manifest.get("correction")
    if not isinstance(correction, dict):
        add_error(errors, "SCHEMA_VALIDATION: correction must be an object")
    else:
        required_correction = schema.get("properties", {}).get("correction", {}).get("required", [])
        for field in required_correction:
            if field not in correction:
                add_error(errors, f"SCHEMA_VALIDATION: correction missing required field: {field}")
        if correction.get("type") != "DOCUMENTATION_ONLY":
            add_error(errors, "SCHEMA_VALIDATION: correction.type must be DOCUMENTATION_ONLY")
        if correction.get("scientific_result_changed") is not False:
            add_error(errors, "SCHEMA_VALIDATION: correction.scientific_result_changed must be false")
        if correction.get("full_scientific_recomputation") != "NOT_PERFORMED":
            add_error(errors, "SCHEMA_VALIDATION: correction.full_scientific_recomputation must be NOT_PERFORMED")

    history = manifest.get("version_history")
    if not isinstance(history, list) or len(history) < 2:
        add_error(errors, "SCHEMA_VALIDATION: version_history must contain at least two records")
    else:
        for index, record in enumerate(history):
            if not isinstance(record, dict) or not all(field in record for field in ("version", "status", "reason")):
                add_error(errors, f"SCHEMA_VALIDATION: version_history record {index} is incomplete")


def validate_coordinate_semantics(
    manifest: dict[str, Any],
    methodology: dict[str, Any],
    datasets_by_id: dict[str, dict[str, Any]],
    evidence_by_id: dict[str, dict[str, Any]],
    replay: dict[str, Any],
    errors: list[str],
) -> None:
    """Validate the semantic coordinate contract corrected in package v1.0.1."""

    if manifest.get("semantic_version") != "1.0.1":
        add_error(errors, "v1.0.1 validator requires manifest semantic_version 1.0.1")
    candidate = manifest.get("candidate", {})
    if candidate.get("reference_frame") != "MOON_ME_DE421":
        add_error(errors, "candidate reference_frame must be MOON_ME_DE421")
    if candidate.get("projected_coordinates_m") != {"x": -11152.5, "y": -12052.5}:
        add_error(errors, "candidate projected coordinates do not match ROI5_C1")

    coordinate_system = methodology.get("coordinate_system", {})
    if "pixel-center" not in str(coordinate_system.get("pixel_registration", "")).lower() and "pixel center" not in str(coordinate_system.get("pixel_registration", "")).lower():
        add_error(errors, "methodology does not declare pixel-center coordinates")
    transform = coordinate_system.get("pixel_center_transform", {})
    x_formula = str(transform.get("x", "")).replace(" ", "")
    y_formula = str(transform.get("y", "")).replace(" ", "")
    if x_formula != "-19000+5*(column+0.5)":
        add_error(errors, "incorrect or missing X pixel-center transformation")
    if y_formula not in {"-4000+2.5-5*row", "-3997.5-5*row"}:
        add_error(errors, "incorrect or missing Y pixel-center transformation; expected -4000 + 2.5 - 5*row")
    first_center = coordinate_system.get("first_pixel_center_m", {})
    if first_center.get("x") != -18997.5 or first_center.get("y") != -3997.5:
        add_error(errors, "first pixel center must be (-18997.5, -3997.5) m")
    if coordinate_system.get("reference_frame") != "MOON_ME_DE421":
        add_error(errors, "methodology coordinate reference_frame must be MOON_ME_DE421")

    for dataset_id in ("PGDA_SITE01_SURF", "PGDA_SITE01_SLP", "PGDA_SITE01_LDEC_COMPLETE", "PGDA_SITE01_TOTERR", "PGDA_SITE01_SLPERR"):
        record = datasets_by_id.get(dataset_id, {})
        dimensions = record.get("raster_dimensions", {})
        resolution = record.get("resolution_m", {})
        if dimensions.get("width") != 3200 or dimensions.get("height") != 3200:
            add_error(errors, f"{dataset_id} must be 3200 x 3200")
        if resolution.get("x") != 5.0 or resolution.get("y") != 5.0:
            add_error(errors, f"{dataset_id} must have 5 m resolution")

    if replay.get("candidate_id") != "ROI5_C1":
        add_error(errors, "replay candidate_id must be ROI5_C1")
    if replay.get("coordinate", {}).get("reference_frame") != "MOON_ME_DE421":
        add_error(errors, "replay coordinate reference frame must be MOON_ME_DE421")
    if replay.get("coordinate", {}).get("projected_x_m") != -11152.5 or replay.get("coordinate", {}).get("projected_y_m") != -12052.5:
        add_error(errors, "replay projected coordinate does not match ROI5_C1")
    for evidence_id, record in evidence_by_id.items():
        if record.get("reference_frame") != "MOON_ME_DE421":
            add_error(errors, f"evidence {evidence_id} is not in MOON_ME_DE421")
        if record.get("projected_coordinate_m") != {"x": -11152.5, "y": -12052.5}:
            add_error(errors, f"evidence {evidence_id} coordinate does not match ROI5_C1")


def validate_datasets(
    datasets: dict[str, Any],
    manifest: dict[str, Any],
    package: Path,
    research_root: Path | None,
    errors: list[str],
    unavailable: list[str],
) -> tuple[dict[str, dict[str, Any]], dict[str, str]]:
    records = datasets.get("datasets")
    if not isinstance(records, list):
        add_error(errors, "datasets.json.datasets must be an array")
        return {}, {}
    by_id: dict[str, dict[str, Any]] = {}
    hashes: dict[str, str] = {}
    for record in records:
        dataset_id = record.get("dataset_id") if isinstance(record, dict) else None
        if not isinstance(dataset_id, str) or not dataset_id:
            add_error(errors, "dataset record has no dataset_id")
            continue
        if dataset_id in by_id:
            add_error(errors, f"duplicate dataset_id: {dataset_id}")
        by_id[dataset_id] = record
        for field in ("filename", "dataset_identifier", "original_source_url", "nasa_organization", "sha256", "local_path", "units", "classification", "used_in_freeze"):
            if field not in record:
                add_error(errors, f"dataset {dataset_id} missing required field: {field}")
        if record.get("classification") not in ALLOWED_CLASSIFICATIONS:
            add_error(errors, f"dataset {dataset_id} has invalid classification")
        digest = record.get("sha256")
        if isinstance(digest, str):
            hashes[dataset_id] = digest.upper()
        if record.get("used_in_freeze"):
            local_path = record.get("local_path")
            if not isinstance(local_path, str):
                add_error(errors, f"used dataset {dataset_id} has no local_path")
                continue
            file_path = resolve_path(local_path, package, research_root)
            if not file_path.is_file():
                add_error(errors, f"MISSING_LOCAL_INPUT: {dataset_id}: {file_path}")
                continue
            actual = sha256(file_path)
            if actual != str(record.get("sha256", "")).upper():
                add_error(errors, f"SHA256_MISMATCH: {dataset_id}: expected {record.get('sha256')} got {actual}")
            if isinstance(record.get("size_bytes"), int) and file_path.stat().st_size != record["size_bytes"]:
                add_error(errors, f"SIZE_MISMATCH: {dataset_id}: expected {record['size_bytes']} got {file_path.stat().st_size}")
        elif record.get("status") == "EXCLUDED_INCOMPLETE_COPY":
            local_path = record.get("local_path")
            if isinstance(local_path, str):
                file_path = resolve_path(local_path, package, research_root)
                if file_path.is_file():
                    actual = sha256(file_path)
                    if actual != str(record.get("sha256", "")).upper():
                        add_error(errors, f"SHA256_MISMATCH_EXCLUDED_COPY: {dataset_id}: expected {record.get('sha256')} got {actual}")
                else:
                    unavailable.append(f"excluded dataset not present locally: {dataset_id}: {file_path}")

    input_ids = set(manifest.get("input_dataset_ids", []))
    missing_expected = EXPECTED_INPUT_IDS - input_ids
    if missing_expected:
        add_error(errors, f"manifest input_dataset_ids missing required datasets: {sorted(missing_expected)}")
    forbidden = "PGDA_SITE01_LDEC_PHASE1_INCOMPLETE"
    if forbidden in input_ids:
        add_error(errors, "incomplete Phase 1 LDEC copy is listed as a frozen input")
    for dataset_id in sorted(input_ids):
        record = by_id.get(dataset_id)
        if record is None:
            add_error(errors, f"manifest input dataset record missing: {dataset_id}")
        elif not record.get("used_in_freeze"):
            add_error(errors, f"manifest input dataset is not marked used_in_freeze: {dataset_id}")
        elif str(manifest.get("input_dataset_hashes", {}).get(dataset_id, "")).upper() != str(hashes.get(dataset_id, "")).upper():
            add_error(errors, f"manifest/dataset hash mismatch: {dataset_id}")
    if hashes.get("PGDA_SITE01_LDEC_COMPLETE") != COMPLETE_LDEC_SHA256:
        add_error(errors, "complete LDEC SHA-256 is not the required corrected hash")
    return by_id, hashes


def validate_kernels(
    kernels: dict[str, Any],
    manifest: dict[str, Any],
    package: Path,
    research_root: Path | None,
    errors: list[str],
) -> dict[str, dict[str, Any]]:
    records = kernels.get("kernels")
    if not isinstance(records, list):
        add_error(errors, "kernels.json.kernels must be an array")
        return {}
    by_id: dict[str, dict[str, Any]] = {}
    for record in records:
        kernel_id = record.get("kernel_id") if isinstance(record, dict) else None
        if not isinstance(kernel_id, str):
            add_error(errors, "kernel record has no kernel_id")
            continue
        by_id[kernel_id] = record
        for field in ("filename", "original_source_url", "sha256", "local_path", "kernel_type", "processing_role", "classification"):
            if field not in record:
                add_error(errors, f"kernel {kernel_id} missing required field: {field}")
        if record.get("classification") != "NASA_PUBLISHED":
            add_error(errors, f"kernel {kernel_id} must be NASA_PUBLISHED")
        local_path = record.get("local_path")
        if not isinstance(local_path, str):
            add_error(errors, f"kernel {kernel_id} has no local_path")
            continue
        file_path = resolve_path(local_path, package, research_root)
        if not file_path.is_file():
            add_error(errors, f"MISSING_LOCAL_KERNEL: {kernel_id}: {file_path}")
            continue
        actual = sha256(file_path)
        if actual != str(record.get("sha256", "")).upper():
            add_error(errors, f"SHA256_MISMATCH_KERNEL: {kernel_id}: expected {record.get('sha256')} got {actual}")
    listed = set(manifest.get("kernel_ids", []))
    missing = EXPECTED_KERNEL_IDS - listed
    if missing:
        add_error(errors, f"manifest kernel_ids missing required kernels: {sorted(missing)}")
    for kernel_id in sorted(listed):
        if kernel_id not in by_id:
            add_error(errors, f"manifest kernel record missing: {kernel_id}")
    return by_id


def validate_evidence(
    evidence: dict[str, Any],
    manifest: dict[str, Any],
    datasets_by_id: dict[str, dict[str, Any]],
    kernels_by_id: dict[str, dict[str, Any]],
    errors: list[str],
) -> dict[str, dict[str, Any]]:
    records = evidence.get("records")
    if not isinstance(records, list):
        add_error(errors, "evidence.json.records must be an array")
        return {}
    by_id: dict[str, dict[str, Any]] = {}
    for record in records:
        record_id = record.get("evidence_record_id") if isinstance(record, dict) else None
        if not isinstance(record_id, str) or not record_id:
            add_error(errors, "evidence record has no evidence_record_id")
            continue
        if record_id in by_id:
            add_error(errors, f"duplicate evidence_record_id: {record_id}")
        by_id[record_id] = record
        if record.get("evidence_classification", record.get("classification")) != "TEAM_DERIVED":
            add_error(errors, f"evidence {record_id} must be TEAM_DERIVED")
        if record.get("candidate_id") != manifest.get("candidate", {}).get("id"):
            add_error(errors, f"evidence {record_id} candidate_id does not match manifest")
        manifest_coords = manifest.get("candidate", {}).get("projected_coordinates_m", {})
        if record.get("projected_coordinate_m") != manifest_coords:
            add_error(errors, f"evidence {record_id} projected coordinate does not match manifest")
        if record.get("reference_frame") != manifest.get("candidate", {}).get("reference_frame"):
            add_error(errors, f"evidence {record_id} reference frame does not match manifest")
        if not is_utc_timestamp(record.get("epoch_utc")):
            add_error(errors, f"evidence {record_id} epoch_utc is not UTC")
        if record.get("epoch_utc") != manifest.get("reference_epoch", {}).get("utc"):
            add_error(errors, f"evidence {record_id} epoch does not match manifest")
        if record.get("spice_et_s") != manifest.get("reference_epoch", {}).get("spice_et_s"):
            add_error(errors, f"evidence {record_id} SPICE ET does not match manifest")
        coordinates = record.get("projected_coordinate_m")
        if not isinstance(coordinates, dict) or not all(isinstance(coordinates.get(axis), (int, float)) for axis in ("x", "y")):
            add_error(errors, f"evidence {record_id} projected coordinate is invalid")
        if isinstance(record.get("solar_direction"), dict):
            vector = record["solar_direction"].get("unit_vector_moon_me_de421")
            if not isinstance(vector, list) or len(vector) != 3 or not all(isinstance(v, (int, float)) for v in vector):
                add_error(errors, f"evidence {record_id} solar direction vector is invalid")
        else:
            add_error(errors, f"evidence {record_id} lacks solar_direction")
        for dataset_id in record.get("source_dataset_ids", []):
            if dataset_id not in datasets_by_id:
                add_error(errors, f"evidence {record_id} references unknown dataset {dataset_id}")
        for kernel_id in record.get("source_kernel_ids", []):
            if kernel_id not in kernels_by_id:
                add_error(errors, f"evidence {record_id} references unknown kernel {kernel_id}")
    if len(records) != 8:
        add_error(errors, f"expected 8 frozen records (4 DEM models x 2 heights), found {len(records)}")
    return by_id


def validate_replay(
    replay: dict[str, Any],
    manifest: dict[str, Any],
    evidence_by_id: dict[str, dict[str, Any]],
    datasets_by_id: dict[str, dict[str, Any]],
    kernels_by_id: dict[str, dict[str, Any]],
    errors: list[str],
) -> None:
    if replay.get("manifest_id") != manifest.get("manifest_id"):
        add_error(errors, "replay fixture manifest_id does not match frozen manifest")
    if replay.get("manifest_version") != manifest.get("semantic_version"):
        add_error(errors, "replay fixture manifest_version does not match frozen manifest")
    if not is_utc_timestamp(replay.get("reference_epoch", {}).get("utc")):
        add_error(errors, "replay fixture reference_epoch.utc is not UTC")
    if replay.get("reference_epoch", {}).get("utc") != manifest.get("reference_epoch", {}).get("utc"):
        add_error(errors, "replay fixture reference epoch does not match manifest")
    if replay.get("reference_epoch", {}).get("spice_et_s") != manifest.get("reference_epoch", {}).get("spice_et_s"):
        add_error(errors, "replay fixture SPICE ET does not match manifest")
    coordinate = replay.get("coordinate", {})
    if coordinate.get("projected_x_m") != manifest.get("candidate", {}).get("projected_coordinates_m", {}).get("x") or coordinate.get("projected_y_m") != manifest.get("candidate", {}).get("projected_coordinates_m", {}).get("y"):
        add_error(errors, "replay fixture projected coordinate does not match manifest")
    for dataset_id in replay.get("source_references", {}).get("dataset_ids", []):
        if dataset_id not in datasets_by_id:
            add_error(errors, f"replay fixture references unknown dataset {dataset_id}")
    for kernel_id in replay.get("source_references", {}).get("kernel_ids", []):
        if kernel_id not in kernels_by_id:
            add_error(errors, f"replay fixture references unknown kernel {kernel_id}")
    ids = replay.get("evidence_record_ids")
    if not isinstance(ids, list) or not ids:
        add_error(errors, "replay fixture evidence_record_ids is missing or empty")
        return
    missing = [record_id for record_id in ids if record_id not in evidence_by_id]
    if missing:
        add_error(errors, f"replay fixture references missing evidence records: {missing}")
    expected = replay.get("expected_outcomes", {})
    if expected.get("idealized_horizon_visibility") != "ILLUMINATED":
        add_error(errors, "replay fixture expected idealized horizon must be ILLUMINATED")
    if expected.get("local_terrain_horizon_visibility") != "OBSTRUCTED":
        add_error(errors, "replay fixture expected local horizon must be OBSTRUCTED")
    by_model = expected.get("direct_sunlight_classification_by_dem_and_height", {})
    for record_id in ids:
        record = evidence_by_id.get(record_id)
        if record is None:
            continue
        model = record.get("dem_model_id")
        height_key = str(record.get("height_above_terrain_m"))
        expected_value = by_model.get(model, {}).get(height_key)
        if expected_value != record.get("direct_sunlight_classification"):
            add_error(errors, f"replay mismatch for {record_id}: expected {expected_value!r}, evidence {record.get('direct_sunlight_classification')!r}")
        if record.get("idealized_horizon_visibility") != expected.get("idealized_horizon_visibility"):
            add_error(errors, f"replay idealized-horizon mismatch for {record_id}")
        if record.get("local_terrain_horizon_visibility") != expected.get("local_terrain_horizon_visibility"):
            add_error(errors, f"replay local-horizon mismatch for {record_id}")
        for dataset_id in record.get("source_dataset_ids", []):
            expected_hash = manifest.get("input_dataset_hashes", {}).get(dataset_id)
            actual_hash = datasets_by_id.get(dataset_id, {}).get("sha256")
            if expected_hash and str(expected_hash).upper() != str(actual_hash).upper():
                add_error(errors, f"source hash mismatch for {record_id}: {dataset_id}")


def validate_script_hashes(manifest: dict[str, Any], package: Path, errors: list[str]) -> None:
    for script_path_text, expected in manifest.get("processing_script_hashes", {}).items():
        path = resolve_path(script_path_text, package, None)
        if not path.is_file():
            add_error(errors, f"MISSING_PROCESSING_SCRIPT: {path}")
            continue
        actual = sha256(path)
        if actual != str(expected).upper():
            add_error(errors, f"PROCESSING_SCRIPT_SHA256_MISMATCH: {script_path_text}: expected {expected} got {actual}")


def validate_phase2_artifacts(manifest: dict[str, Any], package: Path, errors: list[str], unavailable: list[str]) -> None:
    for artifact_path_text, expected in manifest.get("phase2_artifact_hashes", {}).items():
        path = resolve_path(artifact_path_text, package, None)
        if not path.is_file():
            unavailable.append(f"Phase 2 artifact not present: {path}")
            continue
        actual = sha256(path)
        if actual != str(expected).upper():
            add_error(errors, f"PHASE2_ARTIFACT_SHA256_MISMATCH: {artifact_path_text}: expected {expected} got {actual}")


def validate_existing_sums(package: Path, errors: list[str]) -> str:
    sums_path = package / "SHA256SUMS.txt"
    if not sums_path.is_file():
        return "not_present_before_generation"
    checked = 0
    for line_number, line in enumerate(sums_path.read_text(encoding="utf-8").splitlines(), 1):
        if not line.strip():
            continue
        match = re.fullmatch(r"([0-9A-Fa-f]{64})  (.+)", line)
        if not match:
            add_error(errors, f"invalid SHA256SUMS line {line_number}")
            continue
        expected, relative = match.groups()
        target = package / relative
        if relative == "SHA256SUMS.txt":
            add_error(errors, "SHA256SUMS.txt must not contain a self-referential checksum")
        elif not target.is_file():
            add_error(errors, f"checksum target missing: {relative}")
        elif sha256(target) != expected.upper():
            add_error(errors, f"checksum mismatch in SHA256SUMS.txt: {relative}")
        checked += 1
    return f"validated_{checked}_entries"


def write_sums(package: Path) -> int:
    files = sorted(
        path for path in package.rglob("*") if path.is_file() and path.name != "SHA256SUMS.txt"
    )
    lines = []
    for path in files:
        relative = path.relative_to(package).as_posix()
        lines.append(f"{sha256(path)}  {relative}")
    (package / "SHA256SUMS.txt").write_text("\n".join(lines) + "\n", encoding="utf-8", newline="\n")
    return len(lines)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--package", type=Path, required=True, help="frozen package directory")
    parser.add_argument("--research-root", type=Path, help="optional root for relative external research paths")
    parser.add_argument("--report", type=Path, help="write a JSON reproducibility report")
    parser.add_argument("--write-sums", action="store_true", help="write SHA256SUMS.txt after validation")
    args = parser.parse_args()

    package = args.package.resolve()
    errors: list[str] = []
    unavailable: list[str] = []
    for filename in REQUIRED_PACKAGE_FILES:
        if not (package / filename).is_file():
            add_error(errors, f"missing package file: {filename}")
    if errors:
        print("FROZEN_VALIDATION: FAIL")
        for error in errors:
            print(f"- {error}")
        return 1

    try:
        manifest = read_json(package / "manifest.json")
        schema = read_json(package / "manifest.schema.json")
        evidence = read_json(package / "evidence.json")
        replay = read_json(package / "day1-shadow-replay.json")
        datasets = read_json(package / "datasets.json")
        kernels = read_json(package / "kernels.json")
        methodology = read_json(package / "methodology.json")
        limitations = read_json(package / "limitations.json")
    except (OSError, json.JSONDecodeError) as exc:
        print(f"FROZEN_VALIDATION: FAIL\n- unable to load package JSON: {exc}")
        return 1

    if not isinstance(manifest, dict):
        add_error(errors, "manifest.json root must be an object")
        manifest = {}
    validate_manifest_shape(manifest, schema if isinstance(schema, dict) else {}, errors)
    validate_manifest_schema_contract(manifest, schema if isinstance(schema, dict) else {}, errors)
    datasets_by_id, _ = validate_datasets(
        datasets if isinstance(datasets, dict) else {},
        manifest,
        package,
        args.research_root.resolve() if args.research_root else None,
        errors,
        unavailable,
    )
    kernels_by_id = validate_kernels(
        kernels if isinstance(kernels, dict) else {},
        manifest,
        package,
        args.research_root.resolve() if args.research_root else None,
        errors,
    )
    evidence_by_id = validate_evidence(
        evidence if isinstance(evidence, dict) else {},
        manifest,
        datasets_by_id,
        kernels_by_id,
        errors,
    )
    validate_replay(
        replay if isinstance(replay, dict) else {},
        manifest,
        evidence_by_id,
        datasets_by_id,
        kernels_by_id,
        errors,
    )
    validate_coordinate_semantics(
        manifest,
        methodology if isinstance(methodology, dict) else {},
        datasets_by_id,
        evidence_by_id,
        replay if isinstance(replay, dict) else {},
        errors,
    )
    validate_script_hashes(manifest, package, errors)
    validate_phase2_artifacts(manifest, package, errors, unavailable)
    existing_sums = validate_existing_sums(package, errors)

    if not isinstance(methodology, dict) or methodology.get("methodology_id") != manifest.get("methodology_id"):
        add_error(errors, "methodology identifier does not match manifest")
    if not isinstance(limitations, dict) or not limitations.get("limitations"):
        add_error(errors, "limitations.json must contain a non-empty limitations array")

    snapshot_ok = not errors
    report = {
        "report_type": "MoonBase frozen Site01 reproducibility report",
        "manifest_id": manifest.get("manifest_id"),
        "manifest_version": manifest.get("semantic_version"),
        "manifest_schema_contract_validation": "PASS" if not any(error.startswith("SCHEMA_VALIDATION:") for error in errors) else "FAIL",
        "snapshot_integrity_validation": "PASS" if snapshot_ok else "FAIL",
        "replay_fixture_validation": "PASS" if snapshot_ok else "FAIL",
        "full_scientific_calculation_reproduction": "NOT_PERFORMED",
        "input_file_checksums": "validated for every available used dataset and kernel",
        "processing_script_checksums": "validated against manifest",
        "expected_result": "ROI5_C1 is ideal-horizon illuminated but locally terrain-shadowed at 1 m and 5 m across ORIGINAL, CLONE_001, CLONE_050, and CLONE_100 at the frozen epoch",
        "actual_validated_result": "snapshot and replay expectations match" if snapshot_ok else "validation errors are listed below",
        "differences": [],
        "existing_sha256sums_before_run": existing_sums,
        "unavailable_or_not_checked": unavailable,
        "errors": errors,
        "limitations": [
            "This validator does not rerun SPICE, DEM sampling, or terrain ray tracing.",
            "A PASS proves snapshot integrity and deterministic replay consistency, not a fresh astronomical recomputation.",
        ],
    }

    report_path = args.report.resolve() if args.report else None
    if report_path:
        report_path.parent.mkdir(parents=True, exist_ok=True)
        write_json(report_path, report)
    sums_written = None
    if args.write_sums and snapshot_ok:
        sums_written = write_sums(package)

    if snapshot_ok:
        print("FROZEN_VALIDATION: PASS")
        print(f"- manifest: {manifest.get('manifest_id')} v{manifest.get('semantic_version')}")
        print("- manifest schema contract: PASS")
        print("- snapshot integrity: PASS")
        print("- replay fixture: PASS")
        print("- full scientific calculation reproduction: NOT PERFORMED")
        if sums_written is not None:
            print(f"- SHA256SUMS.txt: wrote {sums_written} entries")
        if report_path:
            print(f"- report: {report_path}")
        return 0

    print("FROZEN_VALIDATION: FAIL")
    for error in errors:
        print(f"- {error}")
    if report_path:
        print(f"- report: {report_path}")
    return 1


if __name__ == "__main__":
    sys.exit(main())
