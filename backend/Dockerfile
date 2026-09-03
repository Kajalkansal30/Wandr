# Build stage
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
COPY src src
RUN mvn -q -B -DskipTests package

# Runtime
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app
RUN useradd -r -u 10001 wandr
COPY --from=build /app/target/backend-0.0.1-SNAPSHOT.jar app.jar
USER wandr
ENV PORT=8080
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
