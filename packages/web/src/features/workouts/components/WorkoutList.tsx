import { Link } from "@tanstack/react-router";
import { useWorkouts } from "../hooks/useWorkouts";

export function WorkoutList() {
  const { data: workouts, isLoading, isError } = useWorkouts();

  if (isLoading) return <p className="text-gray-500">Loading...</p>;
  if (isError) return <p className="text-red-500">Failed to load workouts.</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Workouts</h1>
        <Link
          to="/workouts/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm"
        >
          New Workout
        </Link>
      </div>

      {workouts?.length === 0 && (
        <p className="text-gray-500">No workouts yet. Create your first one!</p>
      )}

      <ul className="space-y-3">
        {workouts?.map((workout) => (
          <li key={workout.id}>
            <Link
              to="/workouts/$workoutId"
              params={{ workoutId: workout.id }}
              className="block bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-400 transition-colors"
            >
              <p className="font-medium text-gray-900">{workout.name}</p>
              <p className="text-sm text-gray-500 mt-1">
                {new Date(workout.scheduledAt).toLocaleDateString()}
                {workout.completedAt && (
                  <span className="ml-2 text-green-600">Completed</span>
                )}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
