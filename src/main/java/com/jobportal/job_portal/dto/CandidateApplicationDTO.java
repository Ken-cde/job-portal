package com.jobportal.job_portal.dto;

public class CandidateApplicationDTO {

    private String jobTitle;
    private String company;
    private String status;

    public CandidateApplicationDTO(String jobTitle, String company, String status) {
        this.jobTitle = jobTitle;
        this.company = company;
        this.status = status;
    }

    public String getJobTitle() { return jobTitle; }
    public String getCompany() { return company; }
    public String getStatus() { return status; }
}