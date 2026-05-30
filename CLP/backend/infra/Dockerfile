# Shared multi-stage build for every service. Build context = CLP/backend.
# Host needs no Java/Maven — everything builds inside the image.
FROM maven:3.9-eclipse-temurin-21 AS build
ARG SERVICE_NAME
WORKDIR /workspace

# Copy poms first for dependency caching
COPY pom.xml ./
COPY common-lib/pom.xml common-lib/
COPY ingestion-service/pom.xml ingestion-service/
COPY profile-service/pom.xml profile-service/
COPY risk-service/pom.xml risk-service/
COPY intervention-service/pom.xml intervention-service/
COPY consent-service/pom.xml consent-service/
COPY reporting-service/pom.xml reporting-service/

# Copy all sources and build the target service (+ its deps via -am)
COPY . .
RUN mvn -B -q -pl ${SERVICE_NAME} -am -DskipTests clean package

FROM eclipse-temurin:21-jre AS run
ARG SERVICE_NAME
WORKDIR /app
COPY --from=build /workspace/${SERVICE_NAME}/target/*.jar app.jar
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
