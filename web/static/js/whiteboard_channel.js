import socket from "./socket";
import { updatePreviewPath } from "./whiteboard";

export function setup_channel() {
  console.log("setting up channel", socket.socket);

  const channel = socket.socket.channel(`whiteboard:0`, {});

  channel
    .join()
    .receive("ok", (resp) => {
      console.log("Joined successfully", resp);
    })
    .receive("error", (resp) => {
      console.log("Unable to join", resp);
    });

    channel.onError( () => console.log("there was an error with the whiteboard channel connection!") );
    channel.onClose( () => console.log("the whiteboard channel has gone away gracefully") );

    function sendPreviewUpdate(pathJson) {
      channel.push('preview:update', pathJson)
    }
    window.sendPreviewUpdate = sendPreviewUpdate;

    channel.on('preview:replace', (event) => {
      console.log("Recieved path", event.preview_path);
      updatePreviewPath(event.preview_path);
    });
}
