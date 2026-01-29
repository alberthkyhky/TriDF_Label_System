-- Database Migration Script
-- This script removes the assigned_classes and assignment_type fields from task_assignments table
-- Run this in your Supabase SQL editor or PostgreSQL client

-- First, check if the columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'task_assignments' 
AND table_schema = 'public';

-- Remove assigned_classes column if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'task_assignments' 
        AND column_name = 'assigned_classes'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.task_assignments DROP COLUMN assigned_classes;
        RAISE NOTICE 'Column assigned_classes dropped successfully';
    ELSE
        RAISE NOTICE 'Column assigned_classes does not exist';
    END IF;
END $$;

-- Remove assignment_type column if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'task_assignments' 
        AND column_name = 'assignment_type'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.task_assignments DROP COLUMN assignment_type;
        RAISE NOTICE 'Column assignment_type dropped successfully';
    ELSE
        RAISE NOTICE 'Column assignment_type does not exist';
    END IF;
END $$;

-- Ensure question_range_start and question_range_end columns exist with correct defaults
DO $$
BEGIN
    -- Add question_range_start if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'task_assignments' 
        AND column_name = 'question_range_start'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.task_assignments ADD COLUMN question_range_start INTEGER NOT NULL DEFAULT 1;
        RAISE NOTICE 'Column question_range_start added';
    END IF;

    -- Add question_range_end if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'task_assignments' 
        AND column_name = 'question_range_end'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.task_assignments ADD COLUMN question_range_end INTEGER NOT NULL DEFAULT 1;
        RAISE NOTICE 'Column question_range_end added';
    END IF;
END $$;

-- Check for any triggers that might reference the old fields
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'task_assignments'
AND trigger_schema = 'public';

-- Display final table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'task_assignments' 
AND table_schema = 'public'
ORDER BY ordinal_position;