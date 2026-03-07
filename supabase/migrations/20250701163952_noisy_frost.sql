/*
  # Create lists table

  1. New Tables
    - `lists`
      - `id` (uuid, primary key, default gen_random_uuid())
      - `board_id` (uuid, foreign key references boards.id)
      - `title` (text, not null)
      - `position` (integer, default 0)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `lists` table
    - Add policies for users to manage lists in their own boards
*/

-- Create lists table
CREATE TABLE IF NOT EXISTS lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id uuid NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  title text NOT NULL,
  position integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE lists ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read lists from own boards"
  ON lists
  FOR SELECT
  TO authenticated
  USING (
    board_id IN (
      SELECT id FROM boards WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert lists to own boards"
  ON lists
  FOR INSERT
  TO authenticated
  WITH CHECK (
    board_id IN (
      SELECT id FROM boards WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update lists in own boards"
  ON lists
  FOR UPDATE
  TO authenticated
  USING (
    board_id IN (
      SELECT id FROM boards WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    board_id IN (
      SELECT id FROM boards WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete lists from own boards"
  ON lists
  FOR DELETE
  TO authenticated
  USING (
    board_id IN (
      SELECT id FROM boards WHERE user_id = auth.uid()
    )
  );

-- Create trigger for updated_at
CREATE TRIGGER update_lists_updated_at
  BEFORE UPDATE ON lists
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS lists_board_id_idx ON lists(board_id);
CREATE INDEX IF NOT EXISTS lists_position_idx ON lists(board_id, position);