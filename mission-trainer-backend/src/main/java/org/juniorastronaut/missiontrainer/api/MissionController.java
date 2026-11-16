package org.juniorastronaut.missiontrainer.api;

import jakarta.validation.Valid;
import org.juniorastronaut.missiontrainer.core.mission.MissionService;
import org.juniorastronaut.missiontrainer.core.science.ScienceEvidenceMapper;
import org.juniorastronaut.missiontrainer.integration.nasa.service.ScienceEvidenceService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

import static org.juniorastronaut.missiontrainer.api.MissionDtos.*;

@RestController
@RequestMapping("/api/v1")
public class MissionController {
    private final MissionService missionService;
    private final ScienceEvidenceService scienceEvidenceService;

    public MissionController(MissionService missionService, ScienceEvidenceService scienceEvidenceService) {
        this.missionService = missionService;
        this.scienceEvidenceService = scienceEvidenceService;
    }

    @GetMapping("/health")
    public HealthResponse health() {
        return new HealthResponse("UP");
    }

    @PostMapping("/missions/start")
    public MissionResponse startMission() {
        return missionService.startMission();
    }

    @PostMapping("/missions/decisions")
    public MissionResponse submitDecisions(@Valid @RequestBody DecisionHistoryRequest request) {
        return missionService.replay(request);
    }

    /**
     * Context-only live/archived DONKI evidence. It never changes mission
     * replay or returns a dose, shielding percentage, or game resource value.
     */
    @GetMapping("/science/space-weather")
    public List<ScientificEvidenceRecord> spaceWeatherEvidence() {
        return ScienceEvidenceMapper.toApi(scienceEvidenceService.currentSolarParticleEvidence());
    }
}
