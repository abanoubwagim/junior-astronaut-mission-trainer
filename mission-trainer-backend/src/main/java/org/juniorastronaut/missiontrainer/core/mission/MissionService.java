package org.juniorastronaut.missiontrainer.core.mission;

import org.juniorastronaut.missiontrainer.api.MissionDtos.DecisionHistoryRequest;
import org.juniorastronaut.missiontrainer.api.MissionDtos.MissionResponse;

public interface MissionService {
    MissionResponse startMission();

    MissionResponse replay(DecisionHistoryRequest request);
}
