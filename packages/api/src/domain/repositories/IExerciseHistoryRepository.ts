import type { ExerciseHistoryEntry } from "@workout-app/shared";

export interface IExerciseHistoryRepository {
  findByExerciseAndUser(
    exerciseId: string,
    userId: string,
    limit: number,
  ): Promise<ExerciseHistoryEntry[]>;
}
