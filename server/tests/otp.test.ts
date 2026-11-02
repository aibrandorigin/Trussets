import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { 
  generateSecureOtp, 
  hashOtp, 
  verifyOtpHash, 
  createPhoneVerificationToken, 
  validatePhoneVerificationToken, 
  requestOtp, 
  verifyOtp,
  OtpServiceError 
} from '../services/otpService.ts';
import { 
  getSmsConfigStatus, 
  formatDltMessage, 
  sendOtpSms, 
  setMockSmsAdapter, 
  clearMockSmsAdapter,
  SmsServiceError 
} from '../services/smsService.ts';
import { normalizeMobile } from '../utils/phone.ts';
import { getDb, saveDb } from '../db.ts';

describe('1. Mobile Number Normalization (Indian Telecom Standard)', () => {
  it('should correctly normalize 10-digit Indian numbers into standard formats', () => {
    const rawNumbers = [
      '9652663763',
      '+919652663763',
      '+91 96526 63763',
      '09652663763',
      '+91-96526-63763',
    ];

    for (const raw of rawNumbers) {
      const res = normalizeMobile(raw);
      assert.ok(res, `Failed normalizing: ${raw}`);
      assert.equal(res.normalized, '919652663763');
      assert.equal(res.last10, '9652663763');
      assert.equal(res.display, '+91 96526 63763');
    }
  });

  it('should reject invalid mobile numbers', () => {
    assert.equal(normalizeMobile(''), null);
    assert.equal(normalizeMobile('12345'), null);
    assert.equal(normalizeMobile('abcdefghij'), null);
    assert.equal(normalizeMobile('123456789012345'), null);
    assert.equal(normalizeMobile(null), null);
    assert.equal(normalizeMobile(undefined), null);
  });
});

describe('2. Indian DLT Template Message Formatting', () => {
  it('should replace DLT variable placeholders correctly', () => {
    const template1 = 'Your Trussets verification code is {#var#}. Valid for 5 minutes. - TRUSSETS';
    assert.equal(
      formatDltMessage(template1, '654321'),
      'Your Trussets verification code is 654321. Valid for 5 minutes. - TRUSSETS'
    );

    const template2 = 'Your code is {#OTP#} for login.';
    assert.equal(formatDltMessage(template2, '999888'), 'Your code is 999888 for login.');

    const template3 = 'Your code is {%var%} valid for 5 mins.';
    assert.equal(formatDltMessage(template3, '112233'), 'Your code is 112233 valid for 5 mins.');
  });
});

describe('3. Cryptographic OTP Generation & Salting', () => {
  it('should generate secure 6-digit random codes between 100000 and 999999', () => {
    for (let i = 0; i < 20; i++) {
      const code = generateSecureOtp();
      assert.equal(code.length, 6);
      assert.match(code, /^\d{6}$/);
      const num = parseInt(code, 10);
      assert.ok(num >= 100000 && num <= 999999);
    }
  });

  it('should securely hash OTP with salt and timing-safe verify matching hash', () => {
    const otp = '789012';
    const salt = 'random-salt-12345';
    const hash = hashOtp(otp, salt);

    assert.ok(verifyOtpHash(otp, hash, salt));
    assert.ok(!verifyOtpHash('123456', hash, salt));
    assert.ok(!verifyOtpHash('789013', hash, salt));
    assert.ok(!verifyOtpHash('', hash, salt));
  });
});

