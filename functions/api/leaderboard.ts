export type Env = {
  DB: D1Database;
};

const MAX_NICKNAME_LENGTH = 20;
const TOP_N = 20;
const MAX_SCORE_PER_CORRECT = 200; // 100 * (1 + min(combo,10)*0.1) の最大値

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function isFiniteNonNegativeInteger(v: unknown): v is number {
  return typeof v === "number" && Number.isInteger(v) && v >= 0;
}

type ScoreRow = {
  id: number;
  nickname: string;
  score: number;
  max_combo: number;
  correct_count: number;
  total_count: number;
  created_at: string;
};

function toEntry(row: ScoreRow, rank: number) {
  return {
    rank,
    nickname: row.nickname,
    score: row.score,
    maxCombo: row.max_combo,
    correctCount: row.correct_count,
    totalCount: row.total_count,
    createdAt: row.created_at,
  };
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { results } = await context.env.DB.prepare(
    "SELECT * FROM scores ORDER BY score DESC, created_at ASC LIMIT ?"
  )
    .bind(TOP_N)
    .all<ScoreRow>();

  return jsonResponse(
    200,
    (results ?? []).map((row, i) => toEntry(row, i + 1))
  );
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  let body: unknown;
  try {
    body = await context.request.json();
  } catch {
    return jsonResponse(400, { error: "invalid_json" });
  }

  if (typeof body !== "object" || body === null) {
    return jsonResponse(400, { error: "invalid_body" });
  }

  const b = body as Record<string, unknown>;
  const { nickname, score, maxCombo, correctCount, totalCount } = b;

  if (
    typeof nickname !== "string" ||
    typeof score !== "number" ||
    typeof maxCombo !== "number" ||
    typeof correctCount !== "number" ||
    typeof totalCount !== "number"
  ) {
    return jsonResponse(400, { error: "invalid_body" });
  }

  const trimmedNickname = nickname.trim();
  if (trimmedNickname.length === 0) {
    return jsonResponse(400, { error: "nickname_required" });
  }
  if (trimmedNickname.length > MAX_NICKNAME_LENGTH) {
    return jsonResponse(400, { error: "nickname_too_long" });
  }

  if (
    !isFiniteNonNegativeInteger(score) ||
    !isFiniteNonNegativeInteger(maxCombo) ||
    !isFiniteNonNegativeInteger(correctCount) ||
    !isFiniteNonNegativeInteger(totalCount)
  ) {
    return jsonResponse(400, { error: "invalid_numbers" });
  }

  if (correctCount > totalCount) {
    return jsonResponse(400, { error: "correct_exceeds_total" });
  }
  if (maxCombo > correctCount) {
    return jsonResponse(400, { error: "combo_exceeds_correct" });
  }
  if (score > correctCount * MAX_SCORE_PER_CORRECT) {
    return jsonResponse(400, { error: "score_exceeds_cap" });
  }

  try {
    const insertResult = await context.env.DB.prepare(
      `INSERT INTO scores (nickname, score, max_combo, correct_count, total_count)
       VALUES (?, ?, ?, ?, ?)
       RETURNING *`
    )
      .bind(trimmedNickname, score, maxCombo, correctCount, totalCount)
      .first<ScoreRow>();

    if (!insertResult) {
      return jsonResponse(500, { error: "internal_error" });
    }

    const { count } = await context.env.DB.prepare(
      `SELECT COUNT(*) as count FROM scores
       WHERE score > ? OR (score = ? AND created_at < ?)`
    )
      .bind(insertResult.score, insertResult.score, insertResult.created_at)
      .first<{ count: number }>();

    const rank = count + 1;

    return jsonResponse(200, { rank, entry: toEntry(insertResult, rank) });
  } catch (err) {
    return jsonResponse(500, { error: "internal_error" });
  }
};
