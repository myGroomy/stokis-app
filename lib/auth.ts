// lib/auth.ts
// Server-side auth middleware for API routes
// Validates session cookies and enforces role-based access control

import { NextRequest, NextResponse } from 'next/server';
import {
  getSessionFromRequest,
  SessionData,
} from '@/lib/session';

type RouteHandler = (
  req: NextRequest,
  context: any,
  session: SessionData
) => Promise<NextResponse>;

/**
 * Wrap an API route handler with authentication.
 * @param handler - The route handler function
 * @param options.requiredRole - If set, only users with this role can access
 */
export function withAuth(
  handler: RouteHandler,
  options?: { requiredRole?: string }
) {
  return async (req: NextRequest, context: any) => {
    const session = getSessionFromRequest(req);

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Sesi tidak valid atau sudah kedaluwarsa. Silakan login ulang.',
          },
        },
        { status: 401 }
      );
    }

    if (options?.requiredRole && session.role !== options.requiredRole) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Akses ditolak. Hanya user dengan role "' + options.requiredRole + '" yang diizinkan.',
          },
        },
        { status: 403 }
      );
    }

    return handler(req, context, session);
  };
}
