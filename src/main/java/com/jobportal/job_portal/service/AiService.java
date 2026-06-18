package com.jobportal.job_portal.service;

import com.jobportal.job_portal.dto.AiAnalysisResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Service
public class AiService {

    private final RestTemplate restTemplate;

    @Value("${CLAUDE_API_KEY:your-api-key}")
    private String apiKey;

    public AiService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public AiAnalysisResponse analyzeResume(String resumeText, String jobTitle, String jobRequirements) {
        String url = "https://api.anthropic.com/v1/messages";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("x-api-key", apiKey);
        headers.set("anthropic-version", "2023-06-01");

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", "claude-3-sonnet-20240229");
        requestBody.put("max_tokens", 1024);

        String systemPrompt = "You are an expert technical recruiter. Analyze the provided resume against the job requirements. " +
                "Provide a match score (0-100), a list of strengths, a list of missing gaps, and 3 concrete suggestions for improvement. " +
                "Return the response ONLY as a valid JSON object with the keys: score, strengths, gaps, suggestions.";

        String userPrompt = String.format("Job Title: %s\nRequirements: %s\n\nResume Text:\n%s",
                jobTitle, jobRequirements, resumeText);

        requestBody.put("system", systemPrompt);
        requestBody.put("messages", java.util.List.of(
            Map.of("role", "user", "content", userPrompt)
        ));

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);
            String content = (String) ((Map) response.getBody().get("content")).get("text");

            return parseAiJson(content);
        } catch (Exception e) {
            throw new RuntimeException("AI Analysis failed: " + e.getMessage());
        }
    }

    public com.jobportal.job_portal.dto.AiScreeningResponse screenApplicant(String candidateName, String resumeText, String jobTitle, String jobRequirements, Long applicationId) {
        String url = "https://api.anthropic.com/v1/messages";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("x-api-key", apiKey);
        headers.set("anthropic-version", "2023-06-01");

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", "claude-3-sonnet-20240229");
        requestBody.put("max_tokens", 512);

        String systemPrompt = "You are an expert technical recruiter. Evaluate this candidate for the given role. " +
                "Provide a fit score (0-100) and a concise one-sentence summary of why they are or are not a good fit. " +
                "Return the response ONLY as a valid JSON object with the keys: score, summary.";

        String userPrompt = String.format("Candidate: %s\nJob Title: %s\nRequirements: %s\n\nResume Text:\n%s",
                candidateName, jobTitle, jobRequirements, resumeText);

        requestBody.put("system", systemPrompt);
        requestBody.put("messages", java.util.List.of(
            Map.of("role", "user", "content", userPrompt)
        ));

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);
            String content = (String) ((Map) response.getBody().get("content")).get("text");
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
        String url = "https://api.anthropic.com/v1/messages";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("x-api-key", apiKey);
        headers.set("anthropic-version", "2023-06-01");

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", "claude-3-sonnet-20240229");
        requestBody.put("max_tokens", 1024);

        String systemPrompt = "You are an expert technical recruiter. Based on the candidate's resume and the job requirements, " +
                "generate a tailored interview guide. Provide 5 specific, challenging questions that probe the candidate's gaps " +
                "and a general focus area for the interviewer. " +
                "Return the response ONLY as a valid JSON object with the keys: targetedQuestions (list of strings), evaluationFocus (string).";

        String userPrompt = String.format("Candidate: %s\nJob Title: %s\nRequirements: %s\n\nResume Text:\n%s",
                candidateName, jobTitle, jobRequirements, resumeText);

        requestBody.put("system", systemPrompt);
        requestBody.put("messages", java.util.List.of(
            Map.of("role", "user", "content", userPrompt)
        ));

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);
            String content = (String) ((Map) response.getBody().get("content")).get("text");
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


    private AiAnalysisResponse parseAiJson(String jsonText) {
        // Basic cleaning of AI response (removes markdown code blocks if present)
        String cleanedJson = jsonText.replace("```json", "").replace("```", "").trim();

        // We use a simple mapping here; in real implementation, use ObjectMapper
        com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
        try {
            return mapper.readValue(cleanedJson, AiAnalysisResponse.class);
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse AI JSON response: " + e.getMessage());
        }
    }
}
