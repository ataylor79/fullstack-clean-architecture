import type { SetType } from "@domain/entities/Set";
import type { IExerciseHistoryRepository } from "@domain/repositories/IExerciseHistoryRepository";
import { db } from "@infrastructure/database/db";
import type {
  ExerciseHistoryEntry,
  HistorySet,
} from "@workout-app/shared";

interface HistoryRow {
  workout_id: string;
  workout_name: string;
  completed_at: Date;
  id: string;
  set_number: number;
  set_type: string;
  details: Record<string, unknown>;
  notes: string | null;
}

function toHistorySet(row: HistoryRow): HistorySet {
  const base = { id: row.id, setNumber: row.set_number, notes: row.notes };
  const d = row.details;
  const t = row.set_type as SetType;
  switch (t) {
    case "strength":
      return {
        ...base,
        setType: "strength",
        reps: d.reps as number,
        weightKg: d.weightKg as number,
        restSeconds: (d.restSeconds as number | null) ?? null,
      };
    case "cardio":
      return {
        ...base,
        setType: "cardio",
        distanceMeters: (d.distanceMeters as number | null) ?? null,
        durationSeconds: d.durationSeconds as number,
        intensityLevel: d.intensityLevel as number,
      };
    case "hiit":
      return {
        ...base,
        setType: "hiit",
        durationSeconds: d.durationSeconds as number,
        restSeconds: (d.restSeconds as number | null) ?? null,
      };
    default:
      return {
        ...base,
        setType: t as "yoga" | "pilates" | "mobility",
        durationSeconds: (d.durationSeconds as number | null) ?? null,
        reps: (d.reps as number | null) ?? null,
      };
  }
}

function groupRows(rows: HistoryRow[], limit: number): ExerciseHistoryEntry[] {
  const map = new Map<string, ExerciseHistoryEntry>();
  for (const row of rows) {
    if (!map.has(row.workout_id)) {
      if (map.size >= limit) continue;
      map.set(row.workout_id, {
        workoutId: row.workout_id,
        workoutName: row.workout_name,
        completedAt: new Date(row.completed_at).toISOString(),
        sets: [],
      });
    }
    map.get(row.workout_id)!.sets.push(toHistorySet(row));
  }
  return Array.from(map.values());
}

export function createExerciseHistoryRepository(): IExerciseHistoryRepository {
  return {
    async findByExerciseAndUser(
      exerciseId: string,
      userId: string,
      limit: number,
    ): Promise<ExerciseHistoryEntry[]> {
      const rows = await db("workout_sets as ws")
        .join("workouts as w", "w.id", "ws.workout_id")
        .where("ws.exercise_id", exerciseId)
        .where("w.user_id", userId)
        .whereNotNull("w.completed_at")
        .orderBy("w.completed_at", "asc")
        .orderBy("ws.set_number", "asc")
        .select<HistoryRow[]>(
          "w.id as workout_id",
          "w.name as workout_name",
          "w.completed_at",
          "ws.id",
          "ws.set_number",
          "ws.set_type",
          "ws.details",
          "ws.notes",
        );
      return groupRows(rows, limit);
    },
  };
}
