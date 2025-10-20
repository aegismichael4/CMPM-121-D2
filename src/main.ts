import "./style.css";

document.body.innerHTML = `
  <center><h1>Sticker Sketchpad!!!</h1><center>
  <center><canvas id="canvas" width="256px" height="256px""></canvas></center>
  <br></br>
  <center><button id="clear">clear</button> <button id="undo">undo</button>
    <button id="redo">redo</button></center>
  <br></br>
  <center><p>tool:</p></center>
  <center> <button id="pencil">✏️</button> | <button id="heart-sticker">❤️</button> <button id="lightning-sticker">⚡</button> <button id="saturn-sticker">🪐</button> </center>
  <br></br>
  <center> <button id="line-width-down">v</button> <button id="line-width-up">^</button>
    <p> size: <span id="curr-line-width">1</span>px</p></center>
`;

// ------------------------------------------------------------------------------------------------------------------------------------------------
//#region HTML ELEMENTS
// ------------------------------------------------------------------------------------------------------------------------------------------------

// canvas
const canvas: HTMLCanvasElement = document.getElementById(
  "canvas",
) as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;
ctx.textAlign = "center";

// clear/undo/redo
const clear = document.getElementById("clear")!;
const undo = document.getElementById("undo")!;
const redo = document.getElementById("redo")!;

// tool selection
const pencil: HTMLButtonElement = document.getElementById(
  "pencil",
) as HTMLButtonElement;
const heart: HTMLButtonElement = document.getElementById(
  "heart-sticker",
) as HTMLButtonElement;
const lightning: HTMLButtonElement = document.getElementById(
  "lightning-sticker",
) as HTMLButtonElement;
const saturn: HTMLButtonElement = document.getElementById(
  "saturn-sticker",
) as HTMLButtonElement;

// tool size
const lineWidthDown: HTMLButtonElement = document.getElementById(
  "line-width-down",
) as HTMLButtonElement;
const lineWidthUp: HTMLButtonElement = document.getElementById(
  "line-width-up",
) as HTMLButtonElement;
const lineWidthDisplay = document.getElementById("curr-line-width")!;

//#endregion

// ------------------------------------------------------------------------------------------------------------------------------------------------
//#region EVENT SYSTEM
// ------------------------------------------------------------------------------------------------------------------------------------------------

const bus: EventTarget = new EventTarget();

function notify(name: string) {
  bus.dispatchEvent(new Event(name));
}

bus.addEventListener("drawing-changed", () => {
  redraw();
});

bus.addEventListener("tool-moved", () => {
  redraw();
});

//#endregion

// ------------------------------------------------------------------------------------------------------------------------------------------------
//#region DRAWING LOGIC
// ------------------------------------------------------------------------------------------------------------------------------------------------

type Point = { x: number; y: number };

const commands: Command[] = [];
const redoCommands: Command[] = [];

class Command {
  constructor() {}

  drag(x: number, y: number): void {}
  display(ctx: CanvasRenderingContext2D): void {}
}

class LineCommand extends Command {
  points: Point[] = [];
  lineWidth: number;

  constructor(x: number, y: number) {
    super();
    this.points = [{ x, y }];
    this.lineWidth = currLineWidth;
  }

  override display(ctx: CanvasRenderingContext2D): void {
    if (this.points.length < 1) return;

    ctx.lineWidth = this.lineWidth;
    ctx.beginPath();
    ctx.moveTo(this.points[0].x, this.points[0].y);

    this.points.forEach((point: Point) => ctx.lineTo(point.x, point.y));

    ctx.stroke();
  }

  override drag(x: number, y: number): void {
    this.points.push({ x, y });
  }
}

class ToolPreviewCommand extends Command {
  radius: number;
  x: number;
  y: number;

  constructor(radius: number, x: number, y: number) {
    super();
    this.radius = Math.ceil(radius / 2);
    this.x = x;
    this.y = y;
  }

  override drag(x: number, y: number): void {
    this.x = x;
    this.y = y;
  }

  override display(ctx: CanvasRenderingContext2D): void {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
    ctx.fill();
  }
}

class StickerCommand extends Command {
  sticker: string;
  x: number;
  y: number;
  size: number;

  constructor(sticker: string, x: number, y: number, size: number) {
    super();
    this.sticker = sticker;
    this.x = x;
    this.y = y + 15;
    this.size = size * 10;
  }

  override drag(x: number, y: number): void {
    this.x = x;
    this.y = y + 15;
  }

  override display(ctx: CanvasRenderingContext2D): void {
    ctx.beginPath();
    ctx.font = `${this.size}px serif`;
    ctx.fillText(this.sticker, this.x, this.y);
  }
}

function redraw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  commands.forEach((command: Command) => command.display(ctx));

  if (toolPreview && !cursorDownFlag) toolPreview.display(ctx);
}

//#endregion

// ------------------------------------------------------------------------------------------------------------------------------------------------
//#region MOUSE LOGIC
// ------------------------------------------------------------------------------------------------------------------------------------------------

type Nullable<T> = T | null;

let cursorDownFlag: boolean = false;

let currentLineCommand: Command;
let toolPreview: Nullable<Command> = null;

canvas.addEventListener("mousedown", (e) => {
  currentLineCommand = createLine(e.offsetX, e.offsetY);
  commands.push(currentLineCommand);

  cursorDownFlag = true;
});

