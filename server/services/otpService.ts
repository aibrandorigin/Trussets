/**
 * Server-Side Cryptographically Secure OTP Generation, Storage & Verification Service
 *
 * Implements:
 * - 6-digit cryptographically secure random OTPs (crypto.randomInt)
 * - Persistent salt + scrypt hashing (stored in persistent DB, never logged or returned)
 * - 5-minute expiration
 * - 60-second resend cooldown
 * - Max 5 attempts per OTP before automatic invalidation
 * - Per-number (5/hr) and per-IP (20/hr) rate limits
 * - Mutex lock per mobile number to prevent race conditions & concurrent verification attacks
 * - HMAC-SHA256 signed verification tokens for safe profile linking
 */

import crypto from 'crypto';
import { getDb, saveDb, OtpRecord } from '../db.ts';
import { normalizeMobile } from '../utils/phone.ts';
import { sendOtpSms, SmsServiceError } from './smsService.ts';

const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds
const MAX_ATTEMPTS = 5;
const MAX_REQUESTS_PER_HOUR_PHONE = 5;
const MAX_REQUESTS_PER_HOUR_IP = 20;

const TOKEN_SECRET = process.env.OTP_VERIFICATION_SECRET || process.env.ADMIN_SESSION_SECRET || 'trussets-otp-verification-secret-2026';

// Concurrency mutex lock per phone number to serialize concurrent verification requests
const phoneLocks = new Map<string, Promise<any>>();

async function acquirePhoneLock<T>(phone: string, fn: () => Promise<T>): Promise<T> {
  const currentLock = phoneLocks.get(phone) || Promise.resolve();
  let release: () => void = () => {};
  const nextLock = new Promise<void>((resolve) => {
    release = resolve;
  });

  phoneLocks.set(
    phone,
    currentLock.then(() => nextLock).catch(() => nextLock)
  );

  await currentLock;
  try {
    return await fn();
  } finally {
    release();
    if (phoneLocks.get(phone) === nextLock) {
      phoneLocks.delete(phone);
    }
  }
}

export interface RequestOtpOptions {
  phone: string;
  purpose?: string;
  ip?: string;
  isSignup?: boolean;
}

export interface RequestOtpResult {
  success: boolean;
  message: string;
  phone: string;
  cooldownSeconds: number;
  expiresAt: string;
}

export interface VerifyOtpResult {
  valid: boolean;
  error?: string;
  code?: string;
  remainingAttempts?: number;
  phone?: string;
  mobile_normalized?: string;
  verificationToken?: string;
  purpose?: string;
}

export class OtpServiceError extends Error {
  code: string;
  statusCode: number;
  cooldownSeconds?: number;
  remainingAttempts?: number;

  constructor(message: string, code: string, statusCode = 400, extra?: { cooldownSeconds?: number; remainingAttempts?: number }) {
    super(message);
    this.name = 'OtpServiceError';
    this.code = code;
    this.statusCode = statusCode;
    if (extra?.cooldownSeconds !== undefined) this.cooldownSeconds = extra.cooldownSeconds;
    if (extra?.remainingAttempts !== undefined) this.remainingAttempts = extra.remainingAttempts;
  }
}

/**
 * Generates a cryptographically secure random 6-digit OTP string.
 */
export function generateSecureOtp(): string {
  return crypto.randomInt(100000, 1000000).toString();
}

/**
 * Hashes an OTP with a random salt using scrypt.
 */
export function hashOtp(otp: string, salt: string): string {
  return crypto.scryptSync(otp, salt, 32).toString('hex');
}

/**
 * Timing-safe verification of submitted OTP against stored hash and salt.
 */
export function verifyOtpHash(submittedOtp: string, storedHash: string, salt: string): boolean {
  try {
    const derived = crypto.scryptSync(submittedOtp, salt, 32);
    const storedBuf = Buffer.from(storedHash, 'hex');
    if (derived.length !== storedBuf.length) return false;
    return crypto.timingSafeEqual(derived, storedBuf);
  } catch {
    return false;
  }
}

/**
 * Creates a signed verification token proving a phone number was verified.
 */
