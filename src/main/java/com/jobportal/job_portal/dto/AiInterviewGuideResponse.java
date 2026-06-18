package com.jobportal.job_portal.dto;

import lombok.Data;
import java.util.List;

@Data
public class AiInterviewGuideResponse {
    private String candidateName;
    private String jobTitle;
    private List<String> targetedQuestions;
    private String evaluationFocus;
}
