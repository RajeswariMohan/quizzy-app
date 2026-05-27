import { IsEnum, IsOptional } from 'class-validator';

export enum AdminSchoolsStatusFilter {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ALL = 'all',
}

export class AdminOverviewQueryDto {
  @IsOptional()
  @IsEnum(AdminSchoolsStatusFilter)
  schoolsStatus?: AdminSchoolsStatusFilter;
}
