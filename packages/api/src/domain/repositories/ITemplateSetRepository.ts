import type { TemplateSet } from "@domain/entities/TemplateSet";

export interface ITemplateSetRepository {
  findAllByTemplateId(templateId: string): Promise<TemplateSet[]>;
  findById(id: string, templateExerciseId: string): Promise<TemplateSet | null>;
  create(
    data: Omit<TemplateSet, "id" | "createdAt" | "updatedAt">,
  ): Promise<TemplateSet>;
  update(
    id: string,
    templateExerciseId: string,
    data: Partial<
      Omit<
        TemplateSet,
        "id" | "templateExerciseId" | "setType" | "createdAt" | "updatedAt"
      >
    >,
  ): Promise<TemplateSet | null>;
  delete(id: string, templateExerciseId: string): Promise<boolean>;
  existsByTemplateExerciseId(templateExerciseId: string): Promise<boolean>;
}
