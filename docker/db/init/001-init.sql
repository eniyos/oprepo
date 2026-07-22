-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Core tables
CREATE TABLE developers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  github_username VARCHAR(255) UNIQUE NOT NULL,
  bio TEXT,
  location VARCHAR(255),
  avatar_url TEXT,
  skills JSONB DEFAULT '{}',
  interests JSONB DEFAULT '[]',
  goals JSONB DEFAULT '[]',
  constraints JSONB DEFAULT '[]',
  embeddings vector(384),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE repositories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  github_id BIGINT UNIQUE NOT NULL,
  full_name VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  topics TEXT[] DEFAULT '{}',
  homepage TEXT,
  license VARCHAR(100),
  primary_language VARCHAR(100),
  secondary_languages TEXT[] DEFAULT '{}',
  frameworks TEXT[] DEFAULT '{}',
  domain_tags TEXT[] DEFAULT '{}',
  stargazers_count INT DEFAULT 0,
  forks_count INT DEFAULT 0,
  open_issues_count INT DEFAULT 0,
  recent_commit_frequency FLOAT DEFAULT 0,
  median_response_time_hours FLOAT,
  median_merge_time_hours FLOAT,
  active_contributor_count INT DEFAULT 0,
  has_code_of_conduct BOOLEAN DEFAULT FALSE,
  has_contributing_guide BOOLEAN DEFAULT FALSE,
  difficulty_label VARCHAR(20),
  community_health_score FLOAT DEFAULT 0,
  embeddings vector(384),
  last_indexed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  github_id BIGINT UNIQUE NOT NULL,
  repository_id UUID NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  labels TEXT[] DEFAULT '{}',
  state VARCHAR(20) DEFAULT 'open',
  difficulty_hint VARCHAR(50),
  required_skills TEXT[] DEFAULT '{}',
  comment_count INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_id UUID NOT NULL REFERENCES developers(id) ON DELETE CASCADE,
  repository_id UUID REFERENCES repositories(id) ON DELETE CASCADE,
  issue_id UUID REFERENCES issues(id) ON DELETE CASCADE,
  match_score FLOAT NOT NULL,
  match_reasons JSONB DEFAULT '[]',
  fit_signals JSONB DEFAULT '{}',
  suggested_steps JSONB DEFAULT '[]',
  type VARCHAR(10) NOT NULL CHECK (type IN ('repo', 'issue')),
  feedback VARCHAR(20),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_id UUID NOT NULL REFERENCES developers(id) ON DELETE CASCADE,
  recommendation_id UUID NOT NULL REFERENCES recommendations(id) ON DELETE CASCADE,
  rating INT CHECK (rating >= 1 AND rating <= 5),
  clicked_through BOOLEAN DEFAULT FALSE,
  opened_pr BOOLEAN DEFAULT FALSE,
  comments TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for vector similarity search
CREATE INDEX idx_developers_embeddings ON developers USING ivfflat (embeddings vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_repositories_embeddings ON repositories USING ivfflat (embeddings vector_cosine_ops) WITH (lists = 100);

-- Indexes for common queries
CREATE INDEX idx_repositories_topics ON repositories USING GIN (topics);
CREATE INDEX idx_repositories_domain_tags ON repositories USING GIN (domain_tags);
CREATE INDEX idx_repositories_primary_language ON repositories(primary_language);
CREATE INDEX idx_issues_labels ON issues USING GIN (labels);
CREATE INDEX idx_issues_repository_id ON issues(repository_id);
CREATE INDEX idx_issues_state ON issues(state);
CREATE INDEX idx_recommendations_developer_id ON recommendations(developer_id);
CREATE INDEX idx_recommendations_created_at ON recommendations(created_at);
CREATE INDEX idx_feedback_recommendation_id ON feedback(recommendation_id);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_developers_updated_at
  BEFORE UPDATE ON developers FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_repositories_updated_at
  BEFORE UPDATE ON repositories FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_issues_updated_at
  BEFORE UPDATE ON issues FOR EACH ROW EXECUTE FUNCTION update_updated_at();
