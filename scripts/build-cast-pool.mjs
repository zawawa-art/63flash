import { writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

const R2_PUBLIC_BASE = "https://pub-f189d9c407d749eaa795a0cb8bc05849.r2.dev";

const STORE_DISPLAY_NAMES = {
  rokusan_angel: { en: "ROKUSAN ANGEL", ja: "ROKUSAN ANGEL" },
  super_spark: { en: "SUPER SPARK", ja: "SUPER SPARK" },
  party_on: { en: "PARTY ON", ja: "PARTY ON" },
  churasun6: { en: "CHURASUN 6", ja: "ちゅらさん6" },
};

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
  return await res.json();
}

async function main() {
  console.log("=== Building 63flash Cast Pool (100% Reliable Official Live Photos) ===");

  // 1. Fetch current active cast master
  console.log("1. Fetching live cast_master from R2...");
  const pointer = await fetchJson(`${R2_PUBLIC_BASE}/generated/cast_master/latest.json`);
  const master = await fetchJson(`${R2_PUBLIC_BASE}/${pointer.latest_key}`);
  const activeMasterCasts = master.casts.filter((c) => c.role === "cast" && c.active && c.avatar_url);
  console.log(`-> Found ${activeMasterCasts.length} active casts in cast_master.`);

  // 2. Fetch multi-images from store_cast_snapshots (Official current sites only)
  console.log("2. Fetching store_cast_snapshots official artist images...");
  const snapshotsIndex = await fetchJson(
    `${R2_PUBLIC_BASE}/generated/store_cast_snapshots/latest.json`
  );
  const imagesBySlug = new Map();
  const rawPerSlug = new Map();
  const urlOwners = new Map();

  for (const [storeName, { key }] of Object.entries(snapshotsIndex.stores || {})) {
    const storeData = await fetchJson(`${R2_PUBLIC_BASE}/${key}`);
    for (const c of storeData.casts || []) {
      if (!c.store_profile_slug) continue;
      const slugKey = `${storeName}:${c.store_profile_slug}`;
      const urls = (c.artist_images || [])
        .map((img) => img.original_url)
        .filter((u) => {
          if (!u) return false;
          // Filter out low-res thumbnails and cross-store scraped placeholders
          if (/-200x300\./i.test(u) || /-150x150\./i.test(u) || /-300x300\./i.test(u)) return false;
          if (u.includes("external-talents")) return false;
          return true;
        });

      rawPerSlug.set(slugKey, urls);
      for (const u of urls) {
        if (!urlOwners.has(u)) urlOwners.set(u, new Set());
        urlOwners.get(u).add(slugKey);
      }
    }
  }

  // Strict ownership check: Any URL attached to multiple profiles is excluded
  for (const [slugKey, urls] of rawPerSlug) {
    const unique = urls.filter((u) => (urlOwners.get(u)?.size ?? 0) === 1);
    if (unique.length > 0) imagesBySlug.set(slugKey, unique);
  }
  console.log(`-> Loaded unique official artist images for ${imagesBySlug.size} store profiles.`);

  const pool = [];

  // Add Active Casts ONLY with their authentic official images
  for (const c of activeMasterCasts) {
    const slugKey = c.store && c.store_profile_slug ? `${c.store}:${c.store_profile_slug}` : "";
    const snapshotImages = imagesBySlug.get(slugKey) || [];

    const rawAllImages = [c.avatar_url, ...snapshotImages].filter(Boolean);
    const deduplicated = Array.from(new Set(rawAllImages));

    let rawName = c.name;
    if (rawName === "美谷 朱音" || rawName === "美谷朱音") rawName = "Akane";

    pool.push({
      id: c.id,
      name: rawName,
      name_ja: (c.aliases && c.aliases.find((a) => !/^[a-zA-Z0-9\s-_]+$/.test(a))) || undefined,
      image_url: c.avatar_url,
      images: deduplicated.length > 0 ? deduplicated : [c.avatar_url],
      is_og: false,
      store: c.store,
      storeName: STORE_DISPLAY_NAMES[c.store]?.ja || c.store,
      officialUrl: c.official_url,
      birthday: c.birthday,
      birthplace: c.birthplace,
      height: c.height,
      catchphrase: c.catchphrase,
    });
  }

  const multiCount = pool.filter((c) => c.images.length > 1).length;
  const totalImgs = pool.reduce((acc, c) => acc + c.images.length, 0);
  console.log(`-> Total Cast Pool: ${pool.length} casts`);
  console.log(`-> Casts with Multiple Photos: ${multiCount} / ${pool.length}`);
  console.log(`-> Total authentic official photos: ${totalImgs} photos`);

  const outDir = join(process.cwd(), "public");
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, "cast_pool.json");
  writeFileSync(outPath, JSON.stringify(pool, null, 2));
  console.log(`✅ Saved authentic official cast pool to ${outPath}`);
}

main().catch(console.error);
