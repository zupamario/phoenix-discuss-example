export function makePreviewCursor(cursorPos, userId) {
  const circle = new fabric.Circle({
    radius: 10,
    fill: "blue",
    stroke: "black",
    originX: "center",
    originY: "center",
  });

  const text = new fabric.Text(userId.toString(), {
    fontSize: 15,
    originX: "center",
    originY: "center",
    fill: "white",
  });

  const group = new fabric.Group([circle, text], {
    left: cursorPos.x,
    top: cursorPos.y,
    originX: "center",
    originY: "center",
  });

  return group;
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
