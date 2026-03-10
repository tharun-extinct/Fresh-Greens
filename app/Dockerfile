# ─────────────────────────────────────────────────────────────────────────────
# Fresh Greens — Multi-stage Dockerfile
#
# Stage 1 (build)  : compiles the Spring Boot JAR using Maven wrapper
# Stage 2 (runtime): copies only the JAR into a slim JRE image
#
# The final image is ~200 MB instead of ~500 MB (no JDK / build tools).
# ─────────────────────────────────────────────────────────────────────────────

# ── Stage 1: Build ─────────────────────────────────────────────────────────────
FROM eclipse-temurin:17-jdk-alpine AS build
WORKDIR /workspace

# Copy Maven wrapper and pom first (layer-cache: only re-downloads deps when pom changes)
COPY mvnw .
COPY .mvn .mvn
COPY pom.xml .
RUN chmod +x mvnw && ./mvnw dependency:go-offline --batch-mode --no-transfer-progress

# Copy source and build
COPY src src
RUN ./mvnw package -DskipTests --batch-mode --no-transfer-progress

# ── Stage 2: Runtime ───────────────────────────────────────────────────────────
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Non-root user for security
RUN addgroup -S freshgreens && adduser -S freshgreens -G freshgreens
USER freshgreens

# Copy the built JAR from the build stage
COPY --from=build /workspace/target/*.jar app.jar

# Cloud Run injects PORT; application.properties reads ${PORT:8080}
EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
