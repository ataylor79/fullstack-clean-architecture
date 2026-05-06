import type { DayOfWeek, WorkoutPlan } from "@domain/entities/WorkoutPlan";
import type { IWorkoutPlanRepository } from "@domain/repositories/IWorkoutPlanRepository";
import { db } from "@infrastructure/database/db";

interface WorkoutPlanRow {
  id: string;
  user_id: string;
  template_id: string;
  days_of_week: DayOfWeek[];
  num_weeks: number;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

function toEntity(row: WorkoutPlanRow): WorkoutPlan {
  return {
    id: row.id,
    userId: row.user_id,
    templateId: row.template_id,
    daysOfWeek: row.days_of_week,
    numWeeks: row.num_weeks,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

export function createWorkoutPlanRepository(): IWorkoutPlanRepository {
  return {
    async findAll(userId) {
      const rows = await db<WorkoutPlanRow>("workout_plans")
        .where({ user_id: userId })
        .whereNull("deleted_at")
        .orderBy("created_at", "desc");
      return rows.map(toEntity);
    },

    async findById(id, userId) {
      const row = await db<WorkoutPlanRow>("workout_plans")
        .where({ id, user_id: userId })
        .whereNull("deleted_at")
        .first();
      return row ? toEntity(row) : null;
    },

    async create(data) {
      const [row] = await db<WorkoutPlanRow>("workout_plans")
        .insert({
          user_id: data.userId,
          template_id: data.templateId,
          days_of_week: JSON.stringify(
            data.daysOfWeek,
          ) as unknown as DayOfWeek[],
          num_weeks: data.numWeeks,
        })
        .returning("*");
      return toEntity(row);
    },

    async update(id, userId, data) {
      const [row] = await db<WorkoutPlanRow>("workout_plans")
        .where({ id, user_id: userId })
        .whereNull("deleted_at")
        .update({
          ...(data.daysOfWeek !== undefined && {
            days_of_week: JSON.stringify(
              data.daysOfWeek,
            ) as unknown as DayOfWeek[],
          }),
          ...(data.numWeeks !== undefined && { num_weeks: data.numWeeks }),
          updated_at: new Date(),
        })
        .returning("*");
      return row ? toEntity(row) : null;
    },

    async delete(id, userId) {
      const count = await db("workout_plans")
        .where({ id, user_id: userId })
        .whereNull("deleted_at")
        .update({ deleted_at: new Date() });
      return count > 0;
    },

    async existsByTemplateId(templateId) {
      const row = await db("workout_plans")
        .where({ template_id: templateId })
        .whereNull("deleted_at")
        .first("id");
      return row !== undefined;
    },
  };
}
