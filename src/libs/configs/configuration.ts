import dotenv from 'dotenv'
dotenv.config()

interface IDBConfig {
  username?: string;
  password?: string;
  database: string;
  host: string;
  dialect: string;
  migrationStorage: string;
  migrationStorageTableName: string;
  seederStorage: string;
  seederStorageTableName: string;
  pool?: any;
  dialectOptions?: any;
  timezone: string;
}

const {
  DB_USER,
  DB_PASSWORD,
  DB_NAME,
  DB_HOST,
  DB_TEST_NAME
} = process.env

const commonConfig: IDBConfig = {
  username: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME || 'dev',
  host: DB_HOST || '127.0.0.1',
  dialect: 'mysql',
  timezone: '+05:30',
  migrationStorage: 'sequelize',
  migrationStorageTableName: 'sequelize_migrations',
  seederStorage: 'sequelize',
  seederStorageTableName: 'sequelize_seeders'

}

export const development = Object.assign({}, commonConfig, {
  database: DB_NAME || 'dev'
}) as IDBConfig

export const test = Object.assign({}, commonConfig, {
  database: DB_TEST_NAME || 'dev_test'
}) as IDBConfig

export const production = Object.assign({}, commonConfig, {
  database: DB_NAME || 'dev'
}) as IDBConfig

export const build = {
  dialect: 'sqlite',
  storage: 'build-test.sqlite'
}
