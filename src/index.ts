import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express';

import { config } from './config.js';
import { migrateDb } from './db/migration.js';
import { BadRequestError } from './app/utils/errors.js';

await migrateDb();

const app = express();

const PORT = process.env.PORT || 8080;

app.use(express.json());
app.use(middlewareLogResponses);
app.use('/app', middlewareMetricsInc, express.static('./src/app'));

app.get('/api/healthz', (req, res) => {
  res.status(200);
  res.set('Content-Type', 'text/plain; charset=utf-8');
  res.send('OK');
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

app.post('/admin/reset', (req, res) => {
  config.api.fileserverHits = 0;

  res.redirect('/admin/metrics');
});

app.post('/api/validate_chirp', (req, res) => {
  interface Data {
    body: string;
  }

  const MAX_LENGTH = 140;
  const ILLEGAL_TERMS = ['kerfuffle', 'sharbert', 'fornax'];
  const illegalTermsPattern = new RegExp(`(${ILLEGAL_TERMS.join('|')})`, 'gi');

  const data: Data = req.body;

  if (data.body.length > MAX_LENGTH) {
    throw new BadRequestError(`Chirp is too long. Max length is ${MAX_LENGTH}`);
  }

  res.status(200).send(
    JSON.stringify({
      cleanedBody: data.body.replaceAll(illegalTermsPattern, '****'),
    })
  );
});

// Error-handling middleware, which must be place after other middleware and
// route handlers.
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof BadRequestError) {
    res.status(400).json({
      error: err.message,
    });
  }
  res.status(500).json({
    error: 'Something went wrong on our end',
  });
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});

function middlewareLogResponses(
  req: Request,
  res: Response,
  next: NextFunction
) {
  res.on('finish', () => {
    if (res.statusCode !== 200) {
      console.log(
        `[NON-OK] ${req.method} ${req.url} - Status: ${res.statusCode}`
      );
    }
  });
  next();
}

function middlewareMetricsInc(req: Request, res: Response, next: NextFunction) {
  config.api.fileserverHits++;
  next();
}
