export interface UserProfile {
    id: string;
    email: string;
    full_name?: string;
    role: 'admin' | 'labeler' | 'reviewer';
    preferred_classes?: string[];
    created_at: string;
    updated_at: string;
  }
  
  export interface UserStats {
    total_questions_labeled: number;
    accuracy_score: number;
    labels_today: number;
    labels_this_week: number;
    labels_this_month: number;
    average_time_per_question?: number;
    last_active: string;
  }
  
  export interface AuthContextType {
    user: UserProfile | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string, fullName: string) => Promise<void>;
    signOut: () => Promise<void>;
    updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  }