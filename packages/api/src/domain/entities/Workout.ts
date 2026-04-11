export interface Workout {
  id: string;
  userId: string;
  name: string;
  scheduledAt: Date;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
