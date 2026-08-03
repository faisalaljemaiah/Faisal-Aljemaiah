-- OP Interns — Migration 0005: Reference data (badges)
-- Reference/lookup data only — no fake user, schedule, or clinical content.

insert into public.badges (name, description, icon, points_threshold) values
  ('First Steps', 'Earned your first points on the platform', 'footprints', 1),
  ('Quiz Novice', 'Reached 50 total points', 'brain', 50),
  ('Rising Intern', 'Reached 150 total points', 'trending-up', 150),
  ('Clinical Scholar', 'Reached 300 total points', 'graduation-cap', 300),
  ('Counseling Pro', 'Reached 500 total points', 'stethoscope', 500),
  ('OP Interns Elite', 'Reached 1000 total points', 'trophy', 1000)
on conflict (name) do nothing;
