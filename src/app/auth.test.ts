import { describe, it, expect, beforeAll } from 'vitest';
import {
  hashPassword,
  checkPasswordHash,
  makeJWT,
  validateJWT,
} from './auth.js';

describe('Password Hashing', () => {
  const password1 = 'correctPassword123!';
  const password2 = 'anotherPassword456!';
  let hash1: string;
  let hash2: string;

  beforeAll(async () => {
    hash1 = await hashPassword(password1);
    hash2 = await hashPassword(password2);
  });

  it('should return true for the correct password', async () => {
    const result = await checkPasswordHash(password1, hash1);
    expect(result).toBe(true);
  });
});

describe('Generating a JWT', () => {
  it('should return a hashed user ID', () => {
    const userId = 'MonstaHunta';
    const secret = 'SecretMission';
    const hash = makeJWT(userId, 1000, secret);
    const result = validateJWT(hash, secret);

    expect(result).toBe(userId);
  });
});
