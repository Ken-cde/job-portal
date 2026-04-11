package com.jobportal.job_portal.controller;

import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import com.jobportal.job_portal.model.Job;
import com.jobportal.job_portal.model.User;
import com.jobportal.job_portal.repository.JobRepository;
import com.jobportal.job_portal.repository.UserRepository;
import com.jobportal.job_portal.service.EmailService;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.time.LocalDate;

@RestController
@RequestMapping("/jobs")
public class JobController {

    private final JobRepository jobRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    public JobController(JobRepository jobRepository, UserRepository userRepository, EmailService emailService) {
        this.jobRepository = jobRepository;
        this.userRepository = userRepository;
        this.emailService = emailService;
    }

    // CREATE JOB (logged user)
    @PostMapping
    public Job createJob(@RequestBody Job job, Authentication authentication) {

        String email = authentication.getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN));

        // ROLE CHECK
        String role = user.getRole().getName();

        if (!role.equals("EMPLOYER") && !role.equals("ADMIN")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only employer can post jobs");
        }

        job.setUser(user);

        Job savedJob = jobRepository.save(job);

        emailService.sendJobPostedConfirmation(
            user.getEmail(),
            user.getUsername(),
            savedJob.getTitle(),
            savedJob.getCompany()
        );

        return savedJob;
    }


    // ALL JOBS
    @GetMapping
    public Page<Job> getAllJobs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size
    ) {

        Pageable pageable = PageRequest.of(page, size);

        return jobRepository.findAll(pageable);
    }


    // 🔥 MY JOBS
    @GetMapping("/my")
    public List<Job> myJobs(Authentication authentication) {

        String email = authentication.getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Not your job"));

        return jobRepository.findByUser(user);
    }
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteJob(@PathVariable Long id,
                                       Authentication authentication) {

        String email = authentication.getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Not your job"));

        Job job = jobRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Not your job"));

        // 🔐 OWNERSHIP CHECK
        // 🔐 OWNERSHIP + ADMIN CHECK
        if (!job.getUser().getId().equals(user.getId())
                && !user.getRole().getName().equals("ADMIN")) {

            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Forbidden");

        }

        jobRepository.delete(job);

        return ResponseEntity.ok("Job deleted successfully");
    }
    @PutMapping("/{id}")
    public ResponseEntity<?> updateJob(@PathVariable Long id,
                                       @RequestBody Job updatedJob,
                                       Authentication authentication) {

        String email = authentication.getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Not your job"));

        Job job = jobRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Not your job"));

        // 🔐 OWNERSHIP CHECK
        if (!job.getUser().getId().equals(user.getId())
                && !user.getRole().getName().equals("ADMIN")) {

            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Forbidden");

        }


        job.setTitle(updatedJob.getTitle());
        job.setDescription(updatedJob.getDescription());
        job.setCompany(updatedJob.getCompany());
        job.setLocation(updatedJob.getLocation());
        job.setSalary(updatedJob.getSalary());
        job.setJobType(updatedJob.getJobType());
        job.setRequirements(updatedJob.getRequirements());
        job.setDeadline(updatedJob.getDeadline());

        jobRepository.save(job);

        return ResponseEntity.ok(job);
    }
    @GetMapping("/search")
    public Page<Job> searchJobs(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size,
            @RequestParam(defaultValue = "salary") String sortBy,
            @RequestParam(defaultValue = "desc") String direction
    ) {

        Sort sort = direction.equalsIgnoreCase("asc")
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();

        Pageable pageable = PageRequest.of(page, size, sort);

        return jobRepository.searchJobs(keyword, pageable);
    }


}
