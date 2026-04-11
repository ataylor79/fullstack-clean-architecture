export interface Exercise {
  id: string;
  name: string;
  muscleGroup: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateExerciseDto = Pick<Exercise, "name" | "muscleGroup" | "notes">;
export type UpdateExerciseDto = Partial<CreateExerciseDto>;
