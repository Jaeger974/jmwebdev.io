// db.js
import dotenv from "dotenv";
dotenv.config();

import pg from "pg";


const db = new pg.Client({
connectionString: process.env.DATABASE_URL

});

await db.connect();

export default db;