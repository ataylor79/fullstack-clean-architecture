import type { TemplateSet } from "@domain/entities/TemplateSet";
import type { IExerciseRepository } from "@domain/repositories/IExerciseRepository";
import type { ITemplateExerciseRepository } from "@domain/repositories/ITemplateExerciseRepository";
import type { ITemplateSetRepository } from "@domain/repositories/ITemplateSetRepository";
import type { IWorkoutPlanRepository } from "@domain/repositories/IWorkoutPlanRepository";
import type { IWorkoutTemplateRepository } from "@domain/repositories/IWorkoutTemplateRepository";
import {
  allowedExerciseCategoriesForSetType,
  allowedSetTypesForWorkout,
} from "@domain/services/setTypeStrategy";
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from "@presentation/errors";

// Template sets don't carry exerciseId in the input — the exercise is already
// determined by the parent template exercise.
type TemplateStrengthSetInput = {
  setType: "strength";
  reps: number;
  weightKg: number;
  restSeconds?: number;
};
type TemplateCardioSetInput = {
  setType: "cardio";
  distanceMeters?: number;
  durationSeconds: number;
  intensityLevel: number;
};
type TemplateHiitSetInput = {
  setType: "hiit";
  durationSeconds: number;
  restSeconds?: number;
};
type TemplateMindBodySetInput = {
  setType: "yoga" | "pilates" | "mobility";
  durationSeconds?: number;
  reps?: number;
};
type TemplateTypedSetInput =
  | TemplateStrengthSetInput
  | TemplateCardioSetInput
  | TemplateHiitSetInput
  | TemplateMindBodySetInput;

const PG_UNIQUE_VIOLATION = "23505";

type CreateTemplateSetData =
  | Omit<
      Extract<TemplateSet, { setType: "strength" }>,
      "id" | "createdAt" | "updatedAt"
    >
  | Omit<
      Extract<TemplateSet, { setType: "cardio" }>,
      "id" | "createdAt" | "updatedAt"
    >
  | Omit<
      Extract<TemplateSet, { setType: "hiit" }>,
      "id" | "createdAt" | "updatedAt"
    >
  | Omit<
      Extract<TemplateSet, { setType: "yoga" | "pilates" | "mobility" }>,
      "id" | "createdAt" | "updatedAt"
    >;

type BaseData = {
  templateExerciseId: string;
  setNumber: number;
  notes: string | null;
};

type BuilderMap = {
  [K in TemplateTypedSetInput["setType"]]: (
    base: BaseData,
    input: Extract<TemplateTypedSetInput, { setType: K }>,
  ) => CreateTemplateSetData;
};

const mindBodyBuilder =
  (setType: "yoga" | "pilates" | "mobility") =>
  (base: BaseData, input: TemplateMindBodySetInput): CreateTemplateSetData => ({
    ...base,
    setType,
    durationSeconds: input.durationSeconds ?? null,
    reps: input.reps ?? null,
  });

const SET_TYPE_RULES: BuilderMap = {
  strength: (base, input) => ({
    ...base,
    setType: "strength",
    reps: input.reps,
    weightKg: input.weightKg,
    restSeconds: input.restSeconds ?? null,
  }),
  cardio: (base, input) => ({
    ...base,
    setType: "cardio",
    distanceMeters: input.distanceMeters ?? null,
    durationSeconds: input.durationSeconds,
    intensityLevel: input.intensityLevel,
  }),
  hiit: (base, input) => ({
    ...base,
    setType: "hiit",
    durationSeconds: input.durationSeconds,
    restSeconds: input.restSeconds ?? null,
  }),
  yoga: mindBodyBuilder("yoga"),
  pilates: mindBodyBuilder("pilates"),
  mobility: mindBodyBuilder("mobility"),
};

export async function addTemplateSet(
  templateRepo: IWorkoutTemplateRepository,
  templateExerciseRepo: ITemplateExerciseRepository,
  templateSetRepo: ITemplateSetRepository,
  exerciseRepo: IExerciseRepository,
  planRepo: IWorkoutPlanRepository,
  templateId: string,
  templateExerciseId: string,
  userId: string,
  input: { setNumber: number; notes?: string } & TemplateTypedSetInput,
) {
  const template = await templateRepo.findById(templateId, userId);
  if (!template) throw new NotFoundError("Template not found");

  const inUse = await planRepo.existsByTemplateId(templateId);
  if (inUse)
    throw new ConflictError(
      "Cannot modify sets on a template that is in use by a plan",
    );

  const templateExercise =
    await templateExerciseRepo.findById(templateExerciseId);
  if (!templateExercise || templateExercise.templateId !== templateId)
    throw new NotFoundError("Template exercise not found");

  const allowed = allowedSetTypesForWorkout(template.type);
  if (!allowed.has(input.setType)) {
    throw new ValidationError(
      `Template type "${template.type}" does not allow set type "${input.setType}"`,
    );
  }

  const exercise = await exerciseRepo.findById(templateExercise.exerciseId);
  if (!exercise) throw new NotFoundError("Exercise not found");

  const allowedCategories = allowedExerciseCategoriesForSetType(input.setType);
  if (!allowedCategories.has(exercise.exerciseCategory)) {
    throw new ValidationError(
      `Exercise category "${exercise.exerciseCategory}" is not allowed for set type "${input.setType}"`,
    );
  }

  const base = {
    templateExerciseId,
    setNumber: input.setNumber,
    notes: input.notes ?? null,
  };
  const data = (
    SET_TYPE_RULES[input.setType] as (
      base: BaseData,
      input: TemplateTypedSetInput,
    ) => CreateTemplateSetData
  )(base, input);

  try {
    return await templateSetRepo.create(
      data as Omit<TemplateSet, "id" | "createdAt" | "updatedAt">,
    );
  } catch (err: unknown) {
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code?: string }).code === PG_UNIQUE_VIOLATION
    ) {
      throw new ConflictError(
        "Set number already exists for this exercise in this template",
      );
    }
    throw err;
  }
}
