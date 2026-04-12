import { WorkoutDifficulty, WorkoutType } from "@domain/entities/Workout";
import type { IWorkoutRepository } from "@domain/repositories/IWorkoutRepository";
import { NotFoundError, ValidationError } from "@presentation/errors";

export interface UpdateWorkoutInput {
  name?: string;
  scheduledAt?: Date;
  completedAt?: Date | null;
  durationMinutes?: number;
  difficulty?: WorkoutDifficulty;
  type?: WorkoutType;
}

export async function updateWorkout(
  workoutRepo: IWorkoutRepository,
  id: string,
  userId: string,
  input: UpdateWorkoutInput,
) {
  if (input.completedAt != null) {
    const workout = await workoutRepo.findById(id, userId);
    if (!workout) throw new NotFoundError("Workout not found");

    const effectiveScheduledAt = input.scheduledAt ?? workout.scheduledAt;
    if (input.completedAt < effectiveScheduledAt) {
      throw new ValidationError("completedAt cannot be before scheduledAt");
    }
  }

  return workoutRepo.update(id, userId, input);
}
