import knex from 'knex';
import config from '../knexfile';

// Determine which environment we're in
const environment = process.env.NODE_ENV || 'development';

// Initialize knex with the appropriate configuration
export const db = knex(config[environment]);

// Function to run migrations
export const runMigrations = async () => {
  try {
    console.log('Running database migrations...');
    await db.migrate.latest();
    console.log('Migrations completed successfully');
  } catch (error) {
    console.error('Error running migrations:', error);
    throw error;
  }
};
