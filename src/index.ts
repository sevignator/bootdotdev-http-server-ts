import express from 'express';

import { config } from './config.js';
import { migrateDb } from './db/migration.js';
import {
  middlewareHandleErrors,
  middlewareLogResponses,
  middlewareMetricsInc,
} from './app/middleware.js';
import { createUser, deleteAllUsers } from './db/queries/users.js';
import { BadRequestError, ForbiddenError } from './app/utils/errors.js';
import { createChirp } from './db/queries/chirps.js';

await migrateDb();

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());
app.use(middlewareLogResponses);
app.use('/app', middlewareMetricsInc, express.static('./src/app'));

app.post('/api/users', async (req, res) => {
  const data: {
    email: string;
  } = req.body;

  if (!data.email) {
    throw new BadRequestError('Please provide a valid user email.');
  }

  const user = await createUser({
    email: data.email,
  });

  res.status(201).json(user);
});

app.post('/api/chirps', async (req, res) => {
  const MAX_LENGTH = 140;
  const ILLEGAL_TERMS = ['kerfuffle', 'sharbert', 'fornax'];
  const illegalTermsPattern = new RegExp(`(${ILLEGAL_TERMS.join('|')})`, 'gi');
  const data: {
    body: string;
    userId: string;
  } = req.body;

  if (data.body.length > MAX_LENGTH) {
    throw new BadRequestError(`Chirp is too long. Max length is ${MAX_LENGTH}`);
  }

  const chirp = await createChirp(
    data.body.replaceAll(illegalTermsPattern, '****'),
    data.userId
  );

  res.status(201).json(chirp);
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

app.get('/api/healthz', (req, res) => {
  res.status(200);
  res.set('Content-Type', 'text/plain; charset=utf-8');
  res.send('OK');
});

// Error-handling middleware must be place after other middleware and routes.
app.use(middlewareHandleErrors);

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
