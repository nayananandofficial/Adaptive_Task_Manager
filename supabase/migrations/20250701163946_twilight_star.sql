/*
  # Create boards table

  1. New Tables
    - `boards`
      - `id` (uuid, primary key, default gen_random_uuid())
      - `user_id` (uuid, foreign key references users.id)
      - `title` (text, not null)
      - `description` (text, nullable)
      - `color` (text, default '#3B82F6')
      - `position` (integer, default 0)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `boards` table
    - Add policies for users to manage their own boards
*/

-- Create boards table
CREATE TABLE IF NOT EXISTS boards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  color text DEFAULT '#3B82F6',
  position integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE boards ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own boards"
  ON boards
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own boards"
  ON boards
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own boards"
  ON boards
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own boards"
  ON boards
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create trigger for updated_at
CREATE TRIGGER update_boards_updated_at
  BEFORE UPDATE ON boards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create index for better performance
CREATE INDEX IF NOT EXISTS boards_user_id_idx ON boards(user_id);
CREATE INDEX IF NOT EXISTS boards_position_idx ON boards(user_id, position);