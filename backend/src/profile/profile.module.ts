import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { School } from '@database/entities/school.entity';
import { User } from '@database/entities/user.entity';
import { AuthModule } from '../auth/auth.module';
import { SchoolAcademicsModule } from '../school-admin/school-academics.module';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, School]), AuthModule, SchoolAcademicsModule],
  controllers: [ProfileController],
  providers: [ProfileService],
  exports: [ProfileService],
})
export class ProfileModule {}
