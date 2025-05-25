# 🧠 pageFunctions

A lightweight JavaScript lifecycle manager for component-based websites built in tools like Webflow — without any bundlers, frameworks, or external dependencies.

It gives you a clear, reliable way to define, register, and execute JavaScript functions across any DOM lifecycle — including transitions, dynamic content loads, or runtime injections.

---

## 🚀 How to Use It

### 1. Install `pageFunctions`

Add this **to your Webflow Project Settings → `<head>` tag**:

```html
<script>
  // Paste the full pageFunctions v0.0.2 script here
</script>
```

Add this **before the closing `</body>` tag**:

```html
<script>
  pageFunctions.runFunctions();
</script>
```

---

### 2. Register JavaScript Functions Inside Script Tags

Use a standard HTML embed or `<script>` block wherever your component is defined:

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

## 📘 API Reference

### `pageFunctions.addFunction(id, fn, level = 0)`

Registers a function that will be executed once — when `.runFunctions()` is called.

#### Parameters

| Param     | Type       | Description                                                                 |
|-----------|------------|-----------------------------------------------------------------------------|
| `id`      | `string`   | A unique identifier for this function. Re-registering the same ID replaces it. |
| `fn`      | `function` | The actual function you want to run. Can be `async`.                         |
| `level`   | `number`   | Determines when the function runs relative to others (see below).           |

---

### 🧭 Levels Explained

`pageFunctions` groups functions by level and runs them **sequentially**, like a waterfall:

- **Level 0 runs first**, then **Level 1**, then **Level 2**, and so on.
- **All functions in a level — including async ones — must complete before moving to the next level.**
- Levels give you **temporal control**: use them when a function depends on a previous group completing.

#### ✅ Best Practices for Levels

- If your function is **immediate** (no animations, no loading, no async), use **`level 0`**.
- Only increase the level **if your function depends on something completing in a lower level.**
- **Do not assign random levels just to "force order"** — it creates misleading dependency chains and debugging confusion.

---

### `pageFunctions.runFunctions()`

Executes all registered functions that haven't yet run — grouped by level.

- Only runs functions that have **not already been executed**
- Async functions are **awaited** before moving on
- Can be called multiple times safely

---

### `pageFunctions.refresh(autoRun = true)`

Evaluates new `<script>` tags in the DOM and runs any new logic you've added via `.addFunction()`.

#### Why `refresh()` exists

Many modern sites inject HTML dynamically (via CMS filters, pagination, animation transitions, etc). Those new HTML blocks often contain component-level `<script>` tags that won’t automatically run.

`.refresh()` solves that by:

- Scanning the page for **new inline `<script>` tags**
- Running them **once** (tracked with `data-page-fn-executed`)
- Re-registering any `addFunction()` calls it finds
- Optionally calling `.runFunctions()` immediately afterward

#### Parameters

| Param       | Type      | Default | Description                                                   |
|-------------|-----------|---------|---------------------------------------------------------------|
| `autoRun`   | `boolean` | `true`  | Whether to immediately call `runFunctions()` after refreshing |

---

### Optional: Prevent a Script from Re-running

To skip re-execution during refreshes (e.g. intro animations, initializations), use:

```html
<script data-prevent-refresh>
  pageFunctions.addFunction("loaderIntro", () => {
    console.log("This only runs once on first load");
  }, 0);
</script>
```

---

## 🧠 Mental Model

Think of `pageFunctions` as a global event queue for page logic. Instead of scattering `DOMContentLoaded`, `setTimeout`, or brittle `init()` calls everywhere, you declare what needs to run and when, using simple script tags and IDs.

It’s especially valuable when working with:

- Page transitions
- CMS-powered components
- Dynamic DOM updates
- Modular, repeatable components (cards, sliders, tabs, etc)

---

## 🐞 Debug Mode

`pageFunctions` includes a built-in **debug mode** to help you trace script execution and lifecycle issues.

### ✅ Automatically Enabled on `.webflow.io`

If your site is running on a Webflow staging domain (e.g. `your-site.webflow.io`), debug mode is on by default.

### 🔍 What It Logs

- Every `addFunction()` registration (ID + level)
- Each `<script>` execution in `.refresh()`
- Grouped output during `.runFunctions()` by execution level
- Any thrown errors in functions or script tags

### 💡 Example Output

```plaintext
[pageFunctions v0.0.2] Refresh started
[pageFunctions] (Re)registered function "galleryInit" at level 1
[pageFunctions v0.0.2] Running level 0 with 2 function(s)
[pageFunctions v0.0.2] Running level 1 with 1 function(s)
[pageFunctions] All levels complete.
```

### 🛠 Enable Manually

On production or custom domains, you can force debug mode:

```js
pageFunctions.devMode = true;
```

This is especially useful when testing transitions or debugging behavior outside Webflow staging.

---

## 🔍 Debugging Tips

```js
Object.keys(pageFunctions.functions); // All registered function IDs
Object.keys(pageFunctions.executed);  // All IDs that have already run
```

Use this to verify which functions are ready vs skipped.

---

## 📂 Example Use Case Structure

```
Webflow Site/
├── Pages/
│   ├── About (has HTML Embed for split text)
│   ├── Projects (injects cards dynamically)
│   └── Contact
├── Scripts/
│   ├── <head>: Core pageFunctions script
│   └── </body>: pageFunctions.runFunctions()
```

---

## 🛠 Version

**`v0.0.2`**

- ✅ `refresh()` auto-runs by default
- ✅ Re-registering resets `.executed` to allow clean re-runs
- ✅ Developer-first logs, grouped by version and level
