const Joi = require('joi');

const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));
      return res.status(400).json({ message: 'Validation error', errors });
    }
    next();
  };
};

const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const stationSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).required(),
  address: Joi.string().trim().min(1).max(200).required(),
  location: Joi.object({
    type: Joi.string().valid('Point').required(),
    coordinates: Joi.array().items(Joi.number()).length(2).required(),
  }).required(),
  connectors: Joi.array()
    .items(
      Joi.object({
        type: Joi.string()
          .valid('Type2', 'CCS', 'CHAdeMO', 'Tesla', 'Bharat AC', 'Bharat DC')
          .required(),
        powerKw: Joi.number().min(0).required(),
        count: Joi.number().min(1).required(),
      })
    )
    .min(1)
    .required(),
  availability: Joi.object({
    totalSlots: Joi.number().min(1).required(),
    availableSlots: Joi.number().min(0).required(),
  }).required(),
  pricePerKwh: Joi.number().min(0).required(),
  tags: Joi.array().items(Joi.string().trim()).optional(),
});

const reviewSchema = Joi.object({
  rating: Joi.number().integer().min(1).max(5).required(),
  comment: Joi.string().trim().max(1000).optional().allow(''),
});

const updateUserSchema = Joi.object({
  name: Joi.string().trim().min(2).max(50).optional(),
  avatar: Joi.string().uri().optional().allow(''),
});

module.exports = {
  validate,
  registerSchema,
  loginSchema,
  stationSchema,
  reviewSchema,
  updateUserSchema,
};