describe('4. SMS Gateway Service & Provider Handling', () => {
  beforeEach(() => {
    clearMockSmsAdapter();
  });

  afterEach(() => {
    clearMockSmsAdapter();
  });

  it('should detect missing environment variables safely without leaking secrets', () => {
    const status = getSmsConfigStatus();
    assert.equal(typeof status.isConfigured, 'boolean');
    assert.ok(Array.isArray(status.missingVariables));
  });

  it('should reject invalid phone number when sending SMS', async () => {
    await assert.rejects(
      async () => {
        await sendOtpSms('invalid-num', '123456');
      },
      (err: any) => {
        assert.ok(err instanceof SmsServiceError);
        assert.equal(err.code, 'INVALID_PHONE_NUMBER');
        return true;
      }
    );
  });

  it('should dispatch OTP through mock adapter in automated tests', async () => {
    let capturedPayload: any = null;
    setMockSmsAdapter(async (payload) => {
      capturedPayload = payload;
      return {
        success: true,
        messageId: 'MSG-TEST-9988',
        acceptedAt: new Date().toISOString(),
      };
    });

    const result = await sendOtpSms('+91 98765 43210', '456789');
    assert.ok(result.success);
    assert.equal(result.messageId, 'MSG-TEST-9988');
    assert.ok(capturedPayload);
    assert.equal(capturedPayload.to, '919876543210');
    assert.equal(capturedPayload.otp, '456789');
  });

  it('should handle provider rejection safely without crashing', async () => {
    setMockSmsAdapter(async () => {
      throw new SmsServiceError('SMS account has insufficient balance.', 'SMS_PROVIDER_ERROR', 502);
    });

    await assert.rejects(
      async () => {
        await sendOtpSms('+91 98765 43210', '123456');
      },
      (err: any) => {
        assert.ok(err instanceof SmsServiceError);
        assert.equal(err.code, 'SMS_PROVIDER_ERROR');
        assert.equal(err.statusCode, 502);
        return true;
      }
    );
  });

  it('should handle provider timeout safely', async () => {
    setMockSmsAdapter(async () => {
      throw new SmsServiceError('SMS gateway timed out. Please try again.', 'SMS_GATEWAY_TIMEOUT', 504);
    });

    await assert.rejects(
      async () => {
        await sendOtpSms('+91 98765 43210', '123456');
      },
      (err: any) => {
        assert.ok(err instanceof SmsServiceError);
        assert.equal(err.code, 'SMS_GATEWAY_TIMEOUT');
        assert.equal(err.statusCode, 504);
        return true;
      }
    );
  });
});

