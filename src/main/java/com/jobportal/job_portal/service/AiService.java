package com.jobportal.job_portal.service;

import com.jobportal.job_portal.dto.AiAnalysisResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class AiService {

    private final RestTemplate restTemplate;

    @Value("${GOOGLE_API_KEY:${GEMINI_API_KEY:your-google-api-key}}")
    private String apiKey;

    @Value("${GEMINI_MODEL:gemini-2.0-flash}")
    private String model;

    private static final String[] FALLBACK_MODELS = new String[] {
            "gemini-2.0-flash",
            "gemini-2.0-flash-lite",
            "gemini-1.5-flash",
            "gemini-1.5-flash-latest",
            "gemini-1.5-flash-002",
            "gemini-1.5-pro"
    };

    public AiService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public AiAnalysisResponse analyzeResume(String resumeText, String jobTitle, String jobRequirements) {
        String systemPrompt = "You are an expert technical recruiter. Analyze the provided resume against the job requirements. " +
                "Provide a match score (0-100), a list of strengths, a list of missing gaps, and 3 concrete suggestions for improvement. " +
                "Return the response ONLY as a valid JSON object with the keys: score, strengths, gaps, suggestions.";

        String userPrompt = String.format("Job Title: %s\nRequirements: %s\n\nResume Text:\n%s",
                jobTitle, jobRequirements, resumeText);

        String content = callGemini(systemPrompt, userPrompt, 1024);

        // Basic cleaning of AI response (removes markdown code blocks if present)
        String cleanedJson = content.replace("```json", "").replace("```", "").trim();

        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            return mapper.readValue(cleanedJson, AiAnalysisResponse.class);
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse AI JSON response: " + e.getMessage());
        }
    }

    public com.jobportal.job_portal.dto.AiScreeningResponse screenApplicant(String candidateName, String resumeText, String jobTitle, String jobRequirements, Long applicationId) {
        String systemPrompt = "You are an expert technical recruiter. Evaluate this candidate for the given role. " +
                "Provide a fit score (0-100) and a concise one-sentence summary of why they are or are not a good fit. " +
                "Return the response ONLY as a valid JSON object with the keys: score, summary.";

        String userPrompt = String.format("Candidate: %s\nJob Title: %s\nRequirements: %s\n\nResume Text:\n%s",
                candidateName, jobTitle, jobRequirements, resumeText);

        try {
            String content = callGemini(systemPrompt, userPrompt, 512);
            String cleanedJson = content.replace("```json", "").replace("```", "").trim();

            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            Map<String, Object> result = mapper.readValue(cleanedJson, Map.class);

            return new com.jobportal.job_portal.dto.AiScreeningResponse(
                    applicationId,
                    candidateName,
                    ((Number) result.get("score")).doubleValue(),
                    (String) result.get("summary")
            );
        } catch (Exception e) {
            return new com.jobportal.job_portal.dto.AiScreeningResponse(applicationId, candidateName, 0.0, "Analysis failed: " + e.getMessage());
        }
    }

    public com.jobportal.job_portal.dto.AiInterviewGuideResponse generateInterviewGuide(String candidateName, String resumeText, String jobTitle, String jobRequirements) {
        String systemPrompt = "You are an expert technical recruiter. Based on the candidate's resume and the job requirements, " +
                "generate a tailored interview guide. Provide 5 specific, challenging questions that probe the candidate's gaps " +
                "and a general focus area for the interviewer. " +
                "Return the response ONLY as a valid JSON object with the keys: targetedQuestions (list of strings), evaluationFocus (string).";

        String userPrompt = String.format("Candidate: %s\nJob Title: %s\nRequirements: %s\n\nResume Text:\n%s",
                candidateName, jobTitle, jobRequirements, resumeText);

        try {
            String content = callGemini(systemPrompt, userPrompt, 1024);
            String cleanedJson = content.replace("```json", "").replace("```", "").trim();

            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            com.jobportal.job_portal.dto.AiInterviewGuideResponse guide = mapper.readValue(cleanedJson, com.jobportal.job_portal.dto.AiInterviewGuideResponse.class);

            guide.setCandidateName(candidateName);
            guide.setJobTitle(jobTitle);

            return guide;
        } catch (Exception e) {
            throw new RuntimeException("Interview Guide generation failed: " + e.getMessage());
        }
    }

    private String callGemini(String systemPrompt, String userPrompt, int maxOutputTokens) {
        if (apiKey == null || apiKey.isBlank() || apiKey.contains("your-google-api-key")) {
            throw new RuntimeException("Google API key is missing or still using the default value");
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("x-goog-api-key", apiKey);

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("system_instruction", Map.of(
                "parts", List.of(Map.of("text", systemPrompt))
        ));
        requestBody.put("contents", List.of(
                Map.of("parts", List.of(Map.of("text", userPrompt)))
        ));
        requestBody.put("generationConfig", Map.of(
                "maxOutputTokens", maxOutputTokens,
                "temperature", 0.2,
                "responseMimeType", "application/json"
        ));

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        // Build a de-duplicated candidate list: configured model first, then common fallbacks.
        java.util.LinkedHashSet<String> modelCandidates = new java.util.LinkedHashSet<>();
        if (model != null && !model.isBlank()) {
            modelCandidates.add(model.trim());
        }
        for (String m : FALLBACK_MODELS) {
            if (m != null && !m.isBlank()) {
                modelCandidates.add(m);
            }
        }

        Exception lastError = null;
        for (String candidateModel : modelCandidates) {
            String url = String.format("https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent", candidateModel);
            try {
                ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);
                if (response.getBody() == null) {
                    throw new RuntimeException("Empty response from Gemini for model " + candidateModel);
                }

                List<?> candidates = (List<?>) response.getBody().get("candidates");
                if (candidates == null || candidates.isEmpty()) {
                    throw new RuntimeException("No candidates returned by Gemini for model " + candidateModel);
                }

                Map<?, ?> candidate = (Map<?, ?>) candidates.get(0);
                Map<?, ?> contentObj = (Map<?, ?>) candidate.get("content");
                if (contentObj == null) {
                    throw new RuntimeException("Gemini response had no content for model " + candidateModel);
                }

                List<?> parts = (List<?>) contentObj.get("parts");
                if (parts == null || parts.isEmpty()) {
                    throw new RuntimeException("Gemini response had no parts for model " + candidateModel);
                }

                Object text = ((Map<?, ?>) parts.get(0)).get("text");
                if (text == null) {
                    throw new RuntimeException("Gemini response text was empty for model " + candidateModel);
                }
                return String.valueOf(text);
            } catch (Exception e) {
                String msg = String.valueOf(e.getMessage());
                // Fail fast for auth/permission issues; otherwise try next model.
                if (msg.contains("401") || msg.contains("403")
                        || msg.toLowerCase().contains("api key") || msg.toLowerCase().contains("permission")) {
                    throw new RuntimeException("Gemini request failed: " + msg);
                }
                lastError = e;
            }
        }

        String tried = String.join(", ", modelCandidates);
        String detail = lastError != null ? lastError.getMessage() : "unknown error";
        throw new RuntimeException("Gemini request failed (tried models: " + tried + "): " + detail);
    }
}
