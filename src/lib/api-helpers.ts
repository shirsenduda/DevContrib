import { NextRequest, NextResponse } from 'next/server';
import { auth } from './auth';
import { z } from 'zod/v4';
import { AdminError } from './admin';

export interface ApiResponse<T> {
  data: T;
  meta?: {
    total: number;
    page: number;
    pageSize: number;
  };
}

export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
}

function serializeBigInts(obj: unknown): unknown {
  if (typeof obj === 'bigint') return Number(obj);
  if (obj instanceof Date) return obj.toISOString();
  if (Array.isArray(obj)) return obj.map(serializeBigInts);
  if (obj !== null && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [k, serializeBigInts(v)])
    );
  }
  return obj;
}

export function createApiResponse<T>(data: T, meta?: ApiResponse<T>['meta']) {
  return NextResponse.json(serializeBigInts({ data, meta }));
}

export function createErrorResponse(message: string, statusCode: number) {
  return NextResponse.json({ error: 'Error', message, statusCode }, { status: statusCode });
}

export function parsePaginationParams(searchParams: URLSearchParams) {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20', 10) || 1));
  const skip = (page - 1) * pageSize;
  return { page, pageSize, skip };
}

export async function getAuthenticatedUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return session.user;
}

export async function requireAuth() {
  const user = await getAuthenticatedUser();
  if (!user) {
    throw new AuthError('Authentication required');
  }
  return user;
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

export function validateBody<T extends z.ZodType>(schema: T, data: unknown): z.infer<T> {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new ValidationError(result.error.issues.map((i) => i.message).join(', '));
  }
  return result.data;
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export function handleApiError(error: unknown) {
  if (error instanceof AuthError) {
    return createErrorResponse(error.message, 401);
  }
  if (error instanceof AdminError) {
    return createErrorResponse(error.message, 403);
  }
  if (error instanceof ValidationError) {
    return createErrorResponse(error.message, 400);
  }
  console.error('Unhandled API error:', error);
  return createErrorResponse('Internal server error', 500);
}
