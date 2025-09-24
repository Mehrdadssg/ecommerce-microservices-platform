export const validateBody = (schema) => {
    return (req, res, next) => {
        try {
            const result = schema.safeParse(req.body);
            if (!result.success) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: result.error.errors
                });
            }
            req.body = result.data;
            next();
        } catch (error) {
            next(error);
        }
    };
};

export const validateQuery = (schema) => {
    return (req, res, next) => {
        try {
            const result = schema.safeParse(req.query);
            if (!result.success) {
                return res.status(400).json({
                    success: false,
                    message: 'Query validation failed',
                    errors: result.error.errors
                });
            }
            req.query = result.data;
            next();
        } catch (error) {
            next(error);
        }
    };
};