/*
  # Create cards table

  1. New Tables
    - `cards`
      - `id` (uuid, primary key, default gen_random_uuid())
      - `list_id` (uuid, foreign key references lists.id)
      - `title` (text, not null)
      - `description` (text, nullable)
      - `due_date` (timestamptz, nullable)
      - `position` (integer, default 0)
      - `labels` (text array, default empty array)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `cards` table
    - Add policies for users to manage cards in their own lists
*/

-- Create cards table
CREATE TABLE IF NOT EXISTS cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id uuid NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  due_date timestamptz,
  position integer DEFAULT 0,
  labels text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read cards from own lists"
  ON cards
  FOR SELECT
  TO authenticated
  USING (
    list_id IN (
      SELECT l.id FROM lists l
      JOIN boards b ON l.board_id = b.id
      WHERE b.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert cards to own lists"
  ON cards
  FOR INSERT
  TO authenticated
  WITH CHECK (
    list_id IN (
      SELECT l.id FROM lists l
      JOIN boards b ON l.board_id = b.id
      WHERE b.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update cards in own lists"
  ON cards
  FOR UPDATE
  TO authenticated
  USING (
    list_id IN (
      SELECT l.id FROM lists l
      JOIN boards b ON l.board_id = b.id
      WHERE b.user_id = auth.uid()
    )
  )
  WITH CHECK (
    list_id IN (
      SELECT l.id FROM lists l
      JOIN boards b ON l.board_id = b.id
      WHERE b.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete cards from own lists"
  ON cards
  FOR DELETE
  TO authenticated
  USING (
    list_id IN (
      SELECT l.id FROM lists l
      JOIN boards b ON l.board_id = b.id
      WHERE b.user_id = auth.uid()
    )
  );

-- Create trigger for updated_at
CREATE TRIGGER update_cards_updated_at
  BEFORE UPDATE ON cards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS cards_list_id_idx ON cards(list_id);
CREATE INDEX IF NOT EXISTS cards_position_idx ON cards(list_id, position);
CREATE INDEX IF NOT EXISTS cards_due_date_idx ON cards(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS cards_labels_idx ON cards USING GIN(labels);