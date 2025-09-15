import { Router } from 'express';

import { config } from '../config.js';
import { ForbiddenError } from '../app/errors.js';
import { deleteAllUsers } from '../db/queries/users.js';

/**
 * @description
 * Routes that begin with the `/admin` segment.
 */
const router = Router();

router.post('/reset', async (req, res) => {
  if (config.api.platform !== 'dev') {
    throw new ForbiddenError('This endpoint is forbidden');
  }

  config.api.fileserverHits = 0;

  await deleteAllUsers();

  res.redirect('/admin/metrics');
});

router.get('/metrics', (req, res) => {
  res.status(200);
  res.set('Content-Type', 'text/html; charset=utf-8');
  res.send(`<html>
    <body>
      <h1>Welcome, Chirpy Admin</h1>
      <p>Chirpy has been visited ${config.api.fileserverHits} times!</p>
    </body>
  </html>`);
});

export default router;
