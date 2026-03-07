/*
  # Create subtasks table

  1. New Tables
    - `subtasks`
      - `id` (uuid, primary key, default gen_random_uuid())
      - `card_id` (uuid, foreign key references cards.id)
      - `title` (text, not null)
      - `completed` (boolean, default false)
      - `position` (integer, default 0)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `subtasks` table
    - Add policies for users to manage subtasks in their own cards
*/

-- Create subtasks table
CREATE TABLE IF NOT EXISTS subtasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id uuid NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  title text NOT NULL,
  completed boolean DEFAULT false,
  position integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE subtasks ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read subtasks from own cards"
  ON subtasks
  FOR SELECT
  TO authenticated
  USING (
    card_id IN (
      SELECT c.id FROM cards c
      JOIN lists l ON c.list_id = l.id
      JOIN boards b ON l.board_id = b.id
      WHERE b.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert subtasks to own cards"
  ON subtasks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    card_id IN (
      SELECT c.id FROM cards c
      JOIN lists l ON c.list_id = l.id
      JOIN boards b ON l.board_id = b.id
      WHERE b.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update subtasks in own cards"
  ON subtasks
  FOR UPDATE
  TO authenticated
  USING (
    card_id IN (
      SELECT c.id FROM cards c
      JOIN lists l ON c.list_id = l.id
      JOIN boards b ON l.board_id = b.id
      WHERE b.user_id = auth.uid()
    )
  )
  WITH CHECK (
    card_id IN (
      SELECT c.id FROM cards c
      JOIN lists l ON c.list_id = l.id
      JOIN boards b ON l.board_id = b.id
      WHERE b.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete subtasks from own cards"
  ON subtasks
  FOR DELETE
  TO authenticated
  USING (
    card_id IN (
      SELECT c.id FROM cards c
      JOIN lists l ON c.list_id = l.id
      JOIN boards b ON l.board_id = b.id
      WHERE b.user_id = auth.uid()
    )
  );

-- Create trigger for updated_at
CREATE TRIGGER update_subtasks_updated_at
  BEFORE UPDATE ON subtasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS subtasks_card_id_idx ON subtasks(card_id);
CREATE INDEX IF NOT EXISTS subtasks_position_idx ON subtasks(card_id, position);
CREATE INDEX IF NOT EXISTS subtasks_completed_idx ON subtasks(completed);