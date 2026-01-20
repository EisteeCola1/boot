import {
  ConflictException,
  Injectable,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { RegisterDto } from './dto/register.dto';
import type { LoginDto } from './dto/login.dto';
import type { LogoutDto } from './dto/logout.dto';
import type { AuthenticatedUser, AuthTokenPayload } from './auth.types';
import type { AdminUserDto } from './dto/admin-user.dto';
import { compare, hash } from 'bcryptjs';
import { randomBytes, createHash } from 'crypto';
import { sign } from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';
import { MailService } from '../mail/mail.service';
import type { RefreshDto } from './dto/refresh.dto';

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.ensureInitialAdmin();
  }

  async register(
    dto: RegisterDto,
  ): Promise<AuthenticatedUser & { passwordSent: boolean }> {
    const plainPassword = this.generatePassword();
    const passwordHash = await hash(plainPassword, 10);
    try {
      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          firstName: dto.firstName,
          lastName: dto.lastName,
          passwordHash,
          isAdmin: dto.isAdmin ?? false,
        },
      });

      if (dto.licenceIds?.length) {
        await this.prisma.userLicence.createMany({
          data: dto.licenceIds.map((licenceId) => ({
            userId: user.id,
            licenceId,
          })),
          skipDuplicates: true,
        });
      }
      const passwordSent = await this.mail.sendUserInvite({
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        password: plainPassword,
      });
      return { ...this.toUser(user), passwordSent };
    } catch (error) {
      throw new ConflictException('User already exists');
    }
  }

  async login(dto: LoginDto, meta: { ip?: string; userAgent?: string }) {
    const user = await this.prisma.user.findFirst({
      where: {
        email: dto.email,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValid = await compare(dto.password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const refreshToken = randomBytes(48).toString('hex');
    const refreshTokenHash = this.hashToken(refreshToken);
    const expiresAt = this.refreshTokenExpiry();

    const session = await this.prisma.authSession.create({
      data: {
        userId: user.id,
        refreshTokenHash,
        expiresAt,
        userAgent: meta.userAgent,
        ip: meta.ip,
        deviceLabel: dto.deviceLabel,
      },
    });

    const accessToken = this.createAccessToken({
      sub: user.id,
      sessionId: session.id,
    });

    return {
      accessToken,
      refreshToken,
      user: this.toUser(user),
    };
  }

  async logout(dto: LogoutDto, userId: number): Promise<{ ok: true }> {
    const refreshTokenHash = this.hashToken(dto.refreshToken);
    const session = await this.prisma.authSession.findFirst({
      where: {
        refreshTokenHash,
        userId,
        revokedAt: null,
      },
    });

    if (!session) {
      throw new UnauthorizedException('Session not found');
    }

    await this.prisma.authSession.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });

    return { ok: true };
  }

  async refresh(dto: RefreshDto) {
    const refreshTokenHash = this.hashToken(dto.refreshToken);
    const session = await this.prisma.authSession.findFirst({
      where: {
        refreshTokenHash,
        revokedAt: null,
      },
      include: { user: true },
    });

    if (!session || session.expiresAt <= new Date()) {
      throw new UnauthorizedException('Session expired or revoked');
    }

    const accessToken = this.createAccessToken({
      sub: session.user.id,
      sessionId: session.id,
    });

    return {
      accessToken,
      user: this.toUser(session.user),
    };
  }

  async listUsers(): Promise<AdminUserDto[]> {
    return this.prisma.user.findMany({
      orderBy: { id: 'asc' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isAdmin: true,
        licences: {
          include: {
            licence: true,
          },
        },
      },
    });
  }

  async addUserLicences(userId: number, licenceIds: number[]) {
    if (!licenceIds.length) {
      return { added: 0 };
    }
    const result = await this.prisma.userLicence.createMany({
      data: licenceIds.map((licenceId) => ({
        userId,
        licenceId,
      })),
      skipDuplicates: true,
    });
    return { added: result.count };
  }

  private createAccessToken(payload: AuthTokenPayload): string {
    const secret = process.env.JWT_SECRET ?? 'dev-secret';
    const expiresIn = (process.env.JWT_EXPIRES_IN ?? '15m') as SignOptions['expiresIn'];
    return sign(payload, secret, { expiresIn });
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private refreshTokenExpiry(): Date {
    const days = Number(process.env.REFRESH_TOKEN_TTL_DAYS ?? '30');
    const ms = days * 24 * 60 * 60 * 1000;
    return new Date(Date.now() + ms);
  }

  private async ensureInitialAdmin(): Promise<void> {
    const adminCount = await this.prisma.user.count({
      where: { isAdmin: true },
    });
    if (adminCount > 0) {
      return;
    }

    const email = process.env.ADMIN_EMAIL ?? 'admin@example.com';
    const password = process.env.ADMIN_PASSWORD ?? 'admin123';
    const firstName = process.env.ADMIN_FIRST_NAME ?? 'Admin';
    const lastName = process.env.ADMIN_LAST_NAME ?? 'User';
    const passwordHash = await hash(password, 10);

    try {
      await this.prisma.user.create({
        data: {
          email,
          firstName,
          lastName,
          passwordHash,
          isAdmin: true,
        },
      });

      // eslint-disable-next-line no-console
      console.log(
        `Initial admin created (email: ${email}).`,
      );
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn(
        'Failed to create initial admin. Please verify ADMIN_* env values.',
      );
    }
  }

  private toUser(user: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    isAdmin: boolean;
  }): AuthenticatedUser {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isAdmin: user.isAdmin,
    };
  }

  private generatePassword(): string {
    const base = randomBytes(9).toString('base64');
    return base.replace(/[^a-zA-Z0-9]/g, '').slice(0, 12);
  }
}
