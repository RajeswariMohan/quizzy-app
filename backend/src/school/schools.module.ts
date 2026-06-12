import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlatformSettings } from '@database/entities/platform-settings.entity';
import { School } from '@database/entities/school.entity';
import { User } from '@database/entities/user.entity';
import { SchoolsController } from './schools.controller';
import { SchoolFeaturesController } from './school-features.controller';
import { SchoolLimitsService } from './school-limits.service';
import { SchoolFeatureService } from './school-feature.service';

@Module({
  imports: [TypeOrmModule.forFeature([School, User, PlatformSettings])],
  controllers: [SchoolsController, SchoolFeaturesController],
  providers: [SchoolLimitsService, SchoolFeatureService],
  exports: [SchoolLimitsService, SchoolFeatureService],
})
export class SchoolsModule {}
