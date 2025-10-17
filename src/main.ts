import "./style.css";

document.body.innerHTML = `
  <center><h1>Sticker Sketchpad!!!</h1><center>
  <center><canvas id="canvas" width="256px" height="256px""></canvas></center>
  <p>\n\n</p>
  <center><button id="clear">clear</button></center>
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

//#endregion

// ------------------------------------------------------------------------------------------------------------------------------------------------
//#region LINE LOGIC
// ------------------------------------------------------------------------------------------------------------------------------------------------

type Point = { x: number; y: number };
type Line = Point[];
let currentLine: Line;
const lines: Line[] = [];

function redraw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (const line of lines) {
    if (line.length < 1) continue;

    ctx.beginPath();
    ctx.moveTo(line[0].x, line[0].y);

    for (const point of line) {
      ctx.lineTo(point.x, point.y);
    }

    ctx.stroke();
  }
}

const redrawEvent = new Event("drawing-changed");

canvas.addEventListener("drawing-changed", () => {
  redraw();
});

//#endregion

// ------------------------------------------------------------------------------------------------------------------------------------------------
//#region MOUSE LOGIC
// ------------------------------------------------------------------------------------------------------------------------------------------------

const cursor = { active: false, x: 0, y: 0 };
let cursorDownFlag: boolean = false;

canvas.addEventListener("mousedown", (e) => {
  currentLine = [];
  lines.push(currentLine);
  cursor.active = true;
  cursorDownFlag = true;
  cursor.x = e.offsetX;
  cursor.y = e.offsetY;
});

canvas.addEventListener("mouseup", () => {
  cursor.active = false;
  cursorDownFlag = false;
});

canvas.addEventListener("mouseleave", (e) => {
  if (cursor.active) {
    cursor.active = false;

    cursor.x = e.offsetX;
    cursor.y = e.offsetY;
    currentLine.push({ x: cursor.x, y: cursor.y });

    canvas.dispatchEvent(redrawEvent);
  }
});

canvas.addEventListener("mouseenter", (e) => {
  if (cursorDownFlag) {
    currentLine = [];
    lines.push(currentLine);

    cursor.active = true;
    cursor.x = e.offsetX;
    cursor.y = e.offsetY;
    currentLine.push({ x: cursor.x, y: cursor.y });

    canvas.dispatchEvent(redrawEvent);
  }
});

canvas.addEventListener("mousemove", (e) => {
  if (cursor.active) {
    cursor.x = e.offsetX;
    cursor.y = e.offsetY;
    currentLine.push({ x: cursor.x, y: cursor.y });

    canvas.dispatchEvent(redrawEvent);
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
//#region CLEAR LOGIC
// ------------------------------------------------------------------------------------------------------------------------------------------------

clear.addEventListener("click", () => {
  lines.splice(0, lines.length);

  canvas.dispatchEvent(redrawEvent);
});

//#endregion
