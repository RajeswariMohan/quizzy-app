import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserRole } from '@database/enums/user-role.enum';
import { Response } from 'express';
import { memoryStorage } from 'multer';
import { CurrentTenant, RequirePermissions, Roles } from '../auth';
import { Permission } from '../auth/rbac/role-permissions';
import { TenantContext } from '../auth/interfaces/tenant-context.interface';
import { DataTransferService } from './data-transfer.service';

@Controller('admin/data')
@Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
export class AdminDataTransferController {
  constructor(private readonly dataTransferService: DataTransferService) {}

  @Get('export')
  @RequirePermissions(Permission.MANAGE_PLATFORM, Permission.MANAGE_SCHOOL)
  async export(
    @CurrentTenant() tenant: TenantContext,
    @Query('schoolId') schoolId: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ) {
    const bundle = await this.dataTransferService.exportForTenant(tenant, schoolId);
    const filename = `quizzy-backup-${bundle.scope.schoolIds[0] ?? 'export'}-${Date.now()}.json`;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return bundle;
  }

  @Post('import')
  @RequirePermissions(Permission.MANAGE_PLATFORM, Permission.MANAGE_SCHOOL)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 50 * 1024 * 1024 },
    }),
  )
  async import(
    @CurrentTenant() tenant: TenantContext,
    @UploadedFile() file: { buffer: Buffer } | undefined,
    @Query('dryRun') dryRun?: string,
  ) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Upload a JSON backup file (field name: file)');
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(file.buffer.toString('utf8'));
    } catch {
      throw new BadRequestException('File is not valid JSON');
    }

    return this.dataTransferService.importForTenant(
      tenant,
      parsed,
      dryRun === 'true' || dryRun === '1',
    );
  }
}
