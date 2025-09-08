-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create polls table
CREATE TABLE polls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  allow_multiple_votes BOOLEAN DEFAULT false,
  ends_at TIMESTAMP WITH TIME ZONE
);

-- Create poll_options table
CREATE TABLE poll_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create votes table
CREATE TABLE votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  option_id UUID NOT NULL REFERENCES poll_options(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(poll_id, user_id, option_id)
);

-- Create poll_results view
CREATE VIEW poll_results AS
SELECT 
  po.id as option_id,
  po.poll_id,
  po.text as option_text,
  po.order,
  COUNT(v.id) as votes,
  CASE 
    WHEN total.total_votes > 0 THEN 
      ROUND((COUNT(v.id)::DECIMAL / total.total_votes::DECIMAL) * 100, 1)
    ELSE 0 
  END as percentage
FROM poll_options po
LEFT JOIN votes v ON po.id = v.option_id
LEFT JOIN (
  SELECT poll_id, COUNT(*) as total_votes
  FROM votes
  GROUP BY poll_id
) total ON po.poll_id = total.poll_id
GROUP BY po.id, po.poll_id, po.text, po.order, total.total_votes
ORDER BY po.poll_id, po.order;

-- Enable Row Level Security (RLS)
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for polls
CREATE POLICY "Polls are viewable by everyone" ON polls
  FOR SELECT USING (true);

CREATE POLICY "Users can create polls" ON polls
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own polls" ON polls
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own polls" ON polls
  FOR DELETE USING (auth.uid() = created_by);

-- RLS Policies for poll_options
CREATE POLICY "Poll options are viewable by everyone" ON poll_options
  FOR SELECT USING (true);

CREATE POLICY "Poll creators can manage options" ON poll_options
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM polls 
      WHERE polls.id = poll_options.poll_id 
      AND polls.created_by = auth.uid()
    )
  );

-- RLS Policies for votes
CREATE POLICY "Votes are viewable by everyone" ON votes
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can vote" ON votes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only vote once per poll" ON votes
  FOR INSERT WITH CHECK (
    NOT EXISTS (
      SELECT 1 FROM votes v2 
      WHERE v2.poll_id = votes.poll_id 
      AND v2.user_id = votes.user_id
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_polls_created_by ON polls(created_by);
CREATE INDEX idx_polls_is_active ON polls(is_active);
CREATE INDEX idx_poll_options_poll_id ON poll_options(poll_id);
CREATE INDEX idx_votes_poll_id ON votes(poll_id);
CREATE INDEX idx_votes_user_id ON votes(user_id);
CREATE INDEX idx_votes_option_id ON votes(option_id);

-- Create function to check if user has voted on a poll
CREATE OR REPLACE FUNCTION has_user_voted(poll_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM votes 
    WHERE poll_id = poll_uuid AND user_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get poll statistics
CREATE OR REPLACE FUNCTION get_poll_stats(poll_uuid UUID)
RETURNS TABLE(
  total_votes BIGINT,
  total_options BIGINT,
  has_votes BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(vote_count.count, 0) as total_votes,
    COALESCE(option_count.count, 0) as total_options,
    COALESCE(vote_count.count, 0) > 0 as has_votes
  FROM (
    SELECT COUNT(*) as count FROM votes WHERE poll_id = poll_uuid
  ) vote_count
  CROSS JOIN (
    SELECT COUNT(*) as count FROM poll_options WHERE poll_id = poll_uuid
  ) option_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;