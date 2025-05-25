# 🧠 pageFunctions

A lightweight JavaScript lifecycle manager for component-based websites. Designed for environments like Webflow where script loading and timing can get messy.

It gives you a reliable way to define, organize, and execute JavaScript logic across dynamic page transitions, CMS-driven changes, or other client-side mutations — without external tools or frameworks.

---

## 🚀 How to Use It

### 1. Add the Script

Place this in the **Webflow Project Settings → `<head>`**:

```html
<script>
  // Paste the full pageFunctions v0.0.3 script here
</script>
```

Place this at the bottom of the page before `</body>`:

```html
<script>
  pageFunctions.runFunctions();
</script>
```

---

### 2. Use Inline Script Tags

You can register any inline logic by calling `pageFunctions.addFunction()` inside a `<script>` tag:

```html
<script>
  pageFunctions.addFunction("workHover", () => {
    const cards = document.querySelectorAll('.work_item');
    cards.forEach(card => {
      card.addEventListener('mouseenter', () => card.classList.add('hover'));
      card.addEventListener('mouseleave', () => card.classList.remove('hover'));
    });
  }, 0); // runs at level 0
</script>
```

---

## 📘 API Reference

### `pageFunctions.addFunction(id, fn, level = 0)`

Registers a uniquely named function to be executed via `pageFunctions.runFunctions()`.

#### Parameters

| Parameter | Type             | Description |
|-----------|------------------|-------------|
| `id`      | `string`         | Unique identifier. Re-registering the same ID overrides the function and resets its execution. |
| `fn`      | `function`       | Your logic to run. Can return a Promise. |
| `level`   | `number \| string` | Optional. Controls execution order. Can be a number or the name of another registered function. |

---

## 🧭 Execution Order: Levels

Functions are grouped by level. All functions in one level run in parallel, and the next level waits for all of them to complete (including `async` ones).

### ✅ You can use numbers:
```js
pageFunctions.addFunction("loadImages", () => { ... }, 0);
pageFunctions.addFunction("startScroll", () => { ... }, 1);
```

### ✅ Or use function names:
```js
pageFunctions.addFunction("initLenis", () => { ... }, 2);

pageFunctions.addFunction("resizeLenis", () => {
  pageFunctions.modules?.lenis?.resize();
}, "initLenis"); // ← This will run one level after "initLenis"
```

If the referenced function name doesn't exist when `.addFunction()` is called, a warning is logged, and the fallback is `level = 0`.

---

## ✅ Best Practices

- Use **level `0`** unless your script **must** wait for something else
- Prefer **named dependencies** (`"afterInit"`) over numeric levels — they’re more maintainable
- Avoid assigning arbitrary large numbers to "make things run later"

---

### `pageFunctions.runFunctions()`

Executes all un-run functions in order of level.

- Runs each level sequentially
- Waits for `Promise`s in each level before continuing
- Safe to call multiple times — it only runs functions that haven’t been executed yet

---

### `pageFunctions.refresh(autoRun = true)`

Rescans the page for new `<script>` tags and executes any that haven’t yet been run.

#### Usage

```js
pageFunctions.refresh();       // Scan and run
pageFunctions.refresh(false); // Scan only
```

- Useful after dynamic page transitions (e.g. CMS filters, Barba.js, Swup)
- Automatically avoids re-running scripts already processed
- Skips any script with `data-prevent-refresh` attribute

---

### Prevent Scripts from Re-running

You can prevent a script from being executed again during `refresh()` by using:

```html
<script data-prevent-refresh>
  pageFunctions.addFunction("introAnimation", () => {
    console.log("Runs once only.");
  }, 0);
</script>
```

---

## 🐞 Debug Mode

### Enabled automatically on `.webflow.io` domains

If your site is on a Webflow staging domain (e.g. `example.webflow.io`), logging is turned on by default.

### Enable manually

```js
pageFunctions.devMode = true;
```

### What it logs:
- Function registrations and their levels
- Script tag execution via `refresh()`
- Level execution steps and completion
- Errors inside registered functions

---

## 🔍 Useful Debug Snippets

```js
Object.keys(pageFunctions.functions); // See all registered functions
Object.keys(pageFunctions.executed);  // See which ones have already run
```

---

## 🛠 Version

**`v0.0.3`**

- ✅ New feature: Named dependency levels (`"afterSomeFunction"`)
- ✅ Refactored `addFunction()` logic for cleaner level resolution
- ✅ Robust logging and dev mode
- ✅ Optional `data-prevent-refresh` to block re-execution
- ✅ No reliance on `window` or shared `modules` — pure execution control
