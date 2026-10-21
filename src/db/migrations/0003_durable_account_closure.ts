import type { Pool } from 'pg';

/**
 * Migration: 0003_durable_account_closure
 * 
 * Objectives (Rule N009, Audit Section 9 & Section 4.2 Data Preservation):
 * 1. Create account_deletion_status enum type: ('awaiting_seller', 'confirmed', 'deleted', 'cancelled')
 * 2. Create structural account_deletions table:
 *    - id (serial PRIMARY KEY)
 *    - seller_uid (varchar(255) NOT NULL UNIQUE) -> unique active lock preventing parallel termination requests
 *    - requested_at (timestamp NOT NULL DEFAULT now())
 *    - scheduled_delete_at (timestamp NOT NULL)
 *    - final_reminder_sent_at (timestamp)
 *    - status (account_deletion_status NOT NULL DEFAULT 'awaiting_seller')
 *    - token_hash (varchar(64) NOT NULL) -> SHA-256 hash of single-use confirmation token
 *    - reason (text)
 *    - admin_uid (text)
 *    - confirmed_at (timestamp)
 *    - cancelled_at (timestamp)
 *    - completed_at (timestamp)
 *    - hold_reason (text)
 *    - created_at / updated_at (timestamp)
 * 3. Preserve accounting entries, ledger lines, and completed historical orders for regulatory compliance.
 */

export const up = async (pool: Pool): Promise<void> => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Create account_deletion_status ENUM if not already present
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'account_deletion_status') THEN
          CREATE TYPE account_deletion_status AS ENUM (
            'awaiting_seller',
            'confirmed',
            'deleted',
            'cancelled'
          );
        END IF;
      END$$;
    `);

    // 2. Build the structural account_deletions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS account_deletions (
        id serial PRIMARY KEY,
        seller_uid varchar(255) NOT NULL UNIQUE,
        requested_at timestamp NOT NULL DEFAULT now(),
        scheduled_delete_at timestamp NOT NULL,
        final_reminder_sent_at timestamp,
        status account_deletion_status NOT NULL DEFAULT 'awaiting_seller',
        token_hash varchar(64) NOT NULL,
        reason text DEFAULT '',
        admin_uid text DEFAULT '',
        confirmed_at timestamp,
        cancelled_at timestamp,
        completed_at timestamp,
        hold_reason text DEFAULT '',
        created_at timestamp DEFAULT now(),
        updated_at timestamp DEFAULT now()
      );

      CREATE INDEX IF NOT EXISTS idx_account_deletions_seller_uid ON account_deletions(seller_uid);
      CREATE INDEX IF NOT EXISTS idx_account_deletions_status ON account_deletions(status);
      CREATE INDEX IF NOT EXISTS idx_account_deletions_scheduled ON account_deletions(scheduled_delete_at);
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
    await client.query(`DROP TABLE IF EXISTS account_deletions CASCADE;`);
    await client.query(`DROP TYPE IF EXISTS account_deletion_status CASCADE;`);
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};
