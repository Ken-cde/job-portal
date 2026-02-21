package com.jobportal.job_portal.repository;

import java.util.Optional;
import com.jobportal.job_portal.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    long count();


}
