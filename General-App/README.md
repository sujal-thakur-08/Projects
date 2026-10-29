# General-App

Simple Spring Boot web application.

## Run locally

```powershell
./mvnw spring-boot:run
```

## Build

```powershell
./mvnw clean package
```

## Deploy online

This project is ready for Render Docker deployment.

1. Push the repository to GitHub.
2. Open Render and create a Blueprint from this repo.
3. Render uses [render.yaml](render.yaml) and [Dockerfile](Dockerfile) to build and start the app.
4. After deploy, open the Render service URL.

## Notes

- The app currently has no external database dependency.
- The included test only verifies that the Spring context starts.
