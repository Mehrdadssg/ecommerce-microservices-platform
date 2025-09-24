import { z } from 'zod';

export const validate = (schema) => {
  return async (req, res, next) => {
    console.log('Validation middleware called');
    console.log('Request body:', req.body);
    
    try {
      // Validate the request body directly
      const validated = await schema.parseAsync(req.body);
      
    
      req.body = validated;
      
      console.log('Validation passed, transformed body:', req.body);
      next();
    } catch (error) {
      console.error('Validation failed:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }
      
      return res.status(400).json({
        success: false,
        message: error.message || 'Validation error'
      });
    }
  };
};

// Separate validators for different parts of the request
export const validateBody = (schema) => {
  return async (req, res, next) => {
    try {
      const validatedBody = await schema.parseAsync(req.body);
      req.body = validatedBody;  
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.errors
        });
      }
      next(error);
    }
  };
};

export const validateQuery = (schema) => {
  return async (req, res, next) => {
    try {
      const validatedQuery = await schema.parseAsync(req.query);
      
      req.validatedQuery = validatedQuery;
      
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Invalid query parameters',
          errors: error.errors
        });
      }
      next(error);
    }
  };
};

export const validateParams = (schema) => {
  return async (req, res, next) => {
    try {
      req.params = await schema.parseAsync(req.params);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Invalid parameters',
          errors: error.errors
        });
      }
      next(error);
    }
  };
};