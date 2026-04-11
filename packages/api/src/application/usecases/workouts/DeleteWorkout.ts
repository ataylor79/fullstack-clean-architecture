import type { IWorkoutRepository } from "../../../domain/repositories/IWorkoutRepository";

export async function deleteWorkout(workoutRepo: IWorkoutRepository, id: string) {
  return workoutRepo.delete(id);
}
