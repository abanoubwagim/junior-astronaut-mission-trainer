package org.juniorastronaut.missiontrainer.integration.nasa.service;

import org.juniorastronaut.missiontrainer.core.science.ScientificEvidenceRecord;

import java.util.List;

public interface ScienceEvidenceService {
    List<ScientificEvidenceRecord> currentSolarParticleEvidence();
}
