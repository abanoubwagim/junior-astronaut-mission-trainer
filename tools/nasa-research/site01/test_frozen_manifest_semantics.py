#!/usr/bin/env python3
"""Negative and positive semantic tests for the Site01 v1.0.1 correction."""

from __future__ import annotations

import copy
import json
import sys
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[3]
PACKAGE = REPO_ROOT / "docs" / "nasa-research" / "frozen" / "site01" / "v1.0.1"
sys.path.insert(0, str(Path(__file__).resolve().parent))

import validate_frozen_manifest_v1_0_1 as validator  # noqa: E402


def load(name: str):
    with (PACKAGE / name).open("r", encoding="utf-8") as handle:
        return json.load(handle)


def semantic_errors(methodology: dict) -> list[str]:
    errors: list[str] = []
    validator.validate_coordinate_semantics(
        load("manifest.json"),
        methodology,
        {record["dataset_id"]: record for record in load("datasets.json")["datasets"]},
        {record["evidence_record_id"]: record for record in load("evidence.json")["records"]},
        load("day1-shadow-replay.json"),
        errors,
    )
    return errors


def main() -> int:
    correct = semantic_errors(load("methodology.json"))
    if correct:
        print("SEMANTIC_NEGATIVE_TEST: FAIL")
        print("- Correct v1.0.1 methodology was rejected:")
        for error in correct:
            print(f"  - {error}")
        return 1

    incorrect = copy.deepcopy(load("methodology.json"))
    incorrect["coordinate_system"]["pixel_center_transform"]["y"] = "-4000 - 5 * (row + 0.5)"
    rejected = semantic_errors(incorrect)
    if not any("Y pixel-center transformation" in error for error in rejected):
        print("SEMANTIC_NEGATIVE_TEST: FAIL")
        print("- Incorrect v1.0.0 Y formula was not rejected")
        return 1

    print("SEMANTIC_NEGATIVE_TEST: PASS")
    print("- Correct Y pixel-center formula accepted")
    print("- Incorrect v1.0.0 Y pixel-center formula rejected")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
