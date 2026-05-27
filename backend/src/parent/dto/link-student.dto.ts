import { IsEmail } from 'class-validator';

export class LinkStudentDto {
  @IsEmail()
  studentEmail: string;
}
