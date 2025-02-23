# Use the official MariaDB image
FROM mariadb:latest

# Set environment variables for MariaDB
ENV MYSQL_ROOT_PASSWORD=admin
ENV MYSQL_DATABASE=ludibasquet-inscripcions

# Copy the initialization SQL file into the appropriate directory
COPY init.sql /docker-entrypoint-initdb.d/

# Expose MariaDB default port
EXPOSE 3306
