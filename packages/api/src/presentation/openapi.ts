import type { OpenAPIV3 } from "openapi-types";

const idParam: OpenAPIV3.ParameterObject = {
  in: "path",
  name: "id",
  required: true,
  schema: { type: "string", format: "uuid" },
};

const notFound: OpenAPIV3.ResponseObject = {
  description: "Not found",
  content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
};

export const openApiSpec: OpenAPIV3.Document = {
  openapi: "3.0.0",
  info: {
    title: "Workout App API",
    version: "1.0.0",
    description: "REST API for managing workouts and exercises",
  },
  paths: {
    "/api/workouts": {
      get: {
        summary: "List all workouts",
        tags: ["Workouts"],
        responses: {
          200: {
            description: "Array of workouts",
            content: {
              "application/json": {
                schema: { type: "array", items: { $ref: "#/components/schemas/Workout" } },
              },
            },
          },
        },
      },
      post: {
        summary: "Create a workout",
        tags: ["Workouts"],
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/CreateWorkoutBody" } },
          },
        },
        responses: {
          201: {
            description: "Created workout",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/Workout" } },
            },
          },
        },
      },
    },
    "/api/workouts/{id}": {
      get: {
        summary: "Get a workout by ID",
        tags: ["Workouts"],
        parameters: [idParam],
        responses: {
          200: {
            description: "The workout",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/Workout" } },
            },
          },
          404: notFound,
        },
      },
      patch: {
        summary: "Update a workout",
        tags: ["Workouts"],
        parameters: [idParam],
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/UpdateWorkoutBody" } },
          },
        },
        responses: {
          200: {
            description: "Updated workout",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/Workout" } },
            },
          },
          404: notFound,
        },
      },
      delete: {
        summary: "Delete a workout",
        tags: ["Workouts"],
        parameters: [idParam],
        responses: {
          204: { description: "Deleted successfully" },
          404: notFound,
        },
      },
    },
    "/api/exercises": {
      get: {
        summary: "List all exercises",
        tags: ["Exercises"],
        responses: {
          200: {
            description: "Array of exercises",
            content: {
              "application/json": {
                schema: { type: "array", items: { $ref: "#/components/schemas/Exercise" } },
              },
            },
          },
        },
      },
      post: {
        summary: "Create an exercise",
        tags: ["Exercises"],
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/CreateExerciseBody" } },
          },
        },
        responses: {
          201: {
            description: "Created exercise",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/Exercise" } },
            },
          },
        },
      },
    },
    "/api/exercises/{id}": {
      get: {
        summary: "Get an exercise by ID",
        tags: ["Exercises"],
        parameters: [idParam],
        responses: {
          200: {
            description: "The exercise",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/Exercise" } },
            },
          },
          404: notFound,
        },
      },
      patch: {
        summary: "Update an exercise",
        tags: ["Exercises"],
        parameters: [idParam],
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/UpdateExerciseBody" } },
          },
        },
        responses: {
          200: {
            description: "Updated exercise",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/Exercise" } },
            },
          },
          404: notFound,
        },
      },
      delete: {
        summary: "Delete an exercise",
        tags: ["Exercises"],
        parameters: [idParam],
        responses: {
          204: { description: "Deleted successfully" },
          404: notFound,
        },
      },
    },
  },
  components: {
    schemas: {
      Workout: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string" },
          scheduledAt: { type: "string", format: "date-time" },
          completedAt: { type: "string", format: "date-time", nullable: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      CreateWorkoutBody: {
        type: "object",
        required: ["name", "scheduledAt"],
        properties: {
          name: { type: "string", example: "Monday Push" },
          scheduledAt: { type: "string", format: "date-time" },
        },
      },
      UpdateWorkoutBody: {
        type: "object",
        properties: {
          name: { type: "string" },
          scheduledAt: { type: "string", format: "date-time" },
          completedAt: { type: "string", format: "date-time", nullable: true },
        },
      },
      Exercise: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string" },
          muscleGroup: { type: "string" },
          notes: { type: "string", nullable: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      CreateExerciseBody: {
        type: "object",
        required: ["name", "muscleGroup"],
        properties: {
          name: { type: "string", example: "Bench Press" },
          muscleGroup: { type: "string", example: "Chest" },
          notes: { type: "string", nullable: true },
        },
      },
      UpdateExerciseBody: {
        type: "object",
        properties: {
          name: { type: "string" },
          muscleGroup: { type: "string" },
          notes: { type: "string", nullable: true },
        },
      },
      Error: {
        type: "object",
        properties: {
          error: { type: "string" },
        },
      },
    },
  },
};
