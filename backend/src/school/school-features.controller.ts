import { Controller, Get, NotFoundException } from '@nestjs/common';
import { UserRole } from '@database/enums/user-role.enum';
import { CurrentTenant, Roles } from '../auth';
import { TenantContext } from '../auth/interfaces/tenant-context.interface';
import { SchoolFeatureService } from './school-feature.service';

@Controller('school')
export class SchoolFeaturesController {
  constructor(private readonly schoolFeatureService: SchoolFeatureService) {}

  /** Effective feature flags for the authenticated user's school tenant. */
  @Get('features')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SCHOOL_ADMIN,
    UserRole.TEACHER,
    UserRole.STUDENT,
    UserRole.PARENT,
  )
  getFeatures(@CurrentTenant() tenant: TenantContext) {
    const schoolId = tenant.schoolId ?? tenant.actingSchoolId;
    if (!schoolId) {
      throw new NotFoundException('School context required');
    }
    return this.schoolFeatureService.getEffectiveFeatures(schoolId);
  }
}
