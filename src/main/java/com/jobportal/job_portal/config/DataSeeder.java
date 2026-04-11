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

@Component
public class DataSeeder implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final JobRepository jobRepository;
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(RoleRepository roleRepository, UserRepository userRepository, JobRepository jobRepository, PasswordEncoder passwordEncoder) {
        this.roleRepository = roleRepository;
        this.userRepository = userRepository;
        this.jobRepository = jobRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {

        List<String> roles = List.of("CANDIDATE", "EMPLOYER", "ADMIN");

        for (String roleName : roles) {
            if (roleRepository.findByName(roleName).isEmpty()) {
                Role role = new Role();
                role.setName(roleName);
                roleRepository.save(role);
                System.out.println("✅ Created role: " + roleName);
            }
        }

        // Create admin user if none exists
        Role adminRole = roleRepository.findByName("ADMIN").orElseThrow();
        if (userRepository.findByEmail("admin@jobportal.com").isEmpty()) {
            User admin = new User();
            admin.setUsername("admin");
            admin.setEmail("admin@jobportal.com");
            admin.setPassword(passwordEncoder.encode("admin123"));
            admin.setRole(adminRole);
            userRepository.save(admin);
            System.out.println("✅ Created admin user: admin@jobportal.com / admin123");
        }

        // Create a test employer and some dummy jobs if none exist
        if (jobRepository.count() == 0) {
            Role employerRole = roleRepository.findByName("EMPLOYER").orElseThrow();
            
            User employer = userRepository.findByEmail("tech_corp@test.com").orElseGet(() -> {
                User newUser = new User();
                newUser.setUsername("TechCorpInc");
                newUser.setEmail("tech_corp@test.com");
                newUser.setPassword(passwordEncoder.encode("password123"));
                newUser.setRole(employerRole);
                return userRepository.save(newUser);
            });

            // Job 1
            Job job1 = new Job();
            job1.setTitle("Senior React Developer");
            job1.setDescription("We are looking for an experienced React developer to build modern, interactive frontends with glassmorphism design. Join our team to create stunning user interfaces for enterprise clients.");
            job1.setCompany("Tech Corp Inc.");
            job1.setLocation("Remote (US)");
            job1.setJobType("REMOTE");
            job1.setRequirements("5+ years React experience\nStrong JavaScript/TypeScript skills\nExperience with Vite, Redux, or Context API\nCSS-in-JS and responsive design\nPortfolio required");
            job1.setSalary(120000.0);
            job1.setUser(employer);
            jobRepository.save(job1);

            // Job 2
            Job job2 = new Job();
            job2.setTitle("Spring Boot Backend Engineer");
            job2.setDescription("Join our core backend team to build robust APIs, secure endpoints, and manage complex databases using pure Java 21.");
            job2.setCompany("Finance Solutions");
            job2.setLocation("New York, NY");
            job2.setJobType("HYBRID");
            job2.setRequirements("3+ years Java experience\nSpring Boot & Spring Security\nMySQL/PostgreSQL database skills\nREST API design knowledge\nExperience with JWT authentication");
            job2.setSalary(145000.0);
            job2.setUser(employer);
            jobRepository.save(job2);

            // Job 3
            Job job3 = new Job();
            job3.setTitle("UI/UX Designer");
            job3.setDescription("Create beautiful, engaging interfaces for Next-Gen applications. Must have a strong portfolio demonstrating glassmorphism and modern trends.");
            job3.setCompany("Creative Studio");
            job3.setLocation("San Francisco, CA");
            job3.setJobType("ONSITE");
            job3.setRequirements("3+ years UI/UX experience\nFigma/Adobe XD proficiency\nStrong portfolio with glassmorphism work\nUser research & wireframing skills\nAbility to work with React developers");
            job3.setSalary(95000.0);
            job3.setUser(employer);
            jobRepository.save(job3);

            System.out.println("✅ Seeded 3 dummy jobs under employer: " + employer.getEmail());
        }
    }
}
