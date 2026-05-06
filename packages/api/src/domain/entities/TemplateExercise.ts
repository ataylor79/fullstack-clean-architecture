export type TemplateSection = "main" | "warmup" | "cooldown";

export interface TemplateExercise {
  id: string;
  templateId: string;
  exerciseId: string;
  section: TemplateSection;
  orderIndex: number;
  createdAt: Date;
}
