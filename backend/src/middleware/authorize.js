const ROLE_HIERARCHY = {
  owner: ['owner', 'superadmin'],
  receptionist: ['owner', 'superadmin', 'receptionist', 'staff'],
  trainer: ['owner', 'superadmin', 'trainer', 'coach'],
};

export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized. Administrator authentication required.',
      });
    }

    const currentRole = req.admin.role;

    // 'owner' or 'superadmin' can perform any administrative action
    if (currentRole === 'owner' || currentRole === 'superadmin') {
      return next();
    }

    if (!roles.length) {
      return next();
    }

    // Check if the current role satisfies any of the required role scopes
    const isAllowed = roles.some((role) => {
      const allowedRoles = ROLE_HIERARCHY[role] || [role];
      return allowedRoles.includes(currentRole);
    });

    if (!isAllowed) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: role '${currentRole}' does not have sufficient permissions for this operation.`,
      });
    }

    next();
  };
}
