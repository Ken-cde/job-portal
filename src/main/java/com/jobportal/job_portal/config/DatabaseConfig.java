package com.jobportal.job_portal.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

import jakarta.annotation.PostConstruct;

@Configuration
public class DatabaseConfig {

    @Value("${spring.datasource.url:jdbc:mysql://localhost:3306/job_portal}")
    private String datasourceUrl;

    @PostConstruct
    public void logDatasource() {
        System.out.println("[DB Config] URL: " + datasourceUrl);
        if (datasourceUrl.contains("postgres")) {
            System.out.println("[DB Config] Detected: PostgreSQL");
            System.setProperty("spring.jpa.properties.hibernate.dialect", "org.hibernate.dialect.PostgreSQLDialect");
        } else {
            System.out.println("[DB Config] Detected: MySQL");
            System.setProperty("spring.jpa.properties.hibernate.dialect", "org.hibernate.dialect.MySQLDialect");
        }
    }
}
