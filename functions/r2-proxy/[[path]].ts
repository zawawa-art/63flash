const R2_ORIGIN = "https://pub-f189d9c407d749eaa795a0cb8bc05849.r2.dev";

export const onRequestGet: PagesFunction = async ({ params }) => {
  const path = Array.isArray(params.path) ? params.path.join("/") : params.path ?? "";
  const upstream = await fetch(`${R2_ORIGIN}/${path}`, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; 63flash-proxy)" },
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
