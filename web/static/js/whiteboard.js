import { setup_channel } from "./whiteboard_channel";

let fabricCanvas = null;

function attach_events(canvas) {
  canvas.on("mouse:down", function (options) {
    console.log(options.e.clientX, options.e.clientY);
  });

  canvas.on("mouse:move", function (options) {
    if (options.e.buttons > 0) {
      console.log(options.e);
      //console.log(JSON.stringify(canvas));
      const brush = canvas.freeDrawingBrush;
      console.log(typeof brush, brush);

      const points = brush._points;
      const decimantedPoints = brush.decimatePoints(points, brush.decimate);
      const svgPath = brush.convertPointsToSVGPath(decimantedPoints);
      //console.log(svgPath);
      let path = brush.createPath(svgPath);
      console.log(path);
      path.top = path.top + 20;
      window.sendPreviewUpdate(JSON.stringify(path));
    }
  });
}

let lastPath = null;

export function updatePreviewPath(pathJson) {
  const pathJsonObject = JSON.parse(pathJson);
  fabric.util.enlivenObjects([pathJsonObject], function (liveObjects) {
    liveObjects.forEach((lo) => {
      if (lastPath) {
        fabricCanvas.remove(lastPath);
      }
      fabricCanvas.add(lo);
      lastPath = lo;
    });
  });
}

function draw_using_fabric() {
  var canvasEl = document.getElementById("c");
  fitToContainer(canvasEl);
  fabricCanvas = new fabric.Canvas("c");
  attach_events(fabricCanvas);
  fabricCanvas.isDrawingMode = true;
  console.log(fabricCanvas.freeDrawingBrush);
  fabricCanvas.freeDrawingBrush = new fabric.PencilBrush(fabricCanvas);
  fabricCanvas.freeDrawingBrush.color = "red";
  fabricCanvas.freeDrawingBrush.width = 10;
  fabricCanvas.freeDrawingBrush.decimate = 30.0;
}

function add_test_items(canvas) {
  // create a rectangle with angle=45
  var rect = new fabric.Rect({
    left: 100,
    top: 100,
    fill: "red",
    width: 20,
    height: 20,
    angle: 45,
  });

  var circle = new fabric.Circle({
    radius: 20,
    fill: "green",
    left: 100,
    top: 100,
  });
  var triangle = new fabric.Triangle({
    width: 20,
    height: 30,
    fill: "blue",
    left: 50,
    top: 50,
  });

  rect.set("fill", "red");
  rect.set({ strokeWidth: 5, stroke: "rgba(100,200,200,0.5)" });
  rect.set("angle", 15).set("flipY", true);

  canvas.add(circle, triangle);

  canvas.add(rect);
}

function fitToContainer(canvas) {
  // Make it visually fill the positioned parent
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  // ...then set the internal size to match
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
}

function whiteboard_main() {
  setup_channel();
  draw_using_fabric();
}

window.whiteboard_main = whiteboard_main;
