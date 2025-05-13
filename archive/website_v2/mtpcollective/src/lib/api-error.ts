import { NextResponse } from 'next/server';
import { Prisma } from '../generated/prisma';
import { PrismaClientKnownRequestError, PrismaClientValidationError } from '@prisma/client/runtime/library';

export class ApiError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function handleApiError(error: unknown) {
  console.error('API Error:', error);

  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        error: error.message,
        details: error.details,
      },
      { status: error.statusCode }
    );
  }

  if (error instanceof PrismaClientKnownRequestError) {
    // Handle common Prisma errors
    switch (error.code) {
      case 'P2002':
        return NextResponse.json(
          {
            error: 'A unique constraint would be violated.',
            details: error.meta,
          },
          { status: 409 }
        );
      case 'P2025':
        return NextResponse.json(
          {
            error: 'Record not found.',
            details: error.meta,
          },
          { status: 404 }
        );
      default:
        return NextResponse.json(
          {
            error: 'Database error',
            code: error.code,
            details: error.meta,
          },
          { status: 500 }
        );
    }
  }

  if (error instanceof PrismaClientValidationError) {
    return NextResponse.json(
      {
        error: 'Invalid data provided',
        details: error.message,
      },
      { status: 400 }
    );
  }

  // Generic error handler
  return NextResponse.json(
    {
      error: 'Internal server error',
    },
    { status: 500 }
  );
}
