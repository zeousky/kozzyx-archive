const sumsForm = document.querySelector("#sums-form");
const sumsResult = document.querySelector("#sums-result");
const digitFields = [...sumsForm.querySelectorAll("input")];
const rowTotals = [12, 14, 19];
const columnTotals = [13, 11, 21];

function showResult(status, text, tone = "plain") {
  status.dataset.tone = tone;
  status.textContent = text;
}

digitFields.forEach((field) => {
  field.addEventListener("input", () => {
    field.value = field.value.replace(/[^1-9]/g, "");
    showResult(sumsResult, "");
  });
});

sumsForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const rows = [...sumsForm.querySelectorAll("tr:not(.column-totals)")].map((row) =>
    [...row.querySelectorAll("td")].map((cell) =>
      Number(cell.querySelector("input")?.value ?? cell.textContent)
    )
  );
  const digits = rows.flat();
  if (digits.includes(0)) {
    showResult(sumsResult, "Fill in all seven squares first.", "error");
    return;
  }
  if (new Set(digits).size !== 9) {
    showResult(sumsResult, "Use each number exactly once.", "error");
    return;
  }

  const wrongRow = rows.findIndex((row, i) => row.reduce((total, value) => total + value, 0) !== rowTotals[i]);
  if (wrongRow >= 0) {
    showResult(sumsResult, `Row ${wrongRow + 1} should add up to ${rowTotals[wrongRow]}.`, "error");
    return;
  }
  const wrongColumn = columnTotals.findIndex((total, i) => rows.reduce((sum, row) => sum + row[i], 0) !== total);
  if (wrongColumn >= 0) {
    showResult(sumsResult, `Column ${wrongColumn + 1} should add up to ${columnTotals[wrongColumn]}.`, "error");
    return;
  }
  showResult(sumsResult, "Every total checks out.");
});

sumsForm.addEventListener("reset", () => showResult(sumsResult, ""));

const ladderForm = document.querySelector("#ladder-form");
const ladderResult = document.querySelector("#ladder-result");
const rungs = [...ladderForm.querySelectorAll("input")];
const answers = ["FINE", "LINE", "LONE", "LOSE"];

rungs.forEach((field) => {
  field.addEventListener("input", () => {
    field.value = field.value.replace(/[^a-z]/gi, "");
    showResult(ladderResult, "");
  });
});

ladderForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const words = rungs.map((field) => field.value.toUpperCase());
  if (words.some((word) => word.length !== 4)) {
    showResult(ladderResult, "Fill each rung with a four-letter word.", "error");
    return;
  }

  const path = ["FIND", ...words, "LOST"];
  const stuckAt = path.slice(1).findIndex((word, i) =>
    [...word].filter((letter, position) => letter !== path[i][position]).length !== 1
  );
  if (stuckAt >= 0) {
    showResult(ladderResult, `Change exactly one letter from ${path[stuckAt]} to ${path[stuckAt + 1]}.`, "error");
    return;
  }

  const wrongAnswer = words.findIndex((word, i) => word !== answers[i]);
  if (wrongAnswer >= 0) {
    showResult(ladderResult, `Take another look at the clue for blank ${wrongAnswer + 1}.`, "error");
    return;
  }
  showResult(ladderResult, "All four rungs fit.");
});

ladderForm.addEventListener("reset", () => showResult(ladderResult, ""));

const bridgeBoard = document.querySelector(".bridge-board");
const bridgeResult = document.querySelector("#bridge-result");
const bridgeHistory = document.querySelector(".bridge-history");
const canvas = bridgeBoard.querySelector("canvas");
const ink = canvas.getContext("2d");
const leftBank = [...bridgeBoard.querySelectorAll('[data-bank="left"]')];
const rightBank = [...bridgeBoard.querySelectorAll('[data-bank="right"]')];
const allDots = [...leftBank, ...rightBank];
const bridges = [];
let firstDot = null;
let player = 1;
let finished = false;

