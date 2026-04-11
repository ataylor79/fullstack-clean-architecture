import type { ISetRepository } from "@domain/repositories/ISetRepository";
import type { IWorkoutRepository } from "@domain/repositories/IWorkoutRepository";
import { NotFoundError } from "@presentation/errors";

export async function deleteSet(
  workoutRepo: IWorkoutRepository,
  setRepo: ISetRepository,
  workoutId: string,
  setId: string,
  userId: string,
) {
  const workout = await workoutRepo.findById(workoutId, userId);
  if (!workout) throw new NotFoundError("Workout not found");

  const deleted = await setRepo.delete(setId, workoutId);
  if (!deleted) throw new NotFoundError("Set not found");
}
