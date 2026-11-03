package com.jobportal.job_portal;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jobportal.job_portal.dto.LoginRequest;
import com.jobportal.job_portal.dto.RegisterRequest;
import com.jobportal.job_portal.model.Role;
import com.jobportal.job_portal.repository.RoleRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private RoleRepository roleRepository;

    @BeforeEach
    void ensureRoles() {
        for (String roleName : new String[]{"CANDIDATE", "EMPLOYER", "ADMIN"}) {
            if (roleRepository.findByName(roleName).isEmpty()) {
                Role role = new Role();
                role.setName(roleName);
                roleRepository.save(role);
            }
        }
    }

    @Test
    void registerAndLogin_success() throws Exception {
        RegisterRequest register = new RegisterRequest();
        register.setUsername("testcandidate");
        register.setEmail("candidate@test.com");
        register.setPassword("password123");
        register.setRole("CANDIDATE");

        mockMvc.perform(post("/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(register)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").exists())
                .andExpect(jsonPath("$.role").value("CANDIDATE"));

        LoginRequest login = new LoginRequest();
        login.setEmail("candidate@test.com");
        login.setPassword("password123");

        mockMvc.perform(post("/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(login)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").exists())
                .andExpect(jsonPath("$.message").value("Login Successful"));
    }

    @Test
    void register_duplicateEmail_returnsBadRequest() throws Exception {
        RegisterRequest register = new RegisterRequest();
        register.setUsername("first");
        register.setEmail("duplicate@test.com");
        register.setPassword("password123");
        register.setRole("CANDIDATE");

        mockMvc.perform(post("/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(register)))
                .andExpect(status().isOk());

        RegisterRequest duplicate = new RegisterRequest();
        duplicate.setUsername("second");
        duplicate.setEmail("duplicate@test.com");
        duplicate.setPassword("password123");
        duplicate.setRole("CANDIDATE");

        mockMvc.perform(post("/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(duplicate)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void login_invalidCredentials_returnsUnauthorized() throws Exception {
        LoginRequest login = new LoginRequest();
        login.setEmail("nobody@test.com");
        login.setPassword("wrongpassword");

        mockMvc.perform(post("/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(login)))
                .andExpect(status().isUnauthorized());
    }
}
