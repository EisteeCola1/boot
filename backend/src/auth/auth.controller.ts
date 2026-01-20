import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import type { LoginDto } from './dto/login.dto';
import type { RegisterDto } from './dto/register.dto';
import type { LogoutDto } from './dto/logout.dto';
import type { AddUserLicencesDto } from './dto/add-user-licences.dto';
import type { AdminUserDto } from './dto/admin-user.dto';
import type { RefreshDto } from './dto/refresh.dto';
import { AuthGuard } from './auth.guard';
import { AdminGuard } from './admin.guard';
import type { AuthenticatedUser } from './auth.types';

type AuthRequest = Request & { user?: AuthenticatedUser };

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() body: LoginDto, @Req() request: Request) {
    return this.authService.login(body, {
      ip: request.ip,
      userAgent: request.headers['user-agent'],
    });
  }

  @Post('refresh')
  async refresh(@Body() body: RefreshDto) {
    return this.authService.refresh(body);
  }

  @UseGuards(AuthGuard)
  @Post('logout')
  async logout(@Body() body: LogoutDto, @Req() request: AuthRequest) {
    return this.authService.logout(body, request.user!.id);
  }

  @UseGuards(AuthGuard, AdminGuard)
  @Post('register')
  async register(@Body() body: RegisterDto) {
    return this.authService.register(body);
  }

  @UseGuards(AuthGuard, AdminGuard)
  @Post('users/:id/licences')
  async addUserLicences(
    @Param('id', ParseIntPipe) userId: number,
    @Body() body: AddUserLicencesDto,
  ) {
    return this.authService.addUserLicences(userId, body.licenceIds ?? []);
  }

  @UseGuards(AuthGuard, AdminGuard)
  @Get('users')
  async listUsers(): Promise<AdminUserDto[]> {
    return this.authService.listUsers();
  }

  @UseGuards(AuthGuard)
  @Get('check-token')
  async checkToken() {
    return { ok: true };
  }

  @UseGuards(AuthGuard)
  @Get('me')
  async me(@Req() request: AuthRequest) {
    return request.user;
  }
}
