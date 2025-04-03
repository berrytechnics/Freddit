// backend/src/db/migrations/[timestamp]_create_subreddits_table.ts
import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema
    .createTable('subreddits', table => {
      table.increments('id').primary();
      table.string('name').unique().notNullable();
      table.string('display_name');
      table.text('description');
      table.string('banner_url');
      table.string('icon_url');
      table.boolean('is_private').defaultTo(false);
      table.boolean('is_restricted').defaultTo(false);
      table
        .integer('creator_id')
        .references('id')
        .inTable('users')
        .onDelete('SET NULL');
      table.timestamps(true, true);
    })
    .createTable('subreddit_members', table => {
      table.increments('id').primary();
      table
        .integer('user_id')
        .references('id')
        .inTable('users')
        .onDelete('CASCADE');
      table
        .integer('subreddit_id')
        .references('id')
        .inTable('subreddits')
        .onDelete('CASCADE');
      table.boolean('is_moderator').defaultTo(false);
      table.timestamp('joined_at').defaultTo(knex.fn.now());
      table.unique(['user_id', 'subreddit_id']);
    });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema
    .dropTableIfExists('subreddit_members')
    .dropTableIfExists('subreddits');
}
