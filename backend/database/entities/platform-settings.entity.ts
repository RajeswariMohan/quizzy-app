import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

export interface PlatformSettingsJson {
  aiGenerationEnabled: boolean;
  studentLeaderboardEnabled: boolean;
  parentPortalEnabled: boolean;
  teacherQuizCreationEnabled: boolean;
  gamificationEnabled: boolean;
  maintenanceMode: boolean;
  maintenanceMessage: string | null;
}

export const DEFAULT_PLATFORM_SETTINGS: PlatformSettingsJson = {
  aiGenerationEnabled: true,
  studentLeaderboardEnabled: true,
  parentPortalEnabled: true,
  teacherQuizCreationEnabled: true,
  gamificationEnabled: true,
  maintenanceMode: false,
  maintenanceMessage: null,
};

export const PLATFORM_SETTINGS_ROW_ID = '00000000-0000-0000-0000-000000000001';

@Entity({ name: 'platform_settings' })
export class PlatformSettings {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ type: 'jsonb' })
  settings: PlatformSettingsJson;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @Column({ name: 'updated_by', type: 'uuid', nullable: true })
  updatedByUserId: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'updated_by' })
  updatedBy: User | null;
}
