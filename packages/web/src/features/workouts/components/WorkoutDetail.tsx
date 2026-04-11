import { useParams } from "@tanstack/react-router";
import { useWorkout } from "../hooks/useWorkouts";

export function WorkoutDetail() {
  const { workoutId } = useParams({ from: "/workouts/$workoutId" });
  const { data: workout, isLoading, isError } = useWorkout(workoutId);

  if (isLoading) return <p className="text-gray-500">Loading...</p>;
  if (isError || !workout)
    return <p className="text-red-500">Workout not found.</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">{workout.name}</h1>
      <p className="text-gray-500 text-sm mb-6">
        Scheduled: {new Date(workout.scheduledAt).toLocaleDateString()}
      </p>
    </div>
  );
}
