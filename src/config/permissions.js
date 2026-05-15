export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN:       'admin',
  VOLUNTEER:   'volunteer',
};

export const PERMISSIONS = {
  VIEW_DASHBOARD:           'view_dashboard',
  EXPORT_REPORTS:           'export_reports',
  VIEW_ALL_GRIEVANCES:      'view_all_grievances',
  VIEW_ASSIGNED_GRIEVANCES: 'view_assigned_grievances',
  CREATE_GRIEVANCE:         'create_grievance',
  ASSIGN_GRIEVANCE:         'assign_grievance',
  UPDATE_GRIEVANCE_STATUS:  'update_grievance_status',
  DELETE_GRIEVANCE:         'delete_grievance',
  VIEW_REQUESTS:            'view_requests',
  MANAGE_WORKS:             'manage_works',
  APPROVE_REQUESTS:         'approve_requests',
  VIEW_ANNOUNCEMENTS:       'view_announcements',
  CREATE_ANNOUNCEMENT:      'create_announcement',
  EDIT_ANNOUNCEMENT:        'edit_announcement',
  DELETE_ANNOUNCEMENT:      'delete_announcement',
  SEND_BULK_MESSAGE:        'send_bulk_message',
  VIEW_VOLUNTEERS:          'view_volunteers',
  MANAGE_VOLUNTEERS:        'manage_volunteers',
  DEACTIVATE_VOLUNTEER:     'deactivate_volunteer',
  VIEW_VOTERS:              'view_voters',
  MANAGE_VOTERS:            'manage_voters',
  VIEW_EVENTS:              'view_events',
  MANAGE_EVENTS:            'manage_events',
  VIEW_SOS:                 'view_sos',
  RESOLVE_SOS:              'resolve_sos',
  DELETE_SOS:               'delete_sos',
  VIEW_WORKS:               'view_works',
  VIEW_SCHEDULE:            'view_schedule',
  MANAGE_SCHEDULE:          'manage_schedule',
  VIEW_PROGRAMS:            'view_programs',
  MANAGE_PROGRAMS:          'manage_programs',
  VIEW_BIRTHDAYS:           'view_birthdays',
  VIEW_USERS:               'view_users',
  MANAGE_USERS:             'manage_users',
  ASSIGN_ROLES:             'assign_roles',
  DELETE_USERS:             'delete_users',
  VIEW_SETTINGS:            'view_settings',
};

const ALL = Object.values(PERMISSIONS);

const ROLE_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: ALL,
  [ROLES.ADMIN]: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.EXPORT_REPORTS,
    PERMISSIONS.VIEW_ALL_GRIEVANCES,
    PERMISSIONS.VIEW_ASSIGNED_GRIEVANCES,
    PERMISSIONS.CREATE_GRIEVANCE,
    PERMISSIONS.ASSIGN_GRIEVANCE,
    PERMISSIONS.UPDATE_GRIEVANCE_STATUS,
    PERMISSIONS.VIEW_REQUESTS,
    PERMISSIONS.MANAGE_WORKS,
    PERMISSIONS.APPROVE_REQUESTS,
    PERMISSIONS.VIEW_ANNOUNCEMENTS,
    PERMISSIONS.CREATE_ANNOUNCEMENT,
    PERMISSIONS.EDIT_ANNOUNCEMENT,
    PERMISSIONS.DELETE_ANNOUNCEMENT,
    PERMISSIONS.SEND_BULK_MESSAGE,
    PERMISSIONS.VIEW_VOLUNTEERS,
    PERMISSIONS.MANAGE_VOLUNTEERS,
    PERMISSIONS.VIEW_VOTERS,
    PERMISSIONS.MANAGE_VOTERS,
    PERMISSIONS.VIEW_EVENTS,
    PERMISSIONS.MANAGE_EVENTS,
    PERMISSIONS.VIEW_SOS,
    PERMISSIONS.RESOLVE_SOS,
    PERMISSIONS.VIEW_WORKS,
    PERMISSIONS.VIEW_SCHEDULE,
    PERMISSIONS.MANAGE_SCHEDULE,
    PERMISSIONS.VIEW_PROGRAMS,
    PERMISSIONS.MANAGE_PROGRAMS,
    PERMISSIONS.VIEW_BIRTHDAYS,
    PERMISSIONS.VIEW_SETTINGS,
  ],
  [ROLES.VOLUNTEER]: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_ASSIGNED_GRIEVANCES,
    PERMISSIONS.UPDATE_GRIEVANCE_STATUS,
    PERMISSIONS.VIEW_REQUESTS,
    PERMISSIONS.VIEW_ANNOUNCEMENTS,
    PERMISSIONS.CREATE_ANNOUNCEMENT,
    PERMISSIONS.VIEW_WORKS,
    PERMISSIONS.VIEW_EVENTS,
    PERMISSIONS.VIEW_SETTINGS,
  ],
};

export const hasPermission = (role, permission) => {
  if (!role || !permission) return false;
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
};

export const getPermissions = (role) => ROLE_PERMISSIONS[role] ?? [];

export const ROLE_LABELS = {
  [ROLES.SUPER_ADMIN]: 'Super Admin',
  [ROLES.ADMIN]:       'Admin',
  [ROLES.VOLUNTEER]:   'Volunteer',
};

export const ROLE_COLORS = {
  [ROLES.SUPER_ADMIN]: { bg: '#EEEDFE', text: '#3C3489' },
  [ROLES.ADMIN]:       { bg: '#E1F5EE', text: '#085041' },
  [ROLES.VOLUNTEER]:   { bg: '#FAEEDA', text: '#633806' },
};
