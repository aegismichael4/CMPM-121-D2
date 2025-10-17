import "./style.css";

document.body.innerHTML = `
  <center><h1>Sticker Sketchpad!!!</h1><center>
  <center><canvas id="canvasElement" width="256px" height="256px""></canvas></center>
  <p>\n\n</p>
  <center><button id="clear">clear</button></center>
  <p id="test">test</p>
`;

// ------------------------------------------------------------------------------------------------------------------------------------------------
//#region HTML ELEMENTS
// ------------------------------------------------------------------------------------------------------------------------------------------------

const canvas = document.getElementById("canvasElement")!;
const test = document.getElementById("test")!;

//#endregion

// ------------------------------------------------------------------------------------------------------------------------------------------------
//#region MOUSE LOGIC
// ------------------------------------------------------------------------------------------------------------------------------------------------

let mouseActive: boolean = false;

canvas.addEventListener("mousedown", () => {
  mouseActive = true;
  test.innerHTML = "true";
});

canvas.addEventListener("mouseup", () => {
  mouseActive = false;
  test.innerHTML = "false";
});

canvas.addEventListener("mouseleave", () => {
  mouseActive = false;
  test.innerHTML = "false";
});

canvas.addEventListener("mousemove", () => {
});
