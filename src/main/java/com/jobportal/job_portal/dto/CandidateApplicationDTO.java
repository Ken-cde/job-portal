package com.jobportal.job_portal.dto;

public class CandidateApplicationDTO {

    private Long applicationId;
    private Long jobId;
    private String jobTitle;
    private String company;
    private String status;

    public CandidateApplicationDTO(Long applicationId, Long jobId, String jobTitle, String company, String status) {
        this.applicationId = applicationId;
        this.jobId = jobId;
        this.jobTitle = jobTitle;
        this.company = company;
        this.status = status;
    }

    public Long getApplicationId() { return applicationId; }
    public Long getJobId() { return jobId; }
    public String getJobTitle() { return jobTitle; }
    public String getCompany() { return company; }
    public String getStatus() { return status; }
}