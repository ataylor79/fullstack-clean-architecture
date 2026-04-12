## ideas and thoughts

- Use strategy pattern to create different structures of sets for different types of workouts
  - strength workout -> reps, sets, weight, rest time
    - cardio workout -> type, distance, time, intensity
    - HIIT -> time
  - using this pattern, would it make more sense to have a table per workout type in the DB

- Create workout as template to use on multiple days, over a number of weeks
  - remove schedule date
  - add template to multiple days as part of workout plan
  - be able to update weight when using the workout 
  - be able to mark exercise as completed

- workouts
  - be able to add different weights for different sets, per exercise.