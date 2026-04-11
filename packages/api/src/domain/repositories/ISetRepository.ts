import type { WorkoutSet } from "@domain/entities/Set";

export interface WorkoutSetWithExercise extends WorkoutSet {
  exercise: {
    name: string;
    muscleGroup: string;
  };
}

export interface ISetRepository {
  findByWorkoutId(workoutId: string): Promise<WorkoutSetWithExercise[]>;
  findById(id: string, workoutId: string): Promise<WorkoutSet | null>;
  create(
    data: Omit<WorkoutSet, "id" | "createdAt" | "updatedAt">,
  ): Promise<WorkoutSet>;
  update(
    id: string,
    workoutId: string,
    data: Partial<
      Omit<WorkoutSet, "id" | "workoutId" | "createdAt" | "updatedAt">
    >,
  ): Promise<WorkoutSet | null>;
  delete(id: string, workoutId: string): Promise<boolean>;
}
