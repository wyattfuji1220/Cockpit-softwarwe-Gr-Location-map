# Cockpit Software Gr. — サプライヤー拠点マップ

担当仕入先12社の**本社／開発拠点／製造拠点**を一元管理・可視化する静的Webサイトです。
世界地図版と日本地図版の2ページ構成で、拡大／縮小・フィルタ・ホバー詳細に対応します。

## 収録企業

| # | 企業名 | 主な担当領域 |
|---|--------|--------------|
| 1 | パナソニック オートモーティブシステムズ | コックピットシステム／IVI／車載カメラ |
| 2 | デンソーテン | IVI／ディスプレイオーディオ／ECU |
| 3 | ビステオン (Visteon) | デジタルクラスタ／SmartCore／ディスプレイ |
| 4 | 日本精機 (NIPPON SEIKI) | メータ／HUD／計器類 |
| 5 | Desay SV (德赛西威) | コックピットドメインコントローラ／IVI |
| 6 | LGエレクトロニクス | 車載インフォテインメント／テレマティクス |
| 7 | LGディスプレイ | 車載ディスプレイパネル (LCD／OLED) |
| 8 | パイオニア | カーナビ／ディスプレイオーディオ |
| 9 | Molex | コネクタ／ハーネス／車載インターコネクト |
| 10 | ハーマン (HARMAN) | 車載オーディオ／インフォテインメント |
| 11 | 原田工業 (HARADA) | 車載アンテナ |
| 12 | ヨコオ (YOKOWO) | 車載アンテナ／コネクタ／コンタクトプローブ |

## サイト構成

```
index.html          トップ（サマリーダッシュボード）
world.html          世界地図ビュー
japan.html          日本地図ビュー
table.html          拠点一覧テーブル（検索・ソート・CSV出力）
assets/
  css/style.css     デザインシステム（ニュアンス配色）
  js/data.js        拠点マスタデータ
  js/icons.js       施設種別ピクトグラム／企業ロゴマーク
  js/map.js         地図共通ロジック
  js/ui.js          フィルタ・凡例・パネル
  logos/            企業ロゴ（差し替え可能）
```

## 技術構成

- **地図**: Leaflet 1.9 + CARTO Positron（淡色グレー基調タイル）
- **依存**: CDN経由のLeafletのみ。ビルド不要、`index.html` をブラウザで開けば動作
- **データ**: `assets/js/data.js` の単一ファイルで拠点マスタを管理

## データの取り扱い

- 出典はすべて**公開情報**（各社公式サイトの拠点一覧・会社概要、有価証券報告書、公式ニュースリリース等）
- 各拠点に `confidence`（確度）と `geoPrecision`（座標精度）を付与
  - `confidence`: `high` = 公式サイトに住所記載 / `medium` = 公式に都市名まで記載 / `low` = 二次情報ベース、要確認
  - `geoPrecision`: `exact` = 住所ベース / `city` = 市区町村中心 / `country` = 国中心
- 確度 `low` の拠点はUI上で「要確認」バッジを表示します

## ロゴについて

`assets/logos/official/` に各社公式サイトから取得したロゴを配置しています（個人利用の範囲での利用）。
`assets/js/data.js` の `COMPANIES[].logo` / `ar`（アスペクト比）で参照します。

| 企業 | ファイル | 取得元 |
|------|----------|--------|
| パナソニックAS | `pas.svg` | automotive.panasonic.com |
| デンソーテン | `dten.png` | denso-ten.com |
| ビステオン | `vist.svg` | Visteon IR CDN (q4cdn.com) |
| 日本精機 | `nseiki.png` | nippon-seiki.co.jp |
| LGエレクトロニクス | `lge.svg` | lg.com |
| LGディスプレイ | `lgd_sprite.png` | lgdisplay.com（縦2段スプライト・下段が濃色版） |
| パイオニア | `pioneer.svg` | assets.jpn.pioneer |
| ハーマン | `harman.svg` | harman.com |
| 原田工業 | `harada.png` | harada.com |
| ヨコオ | `yokowo.svg` | yokowo.co.jp |
| **Desay SV** | — | サイト側のbot対策で未取得（モノグラム表示） |
| **Molex** | — | サイト側のbot対策で未取得（モノグラム表示） |

- 縦分割スプライト形式のロゴは `crop: { rows, row }` を指定すると該当行だけを切り出して表示します。
- ロゴ未取得の企業は自動的にモノグラムマーク（`assets/logos/<id>.svg`）にフォールバックします。
- **公式ロゴは各社の商標です。** 本サイトは個人・社内での担当業務把握を目的とした資料であり、
  社外公開・配布時は各社のブランドガイドライン確認が必要です。

### マーカー表示モード

| モード | 挙動 |
|--------|------|
| 自動（既定） | ズーム6未満は円形モノグラム、ズーム6以上は公式ロゴのピル型マーカー |
| 記号 | 常に円形モノグラム（拠点密度の把握に最適） |
| ロゴ | 常に公式ロゴのピル型マーカー |

## Git運用ルール

**コードを変更するたびに必ず GitHub へプッシュする。**

```bash
git add -A && git commit -m "<変更内容>" && git push origin main
```

- リモート: https://github.com/wyattfuji1220/Cockpit-softwarwe-Gr-Location-map.git
- ブランチ: `main`
- コミットメッセージは日本語、`[データ]` `[UI]` `[修正]` などの接頭辞を付与
