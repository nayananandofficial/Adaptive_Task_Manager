/*
  # Create templates table

  1. New Tables
    - `templates`
      - `id` (uuid, primary key, default gen_random_uuid())
      - `title` (text, not null)
      - `description` (text, nullable)
      - `role` (text, constrained to valid roles + general)
      - `template_data` (jsonb, not null)
      - `is_public` (boolean, default true)
      - `created_by` (uuid, nullable, references users.id)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `templates`
    - Public templates are readable by authenticated users
    - Users can manage their own templates
*/

CREATE TABLE IF NOT EXISTS templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  role text NOT NULL CHECK (role IN ('student', 'teacher', 'writer', 'freelancer', 'project_manager', 'general')),
  template_data jsonb NOT NULL,
  is_public boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read public templates"
  ON templates
  FOR SELECT
  TO authenticated
  USING (is_public = true OR created_by = auth.uid());

CREATE POLICY "Users can insert own templates"
  ON templates
  FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid() OR created_by IS NULL);

CREATE POLICY "Users can update own templates"
  ON templates
  FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can delete own templates"
  ON templates
  FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

CREATE TRIGGER update_templates_updated_at
  BEFORE UPDATE ON templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS templates_role_idx ON templates(role);
CREATE INDEX IF NOT EXISTS templates_public_idx ON templates(is_public);
CREATE INDEX IF NOT EXISTS templates_created_by_idx ON templates(created_by);
