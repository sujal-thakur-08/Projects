# Projects

A collection of web applications, desktop utilities, machine-learning experiments, and Java coursework projects.

## Project Index

### Full-stack applications

| Project | Description | Main technologies |
| --- | --- | --- |
| [AI Blog Platform](./Blog%20Page) | Multi-author blogging platform with JWT authentication, rich-text editing, comments, search, moderation, and AI-assisted writing tools. | React, TypeScript, Vite, FastAPI, MongoDB |
| [Corbin & Hudson Blog Site](./Blog%20Site) | Full-stack blog site with authentication, role-based blog management, PostgreSQL persistence, and Prisma migrations. | HTML, CSS, JavaScript, Express, PostgreSQL, Prisma |
| [Confess It](./Confess%20It) | Love quiz application with a React client and an Express API. | React, Vite, Express |
| [Journal App](./JournalApp/journalApp) | REST API for creating, reading, updating, and deleting journal entries stored in MongoDB. | Java, Spring Boot, MongoDB |
| [General App](./General-App) | Spring Boot starter application demonstrating a simple web application and application-context testing. | Java, Spring Boot, Maven |

### React and frontend projects

| Project | Description | Main technologies |
| --- | --- | --- |
| [Context API Counter](./Full%20Stack%202/4) | Counter application demonstrating global state, custom hooks, action history, and React Context API. | React, Create React App, Context API |
| [SPA Routing](./Full%20Stack%202/3/spa-routing) | Single-page application demonstrating client-side navigation with React Router. | React, Vite, React Router |
| [Routing Using React](./Routing%20using%20React) | Small React application demonstrating route-based navigation between pages. | React, Vite, React Router |
| [Authentication Context App](./spa-routing/fsd-2-lab/Experiment-1/auth-context-app) | React login and signup flow demonstrating authentication-oriented page routing. | React, Vite |
| [SPA Routing Experiment](./spa-routing/fsd-2-lab/Experiment-3/spa-routing) | Coursework experiment implementing client-side routing in a React SPA. | React, Vite, React Router |
| [Login Tracker](./fsd-2-lab/Experimant-1/login-tracker) | Login-state demo using Context API, localStorage persistence, and cross-tab storage events. | React, Vite, Context API |
| [Resume](./resume) | Responsive, printable personal resume page. | HTML, CSS |

### Desktop and Python applications

| Project | Description | Main technologies |
| --- | --- | --- |
| [Victus](./Victus) | Windows voice assistant with speech recognition, text-to-speech, application launching, hotkeys, system controls, and a tray interface. | Python, CustomTkinter, Vosk, pyttsx3 |
| [Apple Music Mini Player](./Music/mini-player) | Electron mini-player that controls Apple Music Web through a compact desktop interface. | Electron, Node.js, JavaScript |
| [Apple Music Mini Player UI](./mini-player-ui/mini-player) | UI-focused copy of the Electron mini-player project. | Electron, Node.js, JavaScript |
| [SVM Classifier](./AML) | Machine-learning experiment comparing linear and RBF SVM kernels on the Breast Cancer Wisconsin dataset. | Python, scikit-learn |

### Java coursework

| Project | Description | Main technologies |
| --- | --- | --- |
| [JUnit Unit Testing Experiment 6](./Software%20Engineering/Exp-6) | Calculator example with JUnit 5 tests covering arithmetic, predicates, and safe division. | Java, Maven, JUnit 5 |

## Quick Start

Each project is self-contained. Open the project directory and follow its local README when one is available.

### Java and Spring Boot

```powershell
cd "General-App"
.\mvnw.cmd spring-boot:run
```

For the [Journal App](./JournalApp/journalApp), start MongoDB locally first, then run:

```powershell
cd "JournalApp\journalApp"
.\mvnw.cmd spring-boot:run
```

For the JUnit experiment:

```powershell
cd "Software Engineering\Exp-6"
mvn test
```

### React and Node.js

```powershell
cd "Routing using React"
npm install
npm run dev
```

The full-stack projects have separate setup instructions in their local READMEs. Copy each `.env.example` to `.env` where provided, and never commit credentials or local environment files.

### Python

```powershell
cd "Victus"
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python main.py
```

For the SVM experiment:

```powershell
cd "AML"
pip install scikit-learn
python svm_classifier.py
```

## Repository Notes

- Project-specific documentation is kept inside each project directory.
- Generated folders such as `node_modules`, `target`, and build output should not be committed.
- Database-backed applications require their documented local services and environment variables.
- Deployment configurations are included in selected projects for Render, Netlify, and Vercel
