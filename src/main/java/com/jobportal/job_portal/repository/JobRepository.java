package com.jobportal.job_portal.repository;

import com.jobportal.job_portal.model.Job;
import com.jobportal.job_portal.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;


public interface JobRepository extends JpaRepository<Job, Long> {

    List<Job> findByUser(User user);
    long countByUser(User user);


    Optional<Job> findByIdAndUser(Long id, User user);
    @Query(""" 
       SELECT j FROM Job j
       WHERE LOWER(j.title) LIKE LOWER(CONCAT('%', :keyword, '%'))
       OR LOWER(j.company) LIKE LOWER(CONCAT('%', :keyword, '%'))
       OR LOWER(j.location) LIKE LOWER(CONCAT('%', :keyword, '%'))
       """) // Ye JPQL query hai
    /*
       %keyword%
       example : keyword java hai
       %...% ka mtlb ye beginning , middle , end me check karta if match is found.
    */
    Page<Job> searchJobs(@Param("keyword") String keyword, Pageable pageable);

}

