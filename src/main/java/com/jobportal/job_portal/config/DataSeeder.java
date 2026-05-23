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
import org.springframework.context.annotation.Profile;
import java.util.List;

@Component
@Profile("dev")
public class DataSeeder implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final JobRepository jobRepository;
    private final com.jobportal.job_portal.repository.ApplicationRepository applicationRepository;
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(RoleRepository roleRepository, UserRepository userRepository, JobRepository jobRepository, com.jobportal.job_portal.repository.ApplicationRepository applicationRepository, PasswordEncoder passwordEncoder) {
        this.roleRepository = roleRepository;
        this.userRepository = userRepository;
        this.jobRepository = jobRepository;
        this.applicationRepository = applicationRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        int maxRetries = 3;
        int retryCount = 0;
        boolean success = false;

        while (!success && retryCount < maxRetries) {
            try {
                // 1. Wipe all data for a fresh start
                System.out.println("Cleaning database for fresh start... (Attempt " + (retryCount + 1) + ")");

                // Specifically remove test accounts to ensure clean signup testing
                List<String> emailsToRemove = List.of("monstergamezone803@gmail.com", "ketanbisen37@gmail.com");
                for (String email : emailsToRemove) {
                    userRepository.findByEmail(email).ifPresent(userRepository::delete);
                }

                applicationRepository.deleteAll();
                jobRepository.deleteAll();
                userRepository.deleteAll();
                roleRepository.deleteAll();
                System.out.println("✅ Database wiped clean and test users removed");

                // 2. Create roles
                List<String> roles = List.of("CANDIDATE", "EMPLOYER", "ADMIN");

                for (String roleName : roles) {
                    Role role = new Role();
                    role.setName(roleName);
                    roleRepository.save(role);
                    System.out.println("✅ Created role: " + roleName);
                }

                // 3. Create the requested Admin user
                Role adminRole = roleRepository.findByName("ADMIN").orElseThrow();
                User admin = new User();
                admin.setUsername("Admin");
                admin.setEmail("smtp4523@gmail.com");
                admin.setPassword(passwordEncoder.encode("smtp12345"));
                admin.setRole(adminRole);
                userRepository.save(admin);
                System.out.println("✅ Created admin user: smtp4523@gmail.com / smtp12345");

                // 4. Create a single Employer user
                Role employerRole = roleRepository.findByName("EMPLOYER").orElseThrow();
                User employer = new User();
                employer.setUsername("TechCorp_HR");
                employer.setEmail("hr@techcorp.com");
                employer.setPassword(passwordEncoder.encode("employer123"));
                employer.setRole(employerRole);
                userRepository.save(employer);
                System.out.println("✅ Created employer user: hr@techcorp.com / employer123");

                // 5. Create 20 different tech jobs for this employer
                String[] techJobs = {
                    "Java Developer", "React Developer", "Full Stack Engineer", "DevOps Engineer",
                    "Python Developer", "Data Scientist", "Cloud Architect", "Android Developer",
                    "iOS Developer", "QA Automation Engineer", "Backend Engineer (Go)", "Security Specialist",
                    "Machine Learning Engineer", "Frontend Architect", "Database Administrator", "SRE Engineer",
                    "UI/UX Designer", "Embedded Systems Engineer", "Blockchain Developer", "Network Engineer"
                };

                for (String title : techJobs) {
                    Job job = new Job();
                    job.setTitle(title);
                    job.setDescription("Exciting opportunity for a " + title + " to join our growing team. We are looking for passionate individuals with strong technical skills.");
                    job.setCompany("TechCorp Inc.");
                    job.setLocation("Remote");
                    job.setSalary(120000.0 + (Math.random() * 50000));
                    job.setCurrency("USD");
                    job.setJobType("Full-time");
                    job.setRequirements("3+ years experience in " + title + ", strong problem solving skills, and a degree in CS or equivalent.");
                    job.setDeadline(java.time.LocalDate.now().plusMonths(2));
                    job.setUser(employer);
                    jobRepository.save(job);
                }
                System.out.println("✅ Created 20 technical jobs for TechCorp HR");

                success = true;
            } catch (Exception e) {
                retryCount++;
                System.err.println("⚠️ Database connection failed. Retrying in 5 seconds... (" + retryCount + "/" + maxRetries + ")");
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
}
