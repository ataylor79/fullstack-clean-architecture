import type { IWorkoutRepository } from "../../../domain/repositories/IWorkoutRepository";

export interface UpdateWorkoutInput {
  name?: string;
  scheduledAt?: Date;
  completedAt?: Date | null;
}

export async function updateWorkout(workoutRepo: IWorkoutRepository, id: string, input: UpdateWorkoutInput) {
  return workoutRepo.update(id, input);
}