describe('5. Secure OTP Generation, Lifecycle, Cooldown & Verification', () => {
  const TEST_PHONE = '9876500001';
  let dispatchedOtps: string[] = [];

  beforeEach(() => {
    dispatchedOtps = [];
    setMockSmsAdapter(async (payload) => {
      dispatchedOtps.push(payload.otp);
      return {
        success: true,
        messageId: `TEST-${Date.now()}`,
        acceptedAt: new Date().toISOString(),
      };
    });

    // Clean test phone OTP records from DB
    const db = getDb();
    if (db.otps) {
      db.otps = db.otps.filter((o) => o.mobile !== '919876500001' && o.mobile !== '919876500002');
      saveDb(db, false);
    }
  });

  afterEach(() => {
    clearMockSmsAdapter();
  });

  it('should successfully request an OTP and store securely hashed record', async () => {
    const res = await requestOtp({ phone: TEST_PHONE, ip: '192.168.1.1' });
    assert.ok(res.success);
    assert.equal(res.cooldownSeconds, 60);
    assert.ok(res.expiresAt);
    assert.equal(dispatchedOtps.length, 1);

    const db = getDb();
    const stored = db.otps?.find((o) => o.mobile === '919876500001' && !o.consumed);
    assert.ok(stored, 'Stored OTP record not found');
    assert.equal(stored.mobile, '919876500001');
    assert.equal(stored.attempts, 0);
    assert.equal(stored.verified, false);
    assert.equal(stored.consumed, false);
    // Plaintext OTP should NEVER be in stored record
    assert.ok(!('otp' in stored));
    assert.ok(stored.otpHash);
    assert.ok(stored.salt);
  });

  it('should enforce 60-second cooldown on consecutive requests', async () => {
    await requestOtp({ phone: TEST_PHONE, ip: '192.168.1.2' });

    // Immediate second request must trigger cooldown
    await assert.rejects(
      async () => {
        await requestOtp({ phone: TEST_PHONE, ip: '192.168.1.2' });
      },
      (err: any) => {
        assert.ok(err instanceof OtpServiceError);
        assert.equal(err.code, 'COOLDOWN_ACTIVE');
        assert.ok(err.cooldownSeconds > 0 && err.cooldownSeconds <= 60);
        return true;
      }
    );
  });

  it('should invalidate previous OTP when a new one is requested after cooldown', async () => {
    await requestOtp({ phone: TEST_PHONE, ip: '192.168.1.3' });
    const firstOtp = dispatchedOtps[0];

    // Simulate elapsed cooldown in database
    const db = getDb();
    const stored = db.otps?.find((o) => o.mobile === '919876500001' && !o.consumed);
    if (stored) {
      stored.createdAt = new Date(Date.now() - 70 * 1000).toISOString();
      saveDb(db, false);
    }

    // Request new OTP
    await requestOtp({ phone: TEST_PHONE, ip: '192.168.1.3' });
    const secondOtp = dispatchedOtps[1];
    assert.notEqual(firstOtp, secondOtp);

    // Old OTP must now be rejected
    const verifyOld = await verifyOtp(TEST_PHONE, firstOtp);
    assert.equal(verifyOld.valid, false);

    // New OTP must verify successfully
    const verifyNew = await verifyOtp(TEST_PHONE, secondOtp);
    assert.equal(verifyNew.valid, true);
    assert.ok(verifyNew.verificationToken);
  });

  it('should reject incorrect OTP and decrement remaining attempts', async () => {
    await requestOtp({ phone: TEST_PHONE, ip: '192.168.1.4' });

    const attempt1 = await verifyOtp(TEST_PHONE, '000000');
    assert.equal(attempt1.valid, false);
    assert.equal(attempt1.remainingAttempts, 4);

    const attempt2 = await verifyOtp(TEST_PHONE, '111111');
    assert.equal(attempt2.valid, false);
    assert.equal(attempt2.remainingAttempts, 3);
  });

  it('should invalidate OTP after 5 failed attempts (Brute-Force Protection)', async () => {
    await requestOtp({ phone: TEST_PHONE, ip: '192.168.1.5' });
    const correctOtp = dispatchedOtps[0];

    // 5 wrong attempts
    for (let i = 0; i < 5; i++) {
      await verifyOtp(TEST_PHONE, `99999${i}`);
    }

    // Now even the correct OTP must be rejected because max attempts were exceeded
    const res = await verifyOtp(TEST_PHONE, correctOtp);
    assert.equal(res.valid, false);
    assert.equal(res.code, 'OTP_NOT_FOUND');
  });

  it('should prevent OTP reuse after successful verification', async () => {
    await requestOtp({ phone: TEST_PHONE, ip: '192.168.1.6' });
    const correctOtp = dispatchedOtps[0];

    const firstVerify = await verifyOtp(TEST_PHONE, correctOtp);
    assert.equal(firstVerify.valid, true);

    // Immediate second attempt with same OTP must be rejected
    const secondVerify = await verifyOtp(TEST_PHONE, correctOtp);
    assert.equal(secondVerify.valid, false);
  });

  it('should reject expired OTPs (> 5 minutes)', async () => {
    await requestOtp({ phone: TEST_PHONE, ip: '192.168.1.7' });
    const correctOtp = dispatchedOtps[0];

    // Simulate expired timestamp
    const db = getDb();
    const stored = db.otps?.find((o) => o.mobile === '919876500001' && !o.consumed);
    if (stored) {
      stored.expiresAt = new Date(Date.now() - 1000).toISOString();
      saveDb(db, false);
    }

    const res = await verifyOtp(TEST_PHONE, correctOtp);
    assert.equal(res.valid, false);
    assert.equal(res.code, 'OTP_EXPIRED');
  });

  it('should enforce hourly per-number rate limits (max 5 requests)', async () => {
    const PHONE2 = '9876500002';
    const db = getDb();

    // Seed 5 existing requests in the last hour
    for (let i = 0; i < 5; i++) {
      db.otps?.push({
        id: `seeded_${i}`,
        mobile: '919876500002',
        phoneDisplay: '+91 98765 00002',
        otpHash: 'dummy',
        salt: 'dummy',
        purpose: 'login',
        attempts: 0,
        maxAttempts: 5,
        verified: false,
        consumed: true,
        createdAt: new Date(Date.now() - (i + 1) * 60 * 1000).toISOString(),
        expiresAt: new Date().toISOString(),
      });
    }
    saveDb(db, false);

    await assert.rejects(
      async () => {
        await requestOtp({ phone: PHONE2, ip: '10.0.0.1' });
      },
      (err: any) => {
        assert.ok(err instanceof OtpServiceError);
        assert.equal(err.code, 'PHONE_RATE_LIMIT_EXCEEDED');
        assert.equal(err.statusCode, 429);
        return true;
      }
    );
  });
});

