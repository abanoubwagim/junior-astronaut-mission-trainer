#!/usr/bin/env python3
"""Offline Site01 DEM inspection and terrain-shadow analysis.

This module intentionally has no dependency on the MoonBase application.  It
reads the PGDA GeoTIFFs and ROI shapefile directly, uses a DE421-compatible
SPICE kernel set, and writes small research artifacts.  It is not a runtime
NASA client and does not read NASA_API_KEY.

The terrain visibility calculation is a DEM ray trace, not a SPICE DSK call.
The GeoTIFF's south-polar stereographic coordinates are mapped to a spherical
MOON_ME_DE421 point using the standard south-polar stereographic inverse with
R=1,737,400 m, lon_0=0, and x=east/y=north map axes.  The method and its
limitations are written into the generated CSV/GeoJSON/Markdown companion.
"""

from __future__ import annotations

import argparse
import csv
import datetime as dt
import hashlib
import json
import math
import os
import platform
import struct
import sys
import zlib
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, Sequence

import numpy as np


MOON_RADIUS_M = 1_737_400.0
FRAME = "MOON_ME_DE421"
DEFAULT_EPOCHS = [
    "2024-01-01 00:00:00 UTC",
    "2024-07-01 00:00:00 UTC",
    "2025-01-01 00:00:00 UTC",
    "2025-07-01 00:00:00 UTC",
    "2026-01-01 00:00:00 UTC",
    "2024-03-28 12:00:00 UTC",
]
SOURCE_URLS = {
    "pgda_product": "https://pgda.gsfc.nasa.gov/products/78",
    "pgda_data": "https://pgda.gsfc.nasa.gov/data/LOLA_5mpp/",
    "pgda_readme": "https://pgda.gsfc.nasa.gov/data/LOLA_5mpp/README",
    "naif_de421": "https://naif.jpl.nasa.gov/pub/naif/generic_kernels/spk/planets/a_old_versions/de421.bsp",
    "naif_lunar_pck": "https://naif.jpl.nasa.gov/pub/naif/generic_kernels/pck/moon_pa_de421_1900-2050.bpc",
    "naif_lunar_fk": "https://naif.jpl.nasa.gov/pub/naif/generic_kernels/fk/satellites/moon_080317.tf",
}


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as fh:
        for chunk in iter(lambda: fh.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest().upper()


def _tiff_type(t: int) -> tuple[str, int]:
    types = {
        1: ("B", 1),
        2: ("s", 1),
        3: ("H", 2),
        4: ("I", 4),
        5: ("II", 8),
        6: ("b", 1),
        7: ("B", 1),
        8: ("h", 2),
        9: ("i", 4),
        10: ("ii", 8),
        11: ("f", 4),
        12: ("d", 8),
    }
    if t not in types:
        raise ValueError(f"Unsupported TIFF field type {t}")
    return types[t]


def _unpack_tiff_value(raw: bytes, endian: str, typ: int, count: int):
    if typ == 2:
        return raw.rstrip(b"\0").decode("ascii", errors="replace")
    if typ in (5, 10):
        fmt = endian + ("II" if typ == 5 else "ii")
        return [struct.unpack_from(fmt, raw, i * 8) for i in range(count)]
    fmt_char, width = _tiff_type(typ)
    fmt = endian + fmt_char * count
    return list(struct.unpack(fmt, raw[: width * count]))


@dataclass
class Raster:
    path: Path
    array: np.ndarray
    width: int
    height: int
    pixel_x: float
    pixel_y: float
    first_center_x: float
    first_center_y: float
    raster_type: int
    tags: dict

    @property
    def x_min(self) -> float:
        return self.first_center_x

    @property
    def x_max(self) -> float:
        return self.first_center_x + self.pixel_x * (self.width - 1)

    @property
    def y_min(self) -> float:
        return min(self.first_center_y, self.first_center_y + self.pixel_y * (self.height - 1))

    @property
    def y_max(self) -> float:
        return max(self.first_center_y, self.first_center_y + self.pixel_y * (self.height - 1))

    def to_index(self, x: np.ndarray | float, y: np.ndarray | float) -> tuple[np.ndarray, np.ndarray]:
        col = (np.asarray(x, dtype=float) - self.first_center_x) / self.pixel_x
        row = (np.asarray(y, dtype=float) - self.first_center_y) / self.pixel_y
        return row, col


def read_tiff(path: Path) -> Raster:
    raw = path.read_bytes()
    if raw[:2] == b"II":
        endian = "<"
        byte_order = "little"
    elif raw[:2] == b"MM":
        endian = ">"
        byte_order = "big"
    else:
        raise ValueError(f"{path} is not a classic TIFF")
    if struct.unpack_from(endian + "H", raw, 2)[0] != 42:
        raise ValueError(f"{path} is not classic TIFF magic 42")
    ifd = struct.unpack_from(endian + "I", raw, 4)[0]
    count = struct.unpack_from(endian + "H", raw, ifd)[0]
    tags: dict[int, object] = {}
    for i in range(count):
        pos = ifd + 2 + i * 12
        tag, typ, n, value_or_offset = struct.unpack_from(endian + "HHII", raw, pos)
        _, width = _tiff_type(typ)
        size = width * n
        if size <= 4:
            value_bytes = raw[pos + 8 : pos + 8 + size]
        else:
            value_bytes = raw[value_or_offset : value_or_offset + size]
        tags[tag] = _unpack_tiff_value(value_bytes, endian, typ, n)

    width = int(tags[256][0])
    height = int(tags[257][0])
    bits = int(tags[258][0])
    compression = int(tags[259][0])
    samples = int(tags[277][0])
    sample_format = int(tags.get(339, [1])[0])
    planar = int(tags.get(284, [1])[0])
    if bits != 32 or sample_format != 3 or samples != 1 or planar != 1:
        raise ValueError(f"{path}: expected one IEEE float32 band; tags={tags}")
    if compression != 1:
        raise ValueError(f"{path}: compressed TIFF is not supported by this research reader")

    offsets = [int(v) for v in tags[273]]
    byte_counts = [int(v) for v in tags[279]]
    rows_per_strip = int(tags.get(278, [height])[0])
    dtype = np.dtype(("<" if byte_order == "little" else ">") + "f4")
    array = np.empty((height, width), dtype=np.float32)
    row = 0
    for offset, nbytes in zip(offsets, byte_counts):
        strip_rows = min(rows_per_strip, height - row)
        values = np.frombuffer(raw, dtype=dtype, count=strip_rows * width, offset=offset)
        if values.size != strip_rows * width:
            raise ValueError(f"{path}: short TIFF strip at row {row}")
        array[row : row + strip_rows] = values.reshape(strip_rows, width)
        row += strip_rows
    if row != height:
        raise ValueError(f"{path}: TIFF strips cover {row} of {height} rows")

    scale = np.asarray(tags.get(33550, [1.0, 1.0, 1.0]), dtype=float)
    tie = np.asarray(tags.get(33922, [0.0, 0.0, 0.0, 0.0, 0.0, 0.0]), dtype=float)
    geokeys = tags.get(34735, [])
    raster_type = 1
    if len(geokeys) >= 4:
        nkeys = int(geokeys[3])
        for k in range(nkeys):
            base = 4 + k * 4
            if int(geokeys[base]) == 1025:
                raster_type = int(geokeys[base + 3])
    half = 0.5 if raster_type == 1 else 0.0
    first_x = tie[3] + scale[0] * half
    first_y = tie[4] + scale[1] * half
    return Raster(
        path=path,
        array=array,
        width=width,
        height=height,
        pixel_x=float(scale[0]),
        pixel_y=float(-abs(scale[1])),
        first_center_x=float(first_x),
        first_center_y=float(first_y),
        raster_type=raster_type,
        tags={str(k): v for k, v in tags.items()},
    )


@dataclass
class PolygonRecord:
    record_number: int
    parts: list[np.ndarray]
    bbox: tuple[float, float, float, float]


def read_shapefile(path: Path) -> list[PolygonRecord]:
    raw = path.read_bytes()
    if len(raw) < 100 or struct.unpack_from(">i", raw, 0)[0] != 9994:
        raise ValueError(f"{path} is not an ESRI shapefile")
    pos = 100
    records: list[PolygonRecord] = []
    while pos + 8 <= len(raw):
        number, length_words = struct.unpack_from(">ii", raw, pos)
        pos += 8
        length = length_words * 2
        content = raw[pos : pos + length]
        pos += length
        if len(content) < 44:
            raise ValueError(f"{path}: truncated record {number}")
        shape_type = struct.unpack_from("<i", content, 0)[0]
        if shape_type == 0:
            continue
        if shape_type != 5:
            raise ValueError(f"{path}: expected Polygon record, got {shape_type}")
        bbox = struct.unpack_from("<4d", content, 4)
        n_parts, n_points = struct.unpack_from("<2i", content, 36)
        parts_index = struct.unpack_from("<" + "i" * n_parts, content, 44)
        points_start = 44 + n_parts * 4
        points = np.frombuffer(content, dtype="<f8", count=n_points * 2, offset=points_start).reshape(n_points, 2)
        parts: list[np.ndarray] = []
        for i, start in enumerate(parts_index):
            end = parts_index[i + 1] if i + 1 < n_parts else n_points
            parts.append(points[start:end].copy())
        records.append(PolygonRecord(number, parts, bbox))
    return records


def points_in_polygon(xs: np.ndarray, ys: np.ndarray, record: PolygonRecord) -> np.ndarray:
    result = np.zeros(xs.shape, dtype=bool)
    for ring in record.parts:
        x = ring[:, 0]
        y = ring[:, 1]
        inside = np.zeros(xs.shape, dtype=bool)
        j = len(ring) - 1
        for i in range(len(ring)):
            yi, yj = y[i], y[j]
            xi, xj = x[i], x[j]
            crossing = ((yi > ys) != (yj > ys)) & (
                xs < (xj - xi) * (ys - yi) / ((yj - yi) + 1e-30) + xi
            )
            inside ^= crossing
            j = i
        result ^= inside
    return result


def source_center_arrays(raster: Raster) -> tuple[np.ndarray, np.ndarray]:
    xs = raster.first_center_x + raster.pixel_x * np.arange(raster.width, dtype=float)
    ys = raster.first_center_y + raster.pixel_y * np.arange(raster.height, dtype=float)
    return xs, ys


def sample_bilinear(raster: Raster, x: np.ndarray | float, y: np.ndarray | float) -> np.ndarray:
    rows, cols = raster.to_index(x, y)
    rows = np.asarray(rows, dtype=float)
    cols = np.asarray(cols, dtype=float)
    out = np.full(np.broadcast(rows, cols).shape, np.nan, dtype=float)
    valid = (rows >= 0) & (cols >= 0) & (rows <= raster.height - 1) & (cols <= raster.width - 1)
    if not np.any(valid):
        return out
    r0 = np.floor(rows[valid]).astype(int)
    c0 = np.floor(cols[valid]).astype(int)
    r1 = np.minimum(r0 + 1, raster.height - 1)
    c1 = np.minimum(c0 + 1, raster.width - 1)
    fr = rows[valid] - r0
    fc = cols[valid] - c0
    a = raster.array
    v00 = a[r0, c0]
    v01 = a[r0, c1]
    v10 = a[r1, c0]
    v11 = a[r1, c1]
    good = np.isfinite(v00) & np.isfinite(v01) & np.isfinite(v10) & np.isfinite(v11)
    vals = (v00 * (1 - fc) + v01 * fc) * (1 - fr) + (v10 * (1 - fc) + v11 * fc) * fr
    target = out[valid]
    target[good] = vals[good]
    out[valid] = target
    return out


def unit_from_map(x: float | np.ndarray, y: float | np.ndarray) -> np.ndarray:
    """Inverse standard spherical south-polar stereographic, lon_0=0.

    The PGDA README gives the projection family and DE421 MOON_ME frame but
    not a longitude axis in the raster.  This is the conventional spherical
    inverse for +x east, +y north: x=rho*sin(lon), y=-rho*cos(lon),
    rho=2R*tan(c/2), c=pi/2+latitude.  It is local geometry only; the output
    reports that no player-facing longitude was inferred.
    """
    x_arr = np.asarray(x, dtype=float)
    y_arr = np.asarray(y, dtype=float)
    rho = np.hypot(x_arr, y_arr)
    c = 2.0 * np.arctan2(rho, 2.0 * MOON_RADIUS_M)
    lat = -math.pi / 2.0 + c
    lon = np.arctan2(x_arr, -y_arr)
    clat = np.cos(lat)
    return np.stack((clat * np.cos(lon), clat * np.sin(lon), np.sin(lat)), axis=-1)


def local_basis(x: float, y: float) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    u = unit_from_map(x, y).reshape(3)
    eps = 1.0
    ex0 = (unit_from_map(x + eps, y) - unit_from_map(x - eps, y)).reshape(3)
    ey0 = (unit_from_map(x, y + eps) - unit_from_map(x, y - eps)).reshape(3)
    ex = ex0 / np.linalg.norm(ex0)
    ey = ey0 - np.dot(ey0, ex) * ex
    ey /= np.linalg.norm(ey)
    return u, ex, ey


def surface_point(x: float, y: float, z: float) -> np.ndarray:
    return (MOON_RADIUS_M + z) * unit_from_map(x, y).reshape(3)


def surface_normal(dem: Raster, x: float, y: float, z: float | None = None) -> np.ndarray:
    if z is None:
        z = float(sample_bilinear(dem, x, y))
    u, ex, ey = local_basis(x, y)
    dx = float(sample_bilinear(dem, x + 5.0, y) - sample_bilinear(dem, x - 5.0, y)) / 10.0
    dy = float(sample_bilinear(dem, x, y + 5.0) - sample_bilinear(dem, x, y - 5.0)) / 10.0
    n = u - dx * ex - dy * ey
    return n / np.linalg.norm(n)


@dataclass
class SunGeometry:
    epoch_utc: str
    et: float
    sun_vector_moon_me_m: np.ndarray
    sun_unit: np.ndarray
    ideal_elevation_deg: float


def get_sun_geometry(spice, epoch: str, x: float, y: float, z: float, kernels: Path) -> SunGeometry:
    et = float(spice.str2et(epoch))
    sun_from_moon, _ = spice.spkpos("SUN", et, FRAME, "NONE", "MOON")
    p = surface_point(x, y, z)
    vec = np.asarray(sun_from_moon, dtype=float) - p
    unit = vec / np.linalg.norm(vec)
    u = unit_from_map(x, y).reshape(3)
    ideal_elevation = math.degrees(math.asin(float(np.dot(unit, u))))
    return SunGeometry(epoch, et, np.asarray(sun_from_moon, dtype=float), unit, ideal_elevation)


def terrain_visibility(
    spice,
    dem: Raster,
    x: float,
    y: float,
    height_m: float,
    epoch: str,
    max_range_m: float,
    step_m: float,
) -> dict:
    z0 = float(sample_bilinear(dem, x, y))
    if not math.isfinite(z0):
        raise ValueError(f"No DEM value at candidate ({x},{y})")
    sun = get_sun_geometry(spice, epoch, x, y, z0 + height_m, dem.path)
    u, ex, ey = local_basis(x, y)
    normal = surface_normal(dem, x, y, z0)
    local_incidence = float(np.dot(sun.sun_unit, normal))
    up = float(np.dot(sun.sun_unit, u))
    horizontal = sun.sun_unit - up * u
    horizontal_norm = float(np.linalg.norm(horizontal))
    if horizontal_norm < 1e-12:
        return {
            "epoch_utc": epoch,
            "height_m": height_m,
            "ideal_visible": up > 0.0,
            "direct_visible": up > 0.0,
            "terrain_shadow": False,
            "ideal_elevation_deg": sun.ideal_elevation_deg,
            "terrain_horizon_elevation_deg": float("nan"),
            "obstruction_margin_deg": float("nan"),
            "obstruction_distance_m": None,
            "edge_truncated": False,
            "local_incidence_cosine": local_incidence,
            "sample_count": 0,
        }
    hx = float(np.dot(horizontal, ex) / horizontal_norm)
    hy = float(np.dot(horizontal, ey) / horizontal_norm)
    distances = np.arange(step_m, max_range_m + step_m * 0.5, step_m, dtype=float)
    sample_x = x + hx * distances
    sample_y = y + hy * distances
    sample_z = sample_bilinear(dem, sample_x, sample_y)
    good = np.isfinite(sample_z)
    edge_truncated = bool(np.any(~good))
    if not np.any(good):
        raise ValueError(f"No valid terrain ray samples from candidate ({x},{y}) toward Sun")
    sample_x = sample_x[good]
    sample_y = sample_y[good]
    sample_z = sample_z[good]
    sample_points = (MOON_RADIUS_M + sample_z)[:, None] * unit_from_map(sample_x, sample_y)
    observer = (MOON_RADIUS_M + z0 + height_m) * u
    relative = sample_points - observer[None, :]
    tangent = relative - np.einsum("ij,j->i", relative, u)[:, None] * u[None, :]
    horizontal_distance = np.linalg.norm(tangent, axis=1)
    terrain_elevation = np.degrees(np.arctan2(relative @ u, horizontal_distance))
    highest = int(np.nanargmax(terrain_elevation))
    horizon_elevation = float(terrain_elevation[highest])
    margin = horizon_elevation - sun.ideal_elevation_deg
    blocked = bool(margin > 0.02)
    ideal_visible = bool(up > 0.0)
    direct_visible = bool(ideal_visible and not blocked)
    return {
        "epoch_utc": epoch,
        "height_m": height_m,
        "ideal_visible": ideal_visible,
        "direct_visible": direct_visible,
        "terrain_shadow": bool(ideal_visible and blocked),
        "ideal_elevation_deg": sun.ideal_elevation_deg,
        "terrain_horizon_elevation_deg": horizon_elevation,
        "obstruction_margin_deg": margin,
        "obstruction_distance_m": float(horizontal_distance[highest]),
        "edge_truncated": edge_truncated,
        "local_incidence_cosine": local_incidence,
        "sample_count": int(len(sample_z)),
    }


def load_spice(kernels_dir: Path):
    try:
        import spiceypy as spice
    except ImportError as exc:
        raise RuntimeError("spiceypy is required in the isolated research environment") from exc
    required = ["naif0012.tls", "pck00010.tpc", "moon_pa_de421_1900-2050.bpc", "moon_080317.tf", "de421.bsp"]
    missing = [name for name in required if not (kernels_dir / name).is_file()]
    if missing:
        raise FileNotFoundError(f"Missing required SPICE kernels: {missing}")
    spice.kclear()
    for name in required:
        spice.furnsh(str(kernels_dir / name))
    if spice.namfrm(FRAME) == 0:
        raise RuntimeError(f"SPICE frame {FRAME} is not defined by the loaded kernels")
    # Fail visibly if the requested body-fixed geometric call is not supported.
    probe = float(spice.str2et("2025 JAN 01 00:00:00"))
    spice.spkpos("SUN", probe, FRAME, "NONE", "MOON")
    return spice


def coverage_report(spice, kernels_dir: Path) -> dict:
    de421 = kernels_dir / "de421.bsp"
    pck = kernels_dir / "moon_pa_de421_1900-2050.bpc"
    spk_intervals = {}
    for body_id in (10, 301):
        cov = spice.spkcov(str(de421), body_id)
        spk_intervals[str(body_id)] = [
            [
                spice.et2utc(spice.wnfetd(cov, i)[0], "C", 3),
                spice.et2utc(spice.wnfetd(cov, i)[1], "C", 3),
            ]
            for i in range(spice.wncard(cov))
        ]
    cov = spice.pckcov(str(pck), 31006)
    pck_intervals = [
        [spice.et2utc(spice.wnfetd(cov, i)[0], "C", 3), spice.et2utc(spice.wnfetd(cov, i)[1], "C", 3)]
        for i in range(spice.wncard(cov))
    ]
    return {
        "frame": FRAME,
        "frame_id": int(spice.namfrm(FRAME)),
        "spk_objects": [int(v) for v in spice.spkobj(str(de421))],
        "spk_coverage": spk_intervals,
        "lunar_pck_frame": "MOON_PA_DE421",
        "lunar_pck_frame_id": 31006,
        "lunar_pck_coverage": pck_intervals,
        "moon_radii_m": [float(v) for v in spice.bodvrd("MOON", "RADII", 3)[1]],
    }


def safe_stats(values: np.ndarray) -> dict:
    finite = values[np.isfinite(values)]
    if finite.size == 0:
        return {"count": 0, "min": None, "p05": None, "median": None, "p95": None, "max": None}
    return {
        "count": int(finite.size),
        "min": float(np.min(finite)),
        "p05": float(np.percentile(finite, 5)),
        "median": float(np.median(finite)),
        "p95": float(np.percentile(finite, 95)),
        "max": float(np.max(finite)),
    }


def choose_candidates(
    roi_masks: dict[int, np.ndarray],
    xs: np.ndarray,
    ys: np.ndarray,
    surf: Raster,
    slope: Raster,
    ldec: Raster,
    toterr: Raster,
    slperr: Raster,
    per_roi: int = 6,
) -> tuple[list[dict], dict]:
    candidates: list[dict] = []
    roi_stats: dict = {}
    for roi, mask in roi_masks.items():
        valid = mask & np.isfinite(surf.array) & np.isfinite(slope.array) & np.isfinite(ldec.array) & np.isfinite(toterr.array) & np.isfinite(slperr.array)
        vals = {"elevation_m": surf.array[valid], "slope_deg": slope.array[valid], "ldec_returns_per_pixel": ldec.array[valid], "elevation_rms_m": toterr.array[valid], "slope_rms_deg": slperr.array[valid]}
        roi_stats[roi] = {
            "pixel_count": int(np.count_nonzero(mask)),
            "valid_pixel_count": int(np.count_nonzero(valid)),
            "valid_data_fraction": float(np.count_nonzero(valid) / max(np.count_nonzero(mask), 1)),
            "elevation_m": safe_stats(vals["elevation_m"]),
            "slope_deg": safe_stats(vals["slope_deg"]),
            "ldec_returns_per_pixel": safe_stats(vals["ldec_returns_per_pixel"]),
            "elevation_rms_m": safe_stats(vals["elevation_rms_m"]),
            "slope_rms_deg": safe_stats(vals["slope_rms_deg"]),
            "suitable_rule": "finite all products; slope <= 15 deg; LDEC >= 1; elevation RMS <= 2 m",
        }
        rows, cols = np.where(valid)
        if len(rows) == 0:
            continue
        sl = slope.array[rows, cols]
        ld = ldec.array[rows, cols]
        ze = toterr.array[rows, cols]
        se = slperr.array[rows, cols]
        # A transparent ranking aid, not a physical suitability law.  Inputs
        # are normalized to observed product ranges and weights sum to one.
        quality = (
            0.35 * np.clip(1.0 - sl / 45.0, 0.0, 1.0)
            + 0.30 * np.clip(ld / 5.0, 0.0, 1.0)
            + 0.25 * np.clip(1.0 - ze / 5.6, 0.0, 1.0)
            + 0.10 * np.clip(1.0 - se / 21.51, 0.0, 1.0)
        )
        good = (sl <= 15.0) & (ld >= 1.0) & (ze <= 2.0)
        quality = np.where(good, quality + 0.02, quality)
        order = np.argsort(-quality)
        selected: list[int] = []
        for idx in order:
            if all(math.hypot(float(cols[idx] - cols[j]), float(rows[idx] - rows[j])) * 5.0 >= 25.0 for j in selected):
                selected.append(int(idx))
            if len(selected) == per_roi:
                break
        for rank, idx in enumerate(selected, start=1):
            r, c = int(rows[idx]), int(cols[idx])
            candidates.append(
                {
                    "candidate_id": f"ROI{roi}_C{rank}",
                    "roi": roi,
                    "rank_in_roi": rank,
                    "row": r,
                    "col": c,
                    "x_m": float(xs[c]),
                    "y_m": float(ys[r]),
                    "elevation_m": float(surf.array[r, c]),
                    "slope_deg": float(slope.array[r, c]),
                    "ldec_returns_per_pixel": float(ldec.array[r, c]),
                    "elevation_rms_m": float(toterr.array[r, c]),
                    "slope_rms_deg": float(slperr.array[r, c]),
                    "quality_score": float(quality[idx]),
                    "suitable_rule_pass": bool(good[idx]),
                }
            )
    return candidates, roi_stats


def make_epochs() -> list[str]:
    return DEFAULT_EPOCHS.copy()


def interval_summary(rows: list[dict], height: float) -> dict:
    selected = [r for r in rows if float(r["height_m"]) == height]
    visible = [bool(r["direct_visible"]) for r in selected]
    ideal = [bool(r["ideal_visible"]) for r in selected]
    shadow = [bool(r["terrain_shadow"]) for r in selected]
    return {
        "height_m": height,
        "sample_count": len(selected),
        "direct_visible_count": int(sum(visible)),
        "ideal_visible_count": int(sum(ideal)),
        "terrain_shadow_count": int(sum(shadow)),
        "direct_visibility_fraction_of_sampled_epochs": (float(sum(visible) / len(visible)) if visible else None),
        "ideal_body_visibility_fraction_of_sampled_epochs": (float(sum(ideal) / len(ideal)) if ideal else None),
        "all_epochs_are_sampled_not_continuous": True,
    }


def write_png(path: Path, rgb: np.ndarray) -> None:
    if rgb.dtype != np.uint8 or rgb.ndim != 3 or rgb.shape[2] != 3:
        raise ValueError("PNG writer expects uint8 HxWx3")
    height, width, _ = rgb.shape
    raw = b"".join(b"\0" + row.tobytes() for row in rgb)
    def chunk(kind: bytes, data: bytes) -> bytes:
        return struct.pack(">I", len(data)) + kind + data + struct.pack(">I", zlib.crc32(kind + data) & 0xFFFFFFFF)
    png = b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0)) + chunk(b"IDAT", zlib.compress(raw, 9)) + chunk(b"IEND", b"")
    path.write_bytes(png)


