export interface Workout {
  id: string;
  userId: string;
  planId: string | null;
  name: string;
  durationMinutes: number | null;
  difficulty: WorkoutDifficulty;
  type: WorkoutType;
  scheduledAt: Date;
  completedAt: Date | null;
  rating: number | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export enum WorkoutDifficulty {
  BEGINNER = "beginner",
  INTERMEDIATE = "intermediate",
  ADVANCED = "advanced",
  ELITE = "elite",
}

export enum WorkoutType {
  STRENGTH = "strength",
  CARDIO = "cardio",
  HIIT = "hiit",
  YOGA = "yoga",
  PILATES = "pilates",
  MOBILITY = "mobility",
  HYBRID = "hybrid",
}
