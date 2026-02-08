import { IsIn } from 'class-validator';

export class UpdateTaskStatusDto {
  @IsIn(['todo', 'in_progress', 'done', 'canceled'])
  status!: 'todo' | 'in_progress' | 'done' | 'canceled';
}
