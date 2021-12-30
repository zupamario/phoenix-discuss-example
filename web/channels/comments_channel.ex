defmodule Discuss.CommentsChannel do
    use Discuss.Web, :channel

    alias Discuss.{Topic, Comment, User, Presence}

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
            user: user
        })

        push(socket, "presence_state", Presence.list(socket))
        {:noreply, socket}
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
                broadcast!(socket, "comments:#{socket.assigns.topic.id}:new", %{comment: comment})
                {:reply, :ok, socket}
            {:error, _reason} ->
                {:reply, {:error, %{errors: changeset}}, socket}
        end
    end
end