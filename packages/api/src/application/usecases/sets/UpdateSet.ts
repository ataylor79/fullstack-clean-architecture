import type { ISetRepository } from "@domain/repositories/ISetRepository";
import type { IWorkoutRepository } from "@domain/repositories/IWorkoutRepository";
import { NotFoundError } from "@presentation/errors";

export interface UpdateSetInput {
  exerciseId?: string;
  setNumber?: number;
  reps?: number;
  weightKg?: number;
  notes?: string | null;
}

export async function updateSet(
  workoutRepo: IWorkoutRepository,
  setRepo: ISetRepository,
  workoutId: string,
  setId: string,
  userId: string,
  input: UpdateSetInput,
) {
  const workout = await workoutRepo.findById(workoutId, userId);
  if (!workout) throw new NotFoundError("Workout not found");

  const updated = await setRepo.update(setId, workoutId, input);
  if (!updated) throw new NotFoundError("Set not found");

  return updated;
}
