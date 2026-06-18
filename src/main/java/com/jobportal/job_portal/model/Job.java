package com.jobportal.job_portal.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "jobs")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Job {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(columnDefinition = "vector(1536)")
    private float[] embedding;

    private String title;
    private String description;
    private String company;
    private String location;
    private Double salary;
    private String currency;
    private String jobType;
    private String requirements;
    private LocalDate deadline;

    // 🔥 ADD THIS
    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;
}
