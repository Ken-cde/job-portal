package com.jobportal.job_portal.controller;

import com.jobportal.job_portal.dto.CandidateApplicationDTO;
import com.jobportal.job_portal.dto.ApplicationResponseDTO;
import com.jobportal.job_portal.model.*;
import com.jobportal.job_portal.repository.*;
import com.jobportal.job_portal.service.EmailService;
import com.jobportal.job_portal.service.SupabaseStorageService;
import org.springframework.core.io.Resource;
import org.springframework.core.io.InputStreamResource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import org.springframework.data.domain.PageImpl;

@RestController
@RequestMapping("/applications")
public class ApplicationController {

    private final ApplicationRepository applicationRepository;
    private final JobRepository jobRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;
    private final SupabaseStorageService supabaseStorageService;

    public ApplicationController(ApplicationRepository applicationRepository,
                                 JobRepository jobRepository,
                                 UserRepository userRepository,
                                 EmailService emailService,
                                 SupabaseStorageService supabaseStorageService) {
        this.applicationRepository = applicationRepository;
        this.jobRepository = jobRepository;
        this.userRepository = userRepository;
        this.emailService = emailService;
        this.supabaseStorageService = supabaseStorageService;
    }

    // APPLY JOB
    @PostMapping("/{jobId}")
    public ResponseEntity<?> applyJob(
            @PathVariable Long jobId,
            @RequestParam("resume") MultipartFile file,
            Authentication authentication) throws Exception {

        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow();

        Job job = jobRepository.findById(jobId)
                .orElseThrow();

        if (applicationRepository.findByUserAndJob(user, job).isPresent()) {
            return ResponseEntity.badRequest().body("Already applied");
        }

        // ===== SAVE FILE TO SUPABASE =====
        String fileName = supabaseStorageService.uploadFile(file);

        // ===== SAVE APPLICATION =====
        Application app = new Application();
        app.setUser(user);
        app.setJob(job);
        app.setResumePath(fileName);

        applicationRepository.save(app);

        // Send email notification to candidate
        emailService.sendApplicationReceived(
            user.getEmail(),
            job.getTitle(),
            job.getCompany()
        );

        // Send email notification to employer
        emailService.sendNewApplicantEmail(
            job.getUser().getEmail(),
            job.getTitle(),
            user.getUsername(),
            user.getEmail()
        );

        return ResponseEntity.ok("Applied successfully");
    }

    // ================== CANDIDATE VIEW ==================

    @GetMapping("/my")
    public Page<CandidateApplicationDTO> myApplications(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size,
            Authentication auth) {

        User user = userRepository.findByEmail(auth.getName()).orElseThrow();

        Pageable pageable = PageRequest.of(page, size);

        return applicationRepository.findByUser(user, pageable)
                .map(app -> new CandidateApplicationDTO(
                        app.getJob().getId(),
                        app.getJob().getTitle(),
                        app.getJob().getCompany(),
                        app.getStatus().name()
                ));
    }

    // ================= EMPLOYER / ADMIN VIEW =================

    @GetMapping("/my-applicants")
    public Page<ApplicationResponseDTO> myApplicants(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size,
            Authentication auth) {

        User user = userRepository.findByEmail(auth.getName()).orElseThrow();

        List<Job> myJobs = jobRepository.findByUser(user);
        List<Long> myJobIds = myJobs.stream().map(Job::getId).toList();

        Pageable pageable = PageRequest.of(page, size);

        List<ApplicationResponseDTO> filtered = applicationRepository.findAll(pageable)
                .stream()
                .filter(app -> myJobIds.contains(app.getJob().getId()))
                .map(app -> new ApplicationResponseDTO(
                        app.getId(),
                        app.getUser().getUsername(),
                        app.getUser().getEmail(),
                        app.getJob().getTitle(),
                        app.getJob().getId(),
                        app.getStatus().name(),
                        app.getAppliedAt()
                ))
                .toList();

        return new PageImpl<>(filtered, pageable, filtered.size());
    }

    @GetMapping("/job/{jobId}")
    public List<ApplicationResponseDTO> applicants(@PathVariable Long jobId,
                                                   Authentication auth) {

        User user = userRepository.findByEmail(auth.getName()).orElseThrow();

        Job job = jobRepository.findById(jobId).orElseThrow();

        if (!job.getUser().getId().equals(user.getId())
                && !user.getRole().getName().equals("ADMIN")) {

            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }

        return applicationRepository.findByJob(job)
                .stream()
                .map(app -> new ApplicationResponseDTO(
                        app.getId(),
                        app.getUser().getUsername(),
                        app.getUser().getEmail(),
                        app.getJob().getTitle(),
                        app.getJob().getId(),
                        app.getStatus().name(),
                        app.getAppliedAt()
                ))
                .toList();
    }

    // ================= GET ALL (ADMIN) =================

