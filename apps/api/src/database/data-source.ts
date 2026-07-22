import { DataSource } from 'typeorm';
import { SnakeNamingStrategy } from '../config/snake-naming.strategy';

/**
 * TypeORM DataSource for CLI migrations.
 * Usage: npx typeorm-ts-node-commonjs migration:run -d src/database/data-source.ts
 *
 * Requires DATABASE_URL environment variable to be set.
 */
const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  namingStrategy: new SnakeNamingStrategy(),
  synchronize: false,
});

export default AppDataSource;
