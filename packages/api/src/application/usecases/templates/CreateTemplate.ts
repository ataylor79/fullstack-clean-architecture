import type { WorkoutDifficulty, WorkoutType } from "@domain/entities/Workout";
import type { IWorkoutTemplateRepository } from "@domain/repositories/IWorkoutTemplateRepository";

export interface CreateTemplateInput {
  name: string;
  difficulty: WorkoutDifficulty;
  type: WorkoutType;
}

export async function createTemplate(
  templateRepo: IWorkoutTemplateRepository,
  userId: string,
  input: CreateTemplateInput,
) {
  return templateRepo.create({ ...input, userId });
}
