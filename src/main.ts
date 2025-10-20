import "./style.css";

document.body.innerHTML = `
  <center><h1>Sticker Sketchpad!!!</h1><center>
  <center><canvas id="canvas" width="256px" height="256px""></canvas></center>
  <p>\n\n</p>
  <center><button id="clear">clear</button> <button id="undo">undo</button>
    <button id="redo">redo</button></center>
  <p>\n</p>
  <center> <button id="line-width-down">Line Width Down</button> <button id="line-width-up">Line Width Up</button>
    <p> line width: <span id="curr-line-width">1</span>px</p></center>
`;

// ------------------------------------------------------------------------------------------------------------------------------------------------
//#region HTML ELEMENTS
// ------------------------------------------------------------------------------------------------------------------------------------------------

// canvas
const canvas: HTMLCanvasElement = document.getElementById(
  "canvas",
) as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;

// clear/undo/redo
const clear = document.getElementById("clear")!;
const undo = document.getElementById("undo")!;
const redo = document.getElementById("redo")!;

// line width
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

//#endregion

// ------------------------------------------------------------------------------------------------------------------------------------------------
//#region DRAWING LOGIC
// ------------------------------------------------------------------------------------------------------------------------------------------------

type Point = { x: number; y: number };

const commands: LineCommand[] = [];
const redoCommands: LineCommand[] = [];

class LineCommand {
  points: Point[] = [];
  lineWidth: number;

  constructor(x: number, y: number) {
    this.points = [{ x, y }];
    this.lineWidth = currLineWidth;
  }

  display(ctx: CanvasRenderingContext2D) {
    if (this.points.length < 1) return;

    ctx.lineWidth = this.lineWidth;
    ctx.beginPath();
    ctx.moveTo(this.points[0].x, this.points[0].y);

    this.points.forEach((point: Point) => ctx.lineTo(point.x, point.y));

    ctx.stroke();
  }

  drag(x: number, y: number) {
    this.points.push({ x, y });
  }
}

function redraw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  commands.forEach((command: LineCommand) => command.display(ctx));
}
//#endregion

// ------------------------------------------------------------------------------------------------------------------------------------------------
//#region MOUSE LOGIC
// ------------------------------------------------------------------------------------------------------------------------------------------------

let cursorDownFlag: boolean = false;

let currentLineCommand: LineCommand;

canvas.addEventListener("mousedown", (e) => {
  currentLineCommand = new LineCommand(e.offsetX, e.offsetY);
  commands.push(currentLineCommand);

  cursorDownFlag = true;
});

canvas.addEventListener("mouseup", () => {
  cursorDownFlag = false;
});

canvas.addEventListener("mouseleave", (e) => {
  if (cursorDownFlag) {
    currentLineCommand.drag(e.offsetX, e.offsetY);

    notify("drawing-changed");
  }
});

canvas.addEventListener("mouseenter", (e) => {
  if (cursorDownFlag) {
    currentLineCommand = new LineCommand(e.offsetX, e.offsetY);
    commands.push(currentLineCommand);

    notify("drawing-changed");
  }
});

canvas.addEventListener("mousemove", (e) => {
  if (cursorDownFlag) {
    currentLineCommand.drag(e.offsetX, e.offsetY);

    notify("drawing-changed");
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
//#region LINE WIDTH LOGIC
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
