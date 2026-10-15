import { sql } from 'drizzle-orm';
import { pgTable, serial, text, timestamp, varchar } from 'drizzle-orm/pg-core';
import type { Pool } from 'pg';

/**
 * Migration: 0002_payment_gateway_consolidation
 * 
 * Objectives:
 * 1. Drop store_id and seller_uid columns from payment_gateways (centralizing payment gateway to platform admin only)
 * 2. Add encrypted_secrets (text), secrets_iv (varchar(32)), and auth_tag (varchar(32)) to payment_gateways for AES-256-GCM encryption
 * 3. Create append-only payment_webhook_logs table with provider_event_id (varchar(255) UNIQUE), provider, event_type, raw_payload, and timestamp
 */

export const up = async (pool: Pool): Promise<void> => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Alter payment_gateways: drop store_id and seller_uid if they exist
    await client.query(`
      ALTER TABLE payment_gateways
      DROP COLUMN IF EXISTS store_id,
      DROP COLUMN IF EXISTS seller_uid;
    `);

    // 2. Alter payment_gateways: add encrypted_secrets, secrets_iv, auth_tag
    await client.query(`
      ALTER TABLE payment_gateways
      ADD COLUMN IF NOT EXISTS encrypted_secrets text,
      ADD COLUMN IF NOT EXISTS secrets_iv varchar(32),
      ADD COLUMN IF NOT EXISTS auth_tag varchar(32);
    `);

    // 3. Create payment_webhook_logs append-only ledger
    await client.query(`
      CREATE TABLE IF NOT EXISTS payment_webhook_logs (
        id serial PRIMARY KEY,
        provider_event_id varchar(255) NOT NULL UNIQUE,
        provider text NOT NULL,
        event_type text NOT NULL,
        raw_payload text NOT NULL,
        created_at timestamp DEFAULT now()
      );
    `);

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

export const down = async (pool: Pool): Promise<void> => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`
      ALTER TABLE payment_gateways
      ADD COLUMN IF NOT EXISTS store_id integer,
      ADD COLUMN IF NOT EXISTS seller_uid text DEFAULT '',
      DROP COLUMN IF EXISTS encrypted_secrets,
      DROP COLUMN IF EXISTS secrets_iv,
      DROP COLUMN IF EXISTS auth_tag;
    `);
    await client.query(`DROP TABLE IF EXISTS payment_webhook_logs;`);
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};
