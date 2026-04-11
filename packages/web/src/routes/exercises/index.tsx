import { createFileRoute } from "@tanstack/react-router";
import { ExerciseList } from "../../features/exercises/components/ExerciseList";

export const Route = createFileRoute("/exercises/")({
  component: ExerciseList,
});
