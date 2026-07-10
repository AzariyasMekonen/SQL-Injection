import express from "express";
import path from "path";
import labRouter from "./routes/lab";

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));
app.use("/api/lab", labRouter);

const PORT = 3000;
app.listen(PORT, () => console.log(`SQL Injection Lab → http://localhost:${PORT}`));
