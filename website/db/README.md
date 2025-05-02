# MTP Photography Database

## Overview

This directory contains the MySQL database schema and migration files for the MTP Photography website.

## Database Schema

The database follows a normalized relational design with the following tables:

- **categories**: Photography categories (Concerts, Sports, Nature, etc.)
- **photos**: The main photo entries with metadata
- **tags**: Keywords that can be applied to photos
- **photo_tags**: Junction table linking photos to tags (many-to-many)
- **users**: User accounts for authentication

### Entity-Relationship Diagram (simplified)

```
categories 1──────n photos n──────n tags
                              (via photo_tags)
```

## Migrations

Migrations are applied in numeric order:

1. **001_initial_schema.sql**: Creates the database tables and relationships
2. **002_seed_data.sql**: Populates the database with sample data for development

## Development Setup

### Using Docker

The easiest way to get started is using Docker:

```bash
# Start the MySQL container
docker-compose up -d

# To view logs
docker-compose logs -f

# To stop the container
docker-compose down
```

The MySQL server will be available at:
- Host: localhost
- Port: 3306
- Database: mtp_photography
- User: mtp_user
- Password: mtp_password

### Manual Database Setup

If you prefer to use an existing MySQL server:

1. Create a database and user:
```sql
CREATE DATABASE mtp_photography;
CREATE USER 'mtp_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON mtp_photography.* TO 'mtp_user'@'localhost';
FLUSH PRIVILEGES;
```

2. Apply the migrations:
```bash
mysql -u mtp_user -p mtp_photography < db/migrations/001_initial_schema.sql
mysql -u mtp_user -p mtp_photography < db/migrations/002_seed_data.sql
```

## Database Connection

To connect to the database from the application, update the `.env.local` file:

```
DATABASE_URL="mysql://mtp_user:mtp_password@localhost:3306/mtp_photography"
```

## Notes

- The initial schema includes foreign key constraints to maintain data integrity
- Timestamps are automatically maintained for created_at and updated_at fields
- UTF8MB4 character set is used to ensure proper Unicode support
