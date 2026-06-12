import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { getQueueToken } from '@nestjs/bullmq';
import { AiGenerationTask } from '@database/entities/ai-generation-task.entity';
import { Question } from '@database/entities/question.entity';
import { Quiz } from '@database/entities/quiz.entity';
import { AiGenerationStatus } from '@database/enums/ai-generation-status.enum';
import { buildTeacherTenant } from '../../test/helpers/tenant-fixtures';
import { SCHOOL_ID, TEACHER_ID, TEST_QUIZ_ID } from '../../test/helpers/constants';
import { TenantContextService } from '../auth/services/tenant-context.service';
import { SchoolFeatureService } from '../school/school-feature.service';
import { MockLlmService } from '../llm/mock-llm.service';
import { AI_QUESTION_GENERATION_QUEUE } from '../queue/queue.constants';
import { AiGenerationService } from './ai-generation.service';

describe('AiGenerationService', () => {
  let service: AiGenerationService;
  let taskSave: jest.Mock;
  let taskFindOne: jest.Mock;
  let queueAdd: jest.Mock;
  let quizFindOne: jest.Mock;

  beforeEach(async () => {
    taskSave = jest
      .fn()
      .mockImplementationOnce((task) => Promise.resolve({ id: 'task-uuid-1', ...task }))
      .mockImplementation((task) => Promise.resolve(task));
    taskFindOne = jest.fn();
    queueAdd = jest.fn().mockResolvedValue({ id: 'bull-job-1' });
    quizFindOne = jest.fn().mockResolvedValue({
      id: TEST_QUIZ_ID,
      schoolId: SCHOOL_ID,
      createdByUserId: TEACHER_ID,
    });

    const module = await Test.createTestingModule({
      providers: [
        AiGenerationService,
        {
          provide: getRepositoryToken(AiGenerationTask),
          useValue: {
            create: jest.fn((data) => data),
            save: taskSave,
            findOne: taskFindOne,
            update: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Quiz),
          useValue: { findOne: quizFindOne },
        },
        {
          provide: getRepositoryToken(Question),
          useValue: {
            count: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getQueueToken(AI_QUESTION_GENERATION_QUEUE),
          useValue: { add: queueAdd },
        },
        {
          provide: TenantContextService,
          useValue: { resolveSchoolIdForQuery: jest.fn(() => SCHOOL_ID) },
        },
        {
          provide: SchoolFeatureService,
          useValue: { assertFeature: jest.fn().mockResolvedValue(undefined) },
        },
        MockLlmService,
      ],
    }).compile();

    service = module.get(AiGenerationService);
  });

  it('enqueueGeneration creates PENDING task and BullMQ job', async () => {
    const result = await service.enqueueGeneration(buildTeacherTenant(), TEST_QUIZ_ID, {
      prompt: 'Generate plant biology MCQs',
      count: 10,
      subject: 'Biology',
    });

    expect(result.taskId).toBe('task-uuid-1');
    expect(result.status).toBe(AiGenerationStatus.PENDING);
    expect(queueAdd).toHaveBeenCalledWith(
      'generate-questions',
      expect.objectContaining({
        taskId: 'task-uuid-1',
        schoolId: SCHOOL_ID,
        quizId: TEST_QUIZ_ID,
      }),
      expect.objectContaining({ jobId: 'task-uuid-1' }),
    );
  });

  it('getTask returns task scoped by school_id', async () => {
    taskFindOne.mockResolvedValue({
      id: 'task-uuid-1',
      schoolId: SCHOOL_ID,
      status: AiGenerationStatus.COMPLETED,
    });

    const task = await service.getTask(buildTeacherTenant(), 'task-uuid-1');
    expect(taskFindOne).toHaveBeenCalledWith({
      where: { id: 'task-uuid-1', schoolId: SCHOOL_ID },
    });
    expect(task.status).toBe(AiGenerationStatus.COMPLETED);
  });

  it('getTask throws when task not in tenant', async () => {
    taskFindOne.mockResolvedValue(null);
    await expect(service.getTask(buildTeacherTenant(), 'missing-task')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
