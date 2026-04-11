# Job Portal Web Application

A full-stack job portal connecting candidates with employers. Features JWT authentication, role-based access, job applications, and email notifications.

## 🌟 Features

### Candidate
- Register & Login with JWT authentication
- Browse and search jobs
- Apply to jobs with resume upload
- Track application status (Pending → Reviewed → Interviewing → Accepted/Rejected)
- View job details with requirements

### Employer
- Post new jobs with title, description, requirements, salary
- Select job type: Remote, Hybrid, or Onsite
- View all applications received
- Accept/Reject/Review candidates
- Download candidate resumes

### Admin
- Platform-wide dashboard with analytics
- View all users and manage roles
- Monitor all jobs and applications

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Backend** | Java 21, Spring Boot 3.2.2, Spring Security |
| **Database** | MySQL, Spring Data JPA, Hibernate |
| **Auth** | JWT (jjwt 0.11.5) |
| **API Docs** | SpringDoc OpenAPI 2.3.0 |
| **Frontend** | React 19, Vite, React Router DOM 7 |
| **HTTP Client** | Axios |
| **Icons** | Lucide React |
| **Email** | Spring Mail (SMTP) |

## 🚀 Quick Start

### Prerequisites
- Java 21
- Node.js 18+
- MySQL 8.0+
- Maven 3.8+

### Database Setup
```sql
CREATE DATABASE job_portal;
```

### Backend Setup

1. **Configure MySQL credentials** in `src/main/resources/application.properties`:
```properties
spring.datasource.username=your_mysql_username
spring.datasource.password=your_mysql_password
```

2. **Run the backend:**
```bash
cd job-portal
mvn spring-boot:run
```

Backend runs at: `http://localhost:8085`
Swagger API docs: `http://localhost:8085/swagger-ui/index.html`

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: `http://localhost:5173`

### Test Credentials

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@jobportal.com | admin123 |
| **Employer** | tech_corp@test.com | password123 |
| **Candidate** | Register new account | — |

---

## 📧 Email Setup (Optional)

The project supports email notifications via SMTP. Emails are sent for:
- Welcome email on registration
- Application confirmation
- Application status updates

### Mailtrap (Recommended for Development)

1. Sign up free at [https://mailtrap.io](https://mailtrap.io)
2. Go to **Inboxes → Demo Inbox**
3. Copy your credentials

Update `application.properties`:
```properties
spring.mail.username=your_mailtrap_username
spring.mail.password=your_mailtrap_password
```

### Gmail SMTP

1. Enable 2-Factor Authentication on your Gmail
2. Generate an **App Password** at [Google App Passwords](https://myaccount.google.com/apppasswords)
3. Use these settings:
```properties
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=your_email@gmail.com
spring.mail.password=your_app_password
```

---

## 🌐 Live Deployment

### Free Hosting Options

| Component | Service | Cost |
|-----------|---------|------|
| Backend (JAR) | Railway, Render, Fly.io | Free tier |
| Frontend | Vercel, Netlify | Free tier |
| Database | Railway MySQL, PlanetScale | Free tier |

### Recommended Deployment

1. **Frontend** → Deploy to [Vercel](https://vercel.com) (connect GitHub repo)
2. **Backend** → Deploy to [Railway](https://railway.app) or [Render](https://render.com)
3. **Database** → Use Railway's MySQL addon or PlanetScale

### Environment Variables for Production

```bash
# Backend (.env)
PORT=8085
spring.datasource.url=jdbc:mysql://your_production_mysql_url/job_portal
spring.datasource.username=your_db_user
spring.datasource.password=your_db_password
jwt.secret=your_super_secure_jwt_secret_key_at_least_256_bits
spring.mail.username=your_smtp_username
spring.mail.password=your_smtp_password
```

---

## 📁 Project Structure

```
job-portal/
├── src/main/java/com/jobportal/job_portal/
│   ├── config/          # CORS, Swagger, Data Seeder
│   ├── controller/     # REST endpoints
│   ├── dto/           # Data transfer objects
│   ├── exception/     # Global error handling
│   ├── model/         # JPA entities
│   ├── repository/    # Data repositories
│   ├── security/      # JWT auth & config
│   └── service/       # Business logic
├── src/main/resources/
│   └── application.properties
├── frontend/
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Page components
│   │   ├── context/      # Auth context
│   │   └── services/      # API service
│   └── package.json
└── pom.xml
```

---

## 📝 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login

### Jobs
- `GET /api/jobs` - List all jobs (paginated)
- `GET /api/jobs/search` - Search jobs
- `POST /api/jobs` - Create job (Employer/Admin)
- `PUT /api/jobs/{id}` - Update job
- `DELETE /api/jobs/{id}` - Delete job

### Applications
- `POST /api/applications/{jobId}` - Apply to job (with resume)
- `GET /api/applications/my` - My applications (Candidate)
- `GET /api/applications/my-applicants` - My applicants (Employer)

### Dashboards
- `GET /api/dashboard/candidate` - Candidate dashboard
- `GET /api/dashboard/employer` - Employer dashboard
- `GET /api/dashboard/admin` - Admin dashboard

---

## 💼 For Recruiters

To run this project locally:

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/job-portal.git
cd job-portal

# 2. Setup MySQL database
mysql -u root -p -e "CREATE DATABASE job_portal;"

# 3. Start backend
mvn spring-boot:run

# 4. Start frontend (new terminal)
cd frontend
npm install
npm run dev
```

Visit `http://localhost:5173` to access the application.

---

## 📄 License

This project is open source and available for educational and portfolio use.
