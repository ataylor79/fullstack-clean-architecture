import type { OpenAPIV3 } from "openapi-types";

const idParam: OpenAPIV3.ParameterObject = {
  in: "path",
  name: "id",
  required: true,
  schema: { type: "string", format: "uuid" },
};

const workoutIdParam: OpenAPIV3.ParameterObject = {
  in: "path",
  name: "workoutId",
  required: true,
  schema: { type: "string", format: "uuid" },
};

const setIdParam: OpenAPIV3.ParameterObject = {
  in: "path",
  name: "setId",
  required: true,
  schema: { type: "string", format: "uuid" },
};

const notFound: OpenAPIV3.ResponseObject = {
  description: "Not found",
  content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
};

const unauthorized: OpenAPIV3.ResponseObject = {
  description: "Unauthorized",
  content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
};

const badRequest: OpenAPIV3.ResponseObject = {
  description: "Bad request",
  content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
};

const bearerAuth: OpenAPIV3.SecurityRequirementObject[] = [{ bearerAuth: [] }];

export const openApiSpec: OpenAPIV3.Document = {
  openapi: "3.0.0",
  info: {
    title: "Workout App API",
    version: "1.0.0",
    description: "REST API for managing workouts and exercises",
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      User: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          email: { type: "string", format: "email" },
          emailVerifiedAt: { type: "string", format: "date-time", nullable: true },
        },
      },
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
      WorkoutDetail: {
        allOf: [
          { $ref: "#/components/schemas/Workout" },
          {
            type: "object",
            properties: {
              sets: {
                type: "array",
                items: { $ref: "#/components/schemas/WorkoutSetWithExercise" },
              },
            },
          },
        ],
      },
      WorkoutSet: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          workoutId: { type: "string", format: "uuid" },
          exerciseId: { type: "string", format: "uuid" },
          setNumber: { type: "integer", minimum: 1 },
          reps: { type: "integer", minimum: 1 },
          weightKg: { type: "number", minimum: 0 },
          notes: { type: "string", nullable: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      WorkoutSetWithExercise: {
        allOf: [
          { $ref: "#/components/schemas/WorkoutSet" },
          {
            type: "object",
            properties: {
              exercise: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  muscleGroup: { type: "string" },
                },
              },
            },
          },
        ],
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
      CreateSetBody: {
        type: "object",
        required: ["exerciseId", "setNumber", "reps", "weightKg"],
        properties: {
          exerciseId: { type: "string", format: "uuid" },
          setNumber: { type: "integer", minimum: 1 },
          reps: { type: "integer", minimum: 1 },
          weightKg: { type: "number", minimum: 0 },
          notes: { type: "string" },
        },
      },
      UpdateSetBody: {
        type: "object",
        properties: {
          exerciseId: { type: "string", format: "uuid" },
          setNumber: { type: "integer", minimum: 1 },
          reps: { type: "integer", minimum: 1 },
          weightKg: { type: "number", minimum: 0 },
          notes: { type: "string", nullable: true },
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
  paths: {
    "/auth/register": {
      post: {
        summary: "Register a new user",
        tags: ["Auth"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string", minLength: 8 },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "Registered. Sets httpOnly refreshToken cookie.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    user: { $ref: "#/components/schemas/User" },
                    accessToken: { type: "string" },
                  },
                },
              },
            },
          },
          400: badRequest,
          409: { description: "Email already registered" },
        },
      },
    },
    "/auth/login": {
      post: {
        summary: "Log in",
        tags: ["Auth"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Logged in. Sets httpOnly refreshToken cookie.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    user: { $ref: "#/components/schemas/User" },
                    accessToken: { type: "string" },
                  },
                },
              },
            },
          },
          400: badRequest,
          401: unauthorized,
        },
      },
    },
    "/auth/refresh": {
      post: {
        summary: "Rotate refresh token and get a new access token",
        tags: ["Auth"],
        responses: {
          200: {
            description: "New access token. Rotates the refreshToken cookie.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { accessToken: { type: "string" } },
                },
              },
            },
          },
          401: unauthorized,
        },
      },
    },
    "/auth/logout": {
      post: {
        summary: "Log out and revoke refresh token",
        tags: ["Auth"],
        responses: {
          204: { description: "Logged out. Clears the refreshToken cookie." },
        },
      },
    },
    "/auth/verify": {
      get: {
        summary: "Verify email address",
        tags: ["Auth"],
        parameters: [
          { in: "query", name: "token", required: true, schema: { type: "string" } },
        ],
        responses: {
          200: { description: "Email verified successfully" },
          400: badRequest,
          404: notFound,
        },
      },
    },
    "/auth/resend-verification": {
      post: {
        summary: "Resend verification email",
        tags: ["Auth"],
        security: bearerAuth,
        responses: {
          204: { description: "Verification email sent" },
          400: { description: "Email already verified" },
          401: unauthorized,
        },
      },
    },
    "/auth/me": {
      get: {
        summary: "Get the current authenticated user",
        tags: ["Auth"],
        security: bearerAuth,
        responses: {
          200: {
            description: "Current user",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/User" } },
            },
          },
          401: unauthorized,
        },
      },
    },
    "/api/workouts": {
      get: {
        summary: "List all workouts for the authenticated user",
        tags: ["Workouts"],
        security: bearerAuth,
        responses: {
          200: {
            description: "Array of workouts",
            content: {
              "application/json": {
                schema: { type: "array", items: { $ref: "#/components/schemas/Workout" } },
              },
            },
          },
          401: unauthorized,
        },
      },
      post: {
        summary: "Create a workout",
        tags: ["Workouts"],
        security: bearerAuth,
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
          400: badRequest,
          401: unauthorized,
          403: { description: "Email verification required" },
        },
      },
    },
    "/api/workouts/{id}": {
      get: {
        summary: "Get a workout with embedded sets",
        tags: ["Workouts"],
        security: bearerAuth,
        parameters: [idParam],
        responses: {
          200: {
            description: "Workout with sets",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/WorkoutDetail" } },
            },
          },
          401: unauthorized,
          404: notFound,
        },
      },
      patch: {
        summary: "Update a workout",
        tags: ["Workouts"],
        security: bearerAuth,
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
          400: badRequest,
          401: unauthorized,
          404: notFound,
        },
      },
      delete: {
        summary: "Delete a workout",
        tags: ["Workouts"],
        security: bearerAuth,
        parameters: [idParam],
        responses: {
          204: { description: "Deleted successfully" },
          401: unauthorized,
          404: notFound,
        },
      },
    },
    "/api/workouts/{workoutId}/sets": {
      post: {
        summary: "Add a set to a workout",
        tags: ["Sets"],
        security: bearerAuth,
        parameters: [workoutIdParam],
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/CreateSetBody" } },
          },
        },
        responses: {
          201: {
            description: "Created set",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/WorkoutSet" } },
            },
          },
          400: badRequest,
          401: unauthorized,
          404: notFound,
        },
      },
    },
    "/api/workouts/{workoutId}/sets/{setId}": {
      patch: {
        summary: "Update a set",
        tags: ["Sets"],
        security: bearerAuth,
        parameters: [workoutIdParam, setIdParam],
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/UpdateSetBody" } },
          },
        },
        responses: {
          200: {
            description: "Updated set",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/WorkoutSet" } },
            },
          },
          400: badRequest,
          401: unauthorized,
          404: notFound,
        },
      },
      delete: {
        summary: "Delete a set",
        tags: ["Sets"],
        security: bearerAuth,
        parameters: [workoutIdParam, setIdParam],
        responses: {
          204: { description: "Deleted successfully" },
          401: unauthorized,
          404: notFound,
        },
      },
    },
    "/api/exercises": {
      get: {
        summary: "List all exercises",
        tags: ["Exercises"],
        security: bearerAuth,
        responses: {
          200: {
            description: "Array of exercises",
            content: {
              "application/json": {
                schema: { type: "array", items: { $ref: "#/components/schemas/Exercise" } },
              },
            },
          },
          401: unauthorized,
        },
      },
      post: {
        summary: "Create an exercise",
        tags: ["Exercises"],
        security: bearerAuth,
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
          400: badRequest,
          401: unauthorized,
        },
      },
    },
    "/api/exercises/{id}": {
      get: {
        summary: "Get an exercise by ID",
        tags: ["Exercises"],
        security: bearerAuth,
        parameters: [idParam],
        responses: {
          200: {
            description: "The exercise",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/Exercise" } },
            },
          },
          401: unauthorized,
          404: notFound,
        },
      },
      patch: {
        summary: "Update an exercise",
        tags: ["Exercises"],
        security: bearerAuth,
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
          400: badRequest,
          401: unauthorized,
          404: notFound,
        },
      },
      delete: {
        summary: "Delete an exercise",
        tags: ["Exercises"],
        security: bearerAuth,
        parameters: [idParam],
        responses: {
          204: { description: "Deleted successfully" },
          401: unauthorized,
          404: notFound,
        },
      },
    },
  },
};
