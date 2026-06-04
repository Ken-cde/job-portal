package com.jobportal.job_portal.controller;

import java.util.Optional;
import org.springframework.http.ResponseEntity;
import com.jobportal.job_portal.dto.LoginRequest;
import com.jobportal.job_portal.dto.RegisterRequest;
import com.jobportal.job_portal.model.Role;
import com.jobportal.job_portal.model.User;
import com.jobportal.job_portal.repository.RoleRepository;
import com.jobportal.job_portal.repository.UserRepository;
import com.jobportal.job_portal.security.JwtUtil;
import com.jobportal.job_portal.service.EmailService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final BCryptPasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final EmailService emailService;

    public AuthController(UserRepository userRepository,
                          RoleRepository roleRepository,
                          BCryptPasswordEncoder passwordEncoder,
                          JwtUtil jwtUtil,
                          EmailService emailService) {

        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.emailService = emailService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        try {
            final String finalRoleName = request.getRole() != null && !request.getRole().isBlank()
                                            ? request.getRole()
                                            : "CANDIDATE";

            Role role = roleRepository.findByName(finalRoleName)
                    .orElseThrow(() -> new RuntimeException("Role " + finalRoleName + " not found"));

            User user = new User();
            user.setUsername(request.getUsername());
            user.setEmail(request.getEmail());
            user.setPassword(passwordEncoder.encode(request.getPassword()));
            user.setRole(role);

            userRepository.save(user);

            try {
                emailService.sendWelcomeEmail(user.getEmail(), user.getUsername());
            } catch (Exception e) {
                System.err.println("Welcome email failed but user was registered: " + e.getMessage());
            }

            String token = jwtUtil.generateToken(user.getEmail(), user.getUsername());

            return ResponseEntity.ok(Map.of(
                "message", "Account successfully created",
                "token", token,
                "role", role.getName()
            ));
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            return ResponseEntity.status(400).body("Email already exists. Please login instead.");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("An error occurred during registration: " + e.getMessage());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {

        Optional<User> optionalUser = userRepository.findByEmail(request.getEmail());

        if (optionalUser.isEmpty()) {
            return ResponseEntity.status(401).body("Invalid email or password");
        }

        User user = optionalUser.get();

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            return ResponseEntity.status(401).body("Invalid email or password");
        }

        String token = jwtUtil.generateToken(user.getEmail(), user.getUsername());

        return ResponseEntity.ok(Map.of("message", "Login Successful",
        "token", token, "role", user.getRole().getName()));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email is required"));
        }

        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            // Don't reveal whether email exists
            return ResponseEntity.ok(Map.of("message", "If that email exists, a reset link has been sent"));
        }

        User user = userOpt.get();
        String resetToken = jwtUtil.generateResetToken(user.getEmail());
        emailService.sendPasswordResetEmail(user.getEmail(), user.getUsername(), resetToken);

        return ResponseEntity.ok(Map.of("message", "If that email exists, a reset link has been sent"));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> body) {
        String token = body.get("token");
        String password = body.get("password");

        if (token == null || password == null || password.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Token and new password are required"));
        }

        if (!jwtUtil.validateToken(token)) {
            return ResponseEntity.status(400).body(Map.of("message", "Reset token is invalid or expired"));
        }

        String email = jwtUtil.extractEmail(token);
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(400).body(Map.of("message", "Invalid token"));
        }

        User user = userOpt.get();
        user.setPassword(passwordEncoder.encode(password));
        userRepository.save(user);

        return ResponseEntity.ok(Map.of("message", "Password reset successfully"));
    }
}
