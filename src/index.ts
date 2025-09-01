import express from "express";

const app = express();

const PORT = process.env.PORT || 8080;

app.use("/app", express.static("./src/app"));
app.use(middlewareLogResponses);

app.get("/healthz", (req, res) => {
  res.status(200);
  res.set("Content-Type", "text/plain; charset=utf-8");
  res.send("OK");
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});

function middlewareLogResponses(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
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
