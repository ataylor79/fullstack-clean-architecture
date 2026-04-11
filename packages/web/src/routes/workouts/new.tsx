import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/workouts/new")({
  component: NewWorkoutPage,
});

function NewWorkoutPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">New workout</h1>
      <p className="text-gray-600 mt-2">Coming soon.</p>
    </div>
  );
}
