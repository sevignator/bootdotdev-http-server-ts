import express from 'express';

import { config } from './config.js';
import { migrateDb } from './db/migration.js';
import {
  middlewareHandleErrors,
  middlewareLogResponses,
  middlewareMetricsInc,
} from './app/middleware.js';
import {
  createUser,
  deleteAllUsers,
  getUserByEmail,
  getUserById,
} from './db/queries/users.js';
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from './app/errors.js';
import { createChirp, getAllChirps, getChirp } from './db/queries/chirps.js';
import {
  hashPassword,
  checkPasswordHash,
  getBearerToken,
  makeJWT,
  validateJWT,
  makeRefreshToken,
} from './app/auth.js';
import {
  createRefreshToken,
  getRefreshToken,
  revokeRefreshToken,
} from './db/queries/refreshTokens.js';

await migrateDb();

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());
app.use(middlewareLogResponses);
app.use('/app', middlewareMetricsInc, express.static('./src/app'));

app.post('/api/users', async (req, res) => {
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

app.post('/api/login', async (req, res) => {
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

app.post('/api/refresh', async (req, res) => {
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

app.post('/api/revoke', async (req, res) => {
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

app.get('/api/healthz', (req, res) => {
  res.status(200);
  res.set('Content-Type', 'text/plain; charset=utf-8');
  res.send('OK');
});

app.get('/api/chirps', async (req, res) => {
  const chirps = await getAllChirps();

  res.status(200).json(chirps);
});

app.post('/api/chirps', async (req, res) => {
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

app.get('/api/chirps/:chirpId', async (req, res) => {
  const chirpId = req.params.chirpId;

  try {
    const chirp = await getChirp(chirpId);

    res.status(200).json(chirp);
  } catch {
    throw new NotFoundError(
      `A chirp with the ID "${chirpId}" could not be found.`
    );
  }
});

app.post('/admin/reset', async (req, res) => {
  if (config.api.platform !== 'dev') {
    throw new ForbiddenError('This endpoint is forbidden');
  }

  config.api.fileserverHits = 0;

  await deleteAllUsers();

  res.redirect('/admin/metrics');
});

app.get('/admin/metrics', (req, res) => {
  res.status(200);
  res.set('Content-Type', 'text/html; charset=utf-8');
  res.send(`<html>
    <body>
      <h1>Welcome, Chirpy Admin</h1>
      <p>Chirpy has been visited ${config.api.fileserverHits} times!</p>
    </body>
  </html>`);
});

// Error-handling middleware must be place after other middleware and routes.
app.use(middlewareHandleErrors);

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
