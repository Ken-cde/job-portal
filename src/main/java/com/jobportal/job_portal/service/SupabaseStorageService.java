package com.jobportal.job_portal.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Paths;
import java.util.UUID;
import org.springframework.web.util.UriComponentsBuilder;

@Service
public class SupabaseStorageService {

    @Value("${supabase.project-url}")
    private String projectUrl;

    @Value("${supabase.service-role-key}")
    private String serviceRoleKey;

    private final RestTemplate restTemplate;
    private static final String BUCKET = "resumes";

    public SupabaseStorageService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public String uploadFile(MultipartFile file) throws IOException {
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null) {
            throw new IOException("Filename is missing");
        }

        String sanitizedName = Paths.get(originalFilename).getFileName().toString();
        String fileName = UUID.randomUUID() + "_" + sanitizedName;
        String uploadUrl = UriComponentsBuilder.fromHttpUrl(projectUrl)
                .pathSegment("storage", "v1", "object", BUCKET, fileName)
                .toUriString();

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + serviceRoleKey);
        headers.set("apiKey", serviceRoleKey);
        headers.setContentType(MediaType.parseMediaType(file.getContentType()));

        HttpEntity<byte[]> requestEntity = new HttpEntity<>(file.getBytes(), headers);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(uploadUrl, requestEntity, String.class);
            if (response.getStatusCode() == HttpStatus.OK) {
                return fileName;
            } else {
                throw new RuntimeException("Failed to upload file to Supabase: " + response.getBody());
            }
        } catch (Exception e) {
            throw new IOException("Error occurred during Supabase upload: " + e.getMessage(), e);
        }
    }

    public Resource downloadFile(String fileName) {
        String downloadUrl = UriComponentsBuilder.fromHttpUrl(projectUrl)
                .pathSegment("storage", "v1", "object", BUCKET, fileName)
                .toUriString();

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + serviceRoleKey);
        headers.set("apiKey", serviceRoleKey);

        HttpEntity<Void> requestEntity = new HttpEntity<>(headers);

        try {
            ResponseEntity<byte[]> response = restTemplate.exchange(
                    downloadUrl,
                    HttpMethod.GET,
                    requestEntity,
                    byte[].class
            );

            if (response.getStatusCode() == HttpStatus.OK) {
                return new ByteArrayResource(response.getBody());
            } else {
                throw new RuntimeException("Failed to download file from Supabase: " + response.getStatusCode());
            }
        } catch (Exception e) {
            throw new RuntimeException("Error occurred during Supabase download: " + e.getMessage(), e);
        }
    }

    public void deleteFile(String fileName) {
        String deleteUrl = UriComponentsBuilder.fromHttpUrl(projectUrl)
                .pathSegment("storage", "v1", "object", BUCKET, fileName)
                .toUriString();

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + serviceRoleKey);
        headers.set("apiKey", serviceRoleKey);

        HttpEntity<Void> requestEntity = new HttpEntity<>(headers);

        try {
            restTemplate.exchange(deleteUrl, HttpMethod.DELETE, requestEntity, Void.class);
        } catch (Exception e) {
            System.err.println("Failed to delete file from Supabase: " + e.getMessage());
        }
    }
}
