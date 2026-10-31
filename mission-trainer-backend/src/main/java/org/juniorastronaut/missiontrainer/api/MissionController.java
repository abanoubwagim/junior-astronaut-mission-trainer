package org.juniorastronaut.missiontrainer.api;

import lombok.AllArgsConstructor;
import org.juniorastronaut.missiontrainer.game.MissionRulesService;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

import static org.juniorastronaut.missiontrainer.api.MissionDtos.*;

@RestController
@RequestMapping("/api/v1")
@CrossOrigin(origins = {"http://localhost:5500", "http://127.0.0.1:5500"})
@AllArgsConstructor
public class MissionController {
    private final MissionRulesService rulesService;

    @GetMapping("/health")
    public HealthResponse health() {
        return new HealthResponse("UP");
    }

    @PostMapping("/missions/start")
    public MissionResponse startMission() {
        return rulesService.startMission();
    }

    @PostMapping("/missions/decisions")
    public MissionResponse submitDecisions(@RequestBody DecisionHistoryRequest request) {
        return rulesService.replay(request);
    }
}
