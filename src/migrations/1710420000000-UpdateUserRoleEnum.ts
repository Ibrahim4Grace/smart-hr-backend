import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateUserRoleEnum1710420000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // First, create a new enum type with the updated values
        await queryRunner.query(`
            ALTER TYPE "public"."users_role_enum" RENAME TO "users_role_enum_old";
            CREATE TYPE "public"."users_role_enum" AS ENUM('admin', 'super_admin', 'employee', 'hr', 'user');
        `);

        // Update the column to use the new enum type
        await queryRunner.query(`
            ALTER TABLE "users" 
            ALTER COLUMN "role" TYPE "public"."users_role_enum" 
            USING "role"::text::"public"."users_role_enum";
        `);

        // Drop the old enum type
        await queryRunner.query(`DROP TYPE "public"."users_role_enum_old";`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revert the changes if needed
        await queryRunner.query(`
            ALTER TYPE "public"."users_role_enum" RENAME TO "users_role_enum_old";
            CREATE TYPE "public"."users_role_enum" AS ENUM('admin', 'super_admin', 'employee', 'hr');
        `);

        await queryRunner.query(`
            ALTER TABLE "users" 
            ALTER COLUMN "role" TYPE "public"."users_role_enum" 
            USING "role"::text::"public"."users_role_enum";
        `);

        await queryRunner.query(`DROP TYPE "public"."users_role_enum_old";`);
    }
} 