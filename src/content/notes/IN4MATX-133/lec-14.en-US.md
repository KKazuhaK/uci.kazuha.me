---
title: "Mobile Design Principles"
summary: "What makes a good user experience, four principles of mobile design (useful initial view, the uh-oh button, error prevention, platform conventions), human interface guidelines, iOS navigation, modals, branding, color, typography and icons, Google Material Design vs iOS (navigation bar, swiping), and planning A4's pages, components and services."
---

# IN4MATX 133: User Interface Software — Lecture 14: Mobile Design Principles

## Table of Contents

- [1. What makes a good user experience?](#1-what-makes-a-good-user-experience)
- [2. A useful initial view](#2-a-useful-initial-view)
- [3. The uh-oh button](#3-the-uh-oh-button)
- [4. Error prevention](#4-error-prevention)
- [5. Follow platform conventions](#5-follow-platform-conventions)
- [6. Human interface guidelines](#6-human-interface-guidelines)
- [7. iOS HIG: navigation and modals](#7-ios-hig-navigation-and-modals)
- [8. iOS HIG: branding, color and typography](#8-ios-hig-branding-color-and-typography)
- [9. Design choices in popular apps](#9-design-choices-in-popular-apps)
- [10. App icons and system icons](#10-app-icons-and-system-icons)
- [11. Google Material Design and Android vs iOS](#11-google-material-design-and-android-vs-ios)
- [12. Planning A4: sketch pages, outline the architecture](#12-planning-a4-sketch-pages-outline-the-architecture)
- [13. In-class Questions & Demos (with Solutions)](#13-in-class-questions--demos-with-solutions)
- [14. Quick Reference & Top 5 Things to Remember](#14-quick-reference--top-5-things-to-remember)

> UCI IN4MATX 133: User Interface Software — Prof. Travis Linden Reid, Fall 2026, Thursday 11/12 (Week 7)
> Built from the Lecture 14 slides (40 pages). A design lecture: there is no demo folder for it in the course repo, so the live demos here are small hand-made examples of the slides' principles. Organized by concept, not by source.

> 📅 **Class logistics**: A2 grades posted. A4 posted — it holds your hand less and needs more time with Ionic's documentation; you have all the skills at this point in the quarter. The **README for A4 is critical**, and today's concepts are critical for writing a good README.
> Weeks 7–10 plan: A5 is now an **open-ended app dev project** instead of an AI project. Technical lecture content is almost done — remaining: device resources, databases, SASS. Week 10 may be time to work on the final project.

---

## 1. What makes a good user experience?

The lecture opens with a question (slide 5): *what makes a good user experience?* The answer on slide 6: **it's not just the UI.** The experience begins the first time you launch an app or go to a website, and it has several components:

- the **initial impression** (from boot-up to the app starting)
- the **user interface**
- the **visual design**
- **information presentation**
- the **physical device** and how it's used with the app

Four principles of mobile design follow (slide 7): a useful initial view, the "uh-oh" button, error prevention, and following platform conventions — Sections 2–5.

## 2. A useful initial view

The first screen should already be worth something (slide 8):

- **Give users clear calls to action.**
- **Put useful content on the homepage** — e.g. Pinterest's home screen is a grid of images right away; put more than navigation buttons there.
- **Make it easy to get back to the homepage** — with a bottom navbar or a side navigation menu.

The slide contrasts two screenshots: Pinterest (a search bar, then a feed of images, with a bottom navbar) and an anxiety-management app whose home screen is a grid of round icon buttons that only lead elsewhere — navigation buttons and nothing else.

## 3. The uh-oh button

Functions and buttons are often pressed by mistake, so (slide 9):

- **Undo and redo should be easy** — Gmail's "undo send" is the example (its screenshot shows the Compose screen).
- **Navigating back a page should be easy** — breadcrumbs or back buttons (top left).

An "undo send" in Ionic terms is a toast with an **Undo** button ([Lecture 13](lec-13.en-US.md#8-modal-dialogs-toast-alert-action-sheet) covers toasts). Press Send; press Undo within 4 seconds to get `Send undone: back to the draft`, or let it time out to get `Message really sent`:

```viz web-demo
{"title": "The “uh-oh” button: an “undo send” toast (slide 9) · hand-made example with an Ionic toast", "width": 375, "height": 300, "interactive": true, "html": "<link rel=\"stylesheet\" href=\"https://cdn.jsdelivr.net/npm/@ionic/core@8.8.19/css/ionic.bundle.css\">\n<script>window.Ionic = { config: { mode: \"ios\" } };</script>\n<script type=\"module\" src=\"https://cdn.jsdelivr.net/npm/@ionic/core@8.8.19/dist/ionic/ionic.esm.js\"></script>\n<ion-app>\n<ion-header><ion-toolbar><ion-title>Compose</ion-title></ion-toolbar></ion-header>\n<ion-content class=\"ion-padding\">\n  <p>Lunch Saturday?</p>\n  <ion-button id=\"send\">Send</ion-button>\n</ion-content>\n</ion-app>", "js": "document.getElementById('send').addEventListener('click', () => {\n  let undone = false;\n  const toast = Object.assign(document.createElement('ion-toast'), {\n    message: 'Message sent.', duration: 4000,\n    buttons: [{ text: 'Undo', handler: () => { undone = true; } }]\n  });\n  toast.addEventListener('didDismiss', () => toast.remove());\n  document.body.appendChild(toast);\n  toast.present();\n  toast.onDidDismiss().then(() => {\n    console.log(undone ? 'Send undone: back to the draft' : 'Message really sent');\n  });\n});"}
```

## 4. Error prevention

Providing input on small devices is difficult, so add as much assistance as possible to aid with input (slide 10):

- **Add input checks** — how many digits are in that phone number? A credit card number?
- **Use appropriate widgets** — a date/time spinner, sliders.

The slide's screenshots are an Android event form (date fields "Wed, Sep 19, 2012" and times highlighted) and a DatePicker spinner (Sep/Oct/Nov, 03/04/05, 2016/2017/2018) — instead of typing a date, the user turns wheels that can only produce valid ones.

A small booking form with both ideas: the phone field counts digits as you type and blocks submission unless there are exactly 10; the date uses the browser's date picker and the guest count a slider. The step types a 7-digit number and presses Book, which logs `Blocked: phone number has 7 digits, needs 10`:

```viz web-demo
{"title": "Error prevention (slide 10) · hand-made example: input checks and fitting widgets", "width": 375, "height": 330, "interactive": true, "html": "<form id=\"f\">\n  <label>Phone number<br>\n    <input id=\"phone\" type=\"tel\" inputmode=\"numeric\" placeholder=\"(949) 555-0123\">\n  </label>\n  <small id=\"hint\">10 digits</small>\n  <label>Date<br><input type=\"date\" id=\"date\"></label>\n  <label>Guests: <output id=\"n\">2</output><br>\n    <input type=\"range\" min=\"1\" max=\"10\" value=\"2\" id=\"guests\">\n  </label>\n  <button>Book</button>\n</form>", "css": "body { font-family: -apple-system, system-ui, sans-serif; margin: 16px; }\nlabel { display: block; margin-top: 12px; }\ninput { font-size: 16px; padding: 6px; width: 100%; box-sizing: border-box; }\nsmall { color: #666; }\nsmall.bad { color: #c00; }\nbutton { margin-top: 14px; font-size: 16px; padding: 8px 16px; }", "js": "const phone = document.getElementById('phone');\nconst hint = document.getElementById('hint');\nphone.addEventListener('input', () => {\n  const digits = phone.value.replace(/\\D/g, '');        // keep digits only\n  hint.textContent = digits.length + ' / 10 digits';\n  hint.className = digits.length == 10 ? '' : 'bad';\n});\ndocument.getElementById('guests').addEventListener('input', (e) => {\n  document.getElementById('n').textContent = e.target.value;\n});\ndocument.getElementById('f').addEventListener('submit', (e) => {\n  const digits = phone.value.replace(/\\D/g, '');\n  if (digits.length != 10) {\n    e.preventDefault();\n    console.log('Blocked: phone number has ' + digits.length + ' digits, needs 10');\n  }\n});", "steps": [{"note": "Type a 7-digit number and press Book (scripted): the check stops it.", "js": "phone.value='555-0123'; phone.dispatchEvent(new Event('input')); document.querySelector('button').click();"}]}
```

## 5. Follow platform conventions

Users should not have to wonder whether different words, situations, icons or actions mean the same thing, and should not have to remember app-specific navigation (slide 11). The slide shows the same "Timetable" conference app on iOS (light, tab bar at the bottom) and on Android (green toolbar, Material styling): same content, each following its own platform's look.

Where those conventions are written down is the rest of the lecture.

## 6. Human interface guidelines

The platform conventions for iOS and Android are published as **human interface guidelines (HIGs)** (slide 12). They're created by the web/mobile platform developers (Google, Apple), and they (slide 13):

- define rules for visual design and style
- specify interactions
- establish layout techniques
- provide consistency across the platform

HIGs are **recommendations** — you can choose to ignore them. Their goal is an optimal experience for a device or platform, and they most often follow best practices (slide 14).

Apple's iOS guidelines, summarized (slide 15):

- **Content over UI.**
- **Respond to user preferences in display** (dark mode, horizontal/vertical).
- **Use the whole screen.**
- **Limit on-screen controls.**
- **Make use of swiping.**
- **Reduce inputting information by making use of user data** — e.g. Apple Pay, biometric auth (face/finger scan), or device location.

> 🔗 **Go deeper**: [Apple HIG: Designing for iOS](https://developer.apple.com/design/human-interface-guidelines/designing-for-ios)

## 7. iOS HIG: navigation and modals

**Navigation** (slide 16):

- Use a **tab bar** to navigate between the **top-level sections** of the app. It's for **navigation, NOT actions**, and it's **always present**.
- Use a **sidebar** for **hierarchical content**: at most **2 layers** of hierarchy, and **collapsible**.

The slide's figures: a sidebar with a "Section" heading and Item 1–3 (one highlighted), and iPhone/iPad screens with a tab bar of star icons along the bottom. In Ionic, the tab bar is `<ion-tabs>`, which replaces the footer ([Lecture 13](lec-13.en-US.md#3-structural-components-content-header-footer)).

**Modals** (slide 17) grab control of the experience until they're dismissed. They're meant to grab attention for doing **one small, specific task**. So:

- make sure the user can **back out**
- use them to help **avoid data loss**
- use them **sparingly**

The figures: a "Location Services Off" alert with **Settings** and **OK** buttons over a map, and a mail compose sheet ("Let's grab lunch!") with **Cancel** and **Send** at the top — Cancel is the way to back out.

> ⚠️ **Pitfall**: "Make sure the user can back out" is a rule your own modals must pass. A modal page with no Dismiss/Cancel button traps the user on a phone — the repo's Lecture 13 `solution2` modal has exactly that bug ([Lecture 13, Demo 2](lec-13.en-US.md#113-demo-2-adding-alerts-and-a-modal-page-to-the-shopping-list-slide-46--setup2--solution2)).

> 🔗 **Go deeper**: [Apple HIG: Navigation and search](https://developer.apple.com/design/human-interface-guidelines/navigation-and-search) · [Apple HIG: Modality](https://developer.apple.com/design/human-interface-guidelines/modality)

## 8. iOS HIG: branding, color and typography

**Branding** (slide 18): it's important to be distinctive… but be careful not to pull the user out of the iOS experience. Your app doesn't have to look like a default app, but… The slide shows the same "Attractions" page (Arc de Triomphe) twice: once with a quiet red accent, once with a big red "MY LOGO" banner at the top *and* bottom — the second one shouts its brand over the content.

**Color** (slides 19–20):

- Use a **key color** to denote **interactive elements**.
- **Don't use the same color to indicate different meanings.**
- Use color judiciously to highlight certain elements.
- Denote **"active"** and **"inactive"** components differently.
- Use color **accessibly**: for **colorblindness** and **cultural contexts**. Slide 20's example: in the Stocks app, **green** marks a positive trend in English, but **red** marks a positive trend in Chinese.

Slide 19's figures mark bad vs good (✗ vs ✓). Toolbar: ✗ fills *every* button (close, two actions, confirm) with blue; ✓ keeps only the confirm ✓ blue and the rest neutral. Map: ✗ a grey map whose locate button and search field are all filled blue; ✓ a blue-tinted map with neutral controls — color used judiciously, not on everything.

**Color and typography** (slide 21):

- Colors are great for grabbing attention, but can be **overused**.
- Use **complementary colors** — palette definers like paletton.com help.
- Use a **single typeface** (font) if possible; built-in fonts are just fine.
- Use **font size, color and weight** (bold) to highlight information.

The slide's figures are Apple's system color swatches (Red, Orange, Yellow, Green, Teal Blue, Blue, Purple, Pink, with RGB values such as Blue R 0 G 122 B 255) and a type scale where SF Pro Display (20pt) and SF Pro Text (19pt) sit in a list of sizes from 16pt to 23pt.

The demo uses one key blue (`#007aff`) for everything tappable, grey for inactive tabs, and a single typeface whose size and weight make the hierarchy. The step shows the anti-pattern — the same red for the button, the "3 unread" text and the active tab, so red no longer means one thing. Click the tabs to log `Tab: Contacts` etc.:

```viz web-demo
{"title": "Key color, active vs inactive, one typeface (slides 16, 19, 21) · hand-made example", "width": 375, "height": 380, "interactive": true, "html": "<div class=\"screen\">\n  <h1>Messages</h1>\n  <p class=\"sub\">3 unread</p>\n  <p>Body text uses the same typeface; size and weight carry the hierarchy.</p>\n  <button class=\"action\">New message</button>\n</div>\n<nav class=\"tabbar\">\n  <a class=\"active\">Chats</a><a>Contacts</a><a>Settings</a>\n</nav>", "css": ":root { --key: #007aff; }          /* one key color = \"you can tap this\" */\nbody { margin: 0; font-family: -apple-system, system-ui, sans-serif; }\n.screen { padding: 16px; }\nh1 { font-size: 28px; font-weight: 700; margin: 0; }\n.sub { font-size: 15px; color: #8e8e93; margin: 4px 0 12px; }\n.action { background: var(--key); color: white; border: 0; border-radius: 8px; padding: 10px 14px; font-size: 16px; }\n.tabbar { position: fixed; bottom: 0; left: 0; right: 0; display: flex; border-top: 1px solid #ddd; background: #f9f9f9; }\n.tabbar a { flex: 1; text-align: center; padding: 12px 0; font-size: 13px; color: #8e8e93; }  /* inactive */\n.tabbar a.active { color: var(--key); font-weight: 600; }                                   /* active */", "js": "document.querySelectorAll('.tabbar a').forEach((tab) => {\n  tab.addEventListener('click', () => {\n    document.querySelector('.tabbar a.active').classList.remove('active');\n    tab.classList.add('active');\n    console.log('Tab: ' + tab.textContent);\n  });\n});", "steps": [{"note": "Anti-pattern: the same red for a button AND for 'unread' — color no longer has one meaning.", "css": ".action { background: #ff3b30; } .sub { color: #ff3b30; } .tabbar a.active { color: #ff3b30; }"}]}
```

> 🔗 **Go deeper**: [Apple HIG: Branding](https://developer.apple.com/design/human-interface-guidelines/branding) · [Apple HIG: Color](https://developer.apple.com/design/human-interface-guidelines/color) · [Paletton (palette definer)](http://paletton.com)

## 9. Design choices in popular apps

Slides 22–24 put three apps side by side, each with its logo, its color palette, and two screenshots:

| App | Palette on the slide | Screens shown |
|---|---|---|
| TikTok | Turquoise `#25F4EE`, Red `#FE2C55`, Black `#000000`, White `#FFFFFF` | full-screen video feed; "Friends / Now" feed — both with a bottom tab bar (Home, Now, **+**, Inbox, Me) |
| Instagram | Blue `#405DE6`, Purple Blue `#5851DB`, Purple `#833AB4`, Purple Red `#C13584`, Rose `#E1306C`, Bright Red `#FD1D1D` | home feed with Stories row; a profile page with a blue "Send Message" button — bottom tab bar of icons |
| Letterboxd | Orange `#ff8000`, Green `#00e054`, Blue `#40bcf4`, plus White `#ffffff` | dark film page ("Nomadland"); a director's grid of posters |

Then the poll: *Tell me something you feel all of these apps have in common in their design choices* ([Question 1](#131-question-1-what-do-these-apps-have-in-common-slides-2526)). Things to look for, all from Sections 2–8: content first (photos, videos, posters fill the screen — "content over UI"), a bottom tab bar that's always present, a small brand palette where the brand colors appear in a few accents rather than everywhere, and one typeface with size and weight for hierarchy.

> 📝 **Practice**: [Question 1](#131-question-1-what-do-these-apps-have-in-common-slides-2526)

## 10. App icons and system icons

A good **app icon** is important (slide 27):

- keep the background simple
- only use words if they're essential or part of a logo
- **leave your icon out of the interface** (the app icon is for the home screen, not for every page)

Inside the interface, when appropriate, **use system icons** — cut, copy, paste, save, etc. The slide shows a row of Apple's app icons (Settings, Phone, Mail, Podcasts, Photos, Maps, Clock) and a table of system icons with their meanings, e.g.:

| Icon | Meaning (from the slide's table) |
|---|---|
| Action (Share) | shows a modal view with share extensions, action extensions, and tasks like Copy, Favorite, Find |
| Add | creates a new item |
| Bookmarks | shows app-specific bookmarks |
| Camera | takes a photo or video, or shows the Photo Library |
| Cancel | closes the current view or ends edit mode without saving changes |
| Compose | opens a new view in edit mode |
| Done | saves the state and closes the current view, or exits edit mode |
| Edit | enters edit mode in the current context |
| Fast Forward | fast-forwards through media playback or slides |

Using the system's icon means the user already knows what it does — the platform-conventions rule from [Section 5](#5-follow-platform-conventions). In Ionic, that's an `<ion-icon>` from Ionicons ([Lecture 13](lec-13.en-US.md#5-icons-badges-and-avatars)).

> 🔗 **Go deeper**: [Apple HIG: App icons](https://developer.apple.com/design/human-interface-guidelines/app-icons) · [Apple HIG: Icons](https://developer.apple.com/design/human-interface-guidelines/icons)

## 11. Google Material Design and Android vs iOS

Google's guidelines are **Material Design** (slide 28). Its philosophy: the interface should look like **layers on a sheet of paper**, with **3D depth and motion**. It follows many of the same interaction patterns as iOS design:

- limited use of modals
- use color to emphasize content
- be subtle with branding

But there are a few key differences.

**Universal navigation bar** (slide 29): Android has a **navigation bar at the bottom of the screen** — sometimes a hardware button, sometimes done in software, but **always present** (the figure labels the app-level "Navigation bar" and the system-level "Navigation bar" with ◀ ● ■). iOS instead implements **"back" in-app**: the app's own tab bar is app-level, and the system only adds the home indicator.

**Swiping** (slide 30):

| Gesture | Android | iOS |
|---|---|---|
| Swipe from the edge | **Back** (left or right edge) | **back a screen** (in-app) |
| Swipe up | Home | Home |
| Swipe up, hold, release / swipe up & pause | Overview of apps | Multitask |
| Moving between apps | swiping moves between apps; the always-present back button also navigates across apps | horizontal swipe on the home indicator; otherwise only after returning to home |

So the same "back" means different things: on Android it's a system button that can even take you to the previous *app*; on iOS your app must provide its own back button (top left) and swipe-back.

> 💡 **Key Insight**: An Ionic app runs on both. Ionic renders iOS styling on iPhones and Material styling on Android (the "mode"), but the **navigation** decisions — does every page have a back button? is the tab bar always there? — are yours, and must work without Android's system back button.

> 🔗 **Go deeper**: [Material Design 3](https://m3.material.io/) · [A complete guide to navigation on iOS & Android](https://www.kickassux.com/ux-library/a-complete-guide-to-navigation-on-ios-android) · [Interaction design patterns: iOS vs Android](https://medium.com/@vedantha/interaction-design-patterns-ios-vs-android-111055f8a9b7)

## 12. Planning A4: sketch pages, outline the architecture

"Switching gears: system design" (slide 31). After a poll on how prepared you feel to start A4 ([Question 2](#132-question-2-how-prepared-do-you-feel-to-start-a4-slides-3233)), the class plans A4 together. Planning and breaking down tasks makes tackling a large problem much easier: it's **less intimidating** and **easier to start** (slide 34). Two parts: sketch pages, then diagram an architecture plan.

**Part 1: Sketch pages** (slide 35):

1. Skim the A4 requirements.
2. Using pen & paper, Google Drawings, Figma, or another tool of your choice, **sketch out pages & components**.
3. Draw, then analyze.

The example is a hand-drawn texting app, **"WeChirp"**: a **MessageList** page (title "We Chirp", a list of conversation preview cards with a user icon and name, a search box at the bottom; annotations "user icon", "convo preview card") and a **Conversation** page (contact name with icon at the top, message bubbles, a "message…" input at the bottom; annotation "message bubble").

**Part 2: Outline the architecture** (slide 36). Write an outline of the **pages**, **components** and **services** you need for A4:

| Piece | What it is |
|---|---|
| **Page** | a full-screen view |
| **Component** | a UI element (model/controller **& view**) |
| **Service** | injectable data (model/controller; **NO view**) |

The WeChirp outline:

- Page: **MessageList**
  - Component: **ConversationCard**
  - Component: **Title** — back button, UserIcon, contact name
  - Component: **Search**
- Page: **Conversation**
  - Component: **MessageCard**
  - Component: **TypeMessage**
- Component: **UserIcon** (used by both pages)
- Service: **AllConversations**
- Service: **Conversation**

Note that the sketches didn't really draw any services (slide 36) — services hold data, so they don't show up in a picture; you have to think of them from what the pages need to know (the list of conversations; the messages of one conversation). That's [Lecture 11's](lec-11.en-US.md#5-angular-services) split: the view in components, shared data in services. Then the same poll again ([Question 3](#133-question-3-how-prepared-do-you-feel-to-start-a4-post-activity-slides-3738)).

> 💡 **Key Insight**: A component that appears on two pages (UserIcon) goes at the top level of the outline, not under one page — that's the signal it should be its own reusable component.

> 📝 **Practice**: [Question 2](#132-question-2-how-prepared-do-you-feel-to-start-a4-slides-3233) · [Question 3](#133-question-3-how-prepared-do-you-feel-to-start-a4-post-activity-slides-3738)

## 13. In-class Questions & Demos (with Solutions)

This lecture has no coding demos. The poll slides show "Nobody has responded yet" or 0% on every bar, so no results were revealed; the answers below come from the deck's own slides. (Slide 5's "What makes a good user experience?" is a discussion prompt, answered on slide 6 — see [Section 1](#1-what-makes-a-good-user-experience).)

### 13.1 Question 1: What do these apps have in common? (slides 25–26)

*L14-Q1: Tell me something you feel all of these apps have in common in their design choices.* (TikTok, Instagram, Letterboxd — slides 22–24; open response)

<details>
<summary>Answer</summary>

An open question, but the slides' principles give several solid answers:

- **Content over UI** (slide 15): videos, photos and posters fill the screen; the UI chrome is thin.
- **A bottom tab bar, always present** (slide 16): all three switch top-level sections with icons along the bottom, and it's navigation, not actions (TikTok's **+** is the one exception — a create action in the bar).
- **A small palette used judiciously** (slides 19, 21): each brand has a few signature colors, but they appear as accents (a Post button, a heart, a rating), not as backgrounds everywhere — "be careful not to pull a user out of the iOS experience" (slide 18).
- **One typeface, hierarchy by size and weight** (slide 21): names and titles are bold and bigger; metadata is smaller and grey.
- **Familiar system-style icons** (slide 27): home, search, heart, share, profile.

</details>

Back to [Section 9](#9-design-choices-in-popular-apps).

### 13.2 Question 2: How prepared do you feel to start A4? (slides 32–33)

*L14 Q2: How prepared do you feel to start A4?*

- 1 — Not at all prepared
- 2 — A little prepared
- 3 — Moderately prepared
- 4 — Well prepared
- 5 — Extremely well prepared

<details>
<summary>Answer</summary>

A self-assessment poll — no correct answer. It's asked before the planning activity on purpose: the activity's claim (slide 34) is that breaking A4 into sketched pages and an outline of pages, components and services makes it less intimidating and easier to start.

</details>

Back to [Section 12](#12-planning-a4-sketch-pages-outline-the-architecture).

### 13.3 Question 3: How prepared do you feel to start A4? (post-activity, slides 37–38)

*L14 Q3: How prepared do you feel to start A4? (post-activity)* — the same 1–5 scale as [Question 2](#132-question-2-how-prepared-do-you-feel-to-start-a4-slides-3233).

<details>
<summary>Answer</summary>

Again no correct answer; compare it with your answer to Question 2. If it didn't go up, the outline is the thing to finish: for every page you sketched, list its components, then ask what data each page needs — those are your services.

</details>

Back to [Section 12](#12-planning-a4-sketch-pages-outline-the-architecture).

## 14. Quick Reference & Top 5 Things to Remember

**Four principles of mobile design**

| Principle | In practice |
|---|---|
| Useful initial view | clear calls to action, real content on the homepage, easy way back home (bottom navbar, side menu) |
| The "uh-oh" button | easy undo/redo ("undo send"), easy back (breadcrumbs, top-left back button) |
| Error prevention | input checks (digit counts), fitting widgets (date/time spinners, sliders) |
| Platform conventions | same words/icons/actions mean the same thing; no app-specific navigation to memorize |

**iOS HIG checklist**

| Topic | Rule |
|---|---|
| Overall | content over UI; respect dark mode/orientation; whole screen; few controls; swiping; reuse user data (Apple Pay, biometrics, location) |
| Navigation | tab bar for top-level sections — navigation not actions, always present; sidebar for ≤ 2 levels, collapsible |
| Modals | one small task; user can back out; prevent data loss; sparingly |
| Branding | distinctive, but don't pull the user out of the iOS experience |
| Color | one key color for interactive elements; one meaning per color; active ≠ inactive; colorblindness and culture |
| Typography | one typeface; size, color, weight for emphasis |
| Icons | simple app icon, words only if essential, not inside the UI; system icons for standard actions |

**iOS vs Android**

| | iOS | Android (Material) |
|---|---|---|
| Look | content over UI | layers of paper, depth and motion |
| Back | in-app back button / edge swipe goes back a screen | always-present system navigation bar; back can cross apps |
| Between apps | via home | swiping / back button |

**Architecture outline**

| Piece | Has a view? | Example (WeChirp) |
|---|---|---|
| Page | yes, full screen | MessageList, Conversation |
| Component | yes | ConversationCard, MessageCard, TypeMessage, UserIcon |
| Service | no — injectable data | AllConversations, Conversation |

**Top 5 things to remember**

1. A good user experience is more than the UI: first launch, visual design, how information is presented, and the physical device all count.
2. The four principles: useful initial view, an easy "uh-oh" (undo/back), error prevention with checks and fitting widgets, and platform conventions.
3. HIGs are recommendations from Apple and Google; on iOS: tab bar for top-level navigation (never actions), modals only for small tasks and always escapable.
4. Color: one key color for interactive elements, never one color for two meanings, and remember colorblindness and culture (red = up in Chinese stock apps).
5. Android has an always-present system back; iOS apps must provide their own back — so plan back buttons into every Ionic page, and outline pages → components → services before coding A4.
