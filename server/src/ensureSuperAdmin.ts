import bcrypt from 'bcryptjs';
import { prisma } from './db.js';
import { ROLES } from './authz/requireRole.js';

/**
 * On every server start: if SUPER_ADMIN_EMAIL + SUPER_ADMIN_PASSWORD are set
 * and no user exists with that email, create superadmin. If user exists, ensure role is superadmin.
 * Also normalizes legacy role name `super_admin` → `superadmin`.
 */
export async function ensureSuperAdmin(): Promise<void> {
  await prisma.user.updateMany({
    where: { role: 'super_admin' },
    data: { role: ROLES.SUPERADMIN },
  });
  const email = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SUPER_ADMIN_PASSWORD;
  const name = process.env.SUPER_ADMIN_NAME?.trim() || 'Super Admin';

  if (!email || !password) {
    console.log(
      '[startup] SUPER_ADMIN_EMAIL / SUPER_ADMIN_PASSWORD not set — super admin bootstrap skipped'
    );
    return;
  }
  if (password.length < 8) {
    console.warn(
      '[startup] SUPER_ADMIN_PASSWORD must be at least 8 characters — super admin bootstrap skipped'
    );
    return;
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    if (existing.role !== ROLES.SUPERADMIN) {
      await prisma.user.update({
        where: { id: existing.id },
        data: { role: ROLES.SUPERADMIN },
      });
      console.log(`[startup] Super admin role updated for: ${email}`);
    } else {
      console.log(`[startup] Super admin already present: ${email}`);
    }
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: {
      email,
      passwordHash,
      name,
      role: ROLES.SUPERADMIN,
    },
  });
  console.log(`[startup] Super admin user created: ${email}`);
}
