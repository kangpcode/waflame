import argon2 from 'argon2';
import { prisma } from '@waflame/database';
import { RegisterInput, LoginInput, SystemRole } from '@waflame/shared';

export class AuthService {
  /**
   * Helper to create slug from organization name
   */
  private slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Register a new Tenant Organization and Owner User
   */
  async register(input: RegisterInput) {
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });

    if (existingUser) {
      throw new Error('Email sudah terdaftar. Silakan gunakan email lain atau login.');
    }

    // Hash password with Argon2id
    const passwordHash = await argon2.hash(input.password);

    // Create unique slug for tenant
    let baseSlug = this.slugify(input.organizationName);
    let uniqueSlug = baseSlug;
    let counter = 1;
    while (await prisma.tenant.findUnique({ where: { slug: uniqueSlug } })) {
      uniqueSlug = `${baseSlug}-${counter++}`;
    }

    // Find Owner role
    const ownerRole = await prisma.role.findFirst({
      where: { slug: SystemRole.OWNER, tenantId: null },
    });

    if (!ownerRole) {
      throw new Error('Konfigurasi sistem belum lengkap: Role Owner belum di-seed.');
    }

    // Find Free Plan
    const freePlan = await prisma.plan.findUnique({
      where: { slug: 'free' },
    });

    // Execute in transaction
    return await prisma.$transaction(async (tx) => {
      // 1. Create Tenant
      const tenant = await tx.tenant.create({
        data: {
          name: input.organizationName,
          slug: uniqueSlug,
          status: 'ACTIVE',
          maxDevices: freePlan?.maxDevices ?? 1,
          maxContacts: freePlan?.maxContacts ?? 200,
          maxMessagesPerMonth: freePlan?.maxMessagesPerMonth ?? 500,
        },
      });

      // 2. Create User
      const user = await tx.user.create({
        data: {
          email: input.email.toLowerCase(),
          passwordHash,
          fullName: input.fullName,
          phoneNumber: input.phoneNumber,
          isActive: true,
          emailVerifiedAt: new Date(),
        },
      });

      // 3. Link User to Tenant as Owner
      await tx.tenantUser.create({
        data: {
          tenantId: tenant.id,
          userId: user.id,
          roleId: ownerRole.id,
          isOwner: true,
          status: 'ACTIVE',
        },
      });

      // 4. Create Initial Free Subscription
      if (freePlan) {
        const now = new Date();
        const nextMonth = new Date();
        nextMonth.setMonth(now.getMonth() + 1);

        await tx.subscription.create({
          data: {
            tenantId: tenant.id,
            planId: freePlan.id,
            status: 'ACTIVE',
            currentPeriodStart: now,
            currentPeriodEnd: nextMonth,
          },
        });
      }

      // Load permissions
      const rolePermissions = await tx.rolePermission.findMany({
        where: { roleId: ownerRole.id },
        include: { permission: true },
      });

      const permissions = rolePermissions.map((rp) => rp.permission.slug);

      return {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          phoneNumber: user.phoneNumber,
          avatarUrl: user.avatarUrl,
          isSuperadmin: user.isSuperadmin,
        },
        tenant: {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
        },
        role: ownerRole.slug,
        permissions,
      };
    });
  }

  /**
   * User login with email and argon2 verification
   */
  async login(input: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });

    if (!user) {
      throw new Error('Email atau password tidak sesuai');
    }

    if (!user.isActive) {
      throw new Error('Akun dinonaktifkan. Silakan hubungi administrator.');
    }

    const isValidPassword = await argon2.verify(user.passwordHash, input.password);
    if (!isValidPassword) {
      throw new Error('Email atau password tidak sesuai');
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Resolve tenant membership
    const membership = await prisma.tenantUser.findFirst({
      where: { userId: user.id, status: 'ACTIVE' },
      include: {
        tenant: true,
        role: {
          include: {
            rolePermissions: {
              include: { permission: true },
            },
          },
        },
      },
    });

    let tenant = membership?.tenant || null;
    let role = membership?.role?.slug || (user.isSuperadmin ? SystemRole.SUPER_ADMIN : 'guest');
    let permissions: string[] = [];

    if (user.isSuperadmin) {
      const allPerms = await prisma.permission.findMany();
      permissions = allPerms.map((p) => p.slug);
    } else if (membership?.role?.rolePermissions) {
      permissions = membership.role.rolePermissions.map((rp) => rp.permission.slug);
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phoneNumber: user.phoneNumber,
        avatarUrl: user.avatarUrl,
        isSuperadmin: user.isSuperadmin,
      },
      tenant: tenant
        ? {
            id: tenant.id,
            name: tenant.name,
            slug: tenant.slug,
          }
        : null,
      role,
      permissions,
    };
  }

  /**
   * Get user profile and context for authenticated user
   */
  async getMe(userId: string, tenantId?: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('Pengguna tidak ditemukan');
    }

    // Find membership by tenantId or fallback to first active membership
    const membership = await prisma.tenantUser.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
        ...(tenantId ? { tenantId } : {}),
      },
      include: {
        tenant: true,
        role: {
          include: {
            rolePermissions: {
              include: { permission: true },
            },
          },
        },
      },
    });

    let permissions: string[] = [];
    if (user.isSuperadmin) {
      const allPerms = await prisma.permission.findMany();
      permissions = allPerms.map((p) => p.slug);
    } else if (membership?.role?.rolePermissions) {
      permissions = membership.role.rolePermissions.map((rp) => rp.permission.slug);
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phoneNumber: user.phoneNumber,
        avatarUrl: user.avatarUrl,
        isSuperadmin: user.isSuperadmin,
        twoFactorEnabled: user.twoFactorEnabled,
      },
      tenant: membership?.tenant
        ? {
            id: membership.tenant.id,
            name: membership.tenant.name,
            slug: membership.tenant.slug,
          }
        : null,
      role: membership?.role?.slug || (user.isSuperadmin ? SystemRole.SUPER_ADMIN : 'guest'),
      permissions,
    };
  }

  /**
   * Change user password
   */
  async changePassword(userId: string, oldPass: string, newPass: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('Pengguna tidak ditemukan');

    const isValid = await argon2.verify(user.passwordHash, oldPass);
    if (!isValid) throw new Error('Password saat ini salah');

    const newHash = await argon2.hash(newPass);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });
  }

  /**
   * Update profile info
   */
  async updateProfile(userId: string, data: { fullName?: string; phoneNumber?: string; avatarUrl?: string }) {
    return await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        fullName: true,
        phoneNumber: true,
        avatarUrl: true,
      },
    });
  }
}
