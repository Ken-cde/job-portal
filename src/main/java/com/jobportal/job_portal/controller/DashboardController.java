package com.jobportal.job_portal.controller;

import com.jobportal.job_portal.dto.AdminDashboardDTO;
import com.jobportal.job_portal.dto.CandidateDashboardDTO;
import com.jobportal.job_portal.dto.EmployerDashboardDTO;
import com.jobportal.job_portal.model.Application;
import com.jobportal.job_portal.model.ApplicationStatus;
import com.jobportal.job_portal.model.Job;
import com.jobportal.job_portal.model.User;
import com.jobportal.job_portal.repository.ApplicationRepository;
import com.jobportal.job_portal.repository.JobRepository;
import com.jobportal.job_portal.repository.UserRepository;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/dashboard")
public class DashboardController {

    private final UserRepository userRepository;
    private final JobRepository jobRepository;
    private final ApplicationRepository applicationRepository;

    public DashboardController(UserRepository userRepository,
                               JobRepository jobRepository,
                               ApplicationRepository applicationRepository) {
        this.userRepository = userRepository;
        this.jobRepository = jobRepository;
        this.applicationRepository = applicationRepository;
    }

    // ===========================
    // 🟢 CANDIDATE DASHBOARD
    // ===========================

    @PreAuthorize("hasRole('CANDIDATE')")
    @GetMapping("/candidate")
    public CandidateDashboardDTO candidate(Authentication auth) {

        User user = userRepository.findByEmail(auth.getName()).orElseThrow();

        List<Application> applications = applicationRepository.findByUser(user);

        CandidateDashboardDTO dto = new CandidateDashboardDTO();

        dto.applied = applications.size();
        dto.accepted = applications.stream()
                .filter(a -> a.getStatus() == ApplicationStatus.ACCEPTED)
                .count();
        dto.rejected = applications.stream()
                .filter(a -> a.getStatus() == ApplicationStatus.REJECTED)
                .count();
        dto.pending = applications.stream()
                .filter(a -> a.getStatus() == ApplicationStatus.APPLIED)
                .count();

        return dto;
    }

    // ===========================
    // 🟡 EMPLOYER DASHBOARD
    // ===========================

    @PreAuthorize("hasRole('EMPLOYER')")
    @GetMapping("/employer")
    public EmployerDashboardDTO employer(Authentication auth) {

        User user = userRepository.findByEmail(auth.getName()).orElseThrow();

        List<Job> jobs = jobRepository.findByUser(user);

        long totalApplications = jobs.stream()
                .mapToLong(job -> applicationRepository.findByJob(job).size())
                .sum();

        EmployerDashboardDTO dto = new EmployerDashboardDTO();
        dto.myJobs = jobs.size();
        dto.totalApplications = totalApplications;

        return dto;
    }

    // ===========================
    // 🔴 ADMIN DASHBOARD
    // ===========================

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/admin")
    public AdminDashboardDTO admin() {

        AdminDashboardDTO dto = new AdminDashboardDTO();
        dto.totalUsers = userRepository.count();
        dto.totalJobs = jobRepository.count();
        dto.totalApplications = applicationRepository.count();

        return dto;
    }
}
