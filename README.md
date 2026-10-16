# WhatsApp-like Messaging Application — Monorepo

Production-grade real-time messaging platform across Web, Mobile, and Spring Boot backend.

## Project Structure
```
├── apps/
│   ├── web/                         # React + TypeScript (Vite + Vanilla CSS)
│   └── mobile/                      # React Native + Expo
├── backend/                         # Java 21+ & Spring Boot 3.4
│   ├── src/main/java/com/chat/
│   └── src/main/resources/
│       ├── application.yml
│       └── db/migration/
├── packages/
│   └── shared-types/                # Shared TypeScript contracts & payloads
├── infra/
│   └── docker/
├── docs/                            # Architecture, schema, contracts, security
├── docker-compose.yml
└── .env.example
```

## Quick Start (Local Development)

### 1. Prerequisites
- Docker & Docker Compose
- Node.js 20+ & npm
- JDK 21+ & Maven 3.9+

### 2. Infrastructure Services
Start PostgreSQL, Redis, and MinIO:
```bash
docker compose up -d postgres redis minio
```

### 3. Backend (Spring Boot)
```bash
cd backend
mvn clean package -DskipTests
mvn spring-boot:run
```
The API starts on `http://localhost:8080`, and runs Flyway database migrations automatically.

### 4. Web Application (React + TypeScript)
```bash
npm install
npm --workspace=apps/web run dev
```
Open `http://localhost:5173` in your browser.

### 5. Running with Docker Compose (All-in-one)
```bash
docker compose up --build
```
