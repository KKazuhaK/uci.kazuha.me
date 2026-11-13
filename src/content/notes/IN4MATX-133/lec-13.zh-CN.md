---
title: "Ionic 组件"
summary: "Ionic 的安装与 ionic serve，导入独立式（standalone）Ionic 组件，结构组件，条目与按钮，图标、徽章与头像，配合 ngModel 的输入，列表与卡片，模态对话框（toast、alert、action sheet），带 componentProps 与 onDidDismiss 的模态页面，以及页面之间的路由。"
---

# IN4MATX 133: User Interface Software — Lecture 13：Ionic 组件

## 目录

- [1. 设置并运行 Ionic 应用](#1-设置并运行-ionic-应用)
- [2. Ionic 组件及其导入方式](#2-ionic-组件及其导入方式)
- [3. 结构组件：内容、页眉、页脚](#3-结构组件内容页眉页脚)
- [4. 条目与按钮](#4-条目与按钮)
- [5. 图标、徽章与头像](#5-图标徽章与头像)
- [6. 输入](#6-输入)
- [7. 列表与卡片](#7-列表与卡片)
- [8. 模态对话框：Toast、Alert、Action Sheet](#8-模态对话框toastalertaction-sheet)
- [9. 模态页面](#9-模态页面)
- [10. 路由](#10-路由)
- [11. 课堂问题与演示（附解答）](#11-课堂问题与演示附解答)
- [12. 速查与必记的 5 个要点](#12-速查与必记的-5-个要点)

> UCI IN4MATX 133: User Interface Software — Prof. Travis Linden Reid，2026 年秋季学期，周二 11/10（第 7 周）
> 内容整理自 Lecture 13 的幻灯片（共 54 页），以及课程仓库中的演示文件夹 `W7_L1_IonicComponents`（`setup1`/`solution1`、`setup2`/`solution2`、`modalExamples`）。按概念组织，而不是按来源组织。

> 📅 **课程安排**：A3 截止于 **周三 11/11** 午夜。
> 如果你忘了创建小组，请在今天结束前完成——即使没有搭档，也要把自己加入一个小组（课上 5 分钟即可报名）。

下面的实时演示直接从 CDN 加载 Ionic 的 web 组件，**不使用 Angular**，因此可以直接在页面中运行。Ionic 的组件就是普通的自定义元素，所以 HTML 完全相同；只有 Angular 的部分（`(click)`、`[(ngModel)]`、`...Controller` 服务）被替换为普通 JavaScript，每个演示的标题都会说明这一点。它们也以 iOS 模式运行，以便与幻灯片截图一致。

---

## 1. 设置并运行 Ionic 应用

Ionic CLI 是一个 npm 包。你只需全局安装一次，然后用它创建项目、进入项目目录，并生成新的页面、组件或类（幻灯片 5）：

```bash
npm install -g @ionic/cli
# to install ionic
ionic start [projectname]
# to create a new project from scratch
# or you can use starter code provided with A3!
cd [projectname]
# move into a folder
ionic generate [page/component/class] [filename]
# create a new page, component, or class
```

（幻灯片中的注释写作 `//`；在终端里则是 `#`。）

`ionic serve` 会在浏览器中运行应用，并以浏览器中的样子呈现。然后你可以打开 DevTools 的设备工具栏，选择一部手机（幻灯片显示 "Dimensions: iPhone 12 Pro, 390 × 844"），与测试响应式网站的方式完全一样（幻灯片 6）。

演示文件夹中的每个项目都是独立式（standalone）组件的 Ionic + Angular 应用（`ionic.config.json` 中为 `"type": "angular-standalone"`）。你要编辑的部分位于 `src/app/` 中；其余内容（导入 Ionic CSS 的 `global.scss`、`theme/variables.scss`、`capacitor.config.ts`、`main.ts`、测试配置）都是起始模板的样板代码。`main.ts` 使用 Ionic 和路由器启动应用：

```ts
bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(routes, withPreloading(PreloadAllModules)),
  ],
});
```

根模板只是 `<ion-app><ion-router-outlet></ion-router-outlet></ion-app>`——路由器会把当前页面放进其中。

> 🧪 **Demo 文件**：[setup1/src/main.ts](https://github.com/travislindenreid/INF33-Demos/blob/main/W7_L1_IonicComponents/setup1/src/main.ts) · [setup1/src/app/app.component.html](https://github.com/travislindenreid/INF33-Demos/blob/main/W7_L1_IonicComponents/setup1/src/app/app.component.html) · [setup1/ionic.config.json](https://github.com/travislindenreid/INF33-Demos/blob/main/W7_L1_IonicComponents/setup1/ionic.config.json)

## 2. Ionic 组件及其导入方式

Ionic 为移动界面中常见的界面元素提供了 **Angular 风格的组件**：列表、按钮、滑块、标签页、模态对话框、搜索栏等等（幻灯片 7；其截图展示了一个带头像的会话"List"，以及一个"Range"滑块页面）。本课使用的是 Ionic 7 与 Angular——仓库中的项目已经是 Ionic 8（`setup`/`solution`）和 Ionic 9（`modalExamples`），本讲的内容在这些版本中同样适用。

因为页面都是独立式组件，**你使用的每个 Ionic 组件都必须导入两次**：先从库中导入，再加入组件的 `imports` 数组（幻灯片 8）：

```ts
import { Component } from '@angular/core';
import { IonHeader, IonContent, IonToolbar, IonTitle } from
'@ionic/angular/standalone';                              // import from library

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [IonHeader, IonContent, IonToolbar, IonTitle], // load import in component
})
export class HomePage {
  constructor() {}
}
```

类名就是标签名的 PascalCase 形式：`<ion-card-title>` ↔ `IonCardTitle`。设置文件甚至会提醒你：`//Don't forget to add imports for the new components!`——`solution1` 最终会导入 14 个东西。

每个组件都有许多属性和特性，而组件的数量多到一节课讲不完；文档列出了所有选项，学习它们最好的方式是动手尝试（幻灯片 9）。本讲把它们分为六类：**结构、条目、图标、输入、列表、模态**（幻灯片 10、14、24、29、37；幻灯片 20 的列表还多了"菜单（Menus）"一项，但讲义没有涉及）。

> ⚠️ **易错点**：只导入类是不够的。如果把 `IonList` 从 `solution1` 的 `imports: [...]` 数组中去掉（但保留 `import` 语句），构建就会失败，并报 `NG8001: 'ion-list' is not a known element`。两处都要检查。

> 🔗 **延伸阅读**：[Ionic UI components](https://ionicframework.com/docs/components/) · [Ionic API reference](https://ionicframework.com/docs/api/)

## 3. 结构组件：内容、页眉、页脚

Ionic 的文档把这些组件归入"Content"和"Toolbars"两类（幻灯片 11）。结构组件共有三个（幻灯片 12）：

| 组件 | 作用 |
|---|---|
| `<ion-content>` | 容纳页面的主要内容（可滚动） |
| `<ion-header>` | 顶部栏，放置标题内容 |
| `<ion-footer>` | 底部栏，例如菜单内容 |

页眉和页脚中可以包含带有文字（`<ion-title>`）和按钮的 `<ion-toolbar>`。其他一些组件也可以替代页眉和页脚——例如用 `<ion-tabs>` 作为页脚，放置通向不同页面的标签页。

```html
<ion-header>
  <ion-toolbar>
    <ion-title>My Navigation Bar</ion-title>
  </ion-toolbar>
</ion-header>
<ion-content>
  Content here...
</ion-content>
<ion-footer>
  <ion-toolbar>
    <ion-title>Footer</ion-title>
  </ion-toolbar>
</ion-footer>
```

结果是：顶部固定一个标题栏，中间是内容区域，底部固定一个"Footer"栏（幻灯片 13）。试着在下面编辑代码并按 Run：

```viz web-demo
{"title": "Structural components (slide 13) · Ionic web components, no Angular", "width": 375, "height": 320, "interactive": true, "html": "<link rel=\"stylesheet\" href=\"https://cdn.jsdelivr.net/npm/@ionic/core@8.8.19/css/ionic.bundle.css\">\n<script>window.Ionic = { config: { mode: \"ios\" } };</script>\n<script type=\"module\" src=\"https://cdn.jsdelivr.net/npm/@ionic/core@8.8.19/dist/ionic/ionic.esm.js\"></script>\n<ion-app>\n<ion-header>\n  <ion-toolbar>\n    <ion-title>My Navigation Bar</ion-title>\n  </ion-toolbar>\n</ion-header>\n<ion-content class=\"ion-padding\">\n  Content here...\n</ion-content>\n<ion-footer>\n  <ion-toolbar>\n    <ion-title>Footer</ion-title>\n  </ion-toolbar>\n</ion-footer>\n</ion-app>"}
```

> 🔗 **延伸阅读**：[Ionic: ion-content](https://ionicframework.com/docs/api/content)

## 4. 条目与按钮

`<ion-item>` 是最基本的组件（幻灯片 15）。它本质上是一个可以容纳文字、图片和其他内容的 HTML `<div>`，并具有 CSS 的"块"样式，因此每个条目都显示为一行（**row**）。许多其他组件都需要放在 `<ion-item>` 内部——例如 `<ion-label>` 把文字放进条目中。

条目还可以充当按钮或链接，并且可以设置颜色（幻灯片 16–17）：

```html
<!-- Default Item -->
<ion-item>
  <ion-label>
    Item
  </ion-label>
</ion-item>
<!-- Item as a Button -->
<ion-item (click)="buttonClick()">
  <ion-label>
    Button Item
  </ion-label>
</ion-item>
<!-- Item as an Anchor -->
<ion-item href="https://www.ionicframework.com">
  <ion-label>
    Anchor Item
  </ion-label>
</ion-item>
<ion-item color="secondary">
  <ion-label>
    Secondary Color Item
  </ion-label>
</ion-item>
```

**插槽（slot）** 决定内容在条目中的位置：`slot="start"` 把子元素放在左侧，`slot="end"` 放在右侧。幻灯片 18 用它来放置缩略图和一个按钮：

```html
<ion-item href="#">
  <ion-label>
    Thumbnail End, Anchor Item
  </ion-label>
  <ion-thumbnail slot="end">
    <img src="assets/icon/favicon.png">
  </ion-thumbnail>
</ion-item>
<ion-item>
  <ion-thumbnail slot="start">
    <img src="assets/icon/favicon.png">
  </ion-thumbnail>
  <ion-label>
    <h2>H2 Title Text</h2>
    <p>Button on right</p>
  </ion-label>
  <ion-button fill="outline" slot="end">View</ion-button>
</ion-item>
```

`<ion-button>` 支持 `color`、`shape="round"`、`fill="outline"`、`expand="full"`，并且可以在自己的 start 插槽中放一个 `<ion-icon>`（幻灯片 19）：

```html
<ion-item>
  <ion-button color="secondary">Secondary</ion-button>
</ion-item>
<ion-item>
  <ion-button shape="round">Round</ion-button>
</ion-item>
<ion-item>
  <ion-button>
    <ion-icon slot="start" name="star"></ion-icon>
    Left Icon
  </ion-button>
</ion-item>
```

演示展示了这些行：普通条目、按钮条目和链接条目（后两者在 iOS 模式下会有一个 › 箭头），一个填充的 "Secondary Color Item" 行，带有右侧轮廓 **View** 按钮的缩略图行，然后是 secondary、round 和星形图标按钮。点击 "Button Item" 会输出 `Button Item clicked`（缩略图是一个内联 SVG 圆形，因为 `assets/icon/favicon.png` 不存在）：

```viz web-demo
{"title": "Items and buttons (slides 17–19) · Ionic web components; (click) becomes addEventListener", "width": 375, "height": 560, "interactive": true, "html": "<link rel=\"stylesheet\" href=\"https://cdn.jsdelivr.net/npm/@ionic/core@8.8.19/css/ionic.bundle.css\">\n<script>window.Ionic = { config: { mode: \"ios\" } };</script>\n<script type=\"module\" src=\"https://cdn.jsdelivr.net/npm/@ionic/core@8.8.19/dist/ionic/ionic.esm.js\"></script>\n<ion-app>\n<ion-content>\n<!-- Default Item -->\n<ion-item>\n  <ion-label>Item</ion-label>\n</ion-item>\n<!-- Item as a Button -->\n<ion-item button id=\"btnItem\">\n  <ion-label>Button Item</ion-label>\n</ion-item>\n<!-- Item as an Anchor -->\n<ion-item href=\"#\">\n  <ion-label>Anchor Item</ion-label>\n</ion-item>\n<ion-item color=\"secondary\">\n  <ion-label>Secondary Color Item</ion-label>\n</ion-item>\n<ion-item>\n  <ion-thumbnail slot=\"start\">\n    <img src=\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Ccircle cx='20' cy='20' r='16' fill='%233880ff'/%3E%3C/svg%3E\">\n  </ion-thumbnail>\n  <ion-label>\n    <h2>H2 Title Text</h2>\n    <p>Button on right</p>\n  </ion-label>\n  <ion-button fill=\"outline\" slot=\"end\">View</ion-button>\n</ion-item>\n<ion-item>\n  <ion-button color=\"secondary\">Secondary</ion-button>\n</ion-item>\n<ion-item>\n  <ion-button shape=\"round\">Round</ion-button>\n</ion-item>\n<ion-item>\n  <ion-button>\n    <ion-icon slot=\"start\" name=\"star\"></ion-icon>\n    Left Icon\n  </ion-button>\n</ion-item>\n</ion-content>\n</ion-app>", "js": "// Angular: <ion-item (click)=\"buttonClick()\">\nfunction buttonClick() {\n  console.log('Button Item clicked');\n}\ndocument.getElementById('btnItem').addEventListener('click', buttonClick);"}
```

> ⚠️ **易错点**：`slot` 应该写在子元素上（`<ion-button slot="end">`），而不是写在条目上；并且插槽名称是 `start`/`end`，而不是 left/right。

## 5. 图标、徽章与头像

在 Angular 版的 Ionic 应用中，**图标需要先注册**（幻灯片 21）：从 `ionicons/icons` 导入图标数据，并在构造函数中传给 `addIcons()`。只有这样，`<ion-icon name="heart">` 才能找到对应的 SVG。

```ts
import { Component } from '@angular/core';
import { IonIcon, IonItem, IonBadge } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { heart, moon } from 'ionicons/icons';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [IonIcon, IonItem, IonBadge],
})
export class HomePage {
  constructor() {
    addIcons({ heart, moon });
  }
}
```

图标名称在 HTML 中是 kebab-case，在 TypeScript 中是 camelCase：`solution1` 注册了 `cartOutline`，并使用 `name="cart-outline"`。

徽章和图标可以添加标签或趣味性（幻灯片 22）：

```html
<ion-item>
<ion-badge color="primary">11</ion-badge>
</ion-item>
<ion-item>
<ion-badge color="secondary">22</ion-badge>
</ion-item>
<ion-item>
<ion-icon name="heart"></ion-icon>
</ion-item>
<ion-item>
<ion-icon name="moon"></ion-icon>
</ion-item>
<ion-item>
<ion-badge color="secondary">
<ion-icon name="moon"></ion-icon>
</ion-badge>
</ion-item>
```

**头像（Avatar）** 是包裹图片或图标的圆形组件；放在 `<ion-chip>` 中时，它们会组成一个带标签的小圆角"chip"（幻灯片 23；幻灯片中的代码片段末尾多了一个多余的 `</ion-content>`，来自其周围的页面）：

```html
<ion-avatar>
  <img src="avatar.svg" />
</ion-avatar>

<ion-chip>
  <ion-avatar>
    <img src="avatar.svg" />
  </ion-avatar>
  <ion-label>Chip Avatar</ion-label>
</ion-chip>
```

下面，徽章显示为带数字的小彩色方块，然后是一颗心、一个月亮、放在徽章中的月亮、一个圆形头像，以及 "Chip Avatar" 芯片。（CDN 版本会按名称获取图标，因此这里没有 `addIcons`——Angular 应用则需要它。）

```viz web-demo
{"title": "Badges, icons, avatars, chips (slides 22–23) · Ionic web components; avatar image replaced by an inline SVG", "width": 375, "height": 430, "interactive": true, "html": "<link rel=\"stylesheet\" href=\"https://cdn.jsdelivr.net/npm/@ionic/core@8.8.19/css/ionic.bundle.css\">\n<script>window.Ionic = { config: { mode: \"ios\" } };</script>\n<script type=\"module\" src=\"https://cdn.jsdelivr.net/npm/@ionic/core@8.8.19/dist/ionic/ionic.esm.js\"></script>\n<ion-app>\n<ion-content>\n<ion-item>\n  <ion-badge color=\"primary\">11</ion-badge>\n</ion-item>\n<ion-item>\n  <ion-badge color=\"secondary\">22</ion-badge>\n</ion-item>\n<ion-item>\n  <ion-icon name=\"heart\"></ion-icon>\n</ion-item>\n<ion-item>\n  <ion-icon name=\"moon\"></ion-icon>\n</ion-item>\n<ion-item>\n  <ion-badge color=\"secondary\">\n    <ion-icon name=\"moon\"></ion-icon>\n  </ion-badge>\n</ion-item>\n<ion-item>\n  <ion-avatar>\n    <img src=\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Ccircle cx='20' cy='20' r='16' fill='%233880ff'/%3E%3C/svg%3E\" />\n  </ion-avatar>\n</ion-item>\n<ion-item>\n  <ion-chip>\n    <ion-avatar>\n      <img src=\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Ccircle cx='20' cy='20' r='16' fill='%233880ff'/%3E%3C/svg%3E\" />\n    </ion-avatar>\n    <ion-label>Chip Avatar</ion-label>\n  </ion-chip>\n</ion-item>\n</ion-content>\n</ion-app>"}
```

> ⚠️ **易错点**：在仓库的 `modalExamples` 中，操作表（action sheet）使用了 `icon: 'trash'` 和 `icon: 'close'`，但从未调用 `addIcons`——运行时会输出 `[Ionicons Warning]: Could not load icon with name "trash"`（以及 `"close"`），并且操作表只显示 **Delete** / **Cancel**，没有图标。你使用的每个图标名称，即使是在控制器的选项中，也都必须注册。

> 🔗 **延伸阅读**：[Ionic: ion-icon](https://ionicframework.com/docs/api/icon) · [Ionicons（图标库）](https://ionic.io/ionicons)

## 6. 输入

Ionic 提供了许多常见的输入字段——DateTime、Checkbox、Button、文本输入等（幻灯片 25）。大多数情况下，它们都应放在 `<ion-item>` 中。它们的绑定方式与 Angular 一样：使用 `[(ngModel)]` 进行双向绑定，它来自 `FormsModule`（参见 [Lecture 10](lec-10.zh-CN.md#8-使用-ngmodel-的双向绑定)）——因此 `FormsModule` 也需要加入组件的 `imports`。

日期选择器（幻灯片 26）：

```html
<ion-item>
  <ion-label>Date</ion-label>
  <ion-datetime display-format="MM/DD/YYYY">
  </ion-datetime>
</ion-item>
```

带占位符的文本输入（幻灯片 27）：

```html
<ion-item>
  <ion-input required type="text"
  placeholder="First Name"></ion-input>
</ion-item>
```

复选框，其中一个被禁用（幻灯片 28）：

```html
<ion-item>
  <ion-label>Pepperoni</ion-label>
  <ion-checkbox [checked]="pepperoni"></ion-checkbox>
</ion-item>
<ion-item>
  <ion-label>Sausage</ion-label>
  <ion-checkbox [checked]="sausage" disabled="true"></ion-checkbox>
</ion-item>
<ion-item>
  <ion-label>Mushrooms</ion-label>
  <ion-checkbox [checked]=“mushrooms"></ion-checkbox>
</ion-item>
```

幻灯片的错误：最后一行以弯引号开头 `“mushrooms"`——应为 `"mushrooms"`。

`[checked]="pepperoni"` 是**单向**属性绑定：复选框显示变量的值，但勾选它并不会改变该变量。要读取用户的选择，需要双向绑定：`[(ngModel)]="pepperoni"`——这正是下面演示 1 和演示 2 中的修复方法。

在演示中，复选框把文字放在标签内部（这是当前的 Ionic 写法，仓库也使用这种写法：`<ion-checkbox>{{item.item}}</ion-checkbox>`），一段小脚本扮演了 `[(ngModel)]` 的角色。输入 "Kazuha" 并勾选 Pepperoni，会输出 `{ firstName: 'Kazuha', pepperoni: true, mushrooms: true }`：

```viz web-demo
{"title": "Inputs (slides 26–28) · Ionic web components; [(ngModel)] replaced by reading ionChange events", "width": 375, "height": 600, "interactive": true, "html": "<link rel=\"stylesheet\" href=\"https://cdn.jsdelivr.net/npm/@ionic/core@8.8.19/css/ionic.bundle.css\">\n<script>window.Ionic = { config: { mode: \"ios\" } };</script>\n<script type=\"module\" src=\"https://cdn.jsdelivr.net/npm/@ionic/core@8.8.19/dist/ionic/ionic.esm.js\"></script>\n<ion-app>\n<ion-content>\n<ion-item>\n  <ion-input required type=\"text\" placeholder=\"First Name\" id=\"first\"></ion-input>\n</ion-item>\n<ion-item>\n  <ion-checkbox id=\"pepperoni\">Pepperoni</ion-checkbox>\n</ion-item>\n<ion-item>\n  <ion-checkbox id=\"sausage\" disabled=\"true\">Sausage</ion-checkbox>\n</ion-item>\n<ion-item>\n  <ion-checkbox id=\"mushrooms\" checked=\"true\">Mushrooms</ion-checkbox>\n</ion-item>\n<ion-item>\n  <ion-label>Date</ion-label>\n  <ion-datetime display-format=\"MM/DD/YYYY\" presentation=\"date\"></ion-datetime>\n</ion-item>\n</ion-content>\n</ion-app>", "js": "// What [(ngModel)] does for you in Angular: keep a variable in sync with the input.\nlet pizza = { firstName: '', pepperoni: false, mushrooms: true };\ndocument.getElementById('first').addEventListener('ionInput', (e) => {\n  pizza.firstName = e.detail.value;\n  console.log(pizza);\n});\n['pepperoni', 'mushrooms'].forEach((id) => {\n  document.getElementById(id).addEventListener('ionChange', (e) => {\n    pizza[id] = e.detail.checked;\n    console.log(pizza);\n  });\n});"}
```

> ⚠️ **易错点**：`display-format` 来自较旧的 Ionic。在本仓库使用的 Ionic 版本中，`<ion-datetime>` 会渲染完整的内联日历（月份、日期网格，以及除非设置 `presentation="date"` 否则会有一行 Time），并忽略 `display-format`——而不是幻灯片截图中那一行单独的 "Date"。

> 🔗 **延伸阅读**：[Angular: NgModel](https://angular.dev/api/forms/NgModel)

## 7. 列表与卡片

`<ion-list>` 用于显示多行信息（幻灯片 30）。它为条目提供了一定的结构，而且对列表本身设置样式（而不是逐个设置条目样式）有时会很方便。

```html
<ion-list>
  <ion-item>
    <ion-input>Input</ion-input>
  </ion-item>
  <ion-item>
    <ion-toggle slot="end">Toggle</ion-toggle>
  </ion-item>
  <ion-item>
    <ion-radio slot="end">Radio</ion-radio>
  </ion-item>
  <ion-item>
    <ion-checkbox slot=“start">Checkbox</ion-checkbox>
  </ion-item>
</ion-list>
```

（幻灯片 31；同样的弯引号错误：`slot=“start"` → `slot="start"`。）

列表中可以包含 `<ion-item>` 之外的标签（幻灯片 32）。`<ion-card>` 提供一种用于展示信息的"卡片"布局：包括带副标题和标题的页眉，然后是内容——卡片中也可以放一个 `<ion-item>`（幻灯片 33）：

```html
<ion-list>
  <ion-card>
    <ion-card-header>
      <ion-card-subtitle>Card Subtitle</ion-card-subtitle>
      <ion-card-title>Card Title</ion-card-title>
    </ion-card-header>
    <ion-card-content>
      Card content
    </ion-card-content>
  </ion-card>
  <ion-card>
    <ion-item>
      <ion-icon name=“logo-ionic” slot="start"></ion-icon>
      <ion-label>ion-item in a card, icon left, button right</ion-label>
      <ion-button fill="outline" slot="end">View</ion-button>
    </ion-item>
  </ion-card>
</ion-list>
```

（又是弯引号：`name=“logo-ionic”` → `name="logo-ionic"`。）

在演示中，第一行会显示为**空白**：开关、单选和复选框都会显示文字，但 `<ion-input>Input</ion-input>` 不会。第 1 步添加 `label="Input"`，这一行就会显示 "Input"：

```viz web-demo
{"title": "Lists and cards (slides 31, 33) · Ionic web components", "width": 375, "height": 470, "interactive": true, "html": "<link rel=\"stylesheet\" href=\"https://cdn.jsdelivr.net/npm/@ionic/core@8.8.19/css/ionic.bundle.css\">\n<script>window.Ionic = { config: { mode: \"ios\" } };</script>\n<script type=\"module\" src=\"https://cdn.jsdelivr.net/npm/@ionic/core@8.8.19/dist/ionic/ionic.esm.js\"></script>\n<ion-app>\n<ion-content>\n<ion-list>\n  <ion-item>\n    <ion-input>Input</ion-input>\n  </ion-item>\n  <ion-item>\n    <ion-toggle slot=\"end\">Toggle</ion-toggle>\n  </ion-item>\n  <ion-item>\n    <ion-radio slot=\"end\">Radio</ion-radio>\n  </ion-item>\n  <ion-item>\n    <ion-checkbox slot=\"start\">Checkbox</ion-checkbox>\n  </ion-item>\n</ion-list>\n<ion-list>\n  <ion-card>\n    <ion-card-header>\n      <ion-card-subtitle>Card Subtitle</ion-card-subtitle>\n      <ion-card-title>Card Title</ion-card-title>\n    </ion-card-header>\n    <ion-card-content>\n      Card content\n    </ion-card-content>\n  </ion-card>\n  <ion-card>\n    <ion-item>\n      <ion-icon name=\"logo-ionic\" slot=\"start\"></ion-icon>\n      <ion-label>ion-item in a card, icon left, button right</ion-label>\n      <ion-button fill=\"outline\" slot=\"end\">View</ion-button>\n    </ion-item>\n  </ion-card>\n</ion-list>\n</ion-content>\n</ion-app>", "steps": [{"note": "Fix for the first row: in current Ionic the text inside ion-input is not shown — give it a label attribute.", "js": "document.querySelector('ion-input').setAttribute('label', 'Input');"}]}
```

> ⚠️ **易错点**：在当前的 Ionic 中，`<ion-input>` 标签之间的文字不会显示。请使用 `<ion-input label="Input">`（或 `placeholder`）。开关、单选和复选框则相反：它们的标签就是标签内部的文字。

本讲的第一个编程演示是一个购物清单，由列表、条目、复选框、按钮和卡片组成，紧接在这之后（幻灯片 34）。

> 📝 **练习**：[演示 1：购物清单](#111-演示-1购物清单幻灯片-34--setup1--solution1) · [问题 1](#112-问题-1你对-ionic-组件有多大把握幻灯片-3536)

## 8. 模态对话框：Toast、Alert、Action Sheet

模态框适用于**快速输入或提醒**，会覆盖在应用的主要内容之上（幻灯片 38）。模态分为两种风格——**模态对话框**（本节）和**模态页面**（下一节）。模态通常在模型或控制器（`.ts`）中触发，而不是在视图（`.html`）中触发。

每种对话框类型都有一个**控制器**服务：在构造函数中注入它，调用 `create({...options})`（它返回一个 Promise，解析为对话框），然后调用 `present()`。Toast 是一条会自行消失的简短消息（幻灯片 39）：

```ts
<!--HTML-->
<ion-button expand="full" color="primary" (click)="presentToast()">Send Toast</ion-button>

/*TypeScript*/
import { ToastController } from ‘@ionic/angular/standalone’;

export class HomePage {
  /*Inject ToastController*/
  constructor(public toastController: ToastController) {}

  presentToast() {
    this.toastController.create({
      message: 'Hello, world!',
      duration: 2000
    }).then((toast) => {
      toast.present();
    });
  }
}
```

（导入语句中的弯引号：`‘@ionic/angular/standalone’` → `'@ionic/angular/standalone'`。）

Alert 是一个居中的对话框，包含页眉、副标题、消息和按钮（幻灯片 40）：

```ts
presentAlert() {
  this.alertController.create({
    header: 'Alert',
    subHeader: 'Subtitle',
    message: 'This is an alert message.',
    buttons: ['OK']
  }).then((alert) => {
    alert.present();
  });
}
```

Action sheet 从底部滑出，列出多个选项。每个按钮都可以有 `role`（`'destructive'` 显示为红色，`'cancel'` 会放在最后）、`icon`，以及点击时运行的 `handler`（幻灯片 41）：

```ts
presentActionSheet() {
  this.actionSheetController.create({
    header: 'Albums',
    buttons: [{
      text: 'Delete',
      role: 'destructive',
      icon: 'trash',
      handler: () => {
        console.log('Delete clicked');
      }
    }, {
      text: 'Cancel',
      icon: 'close',
      role: 'cancel',
      handler: () => {
        console.log('Cancel clicked');
      }
    }]
  }).then((actionSheet) => {
    actionSheet.present();
  });
}
```

本仓库的 `modalExamples` 首页正好包含这三者以及模态页面，通过四个全宽按钮（**Send Toast、Send Alert、Send Action Sheet、Show Modal Example**）触发，并注入了全部四个控制器：

```ts
constructor(
  public toastController: ToastController,
  public alertController:AlertController,
  public actionSheetController:ActionSheetController,
  public modalController:ModalController
) {}
```

运行效果：Toast 在底部显示 "Hello, world!" 并持续 2 秒；Alert 显示 "Alert / Subtitle / This is an alert message."，并在变暗的页面上方有一个 **OK** 按钮；在操作表中点击 **Delete** 会输出 `Delete clicked`，点击 **Cancel** 会输出 `Cancel clicked`。

下面试试这三个。步骤会替你打开 alert：

```viz web-demo
{"title": "Toast, alert, action sheet (slides 39–41) · Ionic web components; the controllers' create({...}) options set as element properties", "width": 375, "height": 420, "interactive": true, "html": "<link rel=\"stylesheet\" href=\"https://cdn.jsdelivr.net/npm/@ionic/core@8.8.19/css/ionic.bundle.css\">\n<script>window.Ionic = { config: { mode: \"ios\" } };</script>\n<script type=\"module\" src=\"https://cdn.jsdelivr.net/npm/@ionic/core@8.8.19/dist/ionic/ionic.esm.js\"></script>\n<ion-app>\n<ion-content>\n<ion-button expand=\"full\" color=\"primary\" id=\"toastBtn\">Send Toast</ion-button>\n<ion-button expand=\"full\" color=\"primary\" id=\"alertBtn\">Send Alert</ion-button>\n<ion-button expand=\"full\" color=\"primary\" id=\"sheetBtn\">Send Action Sheet</ion-button>\n</ion-content>\n</ion-app>", "js": "// Angular: this.toastController.create({...}).then((toast) => toast.present());\n// Without Angular: create the element, set the same options, append it, present it.\nfunction create(tag, options) {\n  const el = Object.assign(document.createElement(tag), options);\n  el.addEventListener('didDismiss', () => el.remove());  // controllers clean up for you\n  document.body.appendChild(el);\n  return Promise.resolve(el);\n}\nfunction presentToast() {\n  create('ion-toast', { message: 'Hello, world!', duration: 2000 })\n    .then((toast) => { toast.present(); });\n}\nfunction presentAlert() {\n  create('ion-alert', {\n    header: 'Alert', subHeader: 'Subtitle',\n    message: 'This is an alert message.', buttons: ['OK']\n  }).then((alert) => { alert.present(); });\n}\nfunction presentActionSheet() {\n  create('ion-action-sheet', {\n    header: 'Albums',\n    buttons: [{\n      text: 'Delete', role: 'destructive', icon: 'trash',\n      handler: () => { console.log('Delete clicked'); }\n    }, {\n      text: 'Cancel', icon: 'close', role: 'cancel',\n      handler: () => { console.log('Cancel clicked'); }\n    }]\n  }).then((actionSheet) => { actionSheet.present(); });\n}\ndocument.getElementById('toastBtn').addEventListener('click', presentToast);\ndocument.getElementById('alertBtn').addEventListener('click', presentAlert);\ndocument.getElementById('sheetBtn').addEventListener('click', presentActionSheet);", "steps": [{"note": "Click Send Alert (scripted here).", "js": "customElements.whenDefined('ion-alert').then(() => presentAlert());"}]}
```

> 🧪 **Demo 文件**：[modalExamples/src/app/home/home.page.ts](https://github.com/travislindenreid/INF33-Demos/blob/main/W7_L1_IonicComponents/modalExamples/src/app/home/home.page.ts) · [home.page.html](https://github.com/travislindenreid/INF33-Demos/blob/main/W7_L1_IonicComponents/modalExamples/src/app/home/home.page.html)

> 💡 **关键理解**：`create()` 返回 Promise，因为对话框是异步构建的。在你对它解析出的对象调用 `present()` 之前，什么都不会出现——只调用 `create()` 不会显示任何内容。

## 9. 模态页面

模态页面会在**当前页面之上打开一个全新的页面**（幻灯片 42）。所有页面本身都是组件，因此模态页面就是你用 `ionic generate page modal` 生成的组件。它适合小型输入，并且比对话框更灵活。

主页使用 `ModalController` 创建它，指定组件，并通过 `componentProps` 传入数据（幻灯片 43）：

```ts
import { ModalController } from '@ionic/angular';
import { ModalExamplePage } from ‘../modal/modal-example.page';

export class HomePage {
  constructor(public modalController: ModalController) {}

  presentModal() {
    this.modalController.create({
      component: ModalExamplePage,
      componentProps: { name: "IN4MATX 133" }
    }).then((modal) => {
      modal.present();
    });
  }
}
```

（弯引号：`‘../modal/modal-example.page'` → `'../modal/modal-example.page'`。注意这张幻灯片从 `'@ionic/angular'` 导入，而幻灯片 39 使用 `'@ionic/angular/standalone'`；像 `setup2` 这样的独立式项目会从 `'@ionic/angular/standalone'` 导入控制器。）

`componentProps` 的每个键都会以同名的形式进入模态页面的 `@Input()`。模态页面的视图和控制器（幻灯片 44）：

```html
<ion-content padding>
  Hello, {{name}}!
  <ion-button (click)="dismiss()">Dismiss</ion-button>
</ion-content>
```

```ts
import { ModalController } from '@ionic/angular';

export class ModalPage implements OnInit {
  @Input() name:string;
  constructor(public modalController:ModalController) { }

  dismiss() {
    this.modalController.dismiss();
  }
}
```

仓库中写的是 `@Input() name:string = "";`——按照幻灯片上的写法，严格模式的 TypeScript 会报告 `name` 没有初始值。运行 `modalExamples` 时，点击 **Show Modal Example** 会打开一个全屏页面，上面写着 "Hello, IN4MATX 133!"，并有一个 **Dismiss** 按钮用于关闭它。

要**取回数据**，把数据传给 `dismiss(...)`，并在主页上用 `onDidDismiss()` 监听（幻灯片 45）：

```ts
/*modal-page.ts*/
@Input() name:string;
constructor(public modalController:ModalController) { }

dismiss() {
  this.modalController.dismiss('Hello from modal!');
}
```

```ts
/*home-page.ts, creates ModalPage*/
presentModal() {
  this.modalController.create({
    component: ModalPage,
    componentProps: {name: "IN4MATX 133"}
  }).then((modal) => {
    modal.present();
    modal.onDidDismiss().then((data)=>{
      console.log(data);
      // “Hello from modal!”
    })
  });
}
```

幻灯片中的注释略有偏差：`onDidDismiss()` 解析为一个**结果对象**，字符串位于其 `data` 字段中。演示会输出 `{ data: 'Hello from modal!', role: undefined }`；使用 `data.data` 可以得到 `'Hello from modal!'`。

```viz web-demo
{"title": "Modal page with componentProps and onDidDismiss (slides 43–45) · Ionic web components; the modal's page is a plain element instead of an Angular component", "width": 375, "height": 360, "interactive": true, "html": "<link rel=\"stylesheet\" href=\"https://cdn.jsdelivr.net/npm/@ionic/core@8.8.19/css/ionic.bundle.css\">\n<script>window.Ionic = { config: { mode: \"ios\" } };</script>\n<script type=\"module\" src=\"https://cdn.jsdelivr.net/npm/@ionic/core@8.8.19/dist/ionic/ionic.esm.js\"></script>\n<ion-app>\n<ion-content class=\"ion-padding\">\n<ion-button id=\"open\">Open Modal Page</ion-button>\n</ion-content>\n</ion-app>", "js": "// Plays the role of ModalPage: shows {{name}} and calls dismiss(data).\nfunction makeModalPage(props) {\n  const page = document.createElement('div');\n  page.className = 'ion-page';\n  page.innerHTML = '<ion-content class=\"ion-padding\">Hello, <b class=\"name\"></b>!' +\n    ' <ion-button id=\"dismiss\">Dismiss</ion-button></ion-content>';\n  page.querySelector('.name').textContent = props.name;        // componentProps\n  page.querySelector('#dismiss').addEventListener('click', () => {\n    page.closest('ion-modal').dismiss('Hello from modal!');     // dismiss(data)\n  });\n  return page;\n}\nfunction presentModal() {\n  const modal = document.createElement('ion-modal');\n  modal.appendChild(makeModalPage({ name: 'IN4MATX 133' }));\n  document.body.appendChild(modal);\n  modal.present();\n  modal.onDidDismiss().then((data) => {\n    console.log(data);   // the whole result object, not just the string\n    modal.remove();\n  });\n}\ndocument.getElementById('open').addEventListener('click', presentModal);", "steps": [{"note": "Open the modal (scripted here).", "js": "customElements.whenDefined('ion-modal').then(() => presentModal());"}, {"note": "Press Dismiss: onDidDismiss resolves and the home page logs the result.", "js": "setTimeout(() => document.querySelector('#dismiss').click(), 600);"}]}
```

> 🧪 **Demo 文件**：[modalExamples/src/app/modal-example/modal-example.page.ts](https://github.com/travislindenreid/INF33-Demos/blob/main/W7_L1_IonicComponents/modalExamples/src/app/modal-example/modal-example.page.ts) · [modal-example.page.html](https://github.com/travislindenreid/INF33-Demos/blob/main/W7_L1_IonicComponents/modalExamples/src/app/modal-example/modal-example.page.html)

> ⚠️ **易错点**：`<ion-content padding>`（幻灯片 44 和仓库中都是）是旧版 Ionic 的写法，在当前版本中不会增加内边距——在 `modalExamples` 中，"Hello, IN4MATX 133!" 会紧贴左上角。应使用 `<ion-content class="ion-padding">`。

> 📝 **练习**：[演示 2：模态框](#113-演示-2为购物清单添加提示框与模态页面幻灯片-46--setup2--solution2) · [问题 2](#114-问题-2你对-ionic-组件有多大把握幻灯片-4748)

## 10. 路由

与 Angular 一样，`app.routes.ts` 定义 URL 路由——但应用中没有浏览器地址栏，因此用户只能通过按钮和链接在页面之间移动（幻灯片 50）。幻灯片中的路由表：

```ts
const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'page2',loadChildren:()=> import(‘./page2/page2.module’).then(m => m.Page2Module)}
];
```

`page2` 路由是**惰性加载**：只有在页面打开时才加载其代码。（又是弯引号：`import('./page2/page2.module')`。）`loadChildren` 加 module 的写法是较旧的 NgModule 风格；独立式组件的仓库项目则使用 `loadComponent` 进行惰性加载（来自 `setup2/src/app/app.routes.ts`）：

```ts
export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: 'modal',
    loadComponent: () => import('./modal/modal.page').then( m => m.ModalPage)
  },
];
```

`ionic generate page modal` 会自动为你添加最后那条路由。（对比 [Lecture 11 的路由表](lec-11.zh-CN.md#41-路由表)。）

要导航，需要在 Ionic 按钮上定义 `href` 属性（幻灯片 51）：

```html
<ion-content padding >
  <ion-button href="page2">Go to page 2</ion-button>
</ion-content>
```

Ionic 还提供了其他方法来管理页面历史——返回上一页，以及打破典型撤销/重做循环的非线性导航。这些大多超出了本课的范围，但值得自己研究（幻灯片 52）。

> 🧪 **Demo 文件**：[setup2/src/app/app.routes.ts](https://github.com/travislindenreid/INF33-Demos/blob/main/W7_L1_IonicComponents/setup2/src/app/app.routes.ts)

> 🔗 **延伸阅读**：[Ionic: Angular navigation](https://ionicframework.com/docs/angular/navigation)

## 11. 课堂问题与演示（附解答）

两个投票都是信心自测，没有正确选项，幻灯片上每个选项的条形都显示 0%（未公布结果）。两个编程演示都使用同一个 "My Shopping List" 应用；解答在 Chromium 中编写并运行，下面的输出即来自于此。

### 11.1 演示 1：购物清单（幻灯片 34 · setup1 → solution1）

幻灯片 34 展示了目标效果："My Shopping List"，包含复选框行 Broccoli、Bread、Orange Juice（已勾选）、Apples，以及一个 **Check Out** 按钮。`setup1/src/app/home/home.page.ts` 中已经有数据和 `checkOut()`：

```ts
shoppingList:any[] = [
  {'item':'Broccoli', 'inCart':false},
  {'item':'Bread', 'inCart':false},
  {'item':'Orange Juice', 'inCart':true},
  {'item':'Apples', 'inCart':false}
];

itemsPurchased:any[] = [];

checkOut() {
  var boughtItems = this.shoppingList.filter((item:any) => {
    return item.inCart;
  });
  var unboughtItems = this.shoppingList.filter((item:any) => {
    return !item.inCart;
  });
  this.shoppingList = unboughtItems;
  boughtItems.forEach((item:any) => {
    this.itemsPurchased.push(item.item);
  });
}
```

任务写在 `home.page.html` 的 TODO 注释中：

```html
<!--Display the shopping list in an <ion-list> using <ion-checkbox>-->
<!--Bind the checkbox values to each item's inCart value-->
<!--Create an <ion-button> and bind it to the checkOut() function-->
<!--Display an <ion-card> after an item was purchased-->
<!--In the card, show a shopping report of each item purchased with the "cart" icon-->
```

以及 `.ts` 中的 `//Don't forget to add imports for the new components!`。

<details>
<summary>答案</summary>

`home.page.html`（来自 `solution1`）：

```html
<ion-content [fullscreen]="true">
  <ion-list>
    @for(item of shoppingList; track item) {
      <ion-item>
        <ion-label>
          <ion-checkbox [(ngModel)]="item.inCart">{{item.item}}</ion-checkbox>
        </ion-label>
      </ion-item>
    }
  </ion-list>
  <ion-button (click)="checkOut()">Check Out</ion-button>
  @if(itemsPurchased.length > 0) {
    <ion-card>
      <ion-card-header>
        <ion-card-title>Shopping Report</ion-card-title>
      </ion-card-header>
      <ion-card-content>
        @for(item of itemsPurchased; track item) {
          <ion-item>
            <ion-icon name="cart-outline"></ion-icon>
            <ion-label>{{item}}</ion-label>
          </ion-item>
        }
      </ion-card-content>
    </ion-card>
  }
</ion-content>
```

`home.page.ts` 的改动：导入并加载每个新组件，为 `ngModel` 导入 `FormsModule`，并注册购物车图标：

```ts
import { FormsModule } from '@angular/forms';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonList, IonLabel, IonCheckbox, IonItem, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { cartOutline } from 'ionicons/icons';
// ...
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonList, IonLabel, IonCheckbox, IonItem, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonIcon, FormsModule],
// ...
  constructor() {
    addIcons({ cartOutline });
  }
```

（`solution1` 还在第一个 `filter` 中加入了 `console.log(item)` 和 `console.log(boughtItems)`，并把 `this.shoppingList = unboughtItems;` 移到了末尾——行为相同。）

运行结果：勾选 Broccoli 并按下 **Check Out**，会输出四个条目（Broccoli 和 Orange Juice 现在为 `inCart: true`），列表中保留 **Bread、Apples**，并显示一张 "Shopping Report" 卡片，Broccoli 和 Orange Juice 旁边有购物车图标。勾选 Bread 再次结算，会把 **Bread** 加入报告，列表中只剩 Apples。

关键原因：`[(ngModel)]` 会把勾选状态写回 `item.inCart`（使用 `[checked]` 的话，列表永远不会改变）；`@if` 在 `itemsPurchased` 有内容之前隐藏卡片；`checkOut()` 会替换 `shoppingList`，因此 `@for` 会重新渲染更短的列表。

用 Ionic web 组件（不使用 Angular）重新实现的同一个应用；该步骤会勾选 Broccoli 并结算，输出 `[ 'Broccoli', 'Orange Juice' ]`：

```viz web-demo
{"title": "Demo 1 check: the solution1 shopping list re-created with Ionic web components (no Angular)", "width": 375, "height": 560, "html": "<link rel=\"stylesheet\" href=\"https://cdn.jsdelivr.net/npm/@ionic/core@8.8.19/css/ionic.bundle.css\">\n<script>window.Ionic = { config: { mode: \"ios\" } };</script>\n<script type=\"module\" src=\"https://cdn.jsdelivr.net/npm/@ionic/core@8.8.19/dist/ionic/ionic.esm.js\"></script>\n<ion-app>\n<ion-header>\n  <ion-toolbar><ion-title>My Shopping List</ion-title></ion-toolbar>\n</ion-header>\n<ion-content>\n  <ion-list id=\"list\"></ion-list>\n  <ion-button id=\"checkout\">Check Out</ion-button>\n  <ion-card id=\"report\" hidden>\n    <ion-card-header><ion-card-title>Shopping Report</ion-card-title></ion-card-header>\n    <ion-card-content id=\"bought\"></ion-card-content>\n  </ion-card>\n</ion-content>\n</ion-app>", "js": "let shoppingList = [\n  {'item':'Broccoli', 'inCart':false},\n  {'item':'Bread', 'inCart':false},\n  {'item':'Orange Juice', 'inCart':true},\n  {'item':'Apples', 'inCart':false}\n];\nlet itemsPurchased = [];\nfunction render() {   // what @for / @if do in the template\n  const list = document.getElementById('list');\n  list.innerHTML = '';\n  shoppingList.forEach((item) => {\n    const row = document.createElement('ion-item');\n    const box = document.createElement('ion-checkbox');\n    box.textContent = item.item;\n    box.checked = item.inCart;\n    box.addEventListener('ionChange', (e) => { item.inCart = e.detail.checked; });  // [(ngModel)]\n    row.appendChild(box);\n    list.appendChild(row);\n  });\n  document.getElementById('report').hidden = itemsPurchased.length == 0;\n  document.getElementById('bought').innerHTML = itemsPurchased.map((i) =>\n    '<ion-item><ion-icon name=\"cart-outline\"></ion-icon><ion-label>' + i + '</ion-label></ion-item>').join('');\n}\nfunction checkOut() {\n  var boughtItems = shoppingList.filter((item) => item.inCart);\n  var unboughtItems = shoppingList.filter((item) => !item.inCart);\n  console.log(boughtItems.map((i) => i.item));\n  boughtItems.forEach((item) => { itemsPurchased.push(item.item); });\n  shoppingList = unboughtItems;\n  render();\n}\ndocument.getElementById('checkout').addEventListener('click', checkOut);\nrender();", "steps": [{"note": "Tick Broccoli, then press Check Out (scripted).", "js": "setTimeout(() => { shoppingList[0].inCart = true; checkOut(); }, 800);"}]}
```

</details>

> 🧪 **Demo 文件**：[setup1/src/app/home/home.page.html](https://github.com/travislindenreid/INF33-Demos/blob/main/W7_L1_IonicComponents/setup1/src/app/home/home.page.html) · [setup1/…/home.page.ts](https://github.com/travislindenreid/INF33-Demos/blob/main/W7_L1_IonicComponents/setup1/src/app/home/home.page.ts) · [solution1/…/home.page.html](https://github.com/travislindenreid/INF33-Demos/blob/main/W7_L1_IonicComponents/solution1/src/app/home/home.page.html) · [solution1/…/home.page.ts](https://github.com/travislindenreid/INF33-Demos/blob/main/W7_L1_IonicComponents/solution1/src/app/home/home.page.ts)

回到 [第 7 节](#7-列表与卡片)。

### 11.2 问题 1：你对 Ionic 组件有多大把握？（幻灯片 35–36）

*到目前为止，你对能否使用 Ionic 组件有多大把握？*

- A. 我对如何使用它们有很多疑问
- B. 我对如何使用它们有一些疑问
- C. 我还在消化这些信息，之后再来确认
- D. 我想一旦开始使用，我就能搞定
- E. 我相信我能够使用它们

<details>
<summary>答案</summary>

这是一个自我评估投票——没有正确答案。如果你选了 A–C，最快的检查方法是看你能否解释演示 1 的三个要点：一个由 `@for` 构建 `<ion-item>` 行的 `<ion-list>`，一个使用 `[(ngModel)]` 绑定的复选框（外加 `FormsModule`），以及每个组件既被导入又列在 `imports` 中。

</details>

回到 [第 7 节](#7-列表与卡片)。

### 11.3 演示 2：为购物清单添加提示框与模态页面（幻灯片 46 · setup2 → solution2）

幻灯片 46 展示了带有三个按钮的购物清单：**Add Item**、**Delete Item(s)**、**Check Out**。`setup2` 已经有列表和按钮、注入好的 `AlertController` 与 `ModalController`、一个生成好的 `modal` 页面（工具栏显示 "Checked out!"，并带有 Shopping Report 卡片），以及以下 TODO：

```ts
async addItem() {
  //TODO: use the alert controller to create and display a text input field, and add that to the shopping list.
}

async deleteItems() {
 //TODO: use the alert controller to create and display a set of checkboxes for each item in the shopping list.
 //For each item checked, delete the item from the list.
}

async checkOut() {
  // ...filters the list as before, then:
  var itemsPurchased = boughtItems.map((item:any) => {
    return item.item;
  });
}
```

在模态页面中：`dismiss()` 里有 `//TODO: use the modal controller to dismiss this page`，其工具栏中有 `<!--TODO: add dismiss button in an <ion-buttons> and bind it to dismiss() function-->`。`setup2` 中的复选框使用 `[checked]="item.inCart"` 绑定。

<details>
<summary>答案</summary>

**Add Item** —— 带有文本输入框的提示框。`Ok` 处理函数会接收以 `name` 为键的输入值：

```ts
addItem() {
  this.alertController.create({
    header: 'What would you like to add?',
    inputs: [
      {
        name: 'item',
        type: 'text',
        placeholder: 'Add an item'
      }
    ],
    buttons: [
      {
        text: 'Cancel',
        role: 'cancel',
        cssClass: 'secondary',
        handler: (data) => {
          //No need to do anything
          console.log('Confirm Cancel');
        }
      }, {
        text: 'Ok',
        handler: (data) => {
          console.log(data);
          this.shoppingList.push({'item':data.item, 'inCart':false});
        }
      }
    ]
  }).then((alert) => {
    alert.present();
  });
}
```

输入 "Milk" 并按下 Ok，会输出 `{item: 'Milk'}` 并添加一行 Milk。

**Delete Item(s)** —— 用 `map` 为每个条目构建一个复选框输入，然后过滤掉被勾选的条目。对于复选框输入，处理函数会收到被勾选值组成的**数组**：

```ts
deleteItems() {
  var inputs:any[] = this.shoppingList.map((item:any) => {
    return {name:'toRemove', type:'checkbox', label:item.item, value:item.item};
  });

  this.alertController.create({
    header: 'Which would you like to delete?',
    inputs: inputs,
    buttons: [
      { text: 'Cancel', role: 'cancel', cssClass: 'secondary',
        handler: (data) => { console.log('Confirm Cancel'); } },
      { text: 'Ok',
        handler: (data) => {
          console.log(data);
          this.shoppingList = this.shoppingList.filter((item) => {
            return !data.includes(item.item);
          });
        }
      }
    ]
  }).then((alert) => {
    alert.present();
  });
}
```

勾选 Bread 并按下 Ok，会输出 `['Bread']` 并将其删除。

**Check Out** —— 计算完 `itemsPurchased` 后，打开模态页面，并通过 `componentProps` 把列表传入（它会进入页面的 `@Input() itemsPurchased`）：

```ts
this.modalController.create({
  component: ModalPage,
  componentProps: { itemsPurchased: itemsPurchased }
}).then((modal) => {
  modal.present();
});
```

并使用 `import { ModalPage } from '../modal/modal.page';`。模态页面的 `dismiss()`：

```ts
dismiss() {
  this.modalController.dismiss({
    'dismissed': true
  });
}
```

另外：复选框改为 `[(ngModel)]="item.inCart"` 并导入 `FormsModule`——使用 `[checked]` 时，勾选框永远不会设置 `inCart`，因此结算时只会购买 Orange Juice。另外，`addItem`/`deleteItems`/`checkOut` 去掉了 `async`，因为它们使用 `.then()`。

运行：添加 Milk、删除 Bread、勾选 Milk 并按下 Check Out 后，会出现一个全屏的 "Checked out!" 页面，显示包含 **Orange Juice** 和 **Milk** 的 Shopping Report，而下方的列表保留 Broccoli 和 Apples。

**仓库中的解答漏掉了一项 TODO**：`solution2` 的模态页面从未添加关闭按钮，因此 `dismiss()` 永远不会被调用，页面在手机上也无法关闭（在桌面浏览器中按 Escape 可以关闭）。缺少的部分如下：

```html
<ion-toolbar>
  <ion-title>Checked out!</ion-title>
  <ion-buttons slot="end">
    <ion-button (click)="dismiss()">Dismiss</ion-button>
  </ion-buttons>
</ion-toolbar>
```

需要为模态页面的 imports 添加 `IonButtons` 和 `IonButton`。（这最后一段代码是为这些笔记编写的，不在仓库中。）

</details>

> 🧪 **Demo 文件**：[setup2/…/home.page.ts](https://github.com/travislindenreid/INF33-Demos/blob/main/W7_L1_IonicComponents/setup2/src/app/home/home.page.ts) · [setup2/…/modal.page.html](https://github.com/travislindenreid/INF33-Demos/blob/main/W7_L1_IonicComponents/setup2/src/app/modal/modal.page.html) · [solution2/…/home.page.ts](https://github.com/travislindenreid/INF33-Demos/blob/main/W7_L1_IonicComponents/solution2/src/app/home/home.page.ts) · [solution2/…/modal.page.ts](https://github.com/travislindenreid/INF33-Demos/blob/main/W7_L1_IonicComponents/solution2/src/app/modal/modal.page.ts)

回到 [第 8 节](#8-模态对话框toastalertaction-sheet) · [第 9 节](#9-模态页面)。

### 11.4 问题 2：你对 Ionic 组件有多大把握？（幻灯片 47–48）

*你对能否使用 Ionic 组件有多大把握？* —— 与 [问题 1](#112-问题-1你对-ionic-组件有多大把握幻灯片-3536) 相同的五个选项，只是在模态框演示之后再次提问。

<details>
<summary>答案</summary>

同样没有正确答案。需要自我检验的新技能：从 `.ts` 文件中创建并显示对话框（create → present），在按钮的 `handler` 中读取提示框的输入值，以及通过 `componentProps` 把数据传入模态页面（并通过 `dismiss(data)` + `onDidDismiss()` 把数据传回）。

</details>

回到 [第 9 节](#9-模态页面)。

## 12. 速查与必记的 5 个要点

**组件**

| 类型 | 标签 | 说明 |
|---|---|---|
| 结构 | `ion-header`, `ion-content`, `ion-footer`, `ion-toolbar`, `ion-title`, `ion-tabs` | 工具栏放在 header/footer 中 |
| 条目 | `ion-item`, `ion-label`, `ion-thumbnail`, `ion-button` | 一行；`slot="start"`/`"end"`；`button`、`href`、`color` |
| 图标 | `ion-icon`, `ion-badge`, `ion-avatar`, `ion-chip` | `addIcons({ heart })` + `name="heart"` |
| 输入 | `ion-input`, `ion-checkbox`, `ion-toggle`, `ion-radio`, `ion-datetime` | 放在 `ion-item` 中；`[(ngModel)]` 需要 `FormsModule` |
| 列表 | `ion-list`, `ion-card`, `ion-card-header`, `ion-card-title`, `ion-card-subtitle`, `ion-card-content` | 列表中可以包含卡片 |
| 模态 | `ToastController`, `AlertController`, `ActionSheetController`, `ModalController` | `create({...}).then(x => x.present())` |

**控制器**

| 调用 | 作用 |
|---|---|
| `toastController.create({ message, duration })` | 短消息，会自行消失 |
| `alertController.create({ header, subHeader, message, inputs, buttons })` | 居中对话框；按钮的 `handler(data)` 会收到输入值 |
| `actionSheetController.create({ header, buttons })` | 底部面板；按钮可设 `role: 'destructive' / 'cancel'`、`icon`、`handler` |
| `modalController.create({ component, componentProps })` | 覆盖在页面之上的页面；props → `@Input()` |
| `modalController.dismiss(data)` | 关闭最上层的模态框，并把 `data` 传回 |
| `modal.onDidDismiss().then(r => r.data)` | 读取模态框传回的内容 |

**CLI**

| 命令 | 用途 |
|---|---|
| `npm install -g @ionic/cli` | 安装 Ionic CLI |
| `ionic start [projectname]` | 新建项目 |
| `ionic generate page [name]` | 新建页面（并添加其路由） |
| `ionic serve` | 在浏览器中运行 |

**必记的 5 个要点**

1. 独立式页面必须从 `@ionic/angular/standalone` **导入**每个 Ionic 组件，并把它列入 `imports: [...]`——使用 `ngModel` 还需要 `FormsModule`。
2. `[checked]` 只负责显示值；`[(ngModel)]` 才会把用户的选择写回你的数据。
3. 图标需要用 `addIcons({ ... })` 注册你用到的每一个名称——包括操作表选项中的图标——否则它们会悄无声息地不显示。
4. 对话框和模态页面都从 `.ts` 中打开：`create()` 返回 Promise，在 `present()` 之前什么都不会出现。
5. `componentProps` 的键会成为模态页面的 `@Input()`；`dismiss(data)` 把数据传回，而 `onDidDismiss()` 解析为一个对象，其 `.data` 就是该值。
