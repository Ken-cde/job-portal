package com.jobportal.job_portal.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Job {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;
    private String description;
    private String company;
    private String location;
    private Double salary;

    // 🔥 ADD THIS
    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;
}
