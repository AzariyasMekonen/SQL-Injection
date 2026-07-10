import { Router, Request, Response } from "express";
import { getDb, rawQuery, queryAll, queryOne } from "../db";

const router = Router();

// ── Lab 1: Craft the Payload ─────────────────────────────────────────────────
router.post("/craft", async (req: Request, res: Response) => {
  const { username } = req.body as { username: string };
  const query = `SELECT id, username, role FROM users WHERE username = '${username}'`;
  try {
    const db = await getDb();
    const rows = rawQuery(db, query);
    res.json({ query, rows });
  } catch (e: unknown) {
    res.status(400).json({ query, error: (e as Error).message });
  }
});

// ── Lab 2: Bypass Authentication ─────────────────────────────────────────────
router.post("/login", async (req: Request, res: Response) => {
  const { username, password } = req.body as { username: string; password: string };
  const query = `SELECT id, username, role, email FROM users WHERE username = '${username}' AND password = '${password}'`;
  try {
    const db = await getDb();
    const rows = rawQuery(db, query);
    const user = rows[0];
    if (user) {
      res.json({ success: true, query, user, message: `Logged in as ${user.username} (${user.role})` });
    } else {
      res.json({ success: false, query, message: "Invalid credentials" });
    }
  } catch (e: unknown) {
    res.status(400).json({ query, error: (e as Error).message });
  }
});

// ── Lab 3: Dump the Table ────────────────────────────────────────────────────
router.post("/search", async (req: Request, res: Response) => {
  const { term } = req.body as { term: string };
  const query = `SELECT id, username, email, role FROM users WHERE username LIKE '%${term}%'`;
  try {
    const db = await getDb();
    const rows = rawQuery(db, query);
    res.json({ query, rows });
  } catch (e: unknown) {
    res.status(400).json({ query, error: (e as Error).message });
  }
});

// ── Product Catalog (vulnerable search — Lab 3 surface) ──────────────────────
router.post("/products", async (req: Request, res: Response) => {
  const { term } = req.body as { term: string };
  const query = `SELECT id, name, category, price, stock, sku FROM products WHERE name LIKE '%${term}%' OR category LIKE '%${term}%'`;
  try {
    const db = await getDb();
    const rows = rawQuery(db, query);
    res.json({ query, rows });
  } catch (e: unknown) {
    res.status(400).json({ query, error: (e as Error).message });
  }
});

export default router;
