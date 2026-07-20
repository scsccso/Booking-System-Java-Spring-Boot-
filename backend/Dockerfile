# Stage 1: Build
FROM maven:3.8.5-openjdk-17 AS builder
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Runtime
FROM openjdk:17-slim
WORKDIR /
# Create a volume directory for H2 persistent database
RUN mkdir /data
# Expose the application port
EXPOSE 8081
# Copy the built jar from the builder stage
COPY --from=builder /app/target/*.jar /app.jar
# Start the application
ENTRYPOINT ["java", "-jar", "/app.jar"]
