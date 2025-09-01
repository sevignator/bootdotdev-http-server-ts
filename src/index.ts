import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";

import { config } from "./config.js";

const app = express();

const PORT = process.env.PORT || 8080;

app.use("/app", middlewareMetricsInc, express.static("./src/app"));
app.use(middlewareLogResponses);

app.get("/healthz", (req, res) => {
  res.status(200);
  res.set("Content-Type", "text/plain; charset=utf-8");
  res.send("OK");
});

app.get("/metrics", (req, res) => {
  res.status(200);
  res.set("Content-Type", "text/plain; charset=utf-8");
  res.send(`Hits: ${config.fileserverHits}`);
});

app.get("/reset", (req, res) => {
  config.fileserverHits = 0;

  res.redirect("/metrics");
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});

function middlewareLogResponses(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  res.on("finish", () => {
    if (res.statusCode !== 200) {
      console.log(
        `[NON-OK] ${req.method} ${req.url} - Status: ${res.statusCode}`,
      );
    }
  });
  next();
}

function middlewareMetricsInc(req: Request, res: Response, next: NextFunction) {
  config.fileserverHits++;
  next();
}
