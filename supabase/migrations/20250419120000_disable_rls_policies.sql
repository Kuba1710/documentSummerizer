/*
 * Migration: Disable RLS Policies
 * Purpose: Disable all Row Level Security (RLS) policies for SciSummarize schema
 * This migration drops all RLS policies created in the initial schema setup
 */

-- drop all policies for users table
drop policy if exists users_anon_policy on scisummarize.users;
drop policy if exists users_select_policy on scisummarize.users;
drop policy if exists users_update_policy on scisummarize.users;

-- drop all policies for documents table
drop policy if exists documents_anon_policy on scisummarize.documents;
drop policy if exists documents_select_policy on scisummarize.documents;
drop policy if exists documents_insert_policy on scisummarize.documents;
drop policy if exists documents_update_policy on scisummarize.documents;
drop policy if exists documents_delete_policy on scisummarize.documents;

-- drop all policies for summaries table
drop policy if exists summaries_anon_policy on scisummarize.summaries;
drop policy if exists summaries_select_policy on scisummarize.summaries;
drop policy if exists summaries_insert_policy on scisummarize.summaries;
drop policy if exists summaries_update_policy on scisummarize.summaries;
drop policy if exists summaries_delete_policy on scisummarize.summaries;

-- drop all policies for feedback table
drop policy if exists feedback_anon_policy on scisummarize.feedback;
drop policy if exists feedback_select_policy on scisummarize.feedback;
drop policy if exists feedback_insert_policy on scisummarize.feedback;
drop policy if exists feedback_update_policy on scisummarize.feedback;
drop policy if exists feedback_delete_policy on scisummarize.feedback;

-- comment: we're only disabling the policies, not the RLS protection itself
-- if you want to completely disable RLS, uncomment these lines:
-- alter table scisummarize.users disable row level security;
-- alter table scisummarize.documents disable row level security;
-- alter table scisummarize.summaries disable row level security;
-- alter table scisummarize.feedback disable row level security; 