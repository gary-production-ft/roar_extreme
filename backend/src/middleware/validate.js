export function validate(schema) {
  return async (req, res, next) => {
    try {
      const parsed = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      req.validatedData = parsed;
      next();
    } catch (err) {
      next(err);
    }
  };
}

