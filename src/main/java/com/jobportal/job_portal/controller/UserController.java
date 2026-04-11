package com.jobportal.job_portal.controller;

import com.jobportal.job_portal.dto.UserResponseDTO;
import com.jobportal.job_portal.model.User;
import com.jobportal.job_portal.repository.UserRepository;
import com.jobportal.job_portal.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.util.Map;

@RestController
@RequestMapping("/users")
public class UserController {

    private final UserService userService;
    private final UserRepository userRepository;

    public UserController(UserService userService, UserRepository userRepository) {
        this.userService = userService;
        this.userRepository = userRepository;
    }

    // GET CURRENT USER PROFILE
    @GetMapping("/me")
    public ResponseEntity<UserResponseDTO> getMe(Authentication auth) {
        
        User user = userService.getCurrentUser(auth);
        
        UserResponseDTO response = new UserResponseDTO(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getRole().getName()
        );

        return ResponseEntity.ok(response);
    }

    // UPDATE CURRENT USER PROFILE
    @PutMapping("/me")
    public ResponseEntity<?> updateMe(@RequestBody Map<String, String> body, Authentication auth) {
        User user = userService.getCurrentUser(auth);

        String username = body.get("username");
        String email = body.get("email");

        if (username != null && !username.isBlank()) {
            user.setUsername(username);
        }
        if (email != null && !email.isBlank()) {
            // Check if email is taken by another user
            var existing = userRepository.findByEmail(email);
            if (existing.isPresent() && !existing.get().getId().equals(user.getId())) {
                return ResponseEntity.badRequest().body(Map.of("message", "Email already in use"));
            }
            user.setEmail(email);
        }

        userRepository.save(user);
        return ResponseEntity.ok(Map.of("message", "Profile updated"));
    }
}
