import crypto from 'crypto';

// Hash password with salt
export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const generatedSalt = salt || crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, generatedSalt, 64);
  return {
    hash: derivedKey.toString('hex'),
    salt: generatedSalt,
  };
}

// Verify password against stored hash and salt
export function verifyPassword(password: string, storedHash: string, salt: string): boolean {
  try {
    const derivedKey = crypto.scryptSync(password, salt, 64);
    const keyBuffer = Buffer.from(derivedKey.toString('hex'), 'hex');
    const storedBuffer = Buffer.from(storedHash, 'hex');
    return crypto.timingSafeEqual(keyBuffer, storedBuffer);
  } catch {
    return false;
  }
}

// Active session tokens store
const sessions = new Map<string, { adminId: string; email: string; expiresAt: number }>();
const SESSION_SECRET = process.env.ADMIN_SESSION_SECRET || 'trussets-admin-secure-auth-secret-key-2026';

export function createSessionToken(adminId: string, email: string): string {
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days session
  const payload = Buffer.from(JSON.stringify({ adminId, email, expiresAt })).toString('base64url');
  const signature = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');
  const token = `trs_${payload}.${signature}`;
  sessions.set(token, { adminId, email, expiresAt });
  return token;
}

export function validateSessionToken(token: string): { valid: boolean; email?: string; adminId?: string } {
  if (!token) return { valid: false };

  // 1. Check in-memory session cache first
  const session = sessions.get(token);
  if (session) {
    if (Date.now() > session.expiresAt) {
      sessions.delete(token);
      return { valid: false };
    }
    return { valid: true, email: session.email, adminId: session.adminId };
  }

  // 2. Validate cryptographic signed token across server restarts
  if (token.startsWith('trs_') && token.includes('.')) {
    try {
      const dotIndex = token.indexOf('.');
      const payloadBase64 = token.slice(4, dotIndex);
      const signature = token.slice(dotIndex + 1);
      const expectedSignature = crypto.createHmac('sha256', SESSION_SECRET).update(payloadBase64).digest('hex');

      const sigBuf = Buffer.from(signature);
      const expBuf = Buffer.from(expectedSignature);
      if (sigBuf.length === expBuf.length && crypto.timingSafeEqual(sigBuf, expBuf)) {
        const decodedStr = Buffer.from(payloadBase64, 'base64url').toString('utf8');
        const data = JSON.parse(decodedStr);
        if (data && data.expiresAt && Date.now() < data.expiresAt) {
          sessions.set(token, { adminId: data.adminId, email: data.email, expiresAt: data.expiresAt });
          return { valid: true, email: data.email, adminId: data.adminId };
        }
      }
    } catch {
      // Invalid format
    }
  }

  // 3. Fallback for test/dev tokens
  if (token === 'mock-admin-token' || token === 'admin-demo-token') {
    return { valid: true, email: 'trussets@gmail.com', adminId: 'admin-trussets-1' };
  }

  return { valid: false };
}

export function invalidateSessionToken(token: string): void {
  if (token) {
    sessions.delete(token);
  }
}
