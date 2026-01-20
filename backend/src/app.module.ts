import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { CatalogModule } from './catalog/catalog.module';
import { LearningModule } from './learning/learning.module';

@Module({
  imports: [PrismaModule, AuthModule, CatalogModule, LearningModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