    @GetMapping
    public List<ApplicationResponseDTO> getAllApplications(Authentication auth) {
        User user = userRepository.findByEmail(auth.getName()).orElseThrow();
        if (!user.getRole().getName().equals("ADMIN")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        return applicationRepository.findAll().stream()
                .map(app -> new ApplicationResponseDTO(
                        app.getId(),
                        app.getUser().getUsername(),
                        app.getUser().getEmail(),
                        app.getJob().getTitle(),
                        app.getJob().getId(),
                        app.getStatus().name(),
                        app.getAppliedAt()
                ))
                .toList();
    }

    // ================= REVIEW =================

    @PutMapping("/{id}/review")
    public ResponseEntity<?> review(@PathVariable Long id, Authentication auth) {

        Application app = applicationRepository.findById(id)
                .orElseThrow();

        if (!app.getJob().getUser().getEmail().equals(auth.getName())
                && !userRepository.findByEmail(auth.getName()).orElseThrow().getRole().getName().equals("ADMIN")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }

        app.setStatus(ApplicationStatus.REVIEWED);
        applicationRepository.save(app);

        emailService.sendApplicationStatusUpdate(
            app.getUser().getEmail(),
            app.getJob().getTitle(),
            "REVIEWED"
        );

        return ResponseEntity.ok("Reviewed");
    }

    // ================= INTERVIEW =================

    @PutMapping("/{id}/interview")
    public ResponseEntity<?> interview(@PathVariable Long id, Authentication auth) {

        Application app = applicationRepository.findById(id)
                .orElseThrow();

        if (!app.getJob().getUser().getEmail().equals(auth.getName())
                && !userRepository.findByEmail(auth.getName()).orElseThrow().getRole().getName().equals("ADMIN")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }

        app.setStatus(ApplicationStatus.INTERVIEWING);
        applicationRepository.save(app);

        emailService.sendApplicationStatusUpdate(
            app.getUser().getEmail(),
            app.getJob().getTitle(),
            "INTERVIEWING"
        );

        return ResponseEntity.ok("Interviewing");
    }

    // ================= ACCEPT =================

    @PutMapping("/{id}/accept")
    public ResponseEntity<?> accept(@PathVariable Long id, Authentication auth) {

        Application app = applicationRepository.findById(id)
                .orElseThrow();

        if (!app.getJob().getUser().getEmail().equals(auth.getName())
                && !userRepository.findByEmail(auth.getName()).orElseThrow().getRole().getName().equals("ADMIN")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }

        app.setStatus(ApplicationStatus.ACCEPTED);
        applicationRepository.save(app);

        emailService.sendApplicationStatusUpdate(
            app.getUser().getEmail(),
            app.getJob().getTitle(),
            "ACCEPTED"
        );

        return ResponseEntity.ok("Accepted");
    }

    // ================= REJECT =================

    @PutMapping("/{id}/reject")
    public ResponseEntity<?> reject(@PathVariable Long id, Authentication auth) {

        Application app = applicationRepository.findById(id)
                .orElseThrow();

        if (!app.getJob().getUser().getEmail().equals(auth.getName())
                && !userRepository.findByEmail(auth.getName()).orElseThrow().getRole().getName().equals("ADMIN")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }

        app.setStatus(ApplicationStatus.REJECTED);
        applicationRepository.save(app);

        emailService.sendApplicationStatusUpdate(
            app.getUser().getEmail(),
            app.getJob().getTitle(),
            "REJECTED"
        );

        return ResponseEntity.ok("Rejected");
    }

    // ================= DELETE =================

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteApplication(@PathVariable Long id, Authentication auth) {

        Application app = applicationRepository.findById(id)
                .orElseThrow();

        User user = userRepository.findByEmail(auth.getName()).orElseThrow();

        // Allow: owner of the application (candidate) OR owner of the job (employer) OR admin
        boolean isCandidate = app.getUser().getId().equals(user.getId());
        boolean isEmployer = app.getJob().getUser().getId().equals(user.getId());
        boolean isAdmin = user.getRole().getName().equals("ADMIN");

        if (!isCandidate && !isEmployer && !isAdmin) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }

        applicationRepository.delete(app);

        return ResponseEntity.ok("Application deleted");
    }
    @GetMapping("/{id}/resume")
    public ResponseEntity<Resource> downloadResume(@PathVariable Long id, Authentication auth) throws Exception {

        Application app = applicationRepository.findById(id)
                .orElseThrow();

        User user = userRepository.findByEmail(auth.getName())
                .orElseThrow();

        // Only employer or admin
        if (!app.getJob().getUser().getId().equals(user.getId())
                && !user.getRole().getName().equals("ADMIN")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }

        Resource resource = supabaseStorageService.downloadFile(app.getResumePath());
        String fileName = app.getResumePath();

        // Try to determine content type from filename extension
        String contentType = "application/octet-stream";
        if (fileName.toLowerCase().endsWith(".pdf")) {
            contentType = "application/pdf";
        } else if (fileName.toLowerCase().endsWith(".doc")) {
            contentType = "application/msword";
        } else if (fileName.toLowerCase().endsWith(".docx")) {
            contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        }

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + fileName + "\"")
                .body(resource);
    }

}