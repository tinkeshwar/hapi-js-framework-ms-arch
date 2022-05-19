import { Sequelize } from 'sequelize'
import * as config from './configuration'

type NODE_ENV = 'development' | 'production';
const env: NODE_ENV = (process.env.NODE_ENV || 'development') as NODE_ENV
const envConfig = (config[env] || config.development) as any
const connector = new Sequelize(envConfig || config.development)
export default connector