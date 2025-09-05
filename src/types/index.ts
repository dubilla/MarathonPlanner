export interface User {
  id: string;
  email: string;
  display_name: string;
  created_at: string;
  updated_at: string;
}

export interface TrainingPlan {
  id: string;
  user_id: string;
  name: string;
  description: string;
  marathon_date: string;
  goal_time?: string;
  total_weeks: number;
  created_at: string;
  updated_at: string;
  weeks?: TrainingWeek[];
}

export interface TrainingWeek {
  id: string;
  plan_id: string;
  week_number: number;
  start_date: string;
  target_mileage: number;
  actual_mileage?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  training_days?: TrainingDay[];
}

export interface TrainingDay {
  id: string;
  week_id: string;
  day_of_week: number;
  date: string;
  workout_id?: string;
  actual_miles?: number;
  actual_notes?: string;
  completed: boolean;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  workout?: Workout;
}

export interface Workout {
  id: string;
  miles: number;
  description: string;
  is_workout: boolean;
  created_at: string;
  updated_at: string;
}

export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Omit<User, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<User, "id" | "created_at" | "updated_at">>;
      };
      training_plans: {
        Row: TrainingPlan;
        Insert: Omit<TrainingPlan, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<TrainingPlan, "id" | "created_at" | "updated_at">>;
      };
      training_weeks: {
        Row: TrainingWeek;
        Insert: Omit<TrainingWeek, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<TrainingWeek, "id" | "created_at" | "updated_at">>;
      };
      workouts: {
        Row: Workout;
        Insert: Omit<Workout, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Workout, "id" | "created_at" | "updated_at">>;
      };
    };
  };
}
