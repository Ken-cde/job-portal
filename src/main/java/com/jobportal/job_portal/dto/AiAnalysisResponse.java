package com.jobportal.job_portal.dto;

import lombok.Data;
import java.util.List;

@Data
public class AiAnalysisResponse {
    private Double score;
    private List<String> strengths;
    private List<String> gaps;
    private List<String> suggestions;
}
