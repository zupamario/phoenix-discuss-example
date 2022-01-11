import { setup_channel } from "./whiteboard_channel";
import { makePreviewCursor, pickStartColor } from "./whiteboard_helper";
import { colors } from "./clrs";
import { setWith } from "lodash";

let fabricCanvas = null;

function attach_events(canvas)
{
  let isDrawing = false;

  canvas.on("mouse:move", function (options) {
    if (fabricCanvas.isDrawingMode && isDrawing) {
      send_preview_path();
    }

    sendCursorUpdate(options.pointer.x, options.pointer.y);
  });

  canvas.on("path:created", function (options) {
    //console.log("Path created", options);
    if (fabricCanvas.isDrawingMode) {
      // We are in drawing mode so this means the user has finished drawing his part
      sendAddPath(options.path);
      sendClearPreviewPath();
      fabricCanvas.remove(options.path);
    }
    //console.log(fabricCanvas.getObjects());
  });

  canvas.on("object:added", function (options) {
    //console.log("Object added", options);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key == "Alt") {
      console.log("ALTTT");
      fabricCanvas.isDrawingMode = false;
    }
    var name = event.key;
    var code = event.code;
    // Alert the key name and key code on keydown
    console.log(`Key pressed ${name} \r\n Key code value: ${code}`);
  }, false);

  document.addEventListener('keyup', (event) => {
    if (event.key == "Alt") {
      console.log("ALT UPPP");
      fabricCanvas.isDrawingMode = true;
    }
    var name = event.key;
    var code = event.code;
    // Alert the key name and key code on keydown
    console.log(`Key released ${name} \r\n Key code value: ${code}`);
  }, false);

  canvas.on('mouse:down', function(opt) {
    var evt = opt.e;
    if (evt.altKey === true) {
      fabricCanvas.isDrawingMode = false;

      this.isDragging = true;
      this.selection = false;
      this.lastPosX = evt.clientX;
      this.lastPosY = evt.clientY;
    } else {
      isDrawing = true;
    }
  });

  canvas.on('mouse:move', function(opt) {
    if (this.isDragging) {
      var e = opt.e;
      var vpt = this.viewportTransform;
      vpt[4] += e.clientX - this.lastPosX;
      vpt[5] += e.clientY - this.lastPosY;
      this.requestRenderAll();
      this.lastPosX = e.clientX;
      this.lastPosY = e.clientY;
    }
  });

  canvas.on('mouse:up', function(opt) {
    // on mouse up we want to recalculate new interaction
    // for all objects, so we call setViewportTransform
    this.setViewportTransform(this.viewportTransform);
    this.isDragging = false;
    this.selection = true;

    isDrawing = false;
  });

  canvas.on('mouse:wheel', function(opt) {
    var delta = opt.e.deltaY;
    var zoom = canvas.getZoom();
    zoom *= 0.999 ** delta;
    if (zoom > 20) zoom = 20;
    if (zoom < 0.01) zoom = 0.01;
    canvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, zoom);
    opt.e.preventDefault();
    opt.e.stopPropagation();
  });
}

function sendCursorUpdate(x, y) {
  const msg = {
    x: x,
    y: y,
    color: fabricCanvas.freeDrawingBrush.color,
    width: fabricCanvas.freeDrawingBrush.width
  }
  throttledSendCursorPosUpdate(JSON.stringify(msg));
}

let lastSendPath = "";

function send_preview_path() {
  const brush = fabricCanvas.freeDrawingBrush;
  if (!brush || brush._points.length == 0) {
    return;
  }
  const points = brush._points;
  const decimantedPoints = brush.decimatePoints(points, brush.decimate);
  const svgPath = brush.convertPointsToSVGPath(decimantedPoints);
  const path = brush.createPath(svgPath);
  const jsonPath = JSON.stringify(path);

  if (jsonPath != lastSendPath) {
    window.throttledSendPreviewUpdate(jsonPath);
    lastSendPath = jsonPath;
    //("sending path");
  } else {
    //console.log("skipping send path");
  }
}

function sendAddPath(path) {
  //console.log(path);
  const jsonPath = JSON.stringify(path);
  window.sendAddPath(jsonPath);
}

let previewPaths = new Map();

