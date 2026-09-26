export type StoreId = "rokusan_angel" | "churasun6" | "party_on" | "super_spark";

export type Cast = {
  id: string;
  name: string;
  name_ja?: string;
  image_url: string;
  images?: string[];
  generation?: string;
  tags?: string[];
  store?: StoreId;
  storeName?: string;
  officialUrl?: string;
  birthday?: string;
  birthplace?: string;
  height?: string;
  catchphrase?: string;
};

const names = [
  "星野あかり", "月島みお", "花咲ゆき", "白鳥りん", "桜井なな",
  "水無月せな", "夜空つむぎ", "陽向まゆ", "紅葉かえで", "雪乃こはる",
  "美月るな", "碧海ひより", "小鳥遊あん", "天音そら", "琥珀いろ",
  "藤堂みさき", "朝霞ゆあ", "神楽さやか", "御堂かなで", "羽衣もえ",
];

const generations = ["1期", "2期", "3期", "4期", "5期", "6期", "7期"];
const tagPool = ["Dancer", "Vocal", "MC", "Model", "Cosplay"];

const mockStores: StoreId[] = ["rokusan_angel", "super_spark", "party_on", "churasun6"];

export const mockCasts: Cast[] = names.map((name, i) => ({
  id: `cast_${String(i + 1).padStart(3, "0")}`,
  name,
  image_url: `https://picsum.photos/seed/cast${i + 1}/480/640`,
  store: mockStores[i % mockStores.length],
  generation: generations[i % generations.length],
  tags: [tagPool[i % tagPool.length]],
}));
