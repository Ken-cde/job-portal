package com.jobportal.job_portal.service;

import org.apache.tika.Tika;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;

@Service
public class ResumeExtractionService {
    private final Tika tika = new Tika();

    public String extractText(Resource resource) {
        try (InputStream inputStream = resource.getInputStream()) {
            return tika.parseToString(inputStream);
        } catch (Exception e) {
            throw new RuntimeException("Failed to extract text from resume: " + e.getMessage());
        }
    }
}
