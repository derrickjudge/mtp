# MTP Photography - MySQL Database Integration

This document provides an overview of the MySQL database integration for the MTP Photography website.

## Overview

The MTP Photography website uses a MySQL database to store information about photos, categories, and tags. The application uses direct MySQL connections with the `mysql2/promise` library for database interactions.

## Architecture

### Database Connection

Database connections are managed through a connection pool in `/src/lib/database.ts`. The connection pool provides:

- Automatic connection management
- Connection reuse
- Automatic retry for transient errors
- Transaction support
- Environment-based configuration

### Database Schema

The database follows a normalized schema design:

- **photos**: Stores photo information including metadata
- **categories**: Stores photo categories
- **tags**: Stores photo tags
- **photo_tags**: Many-to-many relationship between photos and tags

### API Routes

The following API routes interact with the database:

- **GET /api/categories**: List all categories
- **POST /api/categories**: Create a new category
- **GET /api/photos**: List photos with optional filtering and pagination
- **POST /api/photos**: Create a new photo
- **GET /api/photos/[id]**: Get a specific photo
- **PUT /api/photos/[id]**: Update a photo
- **DELETE /api/photos/[id]**: Delete a photo

## Environment Configuration

The database connection uses the following environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| DB_HOST | Database host | localhost |
| DB_PORT | Database port | 3306 |
| DB_USER | Database username | mtp_user |
| DB_PASSWORD | Database password | mtp_password |
| DB_NAME | Database name | mtp_photography |
| DB_CONNECTION_LIMIT | Max connections in pool | 10 |
| DB_SSL | Use SSL for connection | false |

## Development Scripts

The following scripts are available for database management:

- **npm run db:setup**: Start MySQL container
- **npm run db:teardown**: Stop MySQL container
- **npm run db:teardown:clean**: Stop MySQL container and remove data volume
- **npm run db:connect**: Connect to MySQL database CLI
- **npm run db:test**: Test database connectivity
- **npm run db:schema**: Apply database schema
- **npm run db:clean**: Clean up duplicate records
- **npm run db:reset**: Full database reset and setup
- **npm run api:test**: Test API endpoints

## Error Handling

The database integration includes comprehensive error handling:

1. **Transient Errors**: Automatically retried with exponential backoff
2. **Connection Issues**: Detected and reported clearly
3. **Transaction Management**: Automatic rollback on errors

## Security Considerations

The database integration implements several security best practices:

1. **Parameterized Queries**: All queries use parameterized statements to prevent SQL injection
2. **Connection Pooling**: Connections are managed through a pool for better security
3. **Environment Variables**: Sensitive information stored in environment variables
4. **Error Handling**: Error messages don't expose sensitive database details

## Future Improvements

Potential areas for improvement in the database integration:

1. **Caching Layer**: Add caching for frequently accessed data
2. **Query Optimization**: Review and optimize complex queries
3. **Database Migrations**: Add a migration system for schema changes
4. **Read/Write Separation**: Split read and write operations for scaling

## Troubleshooting

Common issues and their solutions:

1. **Connection Issues**: Ensure Docker container is running (`npm run db:setup`)
2. **Permissions**: Check user permissions in MySQL
3. **Duplicate Records**: Run `npm run db:clean` to remove duplicates
4. **Performance Issues**: Check query performance with `EXPLAIN`

---

*Documentation created on May 1, 2025*
