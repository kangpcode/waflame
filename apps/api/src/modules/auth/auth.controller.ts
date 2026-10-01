import { FastifyReply, FastifyRequest } from 'fastify';
import {
  RegisterSchema,
  LoginSchema,
  ChangePasswordSchema,
  UpdateProfileSchema,
} from '@waflame/shared';
import { AuthService } from './auth.service.js';

const authService = new AuthService();

export class AuthController {
  /**
   * POST /api/v1/auth/register
   */
  async register(request: FastifyRequest, reply: FastifyReply) {
    const parseResult = RegisterSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        success: false,
        message: 'Validasi form registrasi gagal',
        errors: parseResult.error.format(),
      });
    }

    try {
      const result = await authService.register(parseResult.data);

      const accessToken = request.server.signAccessToken({
        userId: result.user.id,
        email: result.user.email,
        tenantId: result.tenant.id,
        isSuperadmin: result.user.isSuperadmin,
        role: result.role,
        permissions: result.permissions,
      });

      const refreshToken = request.server.signRefreshToken({
        userId: result.user.id,
      });

      // Set refreshToken as httpOnly cookie
      reply.setCookie('refreshToken', refreshToken, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
      });

      return reply.status(201).send({
        success: true,
        message: 'Pendaftaran organisasi & akun berhasil',
        data: {
          accessToken,
          user: result.user,
          tenant: result.tenant,
          role: result.role,
          permissions: result.permissions,
        },
      });
    } catch (err: any) {
      return reply.status(400).send({
        success: false,
        message: err.message || 'Registrasi gagal diproses',
      });
    }
  }

  /**
   * POST /api/v1/auth/login
   */
  async login(request: FastifyRequest, reply: FastifyReply) {
    const parseResult = LoginSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        success: false,
        message: 'Validasi login gagal',
        errors: parseResult.error.format(),
      });
    }

    try {
      const result = await authService.login(parseResult.data);

      const accessToken = request.server.signAccessToken({
        userId: result.user.id,
        email: result.user.email,
        tenantId: result.tenant?.id || '',
        isSuperadmin: result.user.isSuperadmin,
        role: result.role,
        permissions: result.permissions,
      });

      const refreshToken = request.server.signRefreshToken({
        userId: result.user.id,
      });

      // Set refreshToken as httpOnly cookie
      reply.setCookie('refreshToken', refreshToken, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60,
      });

      return reply.status(200).send({
        success: true,
        message: 'Login berhasil',
        data: {
          accessToken,
          user: result.user,
          tenant: result.tenant,
          role: result.role,
          permissions: result.permissions,
        },
      });
    } catch (err: any) {
      return reply.status(401).send({
        success: false,
        message: err.message || 'Autentikasi gagal',
      });
    }
  }

  /**
   * POST /api/v1/auth/refresh
   */
  async refresh(request: FastifyRequest, reply: FastifyReply) {
    const refreshToken = (request.cookies as any)?.refreshToken;

    if (!refreshToken) {
      return reply.status(401).send({
        success: false,
        message: 'Refresh token tidak ditemukan di cookie',
      });
    }

    try {
      const decoded = request.server.verifyRefreshToken(refreshToken);
      const userContext = await authService.getMe(decoded.userId);

      const newAccessToken = request.server.signAccessToken({
        userId: userContext.user.id,
        email: userContext.user.email,
        tenantId: userContext.tenant?.id || '',
        isSuperadmin: userContext.user.isSuperadmin,
        role: userContext.role,
        permissions: userContext.permissions,
      });

      return reply.status(200).send({
        success: true,
        message: 'Token berhasil diperbarui',
        data: {
          accessToken: newAccessToken,
        },
      });
    } catch (err: any) {
      return reply.status(401).send({
        success: false,
        message: 'Refresh token tidak valid atau telah kedaluwarsa',
      });
    }
  }

  /**
   * POST /api/v1/auth/logout
   */
  async logout(_request: FastifyRequest, reply: FastifyReply) {
    reply.clearCookie('refreshToken', { path: '/' });
    return reply.status(200).send({
      success: true,
      message: 'Logout berhasil',
    });
  }

  /**
   * GET /api/v1/auth/me
   */
  async me(request: FastifyRequest, reply: FastifyReply) {
    try {
      const context = await authService.getMe(request.user.userId, request.user.tenantId);
      return reply.status(200).send({
        success: true,
        data: context,
      });
    } catch (err: any) {
      return reply.status(404).send({
        success: false,
        message: err.message || 'Data pengguna tidak ditemukan',
      });
    }
  }

  /**
   * PUT /api/v1/auth/me
   */
  async updateProfile(request: FastifyRequest, reply: FastifyReply) {
    const parse = UpdateProfileSchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({
        success: false,
        message: 'Validasi form profil gagal',
        errors: parse.error.format(),
      });
    }

    try {
      const updated = await authService.updateProfile(request.user.userId, parse.data);
      return reply.status(200).send({
        success: true,
        message: 'Profil berhasil diperbarui',
        data: updated,
      });
    } catch (err: any) {
      return reply.status(400).send({
        success: false,
        message: err.message,
      });
    }
  }

  /**
   * PUT /api/v1/auth/password
   */
  async changePassword(request: FastifyRequest, reply: FastifyReply) {
    const parse = ChangePasswordSchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({
        success: false,
        message: 'Validasi ganti password gagal',
        errors: parse.error.format(),
      });
    }

    try {
      await authService.changePassword(
        request.user.userId,
        parse.data.oldPassword,
        parse.data.newPassword
      );
      return reply.status(200).send({
        success: true,
        message: 'Password berhasil diubah',
      });
    } catch (err: any) {
      return reply.status(400).send({
        success: false,
        message: err.message,
      });
    }
  }
}
