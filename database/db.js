// db.js
import dotenv from "dotenv";
dotenv.config();

import pg from "pg";
const { Pool } = pg;

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  max: 5,               // optional but recommended
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000
});

// Optional: warm-up query to avoid cold-start crashes
db.query("SELECT 1").then(() => {
  console.log("Connected to Neon");
}).catch(err => {
  console.error("Initial Neon connection failed:", err.message);
});

export default db;