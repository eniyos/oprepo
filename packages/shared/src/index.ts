// ─── Developer Types ────────────────────────────────────────────

export interface DeveloperProfile {
  id: string;
  githubUsername: string;
  bio?: string;
  location?: string;
  avatarUrl?: string;
  skills: DeveloperSkills;
  interests: string[];
  goals: string[];
  constraints: string[];
}

export interface DeveloperSkills {
  languages: string[];
  frameworks: string[];
  domains: string[];
  contributionStyle: string[];
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
}

// ─── Repository Types ───────────────────────────────────────────

export interface Repository {
  id: string;
  githubId: number;
  fullName: string;
  description?: string;
  topics: string[];
  homepage?: string;
  license?: string;
  primaryLanguage?: string;
  secondaryLanguages: string[];
  frameworks: string[];
  domainTags: string[];
  stargazersCount: number;
  forksCount: number;
  openIssuesCount: number;
  recentCommitFrequency: number;
  medianResponseTimeHours?: number;
  medianMergeTimeHours?: number;
  activeContributorCount: number;
  hasCodeOfConduct: boolean;
  hasContributingGuide: boolean;
  difficultyLabel?: 'beginner' | 'intermediate' | 'advanced';
  communityHealthScore: number;
  lastIndexedAt?: string;
}

// ─── Issue Types ────────────────────────────────────────────────

export interface Issue {
  id: string;
  githubId: number;
  repositoryId: string;
  title: string;
  body?: string;
  labels: string[];
  state: 'open' | 'closed';
  difficultyHint?: string;
  requiredSkills: string[];
  commentCount: number;
  url?: string;
}

// ─── Recommendation Types ───────────────────────────────────────

export interface Recommendation {
  id: string;
  type: 'repo' | 'issue';
  repoName: string;
  issueId?: number;
  title: string;
  url: string;
  matchScore: number;
  reasons: string[];
  fitSignals: FitSignals;
  suggestedNextSteps: string[];
}

export interface FitSignals {
  skillOverlap: string[];
  domainOverlap: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  communityHealth: 'low' | 'medium' | 'high';
  goalAlignment: string[];
}

// ─── API Types ──────────────────────────────────────────────────

export interface RecommendRequest {
  developerId?: string;
  githubUsername?: string;
  context?: {
    timeAvailableHoursPerWeek?: number;
    focus?: 'repos' | 'issues';
    maxResults?: number;
  };
}

export interface RecommendResponse {
  developerSummary: string;
  recommendations: Recommendation[];
}

export interface FeedbackRequest {
  recommendationId: string;
  rating?: number;
  clickedThrough?: boolean;
  openedPr?: boolean;
  comments?: string;
}
