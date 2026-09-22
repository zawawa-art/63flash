# 63FLASH プロトタイプ状況

## 概要
requirements.md の仕様に基づき、Vite + React + TypeScript + Tailwind + Framer Motion で構築。
`npm run dev`（フロント）＋ `npm run dev:api`（wrangler pages dev、D1ローカル）で動作確認できる。

## 動いているもの
- スタート画面（タイトル、BEST SCORE表示、音量スライダー、STARTボタン、ランキングを見るボタン）
- プレイ画面
  - 1問1キャストの画像＋4択（正解1名＋ランダムダミー3名）
  - キャストごとに実写の複数「アー写」からランダムに1枚を表示（`store_cast_snapshots`のartist_imagesを使用）
  - 制限時間5秒（requestAnimationFrameベース）
  - ライフ3、誤答/時間切れで減少
  - 直近5人と重複しないよう出題（`recentIdsRef`で除外）
  - コンボ加算・スコア倍率（`100 × (1 + min(combo,10) × 0.1)`、コンボ10以上で頭打ち×2.0）
  - 次の3問分の画像プリロード
  - 同名キャスト（別店舗の同名の人）は同じ問題のダミー選択肢として出さない
  - 選択肢ボタンは背景を暗めにし文字を大きく太字にして視認性を確保
- **ゲームオーバー時のプロフィール表示画面**：不正解でライフが0になった問題の正解キャストの写真・名前・店舗名・公式プロフィールへのリンクを表示 → NEXTでリザルトへ
- リザルト画面（スコア、**自己ベスト**、最大コンボ、正解率、**NEW RECORD!バナー**、ニックネーム登録、RETRY、ランキングを見る）
- **Cloudflare D1リーダーボード**：ニックネーム登録でスコアをサーバに送信、TOP20を表示（`functions/api/leaderboard.ts`）
- Web Audio APIでその場合成する効果音（タップ音、正解時の上昇アルペジオ、誤答時の下降音）— mp3ファイル不要
  - 正解時のアルペジオはコンボ数に応じて音程が`1 + √combo × 0.15`で上限なく上がっていく（sqrtで緩やかに、頭打ちしない）
- Framer Motionでのカード切替・コンボ演出
- localStorageによるベストスコア・ニックネーム保存（ランキング登録せずローカルの自己ベスト更新だけでも遊べる）

## データソース
- キャストデータ：R2の`generated/cast_master/latest.json`（ポインタ）→`{yyyymm}.json`から取得（`src/data/fetchCasts.ts`）
- 複数アー写：`generated/store_cast_snapshots/latest.json`→各店舗のスナップショットの`artist_images[].original_url`を`store`+`store_profile_slug`で突合
  - **既知のデータ品質問題**：元データ側で同一画像が複数の異なるプロフィール（slug）に誤って紐づくケースが16件確認されている（特にrokusan_angelの`ami`/`kai`周辺に集中、原因未確定）。63flash側は複数slugに共有される画像URLを`images[]`から除外する防御的対策済み（`fetchImagesByStoreSlug`）
- 開発時はViteの`/r2-proxy`経由（R2はCORS未対応のため）。本番は同一オリジンでのプロキシが必要（後述）。
- フェッチ失敗時は`src/data/mockCasts.ts`のダミーデータにフォールバック

## 未実装 / 今後の課題
- **ダミー選択肢のロジック**：完全ランダム（同名キャストのみ除外）。generation/tagsによる近似縛りは未実装
- **BPM連動の時間バー**：仕様書は「BPMに合わせて減少」だが、今回は固定5秒で実装
- **不正対策**：スコア整合性チェック（correctCount/maxCombo/scoreの上限）のみ。Turnstileやレート制限は未導入（「初めてのD1体験」というスコープのため見送り済み）

## ファイル構成
```
functions/
  api/
    leaderboard.ts     # D1リーダーボードAPI（GET/POST）
migrations/
  0001_init.sql        # D1スキーマ
src/
  components/
    StartScreen.tsx
    GameScreen.tsx
    FlashCard.tsx
    ComboEffect.tsx
    MissRevealScreen.tsx  # ゲームオーバー時のキャストプロフィール表示
    ResultScreen.tsx
    LeaderboardScreen.tsx
  hooks/
    useGameLogic.ts     # フェーズ管理・スコア・タイマー・問題生成
    useAudio.ts          # Web Audio APIによる効果音合成
  utils/
    preload.ts           # 画像プリロード
  data/
    mockCasts.ts         # モックキャストデータ（フォールバック用）
    fetchCasts.ts         # R2から実キャストデータ＋複数アー写を取得
    leaderboardApi.ts     # D1 API呼び出し
  App.tsx
wrangler.toml
```

## 起動方法（ローカル）
```
cd /Users/sinya/vibecoding/63flash
npm install
npm run db:migrate:local   # D1ローカルsqliteへマイグレーション適用（初回のみ）
npm run dev:api            # 別ターミナル: wrangler pages dev (port 8788)
npm run dev                 # Vite (port 5173)
```
→ http://localhost:5173/ をブラウザで開く

## デプロイ
`DEPLOY.md` を参照。
