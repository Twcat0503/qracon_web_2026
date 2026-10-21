# 前端程式碼導覽

## 頁面與資料

- `src/pages/`：Astro 頁面，負責組合區塊與頁面專屬排版。
- `src/components/`：共用元件；議程相關元件集中在 `agenda/`。
- `src/data/sessions.ts`：議程資料、類型、階段與收藏資格。
- `src/data/rooms.ts`：場地資料與排序。
- `src/types/agenda.ts`：議程與場地的型別。
- `src/styles/tokens.css`：共用設計變數。

## 議程的顯示與互動

`Timetable.astro` 負責時間表結構與樣式，格線位置、時間標記和排序由 `src/utils/timetable.ts` 計算。格線第 1 列保留給場地標題；全體議程使用較短的時間格。

`src/scripts/agenda.ts` 是初始化入口，依功能載入以下模組：

| 模組 | 職責 |
| --- | --- |
| `agenda/now.ts` | 當前時間、場次狀態與即時看板 |
| `agenda/filters.ts` | 類型、收藏篩選、數量與空結果 |
| `agenda/controls.ts` | 手機篩選面板、階段跳轉與固定工具列高度 |
| `agenda/rooms.ts` | 場地橫向捲動、選單與前後切換 |
| `agenda/highlight.ts` | 場次、時間及場地的同步反白 |
| `agenda/phases.ts` | 階段定位後的提示動畫 |
| `agenda/motion.ts` | 減少動態效果偏好與動畫設計變數 |

議程詳情共用 `SessionContent.astro`；彈窗結構位於 `SessionDialog.astro`。收藏的儲存與同步由 `src/scripts/punches.ts` 處理。

### 模組間的事件

- `agenda:filters-changed`：篩選更新後，同步階段與可見場地。
- `agenda:reset-highlight`：詳情彈窗關閉後，清除反白狀態。

修改元件結構時，需同步檢視腳本使用的 `data-*` 屬性。響應式版面調整請留在元件及頁面的 CSS；資料與時間格計算則留在資料和工具模組。
