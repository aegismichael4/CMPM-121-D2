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
    ctx.beginPath();
    ctx.moveTo(cursor.x, cursor.y);
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.stroke();
    cursor.x = e.offsetX;
    cursor.y = e.offsetY;
  }
});

//#endregion

// ------------------------------------------------------------------------------------------------------------------------------------------------
//#region CLEAR LOGIC
// ------------------------------------------------------------------------------------------------------------------------------------------------

clear.addEventListener("click", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
});

//#endregion
