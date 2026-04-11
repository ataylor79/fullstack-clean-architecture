import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreateExerciseDto } from "@workout-app/shared";
import { exercisesApi } from "../api/exercisesApi";

export const exerciseKeys = {
  all: ["exercises"] as const,
  detail: (id: string) => ["exercises", id] as const,
};

export function useExercises() {
  return useQuery({
    queryKey: exerciseKeys.all,
    queryFn: exercisesApi.getAll,
  });
}

export function useCreateExercise() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateExerciseDto) => exercisesApi.create(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: exerciseKeys.all }),
  });
}
