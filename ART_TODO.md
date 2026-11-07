# 美術素材清單（AI 生成）

《無名旅人的星光之路》Puzzle Adventure Visual Novel 化所需圖片。完成一項就把 `[ ]` 改成 `[x]`。

## 共通風格（每張 prompt 都要附上）

> Anime fantasy illustration, painterly digital art, highly detailed, deep navy and indigo night palette with warm golden lantern light accents, soft glowing particles, misty atmosphere, cinematic lighting, gentle melancholic and hopeful mood.

- 參考圖：`assets/starlight.png`（新圖的畫風、色調要和它一致）
- **世界設定：故事中的夜空「沒有星星」**。結局以前的場景都不要畫星星或銀河；月亮可以有，但要黯淡。
- 主角「無名旅人」：紅色斗篷、背著行囊、腰間掛提燈，臉不要畫清楚（玩家代入用）。
- 輸出：先存成 PNG，完成後轉成 **WebP**（品質約 80）。單張盡量小於 400KB。
- Negative：`text, watermark, signature, logo, extra fingers, deformed hands, modern objects, stars in sky`（結局 CG 不要加 `stars in sky`）

---

## A. 場景背景 — `assets/bg/`
尺寸 1920×1080（16:9）。畫面下方 30% 會被文字區的漸層蓋住，重要元素要放在中上方。

- [ ] `bg/wasteland.webp`：**星落荒原**。夜晚的廣闊草原，天空深得像一口井、沒有星星，遠方有微弱的村莊燈火和森林剪影，前景有半埋在草叢中的古老石碑。
- [ ] `bg/stone.webp`：**荒原石碑特寫**。長滿青苔、刻著模糊古文字的石碑，碑旁草叢裡有一片發出銀光的碎片。
- [ ] `bg/village.webp`：**微燈村**。木造小村，每扇窗邊都掛著熄滅的空燈籠，只有一盞燈籠閃著快熄的火苗，石板路通往村口。
- [ ] `bg/brook.webp`：**月影溪**。霧氣瀰漫的溪流，黯淡的月光倒映在水面，岸邊有蘆葦和圓石，霧中可以隱約看見小徑。
- [ ] `bg/forest.webp`：**低語之森**。巨大古樹、垂掛的青苔、林間的倒木，深處有一道被荊棘封住的石階小路。
- [ ] `bg/ruins.webp`：**星之殿遺跡（入口）**。藏在盤根錯節的巨大樹根下的古老石門，門中央有一個羅盤形狀的凹槽。
- [ ] `bg/hall.webp`：**星之殿內部**。圓形大殿，中央的空王座上方懸浮一頂破損的王冠，王冠中流動著無數細小的光點，牆上有壁畫。

## B. 角色立繪 — `assets/char/`
尺寸 1024×1536（2:3），**透明背景**、膝上半身、面向畫面略偏一側，每個角色的光線方向一致（左上）。
檔名格式：`char/<角色>-<表情>.webp`

- [ ] **小葵**（年輕的守燈人，約 17 歲少女，深棕色短髮、樸素的工作圍裙、手持長柄點燈桿）
  - [ ] `char/aoi-normal.webp` 平靜
  - [ ] `char/aoi-worried.webp` 擔憂
  - [ ] `char/aoi-smile.webp` 鬆了一口氣的微笑
- [ ] **小葵的弟弟**（約 8 歲男孩，抱著一盞空燈籠，衣服被霧沾濕）
  - [ ] `char/brother-scared.webp` 害怕
  - [ ] `char/brother-smile.webp` 害羞的笑
- [ ] **守林人**（中年男性，披著青苔斗篷，鬍鬚、溫和的眼神，手上纏著繃帶布條）
  - [ ] `char/ranger-normal.webp` 平靜
  - [ ] `char/ranger-serious.webp` 嚴肅（講述真相時）
  - [ ] `char/ranger-smile.webp` 微笑
- [ ] **白鹿**（發出淡淡白光的鹿，腿上有傷，鹿角像透明的樹枝）
  - [ ] `char/deer-hurt.webp` 受傷臥倒
  - [ ] `char/deer-stand.webp` 站立、低頭觸碰
- [ ] **國王**（只出現在壁畫和回憶中，年老、疲憊、戴著發光的王冠，表情帶著恐懼）
  - [ ] `char/king-memory.webp` 半透明、像回憶的質感

## C. 謎題：星之殿壁畫石板 — `assets/mural/`
尺寸 768×1024（3:4）。**古老石刻浮雕、褪色顏料的壁畫風格**，四張要像同一面牆，邊框一致。
這四張會直接放進第 1 階段已完成的排序謎題（`adventure/story.js` 的 `seal.puzzle.pieces`）。

- [ ] `mural/wish.webp`：眾人在星空下各自許願，星光從每一扇窗升起
- [ ] `mural/fear.webp`：黑暗從邊境蔓延，國王在城牆上徹夜不眠
- [ ] `mural/crown.webp`：國王收集了所有星光，封進一頂王冠
- [ ] `mural/dark.webp`：天空熄滅，再也沒有人抬頭

## D. 道具圖示 — `assets/items/`
尺寸 512×512、**透明背景**、物件置中，帶柔和光暈，風格統一（同一個角度、同樣的光線）。

- [ ] `items/compass.webp`：銀色羅盤，指針微微顫動，背面刻有細字
- [ ] `items/shard.webp`：銀色碎片，邊緣不規則、會發光
- [ ] `items/lantern.webp`：微光提燈，裡面有一小團溫暖的火種
- [ ] `items/leaf.webp`：光葉結晶，葉子形狀的透明結晶
- [ ] `items/seal-secret.webp`：封印的秘密，一卷發光的古老石刻拓本或卷軸

## E. 結局 CG — `assets/cg/`
尺寸 1920×1080。**這裡可以畫星星。**

- [ ] `cg/ending-return.webp`：**歸還**。王冠化為無數光點，飛越森林與屋頂，回到每扇窗前，夜空漸漸亮起，星星的形狀與從前不同、更加溫柔。
- [ ] `cg/ending-crown.webp`：**守望**。旅人獨自站在星之殿中，王冠化成溫暖的光環照亮遠方沉睡的王國，天空仍然沒有星星，畫面孤獨寧靜。
- [ ] `cg/ending-share.webp`：**共光（真結局）**。旅人把羅盤貼在胸口，光從胸前升起，化作一座連接夜空的光之橋，滿天星斗，遠方村民抬頭仰望。

## F. 其他（選做）

- [ ] `assets/ui/title.webp`（1920×1080）：遊戲標題畫面，旅人背影站在荒原上望著沒有星星的天空，畫面右側要留白放標題。
- [ ] `assets/ui/og.webp`（1200×630）：社群分享預覽圖。

---

### 給 Codex 的注意事項
1. 依照上面的路徑和檔名存檔，程式會照這些路徑讀取。
2. 同一個角色的所有表情要用同一個角色設定（seed／參考圖）生成，確保長相一致。
3. 立繪和道具圖要去背，存成帶透明通道的 WebP。
4. 生成完成後不需要修改程式，接圖是第 2 階段的工作。
