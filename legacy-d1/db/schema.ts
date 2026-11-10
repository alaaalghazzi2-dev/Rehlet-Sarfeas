import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
export const network = sqliteTable('network', { id: text('id').primaryKey(), data: text('data').notNull(), revision: integer('revision').notNull().default(1), updatedAt: text('updated_at').notNull() });
export const adminAccount = sqliteTable('admin_account', {id:integer('id').primaryKey(), username:text('username').notNull(), salt:text('salt').notNull(), passwordHash:text('password_hash').notNull(), version:integer('version').notNull().default(1)});
export const adminSessions = sqliteTable('admin_sessions', {tokenHash:text('token_hash').primaryKey(), version:integer('version').notNull(), expires:integer('expires').notNull()});
export const authLimits = sqliteTable('auth_limits', {key:text('key').primaryKey(), count:integer('count').notNull(), expires:integer('expires').notNull()});
