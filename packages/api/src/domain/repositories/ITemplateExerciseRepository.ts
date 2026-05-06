import type {
  TemplateExercise,
  TemplateSection,
} from "@domain/entities/TemplateExercise";

export interface ITemplateExerciseRepository {
  findByTemplateId(templateId: string): Promise<TemplateExercise[]>;
  findById(id: string): Promise<TemplateExercise | null>;
  create(data: {
    templateId: string;
    exerciseId: string;
    section: TemplateSection;
    orderIndex: number;
  }): Promise<TemplateExercise>;
  delete(id: string): Promise<boolean>;
  maxOrderIndexInSection(
    templateId: string,
    section: TemplateSection,
  ): Promise<number>;
}
