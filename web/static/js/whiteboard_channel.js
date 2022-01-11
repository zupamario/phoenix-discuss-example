import {Presence} from "phoenix"
import socket from "./socket";
import { updatePreviewPath, updatePreviewCursor, clearPreviewPath, addPath } from "./whiteboard";

var _ = require('lodash');

export function setup_channel() {
  console.log("setting up channel", socket.socket);

  const channel = socket.socket.channel(`whiteboard:0`, {});

  channel
    .join()
    .receive("ok", (resp) => {
      console.log("Joined successfully", resp);
      resp.paths.forEach(path => {
        addPath(path);
      });
    })
    .receive("error", (resp) => {
      console.log("Unable to join", resp);
    });

    channel.onError( () => console.log("there was an error with the whiteboard channel connection!") );
    channel.onClose( () => console.log("the whiteboard channel has gone away gracefully") );

    const presence = new Presence(channel);
  
    presence.onSync(() => {
      console.log("Presence update", presence.list());
      //renderPresence(presence.list());
    });
    
    presence.onJoin((key, current, joiner) => {
      // console.log('join', key, current, joiner);
    });

    presence.onLeave((key, current, leaver) => {
      // console.log('leave', key, current, leaver);
    });

    function sendPreviewUpdate(pathJson) {
      channel.push('preview:update', pathJson)
    }
    window.sendPreviewUpdate = sendPreviewUpdate;
    window.throttledSendPreviewUpdate = _.throttle(sendPreviewUpdate, 33);

    function sendCursorPosUpdate(cursorPosJson) {
      channel.push('user:cursor', cursorPosJson);
    }
    window.sendCursorPosUpdate = sendCursorPosUpdate;
    window.throttledSendCursorPosUpdate = _.throttle(sendCursorPosUpdate, 33);

    function sendClearPreviewPath() {
      channel.push('preview:clear', '');
    }
    window.sendClearPreviewPath = sendClearPreviewPath;

    function sendAddPath(pathJson) {
      channel.push('path:add', pathJson);
    }

    window.sendAddPath = sendAddPath;

    channel.on('preview:replace', (event) => {
      //console.log("Recieved path", event.preview_path, event.user_id);
      console.log("PREVIEW REPLACE!!!!");
      updatePreviewPath(event.preview_path, event.user_id);
    });

    channel.on('preview:update_cursor', (event) => {
      //console.log("Recieved preview cursor", event.cursor_pos, event.user_id);
      updatePreviewCursor(event.cursor_pos, event.user_id);
    });

    channel.on('preview:clear', (event) => {
      console.log('RREVIEW CLEAR !!!');
      clearPreviewPath(event.user_id);
    });

    channel.on('path:add', (event) => {
      addPath(event.path);
    })
}
