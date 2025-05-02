#!/bin/bash

# Colors for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Connecting to MySQL container...${NC}"

# Check if container is running
if ! docker-compose ps | grep -q "mtp_mysql.*Up"; then
    echo -e "${RED}Error: MySQL container is not running.${NC}"
    echo -e "Start it with: ./scripts/setup-mysql.sh"
    exit 1
fi

# Connect to MySQL
echo -e "${GREEN}Connecting to MySQL...${NC}"
docker-compose exec mysql mysql -u mtp_user -pmtp_password mtp_photography

echo -e "${GREEN}MySQL connection closed.${NC}"
