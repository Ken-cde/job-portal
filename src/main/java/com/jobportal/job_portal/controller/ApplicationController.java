package com.jobportal.job_portal.controller;

import com.jobportal.job_portal.dto.CandidateApplicationDTO;
import com.jobportal.job_portal.dto.ApplicationResponseDTO;
import com.jobportal.job_portal.model.*;
import com.jobportal.job_portal.repository.*;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
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

    public ApplicationController(ApplicationRepository applicationRepository,
                                 JobRepository jobRepository,
                                 UserRepository userRepository) {
        this.applicationRepository = applicationRepository;
        this.jobRepository = jobRepository;
        this.userRepository = userRepository;
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

        // ===== SAVE FILE =====
        String uploadDir = "uploads/resumes/";
        Files.createDirectories(Paths.get(uploadDir));

        String filename = System.currentTimeMillis() + "_" + file.getOriginalFilename();
        Path path = Paths.get(uploadDir + filename);

        Files.copy(file.getInputStream(), path, StandardCopyOption.REPLACE_EXISTING);

        // ===== SAVE APPLICATION =====
        Application app = new Application();
        app.setUser(user);
        app.setJob(job);
        app.setResumePath(path.toString());
        app.setResumePath(file.getOriginalFilename());

        applicationRepository.save(app);

        return ResponseEntity.ok("Applied successfully");
    }

    // ================== CANDIDATE VIEW ==================

    @GetMapping("/my")
    public List<CandidateApplicationDTO> myApplications(Authentication auth) {

        User user = userRepository.findByEmail(auth.getName()).orElseThrow();

        return applicationRepository.findByUser(user)
                .stream()
                .map(app -> new CandidateApplicationDTO(
                        app.getJob().getTitle(),
                        app.getJob().getCompany(),
                        app.getStatus().name()
                ))
                .toList();
    }

    // ================= EMPLOYER / ADMIN VIEW =================

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
                        app.getJob().getTitle(),
                        app.getStatus().name(),
                        app.getAppliedAt()
                ))
                .toList();
    }

    // ================= ACCEPT =================

    @PutMapping("/{id}/accept")
    public ResponseEntity<?> accept(@PathVariable Long id, Authentication auth) {

        Application app = applicationRepository.findById(id)
                .orElseThrow();

        if (!app.getJob().getUser().getEmail().equals(auth.getName())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }

        app.setStatus(ApplicationStatus.ACCEPTED);
        applicationRepository.save(app);

        return ResponseEntity.ok("Accepted");
    }

    // ================= REJECT =================

    @PutMapping("/{id}/reject")
    public ResponseEntity<?> reject(@PathVariable Long id, Authentication auth) {

        Application app = applicationRepository.findById(id)
                .orElseThrow();

        if (!app.getJob().getUser().getEmail().equals(auth.getName())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }

        app.setStatus(ApplicationStatus.REJECTED);
        applicationRepository.save(app);

        return ResponseEntity.ok("Rejected");
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

        Path path = Paths.get(app.getResumePath());

        Resource resource = new UrlResource(path.toUri());

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + path.getFileName() + "\"")
                .body(resource);
    }

}