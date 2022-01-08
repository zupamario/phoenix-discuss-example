defmodule Discuss.WhiteboardChannel do
  use Discuss.Web, :channel

  require Logger

  def join("whiteboard:" <> topic_id, _params, socket) do
    {:ok, %{welcome: "whiteboard"}, socket}
  end

  def handle_in("preview:update", path, socket) do
    user_id = socket.assigns.user_id
    Logger.info("Recived path from user #{user_id}: #{path}")
    broadcast_from!(socket, "preview:replace", %{preview_path: path, user_id: user_id})
    {:reply, :ok, socket}
  end

  def handle_in("user:cursor", cursor_pos, socket) do
    user_id = socket.assigns.user_id
    Logger.info("Recived cursor pos from user #{user_id}: #{cursor_pos}")
    broadcast_from!(socket, "preview:update_cursor", %{cursor_pos: cursor_pos, user_id: user_id})
    {:reply, :ok, socket}
  end

  def handle_in("preview:clear", _, socket) do
    user_id = socket.assigns.user_id
    Logger.info("Recived clear preview from user #{user_id}")
    broadcast_from!(socket, "preview:clear", %{user_id: user_id})
    {:reply, :ok, socket}
  end

  def handle_in("path:add", path_json, socket) do
    user_id = socket.assigns.user_id
    Logger.info("Recived path add from user #{user_id}")
    # User will clear his own path and receive drawing from server
    broadcast!(socket, "path:add", %{path: path_json, user_id: user_id})
    {:reply, :ok, socket}
  end
end
