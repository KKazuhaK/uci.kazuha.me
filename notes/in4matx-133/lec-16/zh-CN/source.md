# IN4MATX 133: User Interface Software — Lecture 16：数据库与本地存储

## 目录

- [1. 应用为什么要存储数据](#1-应用为什么要存储数据)
- [2. WebView 应用的存储方式](#2-webview-应用的存储方式)
- [3. 浏览器存储：cookies 与 Web storage](#3-浏览器存储cookies-与-web-storage)
- [4. 应用偏好设置（Preferences）](#4-应用偏好设置preferences)
- [5. IndexedDB](#5-indexeddb)
- [6. 设备关系型存储](#6-设备关系型存储)
- [7. 远程存储与本地存储](#7-远程存储与本地存储)
- [8. 完成 A4](#8-完成-a4)
- [9. 课堂问题与演示（附解答）](#9-课堂问题与演示附解答)
- [10. 速查与必记的 5 个要点](#10-速查与必记的-5-个要点)

> UCI IN4MATX 133: User Interface Software — Prof. Travis Linden Reid，2026 年秋季学期，周四 11/19（第 8 周）
> 内容整理自 Lecture 16 的幻灯片（共 28 页）和 demo 仓库文件夹 `W8_L2_Databases`。内容按概念组织，而不是按来源组织。

> 📅 **课程安排**：今天之后，A4 需要的内容就全部讲完了——**A4 截止于周一午夜**。别忘了填写搭档问卷（partner survey）。资源链接都在课程 Slack 上。
> 感恩节那周：周二照常上课；答疑时间改为**周二 2–3pm**，中午到上课前办公室门开着，可以来问 A5。周四没有课。

今天的目标（幻灯片 3、27）：说明浏览器应用和移动应用可用的存储方式；为 WebView 应用中的本地数据选择合适的存储方式；在 Ionic 应用中使用两种存储方式（Preferences 和 IndexedDB）。

---

## 1. 应用为什么要存储数据

数据存在两种地方之一（幻灯片 4）：

| 远程存储 | 本地存储 |
|---|---|
| 用户账户 | 应用设置 / 用户偏好 |
| 用户发布的内容（帖子） | 用户产生的数据 |
| | 游戏存档 |

如今很多应用（包括游戏）即使是右栏这类数据，也主要依赖**云端**存储。

因为 133 是前端课，这一讲只是对各种方式的快速概览（幻灯片 5）。后端有专门的课：数据库在 **CS 122A & B**，远程存储和服务器通信在 **SWE 124**。

引出问题的场景（幻灯片 6）：刷新一下 A4 的睡眠记录应用，**所有记录都没了**。组件变量只存在于内存里。想保留数据，就必须明确让浏览器或应用把它存到某个地方。

## 2. WebView 应用的存储方式

WebView 应用（Ionic/Capacitor 应用，[Lecture 12](lec-12.zh-CN.md)）既可以用**浏览器**提供的存储，*也*可以用**移动设备**提供的存储（幻灯片 7）：

- 浏览器存储（cookies、Web storage）——[第 3 节](#3-浏览器存储cookies-与-web-storage)
- 应用 Preferences——[第 4 节](#4-应用偏好设置preferences)
- IndexedDB——[第 5 节](#5-indexeddb)
- 设备上的关系型数据库——[第 6 节](#6-设备关系型存储)
- 远程数据库——[第 7 节](#7-远程存储与本地存储)

五种方式的对比见[速查](#10-速查与必记的-5-个要点)。

> 🔗 **延伸阅读**：[MDN：存储配额与清除标准](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria) · [Capacitor：存储指南](https://capacitorjs.com/docs/guides/storage) · [Ionic：Angular 存储](https://ionicframework.com/docs/angular/storage)

## 3. 浏览器存储：cookies 与 Web storage

**Cookies**（幻灯片 8）：

- 在浏览器和服务器之间来回传递的小块数据；
- 用来维持**会话（session）**；
- **非常小**——不是放应用数据的地方。

**Web storage**（幻灯片 9）是浏览器的本地存储：

- **只用于 Web**；
- **同步**操作，所以扩展性差——每次读写都会阻塞；
- 浏览器**不**推荐用它存大量数据；
- 没有流行的 Ionic/Capacitor 插件封装它。

> ⚠️ **易错点**：在本课程里，这两者都不是存应用数据的答案。cookies 用于会话；Web storage 是同步的、只用于 Web、也没有 Ionic/Capacitor 插件。在[课堂问题](#9-课堂问题与演示附解答)里它们都是错误选项。

> 🔗 **延伸阅读**：[MDN：使用 HTTP cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Cookies) · [MDN：Web Storage API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API)

## 4. 应用偏好设置（Preferences）

应用偏好设置（幻灯片 10）：

- 用于**少量数据**——比如语言、深色/浅色模式这类应用设置；
- **永久**保存；
- **不加密**；
- **同步**操作，所以扩展性差；
- 在 Ionic 中：**Capacitor Preferences** 插件（`@capacitor/preferences`）。它只能存**字符串**（iOS 支持所有基本类型，但别依赖这一点）。

它是一个键–值存储。demo 应用（幻灯片 24）用它保存用户的名字。三个调用，取自 `home.page.ts`（solution）：

```ts
import { Preferences } from '@capacitor/preferences';

nameKey:string = "name";
name:string = "";

// save: key + string value
await Preferences.set({
  key: 'name',
  value: this.name,
});

// load: resolves to { value: string | null }
Preferences.get({
  key: this.nameKey
}).then((resultName) => {
  console.log(`name: ${resultName.value}`);
  // result value is a string | null,
  // so:
  // 1. ensure nameValue is not null
  // 2. use JavaScript String() fn to convert it to string
  if(resultName.value)
  {
    console.log(`${resultName.value} not null`);
    this.name = String(resultName.value);
    this.namedSaved.set(true);
  }
});

// delete one key
await Preferences.remove({
  key: this.nameKey
});
```

每个调用都返回 Promise，所以要用 `await` 或 `.then()`。从没保存过的键会返回 `{ value: null }`，所以代码在使用前先检查 `if(resultName.value)`。

在 Chromium 中运行构建好的 demo：还没保存时，控制台输出 `name: null`；输入 "Kazuha" 并点 Save 后，页面的 `localStorage` 里是 `{"CapacitorStorage.name":"Kazuha"}`；刷新后控制台输出 `name: Kazuha` 和 `Kazuha not null`，欢迎页面也回来了。可见在浏览器中，这个插件底层用的是 Web storage，键带 `CapacitorStorage.` 前缀。

> 💡 **关键理解**：Preferences 按键存字符串。要存数字、列表或对象，得自己转成字符串（加载时再转回来）——或者换一个为结构化数据设计的存储（[第 5 节](#5-indexeddb)）。

完整的应用可以在[第 5 节](#5-indexeddb)末尾交互运行。

> 🧪 **Demo 文件**：[solution/…/home.page.ts](https://github.com/travislindenreid/INF33-Demos/blob/main/W8_L2_Databases/solution/DatabaseExamples/src/app/home/home.page.ts) · [package.json](https://github.com/travislindenreid/INF33-Demos/blob/main/W8_L2_Databases/solution/DatabaseExamples/package.json)

> 📝 **练习**：[演示 1](#93-演示-1用-preferences-保存名字用-indexeddb-保存季节幻灯片-24--setup--solution)

> 🔗 **延伸阅读**：[Capacitor Preferences 插件 README](https://github.com/ionic-team/capacitor-plugins/blob/main/preferences/README.md) · [Capacitor：存储指南](https://capacitorjs.com/docs/guides/storage)

## 5. IndexedDB

### 5.1 它是什么

**IndexedDB**（幻灯片 11）：

- 2015 年提出，2021 年成为标准；
- **浏览器原生支持的数据库**；
- 如今兼容性相当好——幻灯片里的 caniuse 表格显示，当前的 Chrome、Edge、Safari、Firefox、Opera、Chrome for Android、iOS Safari 和 Samsung Internet 都完全支持；只有 IE 10–11 是部分支持。

它的特点（幻灯片 12）：

- **由浏览器实现**；
- 在设备上**不是永久的**——iOS 可能出于空间或隐私原因，在不提示的情况下清除它；
- Angular：`ngx-indexed-db`——可惜不兼容最新版 Angular；
- Ionic：**`ionic-storage`**——好几年没更新了，但仍然能用。demo 用的就是它。

那它到底带来了什么数据库优势（幻灯片 13）？主要是**一定的结构和组织**，以及一个便于演示的更简单的 API；其他课程会讲得更深入。幻灯片引用了 Ionic 数据存储指南中关于 IndexedDB 的内容：

| 优点 | 缺点 |
|---|---|
| 免费 | 操作系统回收空间时数据会丢失 |
| 在浏览器中可用 | 不支持加密 |
| 支持查询 | 存储容量有限 |
| | 数据难以导出 |

> 🔗 **延伸阅读**：[caniuse：IndexedDB](https://caniuse.com/?search=indexeddb) · [MDN：IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) · [GitHub：ionic-storage](https://github.com/ionic-team/ionic-storage) · [Ionic Enterprise Guide：数据存储](https://ionic.io/enterprise-guide/data-storage)

### 5.2 在 demo 应用中使用 ionic-storage

demo 把用户最喜欢的季节存在 IndexedDB 里。分三部分，`setup` 项目里都已经写好了。

**1. 注册存储模块**（`main.ts`）——数据库名，以及依次尝试的驱动：先 IndexedDB，退而用 Web storage：

```ts
import { IonicStorageModule } from '@ionic/storage-angular';
import { Drivers } from '@ionic/storage';

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(routes, withPreloading(PreloadAllModules), withComponentInputBinding()),
    importProvidersFrom(
      IonicStorageModule.forRoot({
        name: '__mydb',
        driverOrder: [Drivers.IndexedDB, Drivers.LocalStorage]
      })
    )
  ],
});
```

**2. 用一个 service 封装**（`services/storage.ts`，即 [Lecture 11](lec-11.zh-CN.md) 里的 Angular service）。`storage.create()` 只打开一次数据库；每个方法都先等它完成：

```ts
import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private _storage: Promise<Storage>;

  constructor(private storage: Storage) {
    this._storage = this.storage.create();
  }

  public async set(key: string, value: any) {
    const storage = await this._storage;
    await storage.set(key, value);
  }

  public async get(key: string) {
    const storage = await this._storage;
    let val = await storage.get(key);
    return val;
  }

  public async reset() {
    const storage = await this._storage;
    storage.clear();
  }
}
```

**3. 注入 service 并调用**（`home.page.ts`，solution）。和 Preferences 不同，`set` 可以接受任意值，而不只是字符串：

```ts
constructor(private storage:StorageService) {
  // … load preferences data (Section 4) …
  this.init();
}

async init () {
  // load IndexedDB data
  let val = await this.storage.get(this.seasonKey);
  console.log("found season value: " + val);
  if(val)
  {
    console.log("VALID season value: " + val);
    this.pickerValue = val;
    this.setDecorativeText();
  }
}

onIonChange(event: CustomEvent) {
  this.pickerValue = event.detail.value;
  this.setDecorativeText();
  this.storage.set(this.seasonKey, this.pickerValue);
}

async clearData() {
  // … Preferences.remove (Section 4) …
  // clear ionic storage data
  this.storage.reset();
}
```

季节来自一个 `ion-picker`（[Lecture 13](lec-13.zh-CN.md)），它的 `(ionChange)` 调用 `onIonChange($event)`；`setDecorativeText()` 根据季节选出对应的 emoji。

在 Chromium 中选了 Fall 之后，浏览器里有一个 IndexedDB 数据库 `__mydb`，其对象仓库 `_ionickv` 中键 `season` → `"Fall"`。刷新后输出 `found season value: Fall` 和 `VALID season value: Fall`。**Reset data** 会清空两个存储（`localStorage` 变成 `{}`，`_ionickv` 没有任何键），下次加载输出 `name: null` 和 `found season value: null`。

### 5.3 视图没有显示加载出的季节

solution 里有一个真实的 bug：按上面的步骤刷新后，控制台说季节是 Fall，但屏幕上显示的是 **"Welcome, Kazuha!"，没有 emoji，picker 停在 Spring**。`pickerValue` 和 `decorativeText` 是普通字段，并且是在 **`await` 之后**赋值的，所以没有任何东西刷新视图（[Lecture 15](lec-15.zh-CN.md#5-signals) 讲过的规则）。名字能显示出来，只是因为 `namedSaved` 是 signal。手动选择季节没问题，是因为用户事件会刷新视图。

修复：把这两个字段改成 signal，用 `.set()` 赋值：

```ts
pickerValue = signal<string>("Spring");
decorativeText = signal<string>("");

// in init():  this.pickerValue.set(val);
// in setDecorativeText():  this.decorativeText.set(this.fallText);  (etc.)
// in onIonChange():  this.pickerValue.set(event.detail.value);
//                    this.storage.set(this.seasonKey, this.pickerValue());
```

```html
Welcome, {{name}}! {{decorativeText()}}
<ion-picker-column [value]="pickerValue()" (ionChange)="onIonChange($event)">
```

改完之后，刷新后的应用会显示 Fall 和 🍂🍁🎃。（文件里本身也问了对应的问题：*"why is namedSaved a signal, but not nameKey?"*——`nameKey` 从不改变，所以视图不需要被通知。）

下面可以动手试：输入名字点 Save，选一个季节，再点 **重新加载应用**（替身“磁盘”会保留数据，就像真实的存储一样）。点下一步会自动跑一遍刷新的场景，再应用修复：

```viz web-demo
{"title": "演示 1（幻灯片 24 · setup → solution）用 Ionic Web 组件重现；Preferences、ionic-storage 和 signal() 都是替身", "width": 375, "height": 520, "html": "<link rel=\"stylesheet\" href=\"https://cdn.jsdelivr.net/npm/@ionic/core@8.8.19/css/ionic.bundle.css\">\n<script type=\"module\" src=\"https://cdn.jsdelivr.net/npm/@ionic/core@8.8.19/dist/ionic/ionic.esm.js\"></script>\n<ion-app>\n<ion-header><ion-toolbar><ion-title>Data Saving Demo</ion-title></ion-toolbar></ion-header>\n<ion-content>\n  <div id=\"container\"></div>\n</ion-content>\n<ion-footer><ion-toolbar><ion-button id=\"reload\" fill=\"outline\" expand=\"block\">⟳ 重新加载应用（“磁盘”上的数据保留）</ion-button></ion-toolbar></ion-footer>\n</ion-app>\n", "css": "#container { text-align: center; position: absolute; left: 0; right: 0; top: 50%; transform: translateY(-50%); }\n", "js": "// ---- Stand-ins (the sandbox has no Angular, Capacitor or ionic-storage) ----\n// \"disk\" survives the Reload button, like real storage survives a refresh.\nconst disk = { prefs: new Map(), idb: new Map() };\nconst Preferences = {   // @capacitor/preferences: strings, get() resolves to { value: string | null }\n  get: async ({ key }) => ({ value: disk.prefs.has(key) ? disk.prefs.get(key) : null }),\n  set: async ({ key, value }) => { disk.prefs.set(key, value); },\n  remove: async ({ key }) => { disk.prefs.delete(key); }\n};\nconst storageService = {  // services/storage.ts on top of ionic-storage (IndexedDB opens a bit later)\n  get: (key) => new Promise(r => setTimeout(() => r(disk.idb.has(key) ? disk.idb.get(key) : null), 50)),\n  set: async (key, value) => { disk.idb.set(key, value); },\n  reset: async () => { disk.idb.clear(); }\n};\n// A tiny signal(): read with s(), write with s.set(v); set() refreshes the view.\nfunction signal(value) { const s = () => value; s.set = (v) => { value = v; render(); }; return s; }\n\n// ---- home.page.ts (solution) ----\nclass HomePage {\n  namedSaved = signal(false);\n  nameKey = \"name\";\n  name = \"\";\n  pickerValue = \"Spring\";\n  decorativeText = \"\";\n  springText = '\\u{1F326}\\u{1F490}\\u{1F430}';\n  summerText = '\\u{1F33B}\\u{1F31E}\\u{1F30A}';\n  fallText = '\\u{1F342}\\u{1F341}\\u{1F383}';\n  winterText = '\\u{2744}\\u{1F384}\\u{26C4}';\n  seasonKey = \"season\";\n\n  constructor(storage) {\n    this.storage = storage;\n    Preferences.get({ key: this.nameKey }).then((resultName) => {\n      console.log(`name: ${resultName.value}`);\n      if (resultName.value) {\n        this.name = String(resultName.value);\n        this.namedSaved.set(true);\n      }\n    });\n    this.init();\n  }\n  async init() {\n    let val = await this.storage.get(this.seasonKey);\n    console.log(\"found season value: \" + val);\n    if (val) {\n      this.pickerValue = val;      // plain field: nothing refreshes the view here\n      this.setDecorativeText();\n    }\n  }\n  async saveName() {\n    await Preferences.set({ key: 'name', value: this.name });\n    this.namedSaved.set(true);\n  }\n  async clearData() {\n    await Preferences.remove({ key: this.nameKey });\n    this.namedSaved.set(false);\n    this.name = \"\";\n    this.storage.reset();\n  }\n  onIonChange(event) {\n    this.pickerValue = event.detail.value;\n    this.setDecorativeText();\n    this.storage.set(this.seasonKey, this.pickerValue);\n  }\n  setDecorativeText() {\n    switch (this.pickerValue) {\n      case \"Spring\": this.decorativeText = this.springText; break;\n      case \"Summer\": this.decorativeText = this.summerText; break;\n      case \"Fall\": this.decorativeText = this.fallText; break;\n      case \"Winter\": this.decorativeText = this.winterText; break;\n    }\n  }\n}\n\n// ---- home.page.html: @if(namedSaved()) { welcome + picker + reset } @else { input + save } ----\n// An event handler refreshes the view when it returns (like Angular); an await inside it doesn't.\nlet page;\nfunction on(el, ev, fn) { el.addEventListener(ev, (e) => { fn(e); render(); }); return el; }\nfunction el(tag, attrs = {}, text = \"\") { const e = document.createElement(tag); for (const k in attrs) e.setAttribute(k, attrs[k]); e.textContent = text; return e; }\nfunction render() {\n  const c = document.getElementById('container');\n  c.innerHTML = '';\n  if (page.namedSaved()) {\n    c.append(el('ion-item', {}, `Welcome, ${page.name}! ${page.decorativeText}`), el('ion-item', {}, 'Your favorite season:'));\n    const col = el('ion-picker-column', { value: page.pickerValue });\n    for (const s of [\"Spring\", \"Summer\", \"Fall\", \"Winter\"]) col.append(el('ion-picker-column-option', { value: s }, s));\n    on(col, 'ionChange', (e) => page.onIonChange(e));\n    const picker = el('ion-picker'); picker.append(col); c.append(picker);\n    c.append(on(el('ion-button', {}, 'Reset data'), 'click', () => page.clearData()));\n  } else {\n    const input = el('ion-input', { placeholder: 'Enter your name' });\n    input.value = page.name;\n    on(input, 'ionInput', (e) => { page.name = e.target.value; });\n    c.append(el('ion-item'), on(el('ion-button', {}, 'Save'), 'click', () => page.saveName()));\n    c.firstChild.append(input);\n  }\n}\nfunction startApp() { console.log('--- app start ---'); page = new HomePage(storageService); render(); }\ndocument.getElementById('reload').addEventListener('click', startApp);\nstartApp();\n", "steps": [{"note": "自动执行：保存名字 Peter，选 Fall，然后重新加载。控制台显示季节已加载，但视图仍是 Spring，也没有 emoji（pickerValue 是普通字段）。", "js": "\n// ---- Scripted: save the name \"Peter\", pick Fall, then reload the app ----\nsetTimeout(async () => {\n  page.name = \"Peter\"; await page.saveName();\n  page.onIonChange({ detail: { value: \"Fall\" } }); render();\n  startApp();\n}, 300);\n"}, {"note": "修复：把 pickerValue 和 decorativeText 改成 signal，异步读完 IndexedDB 后赋值就会刷新视图：重新加载后显示 Fall 和 emoji。", "js": "\n// ---- Fix: pickerValue and decorativeText as signals ----\n// In the app: pickerValue = signal<string>(\"Spring\"); ... this.pickerValue.set(val);\n// Here: the same effect, a refresh after the async load.\nHomePage.prototype.init = async function () {\n  let val = await this.storage.get(this.seasonKey);\n  console.log(\"found season value: \" + val);\n  if (val) {\n    this.pickerValue = val;\n    this.setDecorativeText();\n    render();   // what pickerValue.set(val) / decorativeText.set(...) trigger\n  }\n};\n"}], "interactive": true}
```

> ⚠️ **易错点**：读取存储是异步的。在 `await` 之后（或 `.then()` 里）从存储读出来再赋值的东西都必须是 signal，否则即使控制台显示了新值，屏幕上仍是旧值。

> 🧪 **Demo 文件**：[main.ts](https://github.com/travislindenreid/INF33-Demos/blob/main/W8_L2_Databases/solution/DatabaseExamples/src/main.ts) · [services/storage.ts](https://github.com/travislindenreid/INF33-Demos/blob/main/W8_L2_Databases/solution/DatabaseExamples/src/app/services/storage.ts) · [solution/…/home.page.ts](https://github.com/travislindenreid/INF33-Demos/blob/main/W8_L2_Databases/solution/DatabaseExamples/src/app/home/home.page.ts) · [home.page.html](https://github.com/travislindenreid/INF33-Demos/blob/main/W8_L2_Databases/solution/DatabaseExamples/src/app/home/home.page.html)

> 📝 **练习**：[演示 1](#93-演示-1用-preferences-保存名字用-indexeddb-保存季节幻灯片-24--setup--solution)

## 6. 设备关系型存储

设备本身上的关系型数据库（幻灯片 14）：

- **永久**保存；
- **性能好**；
- 关系型 = 非常适合**大量的复杂数据**；
- **不是由浏览器实现，而是由设备实现**——所以对 WebView 应用来说**只在移动端可用**；
- Ionic 的选择：Capacitor 的 **Enterprise（付费）SQLite** 插件，或 **Capacitor 社区 SQLite** 插件（它在 Web 上也能用，底层用的是 IndexedDB）。

> 💡 **关键理解**：IndexedDB 是浏览器的数据库，可能被操作系统清除；设备关系型存储是手机的数据库，会一直保留。这个区别决定了[游戏存档那道题](#91-问题-1手机游戏存档最适合用哪种存储幻灯片-1720)。

## 7. 远程存储与本地存储

选择之前要问的问题（幻灯片 15）：

- 谁需要访问这些数据——只有用户自己，还是其他人也要？
- 作为开发者，**你**需要访问吗？
- 数据敏感吗？
- 数据是否重要到绝不能丢？

当**不只是本地设备**需要这些数据时，远程数据库至关重要（幻灯片 16）：

- **跨设备应用**：facebook.com 和 Facebook 手机应用都需要你的个人资料；
- **开发者**：为了了解用户的使用习惯，或提供数据驱动的服务；
- **社交媒体**：在用户之间分享用户生成的内容。

另一方面，**如果数据只存在本地，可以保留一定的隐私**。用哪种取决于数据的类型和使用场景。

## 8. 完成 A4

A4 有三项大任务（幻灯片 25–26）：

- 用 Ionic 组件搭建界面（[Lecture 13](lec-13.zh-CN.md)）；
- 生成自己的页面和组件，并用路由实现页面跳转；
- 使用一个访问原生设备资源（[Lecture 15](lec-15.zh-CN.md)）或存储（本讲）的插件。

推荐计划：**从难到易**依次完成。

| 难度 | 任务 |
|---|---|
| 最难 | 让设备资源 / 存储跑起来 |
| 中等 | 生成两个页面，配置路由，做一个链接 |
| 简单 | 用 Ionic 组件搭建界面，实现应用的功能 |

## 9. 课堂问题与演示（附解答）

### 9.1 问题 1：手机游戏存档最适合用哪种存储？（幻灯片 17–20）

Which of these is the best storage option for a mobile game's save file?

- A. Preferences
- B. Device relational storage
- C. Cookies
- D. IndexedDB
- E. Web storage

<details>
<summary>答案</summary>

**答案：B——设备关系型存储**（幻灯片没有公布这题的结果；这是根据幻灯片 10–14 推出的）。

- **B**：存档是重要的、用户产生的数据，而且是手机应用；设备存储永久、性能好、适合复杂数据。只能在移动端用对手机游戏不是问题。
- **A** 错：Preferences 用于少量设置，只存字符串，而且是同步的。
- **C** 错：cookies 很小，用于会话。
- **D** 是陷阱：它能用，但“在设备上不是永久的”——iOS 可能不提示就清除它，而丢存档是最糟的结果。
- **E** 错：只用于 Web、同步、不推荐存大量数据。

（幻灯片 4 的补充说明同样适用：如今很多游戏改把存档放在云端。）

</details>

返回[第 6 节](#6-设备关系型存储)。

### 9.2 问题 2：A4 的睡眠记录数据最适合用哪种存储？（幻灯片 21–23）

Which of these is the best storage option for A4's sleep tracking data?

- A. Preferences
- B. Device relational storage
- C. Cookies
- D. IndexedDB
- E. Web storage

<details>
<summary>答案</summary>

**答案：A、B 或 D**——幻灯片 23 把这三个都标亮了。

- **A，Preferences**：永久且简单；少量记录可以存成一个字符串。
- **B，设备关系型存储**：永久，适合不断增长的结构化数据——但只能在手机上用，`ionic serve` 里不行。
- **D，IndexedDB**（ionic-storage）：浏览器和设备上都能用，可以直接存结构化的值。
- **C** 和 **E** 不行，理由和问题 1 一样：cookies 是很小的会话数据，Web storage 只用于 Web，也没有 Ionic/Capacitor 插件。

</details>

返回[第 2 节](#2-webview-应用的存储方式)。

### 9.3 演示 1：用 Preferences 保存名字，用 IndexedDB 保存季节（幻灯片 24 · setup → solution）

**任务。** `setup` 是一个 Ionic + Angular 应用（"Data Saving Demo"），模板、`main.ts` 的存储配置和 `StorageService` 都已写好。页面先让用户输入名字；保存后显示 "Welcome, 名字!"，并提供季节选择器和 **Reset data** 按钮。补全 `home.page.ts` 里的五个 TODO，让两个值在刷新后都能保留：

```ts
constructor(private storage:StorageService) {
  // TODO: load preferences data

  this.init();
}

async init () {
  // TODO: load IndexedDB data
}

async saveName() {
  // TODO: save name to preferences
}

async clearData() {
  // TODO: clear preferences data

  // TODO: clear IndexedDB data
}

onIonChange(event: CustomEvent) {
  // TODO:
  // set picker value
  // set decorative text
  // save to IndexedDB
}
```

<details>
<summary>答案</summary>

```ts
constructor(private storage:StorageService) {
  // load preferences data
  Preferences.get({
    key: this.nameKey
  }).then((resultName) => {
    console.log(`name: ${resultName.value}`);
    if(resultName.value)
    {
      console.log(`${resultName.value} not null`);
      this.name = String(resultName.value);
      this.namedSaved.set(true);
    }
  });

  this.init();
}

async init () {
  // load IndexedDB data
  let val = await this.storage.get(this.seasonKey);
  console.log("found season value: " + val);
  if(val)
  {
    console.log("VALID season value: " + val);
    this.pickerValue = val;
    this.setDecorativeText();
  }
}

async saveName() {
  console.log(`saved name: ${this.name}`);
  try {
    await Preferences.set({
      key: 'name',
      value: this.name,
    });

    this.namedSaved.set(true);
  } catch (e)
  {
    console.log(e);
  }
}

async clearData() {
  // clear Preferences data
  await Preferences.remove({
    key: this.nameKey
  });

  this.namedSaved.set(false);
  this.name = "";

  // clear ionic storage data
  this.storage.reset();
}

onIonChange(event: CustomEvent) {
  this.pickerValue = event.detail.value;
  this.setDecorativeText();
  this.storage.set(this.seasonKey, this.pickerValue);
}
```

首次加载 → 保存 "Kazuha" → 选 Fall → 刷新，控制台输出：

```text
name: null
found season value: null
saved name: Kazuha
name: Kazuha
Kazuha not null
found season value: Fall
VALID season value: Fall
```

要点：

- `Preferences.get` resolve 为 `{ value: string | null }`——使用前先检查 `null`；
- 异步加载完成后 `namedSaved.set(true)` 让模板的 `@if` 切换到欢迎页面；
- 每次 `ionChange` 都保存季节，在 `init()` 里加载；
- `pickerValue` 和 `decorativeText` 也应该是 signal：按原样写，刷新后加载出的季节不会显示在屏幕上（[第 5.3 节](#53-视图没有显示加载出的季节)，含交互演示）。

</details>

> 🧪 **Demo 文件**：[setup/…/home.page.ts](https://github.com/travislindenreid/INF33-Demos/blob/main/W8_L2_Databases/setup/DatabaseExamples/src/app/home/home.page.ts) · [solution/…/home.page.ts](https://github.com/travislindenreid/INF33-Demos/blob/main/W8_L2_Databases/solution/DatabaseExamples/src/app/home/home.page.ts) · [home.page.html](https://github.com/travislindenreid/INF33-Demos/blob/main/W8_L2_Databases/solution/DatabaseExamples/src/app/home/home.page.html)

返回[第 4 节](#4-应用偏好设置preferences) · [第 5 节](#5-indexeddb)。

## 10. 速查与必记的 5 个要点

**WebView 应用的存储方式**

| 方式 | 由谁实现 | 永久？ | 适用于 | Ionic/Capacitor |
|---|---|---|---|---|
| Cookies | 浏览器 | — | 会话状态（很小） | — |
| Web storage | 浏览器 | — | 不推荐存大量数据；同步，只用于 Web | 没有流行插件 |
| Preferences | 设备（浏览器中为 Web storage） | 是，不加密 | 少量设置：语言、深色模式；只存字符串；同步 | `@capacitor/preferences` |
| IndexedDB | 浏览器 | 否——iOS 可能清除 | 一定的结构；免费、浏览器中可用、可查询 | `ionic-storage`（`@ionic/storage-angular`） |
| 设备关系型（SQLite） | 设备 | 是 | 大量复杂数据；性能好；只在移动端 | Enterprise SQLite（付费）、社区 SQLite |
| 远程数据库 | 服务器 | 是 | 跨设备、开发者访问、用户间分享 | 后端（CS 122A/B、SWE 124） |

**demo 中的 API 调用**

| 存储 | 保存 | 读取 | 删除 |
|---|---|---|---|
| Preferences | `await Preferences.set({ key, value })` | `Preferences.get({ key })` → `{ value: string \| null }` | `Preferences.remove({ key })` |
| ionic-storage | `storage.set(key, value)` | `await storage.get(key)` | `storage.clear()`（全部键） |

ionic-storage 的配置：在 `main.ts` 中 `IonicStorageModule.forRoot({ name, driverOrder: [Drivers.IndexedDB, Drivers.LocalStorage] })`，使用前先 `await storage.create()` 一次（即 demo 的 `StorageService`）。

**必记的 5 个要点**

1. 组件变量刷新就没了；要保留的数据必须明确存起来。
2. Preferences = 少量、永久、只存字符串的设置；IndexedDB = 有结构、在浏览器中，但**不是永久的**（iOS 可能清除）。
3. 设备关系型存储是存大量复杂数据的永久、高性能选择，但在 WebView 应用里只在移动端存在。
4. cookies 和 Web storage 都不是存应用数据的答案：cookies 是很小的会话数据；Web storage 是同步的、只用于 Web、没有插件。
5. 存储调用是异步的：从存储加载的值要通过 **signal** 赋值，否则视图不会显示它。