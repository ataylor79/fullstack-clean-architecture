import type { IExerciseRepository } from "@domain/repositories/IExerciseRepository";
import type { ISetRepository } from "@domain/repositories/ISetRepository";
import type { IWorkoutRepository } from "@domain/repositories/IWorkoutRepository";
import { ConflictError, NotFoundError } from "@presentation/errors";

export interface CreateSetInput {
  exerciseId: string;
  setNumber: number;
  reps: number;
  weightKg: number;
  notes?: string;
}

// PG unique violation error code
const PG_UNIQUE_VIOLATION = "23505";

export async function createSet(
  workoutRepo: IWorkoutRepository,
  setRepo: ISetRepository,
  exerciseRepo: IExerciseRepository,
  workoutId: string,
  userId: string,
  input: CreateSetInput,
) {
  const workout = await workoutRepo.findById(workoutId, userId);
  if (!workout) throw new NotFoundError("Workout not found");

  const exercise = await exerciseRepo.findById(input.exerciseId);
  if (!exercise) throw new NotFoundError("Exercise not found");

  try {
    return await setRepo.create({
      workoutId,
      exerciseId: input.exerciseId,
      setNumber: input.setNumber,
      reps: input.reps,
      weightKg: input.weightKg,
      notes: input.notes ?? null,
    });
  } catch (err: unknown) {
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code?: string }).code === PG_UNIQUE_VIOLATION
    ) {
      throw new ConflictError("Set number already exists in this workout");
    }
    throw err;
  }
}
