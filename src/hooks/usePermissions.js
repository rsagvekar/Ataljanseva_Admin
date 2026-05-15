import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { hasPermission, PERMISSIONS, ROLES } from '../config/permissions';

export const usePermissions = () => {
  const { user } = useContext(AuthContext);
  const role = user?.role;

  const can = (permission) => hasPermission(role, permission);

  return {
    role,
    can,
    isSuperAdmin: role === ROLES.SUPER_ADMIN,
    isAdmin:      role === ROLES.ADMIN,
    isVolunteer:  role === ROLES.VOLUNTEER,
    PERMISSIONS,
    ROLES,
  };
};
