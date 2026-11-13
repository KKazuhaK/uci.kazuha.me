---
title: "Ionic Components"
summary: "Ionic setup and ionic serve, importing standalone Ionic components, structural components, items and buttons, icons, badges and avatars, inputs with ngModel, lists and cards, modal dialogs (toast, alert, action sheet), modal pages with componentProps and onDidDismiss, and routing between pages."
---

# IN4MATX 133: User Interface Software — Lecture 13: Ionic Components

## Table of Contents

- [1. Setting up and serving an Ionic app](#1-setting-up-and-serving-an-ionic-app)
- [2. Ionic components and how to import them](#2-ionic-components-and-how-to-import-them)
- [3. Structural components: content, header, footer](#3-structural-components-content-header-footer)
- [4. Items and buttons](#4-items-and-buttons)
- [5. Icons, badges and avatars](#5-icons-badges-and-avatars)
- [6. Inputs](#6-inputs)
- [7. Lists and cards](#7-lists-and-cards)
- [8. Modal dialogs: toast, alert, action sheet](#8-modal-dialogs-toast-alert-action-sheet)
- [9. Modal pages](#9-modal-pages)
- [10. Routing](#10-routing)
- [11. In-class Questions & Demos (with Solutions)](#11-in-class-questions--demos-with-solutions)
- [12. Quick Reference & Top 5 Things to Remember](#12-quick-reference--top-5-things-to-remember)

> UCI IN4MATX 133: User Interface Software — Prof. Travis Linden Reid, Fall 2026, Tuesday 11/10 (Week 7)
> Built from the Lecture 13 slides (54 pages) and the demo repo folder `W7_L1_IonicComponents` (`setup1`/`solution1`, `setup2`/`solution2`, `modalExamples`). Organized by concept, not by source.

> 📅 **Class logistics**: A3 due **Wednesday, Nov 11** at midnight.
> If you forgot to create a group, do so by the end of today — put yourself in a group even if you don't have a partner (5 minutes in class to sign up).

The live demos below load Ionic's web components straight from a CDN, **without Angular**, so they can run in the page. Ionic's components are plain custom elements, so the HTML is the same; only the Angular parts (`(click)`, `[(ngModel)]`, the `...Controller` services) are replaced by ordinary JavaScript, and each demo's title says so. They also run in iOS mode to match the slides' screenshots.

---

## 1. Setting up and serving an Ionic app

The Ionic CLI is an npm package. You install it once (globally), then use it to create a project, move into it, and generate new pages, components or classes (slide 5):

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

(The slide writes the comments as `//`; in a terminal they're `#`.)

`ionic serve` runs the app in your browser, rendered as it would appear in a browser. You can then open DevTools' device toolbar and pick a phone (the slide shows "Dimensions: iPhone 12 Pro, 390 × 844"), exactly like testing a responsive website (slide 6).

Every project in the demo folder is a standalone-component Ionic + Angular app (`"type": "angular-standalone"` in `ionic.config.json`). The parts you edit live in `src/app/`; the rest (`global.scss` importing Ionic's CSS, `theme/variables.scss`, `capacitor.config.ts`, `main.ts`, test configs) is the starter's boilerplate. `main.ts` bootstraps the app with Ionic and the router:

```ts
bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(routes, withPreloading(PreloadAllModules)),
  ],
});
```

and the root template is just `<ion-app><ion-router-outlet></ion-router-outlet></ion-app>` — the router puts the current page inside it.

> 🧪 **Demo files**: [setup1/src/main.ts](https://github.com/travislindenreid/INF33-Demos/blob/main/W7_L1_IonicComponents/setup1/src/main.ts) · [setup1/src/app/app.component.html](https://github.com/travislindenreid/INF33-Demos/blob/main/W7_L1_IonicComponents/setup1/src/app/app.component.html) · [setup1/ionic.config.json](https://github.com/travislindenreid/INF33-Demos/blob/main/W7_L1_IonicComponents/setup1/ionic.config.json)

## 2. Ionic components and how to import them

Ionic provides **Angular-style components** for interface elements that are common in mobile interfaces: lists, buttons, sliders, tabs, modal dialogs, search bars and much more (slide 7; its screenshots show a "List" of conversations with avatars and a "Range" page of sliders). The class uses Ionic 7 with Angular — the repo's projects are already on Ionic 8 (`setup`/`solution`) and Ionic 9 (`modalExamples`), and everything in this lecture works the same there.

Because the pages are standalone components, **every Ionic component you use must be imported twice**: imported from the library, then loaded into the component's `imports` array (slide 8):

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

The class name is the tag name in PascalCase: `<ion-card-title>` ↔ `IonCardTitle`. The setup file even reminds you: `//Don't forget to add imports for the new components!` — `solution1` ends up importing 14 things.

Each component has many attributes and properties, and there are more components than a lecture can cover; the documentation lists the options, and the best way to learn them is to try them out (slide 9). The lecture groups them into six types: **structural, items, icons, inputs, lists, modals** (slides 10, 14, 24, 29, 37; slide 20's copy of the list also adds "Menus", which the deck doesn't cover).

> ⚠️ **Pitfall**: Importing the class is not enough. Leave `IonList` out of `solution1`'s `imports: [...]` array (but keep the `import` line) and the build fails with `NG8001: 'ion-list' is not a known element`. Check both places.

> 🔗 **Go deeper**: [Ionic UI components](https://ionicframework.com/docs/components/) · [Ionic API reference](https://ionicframework.com/docs/api/)

## 3. Structural components: content, header, footer

Ionic's docs file these under "Content" and "Toolbars" (slide 11). There are three structural components (slide 12):

| Component | Role |
|---|---|
| `<ion-content>` | holds the page's main content (scrolls) |
| `<ion-header>` | top bar for title content |
| `<ion-footer>` | bottom bar, e.g. menu content |

Headers and footers can contain an `<ion-toolbar>` with text (`<ion-title>`) and buttons. A few other components can replace header and footer — e.g. `<ion-tabs>` for a footer of tabs leading to different pages.

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

The result: a title bar pinned at the top, the content filling the middle, and a "Footer" bar pinned at the bottom (slide 13). Try it below — edit the code and press Run:

```viz web-demo
{"title": "Structural components (slide 13) · Ionic web components, no Angular", "width": 375, "height": 320, "interactive": true, "html": "<link rel=\"stylesheet\" href=\"https://cdn.jsdelivr.net/npm/@ionic/core@8.8.19/css/ionic.bundle.css\">\n<script>window.Ionic = { config: { mode: \"ios\" } };</script>\n<script type=\"module\" src=\"https://cdn.jsdelivr.net/npm/@ionic/core@8.8.19/dist/ionic/ionic.esm.js\"></script>\n<ion-app>\n<ion-header>\n  <ion-toolbar>\n    <ion-title>My Navigation Bar</ion-title>\n  </ion-toolbar>\n</ion-header>\n<ion-content class=\"ion-padding\">\n  Content here...\n</ion-content>\n<ion-footer>\n  <ion-toolbar>\n    <ion-title>Footer</ion-title>\n  </ion-toolbar>\n</ion-footer>\n</ion-app>"}
```

> 🔗 **Go deeper**: [Ionic: ion-content](https://ionicframework.com/docs/api/content)

## 4. Items and buttons

`<ion-item>` is the most basic component (slide 15). It's essentially an HTML `<div>` that can hold text, images and other things, and it has a CSS "block" style, so each item shows up as a **row**. Lots of other components need to be inside an `<ion-item>` — e.g. `<ion-label>` puts text inside an item.

An item can also act as a button or a link, and take a color (slides 16–17):

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

**Slots** position things inside an item: `slot="start"` puts a child on the left, `slot="end"` on the right. Slide 18 uses this for thumbnails and a button:

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

`<ion-button>` takes `color`, `shape="round"`, `fill="outline"`, `expand="full"`, and can hold an `<ion-icon>` in its own start slot (slide 19):

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

The demo shows the rows: plain, button and anchor items (the last two get a › arrow in iOS mode), a filled "Secondary Color Item" row, the thumbnail row with an outline **View** button on the right, then the secondary, round and star-icon buttons. Clicking "Button Item" logs `Button Item clicked` (the thumbnail image is an inline SVG circle, since `assets/icon/favicon.png` isn't there):

```viz web-demo
{"title": "Items and buttons (slides 17–19) · Ionic web components; (click) becomes addEventListener", "width": 375, "height": 560, "interactive": true, "html": "<link rel=\"stylesheet\" href=\"https://cdn.jsdelivr.net/npm/@ionic/core@8.8.19/css/ionic.bundle.css\">\n<script>window.Ionic = { config: { mode: \"ios\" } };</script>\n<script type=\"module\" src=\"https://cdn.jsdelivr.net/npm/@ionic/core@8.8.19/dist/ionic/ionic.esm.js\"></script>\n<ion-app>\n<ion-content>\n<!-- Default Item -->\n<ion-item>\n  <ion-label>Item</ion-label>\n</ion-item>\n<!-- Item as a Button -->\n<ion-item button id=\"btnItem\">\n  <ion-label>Button Item</ion-label>\n</ion-item>\n<!-- Item as an Anchor -->\n<ion-item href=\"#\">\n  <ion-label>Anchor Item</ion-label>\n</ion-item>\n<ion-item color=\"secondary\">\n  <ion-label>Secondary Color Item</ion-label>\n</ion-item>\n<ion-item>\n  <ion-thumbnail slot=\"start\">\n    <img src=\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Ccircle cx='20' cy='20' r='16' fill='%233880ff'/%3E%3C/svg%3E\">\n  </ion-thumbnail>\n  <ion-label>\n    <h2>H2 Title Text</h2>\n    <p>Button on right</p>\n  </ion-label>\n  <ion-button fill=\"outline\" slot=\"end\">View</ion-button>\n</ion-item>\n<ion-item>\n  <ion-button color=\"secondary\">Secondary</ion-button>\n</ion-item>\n<ion-item>\n  <ion-button shape=\"round\">Round</ion-button>\n</ion-item>\n<ion-item>\n  <ion-button>\n    <ion-icon slot=\"start\" name=\"star\"></ion-icon>\n    Left Icon\n  </ion-button>\n</ion-item>\n</ion-content>\n</ion-app>", "js": "// Angular: <ion-item (click)=\"buttonClick()\">\nfunction buttonClick() {\n  console.log('Button Item clicked');\n}\ndocument.getElementById('btnItem').addEventListener('click', buttonClick);"}
```

> ⚠️ **Pitfall**: `slot` belongs on the child (`<ion-button slot="end">`), not on the item — and the slot names are `start`/`end`, not left/right.

## 5. Icons, badges and avatars

In an Angular Ionic app, **icons require registration** (slide 21): import the icon data from `ionicons/icons` and pass it to `addIcons()` in the constructor. Only then does `<ion-icon name="heart">` find its SVG.

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

The icon names are kebab-case in HTML and camelCase in TypeScript: `solution1` registers `cartOutline` and uses `name="cart-outline"`.

Badges and icons add labels or fun flavor (slide 22):

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

**Avatars** are circular components that wrap an image or an icon; inside an `<ion-chip>` they make a small rounded "chip" with a label (slide 23; the slide's snippet ends with a stray `</ion-content>` from the page around it):

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

Below, the badges render as small colored squares with the numbers, then a heart, a moon, a moon inside a badge, a round avatar, and the "Chip Avatar" chip. (The CDN build fetches icons by name, so there's no `addIcons` here — an Angular app needs it.)

```viz web-demo
{"title": "Badges, icons, avatars, chips (slides 22–23) · Ionic web components; avatar image replaced by an inline SVG", "width": 375, "height": 430, "interactive": true, "html": "<link rel=\"stylesheet\" href=\"https://cdn.jsdelivr.net/npm/@ionic/core@8.8.19/css/ionic.bundle.css\">\n<script>window.Ionic = { config: { mode: \"ios\" } };</script>\n<script type=\"module\" src=\"https://cdn.jsdelivr.net/npm/@ionic/core@8.8.19/dist/ionic/ionic.esm.js\"></script>\n<ion-app>\n<ion-content>\n<ion-item>\n  <ion-badge color=\"primary\">11</ion-badge>\n</ion-item>\n<ion-item>\n  <ion-badge color=\"secondary\">22</ion-badge>\n</ion-item>\n<ion-item>\n  <ion-icon name=\"heart\"></ion-icon>\n</ion-item>\n<ion-item>\n  <ion-icon name=\"moon\"></ion-icon>\n</ion-item>\n<ion-item>\n  <ion-badge color=\"secondary\">\n    <ion-icon name=\"moon\"></ion-icon>\n  </ion-badge>\n</ion-item>\n<ion-item>\n  <ion-avatar>\n    <img src=\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Ccircle cx='20' cy='20' r='16' fill='%233880ff'/%3E%3C/svg%3E\" />\n  </ion-avatar>\n</ion-item>\n<ion-item>\n  <ion-chip>\n    <ion-avatar>\n      <img src=\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Ccircle cx='20' cy='20' r='16' fill='%233880ff'/%3E%3C/svg%3E\" />\n    </ion-avatar>\n    <ion-label>Chip Avatar</ion-label>\n  </ion-chip>\n</ion-item>\n</ion-content>\n</ion-app>"}
```

> ⚠️ **Pitfall**: In the repo's `modalExamples`, the action sheet uses `icon: 'trash'` and `icon: 'close'` but never calls `addIcons` — running it logs `[Ionicons Warning]: Could not load icon with name "trash"` (and `"close"`), and the sheet shows **Delete** / **Cancel** with no icons. Every icon name you use, even inside a controller's options, must be registered.

> 🔗 **Go deeper**: [Ionic: ion-icon](https://ionicframework.com/docs/api/icon) · [Ionicons (icon gallery)](https://ionic.io/ionicons)

## 6. Inputs

Ionic provides many common input fields — DateTime, Checkbox, Button, Text input and more (slide 25). For the most part they should always be in an `<ion-item>`. They're bound just as in Angular: two-way binding with `[(ngModel)]`, which comes from `FormsModule` (see [Lecture 10](lec-10.en-US.md#8-two-way-binding-with-ngmodel)) — so `FormsModule` goes into the component's `imports` too.

A date picker (slide 26):

```html
<ion-item>
  <ion-label>Date</ion-label>
  <ion-datetime display-format="MM/DD/YYYY">
  </ion-datetime>
</ion-item>
```

A text input with a placeholder (slide 27):

```html
<ion-item>
  <ion-input required type="text"
  placeholder="First Name"></ion-input>
</ion-item>
```

Checkboxes, one disabled (slide 28):

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

Slide bug: the last line opens with a curly quote `“mushrooms"` — it must be `"mushrooms"`.

`[checked]="pepperoni"` is **one-way** property binding: the box shows the variable's value, but ticking it doesn't change the variable. To read the user's choice, bind two-way: `[(ngModel)]="pepperoni"` — exactly the fix in Demo 1 and Demo 2 below.

In the demo, the checkboxes put their text inside the tag (the current Ionic style, used by the repo: `<ion-checkbox>{{item.item}}</ion-checkbox>`), and a little script plays the role of `[(ngModel)]`. Typing "Kazuha" and ticking Pepperoni logs `{ firstName: 'Kazuha', pepperoni: true, mushrooms: true }`:

```viz web-demo
{"title": "Inputs (slides 26–28) · Ionic web components; [(ngModel)] replaced by reading ionChange events", "width": 375, "height": 600, "interactive": true, "html": "<link rel=\"stylesheet\" href=\"https://cdn.jsdelivr.net/npm/@ionic/core@8.8.19/css/ionic.bundle.css\">\n<script>window.Ionic = { config: { mode: \"ios\" } };</script>\n<script type=\"module\" src=\"https://cdn.jsdelivr.net/npm/@ionic/core@8.8.19/dist/ionic/ionic.esm.js\"></script>\n<ion-app>\n<ion-content>\n<ion-item>\n  <ion-input required type=\"text\" placeholder=\"First Name\" id=\"first\"></ion-input>\n</ion-item>\n<ion-item>\n  <ion-checkbox id=\"pepperoni\">Pepperoni</ion-checkbox>\n</ion-item>\n<ion-item>\n  <ion-checkbox id=\"sausage\" disabled=\"true\">Sausage</ion-checkbox>\n</ion-item>\n<ion-item>\n  <ion-checkbox id=\"mushrooms\" checked=\"true\">Mushrooms</ion-checkbox>\n</ion-item>\n<ion-item>\n  <ion-label>Date</ion-label>\n  <ion-datetime display-format=\"MM/DD/YYYY\" presentation=\"date\"></ion-datetime>\n</ion-item>\n</ion-content>\n</ion-app>", "js": "// What [(ngModel)] does for you in Angular: keep a variable in sync with the input.\nlet pizza = { firstName: '', pepperoni: false, mushrooms: true };\ndocument.getElementById('first').addEventListener('ionInput', (e) => {\n  pizza.firstName = e.detail.value;\n  console.log(pizza);\n});\n['pepperoni', 'mushrooms'].forEach((id) => {\n  document.getElementById(id).addEventListener('ionChange', (e) => {\n    pizza[id] = e.detail.checked;\n    console.log(pizza);\n  });\n});"}
```

> ⚠️ **Pitfall**: `display-format` is from older Ionic. In the Ionic versions the repo uses, `<ion-datetime>` renders a full inline calendar (month, day grid, and a Time row unless you set `presentation="date"`) and ignores `display-format` — not the single "Date" row in the slide's screenshot.

> 🔗 **Go deeper**: [Angular: NgModel](https://angular.dev/api/forms/NgModel)

## 7. Lists and cards

`<ion-list>` displays rows of information (slide 30). It gives items some structure, and styling the list, rather than every item individually, can come in handy.

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

(Slide 31; same curly-quote bug: `slot=“start"` → `slot="start"`.)

Lists can contain tags other than `<ion-item>` (slide 32). `<ion-card>` gives a "card" layout for presenting information: a header with subtitle and title, then content — and a card can hold an `<ion-item>` too (slide 33):

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

(Curly quotes again: `name=“logo-ionic”` → `name="logo-ionic"`.)

In the demo, the first row comes out **empty**: the toggle, radio and checkbox show their text, but `<ion-input>Input</ion-input>` does not. Step 1 adds `label="Input"` and the row reads "Input":

```viz web-demo
{"title": "Lists and cards (slides 31, 33) · Ionic web components", "width": 375, "height": 470, "interactive": true, "html": "<link rel=\"stylesheet\" href=\"https://cdn.jsdelivr.net/npm/@ionic/core@8.8.19/css/ionic.bundle.css\">\n<script>window.Ionic = { config: { mode: \"ios\" } };</script>\n<script type=\"module\" src=\"https://cdn.jsdelivr.net/npm/@ionic/core@8.8.19/dist/ionic/ionic.esm.js\"></script>\n<ion-app>\n<ion-content>\n<ion-list>\n  <ion-item>\n    <ion-input>Input</ion-input>\n  </ion-item>\n  <ion-item>\n    <ion-toggle slot=\"end\">Toggle</ion-toggle>\n  </ion-item>\n  <ion-item>\n    <ion-radio slot=\"end\">Radio</ion-radio>\n  </ion-item>\n  <ion-item>\n    <ion-checkbox slot=\"start\">Checkbox</ion-checkbox>\n  </ion-item>\n</ion-list>\n<ion-list>\n  <ion-card>\n    <ion-card-header>\n      <ion-card-subtitle>Card Subtitle</ion-card-subtitle>\n      <ion-card-title>Card Title</ion-card-title>\n    </ion-card-header>\n    <ion-card-content>\n      Card content\n    </ion-card-content>\n  </ion-card>\n  <ion-card>\n    <ion-item>\n      <ion-icon name=\"logo-ionic\" slot=\"start\"></ion-icon>\n      <ion-label>ion-item in a card, icon left, button right</ion-label>\n      <ion-button fill=\"outline\" slot=\"end\">View</ion-button>\n    </ion-item>\n  </ion-card>\n</ion-list>\n</ion-content>\n</ion-app>", "steps": [{"note": "Fix for the first row: in current Ionic the text inside ion-input is not shown — give it a label attribute.", "js": "document.querySelector('ion-input').setAttribute('label', 'Input');"}]}
```

> ⚠️ **Pitfall**: In current Ionic, text between `<ion-input>` tags is not displayed. Use `<ion-input label="Input">` (or a `placeholder`). Toggle, radio and checkbox are the opposite: their label *is* the text inside the tag.

The lecture's first coding demo, a shopping list built from a list, items, checkboxes, a button and a card, comes right after this (slide 34).

> 📝 **Practice**: [Demo 1: Shopping list](#111-demo-1-shopping-list-with-lists-items-and-inputs-slide-34--setup1--solution1) · [Question 1](#112-question-1-how-confident-are-you-with-ionics-components-slides-3536)

## 8. Modal dialogs: toast, alert, action sheet

Modals are intended for **quick entry or alerts**, and appear over the app's main content (slide 38). There are two styles — **modal dialogs** (this section) and **modal pages** (next). Modals are usually triggered in the model or controller (`.ts`), not in the view (`.html`).

Each dialog type has a **controller** service: inject it in the constructor, call `create({...options})`, which returns a Promise of the dialog, then `present()` it. A toast is a short message that disappears by itself (slide 39):

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

(Curly quotes in the import: `‘@ionic/angular/standalone’` → `'@ionic/angular/standalone'`.)

An alert is a centered dialog with a header, subheader, message and buttons (slide 40):

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

An action sheet slides up from the bottom with a list of choices. Each button can have a `role` (`'destructive'` is drawn in red, `'cancel'` is placed last), an `icon`, and a `handler` that runs when it's tapped (slide 41):

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

The repo's `modalExamples` home page has exactly these three plus the modal page, behind four full-width buttons (**Send Toast, Send Alert, Send Action Sheet, Show Modal Example**), with all four controllers injected:

```ts
constructor(
  public toastController: ToastController,
  public alertController:AlertController,
  public actionSheetController:ActionSheetController,
  public modalController:ModalController
) {}
```

Running it: the toast shows "Hello, world!" at the bottom for 2 seconds; the alert shows "Alert / Subtitle / This is an alert message." with an **OK** button over a dimmed page; tapping **Delete** in the action sheet logs `Delete clicked`, **Cancel** logs `Cancel clicked`.

Try all three below. The step opens the alert for you:

```viz web-demo
{"title": "Toast, alert, action sheet (slides 39–41) · Ionic web components; the controllers' create({...}) options set as element properties", "width": 375, "height": 420, "interactive": true, "html": "<link rel=\"stylesheet\" href=\"https://cdn.jsdelivr.net/npm/@ionic/core@8.8.19/css/ionic.bundle.css\">\n<script>window.Ionic = { config: { mode: \"ios\" } };</script>\n<script type=\"module\" src=\"https://cdn.jsdelivr.net/npm/@ionic/core@8.8.19/dist/ionic/ionic.esm.js\"></script>\n<ion-app>\n<ion-content>\n<ion-button expand=\"full\" color=\"primary\" id=\"toastBtn\">Send Toast</ion-button>\n<ion-button expand=\"full\" color=\"primary\" id=\"alertBtn\">Send Alert</ion-button>\n<ion-button expand=\"full\" color=\"primary\" id=\"sheetBtn\">Send Action Sheet</ion-button>\n</ion-content>\n</ion-app>", "js": "// Angular: this.toastController.create({...}).then((toast) => toast.present());\n// Without Angular: create the element, set the same options, append it, present it.\nfunction create(tag, options) {\n  const el = Object.assign(document.createElement(tag), options);\n  el.addEventListener('didDismiss', () => el.remove());  // controllers clean up for you\n  document.body.appendChild(el);\n  return Promise.resolve(el);\n}\nfunction presentToast() {\n  create('ion-toast', { message: 'Hello, world!', duration: 2000 })\n    .then((toast) => { toast.present(); });\n}\nfunction presentAlert() {\n  create('ion-alert', {\n    header: 'Alert', subHeader: 'Subtitle',\n    message: 'This is an alert message.', buttons: ['OK']\n  }).then((alert) => { alert.present(); });\n}\nfunction presentActionSheet() {\n  create('ion-action-sheet', {\n    header: 'Albums',\n    buttons: [{\n      text: 'Delete', role: 'destructive', icon: 'trash',\n      handler: () => { console.log('Delete clicked'); }\n    }, {\n      text: 'Cancel', icon: 'close', role: 'cancel',\n      handler: () => { console.log('Cancel clicked'); }\n    }]\n  }).then((actionSheet) => { actionSheet.present(); });\n}\ndocument.getElementById('toastBtn').addEventListener('click', presentToast);\ndocument.getElementById('alertBtn').addEventListener('click', presentAlert);\ndocument.getElementById('sheetBtn').addEventListener('click', presentActionSheet);", "steps": [{"note": "Click Send Alert (scripted here).", "js": "customElements.whenDefined('ion-alert').then(() => presentAlert());"}]}
```

> 🧪 **Demo files**: [modalExamples/src/app/home/home.page.ts](https://github.com/travislindenreid/INF33-Demos/blob/main/W7_L1_IonicComponents/modalExamples/src/app/home/home.page.ts) · [home.page.html](https://github.com/travislindenreid/INF33-Demos/blob/main/W7_L1_IonicComponents/modalExamples/src/app/home/home.page.html)

> 💡 **Key Insight**: `create()` returns a Promise because the dialog is built asynchronously. Nothing appears until you call `present()` on the object it resolves to — `create()` alone shows nothing.

## 9. Modal pages

A modal page opens up **a whole new page over the current page** (slide 42). All pages are components themselves, so a modal page is a component you generate (`ionic generate page modal`). It's useful for small entry and more flexible than a dialog.

The home page creates it with `ModalController`, naming the component and passing data in with `componentProps` (slide 43):

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

(Curly quote: `‘../modal/modal-example.page'` → `'../modal/modal-example.page'`. Note this slide imports from `'@ionic/angular'` while slide 39 uses `'@ionic/angular/standalone'`; standalone pages like the repo's `setup2` import controllers from `'@ionic/angular/standalone'`.)

Each key of `componentProps` arrives in the modal page's `@Input()` with the same name. The modal page's view and controller (slide 44):

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

The repo writes `@Input() name:string = "";` — with the slide's version, strict TypeScript reports that `name` has no initializer. Running `modalExamples`, **Show Modal Example** opens a full-screen page reading "Hello, IN4MATX 133!" with a **Dismiss** button that closes it.

To **get data back**, pass it to `dismiss(...)` and listen with `onDidDismiss()` on the home page (slide 45):

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

The slide's comment is slightly off: `onDidDismiss()` resolves to a **result object**, and the string is its `data` field. The demo logs `{ data: 'Hello from modal!', role: undefined }`; use `data.data` to get `'Hello from modal!'`.

```viz web-demo
{"title": "Modal page with componentProps and onDidDismiss (slides 43–45) · Ionic web components; the modal's page is a plain element instead of an Angular component", "width": 375, "height": 360, "interactive": true, "html": "<link rel=\"stylesheet\" href=\"https://cdn.jsdelivr.net/npm/@ionic/core@8.8.19/css/ionic.bundle.css\">\n<script>window.Ionic = { config: { mode: \"ios\" } };</script>\n<script type=\"module\" src=\"https://cdn.jsdelivr.net/npm/@ionic/core@8.8.19/dist/ionic/ionic.esm.js\"></script>\n<ion-app>\n<ion-content class=\"ion-padding\">\n<ion-button id=\"open\">Open Modal Page</ion-button>\n</ion-content>\n</ion-app>", "js": "// Plays the role of ModalPage: shows {{name}} and calls dismiss(data).\nfunction makeModalPage(props) {\n  const page = document.createElement('div');\n  page.className = 'ion-page';\n  page.innerHTML = '<ion-content class=\"ion-padding\">Hello, <b class=\"name\"></b>!' +\n    ' <ion-button id=\"dismiss\">Dismiss</ion-button></ion-content>';\n  page.querySelector('.name').textContent = props.name;        // componentProps\n  page.querySelector('#dismiss').addEventListener('click', () => {\n    page.closest('ion-modal').dismiss('Hello from modal!');     // dismiss(data)\n  });\n  return page;\n}\nfunction presentModal() {\n  const modal = document.createElement('ion-modal');\n  modal.appendChild(makeModalPage({ name: 'IN4MATX 133' }));\n  document.body.appendChild(modal);\n  modal.present();\n  modal.onDidDismiss().then((data) => {\n    console.log(data);   // the whole result object, not just the string\n    modal.remove();\n  });\n}\ndocument.getElementById('open').addEventListener('click', presentModal);", "steps": [{"note": "Open the modal (scripted here).", "js": "customElements.whenDefined('ion-modal').then(() => presentModal());"}, {"note": "Press Dismiss: onDidDismiss resolves and the home page logs the result.", "js": "setTimeout(() => document.querySelector('#dismiss').click(), 600);"}]}
```

> 🧪 **Demo files**: [modalExamples/src/app/modal-example/modal-example.page.ts](https://github.com/travislindenreid/INF33-Demos/blob/main/W7_L1_IonicComponents/modalExamples/src/app/modal-example/modal-example.page.ts) · [modal-example.page.html](https://github.com/travislindenreid/INF33-Demos/blob/main/W7_L1_IonicComponents/modalExamples/src/app/modal-example/modal-example.page.html)

> ⚠️ **Pitfall**: `<ion-content padding>` (slide 44 and the repo) is old Ionic syntax and adds no padding in current versions — in `modalExamples` "Hello, IN4MATX 133!" sits flush against the top-left corner. Use `<ion-content class="ion-padding">`.

> 📝 **Practice**: [Demo 2: Modals](#113-demo-2-adding-alerts-and-a-modal-page-to-the-shopping-list-slide-46--setup2--solution2) · [Question 2](#114-question-2-how-confident-are-you-with-ionics-components-slides-4748)

## 10. Routing

Like in Angular, `app.routes.ts` defines URL routes — but there's no browser bar in your app, so the user moves between pages through buttons and links (slide 50). The slide's routes table:

```ts
const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'page2',loadChildren:()=> import(‘./page2/page2.module’).then(m => m.Page2Module)}
];
```

The `page2` route is **lazy loading**: its code is only loaded when the page opens. (Curly quotes again: `import('./page2/page2.module')`.) That `loadChildren` + module form is the older NgModule style; the standalone repo projects lazy-load components with `loadComponent` (from `setup2/src/app/app.routes.ts`):

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

`ionic generate page modal` adds that last route for you. (Compare [Lecture 11's routes table](lec-11.en-US.md#41-the-routes-table).)

To navigate, define an `href` attribute on an Ionic button (slide 51):

```html
<ion-content padding >
  <ion-button href="page2">Go to page 2</ion-button>
</ion-content>
```

Ionic also has additional methods for navigating the page history — going back to a previous page, and non-linear navigation that breaks the typical undo/redo cycle. That's largely outside this class's scope, but interesting to look into (slide 52).

> 🧪 **Demo files**: [setup2/src/app/app.routes.ts](https://github.com/travislindenreid/INF33-Demos/blob/main/W7_L1_IonicComponents/setup2/src/app/app.routes.ts)

> 🔗 **Go deeper**: [Ionic: Angular navigation](https://ionicframework.com/docs/angular/navigation)

## 11. In-class Questions & Demos (with Solutions)

Both polls are confidence checks with no correct option, and the slides show 0% on every bar (no results revealed). Both coding demos use the same "My Shopping List" app; the solutions were built and run in Chromium for the outputs below.

### 11.1 Demo 1: Shopping list with lists, items, and inputs (slide 34 · setup1 → solution1)

Slide 34 shows the target: "My Shopping List" with checkbox rows Broccoli, Bread, Orange Juice (ticked), Apples, and a **Check Out** button. `setup1/src/app/home/home.page.ts` already has the data and `checkOut()`:

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

The task is the TODO comments in `home.page.html`:

```html
<!--Display the shopping list in an <ion-list> using <ion-checkbox>-->
<!--Bind the checkbox values to each item's inCart value-->
<!--Create an <ion-button> and bind it to the checkOut() function-->
<!--Display an <ion-card> after an item was purchased-->
<!--In the card, show a shopping report of each item purchased with the "cart" icon-->
```

plus `//Don't forget to add imports for the new components!` in the `.ts`.

<details>
<summary>Answer</summary>

`home.page.html` (from `solution1`):

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

`home.page.ts` changes: import and load every new component, `FormsModule` for `ngModel`, and register the cart icon:

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

(`solution1` also adds `console.log(item)` inside the first `filter` and `console.log(boughtItems)`, and moves `this.shoppingList = unboughtItems;` to the end — behaviour is the same.)

What happens: ticking Broccoli and pressing **Check Out** logs the four items (Broccoli and Orange Juice now with `inCart: true`), leaves **Bread, Apples** in the list, and shows a "Shopping Report" card with a cart icon next to **Broccoli** and **Orange Juice**. Ticking Bread and checking out again adds **Bread** to the report and leaves only Apples.

The key reasons: `[(ngModel)]` writes the tick back into `item.inCart` (with `[checked]` the list would never change); `@if` hides the card until `itemsPurchased` has something; and `checkOut()` replaces `shoppingList`, so `@for` re-renders the shorter list.

The same app re-created with Ionic's web components (no Angular); the step ticks Broccoli and checks out, logging `[ 'Broccoli', 'Orange Juice' ]`:

```viz web-demo
{"title": "Demo 1 check: the solution1 shopping list re-created with Ionic web components (no Angular)", "width": 375, "height": 560, "html": "<link rel=\"stylesheet\" href=\"https://cdn.jsdelivr.net/npm/@ionic/core@8.8.19/css/ionic.bundle.css\">\n<script>window.Ionic = { config: { mode: \"ios\" } };</script>\n<script type=\"module\" src=\"https://cdn.jsdelivr.net/npm/@ionic/core@8.8.19/dist/ionic/ionic.esm.js\"></script>\n<ion-app>\n<ion-header>\n  <ion-toolbar><ion-title>My Shopping List</ion-title></ion-toolbar>\n</ion-header>\n<ion-content>\n  <ion-list id=\"list\"></ion-list>\n  <ion-button id=\"checkout\">Check Out</ion-button>\n  <ion-card id=\"report\" hidden>\n    <ion-card-header><ion-card-title>Shopping Report</ion-card-title></ion-card-header>\n    <ion-card-content id=\"bought\"></ion-card-content>\n  </ion-card>\n</ion-content>\n</ion-app>", "js": "let shoppingList = [\n  {'item':'Broccoli', 'inCart':false},\n  {'item':'Bread', 'inCart':false},\n  {'item':'Orange Juice', 'inCart':true},\n  {'item':'Apples', 'inCart':false}\n];\nlet itemsPurchased = [];\nfunction render() {   // what @for / @if do in the template\n  const list = document.getElementById('list');\n  list.innerHTML = '';\n  shoppingList.forEach((item) => {\n    const row = document.createElement('ion-item');\n    const box = document.createElement('ion-checkbox');\n    box.textContent = item.item;\n    box.checked = item.inCart;\n    box.addEventListener('ionChange', (e) => { item.inCart = e.detail.checked; });  // [(ngModel)]\n    row.appendChild(box);\n    list.appendChild(row);\n  });\n  document.getElementById('report').hidden = itemsPurchased.length == 0;\n  document.getElementById('bought').innerHTML = itemsPurchased.map((i) =>\n    '<ion-item><ion-icon name=\"cart-outline\"></ion-icon><ion-label>' + i + '</ion-label></ion-item>').join('');\n}\nfunction checkOut() {\n  var boughtItems = shoppingList.filter((item) => item.inCart);\n  var unboughtItems = shoppingList.filter((item) => !item.inCart);\n  console.log(boughtItems.map((i) => i.item));\n  boughtItems.forEach((item) => { itemsPurchased.push(item.item); });\n  shoppingList = unboughtItems;\n  render();\n}\ndocument.getElementById('checkout').addEventListener('click', checkOut);\nrender();", "steps": [{"note": "Tick Broccoli, then press Check Out (scripted).", "js": "setTimeout(() => { shoppingList[0].inCart = true; checkOut(); }, 800);"}]}
```

</details>

> 🧪 **Demo files**: [setup1/src/app/home/home.page.html](https://github.com/travislindenreid/INF33-Demos/blob/main/W7_L1_IonicComponents/setup1/src/app/home/home.page.html) · [setup1/…/home.page.ts](https://github.com/travislindenreid/INF33-Demos/blob/main/W7_L1_IonicComponents/setup1/src/app/home/home.page.ts) · [solution1/…/home.page.html](https://github.com/travislindenreid/INF33-Demos/blob/main/W7_L1_IonicComponents/solution1/src/app/home/home.page.html) · [solution1/…/home.page.ts](https://github.com/travislindenreid/INF33-Demos/blob/main/W7_L1_IonicComponents/solution1/src/app/home/home.page.ts)

Back to [Section 7](#7-lists-and-cards).

### 11.2 Question 1: How confident are you with Ionic's components? (slides 35–36)

*So far, how confident are you that you'll be able to use Ionic's components?*

- A. I have a lot of questions about how to use them
- B. I have a few questions about how to use them
- C. I'm still digesting the information, check in again later
- D. I think I can figure it out once I start
- E. I'm confident I'll be able to use them

<details>
<summary>Answer</summary>

A self-assessment poll — there is no correct answer. If you picked A–C, the fastest check is whether you can explain Demo 1's three moves: an `<ion-list>` of `<ion-item>` rows built with `@for`, a checkbox bound with `[(ngModel)]` (plus `FormsModule`), and every component imported *and* listed in `imports`.

</details>

Back to [Section 7](#7-lists-and-cards).

### 11.3 Demo 2: Adding alerts and a modal page to the shopping list (slide 46 · setup2 → solution2)

Slide 46 shows the shopping list with three buttons: **Add Item**, **Delete Item(s)**, **Check Out**. `setup2` already has the list and buttons, `AlertController` and `ModalController` injected, a generated `modal` page with a "Checked out!" toolbar and the Shopping Report card, and these TODOs:

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

and in the modal page: `//TODO: use the modal controller to dismiss this page` in `dismiss()`, and `<!--TODO: add dismiss button in an <ion-buttons> and bind it to dismiss() function-->` in its toolbar. The checkbox in `setup2` is bound with `[checked]="item.inCart"`.

<details>
<summary>Answer</summary>

**Add Item** — an alert with a text input. The `Ok` handler receives the inputs' values keyed by `name`:

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

Typing "Milk" and pressing Ok logs `{item: 'Milk'}` and adds a Milk row.

**Delete Item(s)** — build one checkbox input per item with `map`, then filter out the checked ones. For checkbox inputs the handler receives an **array** of the checked values:

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

Ticking Bread and pressing Ok logs `['Bread']` and removes it.

**Check Out** — after computing `itemsPurchased`, open the modal page and pass the list in through `componentProps` (it lands in the page's `@Input() itemsPurchased`):

```ts
this.modalController.create({
  component: ModalPage,
  componentProps: { itemsPurchased: itemsPurchased }
}).then((modal) => {
  modal.present();
});
```

with `import { ModalPage } from '../modal/modal.page';`. The modal page's `dismiss()`:

```ts
dismiss() {
  this.modalController.dismiss({
    'dismissed': true
  });
}
```

Also: the checkbox becomes `[(ngModel)]="item.inCart"` with `FormsModule` imported — with `[checked]` ticking a box never sets `inCart`, so Check Out would buy only Orange Juice. And `addItem`/`deleteItems`/`checkOut` lose their `async`, since they use `.then()`.

Run: after adding Milk, deleting Bread, ticking Milk and pressing Check Out, a full-screen "Checked out!" page shows the Shopping Report with **Orange Juice** and **Milk**, and the list underneath keeps Broccoli and Apples.

**The repo's solution misses one TODO**: `solution2`'s modal page never adds the dismiss button, so `dismiss()` is never called and the page has no way to close on a phone (Escape closes it in a desktop browser). The missing piece:

```html
<ion-toolbar>
  <ion-title>Checked out!</ion-title>
  <ion-buttons slot="end">
    <ion-button (click)="dismiss()">Dismiss</ion-button>
  </ion-buttons>
</ion-toolbar>
```

with `IonButtons` and `IonButton` added to the modal page's imports. (This last block is written for these notes; it's not in the repo.)

</details>

> 🧪 **Demo files**: [setup2/…/home.page.ts](https://github.com/travislindenreid/INF33-Demos/blob/main/W7_L1_IonicComponents/setup2/src/app/home/home.page.ts) · [setup2/…/modal.page.html](https://github.com/travislindenreid/INF33-Demos/blob/main/W7_L1_IonicComponents/setup2/src/app/modal/modal.page.html) · [solution2/…/home.page.ts](https://github.com/travislindenreid/INF33-Demos/blob/main/W7_L1_IonicComponents/solution2/src/app/home/home.page.ts) · [solution2/…/modal.page.ts](https://github.com/travislindenreid/INF33-Demos/blob/main/W7_L1_IonicComponents/solution2/src/app/modal/modal.page.ts)

Back to [Section 8](#8-modal-dialogs-toast-alert-action-sheet) · [Section 9](#9-modal-pages).

### 11.4 Question 2: How confident are you with Ionic's components? (slides 47–48)

*How confident are you that you'll be able to use Ionic's components?* — the same five options as [Question 1](#112-question-1-how-confident-are-you-with-ionics-components-slides-3536), asked again after the modal demo.

<details>
<summary>Answer</summary>

Again no correct answer. The new skills to check yourself on: create → present a dialog from the `.ts` file, read an alert's input values in a button `handler`, and pass data into a modal page with `componentProps` (and back out with `dismiss(data)` + `onDidDismiss()`).

</details>

Back to [Section 9](#9-modal-pages).

## 12. Quick Reference & Top 5 Things to Remember

**Components**

| Type | Tags | Notes |
|---|---|---|
| Structural | `ion-header`, `ion-content`, `ion-footer`, `ion-toolbar`, `ion-title`, `ion-tabs` | toolbar inside header/footer |
| Items | `ion-item`, `ion-label`, `ion-thumbnail`, `ion-button` | a row; `slot="start"`/`"end"`; `button`, `href`, `color` |
| Icons | `ion-icon`, `ion-badge`, `ion-avatar`, `ion-chip` | `addIcons({ heart })` + `name="heart"` |
| Inputs | `ion-input`, `ion-checkbox`, `ion-toggle`, `ion-radio`, `ion-datetime` | inside `ion-item`; `[(ngModel)]` needs `FormsModule` |
| Lists | `ion-list`, `ion-card`, `ion-card-header`, `ion-card-title`, `ion-card-subtitle`, `ion-card-content` | lists can hold cards |
| Modals | `ToastController`, `AlertController`, `ActionSheetController`, `ModalController` | `create({...}).then(x => x.present())` |

**Controllers**

| Call | What it does |
|---|---|
| `toastController.create({ message, duration })` | short message, disappears by itself |
| `alertController.create({ header, subHeader, message, inputs, buttons })` | centered dialog; button `handler(data)` gets input values |
| `actionSheetController.create({ header, buttons })` | bottom sheet; button `role: 'destructive' / 'cancel'`, `icon`, `handler` |
| `modalController.create({ component, componentProps })` | page over the page; props → `@Input()`s |
| `modalController.dismiss(data)` | close the top modal, send `data` back |
| `modal.onDidDismiss().then(r => r.data)` | read what the modal sent |

**CLI**

| Command | Purpose |
|---|---|
| `npm install -g @ionic/cli` | install the Ionic CLI |
| `ionic start [projectname]` | new project |
| `ionic generate page [name]` | new page (+ its route) |
| `ionic serve` | run in the browser |

**Top 5 things to remember**

1. A standalone page must **import** each Ionic component from `@ionic/angular/standalone` **and** list it in `imports: [...]` — plus `FormsModule` for `ngModel`.
2. `[checked]` only displays a value; `[(ngModel)]` is what writes the user's choice back into your data.
3. Icons need `addIcons({ ... })` with every name you use — including icons in an action sheet's options — or they silently don't show.
4. Dialogs and modal pages are opened from the `.ts`: `create()` returns a Promise, and nothing appears until `present()`.
5. `componentProps` keys become the modal page's `@Input()`s; `dismiss(data)` sends data back, and `onDidDismiss()` resolves to an object whose `.data` is that value.
