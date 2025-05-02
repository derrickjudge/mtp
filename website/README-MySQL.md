# MySQL Setup for MTP Photography Website

This guide explains how to set up the MySQL database for local development.

## Option 1: Using Docker (Recommended)

The easiest way to get started is using Docker, which avoids the need to install MySQL directly on your system.

### Prerequisites
- Docker Desktop installed ([Get Docker](https://docs.docker.com/get-docker/))

### Steps

1. Start the MySQL container:

```bash
docker-compose up -d
```

2. Create a `.env.local` file in the root directory with the following content:

```
# Database connection
DATABASE_URL="mysql://mtp_user:mtp_password@localhost:3306/mtp_photography"

# Other required environment variables
JWT_SECRET="development-secret-key-change-in-production"
NODE_ENV="development"
```

3. Run Prisma migrations to set up the database schema:

```bash
npx prisma migrate dev --name init
```

4. Generate Prisma client:

```bash
npx prisma generate
```

5. Start the development server:

```bash
npm run dev
```

## Option 2: Using an existing MySQL server

If you already have MySQL installed or prefer not to use Docker:

1. Create a new database:

```sql
CREATE DATABASE mtp_photography;
CREATE USER 'mtp_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON mtp_photography.* TO 'mtp_user'@'localhost';
FLUSH PRIVILEGES;
```

2. Import the schema:

```bash
mysql -u mtp_user -p mtp_photography < src/db/schema.sql
```

3. Create a `.env.local` file with your connection details:

```
DATABASE_URL="mysql://mtp_user:your_password@localhost:3306/mtp_photography"
JWT_SECRET="development-secret-key-change-in-production"
NODE_ENV="development"
```

4. Generate Prisma client:

```bash
npx prisma generate
```

5. Start the development server:

```bash
npm run dev
```

## Troubleshooting

- **Connection Issues**: Make sure the MySQL server is running and accessible
- **Migration Errors**: Check for any syntax errors in your Prisma schema
- **Schema Updates**: After changing the Prisma schema, run `npx prisma migrate dev` to update the database

## Production Setup

For production, you'll want to use a managed MySQL service like:
- AWS RDS for MySQL
- PlanetScale
- DigitalOcean MySQL

Update your `.env.production.local` file with the production database credentials.
