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
const line: Point[] = [];

function redraw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (line.length < 1) return;

  ctx.beginPath();
  ctx.moveTo(line[0].x, line[0].y);

  for (const point of line) {
    ctx.lineTo(point.x, point.y);
    ctx.moveTo(point.x, point.y);
  }

  ctx.stroke();
}

//#endregion

// ------------------------------------------------------------------------------------------------------------------------------------------------
//#region MOUSE LOGIC
// ------------------------------------------------------------------------------------------------------------------------------------------------

const cursor = { active: false, x: 0, y: 0 };
let cursorDownFlag: boolean = false;

canvas.addEventListener("mousedown", (e) => {
  cursor.active = true;
  cursorDownFlag = true;
  cursor.x = e.offsetX;
  cursor.y = e.offsetY;
});

canvas.addEventListener("mouseup", () => {
  cursor.active = false;
  cursorDownFlag = false;
});

canvas.addEventListener("mouseleave", () => {
  cursor.active = false;
});

canvas.addEventListener("mouseenter", (e) => {
  if (cursorDownFlag) {
    cursor.active = true;
    cursor.x = e.offsetX;
    cursor.y = e.offsetY;
  }
});

document.addEventListener("mouseup", () => {
  cursorDownFlag = false;
});

document.addEventListener("mousedown", () => {
  cursorDownFlag = true;
});

canvas.addEventListener("mousemove", (e) => {
  if (cursor.active) {
    cursor.x = e.offsetX;
    cursor.y = e.offsetY;
    line.push({ x: cursor.x, y: cursor.y });
    redraw();
  }
});

//#endregion

// ------------------------------------------------------------------------------------------------------------------------------------------------
//#region CLEAR LOGIC
// ------------------------------------------------------------------------------------------------------------------------------------------------

clear.addEventListener("click", () => {
  //line.c
});

//#endregion
