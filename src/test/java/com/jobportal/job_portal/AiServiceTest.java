package com.jobportal.job_portal;

import com.jobportal.job_portal.service.AiService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

class AiServiceTest {

    @Mock
    private RestTemplate restTemplate;

    @InjectMocks
    private AiService aiService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        ReflectionTestUtils.setField(aiService, "apiKey", "test-google-key");
        ReflectionTestUtils.setField(aiService, "configuredModel", "gemini-2.0-flash");
    }

    @Test
    void analyzeResume_parsesGeminiJson() throws Exception {
        String geminiText = "{\"score\":87,\"strengths\":[\"Spring Boot\",\"React\"],\"gaps\":[\"Redis\"],\"suggestions\":[\"Add Redis experience\"]}";
        Map<String, Object> part = Map.of("text", geminiText);
        Map<String, Object> content = Map.of("parts", List.of(part));
        Map<String, Object> candidate = Map.of("content", content);
        Map<String, Object> body = Map.of("candidates", List.of(candidate));

        when(restTemplate.postForEntity(anyString(), any(), eq(Map.class)))
                .thenReturn(new ResponseEntity<>(body, HttpStatus.OK));

        var result = aiService.analyzeResume("resume text", "Full Stack Engineer", "Spring Boot, React");

        assertEquals(87, result.getScore(), 0.001);
        assertEquals(2, result.getStrengths().size());
        assertEquals("Spring Boot", result.getStrengths().get(0));
    }
}
