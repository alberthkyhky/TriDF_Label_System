-- Complete Database Schema for Labeling System
-- Run this in Supabase SQL Editor to set up the database

-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Create custom types
CREATE TYPE task_status AS ENUM ('draft', 'active', 'paused', 'completed');
CREATE TYPE question_status AS ENUM ('pending', 'labeled', 'reviewed', 'approved');
CREATE TYPE media_type AS ENUM ('image', 'video', 'audio');
CREATE TYPE user_role AS ENUM ('admin', 'labeler', 'reviewer');
CREATE TYPE check_type AS ENUM ('honeypot', 'consensus', 'audit', 'speed_check', 'suspicious_activity');

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Label classes/categories that can be assigned
CREATE TABLE label_classes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    color_hex TEXT DEFAULT '#667eea',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Tasks table - Main labeling tasks
CREATE TABLE tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    status task_status DEFAULT 'draft',
    created_by UUID REFERENCES auth.users(id),
    
    -- Rule/standard reference for consistent labeling
    rule_image_path TEXT,
    rule_description TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deadline TIMESTAMP WITH TIME ZONE,
    
    -- Task configuration
    questions_per_user INTEGER DEFAULT 100,
    required_agreements INTEGER DEFAULT 1,
    
    -- Additional metadata
    metadata JSONB DEFAULT '{}'::jsonb
);

-- User assignments to tasks with specific classes and quotas
CREATE TABLE task_assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    
    -- Classes this user should label in this task (array of label_class IDs)
    assigned_classes UUID[],
    
    -- Quota management
    target_labels INTEGER NOT NULL,
    completed_labels INTEGER DEFAULT 0,
    
    -- Timestamps
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true
);

