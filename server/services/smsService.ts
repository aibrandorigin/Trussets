/**
 * Server-Side SMS Gateway Service (Indian Telecom TRAI DLT Compliant)
 *
 * Exclusively executes on the server backend. All SMS credentials and DLT IDs
 * are read from environment variables and NEVER exposed to frontend bundles,
 * API responses, or client network requests.
 */

import { normalizeMobile } from '../utils/phone.ts';

export interface SmsConfig {
  baseUrl?: string;
  user?: string;
  password?: string;
  senderId?: string;
  channel?: string;
  route?: string;
  peId?: string;
  dltTemplate?: string;
  messageTemplate?: string;
  httpMethod?: 'POST' | 'GET' | 'AUTO';
  contentType?: 'form' | 'json';
}

export interface SmsConfigStatus {
  isConfigured: boolean;
  missingVariables: string[];
  senderId?: string;
  channel?: string;
  route?: string;
  peId?: string;
  dltTemplate?: string;
  baseUrlConfigured: boolean;
  httpMethod: string;
}

export interface SendSmsResult {
  success: boolean;
  messageId?: string;
  providerResponse?: string;
  acceptedAt: string;
}

export class SmsServiceError extends Error {
  code: string;
  statusCode: number;

  constructor(message: string, code: string, statusCode = 502) {
    super(message);
    this.name = 'SmsServiceError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

/**
 * Adapter Interface for SMS Gateway Integrations.
 * Indian telecom operators require DLT-registered Header (senderid), Principal Entity ID (peid),
 * and Content Template ID (templateid).
 */
export interface SmsGatewayAdapter {
  name: string;
  sendSms(recipient10Digits: string, formattedMessage: string, otp: string, config: SmsConfig): Promise<SendSmsResult>;
}

// In-memory mock adapter hook used exclusively during automated unit testing
let mockSmsAdapter: ((payload: { to: string; message: string; otp: string; dltTemplateId: string }) => Promise<SendSmsResult>) | null = null;

export function setMockSmsAdapter(adapter: typeof mockSmsAdapter) {
  mockSmsAdapter = adapter;
}

export function clearMockSmsAdapter() {
  mockSmsAdapter = null;
}

/**
 * Reads server-side SMS configuration securely without logging credentials.
 */
const REGISTERED_DLT_TEMPLATES: Record<string, string> = {
  '1777179127074214209':
    'Your OTP to log in to {#var#}. This code is valid for 10 minutes. Visit www.trussets.com - Trussets Marketing and Construction Enterprises',
  '1707178132876719605':
    'Trussets www.onroadpriz.com ,Your verification code is {#var#}. Valid for 15 minutes. Do not share this code with anyone.',
  '1707178132882659905':
    'Use OTP {#var#} to log in to your www.onroadpriz.com account by Trussets. Valid for 10 mins. Do not share it with anyone.',
  '1707178132977267805':
    'Use OTP {#var#}. to log into your Trussets portal www.onroadpriz.com. For security, this code is valid for 10 minutes',
  '1707178132990846631':
    '{#var#} is your verification code for www.onroadpriz.com. Validity is 10 minutes. Please do not share this code with anyone. - Trussets',
};

export function getSmsConfig(): SmsConfig {
  const dltTemplate = process.env.SMS_DLT_TEMPLATE?.trim();
  const matchedTemplateText =
    (dltTemplate && REGISTERED_DLT_TEMPLATES[dltTemplate]) ||
    'Your OTP to log in to {#var#}. This code is valid for 10 minutes. Visit www.trussets.com - Trussets Marketing and Construction Enterprises';

  return {
    baseUrl: process.env.SMS_BASE_URL?.trim(),
    user: process.env.SMS_USER?.trim(),
    password: process.env.SMS_PASSWORD?.trim(),
    senderId: process.env.SMS_SENDER_ID?.trim(),
    channel: process.env.SMS_CHANNEL?.trim() || 'Trans',
    route: process.env.SMS_ROUTE?.trim() || '02',
    peId: process.env.SMS_PE_ID?.trim(),
    dltTemplate,
    messageTemplate: process.env.SMS_MESSAGE_TEMPLATE?.trim() || matchedTemplateText,
    httpMethod: (process.env.SMS_HTTP_METHOD?.trim().toUpperCase() as 'POST' | 'GET') || 'AUTO',
    contentType: (process.env.SMS_CONTENT_TYPE?.trim().toLowerCase() as 'json' | 'form') || 'form',
  };
}

/**
 * Validates whether all mandatory SMS credentials and DLT identifiers are configured.
 */
export function getSmsConfigStatus(): SmsConfigStatus {
  const config = getSmsConfig();
  const missing: string[] = [];

  if (!config.baseUrl) missing.push('SMS_BASE_URL');
  if (!config.user) missing.push('SMS_USER');
  if (!config.password) missing.push('SMS_PASSWORD');
  if (!config.senderId) missing.push('SMS_SENDER_ID');
  if (!config.peId) missing.push('SMS_PE_ID');
  if (!config.dltTemplate) missing.push('SMS_DLT_TEMPLATE');

  return {
    isConfigured: missing.length === 0,
    missingVariables: missing,
    senderId: config.senderId,
    channel: config.channel,
    route: config.route,
    peId: config.peId,
    dltTemplate: config.dltTemplate,
    baseUrlConfigured: !!config.baseUrl,
    httpMethod: config.httpMethod || 'AUTO',
  };
}

/**
 * Validates SMS configuration at server startup and logs safe status.
 */
export function validateSmsConfigAtStartup(): void {
  const status = getSmsConfigStatus();
  if (status.isConfigured) {
    console.log(
      `[SMS Service] Initialized successfully. Sender ID: ${status.senderId}, Channel: ${status.channel}, Route: ${status.route}, PE ID: ${status.peId}, DLT Template: ${status.dltTemplate}`
    );
  } else {
    console.warn(
      `[SMS Service] Notice: SMS gateway is not yet fully configured in environment variables. Missing: ${status.missingVariables.join(', ')}. SMS OTP dispatch will return safe 503 errors until credentials are set.`
    );
  }
}

/**
 * Masks phone numbers for safe audit logs (e.g. "+91 ******3763").
 */
export function maskPhoneNumber(phone: string): string {
  const clean = phone.replace(/\D/g, '');
  if (clean.length < 4) return '***';
  const last4 = clean.slice(-4);
  return `+91 ******${last4}`;
}

/**
 * Formats a message according to the approved Indian DLT template.
 * Replaces placeholders {#var#}, {%var%}, {#num#}, {OTP}, or {#OTP#} with the actual OTP.
 */
export function formatDltMessage(template: string, otp: string): string {
  return template
    .replace(/\{#var#\}/gi, otp)
    .replace(/\{%var%\}/gi, otp)
    .replace(/\{#num#\}/gi, otp)
    .replace(/\{#OTP#\}/gi, otp)
    .replace(/\{OTP\}/gi, otp);
}

/**
 * Evaluates raw gateway response text (JSON or plain text) to determine if accepted or rejected.
 */
function parseGatewayResponse(responseText: string): {
  isError: boolean;
  safeReason?: string;
  messageId?: string;
  errorCode?: string;
} {
  const trimmed = (responseText || '').trim();
  if (!trimmed) {
    return { isError: false, messageId: 'ACCEPTED' };
  }

  // 1. Try structured JSON parsing first (e.g. SmartTech / UltronSMS returns {"ErrorCode":"000","ErrorMessage":"Done",...})
  try {
    const json = JSON.parse(trimmed);
    if (json && typeof json === 'object' && !Array.isArray(json)) {
      const errCode = String(json.ErrorCode ?? json.errorCode ?? '').trim();
      const errMsg = String(json.ErrorMessage ?? json.errorMessage ?? json.message ?? json.error ?? '').trim();
      const lowerMsg = errMsg.toLowerCase();

      // Explicit success codes on Indian DLT gateways ("000", "0", "200", or ErrorMessage "Done" / "Success")
      const isJsonSuccess =
        errCode === '000' ||
        errCode === '0' ||
        errCode === '200' ||
        lowerMsg === 'done' ||
        lowerMsg === 'success' ||
        json.status === 'success' ||
        json.status === 'OK';

      if (isJsonSuccess) {
        const msgDataId = Array.isArray(json.MessageData) && json.MessageData[0]?.MessageId;
        const messageId = String(msgDataId || json.JobId || json.messageId || json.id || json.msgId || 'ACCEPTED');
        return { isError: false, messageId };
      }

      if (errCode || lowerMsg.includes('error') || lowerMsg.includes('invalid') || lowerMsg.includes('not valid') || lowerMsg.includes('failed')) {
        let safeReason = 'SMS gateway returned rejection status.';
        if (lowerMsg.includes('insufficient') || lowerMsg.includes('balance')) {
          safeReason = 'SMS account has insufficient balance.';
        } else if (lowerMsg.includes('senderid') || lowerMsg.includes('header')) {
          safeReason = `SMS gateway rejected Sender ID (${errMsg}).`;
        } else if (lowerMsg.includes('template') || lowerMsg.includes('dlt') || lowerMsg.includes('entity') || lowerMsg.includes('peid')) {
          safeReason = `SMS gateway rejected DLT Template (${errMsg}).`;
        } else if (lowerMsg.includes('user') || lowerMsg.includes('password') || lowerMsg.includes('login') || lowerMsg.includes('auth')) {
          safeReason = 'SMS authentication failed on gateway.';
        } else if (errMsg) {
          safeReason = `SMS gateway error: ${errMsg}`;
        }
        return { isError: true, safeReason, errorCode: errCode };
      }

      const messageId = json.JobId || json.messageId || json.id || json.msgId || 'ACCEPTED';
      return { isError: false, messageId: String(messageId) };
    }
  } catch {
    // Not JSON, fall through to plain-text evaluation
  }

  // 2. Plain-text response evaluation
  const lower = trimmed.toLowerCase();
  const isPlainError =
    lower.includes('error') ||
    lower.includes('err:') ||
    lower.includes('invalid user') ||
    lower.includes('invalid login') ||
    lower.includes('authentication failure') ||
    lower.includes('insufficient balance') ||
    lower.includes('dlt template mismatch') ||
    lower.includes('senderid not valid') ||
    lower.includes('failed');

  if (isPlainError) {
    let safeReason = 'SMS gateway returned rejection status.';
    if (lower.includes('insufficient balance')) safeReason = 'SMS account has insufficient balance.';
    else if (lower.includes('invalid') || lower.includes('auth')) safeReason = 'SMS authentication failed on gateway.';
    else if (lower.includes('dlt') || lower.includes('template')) safeReason = 'DLT Template or Header mismatch on SMS gateway.';
    return { isError: true, safeReason };
  }

  const match = trimmed.match(/(?:jobid|id|msgid)[:\s=]+([a-zA-Z0-9_-]+)/i);
  return {
    isError: false,
    messageId: match ? match[1] : 'ACCEPTED',
  };
}

/**
 * Default HTTP Indian DLT SMS Gateway Adapter.
 * Handles both GET query string and POST form-urlencoded/JSON with DLT headers.
 */
export class DefaultDltHttpAdapter implements SmsGatewayAdapter {
  name = 'DefaultDltHttpAdapter';

  private async dispatchHttpRequest(
    baseUrl: string,
    params: Record<string, string>,
    config: SmsConfig,
    signal: AbortSignal
  ): Promise<{ status: number; text: string }> {
    const isGet =
      config.httpMethod === 'GET' ||
      (config.httpMethod === 'AUTO' &&
        (baseUrl.includes('?') || baseUrl.toLowerCase().includes('sendsms') || baseUrl.toLowerCase().includes('/api/mt')));

    if (isGet) {
      const url = new URL(baseUrl);
      Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

      const res = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'User-Agent': 'Trussets-SmsClient/1.0',
        },
        signal,
      });

      return { status: res.status, text: await res.text() };
    } else if (config.contentType === 'json') {
      const res = await fetch(baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/plain, */*',
          'User-Agent': 'Trussets-SmsClient/1.0',
        },
        body: JSON.stringify(params),
        signal,
      });

      return { status: res.status, text: await res.text() };
    } else {
      const formBody = new URLSearchParams(params).toString();
      const res = await fetch(baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json, text/plain, */*',
          'User-Agent': 'Trussets-SmsClient/1.0',
        },
        body: formBody,
        signal,
      });

      return { status: res.status, text: await res.text() };
    }
  }

  async sendSms(recipient10Digits: string, formattedMessage: string, _otp: string, config: SmsConfig): Promise<SendSmsResult> {
    const baseUrl = config.baseUrl!;
    const maskedPhone = maskPhoneNumber(recipient10Digits);
    const clean10 = recipient10Digits.replace(/\D/g, '').slice(-10);
    const recipientWith91 = `91${clean10}`;

    console.log(
      `[SMS Gateway] Dispatching OTP SMS to ${maskedPhone} using Sender: ${config.senderId}, PE ID: ${config.peId}, DLT Template: ${config.dltTemplate}`
    );

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s request timeout

    try {
      const params: Record<string, string> = {
        user: config.user!,
        password: config.password!,
        senderid: config.senderId!,
        channel: config.channel || 'Trans',
        DCS: '0',
        flashsms: '0',
        number: recipientWith91,
        mobiles: recipientWith91,
        phone: clean10,
        text: formattedMessage,
        message: formattedMessage,
        route: config.route || '02',
        PEID: config.peId!,
        PE_ID: config.peId!,
        DLTTemplateId: config.dltTemplate!,
        Template_ID: config.dltTemplate!,
      };

      const { status: responseStatus, text: responseText } = await this.dispatchHttpRequest(
        baseUrl,
        params,
        config,
        controller.signal
      );

      clearTimeout(timeoutId);

      // Validate HTTP status
      if (responseStatus < 200 || responseStatus >= 300) {
        console.error(`[SMS Gateway] Rejected with HTTP status ${responseStatus}`);
        throw new SmsServiceError('SMS gateway rejected request. Please check provider configuration.', 'SMS_GATEWAY_REJECTED', 502);
      }

      const parsed = parseGatewayResponse(responseText);

      if (parsed.isError) {
        const reason = parsed.safeReason || 'SMS gateway returned rejection status.';
        console.error(`[SMS Gateway] Provider rejection for ${maskedPhone}: ${reason}`);
        throw new SmsServiceError(reason, 'SMS_PROVIDER_ERROR', 502);
      }

      console.log(`[SMS Gateway] Request accepted for ${maskedPhone}. Id: ${parsed.messageId || 'ACCEPTED'}`);

      return {
        success: true,
        messageId: parsed.messageId,
        acceptedAt: new Date().toISOString(),
      };
    } catch (err: any) {
      clearTimeout(timeoutId);

      if (err instanceof SmsServiceError) {
        throw err;
      }

      if (err.name === 'AbortError') {
        console.error(`[SMS Gateway] Request timed out communicating with provider for ${maskedPhone}`);
        throw new SmsServiceError('SMS gateway timed out. Please try again in a few moments.', 'SMS_GATEWAY_TIMEOUT', 504);
      }

      console.error(`[SMS Gateway] Network or communication failure for ${maskedPhone}:`, err.message);
      throw new SmsServiceError('Failed to communicate with SMS gateway. Please try again.', 'SMS_NETWORK_FAILURE', 502);
    }
  }
}

const defaultAdapter = new DefaultDltHttpAdapter();

/**
 * Sends an SMS message through the configured gateway adapter.
 */
export async function sendOtpSms(toPhone: string, otp: string): Promise<SendSmsResult> {
  const norm = normalizeMobile(toPhone);
  if (!norm) {
    throw new SmsServiceError('Invalid mobile number format. Please provide a valid 10-digit mobile number.', 'INVALID_PHONE_NUMBER', 400);
  }

  const config = getSmsConfig();

  // If a mock test adapter is active (automated unit tests), route through it
  if (mockSmsAdapter) {
    const formatted = formatDltMessage(config.messageTemplate || '', otp);
    return await mockSmsAdapter({
      to: norm.normalized,
      message: formatted,
      otp,
      dltTemplateId: config.dltTemplate || 'TEST_TEMPLATE',
    });
  }

  // Validate required configuration
  const status = getSmsConfigStatus();
  if (!status.isConfigured) {
    const missing = status.missingVariables.join(', ');
    console.warn(`[SMS Service] Dispatch halted: Gateway not fully configured. Missing: ${missing}`);
    throw new SmsServiceError(
      `SMS gateway is not configured on the server. Missing: ${missing}. Please set these in server environment variables.`,
      'SMS_NOT_CONFIGURED',
      503
    );
  }

  const messageText = formatDltMessage(config.messageTemplate!, otp);
  return await defaultAdapter.sendSms(norm.last10, messageText, otp, config);
}
