import type { SetType } from "@domain/entities/Set";
import type { TemplateSet } from "@domain/entities/TemplateSet";
import type { ITemplateSetRepository } from "@domain/repositories/ITemplateSetRepository";
import { db } from "@infrastructure/database/db";

interface TemplateSetRow {
  id: string;
  template_exercise_id: string;
  set_number: number;
  set_type: string;
  details: Record<string, unknown>;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

type BaseEntity = Omit<
  TemplateSet,
  | "setType"
  | "reps"
  | "weightKg"
  | "restSeconds"
  | "distanceMeters"
  | "durationSeconds"
  | "intensityLevel"
>;

type ToEntityMap = {
  [K in SetType]: (
    base: BaseEntity,
    d: Record<string, unknown>,
    setType: K,
  ) => TemplateSet;
};

const TO_ENTITY_RULES: ToEntityMap = {
  strength: (base, d) => ({
    ...base,
    setType: "strength",
    reps: d.reps as number,
    weightKg: d.weightKg as number,
    restSeconds: (d.restSeconds as number | null) ?? null,
  }),
  cardio: (base, d) => ({
    ...base,
    setType: "cardio",
    distanceMeters: (d.distanceMeters as number | null) ?? null,
    durationSeconds: d.durationSeconds as number,
    intensityLevel: d.intensityLevel as number,
  }),
  hiit: (base, d) => ({
    ...base,
    setType: "hiit",
    durationSeconds: d.durationSeconds as number,
    restSeconds: (d.restSeconds as number | null) ?? null,
  }),
  yoga: (base, d, setType) => ({
    ...base,
    setType,
    durationSeconds: (d.durationSeconds as number | null) ?? null,
    reps: (d.reps as number | null) ?? null,
  }),
  pilates: (base, d, setType) => ({
    ...base,
    setType,
    durationSeconds: (d.durationSeconds as number | null) ?? null,
    reps: (d.reps as number | null) ?? null,
  }),
  mobility: (base, d, setType) => ({
    ...base,
    setType,
    durationSeconds: (d.durationSeconds as number | null) ?? null,
    reps: (d.reps as number | null) ?? null,
  }),
};

function toEntity(row: TemplateSetRow): TemplateSet {
  const base = {
    id: row.id,
    templateExerciseId: row.template_exercise_id,
    setNumber: row.set_number,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
  const setType = row.set_type as SetType;
  return (
    TO_ENTITY_RULES[setType] as (
      base: BaseEntity,
      d: Record<string, unknown>,
      setType: SetType,
    ) => TemplateSet
  )(base, row.details, setType);
}

type TemplateSetForType<K extends SetType> = Extract<
  TemplateSet,
  {
    setType: K extends "yoga" | "pilates" | "mobility"
      ? "yoga" | "pilates" | "mobility"
      : K;
  }
>;

type BuildDetailsMap = {
  [K in SetType]: (data: TemplateSetForType<K>) => Record<string, unknown>;
};

const BUILD_DETAILS_RULES: BuildDetailsMap = {
  strength: (data) => ({
    reps: data.reps,
    weightKg: data.weightKg,
    restSeconds: data.restSeconds ?? null,
  }),
  cardio: (data) => ({
    distanceMeters: data.distanceMeters ?? null,
    durationSeconds: data.durationSeconds,
    intensityLevel: data.intensityLevel,
  }),
  hiit: (data) => ({
    durationSeconds: data.durationSeconds,
    restSeconds: data.restSeconds ?? null,
  }),
  yoga: (data) => ({
    durationSeconds: data.durationSeconds ?? null,
    reps: data.reps ?? null,
  }),
  pilates: (data) => ({
    durationSeconds: data.durationSeconds ?? null,
    reps: data.reps ?? null,
  }),
  mobility: (data) => ({
    durationSeconds: data.durationSeconds ?? null,
    reps: data.reps ?? null,
  }),
};

function buildDetails(data: TemplateSet): Record<string, unknown> {
  return (
    BUILD_DETAILS_RULES[data.setType] as (
      data: TemplateSet,
    ) => Record<string, unknown>
  )(data);
}

export function createTemplateSetRepository(): ITemplateSetRepository {
  return {
    async findAllByTemplateId(templateId) {
      const rows = await db<TemplateSetRow>("template_sets")
        .join(
          "template_exercises",
          "template_sets.template_exercise_id",
          "template_exercises.id",
        )
        .where("template_exercises.template_id", templateId)
        .orderBy("template_sets.set_number", "asc")
        .select("template_sets.*");
      return rows.map(toEntity);
    },

    async findById(id, templateExerciseId) {
      const row = await db<TemplateSetRow>("template_sets")
        .where({ id, template_exercise_id: templateExerciseId })
        .first();
      return row ? toEntity(row) : null;
    },

    async create(data) {
      const [row] = await db("template_sets")
        .insert({
          template_exercise_id: data.templateExerciseId,
          set_number: data.setNumber,
          set_type: data.setType,
          details: JSON.stringify(buildDetails(data as TemplateSet)),
          notes: data.notes ?? null,
        })
        .returning("*");
      return toEntity(row as TemplateSetRow);
    },

    async update(id, templateExerciseId, data) {
      const detailsPatch: Record<string, unknown> = {};
      if ("reps" in data && data.reps !== undefined)
        detailsPatch.reps = data.reps;
      if ("weightKg" in data && data.weightKg !== undefined)
        detailsPatch.weightKg = data.weightKg;
      if ("restSeconds" in data && data.restSeconds !== undefined)
        detailsPatch.restSeconds = data.restSeconds;
      if ("distanceMeters" in data && data.distanceMeters !== undefined)
        detailsPatch.distanceMeters = data.distanceMeters;
      if ("durationSeconds" in data && data.durationSeconds !== undefined)
        detailsPatch.durationSeconds = data.durationSeconds;
      if ("intensityLevel" in data && data.intensityLevel !== undefined)
        detailsPatch.intensityLevel = data.intensityLevel;

      const [row] = await db("template_sets")
        .where({ id, template_exercise_id: templateExerciseId })
        .update({
          ...("setNumber" in data &&
            data.setNumber !== undefined && {
              set_number: data.setNumber,
            }),
          ...(Object.keys(detailsPatch).length > 0 && {
            details: db.raw("details || ?::jsonb", [
              JSON.stringify(detailsPatch),
            ]),
          }),
          ...("notes" in data &&
            data.notes !== undefined && { notes: data.notes }),
          updated_at: new Date(),
        })
        .returning("*");
      return row ? toEntity(row as TemplateSetRow) : null;
    },

    async delete(id, templateExerciseId) {
      const count = await db("template_sets")
        .where({ id, template_exercise_id: templateExerciseId })
        .delete();
      return count > 0;
    },

    async existsByTemplateExerciseId(templateExerciseId) {
      const row = await db("template_sets")
        .where({ template_exercise_id: templateExerciseId })
        .first("id");
      return row !== undefined;
    },
  };
}
