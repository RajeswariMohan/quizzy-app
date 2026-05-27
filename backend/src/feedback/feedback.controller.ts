import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { UserRole } from '@database/enums/user-role.enum';
import { CurrentTenant, RequirePermissions, Roles } from '../auth';
import { Permission } from '../auth/rbac/role-permissions';
import { TenantContext } from '../auth/interfaces/tenant-context.interface';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { ListFeedbackQueryDto } from './dto/list-feedback-query.dto';
import { UpdateFeedbackDto } from './dto/update-feedback.dto';
import { FeedbackService } from './feedback.service';

@Controller()
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post('feedback')
  @Roles(UserRole.STUDENT, UserRole.PARENT, UserRole.SCHOOL_ADMIN)
  create(@CurrentTenant() tenant: TenantContext, @Body() dto: CreateFeedbackDto) {
    return this.feedbackService.create(tenant, dto);
  }

  @Get('feedback/mine')
  @Roles(UserRole.STUDENT, UserRole.PARENT, UserRole.SCHOOL_ADMIN)
  listMine(@CurrentTenant() tenant: TenantContext) {
    return this.feedbackService.listMine(tenant);
  }

  @Get('admin/feedback')
  @Roles(UserRole.SUPER_ADMIN)
  @RequirePermissions(Permission.MANAGE_PLATFORM)
  listForAdmin(@Query() query: ListFeedbackQueryDto) {
    return this.feedbackService.listForAdmin(query);
  }

  @Patch('admin/feedback/:feedbackId')
  @Roles(UserRole.SUPER_ADMIN)
  @RequirePermissions(Permission.MANAGE_PLATFORM)
  updateForAdmin(
    @Param('feedbackId', ParseUUIDPipe) feedbackId: string,
    @Body() dto: UpdateFeedbackDto,
  ) {
    return this.feedbackService.updateForAdmin(feedbackId, dto);
  }
}
