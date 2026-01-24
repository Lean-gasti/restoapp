export enum USER_ROLE {
  ADMIN = 'ADMIN',
  USER = 'USER',
  VIEWER = 'VIEWER'
}

export const USER_ROLE_LABELS: Record<USER_ROLE, string> = {
  [USER_ROLE.ADMIN]: 'Administrador',
  [USER_ROLE.USER]: 'Usuario',
  [USER_ROLE.VIEWER]: 'Solo lectura'
};
