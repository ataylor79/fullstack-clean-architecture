export enum ExerciseCategory {
  STRENGTH = "strength",
  CARDIO = "cardio",
  FLEXIBILITY = "flexibility",
}

export interface Exercise {
  id: string;
  name: string;
  exerciseCategory: ExerciseCategory;
  muscleGroup: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}
