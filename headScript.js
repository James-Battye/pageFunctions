(function (global) {
  global.pageFunctions = {
    version: '0.0.2',
    executed: {},
    functions: {},
    devMode: window.location.hostname.includes('.webflow.io'),

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
     * (Re)registers a named function and resets execution state
     */
    addFunction(id, fn, level = 0) {
      if (typeof id !== 'string' || typeof fn !== 'function') {
        this.log(`Invalid addFunction call:`, { id, fn });
        return;
      }

      this.log(`(Re)registered function "${id}" at level ${level}`);
      this.functions[id] = { fn, level };
      this.executed[id] = false; // ✅ Always reset so it's re-run if re-added
    },

    /**
     * Runs all unexecuted functions, grouped by level
     */
    async runFunctions() {
      const levels = {};

      for (const id in this.functions) {
        if (!this.executed[id]) {
          const { fn, level } = this.functions[id];
          if (!levels[level]) levels[level] = [];
          levels[level].push({ id, fn });
        }
      }

      if (Object.keys(levels).length === 0) {
        this.log('No new functions to run.');
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

      this.log('All levels complete.');
    },

    /**
     * Refreshes <script> tags and optionally runs any new functions
     * @param {boolean} [autoRun=true] - Whether to run functions automatically
     */
    refresh(autoRun = true) {
      this.group('Refresh started');

      const scriptTags = Array.from(
        document.querySelectorAll('script:not([data-page-fn-executed]):not([data-prevent-refresh])')
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

          script.setAttribute('data-page-fn-executed', 'true');
          this.log(`✓ Executed <script> [${i}]`);
          this.groupEnd();
        } catch (err) {
          console.error(`[pageFunctions] ✗ Error executing <script> [${i}]:`, err);
          this.groupEnd();
        }
      });

      this.log(`Finished. ${scriptTags.length} script(s) processed.`);
      this.groupEnd();

      if (autoRun) {
        this.runFunctions();
      }
    },
  };
})(window);