function crossesBridge(left, right) {
  const leftIndex = Number(left.dataset.dot);
  const rightIndex = Number(right.dataset.dot);
  return bridges.some((bridge) => {
    const leftDistance = leftIndex - Number(bridge.left.dataset.dot);
    const rightDistance = rightIndex - Number(bridge.right.dataset.dot);
    return leftDistance * rightDistance < 0;
  });
}

function drawBridges() {
  const bounds = canvas.getBoundingClientRect();
  const scale = window.devicePixelRatio || 1;
  canvas.width = Math.round(bounds.width * scale);
  canvas.height = Math.round(bounds.height * scale);
  ink.scale(scale, scale);
  ink.lineWidth = 2;
  ink.lineCap = "round";

  for (const bridge of bridges) {
    const start = bridge.left.getBoundingClientRect();
    const end = bridge.right.getBoundingClientRect();
    ink.strokeStyle = bridge.player === 1 ? "#344a3c" : "#8d372e";
    ink.setLineDash(bridge.player === 1 ? [] : [4, 4]);
    ink.beginPath();
    ink.moveTo(start.left - bounds.left + start.width / 2, start.top - bounds.top + start.height / 2);
    ink.lineTo(end.left - bounds.left + end.width / 2, end.top - bounds.top + end.height / 2);
    ink.stroke();
  }
}

function chooseFirst(dot) {
  firstDot?.setAttribute("aria-pressed", "false");
  firstDot = dot;
  if (!dot) {
    showResult(bridgeResult, `Player ${player}, choose an open dot on either bank.`);
    return;
  }
  dot.setAttribute("aria-pressed", "true");
  const nextBank = dot.dataset.bank === "left" ? "right" : "left";
  showResult(bridgeResult, `Player ${player}, choose a dot on the ${nextBank} bank.`);
}

function chooseDot(dot, fromKeyboard) {
  if (finished || dot.disabled) return;
  if (dot === firstDot) {
    chooseFirst(null);
    return;
  }
  if (!firstDot || firstDot.dataset.bank === dot.dataset.bank) {
    chooseFirst(dot);
    return;
  }

  const left = dot.dataset.bank === "left" ? dot : firstDot;
  const right = dot.dataset.bank === "right" ? dot : firstDot;
  if (crossesBridge(left, right)) {
    showResult(bridgeResult, "That would cross a bridge. Try a different dot.", "error");
    return;
  }

  bridges.push({ left, right, player });
  const move = document.createElement("li");
  move.textContent = `Player ${player} joined left dot ${left.dataset.dot} to right dot ${right.dataset.dot}.`;
  bridgeHistory.append(move);
  left.disabled = true;
  right.disabled = true;
  drawBridges();

  const movesRemain = leftBank.some((a) => !a.disabled && rightBank.some((b) => !b.disabled && !crossesBridge(a, b)));
  if (!movesRemain) {
    finished = true;
    firstDot.setAttribute("aria-pressed", "false");
    firstDot = null;
    showResult(bridgeResult, `Player ${player} wins. That was the last bridge.`);
    if (fromKeyboard) document.querySelector("#bridge-reset").focus();
    return;
  }

  const otherDots = dot.dataset.bank === "left" ? rightBank : leftBank;
  if (fromKeyboard) otherDots.find((point) => !point.disabled)?.focus();
  player = player === 1 ? 2 : 1;
  chooseFirst(null);
}

for (const dot of allDots) {
  dot.addEventListener("click", (event) => chooseDot(dot, event.detail === 0));
}
document.querySelector("#bridge-reset").addEventListener("click", () => {
  bridges.length = 0;
  bridgeHistory.replaceChildren();
  for (const dot of allDots) dot.disabled = false;
  player = 1;
  finished = false;
  chooseFirst(null);
  drawBridges();
});
new ResizeObserver(drawBridges).observe(bridgeBoard);

for (const printButton of document.querySelectorAll("[data-print]")) {
  printButton.hidden = false;
  printButton.addEventListener("click", () => window.print());
}
