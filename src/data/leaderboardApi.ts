export type Difficulty = "easy" | "normal";

export type LeaderboardEntry = {
  rank: number;
  nickname: string;
  score: number;
  maxCombo: number;
  correctCount: number;
  totalCount: number;
  store: string;
  difficulty: Difficulty;
  createdAt: string;
};

export type SubmitScorePayload = {
  nickname: string;
  score: number;
  maxCombo: number;
  correctCount: number;
  totalCount: number;
  store?: string;
  difficulty?: Difficulty;
};

export type SubmitScoreResult = {
  rank: number;
  entry: LeaderboardEntry;
};

export async function fetchLeaderboard(store?: string, difficulty?: Difficulty): Promise<LeaderboardEntry[]> {
  const params = new URLSearchParams();
  if (store) params.set("store", store);
  if (difficulty) params.set("difficulty", difficulty);
  const query = params.toString();
  const res = await fetch(`/api/leaderboard${query ? `?${query}` : ""}`);
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
