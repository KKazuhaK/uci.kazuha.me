# IN4MATX 133: User Interface Software — Lecture 14：移动设计原则

## 目录

- [1. 什么是好的用户体验？](#1-什么是好的用户体验)
- [2. 有用的初始界面](#2-有用的初始界面)
- [3. “哎呀”按钮](#3-哎呀按钮)
- [4. 错误预防](#4-错误预防)
- [5. 遵循平台惯例](#5-遵循平台惯例)
- [6. 人机界面指南](#6-人机界面指南)
- [7. iOS HIG：导航与模态框](#7-ios-hig导航与模态框)
- [8. iOS HIG：品牌、颜色与字体](#8-ios-hig品牌颜色与字体)
- [9. 热门应用中的设计选择](#9-热门应用中的设计选择)
- [10. 应用图标与系统图标](#10-应用图标与系统图标)
- [11. Google Material Design 与 Android、iOS 对比](#11-google-material-design-与-androidios-对比)
- [12. 规划 A4：绘制页面，勾勒架构](#12-规划-a4绘制页面勾勒架构)
- [13. 课堂问题与演示（附解答）](#13-课堂问题与演示附解答)
- [14. 速查与必记的 5 个要点](#14-速查与必记的-5-个要点)

> UCI IN4MATX 133: User Interface Software — Prof. Travis Linden Reid，2026 年秋季学期，周四 11/12（第 7 周）
> 内容整理自 Lecture 14 的幻灯片（共 40 页）。这是一堂设计课：课程仓库中没有它的 demo 文件夹，因此这里的现场演示是根据幻灯片原则手工制作的小示例。内容按概念组织，而不是按来源组织。

> 📅 **课程安排**：A2 成绩已公布。A4 已发布——它较少手把手指导，需要花更多时间研读 Ionic 文档；到本学期的这个阶段，你已经具备所需的全部技能。**A4 的 README 至关重要**，而今天的概念正是写好 README 的关键。
> 第 7–10 周计划：A5 现在是一个**开放式应用开发项目**，而不再是 AI 项目。技术讲座的内容快要讲完了，剩余的是：设备资源、数据库、SASS。第 10 周可能就是开始做期末项目的时间。

---

## 1. 什么是好的用户体验？

讲义开头提出一个问题（幻灯片 5）：*什么是好的用户体验？* 幻灯片 6 给出的答案是：**它不只是 UI。** 体验从你第一次启动应用或打开网站时就开始了，它包含几个组成部分：

- **初次印象**（从开机到应用启动）
- **用户界面**
- **视觉设计**
- **信息呈现**
- **物理设备**，以及用户如何把它与应用配合使用

接下来是移动设计的四条原则（幻灯片 7）：有用的初始界面、“哎呀”按钮、错误预防，以及遵循平台惯例，分别对应第 2–5 节。

## 2. 有用的初始界面

第一屏本身就应该有价值（幻灯片 8）：

- **给用户清晰的行动号召。**
- **在首页放上有用的内容**——例如 Pinterest 的首页一打开就是图片网格；首页不应只放导航按钮。
- **让用户很容易回到首页**——通过底部导航栏或侧边导航菜单。

幻灯片对比了两张截图：Pinterest（搜索栏，然后是图片信息流，底部有导航栏），以及一款焦虑管理应用，它的首页是一排圆形图标按钮，每个按钮都只是跳转到别处——只有导航，没有别的内容。

## 3. “哎呀”按钮

功能和按钮经常被误按，因此（幻灯片 9）：

- **撤销和重做应该很容易**——Gmail 的“撤销发送”就是例子（截图展示的是写邮件界面）。
- **返回上一页应该很容易**——面包屑导航或返回按钮（位于左上角）。

用 Ionic 的说法，“撤销发送”就是一个带有 **Undo** 按钮的 toast（[Lecture 13](lec-13.zh-CN.md#8-模态对话框toastalertaction-sheet) 介绍了 toast）。按下发送后，如果在 4 秒内按下撤销，会得到 `Send undone: back to the draft`；如果超时，则得到 `Message really sent`：

```viz web-demo
{"title": "The “uh-oh” button: an “undo send” toast (slide 9) · hand-made example with an Ionic toast", "width": 375, "height": 300, "interactive": true, "html": "<link rel=\"stylesheet\" href=\"https://cdn.jsdelivr.net/npm/@ionic/core@8.8.19/css/ionic.bundle.css\">\n<script>window.Ionic = { config: { mode: \"ios\" } };</script>\n<script type=\"module\" src=\"https://cdn.jsdelivr.net/npm/@ionic/core@8.8.19/dist/ionic/ionic.esm.js\"></script>\n<ion-app>\n<ion-header><ion-toolbar><ion-title>Compose</ion-title></ion-toolbar></ion-header>\n<ion-content class=\"ion-padding\">\n  <p>Lunch Saturday?</p>\n  <ion-button id=\"send\">Send</ion-button>\n</ion-content>\n</ion-app>", "js": "document.getElementById('send').addEventListener('click', () => {\n  let undone = false;\n  const toast = Object.assign(document.createElement('ion-toast'), {\n    message: 'Message sent.', duration: 4000,\n    buttons: [{ text: 'Undo', handler: () => { undone = true; } }]\n  });\n  toast.addEventListener('didDismiss', () => toast.remove());\n  document.body.appendChild(toast);\n  toast.present();\n  toast.onDidDismiss().then(() => {\n    console.log(undone ? 'Send undone: back to the draft' : 'Message really sent');\n  });\n});"}
```

## 4. 错误预防

在小屏幕上输入信息很困难，因此要尽可能多地提供输入辅助（幻灯片 10）：

- **添加输入检查**——电话号码有几位数字？信用卡号呢？
- **使用合适的控件**——日期／时间滚轮、滑块。

幻灯片的截图包括一个 Android 活动表单（日期字段显示 “Wed, Sep 19, 2012”，时间被高亮），以及一个 DatePicker 滚轮（Sep/Oct/Nov、03/04/05、2016/2017/2018）——用户不必手动输入日期，而是转动只能产生有效值的滚轮。

下面是一个同时包含这两种思路的小型预订表单：电话字段在输入时统计数字，除非恰好是 10 位，否则不允许提交；日期使用浏览器的日期选择器，人数使用滑块。这一步会输入一个 7 位数字并点击 Book，日志会输出 `Blocked: phone number has 7 digits, needs 10`：

```viz web-demo
{"title": "Error prevention (slide 10) · hand-made example: input checks and fitting widgets", "width": 375, "height": 330, "interactive": true, "html": "<form id=\"f\">\n  <label>Phone number<br>\n    <input id=\"phone\" type=\"tel\" inputmode=\"numeric\" placeholder=\"(949) 555-0123\">\n  </label>\n  <small id=\"hint\">10 digits</small>\n  <label>Date<br><input type=\"date\" id=\"date\"></label>\n  <label>Guests: <output id=\"n\">2</output><br>\n    <input type=\"range\" min=\"1\" max=\"10\" value=\"2\" id=\"guests\">\n  </label>\n  <button>Book</button>\n</form>", "css": "body { font-family: -apple-system, system-ui, sans-serif; margin: 16px; }\nlabel { display: block; margin-top: 12px; }\ninput { font-size: 16px; padding: 6px; width: 100%; box-sizing: border-box; }\nsmall { color: #666; }\nsmall.bad { color: #c00; }\nbutton { margin-top: 14px; font-size: 16px; padding: 8px 16px; }", "js": "const phone = document.getElementById('phone');\nconst hint = document.getElementById('hint');\nphone.addEventListener('input', () => {\n  const digits = phone.value.replace(/\\D/g, '');        // keep digits only\n  hint.textContent = digits.length + ' / 10 digits';\n  hint.className = digits.length == 10 ? '' : 'bad';\n});\ndocument.getElementById('guests').addEventListener('input', (e) => {\n  document.getElementById('n').textContent = e.target.value;\n});\ndocument.getElementById('f').addEventListener('submit', (e) => {\n  const digits = phone.value.replace(/\\D/g, '');\n  if (digits.length != 10) {\n    e.preventDefault();\n    console.log('Blocked: phone number has ' + digits.length + ' digits, needs 10');\n  }\n});", "steps": [{"note": "Type a 7-digit number and press Book (scripted): the check stops it.", "js": "phone.value='555-0123'; phone.dispatchEvent(new Event('input')); document.querySelector('button').click();"}]}
```

## 5. 遵循平台惯例

用户不应该需要猜测不同的词语、情境、图标或操作是否意味着同一件事，也不应该需要记住应用特有的导航方式（幻灯片 11）。幻灯片展示了同一款会议应用 “Timetable” 分别在 iOS（浅色，底部标签栏）和 Android（绿色工具栏，Material 风格）上的样子：内容相同，各自遵循本平台的外观。

这些惯例是如何被成文规定的，就是本讲剩下的内容。

## 6. 人机界面指南

iOS 和 Android 的平台惯例以**人机界面指南（HIG，human interface guidelines）**的形式发布（幻灯片 12）。它们由 Google、Apple 等平台开发者制定，并且（幻灯片 13）：

- 定义视觉设计和风格的规则
- 规定交互方式
- 确立布局技术
- 保证平台内的一致性

HIG 只是**建议**——你可以选择不遵守。它们的目标是为设备或平台提供最佳体验，而且大多遵循最佳实践（幻灯片 14）。

以下是 Apple iOS 指南的摘要（幻灯片 15）：

- **内容优先于 UI。**
- **响应用户的显示偏好**（深色模式、横屏／竖屏）。
- **充分利用整个屏幕。**
- **限制屏幕上的控件。**
- **善用滑动手势。**
- **利用用户数据减少输入**——例如 Apple Pay、生物识别（人脸或指纹）或设备位置。

> 🔗 **延伸阅读**：[Apple HIG: Designing for iOS](https://developer.apple.com/design/human-interface-guidelines/designing-for-ios)

## 7. iOS HIG：导航与模态框

**导航**（幻灯片 16）：

- 使用**标签栏**在应用的**顶层部分**之间导航。它用于**导航，而不是操作**，并且**始终可见**。
- 使用**侧边栏**展示**层级内容**：最多 **2 层**层级，并且**可折叠**。

幻灯片的图示包括一个侧边栏（带有 “Section” 标题和 Item 1–3，其中一项高亮），以及底部带有星形图标标签栏的 iPhone 和 iPad 屏幕。在 Ionic 中，标签栏是 `<ion-tabs>`，它取代了页脚（[Lecture 13](lec-13.zh-CN.md#3-结构组件内容页眉页脚)）。

**模态框**（幻灯片 17）会独占用户的操作，直到被关闭。它们的用途是吸引注意力，完成**一项小而具体的任务**。因此：

- 确保用户可以**退出**
- 用它们来帮助**避免数据丢失**
- **少用**

图示包括一个覆盖在地图上的 “Location Services Off” 提醒（带有 **Settings** 和 **OK** 按钮），以及一个邮件撰写面板（“Let's grab lunch!”），顶部有 **Cancel** 和 **Send**——Cancel 就是退出的方式。

> ⚠️ **易错点**：“确保用户可以退出”是你自己的模态框必须满足的规则。没有 Dismiss／Cancel 按钮的模态页面会把用户困在手机上——仓库中第 13 讲的 `solution2` 模态框正有这个问题（[Lecture 13, Demo 2](lec-13.zh-CN.md#113-演示-2为购物清单添加提示框与模态页面幻灯片-46--setup2--solution2)）。

> 🔗 **延伸阅读**：[Apple HIG: Navigation and search](https://developer.apple.com/design/human-interface-guidelines/navigation-and-search) · [Apple HIG: Modality](https://developer.apple.com/design/human-interface-guidelines/modality)

## 8. iOS HIG：品牌、颜色与字体

**品牌**（幻灯片 18）：保持独特很重要，但要注意不要把用户从 iOS 的体验中拉出来。你的应用不必看起来像默认应用，但…… 幻灯片展示了同一个 “Attractions” 页面（凯旋门）两次：一次只有安静的红色强调色，另一次在顶部和底部都有一条大大的红色 “MY LOGO” 横幅——第二个版本用品牌标识盖过了内容。

**颜色**（幻灯片 19–20）：

- 使用**主色**来标示**可交互元素**。
- **不要用同一种颜色表示不同的含义。**
- 谨慎地使用颜色来突出特定元素。
- 用不同方式区分**“激活”**和**“未激活”**的组件。
- 无障碍地使用颜色：要考虑**色盲**和**文化语境**。幻灯片 20 的例子：在 Stocks 股票应用中，英文语境下**绿色**表示上涨趋势，而在中文语境下**红色**表示上涨趋势。

幻灯片 19 的图示用 ✗ 和 ✓ 标出好坏。工具栏：✗ 把每个按钮（关闭、两个操作、确认）都填成蓝色；✓ 只把确认按钮的 ✓ 保持蓝色，其余保持中性。地图：✗ 是一张灰色地图，其中定位按钮和搜索框都填满了蓝色；✓ 是带蓝色调的地图，控件保持中性——颜色被谨慎使用，而不是用在每一个元素上。

**颜色与字体**（幻灯片 21）：

- 颜色很适合吸引注意力，但可能被**过度使用**。
- 使用**互补色**——paletton.com 之类的配色工具会有帮助。
- 如果可以，使用**单一字体**；系统内置字体完全够用。
- 用**字号、颜色和字重**（粗体）来突出信息。

幻灯片的图示是 Apple 的系统颜色色板（Red、Orange、Yellow、Green、Teal Blue、Blue、Purple、Pink，并附 RGB 值，例如 Blue R 0 G 122 B 255），以及一个字号层级：SF Pro Display（20pt）和 SF Pro Text（19pt）位于从 16pt 到 23pt 的字号列表中。

演示中，所有可点击元素都使用同一个主蓝色（`#007aff`），未激活的标签页使用灰色，并且只用一种字体，靠字号和字重来体现层级。该步骤展示的是反面模式：同一种红色同时用于按钮、“3 unread” 文字和激活的标签，于是红色不再只表示一个意思。点击标签页会记录 `Tab: Contacts` 等日志：

```viz web-demo
{"title": "Key color, active vs inactive, one typeface (slides 16, 19, 21) · hand-made example", "width": 375, "height": 380, "interactive": true, "html": "<div class=\"screen\">\n  <h1>Messages</h1>\n  <p class=\"sub\">3 unread</p>\n  <p>Body text uses the same typeface; size and weight carry the hierarchy.</p>\n  <button class=\"action\">New message</button>\n</div>\n<nav class=\"tabbar\">\n  <a class=\"active\">Chats</a><a>Contacts</a><a>Settings</a>\n</nav>", "css": ":root { --key: #007aff; }          /* one key color = \"you can tap this\" */\nbody { margin: 0; font-family: -apple-system, system-ui, sans-serif; }\n.screen { padding: 16px; }\nh1 { font-size: 28px; font-weight: 700; margin: 0; }\n.sub { font-size: 15px; color: #8e8e93; margin: 4px 0 12px; }\n.action { background: var(--key); color: white; border: 0; border-radius: 8px; padding: 10px 14px; font-size: 16px; }\n.tabbar { position: fixed; bottom: 0; left: 0; right: 0; display: flex; border-top: 1px solid #ddd; background: #f9f9f9; }\n.tabbar a { flex: 1; text-align: center; padding: 12px 0; font-size: 13px; color: #8e8e93; }  /* inactive */\n.tabbar a.active { color: var(--key); font-weight: 600; }                                   /* active */", "js": "document.querySelectorAll('.tabbar a').forEach((tab) => {\n  tab.addEventListener('click', () => {\n    document.querySelector('.tabbar a.active').classList.remove('active');\n    tab.classList.add('active');\n    console.log('Tab: ' + tab.textContent);\n  });\n});", "steps": [{"note": "Anti-pattern: the same red for a button AND for 'unread' — color no longer has one meaning.", "css": ".action { background: #ff3b30; } .sub { color: #ff3b30; } .tabbar a.active { color: #ff3b30; }"}]}
```

> 🔗 **延伸阅读**：[Apple HIG: Branding](https://developer.apple.com/design/human-interface-guidelines/branding) · [Apple HIG: Color](https://developer.apple.com/design/human-interface-guidelines/color) · [Paletton (palette definer)](http://paletton.com)

## 9. 热门应用中的设计选择

幻灯片 22–24 并排展示了三款应用，每款都有其 logo、配色板和两张截图：

| 应用 | 幻灯片上的配色 | 展示的界面 |
|---|---|---|
| TikTok | 青绿色 `#25F4EE`、红色 `#FE2C55`、黑色 `#000000`、白色 `#FFFFFF` | 全屏视频信息流；“Friends / Now” 信息流——两者底部都有标签栏（Home、Now、**+**、Inbox、Me） |
| Instagram | 蓝色 `#405DE6`、蓝紫色 `#5851DB`、紫色 `#833AB4`、紫红色 `#C13584`、玫瑰色 `#E1306C`、亮红色 `#FD1D1D` | 带 Stories 栏的首页信息流；带蓝色 “Send Message” 按钮的个人主页——底部为图标标签栏 |
| Letterboxd | 橙色 `#ff8000`、绿色 `#00e054`、蓝色 `#40bcf4`，以及白色 `#ffffff` | 深色电影页面（“Nomadland”）；导演作品的海报网格 |

然后是投票：*请告诉我，你觉得这些应用在设计选择上有什么共同点*（[问题 1](#131-问题-1这些应用有什么共同点幻灯片-2526)）。可以留意的要点都来自第 2–8 节：内容优先（照片、视频、海报占满屏幕，即“内容优先于 UI”）；始终存在的底部标签栏；一个小规模的品牌配色，品牌色只出现在少数强调元素上，而不是处处都是；以及一种字体，靠字号和字重体现层级。

> 📝 **练习**：[问题 1](#131-问题-1这些应用有什么共同点幻灯片-2526)

## 10. 应用图标与系统图标

好的**应用图标**很重要（幻灯片 27）：

- 背景保持简洁
- 只有在必不可少或属于标志的一部分时才使用文字
- **不要把图标放进界面里**（应用图标用于主屏幕，而不是每个页面）

在界面内部，适当时**使用系统图标**——剪切、复制、粘贴、保存等。幻灯片展示了一排 Apple 应用图标（设置、电话、邮件、播客、照片、地图、时钟），以及一张系统图标表和它们的含义，例如：

| 图标 | 含义（来自幻灯片的表格） |
|---|---|
| Action（分享） | 显示一个模态视图，包含分享扩展、操作扩展，以及复制、收藏、查找等任务 |
| Add | 创建新条目 |
| Bookmarks | 显示应用特有的书签 |
| Camera | 拍摄照片或视频，或显示照片图库 |
| Cancel | 关闭当前视图，或在不保存更改的情况下退出编辑模式 |
| Compose | 打开新视图并进入编辑模式 |
| Done | 保存状态并关闭当前视图，或退出编辑模式 |
| Edit | 在当前上下文中进入编辑模式 |
| Fast Forward | 快进媒体播放或幻灯片 |

使用系统图标意味着用户已经知道它的作用——这正是[第 5 节](#5-遵循平台惯例)中的平台惯例原则。在 Ionic 中，对应的是来自 Ionicons 的 `<ion-icon>`（[Lecture 13](lec-13.zh-CN.md#5-图标徽章与头像)）。

> 🔗 **延伸阅读**：[Apple HIG: App icons](https://developer.apple.com/design/human-interface-guidelines/app-icons) · [Apple HIG: Icons](https://developer.apple.com/design/human-interface-guidelines/icons)

## 11. Google Material Design 与 Android、iOS 对比

Google 的指南是 **Material Design**（幻灯片 28）。它的理念是：界面应当看起来像**一层层叠放的纸片**，带有 **3D 纵深和动效**。它与 iOS 设计遵循许多相同的交互模式：

- 谨慎使用模态框
- 用颜色来突出内容
- 品牌元素保持低调

但也有几个关键区别。

**通用导航栏**（幻灯片 29）：Android 在屏幕**底部设有导航栏**——有时是硬件按键，有时是软件实现，但**始终存在**（图示用 ◀ ● ■ 标出了应用级与系统级的 “Navigation bar”）。iOS 则在应用内实现“返回”：应用自己的标签栏属于应用级，系统只添加主屏幕指示条。

**滑动手势**（幻灯片 30）：

| 手势 | Android | iOS |
|---|---|---|
| 从边缘滑动 | **返回**（左边缘或右边缘） | **返回上一屏**（在应用内） |
| 向上滑动 | 主屏幕 | 主屏幕 |
| 向上滑动、按住、松开／向上滑动并停留 | 应用概览 | 多任务 |
| 在应用之间切换 | 滑动可以在应用之间切换；始终存在的返回按钮也可以跨应用导航 | 在主屏幕指示条上水平滑动；否则只有回到主屏幕后才能切换 |

因此，同一个“返回”在两个平台上意味着不同的东西：在 Android 上它是一个系统按钮，甚至能带你回到上一个*应用*；在 iOS 上，你的应用必须自己提供返回按钮（左上角）和边缘滑动返回。

> 💡 **关键理解**：Ionic 应用可以同时运行在两个平台上。Ionic 会在 iPhone 上渲染 iOS 风格、在 Android 上渲染 Material 风格（即 "mode"），但**导航**的决定权在你手中——每个页面是否都有返回按钮？标签栏是否始终存在？这些都必须在没有 Android 系统返回键的情况下也能正常工作。

> 🔗 **延伸阅读**：[Material Design 3](https://m3.material.io/) · [A complete guide to navigation on iOS & Android](https://www.kickassux.com/ux-library/a-complete-guide-to-navigation-on-ios-android) · [Interaction design patterns: iOS vs Android](https://medium.com/@vedantha/interaction-design-patterns-ios-vs-android-111055f8a9b7)

## 12. 规划 A4：绘制页面，勾勒架构

“转换思路：系统设计”（幻灯片 31）。在一次关于你对开始 A4 准备程度的投票（[问题 2](#132-问题-2你对开始-a4-的准备程度如何幻灯片-3233)）之后，全班一起规划 A4。规划并拆分任务，能让解决大问题容易得多：它**更不令人生畏**，也**更容易开始**（幻灯片 34）。规划分两部分：先绘制页面草图，再绘制架构规划图。

**第一部分：绘制页面草图**（幻灯片 35）：

1. 浏览一遍 A4 的需求。
2. 用纸和笔、Google Drawings、Figma 或你选择的其他工具，**绘制页面和组件的草图**。
3. 画完之后，再进行分析。

示例是一款手绘的聊天应用 **“WeChirp”**：一个 **MessageList** 页面（标题 “We Chirp”，一列会话预览卡片，每张卡片带有用户图标和姓名，底部是搜索框；标注为 “user icon”“convo preview card”），以及一个 **Conversation** 页面（顶部是联系人姓名和图标，中间是消息气泡，底部是 “message…” 输入框；标注为 “message bubble”）。

**第二部分：勾勒架构**（幻灯片 36）。为 A4 写出你需要的**页面**、**组件**和**服务**的大纲：

| 部分 | 含义 |
|---|---|
| **页面** | 一个全屏视图 |
| **组件** | 一个界面元素（模型／控制器**和视图**） |
| **服务** | 可注入的数据（模型／控制器；**没有视图**） |

WeChirp 的大纲：

- 页面：**MessageList**
  - 组件：**ConversationCard**
  - 组件：**Title**——返回按钮、UserIcon、联系人姓名
  - 组件：**Search**
- 页面：**Conversation**
  - 组件：**MessageCard**
  - 组件：**TypeMessage**
- 组件：**UserIcon**（两个页面都使用）
- 服务：**AllConversations**
- 服务：**Conversation**

注意，草图里其实没有画出任何服务（幻灯片 36）——服务保存数据，因此不会出现在图片中；你必须根据页面需要知道的内容来推断它们（所有会话的列表；某一个会话的消息）。这就是[第 11 讲的](lec-11.zh-CN.md#5-angular-服务)划分：视图放在组件中，共享数据放在服务中。然后再进行同样的投票（[问题 3](#133-问题-3你对开始-a4-的准备程度如何活动后幻灯片-3738)）。

> 💡 **关键理解**：在两个页面上都出现的组件（UserIcon）应放在大纲的顶层，而不是某一个页面之下——这说明它应当是一个独立的可复用组件。

> 📝 **练习**：[问题 2](#132-问题-2你对开始-a4-的准备程度如何幻灯片-3233) · [问题 3](#133-问题-3你对开始-a4-的准备程度如何活动后幻灯片-3738)

## 13. 课堂问题与演示（附解答）

本讲没有编码演示。投票页面上的每个选项都显示 “Nobody has responded yet” 或 0%，因此没有公布任何结果；下面的答案来自讲义本身的幻灯片。（幻灯片 5 的 “What makes a good user experience?” 是一个讨论提示，答案在幻灯片 6 上——见[第 1 节](#1-什么是好的用户体验)。）

### 13.1 问题 1：这些应用有什么共同点？（幻灯片 25–26）

*L14-Q1：请告诉我，你觉得这些应用在设计选择上有什么共同点。*（TikTok、Instagram、Letterboxd——幻灯片 22–24；开放式回答）

<details>
<summary>答案</summary>

这是一个开放性问题，但讲义的原则可以给出几个可靠的答案：

- **内容优先于 UI**（幻灯片 15）：视频、照片和海报占满屏幕；UI 外壳很薄。
- **底部标签栏，始终存在**（幻灯片 16）：三款应用都通过底部的图标切换顶层部分，而且它用于导航，而非操作（TikTok 的 **+** 是唯一的例外——它是标签栏中的创建操作）。
- **少量配色，谨慎使用**（幻灯片 19、21）：每个品牌都有几种标志性颜色，但它们只作为强调出现（发布按钮、一颗心、一个评分），而不是铺满背景——幻灯片 18 提醒要注意不要把用户从 iOS 的体验中拉出来。
- **一种字体，靠字号和字重体现层级**（幻灯片 21）：名称和标题加粗且更大；元数据更小，并使用灰色。
- **熟悉的系统风格图标**（幻灯片 27）：主页、搜索、心形、分享、个人资料。

</details>

回到[第 9 节](#9-热门应用中的设计选择)。

### 13.2 问题 2：你对开始 A4 的准备程度如何？（幻灯片 32–33）

*L14 Q2：你对开始 A4 的准备程度如何？*

- 1 — 完全没有准备
- 2 — 有一点准备
- 3 — 中等程度的准备
- 4 — 准备得很好
- 5 — 非常充分的准备

<details>
<summary>答案</summary>

这是一个自我评估的投票——没有标准答案。它在规划活动之前进行是有意为之：活动的主张（幻灯片 34）是，把 A4 拆分为绘制的页面草图，以及页面、组件和服务的大纲，会让它不那么令人生畏，也更容易开始。

</details>

回到[第 12 节](#12-规划-a4绘制页面勾勒架构)。

### 13.3 问题 3：你对开始 A4 的准备程度如何？（活动后，幻灯片 37–38）

*L14 Q3：你对开始 A4 的准备程度如何？（活动后）*——与[问题 2](#132-问题-2你对开始-a4-的准备程度如何幻灯片-3233)相同的 1–5 量表。

<details>
<summary>答案</summary>

同样没有标准答案；把它与问题 2 的答案进行比较。如果分数没有提高，那么需要完成的是大纲：对于你绘制的每一个页面，列出它的组件，然后问每个页面需要哪些数据——这些就是你的服务。

</details>

回到[第 12 节](#12-规划-a4绘制页面勾勒架构)。

## 14. 速查与必记的 5 个要点

**移动设计的四条原则**

| 原则 | 实践中 |
|---|---|
| 有用的初始界面 | 清晰的行动号召，首页有真实内容，回到首页的简便方式（底部导航栏、侧边菜单） |
| “哎呀”按钮 | 简便的撤销／重做（“撤销发送”），简便的返回（面包屑、左上角返回按钮） |
| 错误预防 | 输入检查（位数）、合适的控件（日期／时间滚轮、滑块） |
| 平台惯例 | 相同的词语、图标、操作含义相同；不需要记住应用特有的导航 |

**iOS HIG 检查清单**

| 主题 | 规则 |
|---|---|
| 总体 | 内容优先于 UI；尊重深色模式和屏幕方向；充分利用整个屏幕；控件要少；善用滑动；复用用户数据（Apple Pay、生物识别、位置） |
| 导航 | 标签栏用于顶层部分——用于导航而非操作，并且始终存在；侧边栏用于最多 2 层的层级，可折叠 |
| 模态框 | 只用于完成一项小任务；用户可以退出；防止数据丢失；少用 |
| 品牌 | 保持独特，但不要把用户从 iOS 的体验中拉出来 |
| 颜色 | 可交互元素使用一种主色；一种颜色只表示一种含义；激活与未激活要区分；考虑色盲与文化 |
| 字体 | 一种字体；用字号、颜色和字重来强调 |
| 图标 | 简洁的应用图标，只在必要时使用文字，且不放进界面中；标准操作使用系统图标 |

**iOS 与 Android 对比**

| | iOS | Android（Material） |
|---|---|---|
| 外观 | 内容优先于 UI | 纸片般的层次，带纵深和动效 |
| 返回 | 应用内返回按钮；边缘滑动返回上一屏 | 始终存在的系统导航栏；返回可以跨应用 |
| 应用之间 | 通过主屏幕 | 滑动／返回按钮 |

**架构大纲**

| 部分 | 是否有视图 | 示例（WeChirp） |
|---|---|---|
| 页面 | 有，全屏 | MessageList、Conversation |
| 组件 | 有 | ConversationCard、MessageCard、TypeMessage、UserIcon |
| 服务 | 没有——可注入的数据 | AllConversations、Conversation |

**必记的 5 个要点**

1. 好的用户体验不止于 UI：首次启动、视觉设计、信息的呈现方式，以及物理设备都很重要。
2. 四条原则：有用的初始界面、易于撤销和返回的“哎呀”按钮、带检查和合适控件的错误预防，以及平台惯例。
3. HIG 是 Apple 和 Google 给出的建议；在 iOS 上：标签栏用于顶层导航（绝不用于操作），模态框只用于小任务，并且必须能够退出。
4. 颜色：可交互元素使用一种主色，绝不让一种颜色表达两种含义，并且要考虑色盲和文化（在中国的股票应用中，红色表示上涨）。
5. Android 有始终存在的系统返回键，而 iOS 应用必须自己提供返回按钮——因此要在每个 Ionic 页面中规划返回按钮，并在编写 A4 之前先勾勒出页面 → 组件 → 服务的大纲。