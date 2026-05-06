interface BaseTemplateSet {
  id: string;
  templateExerciseId: string;
  setNumber: number;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface StrengthTemplateSet extends BaseTemplateSet {
  setType: "strength";
  reps: number;
  weightKg: number;
  restSeconds: number | null;
}

export interface CardioTemplateSet extends BaseTemplateSet {
  setType: "cardio";
  distanceMeters: number | null;
  durationSeconds: number;
  intensityLevel: number;
}

export interface HiitTemplateSet extends BaseTemplateSet {
  setType: "hiit";
  durationSeconds: number;
  restSeconds: number | null;
}

export interface MindBodyTemplateSet extends BaseTemplateSet {
  setType: "yoga" | "pilates" | "mobility";
  durationSeconds: number | null;
  reps: number | null;
}

export type TemplateSet =
  | StrengthTemplateSet
  | CardioTemplateSet
  | HiitTemplateSet
  | MindBodyTemplateSet;
