package com.jobportal.job_portal.dto;

import java.time.LocalDateTime;

public class ApplicationResponseDTO {

    private Long id;
    private String candidateName;
    private String candidateEmail;
    private String jobTitle;
    private Long jobId;
    private String status;
    private LocalDateTime appliedAt;

    public ApplicationResponseDTO(Long id,
                                  String candidateName,
                                  String candidateEmail,
                                  String jobTitle,
                                  Long jobId,
                                  String status,
                                  LocalDateTime appliedAt) {

        this.id = id;
        this.candidateName = candidateName;
        this.candidateEmail = candidateEmail;
        this.jobTitle = jobTitle;
        this.jobId = jobId;
        this.status = status;
        this.appliedAt = appliedAt;
    }

    public Long getId() { return id; }
    public String getCandidateName() { return candidateName; }
    public String getCandidateEmail() { return candidateEmail; }
    public String getJobTitle() { return jobTitle; }
    public Long getJobId() { return jobId; }
    public String getStatus() { return status; }
    public LocalDateTime getAppliedAt() { return appliedAt; }
}