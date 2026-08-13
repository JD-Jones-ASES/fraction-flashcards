# Fraction Sakura

A small, dependency-free fraction trainer in the browser. Pick operations, a denominator range, and whether the missing value is the result, an operand, or a mix. Then work in a quiet sakura garden until you end the session.

This is a rebuild of an older two-page prototype. The concept is the same; the implementation is a single-page app with shared math logic, visual fraction bars, keyboard-friendly controls, and no third-party services.

## Practice

Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8080
```

Then visit `http://localhost:8080`.

1. Select one or more operations: addition, subtraction, multiplication, division.
2. Choose a denominator range (`1–5` through `1–15`). Denominators are at least 2. Numerators may be larger than the denominator, so improper fractions appear.
3. Choose a question type:
   - **Missing result** — `1/2 + 1/3 = ?`
   - **Missing operand** — `? × 2/5 = 4/5`
   - **Mixed** — either form
4. Start the session, enter a numerator and denominator, and press Enter.
5. Equivalent fractions count. `2/4` is accepted for `1/2`.
6. After an incorrect answer, the simplified value is shown. Press Enter (or Next) to continue.
7. Escape or **End session** opens a short summary.

Dawn and dusk palettes, plus last-used settings, stay in `localStorage` on that browser. Nothing is sent anywhere.

## Files

```
index.html      Setup, practice, and summary views
app.js          UI and session flow
math.js         Fraction arithmetic, generation, and scoring
styles.css      Layout and sakura garden theme
favicon.svg     App icon
test/           Node tests for math.js
```

Subtraction stays non-negative. Answers are checked after reducing both the student entry and the true value, so unreduced equivalents are marked correct.

## Tests

Node 18+ is enough. No install step.

```bash
npm test
```

## License

MIT License. Copyright (c) 2025-2026 JD Jones. See [LICENSE](LICENSE).
