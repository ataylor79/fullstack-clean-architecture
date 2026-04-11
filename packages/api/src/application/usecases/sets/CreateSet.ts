import type { IWorkoutRepository } from "../../../domain/repositories/IWorkoutRepository";
import type { ISetRepository } from "../../../domain/repositories/ISetRepository";
import { NotFoundError } from "../../../presentation/errors";

export interface CreateSetInput {
  exerciseId: string;
  setNumber: number;
  reps: number;
  weightKg: number;
  notes?: string;
}

export async function createSet(
  workoutRepo: IWorkoutRepository,
  setRepo: ISetRepository,
  workoutId: string,
  userId: string,
  input: CreateSetInput
) {
  const workout = await workoutRepo.findById(workoutId, userId);
  if (!workout) throw new NotFoundError("Workout not found");

  return setRepo.create({
    workoutId,
    exerciseId: input.exerciseId,
    setNumber: input.setNumber,
    reps: input.reps,
    weightKg: input.weightKg,
    notes: input.notes ?? null,
  });
}
