export interface User {
  id: string;
  name: string;
  email: string;
  role?: 'STUDENT' | 'TEACHER' | 'ADMIN';
}

export class AuthApiError extends Error {
  code: string;
  details: Record<string, string> | null;
  status: number;

  constructor(message: string, code = 'AUTH_ERROR', details: Record<string, string> | null = null, status = 0) {
    super(message);
    this.name = 'AuthApiError';
    this.code = code;
    this.details = details;
    this.status = status;
  }
}
