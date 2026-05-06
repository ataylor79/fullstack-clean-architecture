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
  content: {
    "application/json": { schema: { $ref: "#/components/schemas/Error" } },
  },
};

const unauthorized: OpenAPIV3.ResponseObject = {
  description: "Unauthorized",
  content: {
    "application/json": { schema: { $ref: "#/components/schemas/Error" } },
  },
};

const badRequest: OpenAPIV3.ResponseObject = {
  description: "Bad request",
  content: {
    "application/json": {
      schema: { $ref: "#/components/schemas/ValidationError" },
    },
  },
};

const forbidden: OpenAPIV3.ResponseObject = {
  description: "Forbidden",
  content: {
    "application/json": { schema: { $ref: "#/components/schemas/Error" } },
  },
};

const conflict: OpenAPIV3.ResponseObject = {
  description: "Conflict",
  content: {
    "application/json": { schema: { $ref: "#/components/schemas/Error" } },
  },
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
          emailVerifiedAt: {
            type: "string",
            format: "date-time",
            nullable: true,
          },
          isAdmin: { type: "boolean" },
        },
      },
      WorkoutDifficulty: {
        type: "string",
        enum: ["beginner", "intermediate", "advanced", "elite"],
      },
      WorkoutType: {
        type: "string",
        enum: [
          "strength",
          "cardio",
          "hiit",
          "yoga",
          "pilates",
          "mobility",
          "hybrid",
        ],
      },
      Workout: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          userId: { type: "string", format: "uuid" },
          planId: { type: "string", format: "uuid", nullable: true },
          name: { type: "string" },
          durationMinutes: { type: "integer", minimum: 1, nullable: true },
          difficulty: { $ref: "#/components/schemas/WorkoutDifficulty" },
          type: { $ref: "#/components/schemas/WorkoutType" },
          scheduledAt: { type: "string", format: "date-time" },
          completedAt: { type: "string", format: "date-time", nullable: true },
          rating: { type: "integer", minimum: 1, maximum: 5, nullable: true },
          notes: { type: "string", nullable: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      WorkoutWithExercises: {
        allOf: [
          { $ref: "#/components/schemas/Workout" },
          {
            type: "object",
            required: ["exercises"],
            properties: {
              exercises: {
                type: "array",
                items: { $ref: "#/components/schemas/WorkoutExercise" },
              },
            },
          },
        ],
      },
      WorkoutDetail: {
        allOf: [
          { $ref: "#/components/schemas/WorkoutWithExercises" },
          {
            type: "object",
            required: ["sets"],
            properties: {
              sets: {
                type: "array",
                items: { $ref: "#/components/schemas/WorkoutSetWithExercise" },
              },
            },
          },
        ],
      },
      Pagination: {
        type: "object",
        required: ["page", "limit", "total", "totalPages"],
        properties: {
          page: { type: "integer", minimum: 1, example: 1 },
          limit: { type: "integer", minimum: 1, maximum: 100, example: 20 },
          total: { type: "integer", minimum: 0, example: 47 },
          totalPages: { type: "integer", minimum: 0, example: 3 },
        },
      },
      WorkoutExercise: {
        type: "object",
        required: [
          "id",
          "workoutId",
          "exerciseId",
          "section",
          "orderIndex",
          "createdAt",
        ],
        properties: {
          id: { type: "string", format: "uuid" },
          workoutId: { type: "string", format: "uuid" },
          exerciseId: { type: "string", format: "uuid" },
          section: { type: "string", enum: ["main", "warmup", "cooldown"] },
          orderIndex: { type: "integer", minimum: 1 },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      WorkoutListResponse: {
        type: "object",
        required: ["data", "pagination"],
        properties: {
          data: {
            type: "array",
            items: { $ref: "#/components/schemas/Workout" },
          },
          pagination: { $ref: "#/components/schemas/Pagination" },
        },
      },
      SetType: {
        type: "string",
        enum: ["strength", "cardio", "hiit", "yoga", "pilates", "mobility"],
      },
      WorkoutSet: {
        type: "object",
        description:
          "Base set shape — type-specific fields (reps, weightKg, durationSeconds, etc.) are present depending on setType",
        properties: {
          id: { type: "string", format: "uuid" },
          workoutId: { type: "string", format: "uuid" },
          setType: { $ref: "#/components/schemas/SetType" },
          setNumber: { type: "integer", minimum: 1 },
          exerciseId: { type: "string", format: "uuid" },
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
                  muscleGroup: { type: "string", nullable: true },
                },
              },
            },
          },
        ],
      },
      ExerciseCategory: {
        type: "string",
        enum: ["strength", "cardio", "flexibility"],
      },
      Exercise: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string" },
          exerciseCategory: { $ref: "#/components/schemas/ExerciseCategory" },
          muscleGroup: { type: "string", nullable: true },
          notes: { type: "string", nullable: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      CreateWorkoutBody: {
        type: "object",
        required: [
          "name",
          "durationMinutes",
          "difficulty",
          "type",
          "scheduledAt",
          "exercises",
        ],
        properties: {
          name: { type: "string", example: "Monday Push" },
          durationMinutes: { type: "integer", minimum: 1, example: 45 },
          difficulty: { $ref: "#/components/schemas/WorkoutDifficulty" },
          type: { $ref: "#/components/schemas/WorkoutType" },
          scheduledAt: { type: "string", format: "date-time" },
          exercises: {
            type: "array",
            items: { type: "string", format: "uuid" },
            minItems: 1,
            description:
              "Ordered list of exercise IDs. Order in the array determines exercise order in the workout.",
            example: ["uuid-1", "uuid-2", "uuid-3"],
          },
        },
      },
      UpdateWorkoutBody: {
        type: "object",
        description:
          "Structural fields (difficulty, type, exercises) return 409 if the workout has any logged sets. Other fields can be updated freely.",
        properties: {
          name: { type: "string" },
          durationMinutes: { type: "integer", minimum: 1 },
          difficulty: { $ref: "#/components/schemas/WorkoutDifficulty" },
          type: { $ref: "#/components/schemas/WorkoutType" },
          scheduledAt: { type: "string", format: "date-time" },
          completedAt: { type: "string", format: "date-time", nullable: true },
          exercises: {
            type: "array",
            items: { type: "string", format: "uuid" },
            minItems: 1,
            description:
              "Replace the exercise order. Only allowed when the workout has no logged sets.",
          },
          rating: { type: "integer", minimum: 1, maximum: 5, nullable: true },
          notes: { type: "string", nullable: true },
        },
      },
      StartWorkoutFromPlanBody: {
        type: "object",
        required: ["scheduledAt"],
        properties: {
          scheduledAt: { type: "string", format: "date-time" },
        },
      },
      CreateStrengthSetBody: {
        type: "object",
        required: ["setType", "setNumber", "exerciseId", "reps", "weightKg"],
        properties: {
          setType: { type: "string", enum: ["strength"] },
          setNumber: { type: "integer", minimum: 1 },
          exerciseId: { type: "string", format: "uuid" },
          reps: { type: "integer", minimum: 1 },
          weightKg: { type: "number", minimum: 0 },
          restSeconds: { type: "integer", minimum: 0 },
          notes: { type: "string" },
        },
      },
      CreateCardioSetBody: {
        type: "object",
        required: [
          "setType",
          "setNumber",
          "exerciseId",
          "durationSeconds",
          "intensityLevel",
        ],
        properties: {
          setType: { type: "string", enum: ["cardio"] },
          setNumber: { type: "integer", minimum: 1 },
          exerciseId: { type: "string", format: "uuid" },
          durationSeconds: { type: "integer", minimum: 1 },
          distanceMeters: { type: "number", minimum: 0 },
          intensityLevel: { type: "integer", minimum: 1, maximum: 10 },
          notes: { type: "string" },
        },
      },
      CreateHiitSetBody: {
        type: "object",
        required: ["setType", "setNumber", "exerciseId", "durationSeconds"],
        properties: {
          setType: { type: "string", enum: ["hiit"] },
          setNumber: { type: "integer", minimum: 1 },
          exerciseId: { type: "string", format: "uuid" },
          durationSeconds: { type: "integer", minimum: 1 },
          restSeconds: { type: "integer", minimum: 0 },
          notes: { type: "string" },
        },
      },
      CreateMindBodySetBody: {
        type: "object",
        required: ["setType", "setNumber", "exerciseId"],
        description:
          "At least one of durationSeconds or reps must be provided.",
        properties: {
          setType: { type: "string", enum: ["yoga", "pilates", "mobility"] },
          setNumber: { type: "integer", minimum: 1 },
          exerciseId: { type: "string", format: "uuid" },
          durationSeconds: { type: "integer", minimum: 1 },
          reps: { type: "integer", minimum: 1 },
          notes: { type: "string" },
        },
      },
      UpdateStrengthSetBody: {
        type: "object",
        required: ["setType"],
        properties: {
          setType: { type: "string", enum: ["strength"] },
          setNumber: { type: "integer", minimum: 1 },
          exerciseId: { type: "string", format: "uuid" },
          reps: { type: "integer", minimum: 1 },
          weightKg: { type: "number", minimum: 0 },
          restSeconds: { type: "integer", minimum: 0, nullable: true },
          notes: { type: "string", nullable: true },
        },
      },
      UpdateCardioSetBody: {
        type: "object",
        required: ["setType"],
        properties: {
          setType: { type: "string", enum: ["cardio"] },
          setNumber: { type: "integer", minimum: 1 },
          exerciseId: { type: "string", format: "uuid" },
          durationSeconds: { type: "integer", minimum: 1 },
          distanceMeters: { type: "number", minimum: 0, nullable: true },
          intensityLevel: { type: "integer", minimum: 1, maximum: 10 },
          notes: { type: "string", nullable: true },
        },
      },
      UpdateHiitSetBody: {
        type: "object",
        required: ["setType"],
        properties: {
          setType: { type: "string", enum: ["hiit"] },
          setNumber: { type: "integer", minimum: 1 },
          exerciseId: { type: "string", format: "uuid" },
          durationSeconds: { type: "integer", minimum: 1 },
          restSeconds: { type: "integer", minimum: 0, nullable: true },
          notes: { type: "string", nullable: true },
        },
      },
      UpdateMindBodySetBody: {
        type: "object",
        required: ["setType"],
        properties: {
          setType: { type: "string", enum: ["yoga", "pilates", "mobility"] },
          setNumber: { type: "integer", minimum: 1 },
          exerciseId: { type: "string", format: "uuid" },
          durationSeconds: { type: "integer", minimum: 1, nullable: true },
          reps: { type: "integer", minimum: 1, nullable: true },
          notes: { type: "string", nullable: true },
        },
      },
      TemplateSection: {
        type: "string",
        enum: ["main", "warmup", "cooldown"],
      },
      DayOfWeek: {
        type: "string",
        enum: [
          "monday",
          "tuesday",
          "wednesday",
          "thursday",
          "friday",
          "saturday",
          "sunday",
        ],
      },
      WorkoutTemplate: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          userId: { type: "string", format: "uuid" },
          name: { type: "string" },
          difficulty: { $ref: "#/components/schemas/WorkoutDifficulty" },
          type: { $ref: "#/components/schemas/WorkoutType" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      TemplateExercise: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          templateId: { type: "string", format: "uuid" },
          exerciseId: { type: "string", format: "uuid" },
          section: { $ref: "#/components/schemas/TemplateSection" },
          orderIndex: { type: "integer", minimum: 1 },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      TemplateExerciseWithSets: {
        allOf: [
          { $ref: "#/components/schemas/TemplateExercise" },
          {
            type: "object",
            required: ["sets"],
            properties: {
              sets: {
                type: "array",
                items: { $ref: "#/components/schemas/WorkoutSet" },
                description:
                  "Planned sets for this exercise (type-specific fields apply)",
              },
            },
          },
        ],
      },
      WorkoutTemplateDetail: {
        allOf: [
          { $ref: "#/components/schemas/WorkoutTemplate" },
          {
            type: "object",
            required: ["exercises"],
            properties: {
              exercises: {
                type: "array",
                items: {
                  $ref: "#/components/schemas/TemplateExerciseWithSets",
                },
              },
            },
          },
        ],
      },
      CreateTemplateBody: {
        type: "object",
        required: ["name", "difficulty", "type"],
        properties: {
          name: { type: "string", example: "Push Day A" },
          difficulty: { $ref: "#/components/schemas/WorkoutDifficulty" },
          type: { $ref: "#/components/schemas/WorkoutType" },
        },
      },
      AddTemplateExerciseBody: {
        type: "object",
        required: ["exerciseId", "section"],
        properties: {
          exerciseId: { type: "string", format: "uuid" },
          section: { $ref: "#/components/schemas/TemplateSection" },
        },
      },
      WorkoutPlan: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          userId: { type: "string", format: "uuid" },
          templateId: { type: "string", format: "uuid" },
          daysOfWeek: {
            type: "array",
            items: { $ref: "#/components/schemas/DayOfWeek" },
            minItems: 1,
          },
          numWeeks: { type: "integer", minimum: 1 },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      CreatePlanBody: {
        type: "object",
        required: ["templateId", "daysOfWeek", "numWeeks"],
        properties: {
          templateId: { type: "string", format: "uuid" },
          daysOfWeek: {
            type: "array",
            items: { $ref: "#/components/schemas/DayOfWeek" },
            minItems: 1,
            example: ["monday", "wednesday", "friday"],
          },
          numWeeks: { type: "integer", minimum: 1, example: 8 },
        },
      },
      CreateExerciseBody: {
        type: "object",
        required: ["name", "exerciseCategory"],
        properties: {
          name: { type: "string", example: "Bench Press" },
          exerciseCategory: { $ref: "#/components/schemas/ExerciseCategory" },
          muscleGroup: { type: "string", example: "Chest" },
          notes: { type: "string", nullable: true },
        },
      },
      UpdateExerciseBody: {
        type: "object",
        description: "At least one field must be provided.",
        properties: {
          name: { type: "string" },
          exerciseCategory: { $ref: "#/components/schemas/ExerciseCategory" },
          muscleGroup: { type: "string", nullable: true },
          notes: { type: "string", nullable: true },
        },
      },
      Error: {
        type: "object",
        required: ["error", "code"],
        properties: {
          error: { type: "string", example: "Not found" },
          code: { type: "string", example: "NOT_FOUND" },
        },
      },
      ValidationError: {
        type: "object",
        required: ["error", "code"],
        properties: {
          error: { type: "string", example: "Validation failed" },
          code: { type: "string", enum: ["VALIDATION_ERROR"] },
          details: {
            type: "array",
            items: { type: "string" },
            example: [
              "name is required",
              "durationMinutes must be a positive integer",
            ],
          },
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
          409: conflict,
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
          {
            in: "query",
            name: "token",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: { description: "Email verified successfully" },
          400: badRequest,
          404: notFound,
        },
      },
    },
    "/auth/forgot-password": {
      post: {
        summary: "Request a password reset email",
        tags: ["Auth"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email"],
                properties: {
                  email: { type: "string", format: "email" },
                },
              },
            },
          },
        },
        responses: {
          204: {
            description:
              "Reset email sent if the address is registered (always 204 to prevent user enumeration)",
          },
          400: badRequest,
        },
      },
    },
    "/auth/reset-password": {
      post: {
        summary: "Reset password using a token from the reset email",
        tags: ["Auth"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["token", "password"],
                properties: {
                  token: { type: "string" },
                  password: { type: "string", minLength: 8 },
                },
              },
            },
          },
        },
        responses: {
          204: { description: "Password reset successfully" },
          400: badRequest,
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
          400: badRequest,
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
              "application/json": {
                schema: { $ref: "#/components/schemas/User" },
              },
            },
          },
          401: unauthorized,
        },
      },
    },
    "/api/workouts": {
      get: {
        summary: "List workouts for the authenticated user",
        tags: ["Workouts"],
        security: bearerAuth,
        parameters: [
          {
            in: "query",
            name: "page",
            schema: { type: "integer", minimum: 1, default: 1 },
            description: "Page number",
          },
          {
            in: "query",
            name: "limit",
            schema: { type: "integer", minimum: 1, maximum: 100, default: 20 },
            description: "Results per page",
          },
        ],
        responses: {
          200: {
            description: "Paginated list of workouts",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/WorkoutListResponse" },
              },
            },
          },
          401: unauthorized,
        },
      },
      post: {
        summary: "Create a workout",
        description: "Requires a verified email address.",
        tags: ["Workouts"],
        security: bearerAuth,
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateWorkoutBody" },
            },
          },
        },
        responses: {
          201: {
            description: "Created workout with ordered exercises",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/WorkoutWithExercises" },
              },
            },
          },
          400: badRequest,
          401: unauthorized,
          403: forbidden,
          404: notFound,
        },
      },
    },
    "/api/workouts/{id}": {
      get: {
        summary: "Get a workout with its sets",
        tags: ["Workouts"],
        security: bearerAuth,
        parameters: [idParam],
        responses: {
          200: {
            description: "Workout with embedded sets",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/WorkoutDetail" },
              },
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
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateWorkoutBody" },
            },
          },
        },
        responses: {
          200: {
            description: "Updated workout with exercises",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/WorkoutWithExercises" },
              },
            },
          },
          400: badRequest,
          401: unauthorized,
          404: notFound,
          409: conflict,
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
        description:
          "Body schema varies by set type. Use the schema matching the workout's type — strength sets for strength workouts, etc.",
        tags: ["Sets"],
        security: bearerAuth,
        parameters: [workoutIdParam],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                oneOf: [
                  { $ref: "#/components/schemas/CreateStrengthSetBody" },
                  { $ref: "#/components/schemas/CreateCardioSetBody" },
                  { $ref: "#/components/schemas/CreateHiitSetBody" },
                  { $ref: "#/components/schemas/CreateMindBodySetBody" },
                ],
                discriminator: {
                  propertyName: "setType",
                  mapping: {
                    strength: "#/components/schemas/CreateStrengthSetBody",
                    cardio: "#/components/schemas/CreateCardioSetBody",
                    hiit: "#/components/schemas/CreateHiitSetBody",
                    yoga: "#/components/schemas/CreateMindBodySetBody",
                    pilates: "#/components/schemas/CreateMindBodySetBody",
                    mobility: "#/components/schemas/CreateMindBodySetBody",
                  },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "Created set",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/WorkoutSet" },
              },
            },
          },
          400: badRequest,
          401: unauthorized,
          404: notFound,
          409: conflict,
        },
      },
    },
    "/api/workouts/{workoutId}/sets/{setId}": {
      patch: {
        summary: "Update a set",
        description:
          "setType is required and must match the existing set's type. Only fields valid for that type are accepted.",
        tags: ["Sets"],
        security: bearerAuth,
        parameters: [workoutIdParam, setIdParam],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                oneOf: [
                  { $ref: "#/components/schemas/UpdateStrengthSetBody" },
                  { $ref: "#/components/schemas/UpdateCardioSetBody" },
                  { $ref: "#/components/schemas/UpdateHiitSetBody" },
                  { $ref: "#/components/schemas/UpdateMindBodySetBody" },
                ],
                discriminator: {
                  propertyName: "setType",
                  mapping: {
                    strength: "#/components/schemas/UpdateStrengthSetBody",
                    cardio: "#/components/schemas/UpdateCardioSetBody",
                    hiit: "#/components/schemas/UpdateHiitSetBody",
                    yoga: "#/components/schemas/UpdateMindBodySetBody",
                    pilates: "#/components/schemas/UpdateMindBodySetBody",
                    mobility: "#/components/schemas/UpdateMindBodySetBody",
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Updated set",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/WorkoutSet" },
              },
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
    "/api/templates": {
      get: {
        summary: "List workout templates for the authenticated user",
        tags: ["Templates"],
        security: bearerAuth,
        responses: {
          200: {
            description: "Array of templates",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/WorkoutTemplate" },
                },
              },
            },
          },
          401: unauthorized,
        },
      },
      post: {
        summary: "Create a workout template",
        tags: ["Templates"],
        security: bearerAuth,
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateTemplateBody" },
            },
          },
        },
        responses: {
          201: {
            description: "Created template",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/WorkoutTemplate" },
              },
            },
          },
          400: badRequest,
          401: unauthorized,
        },
      },
    },
    "/api/templates/{templateId}": {
      get: {
        summary: "Get a template with exercises and sets",
        tags: ["Templates"],
        security: bearerAuth,
        parameters: [
          {
            in: "path",
            name: "templateId",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: {
          200: {
            description: "Template with exercises and planned sets",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/WorkoutTemplateDetail" },
              },
            },
          },
          401: unauthorized,
          404: notFound,
        },
      },
      delete: {
        summary: "Delete a template",
        description:
          "Returns 409 if the template is referenced by a workout plan.",
        tags: ["Templates"],
        security: bearerAuth,
        parameters: [
          {
            in: "path",
            name: "templateId",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: {
          204: { description: "Deleted successfully" },
          401: unauthorized,
          404: notFound,
          409: conflict,
        },
      },
    },
    "/api/templates/{templateId}/exercises": {
      post: {
        summary: "Add an exercise to a template section",
        description: "orderIndex is auto-assigned as next in section.",
        tags: ["Templates"],
        security: bearerAuth,
        parameters: [
          {
            in: "path",
            name: "templateId",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/AddTemplateExerciseBody" },
            },
          },
        },
        responses: {
          201: {
            description: "Added exercise",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/TemplateExercise" },
              },
            },
          },
          400: badRequest,
          401: unauthorized,
          404: notFound,
        },
      },
    },
    "/api/templates/{templateId}/exercises/{templateExerciseId}": {
      delete: {
        summary: "Remove an exercise from a template",
        description: "Returns 409 if the template is in use by a workout plan.",
        tags: ["Templates"],
        security: bearerAuth,
        parameters: [
          {
            in: "path",
            name: "templateId",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
          {
            in: "path",
            name: "templateExerciseId",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: {
          204: { description: "Removed successfully" },
          401: unauthorized,
          404: notFound,
          409: conflict,
        },
      },
    },
    "/api/templates/{templateId}/exercises/{templateExerciseId}/sets": {
      post: {
        summary: "Add a planned set to a template exercise",
        tags: ["Templates"],
        security: bearerAuth,
        parameters: [
          {
            in: "path",
            name: "templateId",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
          {
            in: "path",
            name: "templateExerciseId",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                oneOf: [
                  { $ref: "#/components/schemas/CreateStrengthSetBody" },
                  { $ref: "#/components/schemas/CreateCardioSetBody" },
                  { $ref: "#/components/schemas/CreateHiitSetBody" },
                  { $ref: "#/components/schemas/CreateMindBodySetBody" },
                ],
                discriminator: {
                  propertyName: "setType",
                  mapping: {
                    strength: "#/components/schemas/CreateStrengthSetBody",
                    cardio: "#/components/schemas/CreateCardioSetBody",
                    hiit: "#/components/schemas/CreateHiitSetBody",
                    yoga: "#/components/schemas/CreateMindBodySetBody",
                    pilates: "#/components/schemas/CreateMindBodySetBody",
                    mobility: "#/components/schemas/CreateMindBodySetBody",
                  },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "Created set",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/WorkoutSet" },
              },
            },
          },
          400: badRequest,
          401: unauthorized,
          404: notFound,
          409: conflict,
        },
      },
    },
    "/api/templates/{templateId}/exercises/{templateExerciseId}/sets/{setId}": {
      patch: {
        summary: "Update a planned set",
        tags: ["Templates"],
        security: bearerAuth,
        parameters: [
          {
            in: "path",
            name: "templateId",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
          {
            in: "path",
            name: "templateExerciseId",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
          {
            in: "path",
            name: "setId",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                oneOf: [
                  { $ref: "#/components/schemas/UpdateStrengthSetBody" },
                  { $ref: "#/components/schemas/UpdateCardioSetBody" },
                  { $ref: "#/components/schemas/UpdateHiitSetBody" },
                  { $ref: "#/components/schemas/UpdateMindBodySetBody" },
                ],
                discriminator: {
                  propertyName: "setType",
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Updated set",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/WorkoutSet" },
              },
            },
          },
          400: badRequest,
          401: unauthorized,
          404: notFound,
        },
      },
      delete: {
        summary: "Delete a planned set",
        tags: ["Templates"],
        security: bearerAuth,
        parameters: [
          {
            in: "path",
            name: "templateId",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
          {
            in: "path",
            name: "templateExerciseId",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
          {
            in: "path",
            name: "setId",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: {
          204: { description: "Deleted successfully" },
          401: unauthorized,
          404: notFound,
        },
      },
    },
    "/api/plans": {
      get: {
        summary: "List workout plans for the authenticated user",
        tags: ["Plans"],
        security: bearerAuth,
        responses: {
          200: {
            description: "Array of plans",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/WorkoutPlan" },
                },
              },
            },
          },
          401: unauthorized,
        },
      },
      post: {
        summary: "Create a workout plan from a template",
        description:
          "All main exercises in the template must have at least one set defined. Returns 422 if this condition is not met.",
        tags: ["Plans"],
        security: bearerAuth,
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreatePlanBody" },
            },
          },
        },
        responses: {
          201: {
            description: "Created plan",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/WorkoutPlan" },
              },
            },
          },
          400: badRequest,
          401: unauthorized,
          404: notFound,
          422: {
            description: "Template incomplete — a main exercise has no sets",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
    "/api/plans/{id}": {
      get: {
        summary: "Get a workout plan by ID",
        tags: ["Plans"],
        security: bearerAuth,
        parameters: [idParam],
        responses: {
          200: {
            description: "The plan",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/WorkoutPlan" },
              },
            },
          },
          401: unauthorized,
          404: notFound,
        },
      },
      delete: {
        summary: "Delete a workout plan",
        tags: ["Plans"],
        security: bearerAuth,
        parameters: [idParam],
        responses: {
          204: { description: "Deleted successfully" },
          401: unauthorized,
          404: notFound,
        },
      },
    },
    "/api/plans/{planId}/workouts": {
      post: {
        summary: "Start a workout from a plan",
        description:
          "Creates a workout pre-populated with the plan's template exercises.",
        tags: ["Plans"],
        security: bearerAuth,
        parameters: [
          {
            in: "path",
            name: "planId",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/StartWorkoutFromPlanBody" },
            },
          },
        },
        responses: {
          201: {
            description: "Created workout with exercises",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/WorkoutWithExercises" },
              },
            },
          },
          400: badRequest,
          401: unauthorized,
          403: forbidden,
          404: notFound,
        },
      },
      get: {
        summary: "List workouts for a plan",
        tags: ["Plans"],
        security: bearerAuth,
        parameters: [
          {
            in: "path",
            name: "planId",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: {
          200: {
            description: "Array of workouts linked to the plan",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Workout" },
                },
              },
            },
          },
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
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Exercise" },
                },
              },
            },
          },
          401: unauthorized,
        },
      },
      post: {
        summary: "Create an exercise (admin only)",
        tags: ["Exercises"],
        security: bearerAuth,
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateExerciseBody" },
            },
          },
        },
        responses: {
          201: {
            description: "Created exercise",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Exercise" },
              },
            },
          },
          400: badRequest,
          401: unauthorized,
          403: forbidden,
          409: conflict,
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
              "application/json": {
                schema: { $ref: "#/components/schemas/Exercise" },
              },
            },
          },
          401: unauthorized,
          404: notFound,
        },
      },
      patch: {
        summary: "Update an exercise (admin only)",
        tags: ["Exercises"],
        security: bearerAuth,
        parameters: [idParam],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateExerciseBody" },
            },
          },
        },
        responses: {
          200: {
            description: "Updated exercise",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Exercise" },
              },
            },
          },
          400: badRequest,
          401: unauthorized,
          403: forbidden,
          404: notFound,
          409: conflict,
        },
      },
      delete: {
        summary: "Delete an exercise (admin only)",
        tags: ["Exercises"],
        security: bearerAuth,
        parameters: [idParam],
        responses: {
          204: { description: "Deleted successfully" },
          401: unauthorized,
          403: forbidden,
          404: notFound,
        },
      },
    },
  },
};
