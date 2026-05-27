import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentResponse } from '@database/entities/student-response.entity';
import { User } from '@database/entities/user.entity';
import { AuthModule } from '../auth/auth.module';
import { ParentController } from './parent.controller';
import { ParentService } from './parent.service';
import { ParentStudentLinkModule } from './parent-student-link.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, StudentResponse]),
    AuthModule,
    ParentStudentLinkModule,
  ],
  controllers: [ParentController],
  providers: [ParentService],
})
export class ParentModule {}
