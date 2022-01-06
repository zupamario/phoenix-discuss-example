defmodule Discuss.CommentsChannel do
    use Discuss.Web, :channel
    require Logger

    alias Discuss.{Topic, Comment, User, Presence, ReadTimestamp}

    def join("comments:" <> topic_id, _params, socket) do
        topic_id = String.to_integer(topic_id)
        topic = Repo.get(Topic, topic_id)
            |> Repo.preload(comments: [:user])

        send(self(), :after_join)

        {:ok, %{comments: topic.comments}, assign(socket, :topic, topic)}
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

        update_read_timestamp(socket)

        {:noreply, socket}
    end

    defp update_read_timestamp(socket) do
        user_id = socket.assigns.user_id
        topic_id = socket.assigns.topic.id
        cs = ReadTimestamp.changeset(%ReadTimestamp{user_id: user_id, topic_id: topic_id})
        Repo.insert(cs, on_conflict: {:replace, [:updated_at]}, conflict_target: [:user_id, :topic_id])
    end

    def handle_in("user:typing", %{"typing" => is_typing}, socket) do
        user_id = socket.assigns.user_id
        user = Repo.get(User, user_id)

        {:ok, _} = Presence.update(socket, user_id, %{
            online_at: inspect(System.system_time(:second)),
            user: user,
            typing: is_typing
        })

        {:reply, :ok, socket}
    end

    def handle_in(_name, %{"content" => content}, socket) do
        topic = socket.assigns.topic
        user_id = socket.assigns.user_id

        changeset = topic
            |> build_assoc(:comments, user_id: user_id)
            |> Comment.changeset(%{content: content})

        case Repo.insert(changeset) do
            {:ok, comment} ->
                comment = Repo.preload(comment, :user)
                broadcast!(socket, "comments:new", %{comment: comment})
                {:reply, :ok, socket}
            {:error, _reason} ->
                {:reply, {:error, %{errors: changeset}}, socket}
        end
    end

    intercept ["comments:new"]

    @doc """
    When a user receives a message we reord the time so we know the current read state of the user
    """
    def handle_out("comments:new", msg, socket) do
        push(socket, "comments:new", msg)
        update_read_timestamp(socket)
        {:noreply, socket}
    end
end
