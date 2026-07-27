# 03 — 技術棧與工程決策

## 已定案

| 項目     | 選擇                          | 理由                                                                    |
| -------- | ----------------------------- | ----------------------------------------------------------------------- |
| 框架     | **Astro 5.x**                 | 使用者指定。內容型網站最佳解：預設零 JS、島嶼架構讓 3D 只在需要處水合。 |
| 3D       | **Three.js**                  | 使用者指定。                                                            |
| 輸出     | **靜態 (`output: 'static'`)** | 全站無需伺服器邏輯；報名走外部平台。                                    |
| 套件管理 | **pnpm**                      | 磁碟效率與嚴格依賴解析。                                                |
| 語言     | **TypeScript**                | 內容資料需要型別保護（議程、講者結構複雜且會反覆改）。                  |

## 建議採用（待確認，非使用者指定）

| 項目     | 建議                                 | 理由                                                    |
| -------- | ------------------------------------ | ------------------------------------------------------- |
| 捲動動畫 | **GSAP + ScrollTrigger**             | 與 Astro 相容，時間軸控制精確，SITCON 已驗證。          |
| 平滑捲動 | **Lenis**                            | 輕量，可與 GSAP ticker 同步，避免兩套 RAF 打架。        |
| 樣式     | **原生 CSS + CSS Custom Properties** | 見下方「樣式方案取捨」。                                |
| 圖示     | `@lucide/astro`                      | 編譯期 inline SVG，零執行期成本。                       |
| 圖片     | Astro `<Image />` + sharp            | 自動 WebP/AVIF、尺寸標註防 CLS。                        |
| 部署     | **Cloudflare Pages**                 | 使用者環境已有 Cloudflare 工具鏈；PR preview 開箱即用。 |
| 格式化   | Prettier + `prettier-plugin-astro`   | —                                                       |

## ✅ 樣式方案：原生 CSS + CSS 變數（定案 2026-07-28）

採**選項 A**。理由與取捨紀錄如下，供日後回顧決策依據。

**落地規範**

- `src/styles/tokens.css` 是 design token 的唯一來源，用 `:root` 的 custom properties 定義。
- 全域重置與基礎排印放 `src/styles/global.css`，由 base layout 引入一次。
- 元件樣式一律用 Astro 的 `<style>`（預設 scoped），不寫全域選擇器。
- 需要跨元件共用的樣式模式（如卡片、按鈕），做成元件，不做成 utility class ——
  既然不用 Tailwind，就不要手刻一套半吊子的 utility 系統，那是兩邊的缺點都拿到。
- 命名採 `--color-phase-a` 這類語意化命名，不用 `--color-blue`；
  色彩方向是「相位雙色」，色值可能會換，語意名稱才不會在換色時全站失效。

### 取捨紀錄

**選項 A：原生 CSS + CSS 變數**（採用）

- 優點：無建置額外負擔；design token 就是 CSS 變數，設計師可直接讀懂；
  Astro 的 scoped style 已解決樣式污染；SITCON 同樣選擇這條路且規模相當。
- 缺點：需要自律維護命名規範，沒有工具強制。

**選項 B：Tailwind CSS v4**

- 優點：token 由 config 集中管理；`@theme` 語法與 CSS 變數整合良好；開發速度快。
- 缺點：本站頁面數少（約 6–8 頁）、視覺高度客製、大量自訂動畫與 shader 疊層，
  Tailwind 的邊際效益低；class 字串會讓 3D 疊層區塊的樣板可讀性變差。

**結論**：本站是「少量頁面、高度客製視覺」，不是「大量頁面、重複元件」，
Tailwind 的最大優勢在此不成立。已採 A。

## Three.js 使用紀律（硬性）

1. **不進首屏關鍵路徑**：3D 元件用 Astro `client:visible` 或 `client:idle`，
   絕不用 `client:load`。three 的 bundle 動態 import。
2. **必有 fallback**：WebGL 不可用、`prefers-reduced-motion: reduce`、
   低階裝置（`navigator.hardwareConcurrency <= 4` 或行動裝置）→ 顯示靜態主視覺圖。
   Fallback 圖必須是設計過的成品，不是「3D 的截圖」。
3. **預算**：3D 相關 JS gzip 後 **≤ 250 KB**；模型檔（若有）用 Draco 或 meshopt 壓縮，
   **≤ 1.5 MB**。超標就簡化場景，不要加載入動畫掩蓋。
4. **離開視窗即停**：`IntersectionObserver` 停掉 render loop，避免背景吃電。
5. **不用 3D 承載必要資訊**：任何只有轉動 3D 才看得到的文字或路徑資訊，都是設計錯誤。

## 效能預算（Lighthouse 行動版）

| 指標                    | 目標               |
| ----------------------- | ------------------ |
| LCP                     | ≤ 2.5s             |
| CLS                     | ≤ 0.1              |
| INP                     | ≤ 200ms            |
| 首屏 JS（不含 3D 島嶼） | ≤ 50 KB gzip       |
| Performance 分數        | ≥ 90（3D 頁 ≥ 80） |

## 規劃中的目錄結構

```text
src/
├── components/       # 元件；3D 相關獨立放 components/three/
├── data/             # 內容資料（TS，型別化）：sessions, speakers, sponsors, faq
├── layouts/          # 頁面骨架
├── pages/            # 路由
├── styles/           # tokens.css（唯一 token 來源）、global.css
├── types/            # 共用型別
└── utils/
public/
├── fonts/            # 自架字型（subset 後）
└── models/           # 3D 資產
```

## 待決事項

- 報名平台（KKTIX / Accupass / 自建表單）——影響 CTA 連結與是否需要 embed。
- 是否需要中英雙語。若需要，**必須在 P2 骨架階段就導入 i18n**，
  後補的成本是重寫所有樣板（SITCON 就卡在這裡）。
- 網域（`qracon.tw`? 沿用 `qracon.entangletech.tw`?）。
