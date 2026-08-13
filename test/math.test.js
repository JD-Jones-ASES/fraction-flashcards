const test = require("node:test");
const assert = require("node:assert/strict");
const math = require("../math.js");

function sequenceRng(values) {
  let i = 0;
  return math.createRng(() => {
    const value = values[i % values.length];
    i += 1;
    return value;
  });
}

test("normalizeConfig fills defaults and drops unknown operations", () => {
  const config = math.normalizeConfig({
    operations: ["addition", "laser"],
    range: "nope",
    mode: "telepathy",
  });
  assert.deepEqual(config, {
    operations: ["addition"],
    range: "1-5",
    mode: "missing-result",
  });
});

test("parseRange reads known presets and falls back safely", () => {
  assert.deepEqual(math.parseRange("1-12"), { min: 1, max: 12 });
  assert.deepEqual(math.parseRange("bad"), { min: 1, max: 5 });
});

test("gcd and reduceFraction simplify and keep the sign on the numerator", () => {
  assert.equal(math.gcd(12, 18), 6);
  assert.deepEqual(math.reduceFraction(4, 8), { n: 1, d: 2 });
  assert.deepEqual(math.reduceFraction(-6, 9), { n: -2, d: 3 });
  assert.deepEqual(math.reduceFraction(6, -9), { n: -2, d: 3 });
  assert.deepEqual(math.reduceFraction(0, 8), { n: 0, d: 1 });
});

test("fraction arithmetic matches reduced exact values", () => {
  assert.deepEqual(math.addFractions({ n: 1, d: 2 }, { n: 1, d: 3 }), { n: 5, d: 6 });
  assert.deepEqual(math.subtractFractions({ n: 3, d: 4 }, { n: 1, d: 2 }), { n: 1, d: 4 });
  assert.deepEqual(math.multiplyFractions({ n: 2, d: 3 }, { n: 3, d: 5 }), { n: 2, d: 5 });
  assert.deepEqual(math.divideFractions({ n: 2, d: 3 }, { n: 4, d: 5 }), { n: 5, d: 6 });
});

test("fractionsEqual treats equivalent unreduced forms as the same", () => {
  assert.equal(math.fractionsEqual({ n: 2, d: 4 }, { n: 1, d: 2 }), true);
  assert.equal(math.fractionsEqual({ n: 3, d: 6 }, { n: 2, d: 5 }), false);
  assert.equal(math.formatFraction({ n: -2, d: 4 }), "−1/2");
});

test("addition missing-result uses denominators in range", () => {
  const rng = sequenceRng([0, 0, 0, 0.999, 0.999]);
  const question = math.generateQuestion(
    { operations: ["addition"], range: "1-5", mode: "missing-result" },
    rng
  );
  assert.equal(question.operation, "addition");
  assert.equal(question.symbol, "+");
  assert.equal(question.hidden, "result");
  assert.ok(question.a.d >= 1 && question.a.d <= 5);
  assert.ok(question.b.d >= 1 && question.b.d <= 5);
  assert.deepEqual(
    math.addFractions(question.a, question.b),
    math.reduceFraction(question.result.n, question.result.d)
  );
  assert.deepEqual(question.answer, math.reduceFraction(question.result.n, question.result.d));
});

test("subtraction never goes negative", () => {
  for (let i = 0; i < 60; i += 1) {
    const question = math.generateQuestion({
      operations: ["subtraction"],
      range: "1-15",
      mode: "missing-result",
    });
    assert.ok(math.compareFractions(question.result, { n: 0, d: 1 }) >= 0);
    assert.deepEqual(
      math.subtractFractions(question.a, question.b),
      math.reduceFraction(question.result.n, question.result.d)
    );
  }
});

test("division never uses a zero divisor", () => {
  for (let i = 0; i < 40; i += 1) {
    const question = math.generateQuestion({
      operations: ["division"],
      range: "1-12",
      mode: "missing-result",
    });
    assert.notEqual(question.b.n, 0);
    assert.deepEqual(
      math.divideFractions(question.a, question.b),
      math.reduceFraction(question.result.n, question.result.d)
    );
  }
});

test("missing operand asks for a or b and inverts the operation", () => {
  const seen = new Set();
  for (let i = 0; i < 40; i += 1) {
    const question = math.generateQuestion({
      operations: ["multiplication"],
      range: "1-5",
      mode: "missing-operand",
    });
    seen.add(question.hidden);
    assert.ok(question.hidden === "a" || question.hidden === "b");
    const rebuilt = math.multiplyFractions(question.a, question.b);
    assert.equal(math.fractionsEqual(rebuilt, question.result), true);
    assert.equal(math.fractionsEqual(question.answer, question[question.hidden]), true);
  }
  assert.deepEqual([...seen].sort(), ["a", "b"]);
});

test("missing operand for subtraction recovers the hidden fraction", () => {
  for (let i = 0; i < 30; i += 1) {
    const question = math.generateQuestion({
      operations: ["subtraction"],
      range: "1-10",
      mode: "missing-operand",
    });
    if (question.hidden === "a") {
      assert.deepEqual(math.addFractions(question.result, question.b), math.reduceFraction(question.a.n, question.a.d));
    } else {
      assert.deepEqual(math.subtractFractions(question.a, question.result), math.reduceFraction(question.b.n, question.b.d));
    }
  }
});

test("parseFractionInput and checkAnswer accept equivalent fractions", () => {
  assert.deepEqual(math.parseFractionInput("2", "4"), { ok: true, value: { n: 1, d: 2 } });
  assert.equal(math.parseFractionInput("3", "0").ok, false);
  assert.equal(math.parseFractionInput("3", "0").zeroDenominator, true);
  assert.equal(math.parseFractionInput("1.5", "2").ok, false);

  const question = { answer: { n: 1, d: 2 } };
  assert.deepEqual(math.checkAnswer(question, "1", "2"), {
    valid: true,
    correct: true,
    value: { n: 1, d: 2 },
  });
  assert.equal(math.checkAnswer(question, "2", "4").correct, true);
  assert.equal(math.checkAnswer(question, "3", "4").correct, false);
  assert.equal(math.checkAnswer(question, "nope", "2").valid, false);
});

test("formatElapsed and accuracyPercent", () => {
  assert.equal(math.formatElapsed(0), "00:00");
  assert.equal(math.formatElapsed(65000), "01:05");
  assert.equal(math.accuracyPercent(0, 0), 100);
  assert.equal(math.accuracyPercent(3, 4), 75);
});

test("barModel splits wholes from leftover parts", () => {
  assert.deepEqual(math.barModel({ n: 3, d: 4 }), {
    negative: false,
    wholes: 0,
    leftover: 3,
    parts: 4,
    improper: false,
  });
  assert.deepEqual(math.barModel({ n: 5, d: 3 }), {
    negative: false,
    wholes: 1,
    leftover: 2,
    parts: 3,
    improper: true,
  });
});
