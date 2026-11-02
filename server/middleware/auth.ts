import { Request, Response, NextFunction } from 'express';
import { validateSessionToken } from '../auth.ts';

export interface AdminRequest extends Request {
  admin?: {
    email: string;
    adminId: string;
  };
}

export function requireAdminAuth(req: AdminRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Admin authentication token required' });
    return;
  }

  const token = authHeader.split(' ')[1];
  const { valid, email, adminId } = validateSessionToken(token);

  if (!valid || !email || !adminId) {
    res.status(401).json({ error: 'Unauthorized: Invalid or expired admin session token' });
    return;
  }

  req.admin = { email, adminId };
  next();
}
