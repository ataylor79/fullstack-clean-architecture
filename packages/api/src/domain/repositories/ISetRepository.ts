import type { ExerciseCategory } from "@domain/entities/Exercise";
import type { WorkoutSet } from "@domain/entities/Set";

export type WorkoutSetWithExercise = WorkoutSet & {
  exercise: {
    name: string;
    muscleGroup: string | null;
    exerciseCategory: ExerciseCategory;
  };
};

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
      Omit<WorkoutSet, "id" | "workoutId" | "setType" | "createdAt" | "updatedAt">
    >,
  ): Promise<WorkoutSet | null>;
  delete(id: string, workoutId: string): Promise<boolean>;
}
