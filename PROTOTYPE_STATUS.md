# 63FLASH プロトタイプ状況

## 概要
requirements.md の仕様に基づき、Vite + React + TypeScript + Tailwind + Framer Motion で構築。
`npm run dev`（フロント）＋ `npm run dev:api`（wrangler pages dev、D1ローカル）で動作確認できる。

## 実装済みの機能

### 1. スタート画面・ゲーム前オプション設定
- **難易度選択 & 出題ルール**:
  - `EASY`: 2択 / 制限時間8秒 / ライフ5機 / **現役キャストのみ (約167名)** / 歴代アー写からランダム出題
  - `NORMAL`: 4択 / 制限時間5秒 / ライフ3機 / **現役＋OGキャスト (全394名)** / 歴代アー写からランダム出題
- **出題対象店舗選択（シンプル選択）**:
  - 「🌟 全店舗（ALL STORES）」または「単一店舗（63 ANGEL / SUPER SPARK / PARTY ON / ちゅらさん6）」のいずれかをスッキリ選べるラジオ/タブ式UI
  - 選択した店舗・難易度に応じて出題キャスト数（例: 全店舗 Normal時394名、Easy時167名）をリアルタイム表示
- **言語切替（日本語 / 英語）**:
  - 日本語: キャスト名を仮名・漢字表記（`src/data/nameDictionary.ts`による辞書管理）
  - 英語: キャスト名をローマ字表記
  - 全画面（UIテキスト、各種ラベル、ボタン等）が多言語対応
- **Web Audio シンセサイザーBGM**:
  - 完全スタンドアロンのWeb Audio APIチップチューン／シンセウェイヴ風BGMエンジン（`src/hooks/useAudio.ts`）
  - 全7トラック搭載、ランダム再生モード、音量スライダー、ON/OFF切替
- **店舗・難易度別 BEST SCORE表示**:
  - 選択した店舗構成と難易度に応じたベストスコアをリアルタイムに表示

### 2. プレイ画面
- 1問1キャストの画像＋難易度に応じた選択肢（EASY: 2択 / NORMAL: 4択）
- キャストごとに実写の複数「アー写」からランダムに1枚を表示（`store_cast_snapshots`のartist_imagesを使用）
- **プロフィールヒント機能**:
  - 写真カードの**右下**に、出身地・誕生日・身長・キャッチフレーズの中から1つを大きくネオンバッジ形式で強調表示
- 制限時間バー（EASY: 8秒 / NORMAL: 5秒、requestAnimationFrameベース）
- ライフ管理（EASY: 5機 / NORMAL: 3機、誤答または時間切れで減少）
- 直近5人と重複しないよう出題（`recentIdsRef`で除外）
- コンボ加算・スコア倍率（`100 × (1 + min(combo,10) × 0.1)`、コンボ10以上で頭打ち×2.0）
- 次の3問分の画像プリロード
- 同名キャスト（別店舗の同名の人）は同じ問題のダミー選択肢として出さない
- 選択肢ボタンは背景を暗めにし文字を大きく太字にして視認性を確保

### 3. ゲームオーバー時のプロフィール表示画面
- 不正解でライフが0になった問題の正解キャストの写真・名前・店舗名・公式プロフィールへのリンクを表示
- **OGキャストの場合**: 「🎓 OG (過去在籍)」バッジを表示してエモい振り返りが可能 → NEXTでリザルトへ

### 4. リザルト画面
- スコア、店舗・難易度別の**自己ベスト**、最大コンボ、正解率、**NEW RECORD!バナー**
- 難易度・店舗バッジの表示
- ニックネーム登録でCloudflare D1リーダーボードへスコア送信
- 「もう一度プレイ (RETRY)」と「⚙️ 設定・モードを変更する」ボタン
- ランキング閲覧画面への遷移

### 5. Cloudflare D1リーダーボード（API & UI）
- 難易度（`easy` / `normal`）および対象店舗（`all` / 店舗別）ごとのランキング保存・取得（`migrations/0002_add_store_difficulty.sql`）
- TOP20の順位・スコア・コンボ・登録日時の表示