describe('6. Signed Phone Verification Tokens (HMAC-SHA256)', () => {
  it('should generate valid signed token and verify successfully', () => {
    const token = createPhoneVerificationToken('919876543210', 'signup');
    assert.ok(token.startsWith('otpv_'));

    const validated = validatePhoneVerificationToken(token, '919876543210');
    assert.equal(validated.valid, true);
    assert.equal(validated.mobile, '919876543210');
    assert.equal(validated.purpose, 'signup');
  });

  it('should reject tampered or corrupted verification tokens', () => {
    const token = createPhoneVerificationToken('919876543210', 'signup');
    const tampered = token.replace('otpv_', 'otpv_tampered');
    assert.equal(validatePhoneVerificationToken(tampered, '919876543210').valid, false);

    const alteredSig = token.slice(0, -4) + '0000';
    assert.equal(validatePhoneVerificationToken(alteredSig, '919876543210').valid, false);

    assert.equal(validatePhoneVerificationToken('', '919876543210').valid, false);
    assert.equal(validatePhoneVerificationToken('invalid', '919876543210').valid, false);
  });

  it('should reject verification token when mobile does not match expected mobile', () => {
    const token = createPhoneVerificationToken('919876543210', 'signup');
    const res = validatePhoneVerificationToken(token, '919999999999');
    assert.equal(res.valid, false);
  });
});

describe('7. Concurrency & Race Condition Defense', () => {
  const TEST_CONCURRENT_PHONE = '9876500003';
  let capturedOtp = '';

  beforeEach(async () => {
    setMockSmsAdapter(async (p) => {
      capturedOtp = p.otp;
      return { success: true, acceptedAt: new Date().toISOString() };
    });

    const db = getDb();
    if (db.otps) {
      db.otps = db.otps.filter((o) => o.mobile !== '919876500003');
      saveDb(db, false);
    }

    await requestOtp({ phone: TEST_CONCURRENT_PHONE, ip: '127.0.0.1' });
  });

  afterEach(() => {
    clearMockSmsAdapter();
  });

  it('should safely serialize 5 concurrent verification attempts without race conditions', async () => {
    // Launch 5 parallel verification attempts simultaneously
    const results = await Promise.all([
      verifyOtp(TEST_CONCURRENT_PHONE, '111111'),
      verifyOtp(TEST_CONCURRENT_PHONE, '222222'),
      verifyOtp(TEST_CONCURRENT_PHONE, capturedOtp), // Valid one
      verifyOtp(TEST_CONCURRENT_PHONE, '333333'),
      verifyOtp(TEST_CONCURRENT_PHONE, '444444'),
    ]);

    // Exactly one attempt should succeed, others should be safely rejected
    const successful = results.filter((r) => r.valid);
    assert.equal(successful.length, 1, 'Only one verification attempt should succeed');
  });
});
