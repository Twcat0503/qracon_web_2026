# QRACON 2026 官網
這是 QRACON 2026 的官方網站，參考了 [SITCON 2026](https://sitcon.org/2026/) 的設計風格與3D會場地圖概念，同時參考了 QRACON2025 的內容與文案進行填充。

# 網站
https://2026-qracon.entangletech.tw/2026/

# 技術站
- Astro
- Three.js (Maybe 如果時間夠跟搓的出來3D會場圖的話)

## 開發文件

- [前端程式碼導覽](docs/frontend-structure.md)

## GitHub Pages 部署

GitHub Pages 會從此 repository 的 `main` 分支建置並部署網站至 `/2026/`。Astro 設定 `base: '/2026'`，因此站內路徑、SEO 網址與靜態資源都使用共用網域下的年度路徑。共用網域由 `QRACON-tw/qracon-tw.github.io` 管理。
