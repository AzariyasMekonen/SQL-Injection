import initSqlJs, { Database } from "sql.js";

let db: Database;

export async function getDb(): Promise<Database> {
  if (db) return db;
  const SQL = await initSqlJs();
  db = new SQL.Database();
  db.run(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY,
      username TEXT NOT NULL,
      password TEXT NOT NULL,
      email TEXT,
      role TEXT DEFAULT 'user',
      credit_card TEXT,
      ssn TEXT
    );
    INSERT INTO users VALUES (1,'admin',   '5f4dcc3b5aa765d61d8327deb882cf99','admin@corp.internal',  'admin','4111-1111-1111-1111','123-45-6789');
    INSERT INTO users VALUES (2,'alice',   'e99a18c428cb38d5f260853678922e03','alice@corp.internal',  'user', '4222-2222-2222-2222','987-65-4321');
    INSERT INTO users VALUES (3,'bob',     'd8578edf8458ce06fbc5bb76a58c5ca4','bob@corp.internal',    'user', '4333-3333-3333-3333','111-22-3333');
    INSERT INTO users VALUES (4,'charlie', '96e79218965eb72c92a549dd5a330112','charlie@corp.internal','user', '4444-4444-4444-4444','444-55-6666');
    INSERT INTO users VALUES (5,'sysadmin','25d55ad283aa400af464c76d713c07ad','sys@corp.internal',    'admin','4555-5555-5555-5555','777-88-9999');

    CREATE TABLE products (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT,
      price REAL,
      stock INTEGER,
      sku TEXT,
      internal_cost REAL,
      supplier_secret TEXT
    );
    INSERT INTO products VALUES (1,'Quantum NAS 4TB',      'Storage',    349.99, 142, 'SKU-001', 89.50,  'supplier_key=NAS-X9');
    INSERT INTO products VALUES (2,'ProDesk Workstation',  'Compute',   1299.99,  38, 'SKU-002', 620.00, 'supplier_key=WS-PRO');
    INSERT INTO products VALUES (3,'SecureEdge Firewall',  'Network',    899.99,  21, 'SKU-003', 310.00, 'supplier_key=FW-SE7');
    INSERT INTO products VALUES (4,'UltraWide 34" Monitor','Displays',   599.99,  75, 'SKU-004', 210.00, 'supplier_key=MON-UW');
    INSERT INTO products VALUES (5,'CloudSync Gateway',    'Network',    449.99,  56, 'SKU-005', 140.00, 'supplier_key=GW-CS3');
    INSERT INTO products VALUES (6,'Nexa Laptop Pro 15',   'Compute',   1799.99,  19, 'SKU-006', 890.00, 'supplier_key=LAP-NX');
    INSERT INTO products VALUES (7,'Encrypted USB 256GB',  'Storage',     79.99, 310, 'SKU-007',  18.00, 'supplier_key=USB-ENC');
    INSERT INTO products VALUES (8,'10GbE Switch 24-Port', 'Network',    699.99,  14, 'SKU-008', 280.00, 'supplier_key=SW-10G');
    INSERT INTO products VALUES (9,'Rack UPS 2000VA',      'Power',      529.99,  33, 'SKU-009', 195.00, 'supplier_key=UPS-RK');
    INSERT INTO products VALUES(10,'Biometric Door Lock',  'Security',   249.99,  88, 'SKU-010',  72.00, 'supplier_key=BIO-DL');
  `);

  return db;
}

export function queryAll(db: Database, sql: string, params: (string | number)[] = []): Record<string, unknown>[] {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows: Record<string, unknown>[] = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

export function queryOne(db: Database, sql: string, params: (string | number)[] = []): Record<string, unknown> | undefined {
  return queryAll(db, sql, params)[0];
}

// Vulnerable: executes raw interpolated SQL (intentional for lab)
export function rawQuery(db: Database, sql: string): Record<string, unknown>[] {
  const results = db.exec(sql);
  if (!results.length) return [];
  const { columns, values } = results[0];
  return values.map(row => Object.fromEntries(columns.map((c, i) => [c, row[i]])));
}
