import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('users', table => {
    table.increments('id').primary();
    table.string('username', 50).notNullable().unique();
    table.string('email', 100).notNullable().unique();
    table.string('password_hash').notNullable();
    table.string('display_name', 100);
    table.text('bio');
    table.string('avatar_url');
    table.integer('karma_post').defaultTo(0);
    table.integer('karma_comment').defaultTo(0);
    table.boolean('is_admin').defaultTo(false);
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('users');
}
