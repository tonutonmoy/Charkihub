import type { User } from '@prisma/client';
import { ROLES } from './requireRole.js';

type Perms = {
  manageJobs?: boolean;
  manageBlog?: boolean;
  manageSuggestions?: boolean;
  manageQBank?: boolean;
  manageExamPrep?: boolean;
};

function parsePerms(user: User): Perms {
  if (!user.permissions || typeof user.permissions !== 'object') {
    return {
      manageJobs: true,
      manageBlog: true,
      manageSuggestions: true,
      manageQBank: true,
      manageExamPrep: true,
    };
  }
  const p = user.permissions as Record<string, unknown>;
  return {
    manageJobs: p.manageJobs !== false,
    manageBlog: p.manageBlog !== false,
    manageSuggestions: p.manageSuggestions !== false,
    manageQBank: p.manageQBank !== false,
    manageExamPrep: p.manageExamPrep !== false,
  };
}

export function canManageJobs(user: User): boolean {
  if (user.role === ROLES.SUPERADMIN) return true;
  if (user.role === ROLES.ADMIN) return parsePerms(user).manageJobs !== false;
  return false;
}

export function canManageBlog(user: User): boolean {
  if (user.role === ROLES.SUPERADMIN) return true;
  if (user.role === ROLES.ADMIN) return parsePerms(user).manageBlog !== false;
  return false;
}

export function canManageSuggestions(user: User): boolean {
  if (user.role === ROLES.SUPERADMIN) return true;
  if (user.role === ROLES.ADMIN) return parsePerms(user).manageSuggestions !== false;
  return false;
}

export function canManageQBank(user: User): boolean {
  if (user.role === ROLES.SUPERADMIN) return true;
  if (user.role === ROLES.ADMIN) return parsePerms(user).manageQBank !== false;
  return false;
}

export function canManageExamPrep(user: User): boolean {
  if (user.role === ROLES.SUPERADMIN) return true;
  if (user.role === ROLES.ADMIN) return parsePerms(user).manageExamPrep !== false;
  return false;
}
