import dotenv from "dotenv";
import knex, { Knex } from "knex";

dotenv.config();

// Initialize knex with PostgreSQL configuration
const db: Knex = knex({
  client: "pg",
  connection: {
    host: process.env.DB_HOST || "postgres",
    port: parseInt(process.env.DB_PORT || "5432", 10),
    user: process.env.DB_USER || "reddituser",
    password: process.env.DB_PASSWORD || "redditpass",
    database: process.env.DB_NAME || "redditclone",
  },
  pool: { min: 0, max: 10 },
  migrations: {
    tableName: "knex_migrations",
    directory: "./migrations",
  },
  seeds: {
    directory: "./seeds",
  },
});

// Function to test the database connection
const setupDbConnection = async (): Promise<boolean> => {
  try {
    await db.raw("SELECT 1");
    console.log("PostgreSQL database connected successfully!");
    return true;
  } catch (error) {
    console.error("Error connecting to PostgreSQL database:", error);
    // Retry connection after delay
    console.log("Retrying connection in 5 seconds...");
    setTimeout(setupDbConnection, 5000);
    return false;
  }
};

export { db, setupDbConnection };
