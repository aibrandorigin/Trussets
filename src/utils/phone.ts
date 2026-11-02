export interface NormalizedPhoneResult {
  normalized: string; // e.g. "919652663763"
  display: string;    // e.g. "+91 96526 63763"
  last10: string;     // e.g. "9652663763"
}

export function normalizeMobile(phone: string | number | undefined | null): NormalizedPhoneResult | null {
  if (phone === undefined || phone === null) return null;
  const raw = String(phone).trim();
  if (!raw) return null;

  const digits = raw.replace(/\D/g, '');
  if (!digits) return null;

  let tenDigits = '';
  if (digits.length === 10) {
    tenDigits = digits;
  } else if (digits.length === 11 && digits.startsWith('0')) {
    tenDigits = digits.slice(1);
  } else if (digits.length === 12 && digits.startsWith('91')) {
    tenDigits = digits.slice(2);
  } else if (digits.length === 13 && digits.startsWith('091')) {
    tenDigits = digits.slice(3);
  } else if (digits.length === 14 && digits.startsWith('0091')) {
    tenDigits = digits.slice(4);
  } else if (digits.length > 10) {
    tenDigits = digits.slice(-10);
  } else {
    return null;
  }

  if (tenDigits.length !== 10) return null;

  return {
    normalized: `91${tenDigits}`,
    display: `+91 ${tenDigits.slice(0, 5)} ${tenDigits.slice(5)}`,
    last10: tenDigits,
  };
}
