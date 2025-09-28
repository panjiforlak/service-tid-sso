import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSSOFields1752460114489 implements MigrationInterface {
    name = 'AddSSOFields1752460114489'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add missing columns to m_users
        await queryRunner.query(`ALTER TABLE "m_users" ADD "email_verified" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "m_users" ADD "role" character varying NOT NULL DEFAULT 'user'`);
        await queryRunner.query(`ALTER TABLE "m_users" ADD "permissions" json`);

        // Create m_user_sessions table
        await queryRunner.query(`CREATE TABLE "m_user_sessions" (
            "id" SERIAL NOT NULL,
            "user_id" integer NOT NULL,
            "session_token" character varying NOT NULL,
            "refresh_token" character varying NOT NULL,
            "expires_at" TIMESTAMP NOT NULL,
            "is_active" boolean NOT NULL DEFAULT true,
            "created_at" TIMESTAMP NOT NULL DEFAULT now(),
            CONSTRAINT "UQ_m_user_sessions_session_token" UNIQUE ("session_token"),
            CONSTRAINT "UQ_m_user_sessions_refresh_token" UNIQUE ("refresh_token"),
            CONSTRAINT "PK_m_user_sessions" PRIMARY KEY ("id")
        )`);

        // Create m_password_resets table
        await queryRunner.query(`CREATE TABLE "m_password_resets" (
            "id" SERIAL NOT NULL,
            "user_id" integer NOT NULL,
            "reset_token" character varying NOT NULL,
            "expires_at" TIMESTAMP NOT NULL,
            "is_used" boolean NOT NULL DEFAULT false,
            "created_at" TIMESTAMP NOT NULL DEFAULT now(),
            CONSTRAINT "UQ_m_password_resets_reset_token" UNIQUE ("reset_token"),
            CONSTRAINT "PK_m_password_resets" PRIMARY KEY ("id")
        )`);

        // Create m_failed_logins table
        await queryRunner.query(`CREATE TABLE "m_failed_logins" (
            "id" SERIAL NOT NULL,
            "username" character varying NOT NULL,
            "ip_address" character varying,
            "attempt_count" integer NOT NULL DEFAULT 1,
            "last_attempt" TIMESTAMP NOT NULL DEFAULT now(),
            "is_locked" boolean NOT NULL DEFAULT false,
            CONSTRAINT "PK_m_failed_logins" PRIMARY KEY ("id")
        )`);

        // Create m_roles table
        await queryRunner.query(`CREATE TABLE "m_roles" (
            "id" SERIAL NOT NULL,
            "name" character varying NOT NULL,
            "description" text,
            "created_at" TIMESTAMP NOT NULL DEFAULT now(),
            CONSTRAINT "UQ_m_roles_name" UNIQUE ("name"),
            CONSTRAINT "PK_m_roles" PRIMARY KEY ("id")
        )`);

        // Create m_user_roles table
        await queryRunner.query(`CREATE TABLE "m_user_roles" (
            "id" SERIAL NOT NULL,
            "user_id" integer NOT NULL,
            "role_id" integer NOT NULL,
            "created_at" TIMESTAMP NOT NULL DEFAULT now(),
            CONSTRAINT "PK_m_user_roles" PRIMARY KEY ("id")
        )`);

        // Add foreign key constraints
        await queryRunner.query(`ALTER TABLE "m_user_sessions" ADD CONSTRAINT "FK_m_user_sessions_user_id" FOREIGN KEY ("user_id") REFERENCES "m_users"("id") ON DELETE CASCADE`);
        await queryRunner.query(`ALTER TABLE "m_password_resets" ADD CONSTRAINT "FK_m_password_resets_user_id" FOREIGN KEY ("user_id") REFERENCES "m_users"("id") ON DELETE CASCADE`);
        await queryRunner.query(`ALTER TABLE "m_user_roles" ADD CONSTRAINT "FK_m_user_roles_user_id" FOREIGN KEY ("user_id") REFERENCES "m_users"("id") ON DELETE CASCADE`);
        await queryRunner.query(`ALTER TABLE "m_user_roles" ADD CONSTRAINT "FK_m_user_roles_role_id" FOREIGN KEY ("role_id") REFERENCES "m_roles"("id") ON DELETE CASCADE`);

        // Insert default roles
        await queryRunner.query(`INSERT INTO "m_roles" ("name", "description") VALUES 
            ('admin', 'Administrator with full access'),
            ('user', 'Regular user with limited access'),
            ('manager', 'Manager with elevated permissions')`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign key constraints
        await queryRunner.query(`ALTER TABLE "m_user_roles" DROP CONSTRAINT "FK_m_user_roles_role_id"`);
        await queryRunner.query(`ALTER TABLE "m_user_roles" DROP CONSTRAINT "FK_m_user_roles_user_id"`);
        await queryRunner.query(`ALTER TABLE "m_password_resets" DROP CONSTRAINT "FK_m_password_resets_user_id"`);
        await queryRunner.query(`ALTER TABLE "m_user_sessions" DROP CONSTRAINT "FK_m_user_sessions_user_id"`);

        // Drop tables
        await queryRunner.query(`DROP TABLE "m_user_roles"`);
        await queryRunner.query(`DROP TABLE "m_roles"`);
        await queryRunner.query(`DROP TABLE "m_failed_logins"`);
        await queryRunner.query(`DROP TABLE "m_password_resets"`);
        await queryRunner.query(`DROP TABLE "m_user_sessions"`);

        // Remove added columns from m_users
        await queryRunner.query(`ALTER TABLE "m_users" DROP COLUMN "permissions"`);
        await queryRunner.query(`ALTER TABLE "m_users" DROP COLUMN "role"`);
        await queryRunner.query(`ALTER TABLE "m_users" DROP COLUMN "email_verified"`);
    }
}
