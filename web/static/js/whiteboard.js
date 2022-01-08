import { setup_channel } from "./whiteboard_channel";
import { makePreviewCursor } from "./whiteboard_helper";

let fabricCanvas = null;

function attach_events(canvas) {
  canvas.on("mouse:down", function (options) {
    console.log(options.e.clientX, options.e.clientY);
  });

  canvas.on("mouse:move", function (options) {
    if (options.e.buttons > 0) {
      send_preview_path();
    }

    throttledSendCursorPosUpdate(
      JSON.stringify({ x: options.pointer.x, y: options.pointer.y })
    );
  });

  canvas.on("path:created", function (options) {
    console.log("Path created", options);
    if (fabricCanvas.isDrawingMode) {
      // We are in drawing mode so this means the user has finished drawing his part
      sendClearPreviewPath();
      sendAddPath(options.path);
      fabricCanvas.remove(options.path);
    }
    //console.log(fabricCanvas.getObjects());
  });

  canvas.on("object:added", function (options) {
    //console.log("Object added", options);
  });
}

let lastSendPath = "";

function send_preview_path() {
  const brush = fabricCanvas.freeDrawingBrush;
  const points = brush._points;
  const decimantedPoints = brush.decimatePoints(points, brush.decimate);
  const svgPath = brush.convertPointsToSVGPath(decimantedPoints);
  const path = brush.createPath(svgPath);
  const jsonPath = JSON.stringify(path);
  if (jsonPath != lastSendPath) {
    window.throttledSendPreviewUpdate(jsonPath);
    lastSendPath = jsonPath;
    console.log("sending path");
  } else {
    console.log("skipping send path");
  }
}

function sendAddPath(path) {
  console.log(path);
  const jsonPath = JSON.stringify(path);
  window.sendAddPath(jsonPath);
}

let previewPaths = new Map();

export function updatePreviewPath(pathJson, userId) {
  const pathJsonObject = JSON.parse(pathJson);
  fabric.util.enlivenObjects([pathJsonObject], function (liveObjects) {
    liveObjects.forEach((lo) => {
      clearPreviewPath(userId);
      lo.stroke = "blue";
      fabricCanvas.add(lo);
      fabricCanvas.sendToBack(lo);
      previewPaths.set(userId, lo);
    });
  });
}

export function clearPreviewPath(userId) {
  if (previewPaths.has(userId)) {
    fabricCanvas.remove(previewPaths.get(userId));
    previewPaths.delete(userId);
  }
}

const previewCursors = new Map();

export function updatePreviewCursor(cursorPos, userId) {
  cursorPos = JSON.parse(cursorPos);
  //console.log(cursorPos);
  // Remove existing preview cursor from canvas and map
  if (previewCursors.has(userId)) {
    const cursor = previewCursors.get(userId);
    cursor.set({ left: cursorPos.x, top: cursorPos.y });
    cursor.setCoords();
    fabricCanvas.renderAll();
  } else {
    const previewCursor = makePreviewCursor(cursorPos, userId);
    previewCursors.set(userId, previewCursor);
    fabricCanvas.add(previewCursor);
  }
}

export function addPath(pathJson) {
  const pathJsonObject = JSON.parse(pathJson);
  fabric.util.enlivenObjects([pathJsonObject], function (liveObjects) {
    liveObjects.forEach((lo) => {
      lo.stroke = "green";
      fabricCanvas.add(lo);
    });
  });
}

function draw_using_fabric() {
  var canvasEl = document.getElementById("c");
  fitToContainer(canvasEl);
  fabricCanvas = new fabric.Canvas("c");
  attach_events(fabricCanvas);
  fabricCanvas.isDrawingMode = true;
  fabricCanvas.preserveObjectStacking = true;
  console.log(fabricCanvas.freeDrawingBrush);
  fabricCanvas.freeDrawingBrush = new fabric.PencilBrush(fabricCanvas);
  fabricCanvas.freeDrawingBrush.color = "red";
  fabricCanvas.freeDrawingBrush.width = 8;
  fabricCanvas.freeDrawingBrush.decimate = 20.0;
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
