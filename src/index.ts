import express from 'express';

import adminRoutes from './routes/admin.js';
import apiRoutes from './routes/api.js';

import { migrateDb } from './db/migration.js';
import {
  middlewareHandleErrors,
  middlewareLogResponses,
  middlewareMetricsInc,
} from './app/middleware.js';

await migrateDb();

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());
app.use(middlewareLogResponses);
app.use('/app', middlewareMetricsInc, express.static('./src/app'));

app.use('/api', apiRoutes);
app.use('/admin', adminRoutes);

// Error-handling middleware must be place after other middleware and routes.
app.use(middlewareHandleErrors);

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
