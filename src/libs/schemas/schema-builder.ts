import Joi, { ObjectSchema } from 'joi'

interface ISchemaBuilderOptions {
  id?: boolean;
  timestamps?: boolean;
  paranoid?: boolean;
  itemLabel?: string;
  listLabel?: string;
  dropdownLabel?: string;
}

const now = new Date()

const SchemaBuilder = (schema: ObjectSchema, {
  id = true,
  timestamps = true,
  paranoid = false,
  itemLabel,
  listLabel,
  dropdownLabel
}: ISchemaBuilderOptions): { item: ObjectSchema; list: ObjectSchema; items: ObjectSchema } => {
  const baseEntitySchema: Record<string, any> = {}

  if (id) {
    baseEntitySchema.id = Joi.number().integer().optional().example(1)
  }
  let itemSchema = Joi.object(baseEntitySchema).concat(schema).unknown()
  if (timestamps) {
    baseEntitySchema.created_at = Joi.date().optional().example(now)
    baseEntitySchema.updated_at = Joi.date().optional().example(now)
    if (paranoid) {
      baseEntitySchema.deleted_at = Joi.date().optional().allow(null).example(now)
    }
  }
  if (itemLabel) {
    itemSchema = itemSchema.label(itemLabel)
  }

  let listSchema = Joi.object({
    list: Joi.array().items(itemSchema).required(),
    meta: Joi.object({
      total: Joi.number().required().example(0),
      page: Joi.number().required().example(1),
      per_page: Joi.number().required().example(1)
    }).unknown()
  })

  if (listLabel) {
    listSchema = listSchema.label(listLabel)
  }

  let itemsSchema = Joi.object({
    items: Joi.array().items(itemSchema).required()
  })

  if (dropdownLabel) {
    itemsSchema = itemsSchema.label(dropdownLabel)
  }

  return { item: itemSchema, list: listSchema, items: itemsSchema }
}

export default SchemaBuilder
