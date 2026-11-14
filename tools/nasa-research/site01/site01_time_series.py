#!/usr/bin/env python3
"""Time-series wrapper for the isolated Site01 DEM shadow ray tracer.

The wrapper deliberately writes aggregate and transition records rather than
shipping raw DEM samples.  It is used to compare local point illumination with
the PGDA 2024-01-01..2026-01-01 aggregate window and to refine a candidate
shadow transition around a documented epoch.
"""

from __future__ import annotations

import argparse
import csv
import datetime as dt
import json
from pathlib import Path

import site01_shadow_analysis as analysis


def parse_utc(value: str) -> dt.datetime:
    normalized = value.replace("Z", "+00:00")
    parsed = dt.datetime.fromisoformat(normalized)
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=dt.timezone.utc)
    return parsed.astimezone(dt.timezone.utc)


def epoch_text(value: dt.datetime) -> str:
    return value.strftime("%Y-%m-%d %H:%M:%S UTC")


def epochs(start: dt.datetime, end: dt.datetime, step_minutes: int):
    if step_minutes <= 0:
        raise ValueError("step_minutes must be positive")
    current = start
    while current < end:
        yield epoch_text(current)
        current += dt.timedelta(minutes=step_minutes)


def load_candidate_rows(path: Path, ids: list[str]) -> list[dict]:
    with path.open(newline="", encoding="utf-8") as fh:
        rows = list(csv.DictReader(fh))
    by_id = {row["candidate_id"]: row for row in rows}
    missing = [candidate_id for candidate_id in ids if candidate_id not in by_id]
    if missing:
        raise ValueError(f"Candidate IDs are not in {path}: {missing}")
    return [by_id[candidate_id] for candidate_id in ids]


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--data-dir", type=Path, required=True)
    parser.add_argument("--candidate-csv", type=Path, required=True)
    parser.add_argument("--kernels-dir", type=Path, required=True)
    parser.add_argument("--out-dir", type=Path, required=True)
    parser.add_argument("--candidate-id", nargs="+", required=True)
    parser.add_argument("--transition-candidate-id", nargs="*", help="Optional subset for the high-cadence transition artifact")
    parser.add_argument("--start", default="2024-01-01T00:00:00Z")
    parser.add_argument("--end", default="2026-01-01T00:00:00Z")
    parser.add_argument("--step-minutes", type=int, default=720, help="Analysis sample spacing; 720 is twice daily")
    parser.add_argument("--local-start", default="2023-12-31T00:00:00Z")
    parser.add_argument("--local-end", default="2024-01-02T00:00:00Z")
    parser.add_argument("--local-step-minutes", type=int, default=15)
    parser.add_argument("--max-range-m", type=float, default=8000.0)
    parser.add_argument("--ray-step-m", type=float, default=5.0)
    args = parser.parse_args()

    data = args.data_dir.resolve()
    out = args.out_dir.resolve()
    out.mkdir(parents=True, exist_ok=True)
    surf = analysis.read_tiff(data / "surf.tif")
    clones = {name: analysis.read_tiff(data / f"{name}_err.tif") for name in ("clone001", "clone050", "clone100")}
    selected = load_candidate_rows(args.candidate_csv.resolve(), args.candidate_id)
    transition_selected = selected if not args.transition_candidate_id else load_candidate_rows(args.candidate_csv.resolve(), args.transition_candidate_id)
    spice = analysis.load_spice(args.kernels_dir.resolve())

    analysis_start = parse_utc(args.start)
    analysis_end = parse_utc(args.end)
    analysis_epochs = list(epochs(analysis_start, analysis_end, args.step_minutes))
    model_rasters = [("original", surf), *clones.items()]
    aggregate_rows = []

    for candidate in selected:
        x = float(candidate["x_m"])
        y = float(candidate["y_m"])
        for model_name, raster in model_rasters:
            for height in (1.0, 5.0):
                results = [analysis.terrain_visibility(spice, raster, x, y, height, epoch, args.max_range_m, args.ray_step_m) for epoch in analysis_epochs]
                direct = [bool(r["direct_visible"]) for r in results]
                ideal = [bool(r["ideal_visible"]) for r in results]
                terrain_shadow = [bool(r["terrain_shadow"]) for r in results]
                aggregate_rows.append({
                    "candidate_id": candidate["candidate_id"],
                    "roi": candidate["roi"],
                    "clone": model_name,
                    "height_m": height,
                    "window_start_utc": epoch_text(analysis_start),
                    "window_end_utc_exclusive": epoch_text(analysis_end),
                    "sample_spacing_hours": args.step_minutes / 60.0,
                    "sample_count": len(results),
                    "ideal_body_visibility_fraction": sum(ideal) / len(ideal),
                    "direct_visibility_fraction": sum(direct) / len(direct),
                    "terrain_shadow_sample_count": sum(terrain_shadow),
                    "edge_truncated_sample_count": sum(bool(r["edge_truncated"]) for r in results),
                    "shadow_sample_epochs_utc": ";".join(r["epoch_utc"] for r in results if r["terrain_shadow"]),
                    "classification": "TEAM_DERIVED",
                    "limitations": "twice-daily point samples; fractions are sample fractions, not continuous time integrals; no electrical conversion",
                })

    summary_path = out / "SITE01_TIME_SERIES_SUMMARY.csv"
    with summary_path.open("w", newline="", encoding="utf-8") as fh:
        fields = list(aggregate_rows[0].keys())
        writer = csv.DictWriter(fh, fieldnames=fields)
        writer.writeheader()
        writer.writerows(aggregate_rows)

    # A short high-cadence transition record around the first candidate event.
    # Keep only near-horizon records so the artifact stays reviewable.
    local_epochs = list(epochs(parse_utc(args.local_start), parse_utc(args.local_end), args.local_step_minutes))
    transition_rows = []
    for candidate in transition_selected:
        x = float(candidate["x_m"])
        y = float(candidate["y_m"])
        for model_name, raster in model_rasters:
            for height in (1.0, 5.0):
                for epoch in local_epochs:
                    result = analysis.terrain_visibility(spice, raster, x, y, height, epoch, args.max_range_m, args.ray_step_m)
                    if result["ideal_visible"] and (result["terrain_shadow"] or abs(result["obstruction_margin_deg"]) <= 0.20):
                        transition_rows.append({
                            "candidate_id": candidate["candidate_id"],
                            "roi": candidate["roi"],
                            "clone": model_name,
                            "height_m": height,
                            "epoch_utc": epoch,
                            "ideal_visible": result["ideal_visible"],
                            "direct_visible": result["direct_visible"],
                            "terrain_shadow": result["terrain_shadow"],
                            "ideal_elevation_deg": result["ideal_elevation_deg"],
                            "terrain_horizon_elevation_deg": result["terrain_horizon_elevation_deg"],
                            "obstruction_margin_deg": result["obstruction_margin_deg"],
                            "obstruction_distance_m": result["obstruction_distance_m"],
                            "edge_truncated": result["edge_truncated"],
                            "classification": "TEAM_DERIVED",
                        })
    transition_path = out / "SITE01_TRANSITION_SAMPLES.csv"
    with transition_path.open("w", newline="", encoding="utf-8") as fh:
        fields = list(transition_rows[0].keys()) if transition_rows else ["candidate_id", "roi", "clone", "height_m", "epoch_utc", "terrain_shadow"]
        writer = csv.DictWriter(fh, fieldnames=fields)
        writer.writeheader()
        writer.writerows(transition_rows)

    manifest = {
        "generated_utc": dt.datetime.now(dt.timezone.utc).isoformat().replace("+00:00", "Z"),
        "window": {"start_utc": epoch_text(analysis_start), "end_utc_exclusive": epoch_text(analysis_end), "step_minutes": args.step_minutes},
        "local_transition_window": {"start_utc": epoch_text(parse_utc(args.local_start)), "end_utc_exclusive": epoch_text(parse_utc(args.local_end)), "step_minutes": args.local_step_minutes},
        "candidate_ids": args.candidate_id,
        "transition_candidate_ids": [candidate["candidate_id"] for candidate in transition_selected],
        "heights_m": [1.0, 5.0],
        "clones": ["original", "clone001", "clone050", "clone100"],
        "ray_trace": {"max_range_m": args.max_range_m, "step_m": args.ray_step_m, "interpolation": "bilinear", "margin_threshold_deg": 0.02},
        "source_files": {"dem": str(data / "surf.tif"), "candidate_csv": str(args.candidate_csv.resolve()), "script": str(Path(__file__).resolve())},
        "classification": "TEAM_DERIVED",
    }
    (out / "SITE01_TIME_SERIES_MANIFEST.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"summary_rows": len(aggregate_rows), "transition_rows": len(transition_rows), "summary": str(summary_path), "transitions": str(transition_path)}, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
