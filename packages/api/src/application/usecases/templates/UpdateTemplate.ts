import type { WorkoutDifficulty, WorkoutType } from "@domain/entities/Workout";
import type { IWorkoutTemplateRepository } from "@domain/repositories/IWorkoutTemplateRepository";
import { NotFoundError } from "@presentation/errors";

export interface UpdateTemplateInput {
  name?: string;
  difficulty?: WorkoutDifficulty;
  type?: WorkoutType;
}

export async function updateTemplate(
  templateRepo: IWorkoutTemplateRepository,
  id: string,
  userId: string,
  input: UpdateTemplateInput,
) {
  const updated = await templateRepo.update(id, userId, input);
  if (!updated) throw new NotFoundError("Template not found");
  return updated;
}
