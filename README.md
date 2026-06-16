# 食品法規更新追蹤網站

這是一個可部署到 GitHub Pages 的靜態網站，用來追蹤食品工廠相關法規與公告。

## 功能

- 顯示法規更新表格
- 關鍵字搜尋
- 日期範圍篩選
- 影響程度篩選：高 / 中 / 低
- CSV 匯出
- 可在網頁編輯追蹤關鍵字
- 可在網頁調整預設顯示日期與日期格式
- 可在網頁新增、刪除、啟用或停用搜尋網站
- GitHub Actions 每月自動更新 `data.json`

## 使用方式

1. 建立一個新的 GitHub Repository。
2. 把本資料夾全部檔案上傳。
3. 到 Repository 的 `Settings > Pages`。
4. Source 選擇 `Deploy from a branch`。
5. Branch 選擇 `main`，資料夾選 `/root`。
6. 儲存後等待 GitHub Pages 產生網址。

## 編輯設定

網站首頁有「追蹤設定」區塊，可編輯：

- 追蹤關鍵字
- 預設顯示最近幾天
- 日期格式
- 搜尋網站清單

按「儲存設定」後，設定會存在目前瀏覽器。

如果要讓 GitHub Actions 每月自動搜尋也套用新設定：

1. 在網站按「下載 config.json」。
2. 到 GitHub 專案上傳並覆蓋根目錄的 `config.json`。
3. 下次每月自動更新會使用新的關鍵字與網站清單。

## 手動更新資料

```bash
node scripts/update-data.js
```

## 注意

此版本會用關鍵字自動篩選公告，但正式法規適用性仍需由品保、法規或主管確認。
