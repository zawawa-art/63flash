# 概要
ROKUSAN ANGELのキャスト顔写真を使った、ネオン調デザインの高速フラッシュカード・リズムゲーム（Webアプリ）を作成してください。
プレイヤーは表示されるキャストのプロフィール画像を見て、制限時間内に正しい名前を4択から選んで回答します。

# 技術スタック
- Framework: Vite + React (TypeScript)
- Styling: Tailwind CSS (ダークモード / ネオンカラーテーマ)
- Animation: Framer Motion
- Sound Effects / BGM: Howler.js
- Deployment Target: Cloudflare Pages

# データ構造 (R2上の casts.json の仕様)
アプリ起動時に指定の外部URL (例: `https://YOUR-R2-DOMAIN/casts.json`) から以下のキャストマスターデータを fetch します。

```json
[
  {
    "id": "cast_001",
    "name": "キャスト名",
    "image_url": "https://YOUR-R2-DOMAIN/casts/cast_001.webp",
    "generation": "7期",
    "tags": ["Dancer"]
  }
]
```

# ゲーム仕様 & ロジック

### 1. ゲームフロー
1. **スタート画面**: 「START」ボタン、最高スコア表示、音量設定。
2. **プレイ画面**:
   - 1問ごとに1名のキャスト画像を表示。
   - 4つの選択肢（正解1名 ＋ ランダムに選ばれたダミー3名）を提示。
   - 1問あたりの制限時間バー（約2.5秒）がBPMに合わせて減少。
   - 時間切れ、または誤答でライフ減少（全3ライフ）、正解で次の問題へ。
   - 連続正解で「COMBO」が加算され、スコア倍率がアップ。
3. **リザルト画面**: 最終スコア、最大コンボ数、正解率、リトライボタンを表示。

### 2. 重要パフォーマンス要件 (遅延ゼロ対策)
- **画像のプレロード機能**:
  テンポ感を損なわないよう、現在の問題が表示されている間に「次の3問題分」の画像をバックグラウンドで事前読み込み (`new Image().src = ...`) してください。

### 3. オーディオ & 演出 (Howler.js / Framer Motion)
- **効果音 (SE)**:
  - 正解時: テンポの良いピンポン音（コンボ数に応じてピッチが少し上がる）
  - 誤答時: ブッブー音
  - カウントダウン / ボタンタップ音
- **演出**:
  - カード切替時は Framer Motion でスッと素早く切り替わるアニメーション。
  - コンボ発生時は画面のネオンライト（ピンク・紫・ゴールド）が激しく点灯・拡大する演出。

# コンポーネント構成案
- `src/components/StartScreen.tsx`
- `src/components/GameScreen.tsx`
- `src/components/ResultScreen.tsx`
- `src/components/FlashCard.tsx` (画像と選択肢ボタン)
- `src/components/ComboEffect.tsx`
- `src/hooks/useGameLogic.ts` (スコア、タイマー、問題生成ロジック)
- `src/hooks/useAudio.ts` (Howler.jsの制御)
- `src/utils/preload.ts` (画像プレロード処理)

まずはモックデータ（ダミーのキャスト配列）を使って、上記仕様でサクサク動作するプロトタイプを一式作成してください。
