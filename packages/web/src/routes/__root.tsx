import { createRootRoute, Link, Outlet } from "@tanstack/react-router";

export const Route = createRootRoute({
  component: () => (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex gap-6">
          <Link
            to="/"
            className="font-semibold text-gray-900 [&.active]:text-blue-600"
          >
            Workout App
          </Link>
          <Link
            to="/workouts"
            className="text-gray-600 hover:text-gray-900 [&.active]:text-blue-600"
          >
            Workouts
          </Link>
          <Link
            to="/exercises"
            className="text-gray-600 hover:text-gray-900 [&.active]:text-blue-600"
          >
            Exercises
          </Link>
        </div>
      </nav>
      <main className="max-w-4xl mx-auto px-6 py-8">
        <Outlet />
      </main>
    </div>
  ),
});
