// backend/src/db/migrations/[timestamp]_create_posts_table.ts
import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema
    .createTable('posts', table => {
      table.increments('id').primary();
      table.string('title').notNullable();
      table.text('body');
      table.string('url');
      table.enu('post_type', ['text', 'link', 'image', 'video']).notNullable();
      table.integer('vote_count').defaultTo(0);
      table.integer('comment_count').defaultTo(0);
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
      table.boolean('is_pinned').defaultTo(false);
      table.boolean('is_removed').defaultTo(false);
      table.timestamps(true, true);
    })
    .createTable('post_votes', table => {
      table.increments('id').primary();
      table
        .integer('post_id')
        .references('id')
        .inTable('posts')
        .onDelete('CASCADE');
      table
        .integer('user_id')
        .references('id')
        .inTable('users')
        .onDelete('CASCADE');
      table.integer('vote_value').notNullable(); // -1, 0, 1
      table.timestamps(true, true);
      table.unique(['post_id', 'user_id']);
    });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists('post_votes').dropTableIfExists('posts');
}