### 6. サウンド＆エフェクト
- Web Audio APIによる効果音合成（タップ音、正解時の上昇アルペジオ、誤答時の下降音、コンボに応じたピッチ上昇）
- Framer Motionでのカード切替・コンボ演出
- localStorageによる自己ベスト・ニックネーム・言語設定・音量設定の保存

## データソース
- キャストデータ：R2の`generated/cast_master/latest.json`（ポインタ）→`{yyyymm}.json`から取得（`src/data/fetchCasts.ts`）
- 複数アー写：`generated/store_cast_snapshots/latest.json`→各店舗のスナップショットの`artist_images[].original_url`を`store`+`store_profile_slug`で突合
  - **既知のデータ品質問題**：元データ側で同一画像が複数の異なるプロフィール（slug）に誤って紐づくケースが16件確認されている（特にrokusan_angelの`ami`/`kai`周辺に集中、原因未確定）。63flash側は複数slugに共有される画像URLを`images[]`から除外する防御的対策済み（`fetchImagesByStoreSlug`）
- 開発時はViteの`/r2-proxy`経由（R2はCORS未対応のため）。本番は同一オリジンでのプロキシが必要（後述）。
- フェッチ失敗時は`src/data/mockCasts.ts`のダミーデータにフォールバック

## 未実装 / 今後の課題
- **ダミー選択肢のロジック**：完全ランダム（同名キャストのみ除外）。generation/tagsによる近似縛りは未実装
- **BPM連動の時間バー**：仕様書は「BPMに合わせて減少」だが、固定秒数（Easy: 8s, Normal: 5s）で実装
- **不正対策**：スコア整合性チェック（correctCount/maxCombo/scoreの上限）のみ。Turnstileやレート制限は未導入

## ファイル構成
```
functions/
  api/
    leaderboard.ts     # D1リーダーボードAPI（GET/POST, difficulty & store_id対応）
migrations/
  0001_init.sql        # 初期D1スキーマ
  0002_add_store_difficulty.sql # difficulty & store_idカラム追加
scripts/
  build-cast-pool.mjs   # 63calendar & 63archiveから現役・OG・歴代アー写を抽出して cast_pool.json を生成
public/
  cast_pool.json        # 統合キャストプール（現役167名 + OG 227名 = 計394名、複数写真対応）
src/
  components/
    StartScreen.tsx     # 難易度・店舗選択・BGM・言語設定
    GameScreen.tsx      # ゲーム進行・ヘッダー・カード表示
    FlashCard.tsx       # キャスト写真・右下単一ヒント表示・選択肢
    StoreLogo.tsx       # 各店舗のSVG/テキストロゴ
    ComboEffect.tsx
    MissRevealScreen.tsx # ゲームオーバー時のキャストプロフィール表示
    ResultScreen.tsx    # リザルト表示・ランキング送信
    LeaderboardScreen.tsx # 難易度・店舗別リーダーボード
  hooks/
    useGameLogic.ts     # フェーズ管理・スコア・タイマー・問題生成（難易度/店舗対応）
    useAudio.ts         # Web Audio APIによる効果音合成 & 7曲シンセBGMエンジン
  utils/
    preload.ts          # 画像プリロード
  data/
    mockCasts.ts        # モックキャストデータ（フォールバック用）
    fetchCasts.ts       # R2から実キャストデータ＋複数アー写を取得
    leaderboardApi.ts   # D1 API呼び出し
    nameDictionary.ts   # 日本語（漢字/仮名）表記辞書
  App.tsx
wrangler.toml
```

## 起動方法（ローカル）
```bash
cd /Users/sinya/vibecoding/63flash
npm install
npm run db:migrate:local   # D1ローカルsqliteへマイグレーション適用
npm run dev:api            # 別ターミナル: wrangler pages dev (port 8788)
npm run dev                # Vite (port 5173)
```
→ http://localhost:5173/ をブラウザで開く

## デプロイ
`DEPLOY.md` を参照。
