import type { WorkoutSet } from "@domain/entities/Set";
import type { IExerciseRepository } from "@domain/repositories/IExerciseRepository";
import type { ISetRepository } from "@domain/repositories/ISetRepository";
import type { IWorkoutExerciseRepository } from "@domain/repositories/IWorkoutExerciseRepository";
import type { IWorkoutRepository } from "@domain/repositories/IWorkoutRepository";
import type {
  MindBodySetInput,
  TypedSetInput,
} from "@domain/services/setTypeStrategy";
import {
  allowedExerciseCategoriesForSetType,
  allowedSetTypesForWorkout,
} from "@domain/services/setTypeStrategy";
import {
  ConflictError,
  NotFoundError,
  UnprocessableEntityError,
  ValidationError,
} from "@presentation/errors";

// PG unique violation error code
const PG_UNIQUE_VIOLATION = "23505";

// `Omit<WorkoutSet, ...>` doesn't preserve union variant fields (because `keyof` on unions collapses),
// so we build the create-data type as an explicit union per `setType`.
type CreateSetData =
  | Omit<
      Extract<WorkoutSet, { setType: "strength" }>,
      "id" | "createdAt" | "updatedAt"
    >
  | Omit<
      Extract<WorkoutSet, { setType: "cardio" }>,
      "id" | "createdAt" | "updatedAt"
    >
  | Omit<
      Extract<WorkoutSet, { setType: "hiit" }>,
      "id" | "createdAt" | "updatedAt"
    >
  | Omit<
      Extract<WorkoutSet, { setType: "yoga" | "pilates" | "mobility" }>,
      "id" | "createdAt" | "updatedAt"
    >;

type BaseData = { workoutId: string; setNumber: number; notes: string | null };

// Mapped type over every setType — TypeScript errors if a key is missing, giving compile-time exhaustiveness.
type BuilderMap = {
  [K in TypedSetInput["setType"]]: (
    base: BaseData,
    input: Extract<TypedSetInput, { setType: K }>,
  ) => CreateSetData;
};

const mindBodyBuilder =
  (setType: "yoga" | "pilates" | "mobility") =>
  (base: BaseData, input: MindBodySetInput): CreateSetData => ({
    ...base,
    setType,
    exerciseId: input.exerciseId,
    durationSeconds: input.durationSeconds ?? null,
    reps: input.reps ?? null,
  });

const SET_TYPE_RULES: BuilderMap = {
  strength: (base, input) => ({
    ...base,
    setType: "strength",
    exerciseId: input.exerciseId,
    reps: input.reps,
    weightKg: input.weightKg,
    restSeconds: input.restSeconds ?? null,
  }),
  cardio: (base, input) => ({
    ...base,
    setType: "cardio",
    exerciseId: input.exerciseId,
    distanceMeters: input.distanceMeters ?? null,
    durationSeconds: input.durationSeconds,
    intensityLevel: input.intensityLevel,
  }),
  hiit: (base, input) => ({
    ...base,
    setType: "hiit",
    exerciseId: input.exerciseId,
    durationSeconds: input.durationSeconds,
    restSeconds: input.restSeconds ?? null,
  }),
  yoga: mindBodyBuilder("yoga"),
  pilates: mindBodyBuilder("pilates"),
  mobility: mindBodyBuilder("mobility"),
};

export async function createSet(
  workoutRepo: IWorkoutRepository,
  setRepo: ISetRepository,
  exerciseRepo: IExerciseRepository,
  workoutExerciseRepo: IWorkoutExerciseRepository,
  workoutId: string,
  userId: string,
  input: { setNumber: number; notes?: string } & TypedSetInput,
) {
  const workout = await workoutRepo.findById(workoutId, userId);
  if (!workout) throw new NotFoundError("Workout not found");

  const allowed = allowedSetTypesForWorkout(workout.type);
  if (!allowed.has(input.setType)) {
    throw new ValidationError(
      `Workout type "${workout.type}" does not allow set type "${input.setType}"`,
    );
  }

  const exercise = await exerciseRepo.findById(input.exerciseId);
  if (!exercise) throw new NotFoundError("Exercise not found");

  const allowedCategories = allowedExerciseCategoriesForSetType(input.setType);
  if (!allowedCategories.has(exercise.exerciseCategory)) {
    throw new ValidationError(
      `Exercise category "${exercise.exerciseCategory}" is not allowed for set type "${input.setType}"`,
    );
  }

  const workoutExercises = await workoutExerciseRepo.findByWorkoutId(workoutId);
  if (!workoutExercises.some((we) => we.exerciseId === input.exerciseId)) {
    throw new UnprocessableEntityError(
      "Exercise is not listed in this workout",
    );
  }

  try {
    return await setRepo.create(buildCreateData(workoutId, input));
  } catch (err: unknown) {
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code?: string }).code === PG_UNIQUE_VIOLATION
    ) {
      throw new ConflictError(
        "Set number already exists for this exercise in this workout",
      );
    }
    throw err;
  }
}

function buildCreateData(
  workoutId: string,
  input: { setNumber: number; notes?: string } & TypedSetInput,
): CreateSetData {
  const base = {
    workoutId,
    setNumber: input.setNumber,
    notes: input.notes ?? null,
  };
  // Cast needed because TypeScript can't correlate input.setType as the index key with the narrowed input type.
  return (
    SET_TYPE_RULES[input.setType] as (
      base: BaseData,
      input: TypedSetInput,
    ) => CreateSetData
  )(base, input);
}
