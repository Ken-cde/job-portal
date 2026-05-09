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

        // 1. Wipe all data for a fresh start
        System.out.println("Cleaning database for fresh start...");
        jobRepository.deleteAll();
        userRepository.deleteAll();
        roleRepository.deleteAll();
        System.out.println("✅ Database wiped clean");

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
    }
}
