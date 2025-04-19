/*
 * Migration: Create SciSummarize MVP Schema
 * Purpose: Initial database setup for SciSummarize application
 * Tables Created: users, documents, summaries, feedback
 * Functions Created: current_user_id, set_document_expiration, manage_summary_versions, delete_expired_documents
 * Security: Implements Row Level Security (RLS) for all tables
 */

-- create schema for better organization
create schema if not exists scisummarize;

-- create extension for uuid generation if not exists
create extension if not exists "pgcrypto";

-- users table to store basic user authentication information
create table scisummarize.users (
    id uuid primary key default gen_random_uuid(),
    username varchar(50) not null unique check (length(username) >= 3),
    password_hash varchar(100) not null,
    created_at timestamp not null default current_timestamp
);

-- documents table to store references to PDF files
create table scisummarize.documents (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references scisummarize.users(id) on delete cascade,
    title varchar(255) not null,
    file_path varchar(255) not null,
    file_size_kb integer not null check (file_size_kb <= 10240), -- max 10MB (10240KB)
    upload_timestamp timestamp not null default current_timestamp,
    expiration_timestamp timestamp not null default (current_timestamp + interval '24 hours')
);

-- summaries table to store AI-generated document summaries
create table scisummarize.summaries (
    id uuid primary key default gen_random_uuid(),
    document_id uuid not null references scisummarize.documents(id) on delete cascade,
    content text not null,
    version integer not null default 1,
    is_current boolean not null default true,
    created_at timestamp not null default current_timestamp
);

-- feedback table to store user feedback on summaries
create table scisummarize.feedback (
    id uuid primary key default gen_random_uuid(),
    summary_id uuid not null references scisummarize.summaries(id) on delete cascade,
    is_accepted boolean not null,
    feedback_timestamp timestamp not null default current_timestamp,
    unique(summary_id) -- ensure only one feedback per summary
);

-- create indexes for performance optimization
-- index on username for fast user lookups
create index idx_users_username on scisummarize.users(username);

-- index on user_id for quick filtering of user's documents
create index idx_documents_user_id on scisummarize.documents(user_id);

-- index on upload_timestamp for efficient document sorting
create index idx_documents_upload_timestamp on scisummarize.documents(upload_timestamp);

-- index on expiration_timestamp for quickly finding expired documents
create index idx_documents_expiration on scisummarize.documents(expiration_timestamp);

-- index on document_id for quick retrieval of a document's summaries
create index idx_summaries_document_id on scisummarize.summaries(document_id);

-- index for quickly finding current summaries
create index idx_summaries_is_current on scisummarize.summaries(is_current);

-- compound index for finding the current version of a document's summary
create index idx_summaries_document_current on scisummarize.summaries(document_id, is_current) where is_current = true;

-- helper function to get current user's id from session variable
create or replace function scisummarize.current_user_id()
returns uuid
language sql
stable
as $$
    select cast(current_setting('app.current_user_id', true) as uuid);
$$;

-- function to automatically set document expiration time
create or replace function scisummarize.set_document_expiration()
returns trigger
language plpgsql
as $$
begin
    new.expiration_timestamp := new.upload_timestamp + interval '24 hours';
    return new;
end;
$$;

-- trigger to set expiration timestamp on document insertion
create trigger trg_set_document_expiration
before insert on scisummarize.documents
for each row
execute function scisummarize.set_document_expiration();

-- function to manage summary versions, ensuring only one current version exists
create or replace function scisummarize.manage_summary_versions()
returns trigger
language plpgsql
as $$
begin
    -- set is_current=false for all previous summaries of this document
    update scisummarize.summaries
    set is_current = false
    where document_id = new.document_id and id != new.id;
    
    return new;
end;
$$;

-- trigger to manage summary versions on insertion
create trigger trg_manage_summary_versions
after insert on scisummarize.summaries
for each row
execute function scisummarize.manage_summary_versions();

-- function to delete expired documents
create or replace function scisummarize.delete_expired_documents()
returns integer
language plpgsql
as $$
declare
    deleted_count integer;
begin
    with deleted as (
        delete from scisummarize.documents
        where expiration_timestamp <= current_timestamp
        returning id
    )
    select count(*) into deleted_count from deleted;
    
    return deleted_count;
end;
$$;

