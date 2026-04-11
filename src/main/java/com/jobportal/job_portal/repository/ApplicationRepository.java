package com.jobportal.job_portal.repository;

import com.jobportal.job_portal.model.Application;
import com.jobportal.job_portal.model.ApplicationStatus;
import com.jobportal.job_portal.model.Job;
import com.jobportal.job_portal.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ApplicationRepository extends JpaRepository<Application, Long> {

    Optional<Application> findByUserAndJob(User user, Job job);

    List<Application> findByJob(Job job);

    List<Application> findByUser(User user);
    Page<Application> findByUser(User user, Pageable pageable);
    long countByUser(User user);

    long countByUserAndStatus(User user, ApplicationStatus status);

    long countByJobUser(User user);

}
