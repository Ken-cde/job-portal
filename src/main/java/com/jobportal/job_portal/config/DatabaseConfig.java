package com.jobportal.job_portal.config;

import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.beans.factory.annotation.Value;

import jakarta.annotation.PostConstruct;
import javax.sql.DataSource;

@Configuration
public class DatabaseConfig {

    @Value("${spring.datasource.url:jdbc:mysql://localhost:3306/job_portal}")
    private String datasourceUrl;

    @Value("${spring.datasource.username:root}")
    private String username;

    @Value("${spring.datasource.password:root123}")
    private String password;

    @PostConstruct
    public void logDatasource() {
        System.out.println("[DB Config] URL: " + datasourceUrl);
        if (datasourceUrl.contains("postgres")) {
            System.out.println("[DB Config] Detected: PostgreSQL");
        } else {
            System.out.println("[DB Config] Detected: MySQL");
        }
    }
}