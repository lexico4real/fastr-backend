import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateQueueIdSequence1644515083901 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE SEQUENCE queue_id_seq START 1`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP SEQUENCE queue_id_seq`);
  }
}
