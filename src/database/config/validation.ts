import * as Joi from 'joi';

export const validationSchema = Joi.object({
  POSTGRES_HOST: Joi.string().required(),
  POSTGRES_PORT: Joi.number().default(5432),
  POSTGRES_USER: Joi.string().required(),
  POSTGRES_PASSWORD: Joi.string().required(),
  POSTGRES_DB: Joi.string().required(),

  AUDIT_DB_HOST: Joi.string().required(),
  AUDIT_DB_PORT: Joi.number().default(5432),
  AUDIT_DB_USER: Joi.string().required(),
  AUDIT_DB_PASSWORD: Joi.string().required(),
  AUDIT_DB_NAME: Joi.string().required(),
});
