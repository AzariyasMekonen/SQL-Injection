import { Router, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { getDb, rawQuery, queryAll } from "../db";

const router = Router();
const JWT_SECRET = "nexacorp-lab-secret";

// Helper: retrieve a flag by lab name
function getFlag(lab: string): string {
  const db = getDb();
  const row = db.prepare("SELECT flag FROM flags WHERE lab = ?").get(lab) as { flag: string } | undefined;
  return row?.flag ?? "";
}

// Helper: detect if a query contains SQL injection markers
function isInjected(input: string): boolean {
  return /('|--|;|\/\*|\bOR\b|\bAND\b|\bUNION\b|\bSELECT\b|\bDROP\b|\bINSERT\b)/i.test(input);
}

// Helper: verify JWT from Authorization header, return payload or null
function verifyToken(req: Request): Record<string, unknown> | null {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return null;
  try {
    return jwt.verify(header.slice(7), JWT_SECRET) as Record<string, unknown>;
  } catch {
    return null;
  }
}

// ── Auth check ───────────────────────────────────────────────────────────────
router.get("/me", (req: Request, res: Response) => {
  const payload = verifyToken(req);
  if (!payload) {
    res.status(401).json({ authenticated: false });
    return;
  }
  res.json({ authenticated: true, user: payload });
});

// ── Lab 1: Craft the Payload ─────────────────────────────────────────────────
router.post("/craft", (req: Request, res: Response) => {
  const { username } = req.body as { username: string };
  const query = `SELECT id, username, role FROM users WHERE username = '${username}'`;
  try {
    const db = getDb();
    const rows = rawQuery(db, query);
    res.json({ query, rows });
  } catch (e: unknown) {
    res.status(400).json({ query, error: (e as Error).message });
  }
});

// ── Lab 2: Bypass Authentication ─────────────────────────────────────────────
router.post("/login", (req: Request, res: Response) => {
  const { username, password } = req.body as { username: string; password: string };
  const query = `SELECT id, username, role, email FROM users WHERE username = '${username}' AND password = '${password}'`;
  try {
    const db = getDb();
    const rows = rawQuery(db, query);
    const user = rows[0];
    if (user) {
      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role, email: user.email },
        JWT_SECRET,
        { expiresIn: "2h" }
      );
      res.json({ success: true, query, user, token, message: `Logged in as ${user.username} (${user.role})` });
    } else {
      res.json({ success: false, query, message: "Invalid credentials" });
    }
  } catch (e: unknown) {
    res.status(400).json({ query, error: (e as Error).message });
  }
});

// ── Lab 3: Dump the Table ────────────────────────────────────────────────────
router.post("/search", (req: Request, res: Response) => {
  const { term } = req.body as { term: string };
  const query = `SELECT id, username, email, role FROM users WHERE username LIKE '%${term}%'`;
  try {
    const db = getDb();
    const rows = rawQuery(db, query);
    res.json({ query, rows });
  } catch (e: unknown) {
    res.status(400).json({ query, error: (e as Error).message });
  }
});

// ── Product Catalog (vulnerable search — Lab 4 surface) ──────────────────────
router.post("/products", (req: Request, res: Response) => {
  const { term } = req.body as { term: string };
  const query = `SELECT id, name, category, price, stock, sku FROM products WHERE name LIKE '%${term}%' OR category LIKE '%${term}%'`;
  try {
    const db = getDb();
    const rows = rawQuery(db, query);
    // Award flag when a UNION-based dump returns more rows than a plain search would
    const normalCount = db.prepare(
      "SELECT COUNT(*) as n FROM products WHERE name LIKE ? OR category LIKE ?"
    ).get(`%${term}%`, `%${term}%`) as { n: number };
    const flag = (rows.length > normalCount.n && isInjected(term)) ? getFlag("products") : undefined;
    res.json({ query, rows, ...(flag ? { flag } : {}) });
  } catch (e: unknown) {
    res.status(400).json({ query, error: (e as Error).message });
  }
});

router.get("/stats", (_req: Request, res: Response) => {
  try {
    const db = getDb();
    const users = queryAll(db, "SELECT id, username, email, role FROM users ORDER BY id");
    const products = queryAll(db, "SELECT id, name, category, price, stock FROM products ORDER BY id");
    const tasks = queryAll(db, "SELECT id, title, owner, status, due_date FROM tasks ORDER BY id");

    res.json({
      stats: {
        users: users.length,
        products: products.length,
        tasks: tasks.length
      },
      users,
      tasks
    });
  } catch (e: unknown) {
    res.status(500).json({ error: (e as Error).message });
  }
});

export default router;
