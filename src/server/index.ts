import { app } from "./app.js";

const port = Number(process.env.PORT ?? 8787);

const host = process.env.HOST ?? "0.0.0.0";
app.listen(port, host, () => {
  console.log(`Nezbig API listening on http://${host}:${port}`);
});
