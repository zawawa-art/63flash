import { Cast } from "./mockCasts";

// R2 buckets don't send CORS headers, so the browser can't fetch this
// domain directly. /r2-proxy is same-origin in both dev (Vite, see
// vite.config.ts) and prod (functions/r2-proxy/[[path]].ts).
const R2_BASE = "/r2-proxy";
const POINTER_URL = `${R2_BASE}/generated/cast_master/latest.json`;
const SNAPSHOTS_INDEX_URL = `${R2_BASE}/generated/store_cast_snapshots/latest.json`;

type RawCast = {
  id: string;
  name: string;
  avatar_url?: string;
  role?: string;
  active?: boolean;
  store?: string;
  store_profile_slug?: string;
  official_url?: string;
};

const STORE_DISPLAY_NAMES: Record<string, string> = {
  rokusan_angel: "ROKUSAN ANGEL",
  churasun6: "ちゅらさん6沖縄",
  party_on: "PARTY ON TOKYO",
  super_spark: "SUPER SPARK TOKYO",
};

type SnapshotImage = {
  original_url: string;
};

type SnapshotCast = {
  store_profile_slug?: string;
  artist_images?: SnapshotImage[];
};

async function fetchImagesByStoreSlug(): Promise<Map<string, string[]>> {
  const map = new Map<string, string[]>();
  const rawPerSlug = new Map<string, string[]>();
  const urlOwners = new Map<string, Set<string>>();
  try {
    const index = await fetch(SNAPSHOTS_INDEX_URL).then((r) => r.json());
    const stores: Record<string, { key: string }> = index.stores ?? {};
    await Promise.all(
      Object.entries(stores).map(async ([storeName, { key }]) => {
        const storeData = await fetch(`${R2_BASE}/${key}`).then((r) => r.json());
        const casts: SnapshotCast[] = storeData.casts ?? [];
        for (const c of casts) {
          if (!c.store_profile_slug) continue;
          const slugKey = `${storeName}:${c.store_profile_slug}`;
          const urls = (c.artist_images ?? []).map((img) => img.original_url).filter(Boolean);
          rawPerSlug.set(slugKey, urls);
          for (const u of urls) {
            if (!urlOwners.has(u)) urlOwners.set(u, new Set());
            urlOwners.get(u)!.add(slugKey);
          }
        }
      })
    );
  } catch (err) {
    console.warn("failed to fetch store cast snapshots for multi-image support", err);
  }
  // Source data occasionally attributes the same photo to two different
  // profiles (scraper mixup) — drop any URL shared across more than one
  // slug so we never show a cast someone else's face.
  for (const [slugKey, urls] of rawPerSlug) {
    const unique = urls.filter((u) => (urlOwners.get(u)?.size ?? 0) <= 1);
    if (unique.length > 0) map.set(slugKey, unique);
  }
  return map;
}

export async function fetchRealCasts(): Promise<Cast[]> {
  const pointer = await fetch(POINTER_URL).then((r) => r.json());
  const latestKey: string = pointer.latest_key;
  const full = await fetch(`${R2_BASE}/${latestKey}`).then((r) => r.json());

  const raw: RawCast[] = full.casts ?? [];
  const imagesBySlug = await fetchImagesByStoreSlug();

  const casts = raw
    .filter((c) => c.role === "cast" && c.active && c.avatar_url)
    .map((c) => {
      const key = c.store && c.store_profile_slug ? `${c.store}:${c.store_profile_slug}` : "";
      const images = imagesBySlug.get(key);
      return {
        id: c.id,
        name: c.name,
        image_url: c.avatar_url as string,
        images: images && images.length > 0 ? images : [c.avatar_url as string],
        storeName: c.store ? STORE_DISPLAY_NAMES[c.store] ?? c.store : undefined,
        officialUrl: c.official_url,
      };
    });

  if (casts.length < 4) {
    throw new Error("real cast data has too few entries");
  }

  return casts;
}
