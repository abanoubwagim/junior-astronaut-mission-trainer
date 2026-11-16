package org.juniorastronaut.missiontrainer.core.mission;

import org.juniorastronaut.missiontrainer.api.MissionDtos.DecisionHistoryRequest;
import org.juniorastronaut.missiontrainer.api.MissionDtos.MissionResponse;
import org.juniorastronaut.missiontrainer.game.MissionRulesService;
import org.springframework.stereotype.Service;

/** Use-case facade that keeps HTTP concerns away from the replay engine. */
@Service
public class MissionServiceImpl implements MissionService {
    private final MissionRulesService rulesService;

    public MissionServiceImpl(MissionRulesService rulesService) {
        this.rulesService = rulesService;
    }

    @Override
    public MissionResponse startMission() {
        return rulesService.startMission();
    }

    @Override
    public MissionResponse replay(DecisionHistoryRequest request) {
        return rulesService.replay(request);
    }
}
