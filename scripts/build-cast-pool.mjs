import { execSync } from "child_process";
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

function query63archive(sql) {
  try {
    const output = execSync(
      `CLOUDFLARE_ACCOUNT_ID=d8dc211790a52d2cbcbb758320bb62c1 npx wrangler d1 execute 63archive --remote --command "${sql.replace(/"/g, '\\"')}" --json`,
      { cwd: join(process.cwd(), "../63archive"), encoding: "utf8", stdio: ["pipe", "pipe", "ignore"] }
    );
    const parsed = JSON.parse(output);
    return parsed[0]?.results || [];
  } catch (err) {
    console.warn("wrangler d1 query failed:", err);
    return [];
  }
}

/**
 * Convert dead origin URL into a live Wayback replay URL
 */
function toWaybackLiveUrl(rawUrl, capturedAt = "20240101000000") {
  if (!rawUrl || typeof rawUrl !== "string") return rawUrl;
  // If already Wayback or archive.li
  if (rawUrl.includes("web.archive.org") || rawUrl.includes("archive.li")) {
    return rawUrl;
  }

  // Dead origin domains that MUST go through Wayback
  const deadDomains = [
    "burlesque-tokyo.com",
    "burlesque-roppongi.com",
    "ts.burlesque-tokyo.com",
  ];

  try {
    const parsed = new URL(rawUrl);
    if (deadDomains.some((d) => parsed.hostname.includes(d))) {
      const ts = capturedAt || "20240101000000";
      return `https://web.archive.org/web/${ts}im_/${rawUrl}`;
    }
  } catch {}

  return rawUrl;
}

async function main() {
  console.log("=== Building 63flash Cast Pool (Active Casts Only + Wayback Live URLs) ===");

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
  console.log(`-> Loaded artist images for ${imagesBySlug.size} store profiles from snapshots.`);

  // 3. Query 63archive D1 database for historical images of active casts
  console.log("3. Enriching active casts with historical photos from 63archive (converting to Wayback live URLs)...");
  const archiveSql = `
    SELECT 
      store_id, 
      cast_name, 
      image_url,
      min(captured_at) as first_seen
    FROM roster_observations 
    WHERE image_url IS NOT NULL AND image_url != '' AND length(image_url) > 10
      AND image_url NOT LIKE '%-200x300.%'
      AND image_url NOT LIKE '%-150x150.%'
      AND image_url NOT LIKE '%-300x300.%'
    GROUP BY store_id, cast_name, image_url
  `;
  const archiveRows = query63archive(archiveSql);
  const archiveImagesByStoreAndName = new Map();
  for (const row of archiveRows) {
    const storeId = row.store_id === "burlesque_ts" ? "rokusan_angel" : row.store_id;
    const nameKey = `${storeId}:${row.cast_name.trim().toLowerCase()}`;
    const liveUrl = toWaybackLiveUrl(row.image_url, row.first_seen);
    if (!archiveImagesByStoreAndName.has(nameKey)) {
      archiveImagesByStoreAndName.set(nameKey, []);
    }
    archiveImagesByStoreAndName.get(nameKey).push(liveUrl);
  }

  const pool = [];

  // Add Active Casts ONLY with all collected images
  for (const c of activeMasterCasts) {
    const slugKey = c.store && c.store_profile_slug ? `${c.store}:${c.store_profile_slug}` : "";
    const snapshotImages = imagesBySlug.get(slugKey) || [];

    const nameKey = `${c.store}:${c.name.trim().toLowerCase()}`;
    const archiveImages = archiveImagesByStoreAndName.get(nameKey) || [];

    // Filter out low-res thumbnails (-200x300 etc.) if higher-res exists
    const rawAllImages = [c.avatar_url, ...snapshotImages, ...archiveImages].filter(Boolean);
    const deduplicated = Array.from(new Set(rawAllImages)).filter((url) => {
      // Exclude low-res WP thumbnail versions if original/large exists
      if (/-200x300\./i.test(url) || /-150x150\./i.test(url)) return false;
      return true;
    });

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
  console.log(`-> Total photo count: ${totalImgs} photos (avg ${(totalImgs / pool.length).toFixed(1)} per cast)`);

  const outDir = join(process.cwd(), "public");
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, "cast_pool.json");
  writeFileSync(outPath, JSON.stringify(pool, null, 2));
  console.log(`✅ Saved enriched cast pool (with Wayback live URLs) to ${outPath}`);
}

main().catch(console.error);
