package com.jobportal.job_portal.config;

import com.jobportal.job_portal.model.Job;
import com.jobportal.job_portal.model.Role;
import com.jobportal.job_portal.model.User;
import com.jobportal.job_portal.repository.JobRepository;
import com.jobportal.job_portal.repository.RoleRepository;
import com.jobportal.job_portal.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
public class DataSeeder implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final JobRepository jobRepository;
    private final com.jobportal.job_portal.repository.ApplicationRepository applicationRepository;
    private final PasswordEncoder passwordEncoder;

    @org.springframework.beans.factory.annotation.Value("${SEED_ENABLED:false}")
    private boolean seedEnabled;

    @org.springframework.beans.factory.annotation.Value("${SEED_ADMIN_EMAIL:}")
    private String seedAdminEmail;

    @org.springframework.beans.factory.annotation.Value("${SEED_ADMIN_PASSWORD:}")
    private String seedAdminPassword;

    @org.springframework.beans.factory.annotation.Value("${SEED_EMPLOYER_EMAIL:}")
    private String seedEmployerEmail;

    @org.springframework.beans.factory.annotation.Value("${SEED_EMPLOYER_PASSWORD:}")
    private String seedEmployerPassword;

    public DataSeeder(RoleRepository roleRepository, UserRepository userRepository, JobRepository jobRepository,
                      com.jobportal.job_portal.repository.ApplicationRepository applicationRepository,
                      PasswordEncoder passwordEncoder) {
        this.roleRepository = roleRepository;
        this.userRepository = userRepository;
        this.jobRepository = jobRepository;
        this.applicationRepository = applicationRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        ensureRoles();

        if (!seedEnabled) {
            System.out.println("⏭️ Database seeding disabled (SEED_ENABLED=false). Skipping demo data.");
            return;
        }

        if (seedAdminEmail == null || seedAdminEmail.isBlank()
                || seedAdminPassword == null || seedAdminPassword.isBlank()) {
            System.err.println("❌ Seeding enabled but SEED_ADMIN_EMAIL or SEED_ADMIN_PASSWORD is missing. Skipping.");
            return;
        }

        Optional<User> existingAdmin = userRepository.findByEmail(seedAdminEmail);
        if (existingAdmin.isPresent()) {
            System.out.println("⏩ Admin account already exists (" + seedAdminEmail + "). Skipping seeder to protect data.");
            return;
        }

        int maxRetries = 3;
        int retryCount = 0;
        boolean success = false;

        while (!success && retryCount < maxRetries) {
            try {
                System.out.println("🌱 Initializing new database seed... (Attempt " + (retryCount + 1) + ")");

                Role adminRole = roleRepository.findByName("ADMIN").orElseThrow();
                Role employerRole = roleRepository.findByName("EMPLOYER").orElseThrow();

                User admin = new User();
                admin.setUsername("Admin");
                admin.setEmail(seedAdminEmail);
                admin.setPassword(passwordEncoder.encode(seedAdminPassword));
                admin.setRole(adminRole);
                userRepository.save(admin);
                System.out.println("✅ Created admin user: " + seedAdminEmail);

                User employer = null;
                if (seedEmployerEmail != null && !seedEmployerEmail.isBlank()
                        && seedEmployerPassword != null && !seedEmployerPassword.isBlank()) {
                    employer = new User();
                    employer.setUsername("TechCorp_HR");
                    employer.setEmail(seedEmployerEmail);
                    employer.setPassword(passwordEncoder.encode(seedEmployerPassword));
                    employer.setRole(employerRole);
                    userRepository.save(employer);
                    System.out.println("✅ Created employer user: " + seedEmployerEmail);
                } else {
                    System.out.println("⚠️ Employer seed skipped: missing SEED_EMPLOYER_EMAIL or SEED_EMPLOYER_PASSWORD.");
                }

                if (employer != null) {
                    seedProfessionalJobs(employer);
                }

                success = true;
                System.out.println("🚀 Database seeding completed successfully!");
            } catch (Exception e) {
                retryCount++;
                System.err.println("⚠️ Database connection failed during seeding. Retrying in 5 seconds... (" + retryCount + "/" + maxRetries + ")");
                e.printStackTrace();
                try {
                    Thread.sleep(5000);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                }
            }
        }

        if (!success) {
            System.err.println("❌ Critical failure: Could not seed database after " + maxRetries + " attempts.");
        }
    }

    private void ensureRoles() {
        List<String> roleNames = List.of("CANDIDATE", "EMPLOYER", "ADMIN");
        for (String name : roleNames) {
            if (roleRepository.findByName(name).isEmpty()) {
                Role role = new Role();
                role.setName(name);
                roleRepository.save(role);
                System.out.println("✅ Created role: " + name);
            }
        }
    }

    private void seedProfessionalJobs(User employer) {
        String[][] jobData = {
                {"Senior Java Backend Developer", "Build scalable microservices using Spring Boot, Kafka, and PostgreSQL. Focus on high-availability systems.", "5+ years Java, Spring Boot, Microservices, PostgreSQL, Kafka, Docker/K8s."},
                {"React Frontend Architect", "Design and lead the implementation of complex enterprise dashboards using React, Redux, and TypeScript.", "6+ years React, TypeScript, State Management (Redux/Zustand), CSS-in-JS, Webpack."},
                {"Full Stack Engineer", "End-to-end development of new features using Spring Boot and React. Bridging the gap between UI and API.", "3+ years Full Stack experience, Spring Boot, React, JPA/Hibernate, REST APIs."},
                {"DevOps Engineer", "Automate infrastructure deployment using Terraform and manage Kubernetes clusters on AWS.", "3+ years AWS, Terraform, Kubernetes, Jenkins/GitHub Actions, Bash scripting."}
        };

        for (String[] data : jobData) {
            Job job = new Job();
            job.setTitle(data[0]);
            job.setDescription(data[1]);
            job.setCompany("Global Tech Solutions");
            job.setLocation("Remote / Hybrid");
            job.setSalary(110000.0 + (Math.random() * 60000));
            job.setCurrency("USD");
            job.setJobType("Full-time");
            job.setRequirements(data[2]);
            job.setDeadline(java.time.LocalDate.now().plusMonths(2));
            job.setUser(employer);
            jobRepository.save(job);
        }
        System.out.println("✅ Created " + jobData.length + " professional IT jobs for Global Tech Solutions");
    }
}
