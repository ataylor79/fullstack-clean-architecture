export interface Workout {
  id: string;
  userId: string;
  name: string;
  durationMinutes: number;
  difficulty: WorkoutDifficulty;
  type: WorkoutType;
  scheduledAt: Date;
  completedAt: Date | null;
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