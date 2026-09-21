# 人生重开 · 禄 · 离线版

这是基于 [VickScarlet/remake](https://github.com/VickScarlet/remake) 制作的 Android 离线版。

## 已实现内容

- Android APK，可断网运行，不需要服务器或 VPS。
- 使用 Material 3 风格重新设计界面：顶部应用栏、圆角卡片、填充按钮、M3 色板和深浅色主题。
- 支持存档导出与导入：主页面右下角有导出/导入按钮，导出会生成 JSON 存档，导入可以选择存档文件并恢复。
- 日志自动写入手机存储：`/storage/emulated/0/skyzl/liferestart/liferestart.log`。
- 首次启动会提示授予“所有文件访问权限”，用于把日志写入根目录；未授权时会先写到应用外部目录，授权后自动迁回根目录。
- 新增橙色天赋【禄】：
  - 名称：禄
  - 描述：【Sky增禄】。
  - 效果：初始可用属性点 +2000，快乐 +100。
- 新增模式“我的命运我做主！”：
  - 列出全部天赋。
  - 最多可选择 10 个天赋。
  - 选择后进入属性分配并开始人生。
- 新增第 5 档“彩色天赋”：
  - 基础出货率是金色天赋的 1/10。
  - 金色和彩色天赋的出货率都随重开次数提升；紫色天赋保持原有规则，不受影响。
  - 每局可选择的彩色天赋数量随已解锁成就数量增加：0-39 个成就为 1 个，40-79 为 2 个，80-119 为 3 个，120-159 为 4 个，160 个及以上为 5 个。
- 新增三个彩色天赋：
  - 【先天道体】：修炼和事件中提升的体质、智力变为十倍。
  - 【法则之子】：悟出大道、天道的概率变为十倍。
  - 【仙族弟子】：6岁即可开始修炼，原修炼链的年龄限制已同步放开。
- 新增驭鬼者路线（《神秘复苏》）：
  - 金色天赋【鬼眼】：描述为“我将终结灵异时代。 -杨间”，获得后进入驭鬼者路线。
  - 【鬼眼】与【仙族弟子】【神秘的小盒子】互斥。
  - 18岁必定触发“驾驭鬼眼”，此后替换普通人生事件，不与修仙等路线并行。
  - 每年按权重判定：5%/10%厉鬼复苏死亡、10%处理灵异事件死亡、50%处理灵异事件、15%驾驭新厉鬼、15%获得灵异物品。拥有【法则之子】时，厉鬼复苏死亡率降为5%。
  - 处理灵异事件：体质、智力+1。
  - 驾驭新的厉鬼/获得灵异物品：体质、智力+10，且名称通过动态文本写入事件。
  - 厉鬼和灵异物品不会重复获得；抽取池耗尽后只保留处理灵异事件与死亡结果。
  - 第一次驾驭满5只厉鬼时：50%成为异类，体质覆盖为500，寿命上限变为100；否则厉鬼复苏死亡。
  - 100岁及以前，若厉鬼≥10且包含【静悄悄】【许愿鬼】，且灵异物品≥5，则立即触发金色成神结局；否则肢解自身灵异并死亡。
  - 新增成就【神秘复苏】（紫色）和【杨戬】（金色），均不隐藏。
  - 按分享正文整理并去重后，厉鬼88种、灵异物品14种；【先天道体】同样适用于本路线的属性提升。
- 新增事件：`你考上了一所普通高中。\n班主任的名字叫杨增禄。`，与普通高中事件同龄触发，权重略高。
- 修复渡劫失败转世重修后卡死：现在会正确把年龄重置并继续转世人生。

## 直接安装

把根目录下的 `人生重开-禄-离线版.apk` 发送到 Android 手机并安装。

## Windows 便携版 exe

`人生重开-禄-便携版.exe` 是免安装的 Windows 便携版，双击即可运行，不需要联网。

桌面版日志位于 exe 同目录：

```text
skyzl\liferestart\liferestart.log
```

桌面版同样支持主页面右下角的存档导出/导入按钮，会调用 Windows 系统文件对话框。

APK 信息：

- 包名：`com.skyzenglu.liferestart`
- 最低 Android 版本：Android 6.0 / API 23
- 签名：Android 调试签名，允许侧载安装

## 从源码重新构建 APK

环境要求：

- Node.js 20 或更高版本
- pnpm
- JDK 21
- Android SDK 35 和 Build-Tools 35

在项目根目录执行：

```bash
pnpm install
pnpm build:data
pnpm cap:sync
cd android
gradlew.bat assembleDebug
```

重新生成 Windows 便携版 exe：

```bash
pnpm build:exe
```

Windows 下如果使用 PowerShell，最后一步也可以写成：

```powershell
.\gradlew.bat assembleDebug
```

生成的 APK 位于：

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

## 数据修改位置

- 天赋数据：`packages/data/src/talent.xlsx`
- 游戏事件/仙法/渡劫数据：`packages/data/src/event.xlsx`
- 天赋模式和抽取逻辑：`packages/hooks/src/talent.ts`
- 模式定义：`packages/hooks/src/play.ts`
- 自定义模式界面：`apps/web/src/containers/Pick.tsx`
- 存档导入导出：`apps/web/src/storage/save.ts`
- 日志写入：`apps/web/src/storage/logger.ts` 和 `android/app/src/main/java/com/skyzenglu/liferestart/SkyLoggerPlugin.java`
- 桌面版入口：`desktop/main.cjs`、`desktop/preload.cjs`
- Material 3 样式：`apps/web/src/styles/material.css`

`packages/data/dist` 和网页构建产物已一并保留；如果修改了 `.xlsx` 数据，需要先运行 `pnpm build:data` 重新生成数据文件。