export function updatePreviewPath(pathJson, userId) {
  //console.log("UPDATEING PREVIEW!!!!")
  const pathJsonObject = JSON.parse(pathJson);
  fabric.util.enlivenObjects([pathJsonObject], function (liveObjects) {
    liveObjects.forEach((lo) => {
      clearPreviewPath(userId);
      //lo.stroke = colors.blue;
      fabricCanvas.add(lo);
      fabricCanvas.sendBackwards(lo);
      previewPaths.set(userId, lo);
    });
  });
}

export function clearPreviewPath(userId) {
  //console.log("Clearing preview path");
  if (previewPaths.has(userId)) {
    fabricCanvas.remove(previewPaths.get(userId));
    previewPaths.delete(userId);
  }
}

const previewCursors = new Map();

export function updatePreviewCursor(cursorInfo, userId) {
  cursorInfo = JSON.parse(cursorInfo);
  //(cursorInfo);
  // Remove existing preview cursor from canvas and map
  if (previewCursors.has(userId)) {
    const cursor = previewCursors.get(userId);
    cursor.item(0).setRadius(cursorInfo.width / 2);
    cursor.item(0).set("fill", cursorInfo.color);
    cursor.item(0).set("stroke", cursorInfo.color);
    cursor.item(1).fontSize = cursorInfo.width;
    cursor.set({ left: cursorInfo.x, top: cursorInfo.y });
    cursor.setCoords();
    cursor.bringToFront();
  } else {
    const previewCursor = makePreviewCursor(cursorInfo, userId);
    previewCursors.set(userId, previewCursor);
    fabricCanvas.add(previewCursor);
  }
}

export function addPath(pathJson) {
  const pathJsonObject = JSON.parse(pathJson);
  fabric.util.enlivenObjects([pathJsonObject], function (liveObjects) {
    liveObjects.forEach((lo) => {
      //console.log(lo)
      //lo.fill = 'green';
      //lo.stroke = colors.green;
      lo.set('selectable', false);
      fabricCanvas.add(lo);
    });
  });
}

function setColor(color) {
  fabricCanvas.freeDrawingBrush.color = color;
}

function setWidth(width) {
  fabricCanvas.freeDrawingBrush.width = width;
}

function draw_using_fabric(startColor) {
  fabricCanvas = new fabric.Canvas("c");
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  attach_events(fabricCanvas);
  fabricCanvas.isDrawingMode = true;
  fabricCanvas.preserveObjectStacking = true;

  const brush = new fabric.PencilBrush(fabricCanvas);
  fabricCanvas.freeDrawingBrush = brush;
  brush.color = startColor;
  brush.decimate = 5.0;
}

function createPatternBrush(canvas) {
  // This brush works for rendering but it cannot be sent and restored right now.
  // The pattern is drawn on a canvas which is not serialized/deserialized.
  const brush = new fabric.PatternBrush(canvas);
  fabricCanvas.freeDrawingBrush = brush;
  brush.color = colors.red;
  brush.width = 20;
  brush.source = brush.getPatternSrc.call(brush);
}

function resizeCanvas() {
  const outerCanvasContainer =  document.querySelector('.fabric-canvas-container');
    
  const ratio = fabricCanvas.getWidth() / fabricCanvas.getHeight();
  const containerWidth   = outerCanvasContainer.clientWidth;
  const containerHeight  = outerCanvasContainer.clientHeight;

  console.log('resizing canvas', outerCanvasContainer, containerWidth, containerHeight);


  const scale = containerWidth / fabricCanvas.getWidth();
  const zoom  = fabricCanvas.getZoom() * scale;
  fabricCanvas.setDimensions({width: containerWidth, height: containerHeight-20});
  //fabricCanvas.setViewportTransform([zoom, 0, 0, zoom, 0, 0]);
}

function whiteboard_main(colorPicker, widthSlider) {
  setup_channel();
  const startColor = pickStartColor();
  draw_using_fabric(startColor);

  colorPicker.fromString(startColor);
  colorPicker.onChange = function () {
    //onsole.log("Color picker changed", this.toHEXString());
    setColor(this.toHEXString());
  }

  colorPicker.onInput = function () {
    //console.log("Color picker input", this.toHEXString());
    setColor(this.toHEXString());
    //sendCursorUpdate();
  }

  const defaultWidth = 5;
  widthSlider.value = defaultWidth;
  setWidth(defaultWidth);

  widthSlider.addEventListener("input", (e) => {
    //console.log(e.target.value);
    setWidth(e.target.value);
    //sendCursorUpdate();
  });
}

window.whiteboard_main = whiteboard_main;
