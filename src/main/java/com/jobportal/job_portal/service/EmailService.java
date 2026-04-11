package com.jobportal.job_portal.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    public void sendEmail(String to, String subject, String body) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);
            message.setFrom("noreply@jobportal.com");
            mailSender.send(message);
            System.out.println("Email sent successfully to: " + to);
        } catch (Exception e) {
            System.err.println("Failed to send email to " + to + ": " + e.getMessage());
        }
    }

    public void sendApplicationReceived(String candidateEmail, String jobTitle, String company) {
        String subject = "Application Received - " + jobTitle;
        String body = String.format(
            "Dear Candidate,\n\n" +
            "Thank you for applying to %s at %s!\n\n" +
            "We have received your application and will review it shortly.\n" +
            "You will be notified once there's an update on your application status.\n\n" +
            "Best regards,\n" +
            "The %s Team",
            jobTitle, company, company
        );
        sendEmail(candidateEmail, subject, body);
    }

    public void sendApplicationStatusUpdate(String candidateEmail, String jobTitle, String status) {
        String subject = "Application Status Update - " + jobTitle;
        String body;
        if ("ACCEPTED".equals(status)) {
            body = String.format(
                "Dear Candidate,\n\n" +
                "Congratulations! Your application for %s has been %s!\n\n" +
                "The employer will reach out to you shortly with next steps.\n\n" +
                "Best regards,\n" +
                "The Job Portal Team",
                jobTitle, status
            );
        } else if ("REJECTED".equals(status)) {
            body = String.format(
                "Dear Candidate,\n\n" +
                "We regret to inform you that your application for %s has been %s.\n\n" +
                "Don't be discouraged — keep applying to other positions that match your skills!\n\n" +
                "Best regards,\n" +
                "The Job Portal Team",
                jobTitle, status
            );
        } else if ("INTERVIEWING".equals(status)) {
            body = String.format(
                "Dear Candidate,\n\n" +
                "Great news! Your application for %s has been moved to INTERVIEWING.\n\n" +
                "The employer will contact you soon to schedule an interview.\n\n" +
                "Best regards,\n" +
                "The Job Portal Team",
                jobTitle
            );
        } else {
            body = String.format(
                "Dear Candidate,\n\n" +
                "Your application for %s has been updated to: %s\n\n" +
                "Please check your dashboard for more details.\n\n" +
                "Best regards,\n" +
                "The Job Portal Team",
                jobTitle, status
            );
        }
        sendEmail(candidateEmail, subject, body);
    }

    public void sendNewApplicantEmail(String employerEmail, String jobTitle, String candidateName, String candidateEmail) {
        String subject = "New Applicant for " + jobTitle;
        String body = String.format(
            "Dear Employer,\n\n" +
            "A new candidate has applied for your job posting: %s\n\n" +
            "Candidate Name: %s\n" +
            "Candidate Email: %s\n\n" +
            "Log in to your dashboard to review their application and resume.\n\n" +
            "Best regards,\n" +
            "The Job Portal Team",
            jobTitle, candidateName, candidateEmail
        );
        sendEmail(employerEmail, subject, body);
    }

    public void sendJobPostedConfirmation(String employerEmail, String employerName, String jobTitle, String company) {
        String subject = "Job Posted Successfully - " + jobTitle;
        String body = String.format(
            "Dear %s,\n\n" +
            "Your job posting '%s' at %s has been published successfully!\n\n" +
            "You will receive email notifications whenever a candidate applies for this position.\n\n" +
            "Best regards,\n" +
            "The Job Portal Team",
            employerName, jobTitle, company
        );
        sendEmail(employerEmail, subject, body);
    }

    public void sendPromotionConfirmation(String userEmail, String username) {
        String subject = "You've Been Promoted to Employer!";
        String body = String.format(
            "Dear %s,\n\n" +
            "Congratulations! Your account has been promoted to Employer status.\n\n" +
            "As an employer, you can now:\n" +
            "- Post new job listings\n" +
            "- View applicants for your jobs\n" +
            "- Accept or reject candidates\n\n" +
            "Start by posting your first job today!\n\n" +
            "Best regards,\n" +
            "The Job Portal Team",
            username
        );
        sendEmail(userEmail, subject, body);
    }

    public void sendPasswordResetEmail(String to, String username, String resetToken) {
        String subject = "Reset your JobPortal password";
        String resetLink = "http://localhost:5173/reset-password?token=" + resetToken;
        String body = String.format(
            "Hi %s,\n\n" +
            "We received a request to reset your JobPortal password.\n\n" +
            "Click the link below to set a new password:\n" +
            "%s\n\n" +
            "This link expires in 15 minutes and can only be used once.\n\n" +
            "If you didn't request this, you can safely ignore this email — your password hasn't been changed.\n\n" +
            "Best regards,\n" +
            "The JobPortal Team",
            username, resetLink
        );
        sendEmail(to, subject, body);
    }

    public void sendWelcomeEmail(String to, String username) {
        String subject = "Confirm your JobPortal account — " + username;
        String body = String.format(
            "Hi %s,\n\n" +
            "Welcome to JobPortal! 🎉\n\n" +
            "Your account has been successfully created.\n\n" +
            "You're all set to:\n" +
            "✅ Browse thousands of job opportunities\n" +
            "✅ Apply to jobs with your resume\n" +
            "✅ Track your application status in real-time\n" +
            "✅ Receive email notifications on every update\n\n" +
            "Login now and start your journey!\n\n" +
            "Need help? Reply to this email anytime.\n\n" +
            "Best regards,\n" +
            "The JobPortal Team",
            username
        );
        sendEmail(to, subject, body);
    }
}
