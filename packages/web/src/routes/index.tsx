import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: () => (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Welcome</h1>
      <p className="text-gray-600 mb-6">Track your workouts and progress.</p>
      <div className="flex gap-4">
        <Link
          to="/workouts"
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          View Workouts
        </Link>
        <Link
          to="/exercises"
          className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300"
        >
          View Exercises
        </Link>
      </div>
    </div>
  ),
});
