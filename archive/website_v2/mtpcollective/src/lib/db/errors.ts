export class DatabaseError extends Error {
  constructor(
    message: string,
    public code: string,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class DatabaseConnectionError extends DatabaseError {
  constructor(message: string, originalError?: unknown) {
    super(message, 'DB_CONNECTION_ERROR', originalError);
    this.name = 'DatabaseConnectionError';
  }
}

export class DatabaseQueryError extends DatabaseError {
  constructor(message: string, originalError?: unknown) {
    super(message, 'DB_QUERY_ERROR', originalError);
    this.name = 'DatabaseQueryError';
  }
}

export class DatabaseTransactionError extends DatabaseError {
  constructor(message: string, originalError?: unknown) {
    super(message, 'DB_TRANSACTION_ERROR', originalError);
    this.name = 'DatabaseTransactionError';
  }
} 