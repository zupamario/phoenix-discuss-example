defmodule Discuss.WhiteboardChannel do
  use Discuss.Web, :channel

  require Logger

  alias Discuss.{User, Presence}

  def join("whiteboard:" <> _topic_id =  name, _params, socket) do
    send(self(), :after_join)

    process_name = String.to_atom(name)
    case DynamicSupervisor.start_child(Discuss.WhiteboardSupervisor, {Discuss.WhiteboardAgent, process_name}) do
      {:ok, pid} -> Logger.info("Started whiteboard agent with pid: #{inspect pid}")
      {:error, {:already_started, pid}} -> Logger.info("Whiteboard agent already started with pid #{inspect pid}")
      error -> raise error
    end
    whiteboard_agent_pid = Process.whereis(process_name)

    IO.puts("whiteboard pid #{inspect whiteboard_agent_pid}")
    {:ok, %{paths: Agent.get(process_name, & Enum.reverse(&1))}, assign(socket, :agent_pid, whiteboard_agent_pid)}
  end

  def handle_info(:after_join, socket) do
    user_id = socket.assigns.user_id
    user = Repo.get(User, user_id)

    {:ok, _} = Presence.track(socket, user_id, %{
        online_at: inspect(System.system_time(:second)),
        user: user,
        typing: false
    })

    push(socket, "presence_state", Presence.list(socket))

    {:noreply, socket}
end

  def handle_in("preview:update", path, socket) do
    user_id = socket.assigns.user_id
    #Logger.debug("Recived path from user #{user_id}: #{path}")
    broadcast_from!(socket, "preview:replace", %{preview_path: path, user_id: user_id})
    {:reply, :ok, socket}
  end

  def handle_in("user:cursor", cursor_pos, socket) do
    user_id = socket.assigns.user_id
    #Logger.debug("Recived cursor pos from user #{user_id}: #{cursor_pos}")
    broadcast_from!(socket, "preview:update_cursor", %{cursor_pos: cursor_pos, user_id: user_id})
    {:reply, :ok, socket}
  end

  def handle_in("preview:clear", _, socket) do
    user_id = socket.assigns.user_id
    #Logger.debug("Recived clear preview from user #{user_id}")
    broadcast!(socket, "preview:clear", %{user_id: user_id})
    {:reply, :ok, socket}
  end

  def handle_in("path:add", path_json, socket) do
    user_id = socket.assigns.user_id
    #Logger.debug("Recived path add from user #{user_id}")
    # User will clear his own path and receive drawing from server
    broadcast!(socket, "path:add", %{path: path_json, user_id: user_id})

    Agent.update(socket.assigns.agent_pid, fn list -> [path_json | list] end)
    {:reply, :ok, socket}
  end
end
