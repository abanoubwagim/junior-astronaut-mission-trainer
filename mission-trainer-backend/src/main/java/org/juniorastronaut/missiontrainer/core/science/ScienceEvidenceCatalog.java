package org.juniorastronaut.missiontrainer.core.science;

import java.time.Instant;
import java.util.List;

/** Curated, attributed research facts. These records never change game values. */
public final class ScienceEvidenceCatalog {
    private static final Instant RETRIEVED = Instant.parse("2026-11-16T00:00:00Z");

    private ScienceEvidenceCatalog() {
    }

    public static List<ScientificEvidenceRecord> dayOne() {
        return List.of(new ScientificEvidenceRecord(
                "NASA Goddard Space Flight Center / LOLA",
                "NASA_SVS_4930_LOLA_ILLUMINATION",
                "https://svs.gsfc.nasa.gov/4930",
                null,
                RETRIEVED,
                null,
                null,
                "NASA simulations use Lunar Reconnaissance Orbiter LOLA terrain mapping to show sunlight and shadow near the lunar south pole.",
                "Lunar south-pole terrain; modelled illumination context, not this base's electrical output",
                "Published simulation coverage includes 2023–2030 at two-hour time steps",
                "Illumination percentage is not a panel power measurement. Site geometry, panel orientation, efficiency, storage, and loads are not modelled here.",
                ScientificDataClassification.NASA_RESEARCH_BASED_FACT,
                ScientificDataStatus.ARCHIVED));
    }

    public static List<ScientificEvidenceRecord> dayTwo() {
        return List.of(
                new ScientificEvidenceRecord(
                        "NASA Johnson Space Center",
                        "NASA_ECLSS_WATER_RECOVERY",
                        "https://www.nasa.gov/reference/jsc-life-support-subsystems/",
                        null,
                        RETRIEVED,
                        null,
                        null,
                        "NASA describes water recovery as one subsystem of environmental control and life support systems.",
                        "ISS and future exploration life-support engineering; not a demonstrated lunar-base recovery rate",
                        "Reference page; no single observation date",
                        "The game alert and qualitative choices are fictional. Recovered water must be verified before use.",
                        ScientificDataClassification.NASA_RESEARCH_BASED_FACT,
                        ScientificDataStatus.ARCHIVED),
                new ScientificEvidenceRecord(
                        "NASA International Space Station Program",
                        "ISS_WATER_RECOVERY_98_PERCENT",
                        "https://www.nasa.gov/missions/station/nasa-achieves-water-recovery-milestone-on-international-space-station/",
                        Instant.parse("2023-06-20T00:00:00Z"),
                        RETRIEVED,
                        98.0,
                        "%",
                        "NASA reported an ISS total water-recovery milestone of about 98% for the U.S. segment.",
                        "International Space Station; context only, not lunar surface capability",
                        "Published 2023-06-20; reported result is not a MoonBase operating parameter",
                        "The 98% ISS result is not used as the game's water-recovery rate and does not establish lunar performance.",
                        ScientificDataClassification.REAL_NASA_DATA,
                        ScientificDataStatus.ARCHIVED));
    }

    public static List<ScientificEvidenceRecord> dayThree() {
        return List.of(new ScientificEvidenceRecord(
                "NASA Biological and Physical Sciences",
                "NASA_SPACE_CROPS_RESEARCH",
                "https://science.nasa.gov/biological-physical/space-crops/",
                null,
                RETRIEVED,
                null,
                null,
                "NASA space-crops research studies how plants and controlled environments may support future human space missions.",
                "ISS and planned lunar research; not an operational lunar farm or crop-yield guarantee",
                "Living research program; individual experiments have their own dates and protocols",
                "No crop production rate, calorie yield, harvest time, or lunar regolith result is inferred for the game.",
                ScientificDataClassification.NASA_RESEARCH_BASED_FACT,
                ScientificDataStatus.ARCHIVED));
    }

    public static List<ScientificEvidenceRecord> gameAssumption(String description) {
        return List.of(new ScientificEvidenceRecord(
                "MoonBase game design",
                "MOONBASE_QUALITATIVE_RULES",
                "https://github.com/abanoubwagim/junior-astronaut-mission-trainer",
                null,
                RETRIEVED,
                null,
                null,
                description,
                "MoonBase fictional educational scenario",
                "One four-day replay",
                "This is not a NASA measurement or engineering prediction.",
                ScientificDataClassification.GAME_ASSUMPTION,
                ScientificDataStatus.ARCHIVED));
    }
}
