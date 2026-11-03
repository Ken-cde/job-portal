package com.jobportal.job_portal.service;

import com.jobportal.job_portal.dto.AiAnalysisResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
public class AiService {

    private final RestTemplate restTemplate;

    @Value("${GOOGLE_API_KEY:${GEMINI_API_KEY:your-google-api-key}}")
    private String apiKey;

    @Value("${GEMINI_MODEL:}")
    private String configuredModel;

    private volatile String resolvedModel;
    private volatile String resolvedApiVersion;

    private static final String[] FALLBACK_MODELS = new String[] {
            "gemini-2.5-flash",
            "gemini-2.5-flash-lite",
            "gemini-2.0-flash",
            "gemini-2.0-flash-lite",
            "gemini-1.5-flash",
            "gemini-1.5-flash-latest",
            "gemini-1.5-flash-002",
            "gemini-1.5-pro",
            "gemini-flash-latest",
            "gemini-pro-latest"
    };

    private static final String[] API_VERSIONS = new String[] {"v1", "v1beta"};

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

        String cleanedJson = extractJsonObject(content);

        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            return mapper.readValue(cleanedJson, AiAnalysisResponse.class);
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse AI JSON response: " + e.getMessage() + " (raw: " + truncate(content, 300) + ")");
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
            String cleanedJson = extractJsonObject(content);

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
            String cleanedJson = extractJsonObject(content);

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

        // Candidate models: configured first, then discovered models, then common fallbacks.
        LinkedHashSet<String> candidateModels = new LinkedHashSet<>();
        if (configuredModel != null && !configuredModel.isBlank()) {
            candidateModels.add(configuredModel.trim());
        }
        if (resolvedModel != null && !resolvedModel.isBlank()) {
            candidateModels.add(resolvedModel.trim());
        }
        try {
            for (String discovered : discoverModels()) {
                if (discovered != null && !discovered.isBlank()) {
                    candidateModels.add(discovered.trim());
                }
            }
        } catch (Exception ignored) {
            // Discovery is best-effort; fall through to configured/fallback models.
        }
        for (String m : FALLBACK_MODELS) {
            if (m != null && !m.isBlank()) {
                candidateModels.add(m);
            }
        }

        List<String> tried = new ArrayList<>();
        Exception lastError = null;

        for (String candidateModel : candidateModels) {
            for (String apiVersion : API_VERSIONS) {
                String url = String.format("https://generativelanguage.googleapis.com/%s/models/%s:generateContent",
                        apiVersion, candidateModel);
                tried.add(apiVersion + ":" + candidateModel);

                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_JSON);
                headers.set("x-goog-api-key", apiKey);

                Map<String, Object> requestBody = new HashMap<>();
                // Use camelCase field names expected by the REST API.
                requestBody.put("systemInstruction", Map.of(
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

                try {
                    ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);
                    if (response.getBody() == null) {
                        throw new RuntimeException("Empty response from Gemini");
                    }

                    List<?> candidates = (List<?>) response.getBody().get("candidates");
                    if (candidates == null || candidates.isEmpty()) {
                        throw new RuntimeException("No candidates returned by Gemini");
                    }

                    Map<?, ?> candidate = (Map<?, ?>) candidates.get(0);
                    Map<?, ?> contentObj = (Map<?, ?>) candidate.get("content");
                    if (contentObj == null) {
                        throw new RuntimeException("Gemini response had no content");
                    }

                    List<?> parts = (List<?>) contentObj.get("parts");
                    if (parts == null || parts.isEmpty()) {
                        throw new RuntimeException("Gemini response had no parts");
                    }

                    Object text = ((Map<?, ?>) parts.get(0)).get("text");
                    if (text == null) {
                        throw new RuntimeException("Gemini response text was empty");
                    }

                    System.err.println("AI raw response preview (" + candidateModel + "/" + apiVersion + "): " + truncate(String.valueOf(text), 1000));
                    resolvedModel = candidateModel;
                    resolvedApiVersion = apiVersion;
                    return String.valueOf(text);
                } catch (Exception e) {
                    String msg = String.valueOf(e.getMessage());
                    // Fail fast for auth/permission issues (same for every model/version).
                    if (msg.contains("401") || msg.contains("403")
                            || msg.toLowerCase().contains("api key")
                            || msg.toLowerCase().contains("permission")) {
                        throw new RuntimeException("Gemini request failed: " + msg);
                    }
                    lastError = e;
                }
            }
        }

        String detail = lastError != null ? lastError.getMessage() : "unknown error";
        throw new RuntimeException("Gemini request failed (tried: " + String.join(", ", tried) +
                "; resolved=" + (resolvedModel == null ? "none" : resolvedModel) + "): " + detail);
    }

    private List<String> discoverModels() {
        List<String> result = new ArrayList<>();
        String encodedKey = java.net.URLEncoder.encode(apiKey, java.nio.charset.StandardCharsets.UTF_8);
        String listUrl = "https://generativelanguage.googleapis.com/v1beta/models?key=" + encodedKey;

        ResponseEntity<Map> response = restTemplate.getForEntity(listUrl, Map.class);
        if (response.getBody() == null) {
            return result;
        }

        List<?> models = (List<?>) response.getBody().get("models");
        if (models == null) {
            return result;
        }

        for (Object obj : models) {
            if (!(obj instanceof Map)) continue;
            Map<?, ?> m = (Map<?, ?>) obj;
            Object methods = m.get("supportedGenerationMethods");
            if (!(methods instanceof List)) continue;

            boolean supportsGenerate = false;
            for (Object method : (List<?>) methods) {
                if ("generateContent".equals(String.valueOf(method))) {
                    supportsGenerate = true;
                    break;
                }
            }
            if (!supportsGenerate) continue;

            String name = String.valueOf(m.get("name"));
            if (name.startsWith("models/")) {
                name = name.substring("models/".length());
            }
            if (!name.isBlank()) {
                result.add(name);
            }
        }

        return result;
    }

    private String extractJsonObject(String text) {
        if (text == null || text.isBlank()) {
            throw new RuntimeException("Empty AI response");
        }

        int fenceStart = text.indexOf("```json");
        if (fenceStart >= 0) {
            int contentStart = text.indexOf('{', fenceStart);
            int contentEnd = text.lastIndexOf('}');
            if (contentStart >= 0 && contentEnd > contentStart) {
                return text.substring(contentStart, contentEnd + 1).trim();
            }
        }

        int start = text.indexOf('{');
        if (start < 0) {
            System.err.println("AI response contained no JSON object. Raw preview: " + truncate(text, 1000));
            throw new RuntimeException("No JSON object found in AI response");
        }

        int depth = 0;
        boolean inString = false;
        boolean escaping = false;
        for (int i = start; i < text.length(); i++) {
            char c = text.charAt(i);
            if (inString) {
                if (escaping) {
                    escaping = false;
                } else if (c == '\\') {
                    escaping = true;
                } else if (c == '"') {
                    inString = false;
                }
                continue;
            }

            if (c == '"') {
                inString = true;
            } else if (c == '{') {
                depth++;
            } else if (c == '}') {
                depth--;
                if (depth == 0) {
                    return text.substring(start, i + 1).trim();
                }
            }
        }

        throw new RuntimeException("Unterminated JSON object in AI response");
    }

    private String truncate(String text, int max) {
        if (text == null) return null;
        return text.length() <= max ? text : text.substring(0, max) + "...";
    }
}
