---
title: "Databases & Local Storage"
summary: "Remote vs. local data, the storage options a WebView app can use (cookies, web storage, Capacitor Preferences, IndexedDB via ionic-storage, device SQLite, remote databases), saving data with Preferences and IndexedDB in an Ionic app, and a plan for building A4."
---

# IN4MATX 133: User Interface Software — Lecture 16: Databases and Local Storage

## Table of Contents

- [1. Why apps store data](#1-why-apps-store-data)
- [2. Storage options for WebView apps](#2-storage-options-for-webview-apps)
- [3. Browser storage: cookies and web storage](#3-browser-storage-cookies-and-web-storage)
- [4. App Preferences](#4-app-preferences)
- [5. IndexedDB](#5-indexeddb)
- [6. Device relational storage](#6-device-relational-storage)
- [7. Remote vs. local storage](#7-remote-vs-local-storage)
- [8. Building A4](#8-building-a4)
- [9. In-class Questions & Demos (with Solutions)](#9-in-class-questions--demos-with-solutions)
- [10. Quick Reference & Top 5 Things to Remember](#10-quick-reference--top-5-things-to-remember)

> UCI IN4MATX 133: User Interface Software — Prof. Travis Linden Reid, Fall 2026, Thursday 11/19 (Week 8)
> Built from the Lecture 16 slides (28 pages) and the demo repo folder `W8_L2_Databases`. Organized by concept, not by source.

> 📅 **Class logistics**: After today you have everything you need for A4 — **A4 is due Monday at midnight**. Don't forget the partner survey. Resources are linked on the class Slack.
> Thanksgiving week: Tuesday class is still on; office hours move to **Tuesday 2–3pm**, and the office door is open from noon until class for help with A5. No class Thursday.

Today's goals (slides 3, 27): describe the storage options available to browser-based and mobile apps; choose the right option for local data in a WebView app; use two storage options (Preferences and IndexedDB) in an Ionic app.

---

## 1. Why apps store data

Data lives in one of two places (slide 4):

| Remote storage | Local storage |
|---|---|
| user accounts | app settings / user preferences |
| user-made content (posts) | user-made data |
| | game save files |

Many apps, games included, now rely mainly on **cloud** storage even for the things in the right column.

This lecture is a quick overview of the options, because 133 is a front-end class (slide 5). The back end has its own courses: databases in **CS 122A & B**, remote storage and server communication in **SWE 124**.

The motivating problem (slide 6): refresh the A4 sleep-tracking app and **every logged entry is gone**. Component variables live in memory only. To keep data you have to tell the browser or the app to store it somewhere.

## 2. Storage options for WebView apps

A WebView app (an Ionic/Capacitor app, [Lecture 12](lec-12.en-US.md)) can use storage from the **browser** *or* from the **mobile device** (slide 7):

- browser storage (cookies, web storage) — [Section 3](#3-browser-storage-cookies-and-web-storage)
- app Preferences — [Section 4](#4-app-preferences)
- IndexedDB — [Section 5](#5-indexeddb)
- a device relational database — [Section 6](#6-device-relational-storage)
- a remote database — [Section 7](#7-remote-vs-local-storage)

The comparison of all five is in the [Quick Reference](#10-quick-reference--top-5-things-to-remember).

> 🔗 **Go deeper**: [MDN: Storage quotas and eviction criteria](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria) · [Capacitor: Storage guide](https://capacitorjs.com/docs/guides/storage) · [Ionic: Angular storage](https://ionicframework.com/docs/angular/storage)

## 3. Browser storage: cookies and web storage

**Cookies** (slide 8):

- small pieces of data sent back and forth between the browser and a server;
- used to maintain a **session**;
- **tiny** — not a place for app data.

**Web storage** (slide 9) is the browser's local storage:

- **web only**;
- **synchronous**, so it doesn't scale well — every read and write blocks;
- browsers do **not** recommend it for significant amounts of data;
- no popular Ionic/Capacitor plugins wrap it.

> ⚠️ **Pitfall**: neither is the answer for app data in this course. Cookies are for sessions; web storage is synchronous, web-only, and has no Ionic/Capacitor plugin. Both are the wrong options in the [in-class questions](#9-in-class-questions--demos-with-solutions).

> 🔗 **Go deeper**: [MDN: Using HTTP cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Cookies) · [MDN: Web Storage API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API)

## 4. App Preferences

App preferences (slide 10):

- intended for **small amounts of data** — app settings like language or dark/light mode;
- **permanent**;
- **unencrypted**;
- **synchronous**, so it doesn't scale well;
- in Ionic: the **Capacitor Preferences** plugin (`@capacitor/preferences`). It only stores **strings** (iOS supports all basic types, but don't count on it).

It's a key–value store. The demo app (slide 24) saves the user's name with it. The three calls, from `home.page.ts` (solution):

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

Every call returns a Promise, so use `await` or `.then()`. A key that was never saved comes back as `{ value: null }`, which is why the code checks `if(resultName.value)` before using it.

Running the built demo in Chromium: before anything is saved the console prints `name: null`; after typing "Kazuha" and pressing Save, the page's `localStorage` holds `{"CapacitorStorage.name":"Kazuha"}`, and after a reload the console prints `name: Kazuha` then `Kazuha not null` and the welcome screen comes back. So in the browser the plugin is backed by web storage, under a `CapacitorStorage.` key prefix.

> 💡 **Key Insight**: Preferences stores strings by key. To keep a number, a list or an object, convert it to a string yourself (and back when loading) — or pick a store built for structured data ([Section 5](#5-indexeddb)).

The whole app runs interactively at the end of [Section 5](#5-indexeddb).

> 🧪 **Demo files**: [solution/…/home.page.ts](https://github.com/travislindenreid/INF33-Demos/blob/main/W8_L2_Databases/solution/DatabaseExamples/src/app/home/home.page.ts) · [package.json](https://github.com/travislindenreid/INF33-Demos/blob/main/W8_L2_Databases/solution/DatabaseExamples/package.json)

> 📝 **Practice**: [Demo 1](#93-demo-1-save-a-name-with-preferences-and-a-season-with-indexeddb-slide-24--setup--solution)

> 🔗 **Go deeper**: [Capacitor Preferences plugin README](https://github.com/ionic-team/capacitor-plugins/blob/main/preferences/README.md) · [Capacitor: Storage guide](https://capacitorjs.com/docs/guides/storage)

## 5. IndexedDB

### 5.1 What it is

**IndexedDB** (slide 11):

- proposed in 2015, standardized in 2021;
- **native database support in browsers**;
- pretty good compatibility these days — the slide's caniuse table shows full support in current Chrome, Edge, Safari, Firefox, Opera, Chrome for Android, Safari on iOS and Samsung Internet; only IE 10–11 have partial support.

Its properties (slide 12):

- **implemented by the browser**;
- **not permanent** on the device — iOS might clean it up without warning, for space or privacy reasons;
- Angular: `ngx-indexed-db` — sadly not compatible with the most recent Angular version;
- Ionic: **`ionic-storage`** — hasn't been updated in a few years, but still works. This is what the demo uses.

So what database advantages does it really give you (slide 13)? Mainly **some structure and organization**, and a simpler API for demo purposes; other classes go into more depth. The slide quotes Ionic's data-storage guide on IndexedDB:

| Pros | Cons |
|---|---|
| Free | Data loss due to the OS reclaiming space |
| Available in browser | No support for encryption |
| Query support | Limited storage capacity |
| | Difficult data export |

> 🔗 **Go deeper**: [caniuse: IndexedDB](https://caniuse.com/?search=indexeddb) · [MDN: IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) · [GitHub: ionic-storage](https://github.com/ionic-team/ionic-storage) · [Ionic Enterprise Guide: Data storage](https://ionic.io/enterprise-guide/data-storage)

### 5.2 Using ionic-storage in the demo app

The demo saves the user's favourite season in IndexedDB. Three pieces, all already in the `setup` project.

**1. Register the storage module** (`main.ts`) — database name and which drivers to try, IndexedDB first, web storage as fallback:

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

**2. Wrap it in a service** (`services/storage.ts`, an Angular service as in [Lecture 11](lec-11.en-US.md)). `storage.create()` opens the database once; every method waits for it first:

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

**3. Inject the service and call it** (`home.page.ts`, solution). Unlike Preferences, `set` takes any value, not just strings:

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

The season comes from an `ion-picker` ([Lecture 13](lec-13.en-US.md)) whose `(ionChange)` calls `onIonChange($event)`; `setDecorativeText()` picks the emoji for the season.

In Chromium, after picking Fall the browser has an IndexedDB database `__mydb` with object store `_ionickv` holding key `season` → `"Fall"`. A reload prints `found season value: Fall` and `VALID season value: Fall`. **Reset data** empties both stores (`localStorage` becomes `{}`, `_ionickv` has no keys) and the next load prints `name: null` and `found season value: null`.

### 5.3 The view doesn't show the loaded season

One real bug in the solution: after the reload above, the console says the season is Fall, but the screen shows **"Welcome, Kazuha!" with no emoji and the picker on Spring**. `pickerValue` and `decorativeText` are plain fields set **after an `await`**, so nothing refreshes the view (the rule from [Lecture 15](lec-15.en-US.md#5-signals)). The name shows only because `namedSaved` is a signal. Picking a season works because a user event refreshes the view.

Fix: make both fields signals and set them with `.set()`:

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

With that change, the reloaded app shows Fall and 🍂🍁🎃. (The file itself asks the matching question: *"why is namedSaved a signal, but not nameKey?"* — `nameKey` never changes, so the view never needs telling.)

Try it below: type a name and Save, pick a season, then press **Reload app** (the stand-in "disk" keeps the data, like real storage). Next runs the reload scenario automatically, then applies the fix:

```viz web-demo
{"title": "Slide 24 demo (setup → solution) re-created with Ionic web components; Preferences, ionic-storage and signal() are stand-ins", "width": 375, "height": 520, "html": "<link rel=\"stylesheet\" href=\"https://cdn.jsdelivr.net/npm/@ionic/core@8.8.19/css/ionic.bundle.css\">\n<script type=\"module\" src=\"https://cdn.jsdelivr.net/npm/@ionic/core@8.8.19/dist/ionic/ionic.esm.js\"></script>\n<ion-app>\n<ion-header><ion-toolbar><ion-title>Data Saving Demo</ion-title></ion-toolbar></ion-header>\n<ion-content>\n  <div id=\"container\"></div>\n</ion-content>\n<ion-footer><ion-toolbar><ion-button id=\"reload\" fill=\"outline\" expand=\"block\">⟳ Reload app (data on \"disk\" stays)</ion-button></ion-toolbar></ion-footer>\n</ion-app>\n", "css": "#container { text-align: center; position: absolute; left: 0; right: 0; top: 50%; transform: translateY(-50%); }\n", "js": "// ---- Stand-ins (the sandbox has no Angular, Capacitor or ionic-storage) ----\n// \"disk\" survives the Reload button, like real storage survives a refresh.\nconst disk = { prefs: new Map(), idb: new Map() };\nconst Preferences = {   // @capacitor/preferences: strings, get() resolves to { value: string | null }\n  get: async ({ key }) => ({ value: disk.prefs.has(key) ? disk.prefs.get(key) : null }),\n  set: async ({ key, value }) => { disk.prefs.set(key, value); },\n  remove: async ({ key }) => { disk.prefs.delete(key); }\n};\nconst storageService = {  // services/storage.ts on top of ionic-storage (IndexedDB opens a bit later)\n  get: (key) => new Promise(r => setTimeout(() => r(disk.idb.has(key) ? disk.idb.get(key) : null), 50)),\n  set: async (key, value) => { disk.idb.set(key, value); },\n  reset: async () => { disk.idb.clear(); }\n};\n// A tiny signal(): read with s(), write with s.set(v); set() refreshes the view.\nfunction signal(value) { const s = () => value; s.set = (v) => { value = v; render(); }; return s; }\n\n// ---- home.page.ts (solution) ----\nclass HomePage {\n  namedSaved = signal(false);\n  nameKey = \"name\";\n  name = \"\";\n  pickerValue = \"Spring\";\n  decorativeText = \"\";\n  springText = '\\u{1F326}\\u{1F490}\\u{1F430}';\n  summerText = '\\u{1F33B}\\u{1F31E}\\u{1F30A}';\n  fallText = '\\u{1F342}\\u{1F341}\\u{1F383}';\n  winterText = '\\u{2744}\\u{1F384}\\u{26C4}';\n  seasonKey = \"season\";\n\n  constructor(storage) {\n    this.storage = storage;\n    Preferences.get({ key: this.nameKey }).then((resultName) => {\n      console.log(`name: ${resultName.value}`);\n      if (resultName.value) {\n        this.name = String(resultName.value);\n        this.namedSaved.set(true);\n      }\n    });\n    this.init();\n  }\n  async init() {\n    let val = await this.storage.get(this.seasonKey);\n    console.log(\"found season value: \" + val);\n    if (val) {\n      this.pickerValue = val;      // plain field: nothing refreshes the view here\n      this.setDecorativeText();\n    }\n  }\n  async saveName() {\n    await Preferences.set({ key: 'name', value: this.name });\n    this.namedSaved.set(true);\n  }\n  async clearData() {\n    await Preferences.remove({ key: this.nameKey });\n    this.namedSaved.set(false);\n    this.name = \"\";\n    this.storage.reset();\n  }\n  onIonChange(event) {\n    this.pickerValue = event.detail.value;\n    this.setDecorativeText();\n    this.storage.set(this.seasonKey, this.pickerValue);\n  }\n  setDecorativeText() {\n    switch (this.pickerValue) {\n      case \"Spring\": this.decorativeText = this.springText; break;\n      case \"Summer\": this.decorativeText = this.summerText; break;\n      case \"Fall\": this.decorativeText = this.fallText; break;\n      case \"Winter\": this.decorativeText = this.winterText; break;\n    }\n  }\n}\n\n// ---- home.page.html: @if(namedSaved()) { welcome + picker + reset } @else { input + save } ----\n// An event handler refreshes the view when it returns (like Angular); an await inside it doesn't.\nlet page;\nfunction on(el, ev, fn) { el.addEventListener(ev, (e) => { fn(e); render(); }); return el; }\nfunction el(tag, attrs = {}, text = \"\") { const e = document.createElement(tag); for (const k in attrs) e.setAttribute(k, attrs[k]); e.textContent = text; return e; }\nfunction render() {\n  const c = document.getElementById('container');\n  c.innerHTML = '';\n  if (page.namedSaved()) {\n    c.append(el('ion-item', {}, `Welcome, ${page.name}! ${page.decorativeText}`), el('ion-item', {}, 'Your favorite season:'));\n    const col = el('ion-picker-column', { value: page.pickerValue });\n    for (const s of [\"Spring\", \"Summer\", \"Fall\", \"Winter\"]) col.append(el('ion-picker-column-option', { value: s }, s));\n    on(col, 'ionChange', (e) => page.onIonChange(e));\n    const picker = el('ion-picker'); picker.append(col); c.append(picker);\n    c.append(on(el('ion-button', {}, 'Reset data'), 'click', () => page.clearData()));\n  } else {\n    const input = el('ion-input', { placeholder: 'Enter your name' });\n    input.value = page.name;\n    on(input, 'ionInput', (e) => { page.name = e.target.value; });\n    c.append(el('ion-item'), on(el('ion-button', {}, 'Save'), 'click', () => page.saveName()));\n    c.firstChild.append(input);\n  }\n}\nfunction startApp() { console.log('--- app start ---'); page = new HomePage(storageService); render(); }\ndocument.getElementById('reload').addEventListener('click', startApp);\nstartApp();\n", "steps": [{"note": "Scripted: save the name Peter, pick Fall, reload. The console shows the season was loaded, but the view still shows Spring and no emoji (pickerValue is a plain field).", "js": "\n// ---- Scripted: save the name \"Peter\", pick Fall, then reload the app ----\nsetTimeout(async () => {\n  page.name = \"Peter\"; await page.saveName();\n  page.onIonChange({ detail: { value: \"Fall\" } }); render();\n  startApp();\n}, 300);\n"}, {"note": "Fix: make pickerValue and decorativeText signals, so setting them after the async IndexedDB read refreshes the view: after the reload, Fall and the emoji appear.", "js": "\n// ---- Fix: pickerValue and decorativeText as signals ----\n// In the app: pickerValue = signal<string>(\"Spring\"); ... this.pickerValue.set(val);\n// Here: the same effect, a refresh after the async load.\nHomePage.prototype.init = async function () {\n  let val = await this.storage.get(this.seasonKey);\n  console.log(\"found season value: \" + val);\n  if (val) {\n    this.pickerValue = val;\n    this.setDecorativeText();\n    render();   // what pickerValue.set(val) / decorativeText.set(...) trigger\n  }\n};\n"}], "interactive": true}
```

> ⚠️ **Pitfall**: storage reads are async. Anything you assign from them after an `await` (or in a `.then()`) must be a signal, or the screen keeps the old value even though the console shows the new one.

> 🧪 **Demo files**: [main.ts](https://github.com/travislindenreid/INF33-Demos/blob/main/W8_L2_Databases/solution/DatabaseExamples/src/main.ts) · [services/storage.ts](https://github.com/travislindenreid/INF33-Demos/blob/main/W8_L2_Databases/solution/DatabaseExamples/src/app/services/storage.ts) · [solution/…/home.page.ts](https://github.com/travislindenreid/INF33-Demos/blob/main/W8_L2_Databases/solution/DatabaseExamples/src/app/home/home.page.ts) · [home.page.html](https://github.com/travislindenreid/INF33-Demos/blob/main/W8_L2_Databases/solution/DatabaseExamples/src/app/home/home.page.html)

> 📝 **Practice**: [Demo 1](#93-demo-1-save-a-name-with-preferences-and-a-season-with-indexeddb-slide-24--setup--solution)

## 6. Device relational storage

A relational database on the device itself (slide 14):

- **permanent**;
- **performant**;
- relational = great for **high volumes of complex data**;
- **not implemented by the browser but by the device** — so for a WebView app it's **only available on mobile**;
- Ionic options: Capacitor's **Enterprise (paid) SQLite** plugin, or the **Capacitor community SQLite** plugin (which also works on the web by using IndexedDB underneath).

> 💡 **Key Insight**: IndexedDB is the browser's database and can be wiped by the OS; device relational storage is the phone's database and stays. That difference decides the [game-save question](#91-question-1-best-storage-for-a-mobile-games-save-file-slides-1720).

## 7. Remote vs. local storage

Questions to ask before choosing (slide 15):

- Who needs access to the data — just the user, or others?
- As a developer, do **you** need access?
- Is the data sensitive?
- Is the data valuable enough that it must not be lost?

Remote databases are crucial when **more than the local device** needs the data (slide 16):

- **cross-device apps**: facebook.com and the Facebook mobile app both need your profile information;
- **developers**: to understand habits across users or to provide a data-driven service;
- **social media**: to share user-generated content across users.

On the other hand, **some privacy can be preserved if data is only stored locally**. Which to use depends on the type of data and the context.

## 8. Building A4

A4 has three big tasks (slides 25–26):

- build an interface with Ionic components ([Lecture 13](lec-13.en-US.md));
- generate your own pages and components, and use the router for page navigation;
- use a plugin for a native device resource ([Lecture 15](lec-15.en-US.md)) or for storage (this lecture).

Recommended plan: **tackle them from hardest to easiest**.

| Difficulty | Task |
|---|---|
| Hardest | get the device resource / storage working |
| Medium | generate two pages, configure the router, make a link |
| Easy | build the interface with Ionic components to make the app's features |

## 9. In-class Questions & Demos (with Solutions)

### 9.1 Question 1: Best storage for a mobile game's save file (slides 17–20)

Which of these is the best storage option for a mobile game's save file?

- A. Preferences
- B. Device relational storage
- C. Cookies
- D. IndexedDB
- E. Web storage

<details>
<summary>Answer</summary>

**Answer: B — device relational storage** (the slides don't reveal the result for this question; this follows from slides 10–14).

- **B**: a save file is valuable user-made data on a mobile app, and device storage is permanent, performant and made for complex data. Being mobile-only doesn't matter for a mobile game.
- **A** is wrong: Preferences is for small settings, strings only, synchronous.
- **C** is wrong: cookies are tiny and for sessions.
- **D** is the trap: it works, but it's "not permanent on device" — iOS may clear it without warning, and losing a save file is the worst outcome.
- **E** is wrong: web only, synchronous, not recommended for significant data.

(Slide 4's caveat applies: many games now keep saves in the cloud instead.)

</details>

Back to [Section 6](#6-device-relational-storage).

### 9.2 Question 2: Best storage for A4's sleep tracking data (slides 21–23)

Which of these is the best storage option for A4's sleep tracking data?

- A. Preferences
- B. Device relational storage
- C. Cookies
- D. IndexedDB
- E. Web storage

<details>
<summary>Answer</summary>

**Answer: A, B or D** — slide 23 highlights all three.

- **A, Preferences**: permanent and simple; a small log can be stored as a string.
- **B, device relational storage**: permanent and built for growing structured data — but only on a phone, not in `ionic serve`.
- **D, IndexedDB** (ionic-storage): works in the browser and on the device, and stores structured values directly.
- **C** and **E** are out for the same reasons as in Question 1: cookies are tiny session data, and web storage is web-only with no Ionic/Capacitor plugin.

</details>

Back to [Section 2](#2-storage-options-for-webview-apps).

### 9.3 Demo 1: Save a name with Preferences and a season with IndexedDB (slide 24 · setup → solution)

**Task.** `setup` is an Ionic + Angular app ("Data Saving Demo") with the template, `main.ts` storage config and `StorageService` already done. The page asks for a name; once saved, it says "Welcome, name!" and offers a season picker and a **Reset data** button. Fill in the five TODOs in `home.page.ts` so both values survive a reload:

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
<summary>Answer</summary>

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

Console for first load → save "Kazuha" → pick Fall → reload:

```text
name: null
found season value: null
saved name: Kazuha
name: Kazuha
Kazuha not null
found season value: Fall
VALID season value: Fall
```

Key points:

- `Preferences.get` resolves to `{ value: string | null }` — check for `null` before using it;
- `namedSaved.set(true)` after the async load switches the template's `@if` to the welcome screen;
- the season is saved on every `ionChange` and loaded in `init()`;
- `pickerValue` and `decorativeText` should also be signals: as written, the reloaded season doesn't appear on screen ([Section 5.3](#53-the-view-doesnt-show-the-loaded-season), with the interactive version).

</details>

> 🧪 **Demo files**: [setup/…/home.page.ts](https://github.com/travislindenreid/INF33-Demos/blob/main/W8_L2_Databases/setup/DatabaseExamples/src/app/home/home.page.ts) · [solution/…/home.page.ts](https://github.com/travislindenreid/INF33-Demos/blob/main/W8_L2_Databases/solution/DatabaseExamples/src/app/home/home.page.ts) · [home.page.html](https://github.com/travislindenreid/INF33-Demos/blob/main/W8_L2_Databases/solution/DatabaseExamples/src/app/home/home.page.html)

Back to [Section 4](#4-app-preferences) · [Section 5](#5-indexeddb).

## 10. Quick Reference & Top 5 Things to Remember

**Storage options for a WebView app**

| Option | Implemented by | Permanent? | Good for | Ionic/Capacitor |
|---|---|---|---|---|
| Cookies | browser | — | session state (tiny) | — |
| Web storage | browser | — | not recommended for significant data; synchronous, web only | no popular plugin |
| Preferences | device (web storage in a browser) | yes, unencrypted | small settings: language, dark mode; strings only; synchronous | `@capacitor/preferences` |
| IndexedDB | browser | no — iOS may clear it | some structure; free, in the browser, queries | `ionic-storage` (`@ionic/storage-angular`) |
| Device relational (SQLite) | device | yes | high volumes of complex data; performant; mobile only | Enterprise SQLite (paid), community SQLite |
| Remote database | server | yes | cross-device, developer access, sharing between users | back end (CS 122A/B, SWE 124) |

**API calls from the demo**

| Store | Save | Load | Delete |
|---|---|---|---|
| Preferences | `await Preferences.set({ key, value })` | `Preferences.get({ key })` → `{ value: string \| null }` | `Preferences.remove({ key })` |
| ionic-storage | `storage.set(key, value)` | `await storage.get(key)` | `storage.clear()` (all keys) |

Setup for ionic-storage: `IonicStorageModule.forRoot({ name, driverOrder: [Drivers.IndexedDB, Drivers.LocalStorage] })` in `main.ts`, then `await storage.create()` once before use (the demo's `StorageService`).

**Top 5 things to remember**

1. Component variables vanish on refresh; data you want to keep must be stored explicitly.
2. Preferences = small, permanent, string-only settings; IndexedDB = structured, in the browser, but **not permanent** (iOS may clear it).
3. Device relational storage is the permanent, performant choice for lots of complex data, but in a WebView app it exists only on mobile.
4. Cookies and web storage are the wrong answers for app data: cookies are tiny session data; web storage is synchronous, web-only and plugin-less.
5. Storage calls are async: set anything loaded from storage through a **signal**, or the view won't show it.
