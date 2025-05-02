#!/bin/bash

# Colors for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}MTP Photography Website - MySQL Setup${NC}\n"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed or not in your PATH.${NC}"
    echo -e "Please install Docker Desktop from https://www.docker.com/products/docker-desktop"
    exit 1
fi

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}Error: docker-compose is not installed or not in your PATH.${NC}"
    echo -e "This is usually included with Docker Desktop."
    exit 1
fi

# Stop any existing containers to avoid conflicts
echo -e "${YELLOW}Stopping any existing MySQL containers...${NC}"
docker-compose down

# Start the MySQL container
echo -e "${YELLOW}Starting MySQL container...${NC}"
docker-compose up -d mysql

# Wait for MySQL to be ready
echo -e "${YELLOW}Waiting for MySQL to be ready...${NC}"
max_attempts=30
attempts=0

while [ $attempts -lt $max_attempts ]; do
    if docker-compose exec mysql mysqladmin ping -h localhost -u mtp_user -pmtp_password --silent; then
        echo -e "${GREEN}MySQL is ready!${NC}"
        break
    fi
    attempts=$((attempts+1))
    echo -e "${YELLOW}Waiting for MySQL to be ready... ($attempts/$max_attempts)${NC}"
    sleep 2
done

if [ $attempts -eq $max_attempts ]; then
    echo -e "${RED}Error: MySQL did not become ready in time.${NC}"
    echo -e "Check the logs with: docker-compose logs mysql"
    exit 1
fi

# Print connection information
echo -e "\n${GREEN}MySQL is running successfully!${NC}"
echo -e "\n${YELLOW}Connection Information:${NC}"
echo -e "Host: localhost"
echo -e "Port: 3306"
echo -e "Database: mtp_photography"
echo -e "Username: mtp_user"
echo -e "Password: mtp_password"
echo -e "Connection URL: mysql://mtp_user:mtp_password@localhost:3306/mtp_photography"

# Check if .env.local exists and update it if needed
ENV_FILE=".env.local"
if [ -f "$ENV_FILE" ]; then
    echo -e "\n${YELLOW}Checking .env.local file...${NC}"
    if grep -q "DATABASE_URL" "$ENV_FILE"; then
        echo -e "${YELLOW}DATABASE_URL already exists in $ENV_FILE. Make sure it points to:${NC}"
        echo -e "DATABASE_URL=\"mysql://mtp_user:mtp_password@localhost:3306/mtp_photography\""
    else
        echo -e "${YELLOW}Adding DATABASE_URL to $ENV_FILE...${NC}"
        echo -e "\n# MySQL Connection\nDATABASE_URL=\"mysql://mtp_user:mtp_password@localhost:3306/mtp_photography\"" >> "$ENV_FILE"
        echo -e "${GREEN}Added DATABASE_URL to $ENV_FILE${NC}"
    fi
else
    echo -e "\n${YELLOW}No .env.local file found. Creating one with DATABASE_URL...${NC}"
    echo -e "# MySQL Connection\nDATABASE_URL=\"mysql://mtp_user:mtp_password@localhost:3306/mtp_photography\"" > "$ENV_FILE"
    echo -e "${GREEN}Created $ENV_FILE with DATABASE_URL${NC}"
fi

echo -e "\n${GREEN}Setup complete!${NC}"
echo -e "${YELLOW}To stop the MySQL container, run: docker-compose down${NC}"
