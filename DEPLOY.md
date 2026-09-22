# デプロイ手順（Cloudflare Pages + D1）

本番URL: https://63flash.pages.dev

## 初回セットアップ（済み）
```
npx wrangler login                              # 未ログインなら
npx wrangler d1 create 63flash-leaderboard       # 本番D1作成、database_idをwrangler.tomlに反映済み
npx wrangler d1 migrations apply 63flash-leaderboard --remote   # スキーマ適用
npx wrangler pages project create 63flash --production-branch main
```

## デプロイ（変更を反映するたび）
```
npm run build
npx wrangler pages deploy dist --project-name 63flash
```
- `functions/` 配下（`api/leaderboard.ts`, `r2-proxy/[[path]].ts`）は `wrangler pages deploy` が自動でFunctionsとしてバンドルする。
- `wrangler.toml` の `[[d1_databases]]` バインディングはPages Functionsにも自動的に適用される。

## 本番特有の構成
- **R2 CORSプロキシ**: R2バケットはCORSヘッダーを返さないため、ブラウザから直接fetchできない。`functions/r2-proxy/[[path]].ts` が同一オリジンでR2へのGETをプロキシする（開発時はVite側の `/r2-proxy` プロキシが同じ役割）。`src/data/fetchCasts.ts` は常に `/r2-proxy` を叩く。
- **D1**: `functions/api/leaderboard.ts` が `env.DB`（`wrangler.toml`のbinding名`DB`）経由でリモートD1に接続。ローカル開発時は`wrangler pages dev --local`が別のsqliteファイルを使う（本番DBとは分離）。

## 動作確認済み
- 実キャストデータ取得（R2経由、CORSプロキシ動作）
- ゲームプレイ〜ゲームオーバー〜プロフィール表示〜リザルト
- D1リーダーボードへの登録・取得（本番で実際にINSERT/SELECT確認済み）

## 今後デプロイ時の注意
- D1のスキーマを変更する場合は `migrations/` に追加し、`npx wrangler d1 migrations apply 63flash-leaderboard --remote` を忘れずに実行する。
- `wrangler.toml` の `database_id` は本番用の実IDが入っているため、誤って別プロジェクトのIDに書き換えないこと。
