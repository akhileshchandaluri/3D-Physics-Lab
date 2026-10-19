# PhySim Backend — Spring Boot Service

Spring Boot 3.4 / Java 21 REST API and PostgreSQL persistence layer for the PhySim Virtual Physics Laboratory.

## Prerequisites

- **Java Development Kit (JDK)**: Version 21 (e.g. Eclipse Temurin 21)
- **Apache Maven**: Version 3.9+
- **PostgreSQL**: Version 14+ running on port `5432`

---

## Required Environment Variables

When running in production or staging environments (profiles other than `local` and `test`), the following environment variables **must** be provided:

| Variable | Description | Required in Production | Default (Local Dev Profile) |
|---|---|---|---|
| `DATABASE_URL` | JDBC connection URL for PostgreSQL | Yes | `jdbc:postgresql://localhost:5432/physim` |
| `DATABASE_USERNAME` | PostgreSQL database user | Yes | `postgres` |
| `DATABASE_PASSWORD` | PostgreSQL database password | Yes | (empty string) |
| `SESSION_SECRET` | 32+ character key for signing session cookies | Yes | `dev_secret_cookie_signing_key_at_least_32_chars_long!` |
| `INITIAL_ADMIN_PASSWORD` | Initial password for the seed admin account | Yes | `AdminPassword123!` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth2 client secret | Yes | `dev-fake-google-client-secret` |
| `PORT` | HTTP server port | No | `8080` |
| `CORS_ALLOWED_ORIGINS` | Permitted browser CORS origins | No | `http://localhost:5173,http://localhost:5174` |
| `INITIAL_ADMIN_EMAIL` | Initial email for seed admin account | No | `admin@physim.edu` |
| `INITIAL_ADMIN_NAME` | Initial name for seed admin account | No | `System Administrator` |
| `GOOGLE_CLIENT_ID` | Google OAuth2 client ID | No | `mock-google-client-id.apps.googleusercontent.com` |

---

## PowerShell Setup and Startup Example

### 1. Create the PostgreSQL Database
```powershell
# Set PostgreSQL bin path if not already in PATH
$env:PGUSER = "postgres"
$env:PGPASSWORD = "your_postgres_password"

# Create database 'physim'
psql -U postgres -h localhost -p 5432 -c "CREATE DATABASE physim;"
```

### 2. Configure Environment Variables
```powershell
$env:SPRING_PROFILES_ACTIVE = "local"
$env:DATABASE_URL = "jdbc:postgresql://localhost:5432/physim"
$env:DATABASE_USERNAME = "postgres"
$env:DATABASE_PASSWORD = ""
$env:SESSION_SECRET = "dev_secret_cookie_signing_key_at_least_32_chars_long!"
$env:INITIAL_ADMIN_PASSWORD = "AdminPassword123!"
$env:GOOGLE_CLIENT_SECRET = "dev-fake-google-client-secret"
```

### 3. Run Backend Tests
```powershell
mvn -f apps/backend/pom.xml clean test
```

### 4. Start Backend Server
```powershell
mvn -f apps/backend/pom.xml spring-boot:run
```

Once running, verify system health:
```powershell
Invoke-RestMethod -Uri "http://localhost:8080/api/health"
```

Swagger API documentation is available at:
`http://localhost:8080/swagger-ui.html`
