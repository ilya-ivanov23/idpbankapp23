# Stage 1: Build (using Maven image)
FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /app
# Copy pom.xml first to cache dependencies
COPY pom.xml .
RUN mvn dependency:go-offline
# Copy source code and package without tests
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Runtime (using lightweight JRE image)
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
# Get the built .jar file from the build stage
COPY --from=build /app/target/*.jar app.jar

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]
