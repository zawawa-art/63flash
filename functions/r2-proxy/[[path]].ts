// 63calendar の R2。カスタムドメインに移る時は環境変数 R2_ORIGIN で切り替え、
// 公開していない場所を読むための合言葉 R2_READ_TOKEN をヘッダーに付ける（63calendar DESIGN §12.45）。
const DEFAULT_R2_ORIGIN = "https://r2.zawawa.uk";

const ALLOWED_PATH_PREFIXES = [
  "generated/cast_master/",
  "generated/store_cast_snapshots/",
  "public/63schedule",
  "schedules/bundle.json",
  "schedules/casts.json",
];

export function isAllowedProxyPath(path: string): boolean {
  if (!path || path.startsWith("/") || path.includes("..") || path.includes("\\")) {
    return false;
  }
  return ALLOWED_PATH_PREFIXES.some((prefix) => path.startsWith(prefix));
}

interface Env {
  R2_ORIGIN?: string;
  R2_READ_TOKEN?: string;
}

export const onRequestGet: PagesFunction<Env> = async ({ params, env }) => {
  const path = Array.isArray(params.path) ? params.path.join("/") : params.path ?? "";
  if (!isAllowedProxyPath(path)) {
    return new Response("Forbidden", {
      status: 403,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  }
  const origin = (env.R2_ORIGIN || DEFAULT_R2_ORIGIN).replace(/\/+$/, "");
  const upstream = await fetch(`${origin}/${path}`, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; 63flash-proxy)",
      ...(env.R2_READ_TOKEN ? { "X-R2-Token": env.R2_READ_TOKEN } : {}),
    },
  });
  const body = await upstream.arrayBuffer();
  // sha256 で内容アドレス指定のアセットは二度と変わらないので長期キャッシュ（63calendar DESIGN §12.45）
  // ただし非200応答（404/5xx等）はエッジ・ブラウザにキャッシュさせない
  const immutable = path.includes("/assets/sha256/");
  const cacheControl =
    upstream.status === 200
      ? immutable
        ? "public, max-age=31536000, immutable"
        : "public, max-age=300"
      : "no-store";
  return new Response(body, {
    status: upstream.status,
    headers: {
      "Content-Type": upstream.headers.get("Content-Type") ?? "application/octet-stream",
      "Cache-Control": cacheControl,
    },
  });
};
