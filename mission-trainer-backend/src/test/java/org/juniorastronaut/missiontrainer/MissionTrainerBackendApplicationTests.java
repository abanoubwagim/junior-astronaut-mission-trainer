package org.juniorastronaut.missiontrainer;

import org.juniorastronaut.missiontrainer.api.MissionDtos.DecisionHistoryRequest;
import org.juniorastronaut.missiontrainer.api.MissionDtos.DecisionInput;
import org.juniorastronaut.missiontrainer.api.MissionDtos.DecisionFeedback;
import org.juniorastronaut.missiontrainer.api.MissionDtos.MissionResponse;
import org.juniorastronaut.missiontrainer.api.MissionDtos.ResourceBreakdown;
import org.juniorastronaut.missiontrainer.api.MissionDtos.ResourceValues;
import org.juniorastronaut.missiontrainer.game.MissionRulesService;
import org.juniorastronaut.missiontrainer.game.MissionRulesService.GameRequestException;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.env.Environment;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class MissionTrainerBackendApplicationTests {
    private static final List<List<String>> CHOICES_BY_DAY = List.of(
            List.of("clean_solar_array", "connect_spare_battery", "prepare_storm_shelter"),
            List.of("service_water_recycler", "use_backup_water_pack", "inspect_co2_removal_loop"),
            List.of("start_grow_light_tray", "open_meal_crate"),
            List.of("full_storm_shelter", "passive_storm_shelter")
    );

    @Autowired
    private MissionRulesService rules;

    @Autowired
    private Environment environment;

    private final HttpClient http = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();

    @Test
    void startReturnsCanonicalCurrentRulesState() {
        MissionResponse start = rules.startMission();

        assertEquals("ACTIVE", start.status());
        assertEquals(1, start.day());
        assertEquals(new ResourceValues(12, 12, 10, 8), start.resources());
        assertEquals(3, start.event().choices().size());
        assertFalse(start.systems().airLoopServiced());
        assertFalse(start.systems().shieldingPrepared());
        assertFalse(start.systems().shelterActivated());
        assertFalse(start.systems().protectionReady());
    }

    @Test
    void everyPathMatchesAnIndependentTransitionModel() {
        int checkedPaths = 0;
        for (String day1 : CHOICES_BY_DAY.get(0)) {
            for (String day2 : CHOICES_BY_DAY.get(1)) {
                for (String day3 : CHOICES_BY_DAY.get(2)) {
                    for (String day4 : CHOICES_BY_DAY.get(3)) {
                        checkedPaths++;
                        List<String> choices = List.of(day1, day2, day3, day4);
                        ExpectedState expected = new ExpectedState();
                        List<DecisionInput> history = new ArrayList<>();
                        for (int day = 1; day <= 4; day++) {
                            history.add(new DecisionInput(day, choices.get(day - 1)));
                            ExpectedDay expectedDay = expected.apply(day, choices.get(day - 1));
                            MissionResponse actual = rules.replay(new DecisionHistoryRequest(List.copyOf(history)));
                            assertDayMatches(expectedDay, actual, day, choices.toString());

                            if (!"ACTIVE".equals(expectedDay.status())) {
                                if (day < 4) {
                                    List<DecisionInput> fullHistory = choices.stream()
                                            .map(choice -> new DecisionInput(choices.indexOf(choice) + 1, choice))
                                            .toList();
                                    GameRequestException exception = assertThrows(GameRequestException.class,
                                            () -> rules.replay(new DecisionHistoryRequest(fullHistory)));
                                    assertEquals("POST_TERMINAL_DECISION", exception.code());
                                }
                                break;
                            }
                        }
                    }
                }
            }
        }
        assertEquals(36, checkedPaths);
    }

    @Test
    void eightApprovedScenariosHaveCorrectFinalStatesAndReasons() {
        assertScenario(List.of("clean_solar_array", "service_water_recycler", "start_grow_light_tray", "full_storm_shelter"),
                new ResourceValues(1, 6, 6, 6), "SUCCEEDED", null);
        assertScenario(List.of("clean_solar_array", "service_water_recycler", "open_meal_crate", "full_storm_shelter"),
                new ResourceValues(2, 7, 5, 6), "SUCCEEDED", null);
        assertScenario(List.of("connect_spare_battery", "service_water_recycler", "start_grow_light_tray", "full_storm_shelter"),
                new ResourceValues(0, 6, 6, 6), "FAILED", "POWER_REACHED_ZERO");
        assertScenario(List.of("connect_spare_battery", "service_water_recycler", "open_meal_crate", "full_storm_shelter"),
                new ResourceValues(1, 7, 5, 6), "SUCCEEDED", null);
        assertScenario(List.of("prepare_storm_shelter", "service_water_recycler", "open_meal_crate", "passive_storm_shelter"),
                new ResourceValues(1, 7, 5, 9), "SUCCEEDED", null);
        assertScenario(List.of("prepare_storm_shelter", "inspect_co2_removal_loop", "start_grow_light_tray", "passive_storm_shelter"),
                new ResourceValues(2, 3, 6, 9), "SUCCEEDED", null);
        assertScenario(List.of("clean_solar_array", "service_water_recycler", "open_meal_crate", "passive_storm_shelter"),
                new ResourceValues(4, 7, 5, 4), "FAILED", "PASSIVE_SHELTER_REQUIRES_PREPARED_SHIELDING");
        assertScenario(List.of("prepare_storm_shelter", "use_backup_water_pack", "open_meal_crate", "passive_storm_shelter"),
                new ResourceValues(0, 8, 5, 9), "FAILED", "POWER_REACHED_ZERO");
    }

    @Test
    void waterRecoveryIsAppliedOnceAndGrowHarvestPrecedesTerminalCheck() {
        MissionResponse recycler = replay(List.of(
                "clean_solar_array", "service_water_recycler", "start_grow_light_tray", "full_storm_shelter"));

        assertEquals(new ResourceValues(1, 6, 6, 6), recycler.resources());
        ResourceBreakdown day3Water = replayPrefix(List.of(
                "clean_solar_array", "service_water_recycler", "start_grow_light_tray"))
                .latestDecision().resourceBreakdown().get("water");
        assertEquals(-2, day3Water.daily());
        assertEquals(1, day3Water.delayed());
        assertEquals(-1, day3Water.choice());

        MissionResponse growDay4 = replay(List.of(
                "clean_solar_array", "service_water_recycler", "start_grow_light_tray", "full_storm_shelter"));
        ResourceBreakdown day4Food = growDay4.latestDecision().resourceBreakdown().get("food");
        assertEquals(-2, day4Food.daily());
        assertEquals(4, day4Food.delayed());
        assertEquals(6, day4Food.after());
        assertEquals("SUCCEEDED", growDay4.status());
    }

    @Test
    void co2LoopOnlyChangesLaterPowerAndDoesNotCreateWaterOrOxygen() {
        MissionResponse day2 = replayPrefix(List.of("connect_spare_battery", "inspect_co2_removal_loop"));
        assertTrue(day2.systems().airLoopServiced());
        assertEquals(new ResourceValues(8, 8, 6, 6), day2.resources());

        MissionResponse day3 = replayPrefix(List.of(
                "connect_spare_battery", "inspect_co2_removal_loop", "open_meal_crate"));
        ResourceBreakdown power = day3.latestDecision().resourceBreakdown().get("power");
        ResourceBreakdown water = day3.latestDecision().resourceBreakdown().get("water");
        assertEquals(-1, power.daily());
        assertEquals(0, power.delayed());
        assertEquals(0, water.choice());
        assertFalse(day3.toString().contains("oxygen"));
    }

    @Test
    void shelterPreparationAndActivationAreSeparateStates() {
        MissionResponse prepared = replayPrefix(List.of("prepare_storm_shelter"));
        assertTrue(prepared.systems().shieldingPrepared());
        assertFalse(prepared.systems().shelterActivated());
        assertFalse(prepared.systems().protectionReady());

        MissionResponse passivePrepared = replay(List.of(
                "prepare_storm_shelter", "inspect_co2_removal_loop", "open_meal_crate", "passive_storm_shelter"));
        assertTrue(passivePrepared.systems().shelterActivated());
        assertEquals("PASSIVE", passivePrepared.systems().shelterMode());
        assertTrue(passivePrepared.systems().protectionReady());

        MissionResponse emergency = replay(List.of(
                "connect_spare_battery", "service_water_recycler", "open_meal_crate", "full_storm_shelter"));
        assertTrue(emergency.systems().shelterActivated());
        assertEquals("FULL", emergency.systems().shelterMode());
        assertFalse(emergency.systems().shieldingPrepared());
        assertTrue(emergency.systems().emergencyProtectionActivated());
        assertTrue(emergency.systems().protectionReady());

        MissionResponse passiveUnprepared = replay(List.of(
                "clean_solar_array", "service_water_recycler", "open_meal_crate", "passive_storm_shelter"));
        assertFalse(passiveUnprepared.systems().protectionReady());
        assertEquals("PASSIVE_SHELTER_REQUIRES_PREPARED_SHIELDING",
                passiveUnprepared.result().primaryFailureReason());
    }

    @Test
    void boundsAndFailurePriorityAreDeterministic() {
        MissionResponse cappedWater = replayPrefix(List.of("connect_spare_battery", "use_backup_water_pack"));
        assertEquals(12, cappedWater.resources().water());

        MissionResponse zeroPower = replayPrefix(List.of(
                "prepare_storm_shelter", "use_backup_water_pack", "start_grow_light_tray"));
        assertEquals(0, zeroPower.resources().power());
        assertEquals("POWER_REACHED_ZERO", zeroPower.result().primaryFailureReason());
    }

    @Test
    void identicalHistoriesProduceIdenticalResults() {
        DecisionHistoryRequest history = new DecisionHistoryRequest(history(List.of(
                "prepare_storm_shelter", "inspect_co2_removal_loop", "start_grow_light_tray",
                "passive_storm_shelter")));

        assertEquals(rules.replay(history), rules.replay(history));
    }

    @Test
    void rejectsMalformedHistories() {
        assertError("EMPTY_HISTORY", () -> rules.replay(null));
        assertError("EMPTY_HISTORY", () -> rules.replay(new DecisionHistoryRequest(List.of())));
        assertError("INVALID_HISTORY", () -> rules.replay(new DecisionHistoryRequest(
                List.of(new DecisionInput(2, "service_water_recycler")))));
        assertError("INVALID_HISTORY", () -> rules.replay(new DecisionHistoryRequest(
                List.of(new DecisionInput(1, "clean_solar_array"),
                        new DecisionInput(1, "connect_spare_battery")))));
        assertError("INVALID_CHOICE", () -> rules.replay(new DecisionHistoryRequest(
                List.of(new DecisionInput(1, "inspect_co2_removal_loop")))));
    }

    @Test
    void canonicalHttpRoutesUseTheCurrentContract() throws Exception {
        HttpResponse<String> health = get("/api/v1/health");
        assertEquals(200, health.statusCode());
        assertTrue(health.body().contains("\"status\":\"UP\""));

        HttpResponse<String> start = post("/api/v1/missions/start", "");
        assertEquals(200, start.statusCode());
        assertTrue(start.body().contains("\"clean_solar_array\""));

        HttpResponse<String> afterDay1 = post("/api/v1/missions/decisions",
                "{\"decisions\":["
                        + "{\"day\":1,\"choiceId\":\"clean_solar_array\"}]}" );
        assertEquals(200, afterDay1.statusCode());
        assertTrue(afterDay1.body().contains("\"inspect_co2_removal_loop\""));

        String winningHistory = "{\"decisions\":["
                + "{\"day\":1,\"choiceId\":\"clean_solar_array\"},"
                + "{\"day\":2,\"choiceId\":\"service_water_recycler\"},"
                + "{\"day\":3,\"choiceId\":\"start_grow_light_tray\"},"
                + "{\"day\":4,\"choiceId\":\"full_storm_shelter\"}]}";
        HttpResponse<String> result = post("/api/v1/missions/decisions", winningHistory);
        assertEquals(200, result.statusCode());
        assertTrue(result.body().contains("\"status\":\"SUCCEEDED\""));
        assertTrue(result.body().contains("\"water\":6"));
        assertTrue(result.body().contains("\"food\":6"));

        HttpResponse<String> invalidHistory = post("/api/v1/missions/decisions",
                "{\"decisions\":[{\"day\":2,\"choiceId\":\"service_water_recycler\"}]}" );
        assertEquals(400, invalidHistory.statusCode());
        assertTrue(invalidHistory.body().contains("\"code\":\"INVALID_HISTORY\""));

        HttpResponse<String> invalidChoice = post("/api/v1/missions/decisions",
                "{\"decisions\":[{\"day\":1,\"choiceId\":\"not-a-choice\"}]}" );
        assertEquals(400, invalidChoice.statusCode());
        assertTrue(invalidChoice.body().contains("\"code\":\"INVALID_CHOICE\""));

        HttpResponse<String> forgedResources = post("/api/v1/missions/decisions",
                "{\"resources\":{\"power\":0},\"decisions\":[{\"day\":1,\"choiceId\":\"clean_solar_array\"}]}" );
        assertEquals(200, forgedResources.statusCode());
        assertTrue(forgedResources.body().contains("\"power\":9"));

        HttpResponse<String> malformed = post("/api/v1/missions/decisions", "{");
        assertEquals(400, malformed.statusCode());
        assertTrue(malformed.body().contains("\"code\":\"MALFORMED_REQUEST\""));

        HttpResponse<String> postTerminal = post("/api/v1/missions/decisions",
                "{\"decisions\":["
                        + "{\"day\":1,\"choiceId\":\"prepare_storm_shelter\"},"
                        + "{\"day\":2,\"choiceId\":\"use_backup_water_pack\"},"
                        + "{\"day\":3,\"choiceId\":\"start_grow_light_tray\"},"
                        + "{\"day\":4,\"choiceId\":\"passive_storm_shelter\"}]}" );
        assertEquals(400, postTerminal.statusCode());
        assertTrue(postTerminal.body().contains("\"code\":\"POST_TERMINAL_DECISION\""));

        HttpResponse<String> removedV2Route = post("/api/v2/missions/start", "");
        assertEquals(404, removedV2Route.statusCode());
    }

    private void assertScenario(List<String> choices, ResourceValues expectedResources,
                                String expectedStatus, String expectedReason) {
        MissionResponse response = replay(choices);
        assertEquals(expectedResources, response.resources(), choices.toString());
        assertEquals(expectedStatus, response.status(), choices.toString());
        if (expectedReason == null) {
            assertNull(response.result().primaryFailureReason());
        } else {
            assertEquals(expectedReason, response.result().primaryFailureReason());
        }
    }

    private MissionResponse replay(List<String> choices) {
        return rules.replay(new DecisionHistoryRequest(history(choices)));
    }

    private MissionResponse replayPrefix(List<String> choices) {
        return replay(choices);
    }

    private List<DecisionInput> history(List<String> choices) {
        List<DecisionInput> history = new ArrayList<>();
        for (int index = 0; index < choices.size(); index++) {
            history.add(new DecisionInput(index + 1, choices.get(index)));
        }
        return List.copyOf(history);
    }

    private void assertDayMatches(ExpectedDay expected, MissionResponse actual,
                                    int day, String path) {
        assertEquals(expected.status, actual.status(), path + " Day " + day + " status");
        assertEquals(new ResourceValues(expected.resources[0], expected.resources[1],
                        expected.resources[2], expected.resources[3]),
                actual.resources(), path + " Day " + day + " resources");
        assertNotNull(actual.latestDecision(), path + " Day " + day + " feedback");

        DecisionFeedback feedback = actual.latestDecision();
        Map<String, ResourceBreakdown> breakdown = feedback.resourceBreakdown();
        String[] keys = {"power", "water", "food", "shelterReadiness"};
        for (int resource = 0; resource < keys.length; resource++) {
            ResourceBreakdown value = breakdown.get(keys[resource]);
            assertNotNull(value, path + " Day " + day + " breakdown " + keys[resource]);
            assertEquals(expected.before[resource], value.before(), keys[resource] + " before");
            assertEquals(expected.daily[resource], value.daily(), keys[resource] + " daily");
            assertEquals(expected.delayed[resource], value.delayed(), keys[resource] + " delayed");
            assertEquals(expected.event[resource], value.event(), keys[resource] + " event");
            assertEquals(expected.choice[resource], value.choice(), keys[resource] + " choice");
            assertEquals(expected.resources[resource], value.after(), keys[resource] + " after");
            assertEquals(expected.resources[resource] - expected.before[resource], value.change(),
                    keys[resource] + " net change");
        }

        if ("ACTIVE".equals(expected.status)) {
            assertEquals(day + 1, actual.day());
            assertEquals(day + 1, actual.event().day());
            assertNull(actual.result());
        } else {
            assertEquals(day, actual.day());
            assertNull(actual.event());
            assertEquals(expected.status, actual.result().status());
            assertEquals(expected.reason, actual.result().primaryFailureReason());
        }
    }

    private void assertError(String code, org.junit.jupiter.api.function.Executable action) {
        GameRequestException exception = assertThrows(GameRequestException.class, action);
        assertEquals(code, exception.code());
        assertNotNull(exception.getMessage());
    }

    private URI baseUri(String path) {
        String port = environment.getProperty("local.server.port");
        assertNotNull(port);
        return URI.create("http://127.0.0.1:" + port + path);
    }

    private HttpResponse<String> post(String path, String body) throws Exception {
        return http.send(HttpRequest.newBuilder(baseUri(path))
                        .timeout(Duration.ofSeconds(5))
                        .header("Content-Type", "application/json")
                        .POST(HttpRequest.BodyPublishers.ofString(body))
                        .build(), HttpResponse.BodyHandlers.ofString());
    }

    private HttpResponse<String> get(String path) throws Exception {
        return http.send(HttpRequest.newBuilder(baseUri(path))
                        .timeout(Duration.ofSeconds(5))
                        .GET()
                        .build(), HttpResponse.BodyHandlers.ofString());
    }

    private static final class ExpectedState {
        private final int[] resources = {12, 12, 10, 8};
        private boolean solarArrayReady;
        private boolean waterSaver;
        private boolean growLightHarvestPending;
        private boolean airLoopServiced;
        private boolean shieldingPrepared;
        private boolean shelterActivated;
        private boolean emergencyProtectionActivated;
        private String shelterMode;

        private ExpectedDay apply(int day, String choiceId) {
            int[] before = resources.clone();
            int[] daily = {
                    airLoopServiced && day >= 3 ? -1 : -2,
                    -2,
                    -2,
                    shieldingPrepared && day >= 2 ? 0 : -1
            };
            int[] delayed = {
                    solarArrayReady && day >= 2 ? 1 : 0,
                    waterSaver && day >= 3 ? 1 : 0,
                    growLightHarvestPending && day == 4 ? 4 : 0,
                    0
            };
            int[] event = {0, 0, 0, day == 4 ? -2 : 0};
            int[] choice = new int[4];

            switch (choiceId) {
                case "clean_solar_array" -> {
                    choice[0] = -1;
                    solarArrayReady = true;
                }
                case "connect_spare_battery" -> choice[0] = 1;
                case "prepare_storm_shelter" -> {
                    choice[0] = -1;
                    choice[3] = 2;
                    shieldingPrepared = true;
                }
                case "service_water_recycler" -> {
                    choice[0] = -1;
                    choice[1] = 1;
                    waterSaver = true;
                }
                case "use_backup_water_pack" -> {
                    choice[0] = -3;
                    choice[1] = 5;
                }
                case "inspect_co2_removal_loop" -> {
                    choice[0] = -1;
                    airLoopServiced = true;
                }
                case "start_grow_light_tray" -> {
                    choice[0] = -2;
                    choice[1] = -1;
                    growLightHarvestPending = true;
                }
                case "open_meal_crate" -> {
                    choice[0] = -1;
                    choice[2] = 3;
                }
                case "full_storm_shelter" -> {
                    choice[0] = shieldingPrepared ? -1 : -2;
                    choice[3] = 4;
                    shelterActivated = true;
                    shelterMode = "FULL";
                    if (!shieldingPrepared) emergencyProtectionActivated = true;
                }
                case "passive_storm_shelter" -> {
                    choice[3] = 2;
                    shelterActivated = true;
                    shelterMode = "PASSIVE";
                }
                default -> throw new AssertionError("Unexpected choice: " + choiceId);
            }

            for (int index = 0; index < resources.length; index++) {
                resources[index] = Math.max(0, Math.min(12,
                        before[index] + daily[index] + delayed[index] + event[index] + choice[index]));
            }

            String reason = null;
            if (resources[0] == 0) reason = "POWER_REACHED_ZERO";
            else if (resources[1] == 0) reason = "WATER_REACHED_ZERO";
            else if (resources[2] == 0) reason = "FOOD_REACHED_ZERO";
            else if (resources[3] == 0) reason = "SHELTER_READINESS_REACHED_ZERO";
            else if (day == 4 && "PASSIVE".equals(shelterMode) && !shieldingPrepared) {
                reason = "PASSIVE_SHELTER_REQUIRES_PREPARED_SHIELDING";
            } else if (day == 4 && resources[3] < 6) {
                reason = "SHELTER_READINESS_BELOW_THRESHOLD";
            } else if (day == 4 && !shelterActivated) {
                reason = "SHELTER_NOT_ACTIVATED";
            } else if (day == 4 && !(shelterActivated
                    && (shieldingPrepared || emergencyProtectionActivated))) {
                reason = "PROTECTION_NOT_READY";
            }

            String status = reason == null ? (day == 4 ? "SUCCEEDED" : "ACTIVE") : "FAILED";
            if (day == 4) growLightHarvestPending = false;
            return new ExpectedDay(before, daily, delayed, event, choice, resources.clone(), status, reason);
        }
    }

    private record ExpectedDay(
            int[] before,
            int[] daily,
            int[] delayed,
            int[] event,
            int[] choice,
            int[] resources,
            String status,
            String reason
    ) {
    }
}
