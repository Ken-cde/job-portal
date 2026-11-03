package com.jobportal.job_portal;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jobportal.job_portal.dto.LoginRequest;
import com.jobportal.job_portal.dto.RegisterRequest;
import com.jobportal.job_portal.model.Job;
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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class JobApiIntegrationTest {

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
    void listJobs_publicEndpoint_returnsOk() throws Exception {
        mockMvc.perform(get("/jobs"))
                .andExpect(status().isOk());
    }

    @Test
    void createJob_asEmployer_returnsOk() throws Exception {
        // convenience helper to ensure roles exist
        mockMvc.perform(post("/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(makeEmployer())))
                .andExpect(status().isOk());

        LoginRequest login = new LoginRequest();
        login.setEmail("employer@test.com");
        login.setPassword("password123");

        MvcResult loginResult = mockMvc.perform(post("/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(login)))
                .andExpect(status().isOk())
                .andReturn();

        String token = objectMapper.readTree(loginResult.getResponse().getContentAsString())
                .get("token").asText();

        Job job = new Job();
        job.setTitle("Test Job");
        job.setDescription("desc");
        job.setCompany("Acme");
        job.setLocation("Remote");
        job.setSalary(1000.0);
        job.setJobType("Full-time");
        job.setRequirements("Java");

        mockMvc.perform(post("/jobs")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(job)))
                .andExpect(status().isOk());
    }

    private com.jobportal.job_portal.dto.RegisterRequest makeEmployer() {
        com.jobportal.job_portal.dto.RegisterRequest r = new com.jobportal.job_portal.dto.RegisterRequest();
        r.setUsername("employer");
        r.setEmail("employer@test.com");
        r.setPassword("password123");
        r.setRole("EMPLOYER");
        return r;
    }
}
