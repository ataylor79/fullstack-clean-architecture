import type { TemplateSection } from "@domain/entities/TemplateExercise";

export type WorkoutSection = TemplateSection;

export interface WorkoutExercise {
  id: string;
  workoutId: string;
  exerciseId: string;
  section: WorkoutSection;
  orderIndex: number;
  createdAt: Date;
}
