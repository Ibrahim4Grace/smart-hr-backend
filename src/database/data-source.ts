import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

const isDevelopment = process.env.NODE_ENV === 'development';

const dataSource = new DataSource({
  type: process.env.DB_TYPE as 'postgres',
  url: process.env.DB_URL ?? '',
  entities: process.env.DB_ENTITIES ? [process.env.DB_ENTITIES] : ['dist/**/*.entity{.ts,.js}'],
  migrations: process.env.DB_MIGRATIONS ? [process.env.DB_MIGRATIONS] : ['dist/migrations/*{.ts,.js}'],
  synchronize: isDevelopment,
  migrationsTableName: 'migrations',
});

export async function initializeDataSource() {
  if (!dataSource.isInitialized) {
    await dataSource.initialize();
  }
  return dataSource;
}

export default dataSource;
