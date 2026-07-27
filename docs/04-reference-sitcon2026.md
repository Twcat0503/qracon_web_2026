# 04 — SITCON 2026 拆解（技術與互動參考）

**參考範圍限定：互動模式、動畫手法、技術實作、頁面結構。**
內文、配色、字型、視覺調性一律不參考——理由見 `CLAUDE.md` §3。

來源：`https://sitcon.org/2026/`、公開原始碼 `https://github.com/sitcon-tw/2026`
（Astro，最後更新 2026-05）。以下為 2026-07-28 查證結果。

## 它的技術棧（實際 `package.json`）

| 套件               | 版本   | 用途                          |
| ------------------ | ------ | ----------------------------- |
| `astro`            | ^5.16  | 靜態站框架                    |
| `three`            | ^0.182 | 3D 場景                       |
| `cannon-es`        | ^0.20  | 物理引擎（3D 物件碰撞／掉落） |
| `gsap`             | ^3.14  | 時間軸動畫、捲動觸發          |
| `lenis`            | ^1.3   | 平滑捲動                      |
| `echarts`          | ^6.0   | 圖表                          |
| `@lucide/astro`    | ^0.562 | 圖示                          |
| `marked`           | ^17    | Markdown 內容渲染             |
| `sharp` / `canvas` | —      | 建置期產生議程卡與講者頭像圖  |
| `@astrojs/sitemap` | ^3.7   | SEO                           |

其他觀察：

- repo 根有 **`map-model.blend`**，語言統計含 **GLSL** → 3D 會場模型是自建 Blender 資產 + 自訂 shader。
- 樣式**沒有用 Tailwind**，是原生 CSS + CSS 變數 + rem。
- 字型：GenKiMinTW、GenKiGothicTW、Playfair Display、JetBrains Mono。
- i18n 目錄已存在但尚未全面啟用（repo 註記「之後再弄」）。
- 部署：production 走 GitHub Pages（GitHub Actions 推 `build` 分支），
  PR preview 走 Cloudflare Pages（有 `wrangler.jsonc`）。
- `src/` 結構：`components/ data/ i18n/ layout/ pages/ session-images/ types/ utils/`。
- 建置腳本會**在 build 期產生議程分享圖與工作人員頭像**，不是執行期產生。

## 值得借鑑的互動模式

### A. 會場地圖

SITCON 同時做了兩層：

1. **2D SVG 分層平面圖**（`/2026/img/venue/map_3F.svg`）——樓層選擇器（2F/3F/4F），
   點樓層進入該層平面，攤位清單可展開。這是**資訊層**，保證可讀、可搜尋、行動裝置友善。
2. **3D 模型**（Blender + three + cannon-es）——這是**體驗層**。

**對 QRACON 的啟示**：不要只做 3D。3D 是加分，2D SVG 才是當天真正被用來找路的東西。
若時程壓縮，**先做 2D 分層地圖，3D 列為 P4 後段**。

### B. 議程表

- 縱軸時間（08:00–17:45）、橫軸議程廳（R0/R1/R2/R3/S）的網格。
- 議程卡可點，導向 `/agenda/[id]` 獨立詳情頁（**不是 modal**，對 SEO 與分享友善）。
- 類型篩選鈕：Keynote / Presentation / Espresso / 開放式議程 / 合作議程 / 論壇。
- 標籤系統（`#資通安全`、`#AI / ML`）。
- **個人收藏**：側欄「你還沒有任何精選議程喔」，可加星號建立個人議程表。
- 行動版退化成純時序清單（同一份資料兩種呈現，非隱藏式 overflow）。

**對 QRACON 的啟示**：QRACON 是單日、廳數少，網格會比 SITCON 簡單很多。
收藏功能用 `localStorage` 即可，不需後端。詳情頁走靜態路由。

### C. 動效

- Lenis 平滑捲動 + GSAP ScrollTrigger 的捲動敘事。
- Hero 區圖片輪播（歷屆活動照）。
- 大量留白 + 分區塊進場動畫。

**對 QRACON 的啟示**：Lenis + GSAP 這組合成熟且與 Astro 相容良好，直接沿用技術選擇，
但動畫的「內容」必須是量子主題的原創設計，不抄它的節奏與轉場語彙。

## 明確不採用的部分

- 它的深色底 + 白字 + 音樂主題（「Jam the Chaos」）配色與調性。
- 它的字型組合（GenKiMinTW / Playfair Display）——QRACON 需自選，見 `01-design-system.md`。
- 它的推薦碼／分享獎勵機制（QRACON 規模不需要）。
- echarts（除非 QRACON 真的有統計圖表需求，否則不裝）。
- MCP Server 議程整合（超出本專案範圍）。

## 待驗證事項

- 3D 會場模型實際掛在哪個頁面、與 2D SVG 的切換方式為何——WebFetch 轉 markdown 會丟失
  canvas 元素，未能確認。**需要時直接讀 repo 的 `src/components/` 原始碼，不要靠猜。**
- 它的 3D 模型檔多大、載入策略為何（是否有 draco/meshopt 壓縮）。
