import type {
  WorkoutExercise,
  WorkoutSection,
} from "@domain/entities/WorkoutExercise";

export interface WorkoutExerciseEntry {
  workoutId: string;
  exerciseId: string;
  section: WorkoutSection;
  orderIndex: number;
}

export interface IWorkoutExerciseRepository {
  createMany(entries: WorkoutExerciseEntry[]): Promise<WorkoutExercise[]>;
  findByWorkoutId(workoutId: string): Promise<WorkoutExercise[]>;
  replaceForWorkout(
    workoutId: string,
    entries: {
      exerciseId: string;
      section: WorkoutSection;
      orderIndex: number;
    }[],
  ): Promise<WorkoutExercise[]>;
}
