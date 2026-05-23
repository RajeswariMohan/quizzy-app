import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { AI_QUESTION_GENERATION_QUEUE } from '../queue/queue.constants';
import { AiGenerationService } from './ai-generation.service';
import { AiGenerationJobData } from './interfaces/ai-generation-job.interface';

@Processor(AI_QUESTION_GENERATION_QUEUE)
export class AiGenerationProcessor extends WorkerHost {
  private readonly logger = new Logger(AiGenerationProcessor.name);

  constructor(private readonly aiGenerationService: AiGenerationService) {
    super();
  }

  async process(job: Job<AiGenerationJobData>): Promise<void> {
    this.logger.log(`Processing AI generation job ${job.id} for task ${job.data.taskId}`);
    await this.aiGenerationService.processJob(job.data);
  }
}