export function createPhoneVerificationToken(mobile_normalized: string, purpose = 'verification'): string {
  const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes validity
  const payload = Buffer.from(JSON.stringify({ mobile: mobile_normalized, purpose, expiresAt })).toString('base64url');
  const signature = crypto.createHmac('sha256', TOKEN_SECRET).update(payload).digest('hex');
  return `otpv_${payload}.${signature}`;
}

/**
 * Validates a signed phone verification token.
 */
export function validatePhoneVerificationToken(token: string, expectedMobile?: string): { valid: boolean; mobile?: string; purpose?: string } {
  if (!token || !token.startsWith('otpv_') || !token.includes('.')) {
    return { valid: false };
  }

  try {
    const dotIndex = token.indexOf('.');
    const payloadBase64 = token.slice(5, dotIndex);
    const signature = token.slice(dotIndex + 1);
    const expectedSignature = crypto.createHmac('sha256', TOKEN_SECRET).update(payloadBase64).digest('hex');

    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expectedSignature);
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return { valid: false };
    }

    const data = JSON.parse(Buffer.from(payloadBase64, 'base64url').toString('utf8'));
    if (!data || !data.expiresAt || Date.now() > data.expiresAt) {
      return { valid: false };
    }

    if (expectedMobile && data.mobile !== expectedMobile) {
      return { valid: false };
    }

    return { valid: true, mobile: data.mobile, purpose: data.purpose };
  } catch {
    return { valid: false };
  }
}

/**
 * Requests an OTP for a mobile number.
 * Enforces rate limiting, cooldowns, invalidates previous OTPs, and dispatches via SMS.
 */
export async function requestOtp(options: RequestOtpOptions): Promise<RequestOtpResult> {
  const norm = normalizeMobile(options.phone);
  if (!norm) {
    throw new OtpServiceError('Please enter a valid 10-digit mobile number.', 'INVALID_PHONE_NUMBER', 400);
  }

  return await acquirePhoneLock(norm.normalized, async () => {
    const db = getDb();
    if (!db.otps) db.otps = [];

    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;

    // 1. Per-number rate limit (max 5 requests per hour)
    const recentPhoneRequests = db.otps.filter(
      (o) => o.mobile === norm.normalized && new Date(o.createdAt).getTime() > oneHourAgo
    );
    if (recentPhoneRequests.length >= MAX_REQUESTS_PER_HOUR_PHONE) {
      throw new OtpServiceError(
        'Too many OTP requests for this mobile number. Please try again after 1 hour.',
        'PHONE_RATE_LIMIT_EXCEEDED',
        429
      );
    }

    // 2. Per-IP rate limit (max 20 requests per hour)
    if (options.ip) {
      const recentIpRequests = db.otps.filter(
        (o) => o.ip === options.ip && new Date(o.createdAt).getTime() > oneHourAgo
      );
      if (recentIpRequests.length >= MAX_REQUESTS_PER_HOUR_IP) {
        throw new OtpServiceError(
          'Too many OTP requests from your network. Please wait a while before trying again.',
          'IP_RATE_LIMIT_EXCEEDED',
          429
        );
      }
    }

    // 3. Resend cooldown (must wait 60s since last unconsumed request)
    const lastActiveOtp = db.otps
      .filter((o) => o.mobile === norm.normalized)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

    if (lastActiveOtp) {
      const elapsedMs = now - new Date(lastActiveOtp.createdAt).getTime();
      if (elapsedMs < RESEND_COOLDOWN_MS) {
        const remainingSeconds = Math.ceil((RESEND_COOLDOWN_MS - elapsedMs) / 1000);
        throw new OtpServiceError(
          `Please wait ${remainingSeconds} second(s) before requesting a new verification code.`,
          'COOLDOWN_ACTIVE',
          429,
          { cooldownSeconds: remainingSeconds }
        );
      }
    }

    // 4. Invalidate any previous unconsumed OTPs for this number to prevent multiple active codes
    db.otps.forEach((o) => {
      if (o.mobile === norm.normalized && !o.consumed) {
        o.consumed = true;
      }
    });

    // 5. Generate secure 6-digit OTP
    const otp = generateSecureOtp();
    const salt = crypto.randomBytes(16).toString('hex');
    const otpHash = hashOtp(otp, salt);
    const expiresAt = new Date(now + OTP_EXPIRY_MS).toISOString();

    // 6. Send OTP via SMS gateway
    try {
      await sendOtpSms(norm.normalized, otp);
    } catch (smsErr: any) {
      // If sending fails, do NOT store OTP record in database
      throw smsErr;
    }

    // 7. Store securely in persistent database
    const record: OtpRecord = {
      id: `otp_${now}_${crypto.randomBytes(4).toString('hex')}`,
      mobile: norm.normalized,
      phoneDisplay: norm.display,
      otpHash,
      salt,
      purpose: options.purpose || 'login',
      attempts: 0,
      maxAttempts: MAX_ATTEMPTS,
      verified: false,
      consumed: false,
      createdAt: new Date(now).toISOString(),
      expiresAt,
      ip: options.ip,
    };

    db.otps.push(record);
    saveDb(db, false);

    return {
      success: true,
      message: `Verification code dispatched to ${norm.display}`,
      phone: norm.display,
      cooldownSeconds: 60,
      expiresAt,
    };
  });
}

