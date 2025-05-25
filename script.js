(function (global) {
  const DEV = window.location.hostname.includes(".webflow.io");

  global.pageFunctions = {
    version: "0.0.3",
    executed: {},
    functions: {},
    levels: {},
    devMode: DEV,

    log(...args) {
      if (this.devMode) console.log("[pageFunctions]", ...args);
    },

    warn(...args) {
      if (this.devMode) console.warn("[pageFunctions]", ...args);
    },

    addFunction(id, fn, level = 0) {
      if (typeof id !== "string" || typeof fn !== "function") {
        this.warn(`Invalid function registration for "${id}"`);
        return;
      }

      // Resolve level if it's a function ID string
      if (typeof level === "string") {
        const depLevel = this.levels[level];
        if (typeof depLevel === "number") {
          level = depLevel + 1;
        } else {
          this.warn(`Dependency "${level}" not found. Defaulting "${id}" to level 0.`);
          level = 0;
        }
      }

      // Re-registering a function resets execution state
      this.functions[id] = { fn, level };
      this.levels[id] = level;
      this.executed[id] = false;

      this.log(`(Re)registered function "${id}" at level ${level}`);
    },

    async runFunctions() {
      const pending = Object.entries(this.functions).filter(
        ([id]) => !this.executed[id]
      );

      const grouped = pending.reduce((acc, [id, { fn, level }]) => {
        if (!acc[level]) acc[level] = [];
        acc[level].push({ id, fn });
        return acc;
      }, {});

      const sortedLevels = Object.keys(grouped)
        .map(Number)
        .sort((a, b) => a - b);

      for (const level of sortedLevels) {
        this.log(`Running level ${level} with ${grouped[level].length} function(s)`);

        const executions = grouped[level].map(({ id, fn }) => {
          try {
            const result = fn();
            this.executed[id] = true;
            return Promise.resolve(result);
          } catch (e) {
            this.warn(`Error in "${id}":`, e);
            this.executed[id] = true;
            return Promise.resolve(); // Fail gracefully
          }
        });

        await Promise.all(executions);
      }

      this.log("All levels complete.");
    },

    refresh(autoRun = true) {
      this.log(`Refresh started`);
      const scripts = Array.from(document.querySelectorAll("script:not([data-page-fn-executed])"));

      scripts.forEach((script, i) => {
        if (script.dataset.preventRefresh) {
          this.log(`Skipping <script> [${i}] with data-prevent-refresh`);
          script.setAttribute("data-page-fn-executed", "true");
          return;
        }

        const code = script.innerHTML.trim();
        if (!code) {
          this.log(`Skipping empty <script> [${i}]`);
          script.setAttribute("data-page-fn-executed", "true");
          return;
        }

        this.log(`Executing <script> [${i}]`);
        this.log("Code:\n", code);

        try {
          new Function(code)();
          script.setAttribute("data-page-fn-executed", "true");
          this.log(`✓ Executed <script> [${i}]`);
        } catch (e) {
          this.warn(`✗ Error in <script> [${i}]:`, e);
        }
      });

      this.log(`${scripts.length} script(s) processed.`);

      if (autoRun) this.runFunctions();
    }
  };
})(window);
