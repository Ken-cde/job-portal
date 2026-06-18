package com.jobportal.job_portal.controller;

import com.jobportal.job_portal.dto.CandidateApplicationDTO;
import com.jobportal.job_portal.dto.ApplicationResponseDTO;
import com.jobportal.job_portal.dto.AiAnalysisResponse;
import com.jobportal.job_portal.dto.AiScreeningResponse;
import com.jobportal.job_portal.dto.AiInterviewGuideResponse;
import com.jobportal.job_portal.model.*;
import com.jobportal.job_portal.repository.*;
import com.jobportal.job_portal.service.EmailService;
import com.jobportal.job_portal.service.SupabaseStorageService;
import com.jobportal.job_portal.service.AiService;
import com.jobportal.job_portal.service.ResumeExtractionService;
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

@RestController
@RequestMapping("/applications")
public class ApplicationController {

    private final ApplicationRepository applicationRepository;
    private final JobRepository jobRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;
    private final SupabaseStorageService supabaseStorageService;
    private final AiService aiService;
    private final ResumeExtractionService resumeExtractionService;

    public ApplicationController(ApplicationRepository applicationRepository,
                                JobRepository jobRepository,
                                UserRepository userRepository,
                                EmailService emailService,
                                SupabaseStorageService supabaseStorageService,
                                AiService aiService,
                                ResumeExtractionService resumeExtractionService) {
        this.applicationRepository = applicationRepository;
        this.jobRepository = jobRepository;
        this.userRepository = userRepository;
        this.emailService = emailService;
        this.supabaseStorageService = supabaseStorageService;
        this.aiService = aiService;
        this.resumeExtractionService = resumeExtractionService;
    }

    // APPLY JOB
    @PostMapping("/{jobId}")
    public ResponseEntity<?> applyJob(
            @PathVariable Long jobId,
            @RequestParam("resume") MultipartFile file,
            Authentication authentication) {
        System.out.println("Applying for job: " + jobId + " by user: " + (authentication != null ? authentication.getName() : "ANONYMOUS"));
        try {
            if (authentication == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User not authenticated");
            }

            User user = userRepository.findByEmail(authentication.getName())
                    .orElseThrow(() -> new RuntimeException("User not found in database"));

            Job job = jobRepository.findById(jobId)
                    .orElseThrow(() -> new RuntimeException("Job not found"));

            if (applicationRepository.findByUserAndJob(user, job).isPresent()) {
                System.out.println("User already applied for this job");
                return ResponseEntity.badRequest().body("Already applied");
            }

            // ===== SAVE FILE TO SUPABASE =====
            System.out.println("Uploading file to Supabase: " + file.getOriginalFilename());
            String fileName = supabaseStorageService.uploadFile(file);

            // ===== SAVE APPLICATION =====
            Application app = new Application();
            app.setUser(user);
            app.setJob(job);
            app.setResumePath(fileName);

            applicationRepository.save(app);
            System.out.println("Application saved successfully. Path: " + fileName);

            // Send email notification to candidate
            try {
                emailService.sendApplicationReceived(
                    user.getEmail(),
                    job.getTitle(),
                    job.getCompany()
                );
            } catch (Exception e) {
                System.err.println("Email failed: " + e.getMessage());
            }

            // Send email notification to employer
            try {
                emailService.sendNewApplicantEmail(
                    job.getUser().getEmail(),
                    job.getTitle(),
                    user.getUsername(),
                    user.getEmail()
                );
            } catch (Exception e) {
                System.err.println("Email failed: " + e.getMessage());
            }

            return ResponseEntity.ok("Applied successfully");
        } catch (Exception e) {
            System.err.println("CRITICAL ERROR in applyJob: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                 .body(e.getMessage() != null ? e.getMessage() : "Error processing application");
        }
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

    @PostMapping("/optimize")
    public ResponseEntity<?> optimizeResume(@RequestParam Long applicationId, Authentication auth) {
        try {
            Application app = applicationRepository.findById(applicationId)
                    .orElseThrow(() -> new RuntimeException("Application not found"));

            User user = userRepository.findByEmail(auth.getName())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            if (!app.getUser().getId().equals(user.getId())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only optimize your own resume");
            }

            // 1. Download resume from Supabase
            Resource resumeResource = supabaseStorageService.downloadFile(app.getResumePath());

            // 2. Extract text using Tika
            String resumeText = resumeExtractionService.extractText(resumeResource);

            // 3. Get job details
            Job job = app.getJob();

            // 4. Analyze with AI
            AiAnalysisResponse analysis = aiService.analyzeResume(resumeText, job.getTitle(), job.getRequirements());

            return ResponseEntity.ok(analysis);
        } catch (Exception e) {
            System.err.println("Error during resume optimization: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("AI Optimization failed: " + e.getMessage());
        }
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

    @GetMapping("/{id}/interview-guide")
    public ResponseEntity<AiInterviewGuideResponse> getInterviewGuide(@PathVariable Long id, Authentication auth) {
        try {
            Application app = applicationRepository.findById(id).orElseThrow();
            User user = userRepository.findByEmail(auth.getName()).orElseThrow();

            if (!app.getJob().getUser().getId().equals(user.getId()) && !user.getRole().getName().equals("ADMIN")) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN);
            }

            Resource resumeResource = supabaseStorageService.downloadFile(app.getResumePath());
            String resumeText = resumeExtractionService.extractText(resumeResource);

            Job job = app.getJob();
            AiInterviewGuideResponse guide = aiService.generateInterviewGuide(
                app.getUser().getUsername(),
                resumeText,
                job.getTitle(),
                job.getRequirements()
            );

            return ResponseEntity.ok(guide);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/job/{jobId}/screen")
    public ResponseEntity<List<AiScreeningResponse>> screenApplicants(
            @PathVariable Long jobId,
            Authentication auth) {
        try {
            User user = userRepository.findByEmail(auth.getName()).orElseThrow();
            Job job = jobRepository.findById(jobId).orElseThrow();

            if (!job.getUser().getId().equals(user.getId()) && !user.getRole().getName().equals("ADMIN")) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN);
            }

            List<Application> apps = applicationRepository.findByJob(job);
            List<AiScreeningResponse> screenings = new java.util.ArrayList<>();

            for (Application app : apps) {
                Resource resumeResource = supabaseStorageService.downloadFile(app.getResumePath());
                String resumeText = resumeExtractionService.extractText(resumeResource);

                AiScreeningResponse screening = aiService.screenApplicant(
                    app.getUser().getUsername(),
                    resumeText,
                    job.getTitle(),
                    job.getRequirements(),
                    app.getId()
                );
                screenings.add(screening);
            }

            screenings.sort((a, b) -> b.getScore().compareTo(a.getScore()));
            return ResponseEntity.ok(screenings);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(java.util.Collections.emptyList());
        }
    }

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
