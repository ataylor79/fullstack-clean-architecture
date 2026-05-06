import type { IExerciseRepository } from "@domain/repositories/IExerciseRepository";
import type { ISetRepository } from "@domain/repositories/ISetRepository";
import type { IWorkoutRepository } from "@domain/repositories/IWorkoutRepository";
import type { TypedUpdateSetInput } from "@domain/services/setTypeStrategy";
import { allowedExerciseCategoriesForSetType } from "@domain/services/setTypeStrategy";
import { NotFoundError, ValidationError } from "@presentation/errors";

export async function updateSet(
  workoutRepo: IWorkoutRepository,
  setRepo: ISetRepository,
  exerciseRepo: IExerciseRepository,
  workoutId: string,
  setId: string,
  userId: string,
  input: TypedUpdateSetInput,
) {
  const workout = await workoutRepo.findById(workoutId, userId);
  if (!workout) throw new NotFoundError("Workout not found");

  const existing = await setRepo.findById(setId, workoutId);
  if (!existing) throw new NotFoundError("Set not found");

  if (existing.setType !== input.setType) {
    throw new ValidationError(
      `Set type is "${existing.setType}" and cannot be updated as "${input.setType}"`,
    );
  }

  if ("exerciseId" in input && input.exerciseId !== undefined) {
    const exercise = await exerciseRepo.findById(input.exerciseId as string);
    if (!exercise) throw new NotFoundError("Exercise not found");
    const allowedCategories = allowedExerciseCategoriesForSetType(
      existing.setType,
    );
    if (!allowedCategories.has(exercise.exerciseCategory)) {
      throw new ValidationError(
        `Exercise category "${exercise.exerciseCategory}" is not allowed for set type "${existing.setType}"`,
      );
    }
  }

  const { setType: _, ...updateData } = input;
  const updated = await setRepo.update(setId, workoutId, updateData);
  if (!updated) throw new NotFoundError("Set not found");

  return updated;
}
