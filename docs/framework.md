# Application framework

The application must be easy to read and maintain. This is a simple web app using well known frameworks and a familiar structure.

## API
The api should be easy to run within a docker container, and should provide access to postgres admin server to allow the engineer to query data. Table should be well normalised and easy to change. Document the API using swagger.

## Structure
    - Use pnpm workspaces to separate shared, api and web app
    - Use clean architecture patterns for the api and web app
    - structure the web app using a feature pattern

## Frameworks
    - React
    - Tailwind
    - vite
    - vitest
    - Tanstack
    - react router

## Testing
    - prompt engineer to use TDD to ensure correct requirements and faster feedback loop.

## Language
    - Typescript - functional approach. Do not use classes
    - SQL

## Database
    - postgres
    - knex