/**
 * Verifies a submitted OTP against persistent storage with atomic attempt counting
 * and race-condition prevention.
 */
export async function verifyOtp(phone: string, submittedOtp: string, purpose = 'login'): Promise<VerifyOtpResult> {
  const norm = normalizeMobile(phone);
  if (!norm) {
    return { valid: false, error: 'Please enter a valid 10-digit mobile number.', code: 'INVALID_PHONE_NUMBER' };
  }

  const cleanOtp = String(submittedOtp || '').trim();
  if (!cleanOtp || cleanOtp.length !== 6 || !/^\d{6}$/.test(cleanOtp)) {
    return { valid: false, error: 'Please enter a valid 6-digit verification code.', code: 'INVALID_OTP_FORMAT' };
  }

  return await acquirePhoneLock(norm.normalized, async () => {
    const db = getDb();
    if (!db.otps) db.otps = [];

    const now = Date.now();

    // Find active, unconsumed OTP for this mobile
    const activeRecord = db.otps
      .filter((o) => o.mobile === norm.normalized && !o.consumed)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

    if (!activeRecord) {
      return {
        valid: false,
        error: 'No active verification code found for this number. Please request a new code.',
        code: 'OTP_NOT_FOUND',
      };
    }

    // Check expiration
    if (new Date(activeRecord.expiresAt).getTime() < now) {
      activeRecord.consumed = true;
      saveDb(db, false);
      return {
        valid: false,
        error: 'Verification code has expired. Please request a new code.',
        code: 'OTP_EXPIRED',
      };
    }

    // Check attempt limit
    if (activeRecord.attempts >= activeRecord.maxAttempts) {
      activeRecord.consumed = true;
      saveDb(db, false);
      return {
        valid: false,
        error: 'Maximum verification attempts exceeded. Please request a new code.',
        code: 'MAX_ATTEMPTS_EXCEEDED',
      };
    }

    // Increment attempts atomically
    activeRecord.attempts += 1;

    // Verify hash using timing-safe comparison
    const isValid = verifyOtpHash(cleanOtp, activeRecord.otpHash, activeRecord.salt);

    if (!isValid) {
      const remaining = activeRecord.maxAttempts - activeRecord.attempts;
      if (remaining <= 0) {
        activeRecord.consumed = true;
      }
      saveDb(db, false);

      const errorMsg =
        remaining > 0
          ? `Incorrect verification code. ${remaining} attempt(s) remaining.`
          : 'Maximum attempts exceeded. This verification code has been invalidated. Please request a new code.';

      return {
        valid: false,
        error: errorMsg,
        code: 'INVALID_OTP',
        remainingAttempts: Math.max(0, remaining),
      };
    }

    // Successful verification: atomically mark as verified and consumed
    activeRecord.verified = true;
    activeRecord.consumed = true;
    activeRecord.verifiedAt = new Date(now).toISOString();
    saveDb(db, false);

    // Generate signed verification token
    const verificationToken = createPhoneVerificationToken(norm.normalized, purpose);

    return {
      valid: true,
      phone: norm.display,
      mobile_normalized: norm.normalized,
      verificationToken,
      purpose: activeRecord.purpose,
    };
  });
}
