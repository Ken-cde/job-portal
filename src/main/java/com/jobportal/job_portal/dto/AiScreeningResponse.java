package com.jobportal.job_portal.dto;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AiScreeningResponse {
    private Long applicationId;
    private String candidateName;
    private Double score;
    private String summary;
}
