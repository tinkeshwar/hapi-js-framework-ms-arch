import 'reflect-metadata'
import sequelize, { DataType, DataTypes, InitOptions, Model } from 'sequelize'
import snakeCaseKeys from 'snakecase-keys'
import toSnakeCase from 'to-snake-case'
import EventManager from '../services/event/emitter'

interface IColumnOption {[key: string]: any; type?: never;}

interface IEntityOptions extends InitOptions{
    tableName?: never;
    eventModelId?: string;
    eventId?: string;
    eventPrefix?: string;
}

type ModelStatic = typeof Model & (new ()=>Model);

const attributesMetadataField = Symbol('sequelizeAttributes')

const defaultEntityOptions = {
  paranoid: false,
  underscored: true
}

export function Column (type: DataType, options: IColumnOption = {}) {
  return (target: any, propertyKey: string) => {
    const attributes = Reflect.getMetadata(attributesMetadataField, target) || {}
    Reflect.defineMetadata(attributesMetadataField, {
      ...attributes,
      [propertyKey]: { type, allowNull: false, ...options }
    }, target)
  }
}

export function PrimaryKey (options:IColumnOption = {}) {
  return Column(
    DataTypes.BIGINT,
    { autoIncrement: true, primaryKey: true, ...options }
  )
}

export function ForeignKey (options:IColumnOption = {}) {
  return Column(
    DataTypes.BIGINT,
    { autoIncrement: false, primaryKey: false, ...options }
  )
}

export function PrimaryUUID (options:IColumnOption = {}) {
  return Column(
    DataTypes.UUID,
    { defaultValue: sequelize.UUIDV4, primaryKey: true, ...options }
  )
}

export function AutoDate (options: IColumnOption = {}) {
  return Column(
    DataTypes.DATE,
    { allowNull: true, ...options }
  )
}

export function AutoString (options: IColumnOption = {}) {
  return Column(
    DataTypes.STRING,
    { allowNull: true, ...options }
  )
}

export function Virtual (options: IColumnOption = {}) {
  return Column(
    DataTypes.VIRTUAL,
    { allowNull: true, ...options }
  )
}

export function Extend (options: IColumnOption = {}) {
  return (target: any, propertyKey: string) => {
    const attributes = Reflect.getMetadata(attributesMetadataField, target) || {}
    const attribute = attributes[propertyKey]
    if (!attribute) {
      throw new Error(`${propertyKey} is not a Column`)
    }
    attributes[propertyKey] = Object.assign(attribute, options)
    Reflect.defineMetadata(attributesMetadataField, attributes, target)
  }
}

export function Nullable (target: any, propertyKey: string) {
  Extend({ allowNull: true })(target, propertyKey)
}

export function Unique (target: any, propertyKey: string) {
  Extend({ unique: true })(target, propertyKey)
}

export const Entity = (tableName: string, options: IEntityOptions) => (target: ModelStatic): void => {
  const targetPrototype = target.prototype as Record<string, any> & { toJSON(): Record<string, any>; }
  const attributes = Reflect.getMetadata(attributesMetadataField, targetPrototype)

  if (!attributes) {
    throw new Error('Columns must be defined in the model before declaring it as an Entity')
  }

  const initOptions = Object.assign({}, defaultEntityOptions, options)
  delete initOptions.eventPrefix
  delete initOptions.eventModelId
  delete initOptions.eventId

  if (initOptions.underscored) {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const toJSON = targetPrototype.toJSON || function (this: Model) {
      return this.get('', { plain: true })
    }
    targetPrototype.toJSON = function () {
      return snakeCaseKeys(toJSON.apply(this))
    }
  }

  target.init(attributes, {
    tableName,
    ...initOptions
  })

  if (options.eventPrefix && options.eventId) {
    const eventPrefix = options.eventPrefix
    const eventId = options.eventId

    target.afterCreate(async (record: Model) => {
      await EventManager.emit(`${eventPrefix}_CREATED`.toUpperCase(), {
        [eventId]: (record as Record<string, any>)[options.eventModelId || 'id']
      })
    })

    target.afterUpdate(async (record: Model) => {
      await EventManager.emit(`${eventPrefix}_UPDATED`.toUpperCase(), {
        [eventId]: (record as Record<string, any>)[options.eventModelId || 'id'],
        changed: (record.changed() as string[]).map((key) => toSnakeCase(key))
      })
    })

    target.afterDestroy(async (record: Model) => {
      await EventManager.emit(`${eventPrefix}_DESTROYED`.toUpperCase(), {
        [eventId]: (record as Record<string, any>)[options.eventModelId || 'id']
      })
    })
  }
}