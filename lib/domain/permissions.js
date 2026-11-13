import { ROLE_PERMISSIONS } from "./constants.js";

/**
 * Role based access control for the records modules.
 * The same matrix is mirrored by the SQL policies in supabase/migrations.
 */
export function permissionsForRole(role) {
  return ROLE_PERMISSIONS[role] ?? [];
}

export function can(role, permission) {
  if (!role || !permission) return false;
  return permissionsForRole(role).includes(permission);
}

export function canAny(role, permissions) {
  return permissions.some((permission) => can(role, permission));
}

/** Throws a 403-shaped error when the actor lacks the right. */
export function assertCan(actor, permission, message) {
  if (!actor) {
    const error = new Error("You need to sign in to do that.");
    error.code = "unauthenticated";
    error.status = 401;
    throw error;
  }

  if (!can(actor.role, permission)) {
    const error = new Error(
      message ?? "Your role does not allow this action. Ask an admin for access.",
    );
    error.code = "forbidden";
    error.status = 403;
    throw error;
  }
}
