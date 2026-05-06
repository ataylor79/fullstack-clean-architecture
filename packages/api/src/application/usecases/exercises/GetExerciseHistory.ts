import type { IExerciseRepository } from "@domain/repositories/IExerciseRepository";
import type { IExerciseHistoryRepository } from "@domain/repositories/IExerciseHistoryRepository";
import { NotFoundError } from "@presentation/errors";
import type { ExerciseHistoryResponse } from "@workout-app/shared";

export async function getExerciseHistory(
  exerciseRepo: IExerciseRepository,
  historyRepo: IExerciseHistoryRepository,
  exerciseId: string,
  userId: string,
  limit: number,
): Promise<ExerciseHistoryResponse> {
  const exercise = await exerciseRepo.findById(exerciseId);
  if (!exercise) throw new NotFoundError("Exercise not found");

  const entries = await historyRepo.findByExerciseAndUser(
    exerciseId,
    userId,
    limit,
  );

  return { exercise, entries };
}
