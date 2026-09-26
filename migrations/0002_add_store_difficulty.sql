-- Add store and difficulty columns to scores table
ALTER TABLE scores ADD COLUMN store TEXT NOT NULL DEFAULT 'all';
ALTER TABLE scores ADD COLUMN difficulty TEXT NOT NULL DEFAULT 'normal';

CREATE INDEX IF NOT EXISTS idx_scores_store_difficulty_score
  ON scores (store, difficulty, score DESC, created_at ASC);
