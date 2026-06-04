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

    public DataSeeder(RoleRepository roleRepository, UserRepository userRepository, JobRepository jobRepository, com.jobportal.job_portal.repository.ApplicationRepository applicationRepository, PasswordEncoder passwordEncoder) {
        this.roleRepository = roleRepository;
        this.userRepository = userRepository;
        this.jobRepository = jobRepository;
        this.applicationRepository = applicationRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        String adminEmail = "smtp4523@gmail.com";

        // Check if admin already exists to avoid wiping production data
        Optional<User> existingAdmin = userRepository.findByEmail(adminEmail);
        if (existingAdmin.isPresent()) {
            System.out.println("⏩ Database already seeded with admin user. Skipping seeder to protect data...");
            return;
        }

        int maxRetries = 3;
        int retryCount = 0;
        boolean success = false;

        while (!success && retryCount < maxRetries) {
            try {
                System.out.println("🌱 Initializing new database seed... (Attempt " + (retryCount + 1) + ")");

                // 1. Create roles if they don't exist
                List<String> roleNames = List.of("CANDIDATE", "EMPLOYER", "ADMIN");
                for (String name : roleNames) {
                    if (roleRepository.findByName(name).isEmpty()) {
                        Role role = new Role();
                        role.setName(name);
                        roleRepository.save(role);
                        System.out.println("✅ Created role: " + name);
                    }
                }

                // 2. Create the Admin user
                Role adminRole = roleRepository.findByName("ADMIN").orElseThrow();
                User admin = new User();
                admin.setUsername("Admin");
                admin.setEmail(adminEmail);
                admin.setPassword(passwordEncoder.encode("smtp12345"));
                admin.setRole(adminRole);
                userRepository.save(admin);
                System.out.println("✅ Created admin user: " + adminEmail + " / smtp12345");

                // 3. Create an Employer user
                Role employerRole = roleRepository.findByName("EMPLOYER").orElseThrow();
                User employer = new User();
                employer.setUsername("TechCorp_HR");
                employer.setEmail("hr@techcorp.com");
                employer.setPassword(passwordEncoder.encode("employer123"));
                employer.setRole(employerRole);
                userRepository.save(employer);
                System.out.println("✅ Created employer user: hr@techcorp.com / employer123");

                // 4. Create 20 professional IT jobs
                seedProfessionalJobs(employer);

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

    private void seedProfessionalJobs(User employer) {
        String[][] jobData = {
            {"Senior Java Backend Developer", "Build scalable microservices using Spring Boot, Kafka, and PostgreSQL. Focus on high-availability systems.", "5+ years Java, Spring Boot, Microservices, PostgreSQL, Kafka, Docker/K8s."},
            {"React Frontend Architect", "Design and lead the implementation of complex enterprise dashboards using React, Redux, and TypeScript.", "6+ years React, TypeScript, State Management (Redux/Zustand), CSS-in-JS, Webpack."},
            {"Full Stack Engineer", "End-to-end development of new features using Spring Boot and React. Bridging the gap between UI and API.", "3+ years Full Stack experience, Spring Boot, React, JPA/Hibernate, REST APIs."},
            {"DevOps Engineer", "Automate infrastructure deployment using Terraform and manage Kubernetes clusters on AWS.", "3+ years AWS, Terraform, Kubernetes, Jenkins/GitHub Actions, Bash scripting."},
            {"Python AI/ML Engineer", "Develop and deploy machine learning models for predictive analytics using PyTorch and Scikit-Learn.", "3+ years Python, PyTorch/TensorFlow, Scikit-Learn, Pandas, NumPy, MLOps."},
            {"Data Scientist (NLP)", "Work on Large Language Models (LLMs) and Natural Language Processing to improve customer interaction.", "PhD or Master's in CS/Math, Python, Transformers, HuggingFace, SQL, PySpark."},
            {"Cloud Infrastructure Architect", "Design cloud-native architectures for global scale using Azure and Google Cloud Platform.", "8+ years Cloud Architecture, Azure/GCP, Networking, Security, Cost Optimization."},
            {"Android Lead Developer", "Lead the mobile team in building a high-performance consumer app using Kotlin and Jetpack Compose.", "5+ years Kotlin, Android SDK, Jetpack Compose, MVVM, Coroutines, Dagger/Hilt."},
            {"iOS Senior Engineer", "Develop premium iOS experiences with a focus on performance, accessibility and Swift concurrency.", "5+ years Swift, SwiftUI, Combine, CoreData, Xcode, App Store deployment."},
            {"QA Automation Lead", "Establish an automation framework from scratch using Selenium and Appium for web and mobile.", "4+ years Selenium, Appium, JUnit/TestNG, CI/CD integration, Performance Testing."},
            {"Go Backend Developer", "Optimize high-throughput networking services using Golang and gRPC for low-latency communication.", "3+ years Golang, gRPC, Protocol Buffers, Redis, Distributed Systems."},
            {"Cyber Security Analyst", "Conduct penetration testing and security audits to protect sensitive customer data.", "3+ years CISSP/CEH, PenTesting, OWASP Top 10, Firewall management, SIEM."},
            {"MLOps Engineer", "Bridge the gap between ML research and production by implementing robust CI/CD for ML models.", "3+ years Python, Kubeflow, MLflow, Docker, AWS SageMaker, Kubernetes."},
            {"Frontend Performance Specialist", "Optimize Core Web Vitals and reduce TTI for a high-traffic e-commerce platform.", "4+ years JavaScript, Browser Rendering, Web Vitals, CDN optimization, React/Vue."},
            {"Database Administrator", "Manage and tune large-scale PostgreSQL clusters ensuring zero downtime and optimal query performance.", "5+ years PostgreSQL, Query Optimization, Replication, Backup/Recovery, Sharding."},
            {"Site Reliability Engineer", "Ensure 99.99% uptime of critical services through observability and automated incident response.", "3+ years SRE, Prometheus, Grafana, ELK Stack, Incident Management, Linux Kernel Tuning."},
            {"UI/UX Product Designer", "Create intuitive user journeys and high-fidelity prototypes for our next-generation job portal.", "4+ years Figma, Adobe XD, User Research, Design Systems, Prototyping."},
            {"Embedded Systems Developer", "Develop firmware for industrial IoT devices using C and FreeRTOS.", "3+ years C/C++, RTOS, ARM Cortex, I2C/SPI/UART, Hardware Debugging."},
            {"Blockchain Developer", "Implement smart contracts for decentralized job verification using Solidity and Ethereum.", "2+ years Solidity, Web3.js/Ethers.js, Hardhat, Ethereum Virtual Machine (EVM)."},
            {"Network Security Engineer", "Secure the corporate perimeter using advanced firewalling and Zero Trust Architecture.", "4+ years Cisco/Juniper, VPN, IDS/IPS, Zero Trust, Network Topology."}
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
        System.out.println("✅ Created 20 professional IT jobs for Global Tech Solutions");
    }
}
