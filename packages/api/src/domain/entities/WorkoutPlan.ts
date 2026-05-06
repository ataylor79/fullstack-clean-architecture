export type DayOfWeek =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export interface WorkoutPlan {
  id: string;
  userId: string;
  templateId: string;
  daysOfWeek: DayOfWeek[];
  numWeeks: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
