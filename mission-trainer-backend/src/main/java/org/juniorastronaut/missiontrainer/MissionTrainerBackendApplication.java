package org.juniorastronaut.missiontrainer;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@org.springframework.boot.context.properties.ConfigurationPropertiesScan
public class MissionTrainerBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(MissionTrainerBackendApplication.class, args);
    }

}
