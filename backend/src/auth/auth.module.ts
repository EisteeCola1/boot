import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { MailService } from '../mail/mail.service';

@Module({
  providers: [AuthService, MailService],
  controllers: [AuthController],
})
export class AuthModule {}
