package org.juniorastronaut.missiontrainer;

import org.juniorastronaut.missiontrainer.api.MissionDtos.Choice;
import org.juniorastronaut.missiontrainer.api.MissionDtos.DecisionHistoryRequest;
import org.juniorastronaut.missiontrainer.api.MissionDtos.DecisionInput;
import org.juniorastronaut.missiontrainer.api.MissionDtos.MissionResponse;
import org.juniorastronaut.missiontrainer.game.MissionRulesService;
import org.juniorastronaut.missiontrainer.game.MissionRulesService.GameRequestException;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class MissionTrainerBackendApplicationTests {
    private final MissionRulesService rules = new MissionRulesService();

    @Test
    void startReturnsTheCurrentDayOneContract() {
        MissionResponse response = rules.startMission();

        assertEquals("ACTIVE", response.status());
        assertEquals(1, response.day());
        assertEquals(4, response.totalDays());
        assertEquals("POWER DROP", response.event().title());
        assertEquals(List.of("use_stored_energy", "begin_vsat_deployment", "reduce_non_essential_loads"),
                response.event().choices().stream().map(Choice::id).toList());
    }

    @Test
    void dayOneDecisionOpensWaterAlertAndPreservesHistory() {
        MissionResponse response = replay(
                new DecisionInput(1, "reduce_non_essential_loads"));

        assertEquals("ACTIVE", response.status());
        assertEquals(2, response.day());
        assertEquals("WATER QUALITY ALERT", response.event().title());
        assertEquals(1, response.decisionHistory().size());
        assertEquals("REDUCED", response.qualitativeState().powerDemand());
    }

    @Test
    void dayTwoDecisionCarriesPotableWaterAndVerificationStatesSeparately() {
        MissionResponse response = replay(
                new DecisionInput(1, "reduce_non_essential_loads"),
                new DecisionInput(2, "inspect_reprocess_water"));

        assertEquals("ACTIVE", response.status());
        assertEquals(3, response.day());
        assertEquals("FOOD SUPPLY WARNING", response.event().title());
        assertEquals("POTABLE_SUPPLY_AVAILABLE", response.qualitativeState().potableWaterSupply());
        assertEquals("RECOVERED_WATER_ISOLATED", response.qualitativeState().recoveredWaterDisposition());
        assertEquals("REPROCESSING_PENDING_VERIFICATION", response.qualitativeState().dayTwoPersistentState());
    }

    @Test
    void dayThreeDecisionOpensDayFourWithTheRequiredShelterStatusAndScienceSources() {
        MissionResponse response = replay(
                new DecisionInput(1, "begin_vsat_deployment"),
                new DecisionInput(2, "conserve_water"),
                new DecisionInput(3, "START_LIMITED_CROP_TRIAL"));

        assertEquals("ACTIVE", response.status());
        assertEquals(4, response.day());
        assertEquals("SOLAR RADIATION ALERT", response.event().title());
        assertEquals("STOPPED", response.qualitativeState().evaStatus());
        assertEquals("STORM_SHELTER", response.qualitativeState().crewLocation());
        assertEquals("AVAILABLE", response.qualitativeState().primaryShielding());
        assertFalse(response.event().scienceSources().isEmpty());
        assertTrue(response.event().scienceSources().stream()
                .allMatch(source -> source.url().startsWith("https://www.nasa.gov/")
                        || source.url().startsWith("https://science.nasa.gov/")
                        || source.url().startsWith("https://srag.jsc.nasa.gov/")));
    }

    @Test
    void everyDayFourChoiceProducesADescriptiveTerminalReport() {
        for (String dayFourChoice : List.of(
                "REPOSITION_WATER_SUPPLIES",
                "REPOSITION_FOOD_SUPPLIES",
                "MAINTAIN_EXISTING_SHIELDING")) {
            MissionResponse response = replay(
                    new DecisionInput(1, "reduce_non_essential_loads"),
                    new DecisionInput(2, "conserve_water"),
                    new DecisionInput(3, "PRESERVE_STORED_FOOD"),
                    new DecisionInput(4, dayFourChoice));

            assertEquals("DAY_4_COMPLETE", response.status(), dayFourChoice);
            assertNull(response.event(), dayFourChoice);
            assertEquals(4, response.decisionHistory().size(), dayFourChoice);
            assertEquals(dayFourChoice, response.latestDecision().choiceId(), dayFourChoice);
            assertNotNull(response.result(), dayFourChoice);
            assertEquals("STORM_SHELTER", response.qualitativeState().crewLocation(), dayFourChoice);
        }
    }

    @Test
    void unverifiedRecoveredWaterIsExcludedButApprovedPotableReserveRemainsEligible() {
        MissionResponse response = replay(
                new DecisionInput(1, "reduce_non_essential_loads"),
                new DecisionInput(2, "inspect_reprocess_water"),
                new DecisionInput(3, "PRESERVE_STORED_FOOD"),
                new DecisionInput(4, "REPOSITION_WATER_SUPPLIES"));

        assertEquals("POTABLE_SUPPLY_AVAILABLE", response.qualitativeState().potableWaterSupply());
        assertEquals("RECOVERED_WATER_ISOLATED", response.qualitativeState().recoveredWaterDisposition());
        assertTrue(response.qualitativeState().approvedWaterForShielding()
                .contains("APPROVED_POTABLE_RESERVE_AVAILABLE"));
        assertEquals("WATER_SUPPLIES_POSITIONED_FOR_SHIELDING",
                response.qualitativeState().supplementaryShielding());
        assertTrue(response.latestDecision().reducedOrDelayed().contains("RECOVERED_WATER_REMAINS_ISOLATED")
                || response.qualitativeState().dayFourOperationalConstraint()
                        .contains("RECOVERED_WATER_REMAINS_ISOLATED"));
    }

    @Test
    void reducedReserveDoesNotMeanPotableSupplyIsAbsentAndLowFoodCanStillBePositioned() {
        MissionResponse waterResponse = replay(
                new DecisionInput(1, "reduce_non_essential_loads"),
                new DecisionInput(2, "use_stored_potable_water"),
                new DecisionInput(3, "START_LIMITED_CROP_TRIAL"),
                new DecisionInput(4, "REPOSITION_WATER_SUPPLIES"));

        assertEquals("POTABLE_SUPPLY_AVAILABLE", waterResponse.qualitativeState().potableWaterSupply());
        assertEquals("WATER_SUPPLIES_POSITIONED_FOR_SHIELDING",
                waterResponse.qualitativeState().supplementaryShielding());

        MissionResponse foodResponse = replay(
                new DecisionInput(1, "reduce_non_essential_loads"),
                new DecisionInput(2, "conserve_water"),
                new DecisionInput(3, "START_LIMITED_CROP_TRIAL"),
                new DecisionInput(4, "REPOSITION_FOOD_SUPPLIES"));

        assertEquals("NOT_HARVEST_READY", foodResponse.qualitativeState().cropGrowth());
        assertEquals("FOOD_SUPPLIES_POSITIONED_FOR_SHIELDING",
                foodResponse.qualitativeState().supplementaryShielding());
    }

    @Test
    void invalidAndOutOfOrderHistoriesAreRejected() {
        GameRequestException missingDayOne = assertThrows(GameRequestException.class,
                () -> rules.replay(new DecisionHistoryRequest(List.of(
                        new DecisionInput(2, "conserve_water")))));
        assertNotNull(missingDayOne.code());

        GameRequestException invalidChoice = assertThrows(GameRequestException.class,
                () -> rules.replay(new DecisionHistoryRequest(List.of(
                        new DecisionInput(1, "not-a-day-one-choice")))));
        assertEquals("INVALID_CHOICE", invalidChoice.code());

        GameRequestException wrongDay = assertThrows(GameRequestException.class,
                () -> replay(
                        new DecisionInput(1, "reduce_non_essential_loads"),
                        new DecisionInput(3, "conserve_water")));
        assertEquals("INCORRECT_DAY", wrongDay.code());
    }

    @Test
    void identicalOrderedHistoriesProduceIdenticalResponses() {
        List<DecisionInput> decisions = List.of(
                new DecisionInput(1, "begin_vsat_deployment"),
                new DecisionInput(2, "conserve_water"),
                new DecisionInput(3, "EXPAND_CROP_PRODUCTION"),
                new DecisionInput(4, "MAINTAIN_EXISTING_SHIELDING"));
        DecisionHistoryRequest request = new DecisionHistoryRequest(decisions);

        assertEquals(rules.replay(request), rules.replay(request));
    }

    private MissionResponse replay(DecisionInput... decisions) {
        return rules.replay(new DecisionHistoryRequest(List.of(decisions)));
    }
}
