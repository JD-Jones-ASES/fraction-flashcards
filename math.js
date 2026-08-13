/**
 * Fraction generation, arithmetic, and answer checking for Fraction Sakura.
 * Works in the browser (global FractionMath) and in Node (module.exports).
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.FractionMath = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const OPERATIONS = {
    addition: { id: "addition", label: "Addition", symbol: "+", blurb: "Sum two fractions" },
    subtraction: { id: "subtraction", label: "Subtraction", symbol: "−", blurb: "Keep the difference non-negative" },
    multiplication: { id: "multiplication", label: "Multiplication", symbol: "×", blurb: "Multiply across" },
    division: { id: "division", label: "Division", symbol: "÷", blurb: "Multiply by the reciprocal" },
  };

  const RANGES = [
    { id: "1-5", label: "1–5", blurb: "Gentle start", min: 1, max: 5 },
    { id: "1-10", label: "1–10", blurb: "Everyday denominators", min: 1, max: 10 },
    { id: "1-12", label: "1–12", blurb: "Clock-face factors", min: 1, max: 12 },
    { id: "1-15", label: "1–15", blurb: "Wider LCD practice", min: 1, max: 15 },
  ];

  const MODES = [
    {
      id: "missing-result",
      label: "Missing result",
      example: "1/2 + 1/3 = ?",
    },
    {
      id: "missing-operand",
      label: "Missing operand",
      example: "? × 2/5 = 4/5",
    },
    {
      id: "both",
      label: "Mixed",
      example: "Either type",
    },
  ];

  const DEFAULT_CONFIG = {
    operations: ["addition"],
    range: "1-5",
    mode: "missing-result",
  };

  function createRng(random = Math.random) {
    function unit() {
      const value = random();
      if (value >= 1) {
        return 0.999999999999;
      }
      if (value < 0) {
        return 0;
      }
      return value;
    }

    return {
      int(min, max) {
        if (max < min) {
          const swap = min;
          min = max;
          max = swap;
        }
        return Math.floor(unit() * (max - min + 1)) + min;
      },
      pick(list) {
        return list[Math.floor(unit() * list.length)];
      },
      unit,
    };
  }

  function gcd(a, b) {
    a = Math.abs(a);
    b = Math.abs(b);
    while (b !== 0) {
      const next = a % b;
      a = b;
      b = next;
    }
    return a || 1;
  }

  function reduceFraction(numerator, denominator) {
    const n = Number(numerator);
    const d = Number(denominator);
    if (!Number.isFinite(n) || !Number.isFinite(d) || d === 0) {
      throw new Error("Invalid fraction");
    }
    const sign = n === 0 ? 1 : (n < 0) !== (d < 0) ? -1 : 1;
    const divisor = gcd(n, d);
    return {
      n: sign * (Math.abs(n) / divisor),
      d: Math.abs(d) / divisor,
    };
  }

  function fraction(n, d) {
    return reduceFraction(n, d);
  }

  function cloneFraction(value) {
    return { n: value.n, d: value.d };
  }

  function addFractions(a, b) {
    return reduceFraction(a.n * b.d + b.n * a.d, a.d * b.d);
  }

  function subtractFractions(a, b) {
    return reduceFraction(a.n * b.d - b.n * a.d, a.d * b.d);
  }

  function multiplyFractions(a, b) {
    return reduceFraction(a.n * b.n, a.d * b.d);
  }

  function divideFractions(a, b) {
    if (b.n === 0) {
      throw new Error("Division by zero");
    }
    return reduceFraction(a.n * b.d, a.d * b.n);
  }

  function applyOperation(operation, a, b) {
    switch (operation) {
      case "addition":
        return addFractions(a, b);
      case "subtraction":
        return subtractFractions(a, b);
      case "multiplication":
        return multiplyFractions(a, b);
      case "division":
        return divideFractions(a, b);
      default:
        throw new Error("Unknown operation: " + operation);
    }
  }

  function fractionsEqual(a, b) {
    const left = reduceFraction(a.n, a.d);
    const right = reduceFraction(b.n, b.d);
    return left.n === right.n && left.d === right.d;
  }

  function compareFractions(a, b) {
    return a.n * b.d - b.n * a.d;
  }

  function formatFraction(value) {
    const reduced = reduceFraction(value.n, value.d);
    const sign = reduced.n < 0 ? "−" : "";
    return sign + Math.abs(reduced.n) + "/" + reduced.d;
  }

  function parseRange(rangeId) {
    const found = RANGES.find((range) => range.id === rangeId);
    if (found) {
      return { min: found.min, max: found.max };
    }
    const match = /^(\d+)-(\d+)$/.exec(String(rangeId || ""));
    if (!match) {
      return { min: 1, max: 5 };
    }
    const min = Number(match[1]);
    const max = Number(match[2]);
    if (!Number.isInteger(min) || !Number.isInteger(max) || min < 1 || max < min) {
      return { min: 1, max: 5 };
    }
    return { min, max };
  }

  function normalizeConfig(raw) {
    const input = raw && typeof raw === "object" ? raw : {};
    const allowedOps = Object.keys(OPERATIONS);
    const operations = (Array.isArray(input.operations) ? input.operations : [])
      .filter((op) => allowedOps.includes(op));
    const range = RANGES.some((item) => item.id === input.range)
      ? input.range
      : DEFAULT_CONFIG.range;
    const mode = MODES.some((item) => item.id === input.mode)
      ? input.mode
      : DEFAULT_CONFIG.mode;

    return {
      operations: operations.length ? operations : [...DEFAULT_CONFIG.operations],
      range,
      mode,
    };
  }

  function generateFraction(minDenom, maxDenom, rng) {
    const d = rng.int(minDenom, maxDenom);
    const n = rng.int(1, d * 2);
    return { n, d };
  }

  function pickHidden(mode, rng) {
    if (mode === "missing-result") {
      return "result";
    }
    if (mode === "missing-operand") {
      return rng.unit() < 0.5 ? "a" : "b";
    }
    if (rng.unit() < 0.5) {
      return "result";
    }
    return rng.unit() < 0.5 ? "a" : "b";
  }

  function answerFor(hidden, parts) {
    if (hidden === "a") {
      return cloneFraction(parts.a);
    }
    if (hidden === "b") {
      return cloneFraction(parts.b);
    }
    return cloneFraction(parts.result);
  }

  function sameQuestion(left, right) {
    return (
      left &&
      right &&
      left.operation === right.operation &&
      left.hidden === right.hidden &&
      fractionsEqual(left.a, right.a) &&
      fractionsEqual(left.b, right.b)
    );
  }

  function generateOperands(operation, min, max, rng) {
    let a = generateFraction(min, max, rng);
    let b = generateFraction(min, max, rng);

    if (operation === "subtraction" && compareFractions(a, b) < 0) {
      const swap = a;
      a = b;
      b = swap;
    }

    if (operation === "division") {
      while (b.n === 0) {
        b = generateFraction(min, max, rng);
      }
    }

    const result = applyOperation(operation, a, b);
    return { a, b, result };
  }

  function generateQuestion(config, rng = createRng(), previous = null) {
    const normalized = normalizeConfig(config);
    const { min, max } = parseRange(normalized.range);
    let question = null;

    for (let attempt = 0; attempt < 8; attempt += 1) {
      const operation = rng.pick(normalized.operations);
      const parts = generateOperands(operation, min, max, rng);
      const hidden = pickHidden(normalized.mode, rng);
      const rawAnswer = answerFor(hidden, parts);
      const answer = reduceFraction(rawAnswer.n, rawAnswer.d);
      question = {
        operation,
        symbol: OPERATIONS[operation].symbol,
        a: parts.a,
        b: parts.b,
        result: parts.result,
        hidden,
        answer,
      };
      if (!sameQuestion(question, previous)) {
        break;
      }
    }

    return question;
  }

  function parseInteger(raw) {
    const text = String(raw ?? "").trim();
    if (!/^-?\d+$/.test(text)) {
      return { ok: false };
    }
    const value = Number(text);
    if (!Number.isSafeInteger(value)) {
      return { ok: false };
    }
    return { ok: true, value };
  }

  function parseFractionInput(numeratorRaw, denominatorRaw) {
    const nPart = parseInteger(numeratorRaw);
    const dPart = parseInteger(denominatorRaw);
    if (!nPart.ok || !dPart.ok) {
      return { ok: false };
    }
    if (dPart.value === 0) {
      return { ok: false, zeroDenominator: true };
    }
    return {
      ok: true,
      value: reduceFraction(nPart.value, dPart.value),
    };
  }

  function checkAnswer(question, numeratorRaw, denominatorRaw) {
    const parsed = parseFractionInput(numeratorRaw, denominatorRaw);
    if (!parsed.ok) {
      return { valid: false, correct: false, zeroDenominator: Boolean(parsed.zeroDenominator) };
    }
    return {
      valid: true,
      correct: fractionsEqual(parsed.value, question.answer),
      value: parsed.value,
    };
  }

  function formatElapsed(ms) {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return String(minutes).padStart(2, "0") + ":" + String(seconds).padStart(2, "0");
  }

  function accuracyPercent(correct, total) {
    if (total <= 0) {
      return 100;
    }
    return Math.round((correct / total) * 100);
  }

  function barModel(frac) {
    const reduced = { n: frac.n, d: frac.d };
    const wholes = Math.floor(Math.abs(reduced.n) / reduced.d);
    const leftover = Math.abs(reduced.n) % reduced.d;
    return {
      negative: reduced.n < 0,
      wholes,
      leftover,
      parts: reduced.d,
      improper: Math.abs(reduced.n) >= reduced.d,
    };
  }

  return {
    OPERATIONS,
    RANGES,
    MODES,
    DEFAULT_CONFIG,
    createRng,
    gcd,
    reduceFraction,
    fraction,
    addFractions,
    subtractFractions,
    multiplyFractions,
    divideFractions,
    applyOperation,
    fractionsEqual,
    compareFractions,
    formatFraction,
    parseRange,
    normalizeConfig,
    generateQuestion,
    parseInteger,
    parseFractionInput,
    checkAnswer,
    formatElapsed,
    accuracyPercent,
    barModel,
  };
});