-- enable row level security on all tables
alter table scisummarize.users enable row level security;
alter table scisummarize.documents enable row level security;
alter table scisummarize.summaries enable row level security;
alter table scisummarize.feedback enable row level security;

-- rls policy for users table - anon role cannot access user data
create policy users_anon_policy on scisummarize.users
    for all
    to anon
    using (false);

-- rls policy for users table - authenticated users can only see their own records
create policy users_select_policy on scisummarize.users
    for select
    to authenticated
    using (id = scisummarize.current_user_id());

-- rls policy for users table - authenticated users can only update their own records
create policy users_update_policy on scisummarize.users
    for update
    to authenticated
    using (id = scisummarize.current_user_id());

-- rls policy for documents table - anon role cannot access document data
create policy documents_anon_policy on scisummarize.documents
    for all
    to anon
    using (false);

-- rls policy for documents table - authenticated users can only select their own documents
create policy documents_select_policy on scisummarize.documents
    for select
    to authenticated
    using (user_id = scisummarize.current_user_id());

-- rls policy for documents table - authenticated users can only insert their own documents
create policy documents_insert_policy on scisummarize.documents
    for insert
    to authenticated
    with check (user_id = scisummarize.current_user_id());

-- rls policy for documents table - authenticated users can only update their own documents
create policy documents_update_policy on scisummarize.documents
    for update
    to authenticated
    using (user_id = scisummarize.current_user_id());

-- rls policy for documents table - authenticated users can only delete their own documents
create policy documents_delete_policy on scisummarize.documents
    for delete
    to authenticated
    using (user_id = scisummarize.current_user_id());

-- rls policy for summaries table - anon role cannot access summary data
create policy summaries_anon_policy on scisummarize.summaries
    for all
    to anon
    using (false);

-- rls policy for summaries table - authenticated users can only select summaries of their documents
create policy summaries_select_policy on scisummarize.summaries
    for select
    to authenticated
    using (document_id in (select id from scisummarize.documents where user_id = scisummarize.current_user_id()));

-- rls policy for summaries table - authenticated users can only insert summaries for their documents
create policy summaries_insert_policy on scisummarize.summaries
    for insert
    to authenticated
    with check (document_id in (select id from scisummarize.documents where user_id = scisummarize.current_user_id()));

-- rls policy for summaries table - authenticated users can only update summaries of their documents
create policy summaries_update_policy on scisummarize.summaries
    for update
    to authenticated
    using (document_id in (select id from scisummarize.documents where user_id = scisummarize.current_user_id()));

-- rls policy for summaries table - authenticated users can only delete summaries of their documents
create policy summaries_delete_policy on scisummarize.summaries
    for delete
    to authenticated
    using (document_id in (select id from scisummarize.documents where user_id = scisummarize.current_user_id()));

-- rls policy for feedback table - anon role cannot access feedback data
create policy feedback_anon_policy on scisummarize.feedback
    for all
    to anon
    using (false);

-- rls policy for feedback table - authenticated users can only select feedback for their summaries
create policy feedback_select_policy on scisummarize.feedback
    for select
    to authenticated
    using (summary_id in (
        select s.id from scisummarize.summaries s
        join scisummarize.documents d on s.document_id = d.id
        where d.user_id = scisummarize.current_user_id()
    ));

-- rls policy for feedback table - authenticated users can only insert feedback for their summaries
create policy feedback_insert_policy on scisummarize.feedback
    for insert
    to authenticated
    with check (summary_id in (
        select s.id from scisummarize.summaries s
        join scisummarize.documents d on s.document_id = d.id
        where d.user_id = scisummarize.current_user_id()
    ));

-- rls policy for feedback table - authenticated users can only update feedback for their summaries
create policy feedback_update_policy on scisummarize.feedback
    for update
    to authenticated
    using (summary_id in (
        select s.id from scisummarize.summaries s
        join scisummarize.documents d on s.document_id = d.id
        where d.user_id = scisummarize.current_user_id()
    ));

-- rls policy for feedback table - authenticated users can only delete feedback for their summaries
create policy feedback_delete_policy on scisummarize.feedback
    for delete
    to authenticated
    using (summary_id in (
        select s.id from scisummarize.summaries s
        join scisummarize.documents d on s.document_id = d.id
        where d.user_id = scisummarize.current_user_id()
    )); 