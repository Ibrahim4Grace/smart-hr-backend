import { MigrationInterface, QueryRunner } from "typeorm";

export class AddOwnerEmailToEmailAccounts implements MigrationInterface {
    name = 'AddOwnerEmailToEmailAccounts'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "email_accounts" ADD "owner_email" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "email_accounts" DROP COLUMN "owner_email"`);
    }
} 