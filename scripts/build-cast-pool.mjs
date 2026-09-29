import { execSync } from "child_process";
import { writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

const R2_PUBLIC_BASE = "https://pub-f189d9c407d749eaa795a0cb8bc05849.r2.dev";

const STORE_DISPLAY_NAMES = {
  rokusan_angel: { en: "ROKUSAN ANGEL", ja: "ROKUSAN ANGEL" },
  super_spark: { en: "SUPER SPARK", ja: "SUPER SPARK" },
  party_on: { en: "PARTY ON", ja: "PARTY ON" },
  churasun6: { en: "CHURASUN 6", ja: "ちゅらさん6" },
  burlesque_ts: { en: "BURLESQUE TOKYO", ja: "バーレスク東京" },
};

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
  return await res.json();
}

function query63archive(sql) {
  try {
    const output = execSync(
      `npx wrangler d1 execute 63archive --remote --command "${sql.replace(/"/g, '\\"')}" --json`,
      { cwd: join(process.cwd(), "../63archive"), encoding: "utf8", stdio: ["pipe", "pipe", "ignore"] }
    );
    const parsed = JSON.parse(output);
    return parsed[0]?.results || [];
  } catch (err) {
    console.warn("wrangler d1 query failed:", err);
    return [];
  }
}

async function main() {
  console.log("=== Building 63flash Cast Pool (Active + OG + Multi-Images) ===");

  // 1. Fetch current active cast master
  console.log("1. Fetching live cast_master from R2...");
  const pointer = await fetchJson(`${R2_PUBLIC_BASE}/generated/cast_master/latest.json`);
  const master = await fetchJson(`${R2_PUBLIC_BASE}/${pointer.latest_key}`);
  const activeMasterCasts = master.casts.filter((c) => c.role === "cast" && c.active && c.avatar_url);
  console.log(`-> Found ${activeMasterCasts.length} active casts in cast_master.`);

  // 2. Fetch multi-images from store_cast_snapshots
  console.log("2. Fetching store_cast_snapshots multi-images...");
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
      const urls = (c.artist_images || []).map((img) => img.original_url).filter(Boolean);
      rawPerSlug.set(slugKey, urls);
      for (const u of urls) {
        if (!urlOwners.has(u)) urlOwners.set(u, new Set());
        urlOwners.get(u).add(slugKey);
      }
    }
  }

  for (const [slugKey, urls] of rawPerSlug) {
    const unique = urls.filter((u) => (urlOwners.get(u)?.size ?? 0) <= 1);
    if (unique.length > 0) imagesBySlug.set(slugKey, unique);
  }
  console.log(`-> Loaded artist images for ${imagesBySlug.size} store profiles.`);

  // 3. Query 63archive for historical / OG casts & photos
  console.log("3. Querying 63archive D1 database for historical / OG observations...");
  const ogSql = `
    SELECT 
      store_id, 
      cast_name, 
      cast_slug, 
      min(captured_at) as first_seen, 
      max(captured_at) as last_seen, 
      count(DISTINCT image_url) as img_count, 
      group_concat(DISTINCT image_url) as all_images
    FROM roster_observations 
    WHERE image_url IS NOT NULL AND image_url != '' AND length(image_url) > 10
    GROUP BY store_id, cast_name
    HAVING max(captured_at) < '20260101'
    ORDER BY max(captured_at) DESC
  `;
  const archiveRows = query63archive(ogSql);
  console.log(`-> Found ${archiveRows.length} historical cast records in 63archive.`);

  // Build active cast map by normalized name
  const activeNormalizedNames = new Set(activeMasterCasts.map((c) => c.name.toLowerCase().replace(/[\s\-_]/g, "")));
  const pool = [];

  // Add Active Casts
  for (const c of activeMasterCasts) {
    const slugKey = c.store && c.store_profile_slug ? `${c.store}:${c.store_profile_slug}` : "";
    const extraImages = imagesBySlug.get(slugKey) || [];
    const allImages = Array.from(new Set([c.avatar_url, ...extraImages])).filter(Boolean);

    let rawName = c.name;
    if (rawName === "美谷 朱音" || rawName === "美谷朱音") rawName = "Akane";

    pool.push({
      id: c.id,
      name: rawName,
      name_ja: (c.aliases && c.aliases.find((a) => !/^[a-zA-Z0-9\s-_]+$/.test(a))) || undefined,
      image_url: c.avatar_url,
      images: allImages,
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

  // Add OG Casts from 63archive
  let addedOgCount = 0;
  for (const row of archiveRows) {
    const rawName = row.cast_name.trim();
    const normName = rawName.toLowerCase().replace(/[\s\-_]/g, "");
    // Skip if already in active pool
    if (activeNormalizedNames.has(normName)) continue;
    // Skip if name is too short or weird placeholder
    if (rawName.length < 2 || rawName.toLowerCase() === "cast" || rawName.toLowerCase() === "staff") continue;

    const urls = (row.all_images || "").split(",").filter((u) => u && u.startsWith("http"));
    if (urls.length === 0) continue;

    const storeId = row.store_id === "burlesque_ts" ? "rokusan_angel" : row.store_id;
    const ogId = `og_${storeId}_${(row.cast_slug || normName).replace(/[^a-zA-Z0-9_]/g, "_")}`;

    pool.push({
      id: ogId,
      name: rawName,
      image_url: urls[0],
      images: urls,
      is_og: true,
      store: storeId,
      storeName: STORE_DISPLAY_NAMES[storeId]?.ja || storeId,
      first_seen: row.first_seen,
      last_seen: row.last_seen,
    });
    activeNormalizedNames.add(normName);
    addedOgCount++;
  }

  console.log(`-> Added ${addedOgCount} OG casts.`);
  console.log(`-> Total Cast Pool: ${pool.length} casts (${activeMasterCasts.length} Active + ${addedOgCount} OG)`);

  const outDir = join(process.cwd(), "public");
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, "cast_pool.json");
  writeFileSync(outPath, JSON.stringify(pool, null, 2));
  console.log(`✅ Saved cast pool to ${outPath}`);
}

main().catch(console.error);
