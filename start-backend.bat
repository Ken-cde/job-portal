@echo off
set JAVA_HOME=C:\Program Files\Java\jdk-21.0.2
set PATH=%JAVA_HOME%\bin;%PATH%
echo Using Java:
java -version
echo Starting Spring Boot on port 8085...
call mvnw spring-boot:run -Dspring-boot.run.arguments="--server.port=8085"
