-- OP Interns — Pharmacy Intern Management Platform
-- Migration 0001: Extensions & enum types

create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";

create type user_role as enum ('admin', 'preceptor', 'intern');

create type shift_status as enum ('scheduled', 'confirmed', 'completed', 'missed', 'excused', 'late');

create type announcement_priority as enum ('low', 'normal', 'high', 'urgent');

create type reflection_status as enum ('draft', 'submitted', 'reviewed');

create type case_difficulty as enum ('beginner', 'intermediate', 'advanced');

create type notification_type as enum (
  'shift', 'announcement', 'drug_of_day', 'reflection', 'counseling', 'badge', 'system'
);
