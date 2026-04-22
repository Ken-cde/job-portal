package com.jobportal.job_portal.config;

import com.zaxxer.hikari.HikariDataSource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import jakarta.annotation.PostConstruct;
import java.net.URI;

@Configuration
public class RenderDatabaseConfig {

    @Value("${spring.datasource.url:#{null}}")
    private String datasourceUrl;

    @Value("${DATABASE_URL:#{null}}")
    private String renderDatabaseUrl;

    @PostConstruct
    public void logDatasource() {
        System.out.println("[DB Config] spring.datasource.url: " + datasourceUrl);
        System.out.println("[DB Config] DATABASE_URL: " + (renderDatabaseUrl != null ? "[SET]" : "[NOT SET]"));
        if (datasourceUrl != null && datasourceUrl.contains("postgres")) {
            System.out.println("[DB Config] Detected: PostgreSQL via spring.datasource.url");
            System.setProperty("spring.jpa.properties.hibernate.dialect", "org.hibernate.dialect.PostgreSQLDialect");
        } else if (renderDatabaseUrl != null && renderDatabaseUrl.startsWith("postgres://")) {
            System.out.println("[DB Config] Detected: PostgreSQL via DATABASE_URL (Render)");
            System.setProperty("spring.jpa.properties.hibernate.dialect", "org.hibernate.dialect.PostgreSQLDialect");
        } else {
            System.out.println("[DB Config] Detected: MySQL (local dev)");
            System.setProperty("spring.jpa.properties.hibernate.dialect", "org.hibernate.dialect.MySQLDialect");
        }
    }

    @Bean
    @Primary
    public javax.sql.DataSource dataSource() {
        String url = datasourceUrl;
        String username = "root";
        String password = "root123";

        // Use DATABASE_URL if provided (Render) and spring.datasource.url is not a jdbc URL
        if (url == null || !url.startsWith("jdbc:")) {
            if (renderDatabaseUrl != null && renderDatabaseUrl.startsWith("postgres://")) {
                // Convert postgres:// to jdbc:postgresql://
                url = convertToJdbcUrl(renderDatabaseUrl);
                // Extract username and password from the Render URL
                try {
                    URI uri = new URI(renderDatabaseUrl);
                    username = uri.getUserInfo().split(":")[0];
                    password = uri.getUserInfo().split(":")[1];
                } catch (Exception e) {
                    System.out.println("[DB Config] Could not parse DATABASE_URL user info: " + e.getMessage());
                }
                System.out.println("[DB Config] Using converted DATABASE_URL: " + url);
                System.out.println("[DB Config] Username: " + username);
            } else if (url == null) {
                // Fallback to MySQL local dev
                url = "jdbc:mysql://localhost:3306/job_portal";
                System.out.println("[DB Config] Using default MySQL URL: " + url);
            }
        }

        HikariDataSource dataSource = (HikariDataSource) DataSourceBuilder.create()
                .url(url)
                .username(username)
                .password(password)
                .driverClassName(url.contains("postgresql") ? "org.postgresql.Driver" : "com.mysql.cj.jdbc.Driver")
                .type(HikariDataSource.class)
                .build();

        dataSource.setMaximumPoolSize(1);
        return dataSource;
    }

    private String convertToJdbcUrl(String renderUrl) {
        // postgres://user:pass@host:5432/dbname -> jdbc:postgresql://host:5432/dbname
        String withoutScheme = renderUrl.replaceFirst("postgres://", "postgresql://");
        return "jdbc:" + withoutScheme;
    }
}
