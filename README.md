# 星光旅誌

一個靜態作品集網站，包含互動文字冒險《無名旅人的星光之路》。

## 預覽

在此資料夾執行 `python3 -m http.server 8000`，然後在瀏覽器開啟 http://localhost:8000/。也可以直接開啟 `index.html`。遊戲進度儲存於瀏覽器 localStorage；清除瀏覽資料可能移除進度。

## 玩法

部分選項需要特定道具或信任值才會解鎖。星之殿的壁畫是排序謎題，解開後才能取得「封印的秘密」。真結局「共光」需要光葉結晶、封印的秘密，以及信任 2。

## 修改

- `index.html`：作品集首頁
- `style.css`：網站共用樣式
- `adventure/index.html`、`adventure/game.css`：遊戲介面
- `adventure/story.js`：故事、選項、解鎖條件、謎題和結局（欄位說明見檔案開頭註解）
- `adventure/game.js`：遊戲邏輯與存檔
- `assets/`：場景圖片
- `ART_TODO.md`：待生成的美術素材清單

## GitHub Pages

確認內容後，將檔案推送到公開 GitHub 儲存庫。在儲存庫 Settings → Pages，選擇從主要分支的根目錄發布。發布後 GitHub 會提供網站網址。