canvas.addEventListener("mouseup", () => {
  cursorDownFlag = false;
});

canvas.addEventListener("mouseleave", (e) => {
  if (cursorDownFlag) {
    currentLineCommand.drag(e.offsetX, e.offsetY);
  }

  toolPreview = null;
  notify("drawing-changed");
});

canvas.addEventListener("mouseenter", (e) => {
  if (cursorDownFlag) {
    currentLineCommand = createLine(e.offsetX, e.offsetY);
    commands.push(currentLineCommand);

    notify("drawing-changed");
  }

  toolPreview = createToolPreview(e.offsetX, e.offsetY);
  notify("tool-moved");
});

canvas.addEventListener("mousemove", (e) => {
  if (cursorDownFlag) {
    currentLineCommand.drag(e.offsetX, e.offsetY);
    notify("drawing-changed");
  } else {
    if (toolPreview) toolPreview.drag(e.offsetX, e.offsetY);
    notify("tool-moved");
  }
});

document.addEventListener("mouseup", () => {
  cursorDownFlag = false;
});

document.addEventListener("mousedown", () => {
  cursorDownFlag = true;
});

//#endregion

// ------------------------------------------------------------------------------------------------------------------------------------------------
//#region CLEAR/UNDO/REDO LOGIC
// ------------------------------------------------------------------------------------------------------------------------------------------------

//button listeners
clear.addEventListener("click", () => {
  commands.splice(0, commands.length);

  notify("drawing-changed");
});

undo.addEventListener("click", () => {
  undoCommand();
});

redo.addEventListener("click", () => {
  redoCommand();
});

// undo/redo functionality
function undoCommand() {
  if (commands.length < 1) return;

  redoCommands.push(commands.pop() as LineCommand);
  notify("drawing-changed");
}

function redoCommand() {
  if (redoCommands.length < 1) return;

  commands.push(redoCommands.pop() as LineCommand);
  notify("drawing-changed");
}

//undo keys
let ctrlDown: boolean = false;

document.addEventListener("keydown", (e) => {
  const key: string = (e as KeyboardEvent).key;

  console.log(key);

  switch (key) {
    case "Control":
      ctrlDown = true;
      break;
    case "z":
      if (ctrlDown) undoCommand();
      break;
    case "y":
      if (ctrlDown) redoCommand();
      break;
  }
});

document.addEventListener("keyup", (e) => {
  if ((e as KeyboardEvent).key === "Control") {
    ctrlDown = false;
  }
});

//#endregion

// ------------------------------------------------------------------------------------------------------------------------------------------------
//#region TOOL SELECTION LOGIC
// ------------------------------------------------------------------------------------------------------------------------------------------------

let currSelectedTool: number = 0;

const PENCIL_TOOL: number = 0;
const HEART_STICKER: number = 1;
const LIGHTNING_STICKER: number = 2;
const SATURN_STICKER: number = 3;

pencil.addEventListener("click", () => {
  currSelectedTool = PENCIL_TOOL;
});

heart.addEventListener("click", () => {
  currSelectedTool = HEART_STICKER;
});

lightning.addEventListener("click", () => {
  currSelectedTool = LIGHTNING_STICKER;
});

saturn.addEventListener("click", () => {
  currSelectedTool = SATURN_STICKER;
});

function createToolPreview(x: number, y: number): Command {
  switch (currSelectedTool) {
    case PENCIL_TOOL:
      return new ToolPreviewCommand(currLineWidth, x, y);
    case HEART_STICKER:
      return new StickerCommand("❤️", x, y, currLineWidth);
    case LIGHTNING_STICKER:
      return new StickerCommand("⚡", x, y, currLineWidth);
    case SATURN_STICKER:
      return new StickerCommand("🪐", x, y, currLineWidth);
    default:
      return new ToolPreviewCommand(currLineWidth, x, y);
  }
}

function createLine(x: number, y: number): Command {
  switch (currSelectedTool) {
    case PENCIL_TOOL:
      return new LineCommand(x, y);
    case HEART_STICKER:
      return new StickerCommand("❤️", x, y, currLineWidth);
    case LIGHTNING_STICKER:
      return new StickerCommand("⚡", x, y, currLineWidth);
    case SATURN_STICKER:
      return new StickerCommand("🪐", x, y, currLineWidth);
    default:
      return new LineCommand(x, y);
  }
}

//#endregion

// ------------------------------------------------------------------------------------------------------------------------------------------------
//#region TOOL SIZE LOGIC
// ------------------------------------------------------------------------------------------------------------------------------------------------

let currLineWidth: number = 1;
const maxLineWidth: number = 10;

lineWidthDown.disabled = true;
lineWidthDown.addEventListener("click", () => {
  currLineWidth--;
  if (currLineWidth <= 1) {
    currLineWidth = 1;
    lineWidthDown.disabled = true;
  }
  lineWidthUp.disabled = false;

  displayLineWidth(currLineWidth);
});

lineWidthUp.addEventListener("click", () => {
  currLineWidth++;
  if (currLineWidth >= maxLineWidth) {
    currLineWidth = maxLineWidth;
    lineWidthUp.disabled = true;
  }
  lineWidthDown.disabled = false;

  displayLineWidth(currLineWidth);
});

function displayLineWidth(width: number) {
  lineWidthDisplay.innerHTML = width.toString();
}

//#endregion
