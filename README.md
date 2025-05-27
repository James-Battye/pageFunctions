# 🧠 pageFunctions

A lightweight JavaScript lifecycle manager for component-based websites. Designed for environments like Webflow where script loading and timing can get messy.

It gives you a reliable way to define, organize, and execute JavaScript logic across dynamic page transitions, CMS-driven changes, or other client-side mutations — without external tools or frameworks.

---

## 🚀 How to Use It

### 1. Add the Script

Place this in the **Webflow Project Settings → `<head>`**:

```html
<script>
(function (global) {
  global.pageFunctions = {
    version: '0.0.2',
    executed: {},
    functions: {},
    initialised: false,
    devMode: false, //  window.location.hostname.includes('.webflow.io')

    // Dev logging tools
    log(...args) {
      if (this.devMode) console.log('[pageFunctions]', ...args);
    },
    group(...args) {
      if (this.devMode) console.group(`[pageFunctions v${this.version}]`, ...args);
    },
    groupEnd() {
      if (this.devMode) console.groupEnd();
    },

    /**
     * Resolves a level value, handling both numeric and string references
     * @param {number|string} level - The level value or reference to another function
     * @returns {number} The resolved level
     */
    resolveLevel(level) {
      if (typeof level === 'number') return level;
      if (typeof level === 'string') {
        const referencedFn = this.functions[level];
        if (!referencedFn) {
          this.log(`Warning: Referenced function "${level}" not found, defaulting to level 0`);
          return 0;
        }
        return referencedFn.level + 1;
      }
      return 0;
    },

    /**
     * (Re)registers a named function and resets execution state
     */
    addFunction(id, fn, level = 0) {
      if (typeof id !== 'string' || typeof fn !== 'function') {
        this.log(`Invalid addFunction call:`, { id, fn });
        return;
      }

      const resolvedLevel = this.resolveLevel(level);
      this.log(
        `(Re)registered function "${id}" at level ${resolvedLevel}${typeof level === 'string' ? ` (after "${level}")` : ''}`
      );
      this.functions[id] = { fn, level: resolvedLevel };
      this.executed[id] = false; // ✅ Always reset so it's re-run if re-added
    },

    /**
     * Runs all unexecuted functions, grouped by level
     * @param {HTMLElement} [element] - Optional element to re-execute functions within
     */
    async runFunctions(element) {
      const levels = {};

      if (element) {
        this.group(
          `Running functions within element: ${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ''}${element.className ? `.${element.className}` : ''}`
        );
      } else {
        this.group('Running all functions');
      }

      for (const id in this.functions) {
        if (!this.executed[id]) {
          const { fn, level } = this.functions[id];

          // If element is provided, only run functions that were defined within it
          if (element) {
            const scripts = element.querySelectorAll('script');
            let found = false;
            for (const script of scripts) {
              if (script.innerHTML.includes(`pageFunctions.addFunction("${id}"`)) {
                found = true;
                break;
              }
            }
            if (!found) continue;
          }

          if (!levels[level]) levels[level] = [];
          levels[level].push({ id, fn });
        }
      }

      if (Object.keys(levels).length === 0) {
        this.log('No new functions to run.');
        this.groupEnd();
        return;
      }

      const orderedLevels = Object.keys(levels)
        .map(Number)
        .sort((a, b) => a - b);

      for (const lvl of orderedLevels) {
        const group = levels[lvl];
        this.group(`Running level ${lvl} with ${group.length} function(s)`);

        const promises = group.map(({ id, fn }) => {
          return new Promise((resolve) => {
            try {
              const result = fn();
              if (result instanceof Promise) {
                result
                  .then(() => {
                    this.executed[id] = true;
                    resolve();
                  })
                  .catch((err) => {
                    console.error(`[pageFunctions] Error in "${id}":`, err);
                    resolve();
                  });
              } else {
                this.executed[id] = true;
                resolve();
              }
            } catch (err) {
              console.error(`[pageFunctions] Error in "${id}":`, err);
              resolve();
            }
          });
        });

        await Promise.all(promises);
        this.groupEnd();
      }

      this.initialised = true;
      this.log('All levels complete.');
      this.groupEnd();
    },

    /**
     * Refreshes <script> tags and optionally runs any new functions
     * @param {boolean} [autoRun=true] - Whether to run functions automatically
     */
    refresh(autoRun = true, domElement = document) {
      this.group('Refresh started');

      const scriptTags = Array.from(
        domElement.querySelectorAll(
          'script:not([data-page-fn-executed]):not([data-prevent-refresh])'
        )
      );

      if (!scriptTags.length) {
        this.log('No new <script> tags found to execute.');
        this.groupEnd();
        return;
      }

      scriptTags.forEach((script, i) => {
        try {
          const code = script.innerHTML.trim();
          if (code.length === 0) {
            this.log(`Skipping empty <script> [${i}]`);
            return;
          }

          this.group(`Executing <script> [${i}]`);
          this.log('Code:\n', code.length > 200 ? code.slice(0, 200) + '...' : code);

          eval(code);

          this.log(`✓ Executed <script> [${i}]`);
          this.groupEnd();
        } catch (err) {
          console.error(`[pageFunctions] ✗ Error executing <script> [${i}]:`, err);
          this.groupEnd();
        }
      });

      this.log(`Finished. ${scriptTags.length} script(s) processed.`);
      this.groupEnd();
    },
  };
})(window);
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

**`v0.0.2`**

- ✅ New feature: Named dependency levels (`"afterSomeFunction"`)
- ✅ Refactored `addFunction()` logic for cleaner level resolution
- ✅ Robust logging and dev mode
- ✅ Optional `data-prevent-refresh` to block re-execution
- ✅ No reliance on `window` or shared `modules` — pure execution control
