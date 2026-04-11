export interface Exercise {
  id: string;
  name: string;
  muscleGroup: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}