def make_preview(path: Path, surf: Raster, roi_records: list[PolygonRecord], candidates: list[dict]) -> None:
    # Preview is a small projected-X/Y map, not a georeferenced scientific
    # raster. It uses a robust elevation stretch and overlays source ROIs and
    # selected points; exact values remain in the CSV/GeoJSON outputs.
    factor = 2
    minx = min(rec.bbox[0] for rec in roi_records) - 300.0
    maxx = max(rec.bbox[2] for rec in roi_records) + 300.0
    miny = min(rec.bbox[1] for rec in roi_records) - 300.0
    maxy = max(rec.bbox[3] for rec in roi_records) + 300.0
    cols = np.where((source_center_arrays(surf)[0] >= minx) & (source_center_arrays(surf)[0] <= maxx))[0]
    rows = np.where((source_center_arrays(surf)[1] >= miny) & (source_center_arrays(surf)[1] <= maxy))[0]
    if len(cols) == 0 or len(rows) == 0:
        raise ValueError("ROI preview bounds do not intersect the raster")
    col0, col1 = int(cols.min()), int(cols.max())
    row0, row1 = int(rows.min()), int(rows.max())
    arr = surf.array[row0 : row1 + 1 : factor, col0 : col1 + 1 : factor]
    finite = arr[np.isfinite(arr)]
    lo, hi = np.percentile(finite, [2, 98])
    shade = np.clip((arr - lo) / (hi - lo), 0, 1)
    rgb = np.zeros((arr.shape[0], arr.shape[1], 3), dtype=np.uint8)
    rgb[:, :, 0] = (35 + 180 * shade).astype(np.uint8)
    rgb[:, :, 1] = (45 + 150 * shade).astype(np.uint8)
    rgb[:, :, 2] = (75 + 110 * (1 - shade)).astype(np.uint8)
    x0 = surf.first_center_x + surf.pixel_x * col0
    y0 = surf.first_center_y + surf.pixel_y * row0
    sx, sy = surf.pixel_x * factor, surf.pixel_y * factor
    def pix(x: float, y: float) -> tuple[int, int]:
        return int(round((x - x0) / sx)), int(round((y - y0) / sy))
    def line(xa: int, ya: int, xb: int, yb: int, color: tuple[int, int, int]):
        steps = max(abs(xb - xa), abs(yb - ya), 1)
        for t in np.linspace(0, 1, steps + 1):
            xx = int(round(xa + (xb - xa) * t)); yy = int(round(ya + (yb - ya) * t))
            if 0 <= yy < rgb.shape[0] and 0 <= xx < rgb.shape[1]:
                rgb[yy, xx] = color
    colors = {4: (255, 255, 0), 5: (255, 128, 0), 6: (255, 0, 255)}
    for rec in roi_records:
        color = colors.get(rec.record_number, (150, 150, 150))
        for ring in rec.parts:
            pts = [pix(float(x), float(y)) for x, y in ring]
            for a, b in zip(pts, pts[1:] + pts[:1]):
                line(a[0], a[1], b[0], b[1], color)
    for c in candidates:
        px, py = pix(c["x_m"], c["y_m"])
        color = colors.get(int(c["roi"]), (255, 255, 255))
        for dx in range(-2, 3):
            for dy in range(-2, 3):
                if 0 <= py + dy < rgb.shape[0] and 0 <= px + dx < rgb.shape[1]:
                    rgb[py + dy, px + dx] = color
    write_png(path, rgb)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--data-dir", type=Path, required=True, help="Directory containing surf.tif, slp.tif, ldec.tif, toterr.tif, slperr.tif, and clone*.tif")
    parser.add_argument("--roi-shapefile", type=Path, required=True)
    parser.add_argument("--kernels-dir", type=Path, required=True)
    parser.add_argument("--out-dir", type=Path, required=True)
    parser.add_argument("--max-range-m", type=float, default=8000.0)
    parser.add_argument("--step-m", type=float, default=5.0)
    parser.add_argument("--candidate-count", type=int, default=6)
    args = parser.parse_args()
    data = args.data_dir.resolve()
    out = args.out_dir.resolve()
    out.mkdir(parents=True, exist_ok=True)
    files = {name: data / f"{name}.tif" for name in ["surf", "slp", "ldec", "toterr", "slperr"]}
    clone_files = {"clone001": data / "clone001_err.tif", "clone050": data / "clone050_err.tif", "clone100": data / "clone100_err.tif"}
    missing = [str(p) for p in list(files.values()) + list(clone_files.values()) + [args.roi_shapefile] if not p.is_file()]
    if missing:
        raise FileNotFoundError("Missing research input(s):\n" + "\n".join(missing))

    rasters = {key: read_tiff(path) for key, path in files.items()}
    surf, slope, ldec, toterr, slperr = (rasters[k] for k in ["surf", "slp", "ldec", "toterr", "slperr"])
    for key, raster in rasters.items():
        if (raster.width, raster.height, raster.pixel_x, raster.pixel_y, raster.first_center_x, raster.first_center_y) != (surf.width, surf.height, surf.pixel_x, surf.pixel_y, surf.first_center_x, surf.first_center_y):
            raise ValueError(f"Raster grid mismatch: {key} vs surf")
    clones = {key: read_tiff(path) for key, path in clone_files.items()}
    for key, raster in clones.items():
        if (raster.width, raster.height, raster.pixel_x, raster.pixel_y, raster.first_center_x, raster.first_center_y) != (surf.width, surf.height, surf.pixel_x, surf.pixel_y, surf.first_center_x, surf.first_center_y):
            raise ValueError(f"Clone grid mismatch: {key} vs surf")

    roi_records = read_shapefile(args.roi_shapefile)
    xs, ys = source_center_arrays(surf)
    # Evaluate each polygon only over its bounding box.  The source raster is
    # 3200x3200, while the Site01 ROI polygons occupy small local windows.
    # Building a full-grid edge test for every polygon is needlessly expensive
    # and makes the research run look hung without improving the result.
    roi_masks: dict[int, np.ndarray] = {}
    for rec in roi_records:
        minx, miny, maxx, maxy = rec.bbox
        cols = np.where((xs >= minx) & (xs <= maxx))[0]
        rows = np.where((ys >= miny) & (ys <= maxy))[0]
        mask = np.zeros((surf.height, surf.width), dtype=bool)
        if len(rows) and len(cols):
            gx, gy = np.meshgrid(xs[cols], ys[rows])
            mask[np.ix_(rows, cols)] = points_in_polygon(gx, gy, rec)
        roi_masks[rec.record_number] = mask
    candidates, roi_stats = choose_candidates(roi_masks, xs, ys, surf, slope, ldec, toterr, slperr, args.candidate_count)
    if not candidates:
        raise RuntimeError("No candidate points were selected")

    spice = load_spice(args.kernels_dir.resolve())
    coverage = coverage_report(spice, args.kernels_dir.resolve())
    epochs = make_epochs()
    # Ray-trace every ranked point so the candidate table is not merely a
    # terrain-quality list.  This is still small (six separated points per
    # ROI) and lets the report compare multiple possible locations before a
    # hypothetical research point is discussed.
    selected_for_shadow = candidates
    shadow_rows: list[dict] = []
    uncertainty_rows: list[dict] = []
    for c in selected_for_shadow:
        for clone_name, clone in [("original", surf), *clones.items()]:
            for epoch in epochs:
                for height in (1.0, 5.0):
                    result = terrain_visibility(spice, clone, c["x_m"], c["y_m"], height, epoch, args.max_range_m, args.step_m)
                    row = {"candidate_id": c["candidate_id"], "roi": c["roi"], "clone": clone_name, **result}
                    shadow_rows.append(row)
                    if clone_name != "original":
                        uncertainty_rows.append(row)

    # Candidate CSV keeps multiple ranked points per ROI.  The selected first
    # point is the research coordinate; habitat/solar roles remain hypothetical.
    candidate_path = out / "SITE01_CANDIDATE_LOCATIONS.csv"
    candidate_fields = ["candidate_id", "roi", "rank_in_roi", "x_m", "y_m", "elevation_m", "slope_deg", "ldec_returns_per_pixel", "elevation_rms_m", "slope_rms_deg", "quality_score", "suitable_rule_pass", "classification", "role_note"]
    with candidate_path.open("w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=candidate_fields)
        writer.writeheader()
        for c in candidates:
            row = dict(c)
            row["classification"] = "TEAM_DERIVED"
            row["role_note"] = "Candidate research point; habitat and solar-array coordinates are hypothetical and not NASA-approved"
            writer.writerow({k: row.get(k) for k in candidate_fields})

    summary_path = out / "SITE01_ILLUMINATION_SUMMARY.csv"
    summary_fields = ["candidate_id", "roi", "clone", "height_m", "sample_count", "ideal_body_visibility_fraction", "direct_visibility_fraction", "terrain_shadow_count", "shadow_epochs_utc", "epoch_sampling", "classification", "limitations"]
    with summary_path.open("w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=summary_fields)
        writer.writeheader()
        for c in selected_for_shadow:
            for clone_name in ["original", *clones.keys()]:
                rows = [r for r in shadow_rows if r["candidate_id"] == c["candidate_id"] and r["clone"] == clone_name]
                for height in (1.0, 5.0):
                    s = interval_summary(rows, height)
                    shadow_epochs = ";".join(r["epoch_utc"] for r in rows if float(r["height_m"]) == height and r["terrain_shadow"])
                    writer.writerow({
                        "candidate_id": c["candidate_id"], "roi": c["roi"], "clone": clone_name, "height_m": height,
                        "sample_count": s["sample_count"],
                        "ideal_body_visibility_fraction": s["ideal_body_visibility_fraction_of_sampled_epochs"],
                        "direct_visibility_fraction": s["direct_visibility_fraction_of_sampled_epochs"],
                        "terrain_shadow_count": s["terrain_shadow_count"],
                        "shadow_epochs_utc": shadow_epochs,
                        "epoch_sampling": "6 exact epochs: 2024-01-01, 2024-03-28 12:00, 2024-07-01, 2025-01-01, 2025-07-01, 2026-01-01 UTC; not a continuous interval",
                        "classification": "TEAM_DERIVED",
                        "limitations": "DEM ray trace at 5 m samples, 8 km max range; sample-point results are not continuous illumination and clone set is 001/050/100 only",
                    })

    def feature_point(c: dict) -> dict:
        return {
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [c["x_m"], c["y_m"]]},
            "properties": {k: v for k, v in c.items() if k not in {"row", "col"}},
        }
    features = []
    for rec in roi_records:
        features.append({
            "type": "Feature",
            "geometry": {"type": "Polygon", "coordinates": [[[float(x), float(y)] for x, y in ring] for ring in rec.parts]},
            "properties": {"roi": rec.record_number, "classification": "DIRECT_MEASURED", "source": str(args.roi_shapefile)},
        })
    for c in candidates:
        feature = feature_point(c)
        rows = [r for r in shadow_rows if r["candidate_id"] == c["candidate_id"] and r["clone"] == "original"]
        feature["properties"]["original_shadow_samples"] = [
            {"epoch_utc": r["epoch_utc"], "height_m": r["height_m"], "ideal_visible": r["ideal_visible"], "direct_visible": r["direct_visible"], "terrain_shadow": r["terrain_shadow"], "ideal_elevation_deg": r["ideal_elevation_deg"], "terrain_horizon_elevation_deg": r["terrain_horizon_elevation_deg"], "obstruction_margin_deg": r["obstruction_margin_deg"], "obstruction_distance_m": r["obstruction_distance_m"], "edge_truncated": r["edge_truncated"]}
            for r in rows
        ]
        features.append(feature)
    geojson = {
        "type": "FeatureCollection",
        "name": "Site01_shadow_analysis_projected_xy",
        "crs": {"type": "name", "properties": {"name": "MOON_ME_DE421 south-polar stereographic projected X/Y metres"}},
        "properties": {
            "classification": "TEAM_DERIVED",
            "source_dem": str(surf.path),
            "source_roi": str(args.roi_shapefile),
            "algorithm": "spherical MOON_ME_DE421 mapping plus bilinear 5 m DEM line-of-sight ray trace",
            "max_range_m": args.max_range_m,
            "step_m": args.step_m,
            "epochs_utc": epochs,
            "clone_set": ["original", *clones.keys()],
        },
        "features": features,
    }
    (out / "SITE01_SHADOW_ANALYSIS.geojson").write_text(json.dumps(geojson, indent=2) + "\n", encoding="utf-8")
    make_preview(out / "SITE01_SHADOW_PREVIEW.png", surf, roi_records, candidates)

    manifest = {
        "generated_utc": dt.datetime.now(dt.timezone.utc).isoformat().replace("+00:00", "Z"),
        "script": str(Path(__file__).resolve()),
        "python": sys.version,
        "platform": platform.platform(),
        "numpy": np.__version__,
        "spiceypy": __import__("spiceypy").__version__,
        "input_files": {str(p): {"sha256": sha256(p), "size_bytes": p.stat().st_size} for p in [*files.values(), *clone_files.values(), args.roi_shapefile]},
        "source_urls": SOURCE_URLS,
        "grid": {"width": surf.width, "height": surf.height, "pixel_x_m": surf.pixel_x, "pixel_y_m": surf.pixel_y, "first_center_x_m": surf.first_center_x, "first_center_y_m": surf.first_center_y, "raster_type": surf.raster_type, "nodata": "NaN"},
        "projection": {"description": "South-polar stereographic, standard parallel -90 deg, central meridian 0 deg, spherical inverse used for local geometry", "map_units": "m", "frame": FRAME, "moon_radius_m": MOON_RADIUS_M, "longitude_inference": "not exposed; conventional x=east/y=north formula used only to transform local geometry"},
        "spice_coverage": coverage,
        "rois": roi_stats,
        "candidate_count": len(candidates),
        "selected_shadow_candidates": [c["candidate_id"] for c in selected_for_shadow],
        "epochs_utc": epochs,
        "heights_m": [1.0, 5.0],
        "ray_trace": {"interpolation": "bilinear", "step_m": args.step_m, "max_range_m": args.max_range_m, "edge_handling": "stop at first invalid/out-of-raster sample and flag edge_truncated", "shadow_margin_threshold_deg": 0.02},
        "uncertainty": {"clone_files": list(clones), "method": "repeat selected-candidate ray traces across available clone001/050/100 error DEM products", "confidence": "not estimated; three available clones are a representative sensitivity run, not a statistical confidence interval"},
    }
    (out / "SITE01_ANALYSIS_MANIFEST.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"out_dir": str(out), "candidate_count": len(candidates), "roi_stats": roi_stats, "selected_shadow_candidates": [c["candidate_id"] for c in selected_for_shadow], "spice_coverage": coverage}, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
