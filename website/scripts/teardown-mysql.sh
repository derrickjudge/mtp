#!/bin/bash

# Colors for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Help message
if [[ "$1" == "--help" || "$1" == "-h" ]]; then
    echo "Usage: $0 [OPTIONS]"
    echo "Teardown MySQL containers and optionally remove data volumes."
    echo ""
    echo "Options:"
    echo "  --remove-volume, -r    Remove MySQL data volume (will delete all data)"
    echo "  --help, -h             Show this help message"
    exit 0
fi

# Check for remove volume flag
REMOVE_VOLUME=false
if [[ "$1" == "--remove-volume" || "$1" == "-r" ]]; then
    REMOVE_VOLUME=true
fi

echo -e "${YELLOW}Stopping MySQL containers...${NC}"
docker-compose down

echo -e "${GREEN}MySQL containers stopped successfully.${NC}"

# Handle volume removal based on flag or prompt
if [[ "$REMOVE_VOLUME" == true ]]; then
    echo -e "${YELLOW}Removing MySQL data volume...${NC}"
    docker volume rm "$(docker-compose config --volumes | grep mysql_data)" 2>/dev/null || echo -e "${YELLOW}No volumes to remove or volume already removed.${NC}"
    echo -e "${GREEN}MySQL data volume removed.${NC}"
else
    # Ask if user wants to remove volumes - only in interactive mode and if no flags provided
    if [[ -t 0 && $# -eq 0 ]]; then  # Check if stdin is a terminal and no args provided
        read -p "Do you want to remove the MySQL data volume? This will delete all data! (y/N): " response
        if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
            echo -e "${YELLOW}Removing MySQL data volume...${NC}"
            docker volume rm "$(docker-compose config --volumes | grep mysql_data)" 2>/dev/null || echo -e "${YELLOW}No volumes to remove or volume already removed.${NC}"
            echo -e "${GREEN}MySQL data volume removed.${NC}"
        else
            echo -e "${GREEN}MySQL data volume preserved.${NC}"
        fi
    else
        echo -e "${GREEN}MySQL data volume preserved.${NC}"
    fi
fi

echo -e "${GREEN}Teardown complete!${NC}"
