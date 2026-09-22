export type LeaderboardEntry = {
  rank: number;
  nickname: string;
  score: number;
  maxCombo: number;
  correctCount: number;
  totalCount: number;
  createdAt: string;
};

export type SubmitScorePayload = {
  nickname: string;
  score: number;
  maxCombo: number;
  correctCount: number;
  totalCount: number;
};

export type SubmitScoreResult = {
  rank: number;
  entry: LeaderboardEntry;
};

export async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  const res = await fetch("/api/leaderboard");
  if (!res.ok) {
    throw new Error("failed to fetch leaderboard");
  }
  return res.json();
}

export async function submitScore(payload: SubmitScorePayload): Promise<SubmitScoreResult> {
  const res = await fetch("/api/leaderboard", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await res.json();
  if (!res.ok) {
    throw new Error(body.error ?? "submit_failed");
  }
  return body;
}
