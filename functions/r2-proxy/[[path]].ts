// 63calendar の R2。カスタムドメインに移る時は環境変数 R2_ORIGIN で切り替え、
// 公開していない場所を読むための合言葉 R2_READ_TOKEN をヘッダーに付ける（63calendar DESIGN §12.45）。
const DEFAULT_R2_ORIGIN = "https://pub-f189d9c407d749eaa795a0cb8bc05849.r2.dev";

interface Env {
  R2_ORIGIN?: string;
  R2_READ_TOKEN?: string;
}

export const onRequestGet: PagesFunction<Env> = async ({ params, env }) => {
  const path = Array.isArray(params.path) ? params.path.join("/") : params.path ?? "";
  const origin = (env.R2_ORIGIN || DEFAULT_R2_ORIGIN).replace(/\/+$/, "");
  const upstream = await fetch(`${origin}/${path}`, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; 63flash-proxy)",
      ...(env.R2_READ_TOKEN ? { "X-R2-Token": env.R2_READ_TOKEN } : {}),
    },
  });
  const body = await upstream.arrayBuffer();
  return new Response(body, {
    status: upstream.status,
    headers: {
      "Content-Type": upstream.headers.get("Content-Type") ?? "application/octet-stream",
      "Cache-Control": "public, max-age=300",
    },
  });
};
