# Ray-Martin CRM

A modern, full-stack Customer Relationship Management (CRM) and publishing workflow system built with **React 19**, **Vite**, **Tailwind CSS v4**, **Node.js**, **Express**, **Prisma ORM**, and **MongoDB (Replica Set)**. Fully containerized with **Docker** and orchestrated via **Docker Compose** and **Make**.

---

## Table of Contents

- [System Architecture](#system-architecture)
- [Key Features](#key-features)
- [Important Dependencies](#important-dependencies)
  - [Frontend Dependencies](#frontend-dependencies)
  - [Backend Dependencies](#backend-dependencies)
  - [Database & Infrastructure](#database--infrastructure)
- [Quick Start with Docker](#quick-start-with-docker)
- [Bash & CLI Usage Commands](#bash--cli-usage-commands)
  - [1. Starting and Stopping the App](#1-starting-and-stopping-the-app)
  - [2. Viewing Live Logs](#2-viewing-live-logs)
  - [3. Database and Prisma ORM Commands](#3-database-and-prisma-orm-commands)
  - [4. Direct Docker Compose Bash Commands](#4-direct-docker-compose-bash-commands)
  - [5. Container Shell Access](#5-container-shell-access)
  - [6. Managing Dependencies Inside Docker](#6-managing-dependencies-inside-docker)
  - [7. Teacher Category-Wise SQL to NoSQL Transfer](#7-teacher-category-wise-sql-to-nosql-transfer)
- [Local Development (Without Docker)](#local-development-without-docker)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Environment Variables](#environment-variables)
- [Default Seed Accounts & Roles](#default-seed-accounts--roles)
- [Troubleshooting & Common Issues](#troubleshooting--common-issues)

---

## System Architecture

```
                       ┌────────────────────────┐
                       │   Client (React 19)    │
                       │   http://localhost:5173 │
                       └───────────┬────────────┘
                                   │
                       (REST API & Axios Calls)
                                   │
                                   ▼
                       ┌────────────────────────┐
                       │   Server (Express)     │
                       │   http://localhost:5001 │
                       └───────────┬────────────┘
                                   │
                           (Prisma ORM v6)
                                   │
                                   ▼
                       ┌────────────────────────┐
                       │   MongoDB 7.0 (rs0)    │
                       │   localhost:27018      │
                       └────────────────────────┘
```

| Service | Host Port | Container Port | Description |
| :--- | :--- | :--- | :--- |
| **Client** | `5173` | `5173` | Vite Dev Server with HMR |
| **Server** | `5001` | `5000` | Node.js / Express REST API |
| **MongoDB** | `27018` | `27017` | MongoDB 7.0 with replica set `rs0` |
| **Prisma Studio** | `5555` | `5555` | Visual Database Browser (when running) |

---

## Key Features

- **Educational Taxonomy Hierarchy**: Hierarchical management of Boards (`CBSE`, `ICSE`, `State Board`), Classes, Subjects, and Categories.
- **Dynamic RBAC & Granular Permissions**: Multi-tiered Role-Based Access Control (`SUPERADMIN`, `ADMIN`, `EDITOR`, `ACCOUNT`, `SALESMAN`, `BOOKSELLER`) with per-menu action matrices (`canView`, `canCreate`, `canEdit`, `canDelete`).
- **Product Catalog & Rich Editor**: Book and product management with multi-image upload galleries, pricing, and rich-text descriptions via **CKEditor 5**.
- **Specimen Tracking**: End-to-end specimen record dispatch, acknowledgment, and approval workflows.
- **Leads & Deals Pipeline**: Contact management with stage pipelines (`QUALIFICATION`, `PROPOSAL`, `NEGOTIATION`, `CLOSED_WON`, `CLOSED_LOST`).
- **Task & Activity Management**: Interactive Kanban/task tracking with role assignments, status transitions, comments, and audit logging.
- **Stock & Master Data**: Comprehensive inventory management and centralized dropdown masters.

---

## Important Dependencies

### Frontend Dependencies (`client/package.json`)

| Package | Version | Purpose & Usage |
| :--- | :--- | :--- |
| **`react`** | `^19.2.6` | Core React 19 UI library. |
| **`react-dom`** | `^19.2.6` | React DOM rendering engine for web. |
| **`vite`** | `^8.0.12` | Next-generation frontend build tool and lightning-fast HMR dev server. |
| **`@vitejs/plugin-react`** | `^6.0.1` | Official Vite plugin for React fast refresh and JSX transformation. |
| **`tailwindcss`** | `^4.3.1` | Utility-first CSS styling framework (v4 engine). |
| **`@tailwindcss/vite`** | `^4.3.1` | Official Tailwind CSS v4 compiler integration for Vite. |
| **`react-router-dom`** | `^7.18.0` | Client-side routing, protected routes, and URL parameter handling. |
| **`@ckeditor/ckeditor5-react`** | `^11.2.0` | Official React integration component for CKEditor 5. |
| **`@ckeditor/ckeditor5-build-classic`** | `^41.4.2` | Classic build of CKEditor 5 used for rich product descriptions. |
| **`axios`** | `^1.18.0` | Promise-based HTTP client for calling backend REST APIs with JWT headers. |
| **`lucide-react`** | `^1.21.0` | Clean, modern SVG icon set for dashboard navigation and actions. |
| **`react-icons`** | `^5.6.0` | Extensive icon packs (FontAwesome, Material, etc.) for UI accents. |

### Backend Dependencies (`server/package.json`)

| Package | Version | Purpose & Usage |
| :--- | :--- | :--- |
| **`express`** | `^4.21.0` | Fast, unopinionated web framework for Node.js REST API routing. |
| **`@prisma/client`** | `^6.9.0` | Auto-generated, type-safe database client for MongoDB. |
| **`prisma`** | `^6.9.0` | Prisma CLI for schema management, migrations (`db push`), and Prisma Studio. |
| **`bcryptjs`** | `^2.4.3` | Secure password hashing for user accounts and authentication. |
| **`jsonwebtoken`** | `^9.0.2` | JWT token generation and verification for stateless authentication. |
| **`cors`** | `^2.8.5` | Cross-Origin Resource Sharing middleware to allow requests from client origin. |
| **`dotenv`** | `^16.4.7` | Loads environment variables from `.env` files into `process.env`. |
| **`morgan`** | `^1.10.0` | HTTP request logger middleware for debugging incoming API calls. |
| **`multer`** | `^1.4.5-lts.1`| Multipart/form-data handler for file uploads (product images, assets). |
| **`nodemon`** | `^3.1.0` | Dev server auto-reloader on backend source code modifications. |

### Database & Infrastructure

| Technology | Version / Base Image | Purpose & Usage |
| :--- | :--- | :--- |
| **MongoDB** | `mongo:7.0` | Document database with replica set (`rs0`) required for Prisma transactions. |
| **Docker** | Multi-stage | Containerization of server, client, and database services. |
| **Docker Compose** | Compose v2 | Multi-container orchestration, networking, and volume management. |

---

## Quick Start with Docker

The fastest way to spin up the entire system is using `make`:

```bash
# 1. Clone the repository and enter directory
cd Ray-Martin-CRM

# 2. Build images and start all containers in detached mode
make dev-build-detach

# 3. View live logs
make logs
```

Once running, access the services:
- **Frontend App**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:5001/api](http://localhost:5001/api)
- **API Health Check**: [http://localhost:5001/api/health](http://localhost:5001/api/health)

---

## Bash & CLI Usage Commands

The project supports three convenient ways to run commands:
1. **`make <target>`** (Recommended)
2. **`npm run <script>`** (From project root)
3. **`docker compose <command>`** (Direct Docker CLI)

---

### 1. Starting and Stopping the App

#### Using `make`:
```bash
# Start all containers in foreground (live terminal output)
make dev

# Rebuild images and start in foreground
make dev-build

# Start all containers in background (detached mode)
make dev-detach

# Rebuild images and start in background
make dev-build-detach

# Stop all running containers
make down

# Stop containers and remove all persistent volumes (fresh start)
make clean
```

#### Using root `npm`:
```bash
# Start containers
npm run dev

# Rebuild and start
npm run dev:build

# Start detached in background
npm run dev:detach

# Stop containers
npm run down

# Stop and wipe volumes
npm run down:volumes
```

---

### 2. Viewing Live Logs

Stream live container output in your terminal:

```bash
# Stream logs from all containers
make logs
# Or: npm run logs

# Stream backend server logs only
make logs-server
# Or: npm run logs:server

# Stream frontend client logs only
make logs-client
# Or: npm run logs:client

# Stream MongoDB logs only
make logs-db
# Or: npm run logs:db
```

To tail specific line counts directly with Docker:
```bash
docker logs --tail 50 -f crm-server
docker logs --tail 50 -f crm-client
```

---

### 3. Database and Prisma ORM Commands

All database management can be executed while Docker containers are running:

```bash
# 1. Push Prisma schema changes to MongoDB
make prisma-push
# Or: npm run prisma:push

# 2. Re-generate Prisma Client (after modifying schema.prisma)
make prisma-generate
# Or: npm run prisma:generate

# 3. Seed database with roles, menus, permissions, users, and taxonomies
make seed
# Or: npm run seed

# 4. Open interactive Prisma Studio web interface (http://localhost:5555)
make prisma-studio
# Or: npm run prisma:studio

# 5. Open interactive MongoDB Shell (mongosh)
make db-shell

# 6. Check MongoDB Replica Set health
make db-status

# 7. Manually trigger replica set initiation if uninitialized
make db-init
```

---

### 4. Direct Docker Compose Bash Commands

If you prefer using standard Docker commands:

```bash
# Start services
docker compose up -d

# Start services with build
docker compose up -d --build

# Stop services
docker compose down

# Check running container statuses and ports
docker compose ps

# Restart a specific service
docker compose restart client
docker compose restart server
docker compose restart mongodb
```

---

### 5. Container Shell Access

To jump into an interactive shell inside any container:

```bash
# Access Server container (sh shell)
npm run server:shell
# Or: docker compose exec server sh

# Access Client container (sh shell)
npm run client:shell
# Or: docker compose exec client sh

# Access MongoDB container (mongosh shell)
docker compose exec mongodb mongosh crm
```

---

### 6. Managing Dependencies Inside Docker

> [!IMPORTANT]
> The client and server containers mount an anonymous volume for `/app/node_modules` in `docker-compose.yml` to preserve compiled container binaries. When you add a new dependency to `package.json`, the running volume does **not** update automatically.

#### A. Install a new package inside the running container:
```bash
# Install a package in the frontend container
docker compose exec client npm install <package-name>

# Install a package in the backend container
docker compose exec server npm install <package-name>
```

#### B. Sync container `node_modules` after pulling new changes:
```bash
# Sync client dependencies in container
docker compose exec client npm install

# Sync server dependencies in container
docker compose exec server npm install
```

#### C. Force recreate containers with fresh anonymous volumes:
```bash
# Rebuilds image and resets anonymous volumes so new package.json is installed fresh
docker compose up -d --build -V
```

#### D. Keep local host `node_modules` in sync (for IDE intellisense):
```bash
# In client
npm --prefix client install

# In server
npm --prefix server install
```

---

### 7. Teacher Category-Wise SQL to NoSQL Transfer

A dedicated, high-speed transfer pipeline to extract, categorize, filter, and import large-scale teacher master data from relational SQL dumps into MongoDB.

#### Available Scripts:
- **`./transfer_teachers.sh`**: Root bash runner with an interactive menu and CLI flags.
- **`server/src/scripts/transfer_teachers_sql_to_mongo.py`**: High-performance streaming parser and containerized `mongoimport` engine.
- **`server/src/scripts/transfer_teachers.js`**: Node.js & Prisma batch pipeline.
- **`server/src/scripts/README_TEACHER_TRANSFER.md`**: Detailed technical documentation.

#### A. Interactive Menu (Recommended)
Run without arguments to launch the interactive selector:
```bash
./transfer_teachers.sh
```

#### B. Quick Statistics & Validation Report (No DB changes)
Inspect category counts (School vs Private Tutors), class distributions (Class 5–12), and top districts:
```bash
./transfer_teachers.sh --stats
```

#### C. Transfer by Category
```bash
# Transfer ALL teachers (both School Teachers and Private Tutors)
./transfer_teachers.sh --category all

# Transfer School Teachers only
./transfer_teachers.sh --category school

# Transfer Private Tutors / Teachers only
./transfer_teachers.sh --category private
```

#### D. Transfer Class-Wise (Classes 5 to 12)
```bash
# Transfer School Teachers teaching Class 10
./transfer_teachers.sh --category school --class 10

# Transfer Private Tutors teaching Class 12
./transfer_teachers.sh --category private --class 12
```

#### E. Filter by District
```bash
./transfer_teachers.sh --category school --district KOLKATA
```

#### F. Export Category-Separated Files
Generates separate NDJSON files per category (`/tmp/teachers_school.ndjson` and `/tmp/teachers_private_tutor.ndjson`):
```bash
./transfer_teachers.sh --split
```

#### G. Run Inside Docker / NPM
```bash
# View statistics report
docker compose exec crm-server npm run transfer:teachers:stats

# Transfer School Teachers
docker compose exec crm-server npm run transfer:teachers:school

# Transfer Private Tutors
docker compose exec crm-server npm run transfer:teachers:private
```

---

## Local Development (Without Docker)

If you prefer running the application directly on your host machine:

### Prerequisites
- **Node.js**: `v20.x` or higher
- **npm**: `v10.x` or higher
- **MongoDB**: `v7.0` running locally with replica set enabled (`--replSet rs0`)

---

### Backend Setup

```bash
# 1. Navigate to server directory
cd server

# 2. Install dependencies
npm install

# 3. Create .env file (see Environment Variables section)
cp ../.env.example .env

# 4. Generate Prisma Client
npx prisma generate

# 5. Push schema to MongoDB
npx prisma db push

# 6. Seed default data
npm run seed

# 7. Start development server with nodemon
npm run dev
```
Backend will start on: `http://localhost:5000` (or `http://localhost:5001` depending on `.env`).

---

### Frontend Setup

```bash
# 1. Navigate to client directory
cd client

# 2. Install dependencies
npm install

# 3. Start Vite development server
npm run dev
```
Frontend will start on: `http://localhost:5173`.

---

## Environment Variables

Copy `.env.example` to `.env` in the root or set environment variables in your deployment:

```bash
cp .env.example .env
```

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `DATABASE_URL` | `mongodb://mongodb:27017/crm?replicaSet=rs0` | MongoDB connection URI with replica set parameter. |
| `PORT` | `5000` | Internal port the Express server listens on. |
| `NODE_ENV` | `development` | Runtime environment (`development` or `production`). |
| `JWT_SECRET` | `crm-dev-jwt-secret-key-2024` | Secret string used to sign and verify JSON Web Tokens. |
| `CORS_ORIGIN` | `http://localhost:5173` | Allowed origin for Cross-Origin requests from the client. |
| `VITE_API_URL` | `http://localhost:5001/api` | Base URL used by Axios in the client to reach the API. |

---

## Default Seed Accounts & Roles

When the database is initialized or `make seed` is executed, the following default test accounts are provisioned:

> **Default Password for all seed users:** `admin123`

| Role | Email Address | Access Level |
| :--- | :--- | :--- |
| **`SUPERADMIN`** | `superadmin@crm.com` | Full system bypass rights across all modules. |
| **`ADMIN`** | `admin@crm.com` | Full administrative privileges and user management. |
| **`EDITOR`** | `editor@crm.com` | Read and write access to catalog, taxonomy, and content. |
| **`ACCOUNT`** | `account@crm.com` | Financial records, deals, and reports view access. |
| **`SALESMAN`** | `salesman@crm.com` | Lead tracking, customer contacts, and specimen dispatch. |

---

## Troubleshooting & Common Issues

### 1. `[plugin:vite:import-analysis] Failed to resolve import "@ckeditor/..."`
- **Cause**: A dependency was added to `client/package.json` while the container was running, but the persistent `/app/node_modules` volume in Docker didn't have it installed.
- **Fix**: Run `docker compose exec client npm install` and restart the client with `docker compose restart client`.

### 2. MongoDB Replica Set `rs0` not initialized
- **Symptom**: Prisma throws `PrismaClientInitializationError: ...replica set...`.
- **Fix**: Run `make db-init` or:
  ```bash
  docker compose exec mongodb mongosh --eval "rs.initiate({ _id: 'rs0', members: [{ _id: 0, host: 'mongodb:27017' }] })"
  ```

### 3. Port Conflicts
- **Ports used**: `5173` (Client), `5001` (Server), `27018` (MongoDB).
- **Fix**: If any port is already in use by another process on your host, check what is using it:
  ```bash
  lsof -i :5173
  lsof -i :5001
  lsof -i :27018
  ```
  Terminate the conflicting process or change the host port mapping in `docker-compose.yml`.

### 4. Prisma Schema Out of Sync
- **Symptom**: New database fields not recognized in code or queries fail.
- **Fix**:
  ```bash
  make prisma-generate
  make prisma-push
  ```

---

## License

Private & Proprietary — Ray-Martin CRM.
