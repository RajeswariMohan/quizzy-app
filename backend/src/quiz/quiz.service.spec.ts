import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Class } from '@database/entities/class.entity';
import { Quiz } from '@database/entities/quiz.entity';
import { QuizStatus } from '@database/enums/quiz-status.enum';
import { buildTeacherTenant } from '../../test/helpers/tenant-fixtures';
import { SCHOOL_ID, TEST_CLASS_ID } from '../../test/helpers/constants';
import { TenantContextService } from '../auth/services/tenant-context.service';
import { QuizService } from './quiz.service';

describe('QuizService', () => {
  let service: QuizService;
  let quizSave: jest.Mock;
  let classFindOne: jest.Mock;
  let quizFindOne: jest.Mock;

  beforeEach(async () => {
    quizSave = jest.fn((entity) => Promise.resolve({ id: 'new-quiz-id', ...entity }));
    classFindOne = jest.fn();
    quizFindOne = jest.fn();

    const module = await Test.createTestingModule({
      providers: [
        QuizService,
        {
          provide: getRepositoryToken(Quiz),
          useValue: {
            create: jest.fn((data) => data),
            save: quizSave,
            findOne: quizFindOne,
          },
        },
        {
          provide: getRepositoryToken(Class),
          useValue: { findOne: classFindOne },
        },
        {
          provide: TenantContextService,
          useValue: {
            resolveSchoolIdForQuery: jest.fn(() => SCHOOL_ID),
          },
        },
      ],
    }).compile();

    service = module.get(QuizService);
  });

  it('creates a draft quiz scoped to tenant school_id', async () => {
    classFindOne.mockResolvedValue({ id: TEST_CLASS_ID, schoolId: SCHOOL_ID });

    const tenant = buildTeacherTenant();
    const result = await service.create(tenant, {
      classId: TEST_CLASS_ID,
      title: 'Unit Test Quiz',
    });

    expect(quizSave).toHaveBeenCalled();
    expect(result.schoolId).toBe(SCHOOL_ID);
    expect(result.status).toBe(QuizStatus.DRAFT);
    expect(result.createdByUserId).toBe(tenant.userId);
  });

  it('throws when class is not in tenant', async () => {
    classFindOne.mockResolvedValue(null);

    await expect(
      service.create(buildTeacherTenant(), {
        classId: '00000000-0000-0000-0000-000000000000',
        title: 'Missing Class',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('findOne scopes query by school_id', async () => {
    quizFindOne.mockResolvedValue({
      id: 'quiz-1',
      schoolId: SCHOOL_ID,
      questions: [],
    });

    const quiz = await service.findOne(buildTeacherTenant(), 'quiz-1');
    expect(quizFindOne).toHaveBeenCalledWith({
      where: { id: 'quiz-1', schoolId: SCHOOL_ID },
      relations: ['questions'],
    });
    expect(quiz.id).toBe('quiz-1');
  });

  it('findOne throws NotFoundException when quiz missing in tenant', async () => {
    quizFindOne.mockResolvedValue(null);
    await expect(service.findOne(buildTeacherTenant(), 'missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
