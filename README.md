# Junior Astronaut Mission Trainer

An educational project developed for the **NASA Space Apps Challenge 2026**. The project aims to introduce students to space exploration through interactive missions and science-based learning experiences.

## Project Structure

The repository is organized into separate folders to keep the frontend, backend, research, design, and presentation materials easy to manage.

```text
junior-astronaut-mission-trainer/
├── mission-trainer-frontend/
│   ├── html/
│   ├── css/
│   ├── js/
│   └── assets/
│
├── mission-trainer-backend/
│   ├── src/
│   └── pom.xml
│
├── docs/
│   ├── research/
│   ├── design/
│   └── presentation/
│
└── README.md
```

### 1. `mission-trainer-frontend/` — User Interface

Contains the code responsible for everything users see and interact with in the application.

- **`html/`** — HTML files that define the structure of the web pages and application screens.
- **`css/`** — CSS files that control the visual appearance, layout, colors, typography, and responsive design.
- **`js/`** — JavaScript files that handle user interactions, game logic on the client side, and communication with the backend APIs.
- **`assets/`** — Images, icons, illustrations, audio files, and other static resources used by the interface.

**Responsible team:** Frontend developers.

### 2. `mission-trainer-backend/` — Server-Side Application

Contains the Java Spring Boot application responsible for server-side logic and data processing.

- **`src/`** — Application source code, configuration files, and tests.
- **`pom.xml`** — Maven configuration file that defines project dependencies, build settings, and other backend configuration.

The backend may provide REST APIs for mission data, decision validation, scoring, and progress tracking, depending on the final project requirements.

#### Run the backend

The repository root is a Maven aggregator. In IntelliJ IDEA, open the root `pom.xml` as a Maven project and use Java 17. On Windows PowerShell, start the backend from the repository root with:

```powershell
.\mission-trainer-backend\mvnw.cmd -f pom.xml -pl mission-trainer-backend spring-boot:run
```

When it starts, check `http://localhost:8080/api/health`; it should return `{"status":"UP"}`.

**Responsible team:** Backend developers.

### 3. `docs/` — Project Documentation

Contains the supporting materials needed to develop, validate, and present the project.

- **`research/`** — Scientific research, verified facts, references, and source links used to develop the missions.
- **`design/`** — UI/UX specifications, user flows, wireframes, design decisions, and links to design tools such as Figma.
- **`presentation/`** — Presentation slides, demo scripts, project summaries, and other materials prepared for the final presentation.

**Responsible team:** Research, UI/UX, and presentation contributors.

### 4. `README.md` — Project Guide

This file provides an overview of the project, explains the repository structure, and helps team members understand where to find and contribute their work.

## Collaboration Guidelines

To keep the project organized:

1. Work only on the files related to your assigned task.
2. Create a separate Git branch for each feature or significant change.
3. Use clear commit messages that describe your changes.
4. Open a Pull Request before merging changes into the `main` branch.
5. Document scientific claims with reliable sources.
6. Coordinate frontend and backend changes through agreed API contracts.

## Development Status

The project structure is a starting point. The technology stack, mission scope, API design, and implementation details will be finalized as the team defines the minimum viable product (MVP).

## Team

A collaborative project combining frontend development, backend development, UI/UX design, scientific research, and presentation.

## Challenge

NASA Space Apps Challenge 2026

