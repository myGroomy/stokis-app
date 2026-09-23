import crypto from 'crypto';

interface HandoffPayload {
  employeeId: string;
  username: string;
  employeeName: string;
  roleId: string;
  roleName: string;
  permissions: string[];
  baseBranch: string;
  audience: string;
  expiresAt: number;
}

function verifySignature(body: string, signature: string): boolean {
  const sharedSecret = process.env.LAUNCHER_SSO_SHARED_SECRET;
  if (!sharedSecret || sharedSecret.length < 32) return false;
  const expected = crypto.createHmac('sha256', sharedSecret).update(body).digest('base64url');
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  return actualBuffer.length === expectedBuffer.length && crypto.timingSafeEqual(actualBuffer, expectedBuffer);
}

export function verifyLauncherHandoff(token: string | null): HandoffPayload | null {
  if (!token) return null;
  const [body, signature] = token.split('.');
  if (!body || !signature || !verifySignature(body, signature)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString()) as HandoffPayload;
    if (payload.audience !== 'STOKIS' || !payload.employeeId || !payload.username || !payload.expiresAt) return null;
    if (payload.expiresAt < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}
