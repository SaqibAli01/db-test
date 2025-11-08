const Joi = require('joi');

exports.userCreateSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  phone: Joi.string().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('admin', 'staff').default('staff')
});
