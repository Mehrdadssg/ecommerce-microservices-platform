
export const validate =(schema) => (req, res, next) => {
    
   return schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params
    }).then(() => {
        next();
    }).catch((err) => {
        if (err.errors) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: err.errors.map(e => e.message)
            });
        }
        next(err);
    });}