import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreateWorkoutDto, UpdateWorkoutDto } from "@workout-app/shared";
import { workoutsApi } from "../api/workoutsApi";

export const workoutKeys = {
  all: ["workouts"] as const,
  detail: (id: string) => ["workouts", id] as const,
};

export function useWorkouts() {
  return useQuery({
    queryKey: workoutKeys.all,
    queryFn: workoutsApi.getAll,
  });
}

export function useWorkout(id: string) {
  return useQuery({
    queryKey: workoutKeys.detail(id),
    queryFn: () => workoutsApi.getById(id),
  });
}

export function useCreateWorkout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateWorkoutDto) => workoutsApi.create(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: workoutKeys.all }),
  });
}

export function useUpdateWorkout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateWorkoutDto }) =>
      workoutsApi.update(id, dto),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: workoutKeys.all });
      qc.invalidateQueries({ queryKey: workoutKeys.detail(id) });
    },
  });
}

export function useDeleteWorkout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => workoutsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: workoutKeys.all }),
  });
}
