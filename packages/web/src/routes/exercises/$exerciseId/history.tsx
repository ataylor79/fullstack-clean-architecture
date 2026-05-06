import { createFileRoute } from "@tanstack/react-router";
import { ExerciseHistoryPage } from "../../../features/exercises/components/ExerciseHistoryPage";

export const Route = createFileRoute("/exercises/$exerciseId/history")({
  component: ExerciseHistoryPage,
});
