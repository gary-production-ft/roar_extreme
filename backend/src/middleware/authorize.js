export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    if (roles.length && !roles.includes(req.admin.role)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. Your role does not have permission to access this resource.',
      });
    }

    next();
  };
}

