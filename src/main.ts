import "./style.css";

document.body.innerHTML = `
  <center><h1>Sticker Sketchpad!!!</h1><center>
  <center><canvas id="canvas" width="256px" height="256px""></canvas></center>
  <p>\n\n</p>
  <center><button id="clear">clear</button> <button id="undo">undo</button>
    <button id="redo">redo</button></center>
`;

// ------------------------------------------------------------------------------------------------------------------------------------------------
//#region HTML ELEMENTS
// ------------------------------------------------------------------------------------------------------------------------------------------------

//canvas
const canvas: HTMLCanvasElement = document.getElementById(
  "canvas",
) as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;

//buttons
const clear = document.getElementById("clear")!;
const undo = document.getElementById("undo")!;
const redo = document.getElementById("redo")!;

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

  constructor(x: number, y: number) {
    this.points = [{ x, y }];
  }

  display(ctx: CanvasRenderingContext2D) {
    if (this.points.length < 1) return;

    ctx.lineWidth = 1.0;
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
//#region BUTTON LOGIC
// ------------------------------------------------------------------------------------------------------------------------------------------------

clear.addEventListener("click", () => {
  commands.splice(0, commands.length);

  notify("drawing-changed");
});

undo.addEventListener("click", () => {
  if (commands.length < 1) return;

  redoCommands.push(commands.pop() as LineCommand);
  notify("drawing-changed");
});

redo.addEventListener("click", () => {
  if (redoCommands.length < 1) return;

  commands.push(redoCommands.pop() as LineCommand);
  notify("drawing-changed");
});

//#endregion
