defmodule Discuss.WhiteboardChannel do
  use Discuss.Web, :channel

  require Logger

  def join("whiteboard:" <> topic_id, _params, socket) do
    {:ok, %{welcome: "whiteboard"}, socket}
  end

  def handle_in("preview:update", path, socket) do
    user_id = socket.assigns.user_id
    Logger.info("Recived path from user #{user_id}: #{path}")
    broadcast!(socket, "preview:replace", %{preview_path: path})
    {:reply, :ok, socket}
  end
end
