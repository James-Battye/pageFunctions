# 🧠 pageFunctions

A lightweight JavaScript lifecycle manager for [Webflow](https://webflow.com) and [Barba.js](https://barba.js.org) that lets you run scoped component logic cleanly across page transitions — using nothing but script tags.

No bundler. No CDN. No external tooling. Just plain JavaScript and predictable behavior.

---

## 🚀 How to Use It

### 1. Install `pageFunctions`

Paste this **into your Webflow Project Settings → `<head>` tag**:

```html
<!-- pageFunctions Core (v0.0.2) -->
<script>
  // Paste the full script here (see `pageFunctions v0.0.2`)
</script>
```

Then, **add this before the closing `</body>` tag**:

```html
<script>
  pageFunctions.runFunctions();
</script>
```

---

### 2. Register Component Logic in `<script>` Tags

Embed scripts inside Webflow HTML blocks where your components live:

```html
<script>
  pageFunctions.addFunction("workHover", () => {
    const cards = document.querySelectorAll('.work_item');

    cards.forEach((el) => {
      el.addEventListener('mouseenter', () => el.classList.add('hover'));
      el.addEventListener('mouseleave', () => el.classList.remove('hover'));
    });

    console.log("[workHover] listeners attached:", cards.length);
  }, 0);
</script>
```

- `id`: must be unique per component function
- `fn`: your logic (can be async)
- `level`: optional execution order (like a z-index for JS)

---

### 3. Run It After Barba Transitions

In your Barba `afterEnter` hook:

```js
barba.hooks.afterEnter(() => {
  pageFunctions.refresh(); // auto-runs functions
});
```

To defer `.runFunctions()` manually:

```js
pageFunctions.refresh(false); // just scan script tags
pageFunctions.runFunctions(); // run them later
```

---

### 4. Prevent Some Scripts from Re-Running

For one-time scripts (like homepage loaders or initializers), use `data-prevent-refresh`:

```html
<script data-prevent-refresh>
  pageFunctions.addFunction("loader", () => {
    console.log("🏁 Homepage loader");
  }, 0);
</script>
```

This prevents execution during `.refresh()` but still runs on first load.

---

## 🧩 How It Works

### ✅ `addFunction(id, fn, level = 0)`

Registers a uniquely named function at a given "level".

- Replaces previous calls with the same `id`
- Resets its `.executed` state so it runs again
- Accepts sync or async functions

```js
pageFunctions.addFunction("galleryInit", async () => {
  await preloadImages();
  startSlideshow();
}, 1);
```

---

### ✅ `runFunctions()`

Executes all **unexecuted** functions, grouped by level in ascending order.

- Automatically skips anything already run
- Executes functions in parallel per level
- Waits for async functions to resolve before moving to the next level

---

### ✅ `refresh(autoRun = true)`

Finds all new `<script>` tags in the DOM:

- Skips anything already marked `data-page-fn-executed`
- Skips anything with `data-prevent-refresh`
- Evaluates valid scripts via `eval()`
- Then calls `runFunctions()` (unless you pass `false`)

```js
pageFunctions.refresh();      // Scan + run
pageFunctions.refresh(false); // Scan only
```

---

## 🧠 Design Philosophy

- ✅ **Component-local JS**: Logic stays with layout, not in one giant file
- ✅ **Single-run guarantee**: No double-attaches or replays
- ✅ **Webflow-compatible**: All logic works inside HTML embed blocks
- ✅ **Barba-safe**: Works with async page transitions and dynamic DOM swaps
- ✅ **Extensible**: Clean base with `run`, `refresh`, and future `.clear()` or `.debug()` options

---

## 🔍 Debugging Tips

To inspect what’s registered and what’s run:

```js
console.log(Object.keys(pageFunctions.functions)); // all registered IDs
console.log(Object.keys(pageFunctions.executed));  // those already run
```

Enable verbose logs on `.webflow.io` domains by default, or force it manually:

```js
pageFunctions.devMode = true;
```

---

## 🛠 Version

**`v0.0.2`**  
Changelog:
- Auto-run added to `.refresh()`
- Duplicate `addFunction()` calls reset `.executed`
- Cleaned up logging and script tag evaluation

---

## 📂 Example Directory Structure

You don’t need files, but mentally think of it like:

```
Webflow Project/
├── [Page]
│   ├── [Section]
│   │   └── <script> → pageFunctions.addFunction(...)
│   └── ...
├── Settings/
│   ├── <head> → core pageFunctions script
│   └── </body> → pageFunctions.runFunctions()
```
