import crypto from 'crypto';

// Generate a random access code
export function generateAccessCode(length: number = 6) {
  return crypto.randomBytes(length).toString('hex');
}