-- Questions within tasks (the actual labeling units)
CREATE TABLE questions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    
    -- Question details
    question_text TEXT,
    question_order INTEGER,
    status question_status DEFAULT 'pending',
    
    -- Which classes this question is about (array of label_class IDs)
    target_classes UUID[],
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Media files associated with questions (2-3 per question)
CREATE TABLE question_media (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
    
    -- File information
    file_path TEXT NOT NULL,
    media_type media_type NOT NULL,
    file_size BIGINT,
    mime_type TEXT,
    
    -- Order within the question (1st image, 2nd audio, etc.)
    display_order INTEGER DEFAULT 1,
    
    -- Media-specific metadata
    duration_seconds DECIMAL(10,3), -- For video/audio
    width INTEGER,                  -- For images/video
    height INTEGER,                 -- For images/video
    
    -- Timestamps
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Available answer choices for each question
CREATE TABLE answer_choices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
    label_class_id UUID REFERENCES label_classes(id),
    
    -- Choice details
    choice_text TEXT NOT NULL,
    choice_value TEXT NOT NULL,
    display_order INTEGER DEFAULT 1,
    
    -- For quality control (honeypot questions)
    is_correct BOOLEAN,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User responses to questions
CREATE TABLE question_responses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    task_assignment_id UUID REFERENCES task_assignments(id),
    
    -- The actual response (array of answer_choice IDs)
    selected_choices UUID[],
    confidence_level INTEGER CHECK (confidence_level >= 1 AND confidence_level <= 5),
    
    -- Timing data
    time_spent_seconds INTEGER,
    started_at TIMESTAMP WITH TIME ZONE,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Quality flags
    is_honeypot_response BOOLEAN DEFAULT false,
    is_flagged BOOLEAN DEFAULT false,
    flag_reason TEXT,
    
    -- Additional data
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Quality control and honeypot questions
CREATE TABLE quality_control (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    question_id UUID REFERENCES questions(id),
    
    -- Honeypot configuration
    is_honeypot BOOLEAN DEFAULT false,
    expected_choices UUID[], -- Correct answer choice IDs for honeypots
    
    -- Consensus tracking
    required_agreements INTEGER DEFAULT 1,
    current_agreements INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quality checks and results
CREATE TABLE quality_checks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    task_id UUID REFERENCES tasks(id),
    question_id UUID REFERENCES questions(id),
    annotation_id UUID REFERENCES question_responses(id),
    
    -- Check details
    check_type check_type NOT NULL,
    passed BOOLEAN NOT NULL,
    score DECIMAL(5,2), -- Accuracy score (0-100)
    
    -- For honeypot checks
    expected_result JSONB,
    actual_result JSONB,
    
    -- Flagging
    flag_reason TEXT,
    
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- User statistics for performance tracking
CREATE TABLE user_stats (
    user_id UUID REFERENCES auth.users(id) PRIMARY KEY,
    
    -- Overall counters
    total_questions_labeled INTEGER DEFAULT 0,
    total_annotations INTEGER DEFAULT 0,
    total_time_spent_seconds BIGINT DEFAULT 0,
    accuracy_score DECIMAL(5,2) DEFAULT 100.00,
    
    -- Time-based counters
    labels_today INTEGER DEFAULT 0,
    labels_this_week INTEGER DEFAULT 0,
    labels_this_month INTEGER DEFAULT 0,
    
    -- Performance metrics
    average_time_per_question DECIMAL(8,2),
    consistency_score DECIMAL(5,2) DEFAULT 100.00,
    streak_days INTEGER DEFAULT 0,
    
    -- Status flags
    is_flagged BOOLEAN DEFAULT false,
    flag_reason TEXT,
    
    -- Timestamps
    last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User profiles (extends Supabase auth.users)
CREATE TABLE user_profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT NOT NULL,
    full_name TEXT,
    role user_role DEFAULT 'labeler',
    
    -- User preferences
    preferred_classes UUID[], -- Array of preferred label_class IDs
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- ============================================================================
-- ADDITIONAL TABLES FOR FILE MANAGEMENT
-- ============================================================================

-- Uploaded files metadata (for file management)
CREATE TABLE uploaded_files (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    filename TEXT NOT NULL,
    unique_filename TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT NOT NULL, -- 'image', 'video', 'audio'
    file_size BIGINT NOT NULL,
    mime_type TEXT,
    
    -- Upload info
    uploaded_by UUID REFERENCES auth.users(id),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Usage tracking
    used_in_questions INTEGER DEFAULT 0,
    is_deleted BOOLEAN DEFAULT false,
    
    metadata JSONB DEFAULT '{}'::jsonb
);

-- ============================================================================
-- PERFORMANCE INDEXES
-- ============================================================================

-- Primary performance indexes
CREATE INDEX idx_task_assignments_user_id ON task_assignments(user_id);
CREATE INDEX idx_task_assignments_task_id ON task_assignments(task_id);
CREATE INDEX idx_questions_task_id ON questions(task_id);
CREATE INDEX idx_questions_status ON questions(status);
CREATE INDEX idx_question_media_question_id ON question_media(question_id);
CREATE INDEX idx_answer_choices_question_id ON answer_choices(question_id);
CREATE INDEX idx_question_responses_user_id ON question_responses(user_id);
CREATE INDEX idx_question_responses_question_id ON question_responses(question_id);
CREATE INDEX idx_question_responses_submitted_at ON question_responses(submitted_at);
CREATE INDEX idx_quality_checks_user_id ON quality_checks(user_id);
CREATE INDEX idx_quality_checks_timestamp ON quality_checks(timestamp);
CREATE INDEX idx_uploaded_files_type ON uploaded_files(file_type);
CREATE INDEX idx_uploaded_files_uploaded_by ON uploaded_files(uploaded_by);

-- Composite indexes for common queries
CREATE INDEX idx_task_assignments_user_active ON task_assignments(user_id, is_active);
CREATE INDEX idx_questions_task_order ON questions(task_id, question_order);
CREATE INDEX idx_question_media_question_order ON question_media(question_id, display_order);
CREATE INDEX idx_quality_checks_user_type ON quality_checks(user_id, check_type);

-- ============================================================================
-- TRIGGERS AND FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_tasks_updated_at 
    BEFORE UPDATE ON tasks 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_questions_updated_at 
    BEFORE UPDATE ON questions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON user_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_stats_updated_at 
    BEFORE UPDATE ON user_stats 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_label_classes_updated_at 
    BEFORE UPDATE ON label_classes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update user stats when response is submitted
CREATE OR REPLACE FUNCTION update_user_stats_on_response()
RETURNS TRIGGER AS $$
BEGIN
    -- Update user stats
    INSERT INTO user_stats (
        user_id, 
        total_questions_labeled, 
        total_annotations,
        labels_today, 
        labels_this_week, 
        labels_this_month
    )
    VALUES (NEW.user_id, 1, 1, 1, 1, 1)
    ON CONFLICT (user_id) DO UPDATE SET
        total_questions_labeled = user_stats.total_questions_labeled + 1,
        total_annotations = user_stats.total_annotations + 1,
        labels_today = CASE 
            WHEN DATE(user_stats.updated_at) = CURRENT_DATE 
            THEN user_stats.labels_today + 1 
            ELSE 1 
        END,
        labels_this_week = user_stats.labels_this_week + 1,
        labels_this_month = user_stats.labels_this_month + 1,
        last_active = NOW(),
        updated_at = NOW();
    
    -- Update task assignment progress
    UPDATE task_assignments 
    SET completed_labels = completed_labels + 1,
        completed_at = CASE 
            WHEN completed_labels + 1 >= target_labels THEN NOW() 
            ELSE completed_at 
        END
    WHERE id = NEW.task_assignment_id;
    
    RETURN NEW;
END;
$$ language plpgsql;

-- Trigger for updating stats on response submission
CREATE TRIGGER on_question_response_submitted
    AFTER INSERT ON question_responses
    FOR EACH ROW EXECUTE FUNCTION update_user_stats_on_response();

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, full_name)
    VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
    
    INSERT INTO public.user_stats (user_id)
    VALUES (new.id);
    
    RETURN new;
END;
$$ language plpgsql security definer;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE answer_choices ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_control ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE label_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE uploaded_files ENABLE ROW LEVEL SECURITY;

-- Task access policy
CREATE POLICY "task_access_policy" ON tasks FOR SELECT USING (
    created_by = auth.uid() OR
    EXISTS (SELECT 1 FROM task_assignments WHERE task_id = tasks.id AND user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Task assignment policies
CREATE POLICY "assignment_access_policy" ON task_assignments FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Question access policy
CREATE POLICY "question_access_policy" ON questions FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM task_assignments 
        WHERE task_id = questions.task_id AND user_id = auth.uid()
    ) OR
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Question media access policy
CREATE POLICY "question_media_access_policy" ON question_media FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM questions q
        JOIN task_assignments ta ON q.task_id = ta.task_id
        WHERE q.id = question_media.question_id AND ta.user_id = auth.uid()
    ) OR
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Answer choices access policy
CREATE POLICY "answer_choices_access_policy" ON answer_choices FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM questions q
        JOIN task_assignments ta ON q.task_id = ta.task_id
        WHERE q.id = answer_choices.question_id AND ta.user_id = auth.uid()
    ) OR
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Question responses policy
CREATE POLICY "response_access_policy" ON question_responses FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "response_insert_policy" ON question_responses FOR INSERT WITH CHECK (
    user_id = auth.uid()
);

-- User profiles policy
CREATE POLICY "profile_access_policy" ON user_profiles FOR SELECT USING (
    id = auth.uid() OR
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "profile_update_policy" ON user_profiles FOR UPDATE USING (
    id = auth.uid()
);

-- User stats policy
CREATE POLICY "stats_access_policy" ON user_stats FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Label classes policy (readable by all authenticated users)
CREATE POLICY "label_classes_access_policy" ON label_classes FOR SELECT USING (
    auth.role() = 'authenticated'
);

-- Uploaded files policy
CREATE POLICY "uploaded_files_access_policy" ON uploaded_files FOR SELECT USING (
    uploaded_by = auth.uid() OR
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Quality control policies (admin only)
CREATE POLICY "quality_control_admin_policy" ON quality_control FOR ALL USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "quality_checks_access_policy" ON quality_checks FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ============================================================================
-- SAMPLE DATA FOR TESTING
-- ============================================================================

-- Insert sample label classes
INSERT INTO label_classes (name, description, color_hex) VALUES
('Person', 'Human beings in any form', '#ff5722'),
('Animal', 'Any type of animal', '#4caf50'),
('Vehicle', 'Cars, trucks, motorcycles, etc.', '#2196f3'),
('Object', 'Inanimate objects', '#ff9800'),
('Nature', 'Trees, plants, landscapes', '#8bc34a'),
('Building', 'Houses, offices, structures', '#9c27b0'),
('Text', 'Written text or signage', '#607d8b'),
('Food', 'Food items and beverages', '#f44336');

-- Sample task (admin user must exist first)
-- Note: Replace 'admin@example.com' with actual admin email after user signup
DO $$
DECLARE
    admin_user_id UUID;
    sample_task_id UUID;
    sample_question_id UUID;
BEGIN
    -- Get admin user ID (if exists)
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE email = 'admin@example.com' 
    LIMIT 1;
    
    -- Only create sample data if admin user exists
    IF admin_user_id IS NOT NULL THEN
        -- Create sample task
        INSERT INTO tasks (title, description, rule_description, questions_per_user, created_by) 
        VALUES (
            'Sample Image Labeling Task',
            'Label objects in uploaded images for machine learning training',
            'Please identify all visible objects in each image. Select all applicable categories from the choices provided. Focus on clearly visible objects and avoid labeling partially obscured items unless you are confident of the identification.',
            50,
            admin_user_id
        ) RETURNING id INTO sample_task_id;
        
        -- Create sample question
        INSERT INTO questions (task_id, question_text, question_order, target_classes) 
        VALUES (
            sample_task_id,
            'What objects do you see in this image?',
            1,
            ARRAY[
                (SELECT id FROM label_classes WHERE name = 'Person'),
                (SELECT id FROM label_classes WHERE name = 'Vehicle'),
                (SELECT id FROM label_classes WHERE name = 'Object')
            ]
        ) RETURNING id INTO sample_question_id;
        
        -- Create sample answer choices
        INSERT INTO answer_choices (question_id, label_class_id, choice_text, choice_value, display_order) VALUES
        (sample_question_id, (SELECT id FROM label_classes WHERE name = 'Person'), 'Contains Person', 'person', 1),
        (sample_question_id, (SELECT id FROM label_classes WHERE name = 'Vehicle'), 'Contains Vehicle', 'vehicle', 2),
        (sample_question_id, (SELECT id FROM label_classes WHERE name = 'Object'), 'Contains Object', 'object', 3),
        (sample_question_id, NULL, 'None of the above', 'none', 4);
        
        -- Mark one question as honeypot for testing
        INSERT INTO quality_control (question_id, is_honeypot, expected_choices) 
        VALUES (
            sample_question_id, 
            true, 
            ARRAY[(SELECT id FROM answer_choices WHERE question_id = sample_question_id AND choice_value = 'person')]
        );
    END IF;
END $$;

-- ============================================================================
-- MAINTENANCE FUNCTIONS
-- ============================================================================

-- Function to reset daily stats (run daily via cron job)
CREATE OR REPLACE FUNCTION reset_daily_stats()
RETURNS void AS $$
BEGIN
    UPDATE user_stats SET labels_today = 0;
END;
$$ language plpgsql;

-- Function to reset weekly stats (run weekly via cron job)
CREATE OR REPLACE FUNCTION reset_weekly_stats()
RETURNS void AS $$
BEGIN
    UPDATE user_stats SET labels_this_week = 0;
END;
$$ language plpgsql;

-- Function to reset monthly stats (run monthly via cron job)
CREATE OR REPLACE FUNCTION reset_monthly_stats()
RETURNS void AS $$
BEGIN
    UPDATE user_stats SET labels_this_month = 0;
END;
$$ language plpgsql;

-- Function to calculate user streaks (run daily)
CREATE OR REPLACE FUNCTION calculate_user_streaks()
RETURNS void AS $$
BEGIN
    UPDATE user_stats 
    SET streak_days = CASE
        WHEN DATE(last_active) = CURRENT_DATE - INTERVAL '1 day' THEN streak_days + 1
        WHEN DATE(last_active) = CURRENT_DATE THEN streak_days
        ELSE 0
    END;
END;
$$ language plpgsql;

-- ============================================================================
-- SCHEMA VALIDATION
-- ============================================================================

-- Verify all tables were created
DO $$
DECLARE
    table_count INTEGER;
    expected_tables TEXT[] := ARRAY[
        'label_classes', 'tasks', 'task_assignments', 'questions', 
        'question_media', 'answer_choices', 'question_responses', 
        'quality_control', 'quality_checks', 'user_stats', 
        'user_profiles', 'uploaded_files'
    ];
BEGIN
    SELECT COUNT(*) INTO table_count 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = ANY(expected_tables);
    
    IF table_count = array_length(expected_tables, 1) THEN
        RAISE NOTICE 'SUCCESS: All % tables created successfully', table_count;
    ELSE
        RAISE NOTICE 'WARNING: Expected % tables, found %', array_length(expected_tables, 1), table_count;
    END IF;
END $$;

-- Display schema summary
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
    'label_classes', 'tasks', 'task_assignments', 'questions', 
    'question_media', 'answer_choices', 'question_responses', 
    'quality_control', 'quality_checks', 'user_stats', 
    'user_profiles', 'uploaded_files'
)
ORDER BY tablename;