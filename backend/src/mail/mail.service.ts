import { Injectable } from '@nestjs/common';
import nodemailer from 'nodemailer';

type InvitePayload = {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
};

@Injectable()
export class MailService {
  private readonly transporter: nodemailer.Transporter | null;

  constructor() {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT ?? '587');
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        auth: { user, pass },
      });
    } else {
      this.transporter = null;
    }
  }

  async sendUserInvite(payload: InvitePayload): Promise<boolean> {
    if (!this.transporter) {
      // eslint-disable-next-line no-console
      console.warn('SMTP not configured; invite email not sent.');
      return false;
    }

    const from = process.env.SMTP_FROM ?? 'no-reply@example.com';
    const subject = 'Dein Zugang';
    const text = [
      `Hallo ${payload.firstName} ${payload.lastName},`,
      '',
      'dein Account wurde erstellt.',
      `Email: ${payload.email}`,
      `Passwort: ${payload.password}`,
      '',
      'Bitte logge dich ein und aendere das Passwort.',
    ].join('\n');

    await this.transporter.sendMail({
      from,
      to: payload.email,
      subject,
      text,
    });

    return true;
  }
}
