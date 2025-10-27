import "./style.css";

document.body.innerHTML = `
  <center><h1>Sticker Sketchpad!!!</h1><center>
  <center><canvas id="canvas" width="256px" height="256px""></canvas></center>
  <br></br>
  <center><button id="clear">clear</button> <button id="undo">undo</button>
    <button id="redo">redo</button></center>
  <br>
  <center><p>tool:</p></center>
  <center> <button id="pencil">✏️</button> | <span id="sticker-container"></span> <button id="add-custom-sticker">➕</button> </center>
  <br>
  <center> <button id="line-width-down">v</button> <button id="line-width-up">^</button>
    <p> size: <span id="curr-line-width">1</span>px</p></center>
  <br>
  <center> <button id="export">export</button></center>
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

//sticker
const stickerContainer = document.getElementById("sticker-container")!;
const customSticker: HTMLButtonElement = document.getElementById(
  "add-custom-sticker",
) as HTMLButtonElement;

// tool size
const lineWidthDown: HTMLButtonElement = document.getElementById(
  "line-width-down",
) as HTMLButtonElement;
const lineWidthUp: HTMLButtonElement = document.getElementById(
  "line-width-up",
) as HTMLButtonElement;
const lineWidthDisplay = document.getElementById("curr-line-width")!;

//export
const exportButton = document.getElementById("export")!;

//#endregion

// ------------------------------------------------------------------------------------------------------------------------------------------------
//#region EVENT SYSTEM
// ------------------------------------------------------------------------------------------------------------------------------------------------

const bus: EventTarget = new EventTarget();

function notify(name: string) {
  bus.dispatchEvent(new Event(name));
}

bus.addEventListener("drawing-changed", () => {
  redraw(ctx, false);
});

bus.addEventListener("tool-moved", () => {
  redraw(ctx, false);
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

  drag(_x: number, _y: number): void {}
  display(_ctx: CanvasRenderingContext2D): void {}
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
  rotation: number = 0;

  dotPreview: ToolPreviewCommand;
  drawDotPreview: boolean = false;

  constructor(sticker: string, x: number, y: number, size: number) {
    super();
    this.sticker = sticker;
    this.x = x;
    this.y = y;
    this.size = size * 10;

    this.dotPreview = new ToolPreviewCommand(3, this.x, this.y);
  }

  override drag(x: number, y: number): void {
    this.rotation = Math.atan2(y - this.y, x - this.x);

    this.dotPreview.drag(x, y);
    this.drawDotPreview = true;
  }

  override display(ctx: CanvasRenderingContext2D): void {
    if (this.drawDotPreview) {
      this.dotPreview.display(ctx);
      this.drawDotPreview = false;
    }
    ctx.beginPath();
    ctx.font = `${this.size}px serif`;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    ctx.fillText(this.sticker, 0, 0);
    ctx.restore();
  }
}

class StickerPreview extends StickerCommand {
  constructor(sticker: string, x: number, y: number, size: number) {
    super(sticker, x, y, size);
  }

  override drag(x: number, y: number): void {
    this.x = x;
    this.y = y;
  }
}

function redraw(
  drawCtx: CanvasRenderingContext2D,
  drawWhiteBackground: boolean,
) {
  drawCtx.clearRect(0, 0, canvas.width, canvas.height);
  if (drawWhiteBackground) {
    drawCtx.fillStyle = "white";
    drawCtx.fillRect(0, 0, 1024, 1024);
    drawCtx.fillStyle = "black";
  }
  commands.forEach((command: Command) => command.display(drawCtx));

  if (toolPreview && !cursorDownFlag) toolPreview.display(drawCtx);
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
//#region TOOL SELECTION/STICKER LOGIC
// ------------------------------------------------------------------------------------------------------------------------------------------------

const initialStickers: string[] = ["❤️", "⚡", "🪐"];
let currSelectedTool: Nullable<string> = null;

const stickerButtons: HTMLButtonElement[] = [];
stickerButtons.push(pencil);
pencil.disabled = true;

pencil.addEventListener("click", () => {
  currSelectedTool = null;
  disableOrEnableAllStickers(false);
  pencil.disabled = true;
});

initialStickers.forEach((emoji: string) => {
  createStickerButton(emoji);
});

function createStickerButton(emoji: string): HTMLButtonElement {
  const stickerButton: HTMLButtonElement = document.createElement(
    "button",
  ) as HTMLButtonElement;
  stickerButton.innerHTML = emoji;
  stickerButton.addEventListener("click", () => {
    currSelectedTool = emoji;
    disableOrEnableAllStickers(false); // enable all buttons
    stickerButton.disabled = true;
  });
  stickerContainer.appendChild(stickerButton);
  stickerButtons.push(stickerButton);

  return stickerButton;
}

function disableOrEnableAllStickers(disabled: boolean) {
  stickerButtons.forEach((button: HTMLButtonElement) => {
    button.disabled = disabled;
  });
}

customSticker.addEventListener("click", () => {
  const sticker: Nullable<string> = prompt("Custom Sticker Text:");
  if (sticker != null) {
    const stickerButton: HTMLButtonElement = createStickerButton(sticker);
    disableOrEnableAllStickers(false);
    stickerButton.disabled = true;
    currSelectedTool = sticker;
  }
});

function createToolPreview(x: number, y: number): Command {
  if (!currSelectedTool) {
    return new ToolPreviewCommand(currLineWidth, x, y);
  } else {
    return new StickerPreview(currSelectedTool, x, y, currLineWidth);
  }
}

function createLine(x: number, y: number): Command {
  if (!currSelectedTool) {
    return new LineCommand(x, y);
  } else {
    return new StickerCommand(currSelectedTool, x, y, currLineWidth);
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

// ------------------------------------------------------------------------------------------------------------------------------------------------
//#region EXPORT
// ------------------------------------------------------------------------------------------------------------------------------------------------

exportButton.addEventListener("click", () => {
  const exportCanvas: HTMLCanvasElement = document.createElement(
    "canvas",
  ) as HTMLCanvasElement;
  exportCanvas.setAttribute("width", "1024px");
  exportCanvas.setAttribute("height", "1024px");

  const exportCtx: CanvasRenderingContext2D = exportCanvas.getContext(
    "2d",
  ) as CanvasRenderingContext2D;
  exportCtx.scale(4, 4);
  exportCtx.textAlign = "center";
  redraw(exportCtx, true);

  const anchor = document.createElement("a");
  anchor.href = exportCanvas.toDataURL("image/png");
  anchor.download = "sketchpad.png";
  anchor.click();
});

//#endregion
