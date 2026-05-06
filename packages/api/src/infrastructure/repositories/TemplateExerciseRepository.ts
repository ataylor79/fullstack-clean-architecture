import type {
  TemplateExercise,
  TemplateSection,
} from "@domain/entities/TemplateExercise";
import type { ITemplateExerciseRepository } from "@domain/repositories/ITemplateExerciseRepository";
import { db } from "@infrastructure/database/db";

interface TemplateExerciseRow {
  id: string;
  template_id: string;
  exercise_id: string;
  section: TemplateSection;
  order_index: number;
  created_at: Date;
}

function toEntity(row: TemplateExerciseRow): TemplateExercise {
  return {
    id: row.id,
    templateId: row.template_id,
    exerciseId: row.exercise_id,
    section: row.section,
    orderIndex: row.order_index,
    createdAt: row.created_at,
  };
}

export function createTemplateExerciseRepository(): ITemplateExerciseRepository {
  return {
    async findByTemplateId(templateId) {
      const rows = await db<TemplateExerciseRow>("template_exercises")
        .where({ template_id: templateId })
        .orderByRaw(
          `CASE section WHEN 'main' THEN 0 WHEN 'warmup' THEN 1 WHEN 'cooldown' THEN 2 END, order_index ASC`,
        );
      return rows.map(toEntity);
    },

    async findById(id) {
      const row = await db<TemplateExerciseRow>("template_exercises")
        .where({ id })
        .first();
      return row ? toEntity(row) : null;
    },

    async create(data) {
      const [row] = await db<TemplateExerciseRow>("template_exercises")
        .insert({
          template_id: data.templateId,
          exercise_id: data.exerciseId,
          section: data.section,
          order_index: data.orderIndex,
        })
        .returning("*");
      return toEntity(row);
    },

    async delete(id) {
      const count = await db("template_exercises").where({ id }).delete();
      return count > 0;
    },

    async maxOrderIndexInSection(templateId, section) {
      const row = (await db("template_exercises")
        .where({ template_id: templateId, section })
        .max("order_index as max")
        .first()) as { max: string | null } | undefined;
      return row?.max != null ? Number(row.max) : 0;
    },
  };
}
