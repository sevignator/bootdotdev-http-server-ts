import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express';

import { config } from './config.js';

const app = express();

const PORT = process.env.PORT || 8080;

app.use('/app', middlewareMetricsInc, express.static('./src/app'));
app.use(middlewareLogResponses);

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
      <p>Chirpy has been visited ${config.fileserverHits} times!</p>
    </body>
  </html>`);
});

app.post('/admin/reset', (req, res) => {
  config.fileserverHits = 0;

  res.redirect('/admin/metrics');
});

app.post('/api/validate_chirp', (req, res) => {
  const MAX_LENGTH = 140;
  let body = '';

  req.on('data', (chunk) => {
    body += chunk;
  });

  req.on('end', () => {
    try {
      const parsedBody = JSON.parse(body);

      if (!parsedBody.body) {
        throw new Error('Something went wrong');
      }

      if (parsedBody.body.length > MAX_LENGTH) {
        throw new Error('Chirp is too long');
      }

      res.status(200).send(
        JSON.stringify({
          valid: true,
        })
      );
    } catch (error) {
      res.status(400).send(
        JSON.stringify({
          error: error instanceof Error ? error.message : error,
        })
      );
    }
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
  config.fileserverHits++;
  next();
}
