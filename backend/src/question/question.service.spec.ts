import { BadRequestException, NotFoundException } from '@nestjs/common';
import { QuizStatus } from '@database/enums/quiz-status.enum';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Question } from '@database/entities/question.entity';
import { Quiz } from '@database/entities/quiz.entity';
import { QuestionSourceType } from '@database/enums/question-source-type.enum';
import { buildTeacherTenant } from '../../test/helpers/tenant-fixtures';
import { SCHOOL_ID, TEST_QUIZ_ID } from '../../test/helpers/constants';
import { TenantContextService } from '../auth/services/tenant-context.service';
import { QuestionService } from './question.service';

describe('QuestionService', () => {
  let service: QuestionService;
  let questionSave: jest.Mock;
  let questionCount: jest.Mock;
  let questionFind: jest.Mock;
  let questionFindOne: jest.Mock;
  let quizFindOne: jest.Mock;

  beforeEach(async () => {
    questionSave = jest.fn((entity) => Promise.resolve({ id: 'q-new', ...entity }));
    questionCount = jest.fn().mockResolvedValue(2);
    questionFind = jest.fn().mockResolvedValue([]);
    questionFindOne = jest.fn().mockResolvedValue({
      id: 'q-existing',
      schoolId: SCHOOL_ID,
      quizId: TEST_QUIZ_ID,
      questionText: 'Old?',
      options: ['A', 'B', 'C', 'D'],
      correctOptionIndex: 0,
    });
    quizFindOne = jest.fn().mockResolvedValue({
      id: TEST_QUIZ_ID,
      schoolId: SCHOOL_ID,
      status: QuizStatus.DRAFT,
    });

    const module = await Test.createTestingModule({
      providers: [
        QuestionService,
        {
          provide: getRepositoryToken(Question),
          useValue: {
            create: jest.fn((data) => data),
            save: questionSave,
            count: questionCount,
            find: questionFind,
            findOne: questionFindOne,
          },
        },
        {
          provide: getRepositoryToken(Quiz),
          useValue: { findOne: quizFindOne },
        },
        {
          provide: TenantContextService,
          useValue: { resolveSchoolIdForQuery: jest.fn(() => SCHOOL_ID) },
        },
        {
          provide: DataSource,
          useValue: {
            transaction: jest.fn((cb) => cb({})),
          },
        },
      ],
    }).compile();

    service = module.get(QuestionService);
  });

  it('creates a manual question with MANUAL source type', async () => {
    const question = await service.createManual(buildTeacherTenant(), TEST_QUIZ_ID, {
      questionText: 'Sample?',
      options: ['A', 'B', 'C', 'D'],
      correctOptionIndex: 1,
      explanation: 'Because B.',
    });

    expect(questionSave).toHaveBeenCalled();
    expect(question.sourceType).toBe(QuestionSourceType.MANUAL);
    expect(question.schoolId).toBe(SCHOOL_ID);
    expect(question.orderIndex).toBe(2);
  });

  it('rejects manual question when quiz not in tenant', async () => {
    quizFindOne.mockResolvedValue(null);

    await expect(
      service.createManual(buildTeacherTenant(), TEST_QUIZ_ID, {
        questionText: 'X?',
        options: ['A', 'B', 'C', 'D'],
        correctOptionIndex: 0,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('bulk creates manual questions with sequential order', async () => {
    const result = await service.bulkCreateManual(buildTeacherTenant(), TEST_QUIZ_ID, [
      {
        questionText: 'Q1?',
        options: ['A', 'B', 'C', 'D'],
        correctOptionIndex: 0,
      },
      {
        questionText: 'Q2?',
        options: ['A', 'B', 'C', 'D'],
        correctOptionIndex: 1,
      },
    ]);

    expect(result.importedCount).toBe(2);
    expect(questionSave).toHaveBeenCalledTimes(2);
  });

  it('updates question fields on draft quiz', async () => {
    const updated = await service.update(
      buildTeacherTenant(),
      TEST_QUIZ_ID,
      'q-existing',
      {
        questionText: 'New text?',
        options: ['1', '2', '3', '4'],
        correctOptionIndex: 2,
        explanation: 'Because 3.',
      },
    );

    expect(questionSave).toHaveBeenCalled();
    expect(updated.questionText).toBe('New text?');
    expect(updated.correctOptionIndex).toBe(2);
  });

  it('rejects update when quiz is published', async () => {
    quizFindOne.mockResolvedValue({
      id: TEST_QUIZ_ID,
      schoolId: SCHOOL_ID,
      status: QuizStatus.PUBLISHED,
    });

    await expect(
      service.update(buildTeacherTenant(), TEST_QUIZ_ID, 'q-existing', {
        questionText: 'X?',
        options: ['A', 'B', 'C', 'D'],
        correctOptionIndex: 0,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('lists questions filtered by school_id and quiz_id', async () => {
    await service.listByQuiz(buildTeacherTenant(), TEST_QUIZ_ID);

    expect(questionFind).toHaveBeenCalledWith({
      where: { schoolId: SCHOOL_ID, quizId: TEST_QUIZ_ID },
      order: { orderIndex: 'ASC' },
    });
  });
});
