package com.jobportal.job_portal.dto;

import java.time.LocalDateTime;

public class ApplicationResponseDTO {

    private Long id;
    private String candidateName;
    private String jobTitle;
    private String status;
    private LocalDateTime appliedAt;

    public ApplicationResponseDTO(Long id,
                                  String candidateName,
                                  String jobTitle,
                                  String status,
                                  LocalDateTime appliedAt) {

        this.id = id;
        this.candidateName = candidateName;
        this.jobTitle = jobTitle;
        this.status = status;
        this.appliedAt = appliedAt;
    }

    public Long getId() { return id; }
    public String getCandidateName() { return candidateName; }
    public String getJobTitle() { return jobTitle; }
    public String getStatus() { return status; }
    public LocalDateTime getAppliedAt() { return appliedAt; }
}