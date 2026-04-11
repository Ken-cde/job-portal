package com.jobportal.job_portal.controller;

import com.jobportal.job_portal.model.User;
import com.jobportal.job_portal.repository.RoleRepository;
import com.jobportal.job_portal.repository.UserRepository;
import com.jobportal.job_portal.service.EmailService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin")
public class AdminController {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final EmailService emailService;

    public AdminController(UserRepository userRepository, RoleRepository roleRepository, EmailService emailService) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.emailService = emailService;
    }

    // GET ALL USERS
    @GetMapping("/users")
    public List<UserResponse> getAllUsers(Authentication auth) {
        // Verify admin
        User admin = userRepository.findByEmail(auth.getName()).orElseThrow();
        if (!admin.getRole().getName().equals("ADMIN")) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.FORBIDDEN);
        }

        return userRepository.findAll().stream()
                .map(u -> new UserResponse(u.getId(), u.getUsername(), u.getEmail(), u.getRole().getName()))
                .toList();
    }

    // PROMOTE USER (CANDIDATE -> EMPLOYER)
    @PutMapping("/users/{userId}/promote")
    public ResponseEntity<?> promoteUser(@PathVariable Long userId, Authentication auth) {
        // Verify admin
        User admin = userRepository.findByEmail(auth.getName()).orElseThrow();
        if (!admin.getRole().getName().equals("ADMIN")) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.FORBIDDEN);
        }

        User user = userRepository.findById(userId).orElseThrow();

        if (user.getRole().getName().equals("ADMIN")) {
            return ResponseEntity.badRequest().body("Cannot promote an admin");
        }

        var employerRole = roleRepository.findByName("EMPLOYER").orElseThrow();
        user.setRole(employerRole);
        userRepository.save(user);

        emailService.sendPromotionConfirmation(user.getEmail(), user.getUsername());

        return ResponseEntity.ok(Map.of("message", "User promoted to employer"));
    }

    // DELETE USER
    @DeleteMapping("/users/{userId}")
    public ResponseEntity<?> deleteUser(@PathVariable Long userId, Authentication auth) {
        User admin = userRepository.findByEmail(auth.getName()).orElseThrow();
        if (!admin.getRole().getName().equals("ADMIN")) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.FORBIDDEN);
        }

        User user = userRepository.findById(userId).orElseThrow();
        if (user.getRole().getName().equals("ADMIN")) {
            return ResponseEntity.badRequest().body("Cannot delete an admin");
        }

        userRepository.delete(user);
        return ResponseEntity.ok(Map.of("message", "User deleted"));
    }

    public record UserResponse(Long id, String username, String email, String role) {}
}
