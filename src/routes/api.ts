import { Router } from 'express';

import { config } from '../config.js';
import {
  createUser,
  getUserByEmail,
  getUserById,
  updateUserChirpyRedStatus,
  updateUserEmail,
  updateUserPassword,
} from '../db/queries/users.js';
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from '../app/errors.js';
import {
  createChirp,
  deleteChirp,
  getAllChirps,
  getChirp,
  getChirpsByUserId,
} from '../db/queries/chirps.js';
import {
  hashPassword,
  checkPasswordHash,
  getBearerToken,
  makeJWT,
  validateJWT,
  makeRefreshToken,
  getAPIKey,
} from '../app/auth.js';
import {
  getRefreshToken,
  revokeRefreshToken,
} from '../db/queries/refreshTokens.js';
import { Chirp, type User } from '../db/schema.js';

const router = Router();

// For creating a new user.
router.post('/users', async (req, res) => {
  const data: {
    password: string;
    email: string;
  } = req.body;

  if (!data.password) {
    throw new BadRequestError('Please provide a valid password.');
  }

  if (!data.email) {
    throw new BadRequestError('Please provide a valid email address.');
  }

  const { email, password } = data;

  const user = await createUser({
    hashedPassword: await hashPassword(password),
    email,
  });

  const { hashedPassword, ...cleanUser } = user;

  res.status(201).json(cleanUser);
});

// For updating a user's password and/or email address.
router.put('/users', async (req, res) => {
  const data: {
    password: string;
    email: User['email'];
  } = req.body;

  const token = getBearerToken(req);
  const userId = validateJWT(token, config.api.jwtSecret);
  const user = await getUserById(userId);

  await updateUserPassword(user.id, data.password);
  const updatedUser = await updateUserEmail(user.id, data.email);

  res.status(200).json(updatedUser);
});

// For logging in as a given user based on the provided email and password.
router.post('/login', async (req, res) => {
  const data: {
    password: string;
    email: string;
  } = req.body;

  if (!data.password) {
    throw new BadRequestError('Please provide a valid password.');
  }

  if (!data.email) {
    throw new BadRequestError('Please provide a valid email address.');
  }

  try {
    const user = await getUserByEmail(data.email);
    const accessToken = makeJWT(user.id, config.api.jwtSecret);
    const refreshTokenRecord = await makeRefreshToken(user.id);

    const passwordIsMatching = await checkPasswordHash(
      data.password,
      user.hashedPassword
    );

    if (!passwordIsMatching) {
      throw new Error();
    }

    const { hashedPassword, ...cleanUser } = user;
    const body = {
      ...cleanUser,
      token: accessToken,
      refreshToken: refreshTokenRecord.token,
    };

    res.status(200).json(body);
  } catch {
    throw new UnauthorizedError(
      'You are not authorized to access this resource.'
    );
  }
});

// For generating a refresh token.
router.post('/refresh', async (req, res) => {
  const refreshToken = getBearerToken(req);

  // Throw and exception if the `Authorization` header doesn't contain a refresh token.
  if (!refreshToken) {
    throw new UnauthorizedError(
      'A refresh token must be provided with this request.'
    );
  }

  const today = new Date();
  const refreshTokenRecord = await getRefreshToken(refreshToken);

  // Throw an exception if the token is either expired or has been revoked.
  if (today > refreshTokenRecord.expiresAt || refreshTokenRecord.revokedAt) {
    throw new UnauthorizedError('The refresh token is no longer valid.');
  }

  // Generate a new refresh token for the current user.
  const user = await getUserById(refreshTokenRecord.userId);
  const newAccessToken = await makeJWT(user.id, config.api.jwtSecret);

  // Return the newly generated refresh token.
  res.status(200).json({
    token: newAccessToken,
  });
});

// For revoking a refresh token.
router.post('/revoke', async (req, res) => {
  const refreshToken = getBearerToken(req);

  // Throw and exception if the `Authorization` header doesn't contain a refresh token.
  if (!refreshToken) {
    throw new UnauthorizedError(
      'A refresh token must be provided with this request.'
    );
  }

  // Revoke the refresh token that matches the one from the `Authorization` header.
  await revokeRefreshToken(refreshToken);

  res.status(204).end();
});

// For health-checking the API.
router.get('/healthz', (req, res) => {
  res.status(200);
  res.set('Content-Type', 'text/plain; charset=utf-8');
  res.send('OK');
});

// For creating a new chirp as an authenticated user.
router.post('/chirps', async (req, res) => {
  const MAX_LENGTH = 140;
  const ILLEGAL_TERMS = ['kerfuffle', 'sharbert', 'fornax'];
  const illegalTermsPattern = new RegExp(`(${ILLEGAL_TERMS.join('|')})`, 'gi');
  const data: {
    body: string;
  } = req.body;

  const token = getBearerToken(req);
  const userId = validateJWT(token, config.api.jwtSecret);

  if (data.body.length > MAX_LENGTH) {
    throw new BadRequestError(`Chirp is too long. Max length is ${MAX_LENGTH}`);
  }

  const chirp = await createChirp(
    data.body.replaceAll(illegalTermsPattern, '****'),
    userId
  );

  res.status(201).json(chirp);
});

// For reading chirps.
router.get('/chirps', async (req, res) => {
  const query: {
    authorId?: User['id'];
  } = req.query;
  let chirps: Chirp[];

  console.log({ authorId: query.authorId });

  if (query.authorId) {
    chirps = await getChirpsByUserId(query.authorId);
  } else {
    chirps = await getAllChirps();
  }

  res.status(200).json(chirps);
});

// For reading the content of a specific chirp.
router.get('/chirps/:chirpId', async (req, res) => {
  const chirpId = req.params.chirpId;
  const chirp = await getChirp(chirpId);

  if (!chirp) {
    throw new NotFoundError(
      `A chirp with the ID '${chirpId}' could not be found.`
    );
  }

  res.status(200).json(chirp);
});

// For deleting a specific chirp.
router.delete('/chirps/:chirpId', async (req, res) => {
  const token = getBearerToken(req);
  const userId = validateJWT(token, config.api.jwtSecret);
  const chirpId = req.params.chirpId;
  const chirp = await getChirp(chirpId);

  if (!chirp) {
    throw new NotFoundError('This chirp could not be found.');
  }

  if (userId !== chirp.userId) {
    throw new ForbiddenError('You are not allowed to delete this chirp.');
  }

  await deleteChirp(chirpId);

  res.status(204).end();
});

// For receiving payment processor webhooks.
router.post('/polka/webhooks', async (req, res) => {
  const apiKey = getAPIKey(req);

  console.log({ apiKey, configKey: config.api.polkaKey });

  if (apiKey !== config.api.polkaKey) {
    throw new UnauthorizedError('The Polka API key is invalid.');
  }

  const data: {
    event: string;
    data: {
      userId: User['id'];
    };
  } = req.body;

  // Exit early if the event is unrecognized.
  if (data.event !== 'user.upgraded') {
    res.status(204).end();
  }

  const user = await getUserById(data.data.userId);

  // Throw a 404 if the user can't be found in the database.
  if (!user) {
    throw new NotFoundError(
      `A user with the ID '${data.data.userId}' could not be found.`
    );
  }

  // Set the user's Chirpy Red status to true.
  await updateUserChirpyRedStatus(data.data.userId, true);

  res.status(204).end();
});

export default router;
