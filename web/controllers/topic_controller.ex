defmodule Discuss.TopicController do
  use Discuss.Web, :controller

  alias Discuss.{Topic, Comment, ReadTimestamp}

  plug Discuss.Plugs.RequireAuth when action in [:new, :create, :edit, :update, :delete, :show]
  plug :check_topic_owner when action in [:update, :edit, :delete]

  def new(conn, _params) do
    changeset = Topic.changeset(%Topic{}, %{})
    render conn, "new.html", changeset: changeset
  end

  def create(conn, %{"topic" => topic}) do
    changeset = conn.assigns.user
      |> build_assoc(:topics)
      |> Topic.changeset(topic)

    case Repo.insert changeset do
      {:ok, _topic} ->
        conn
        |> put_flash(:info, "Topic Created")
        |> redirect(to: topic_path(conn, :index))
      {:error, changeset} ->
        render conn, "new.html", changeset: changeset
    end
  end

  def index(conn, _params) do
    topics = Repo.all(Topic)

    query = from rc in ReadTimestamp,
      where: rc.user_id == ^conn.assigns.user.id,
      select: %{rc.topic_id => rc.updated_at}
    read_counter = Repo.all(query)
    read_counter = Enum.reduce(read_counter, fn m, acc -> Map.merge(acc, m) end)
    #IO.inspect(read_counter)

    last_topic_comments = list_last_comments()
    last_topic_comments = Enum.reduce(last_topic_comments, fn m, acc -> Map.merge(acc, m) end)
    #IO.inspect(last_topic_comments)

    all_topic_ids = Enum.map(topics, fn t -> t.id end)
    topics_with_news = compute_topics_with_news(all_topic_ids, read_counter, last_topic_comments)
    #IO.inspect topics_with_news

    render conn, "index.html", topics: topics, topics_with_news: topics_with_news
  end

  defp compute_topics_with_news(all_topic_ids, read_timestamps, last_topic_comments) do
    outdated = Enum.filter(last_topic_comments, fn {k, v} -> read_timestamps[k] != nil and NaiveDateTime.compare(v, read_timestamps[k]) == :gt end)
      |> Enum.map(fn {k, _v} -> k end)
      |> MapSet.new()
    #IO.inspect(outdated)

    topics_with_timestamps = MapSet.new(Map.keys(read_timestamps))

    MapSet.new(all_topic_ids)
      |> MapSet.difference(topics_with_timestamps)
      |> MapSet.union(outdated)
  end

  def list_last_comments do
    import Ecto.Query

    # Awesome help from this excellent blog post
    # https://elixirforum.com/t/preloading-top-comments-for-posts-in-ecto/1052/22
    query = from(t in Topic, [
      inner_lateral_join: ljc in fragment("SELECT id FROM comments WHERE topic_id = ? ORDER BY updated_at DESC LIMIT 1", t.id),
      inner_join: c in Comment, on: ljc.id == c.id,
      #where: a.id in ^album_ids,
      order_by: [asc: t.id, desc: c.updated_at],
      select: %{t.id => c.updated_at}
    ])
    Repo.all(query)
  end

  def show(conn, %{"id" => topic_id}) do
    topic = Repo.get!(Topic, topic_id)
    render conn, "show.html", topic: topic
  end

  def edit(conn, %{"id" => topic_id}) do
      topic = Repo.get(Topic, topic_id)
      changeset = Topic.changeset(topic)

      render conn, "edit.html", changeset: changeset, topic: topic
  end

  def update(conn, %{"id" => topic_id, "topic" => topic}) do
    old_topic = Repo.get(Topic, topic_id)
    changeset = Topic.changeset(old_topic, topic)

      case Repo.update changeset do
        {:ok, _topic} ->
          conn
          |> put_flash(:info, "Topic Updated")
          |> redirect(to: topic_path(conn, :index))
        {:error, changeset} ->
          render conn, "edit.html", changeset: changeset, topic: old_topic
      end
  end

  def delete(conn, %{"id" => topic_id}) do
    topic = Repo.get!(Topic, topic_id)
    Repo.delete! topic

    conn
    |> put_flash(:info, "Topic #{topic.title} Deleted")
    |> redirect(to: topic_path(conn, :index))
  end

  defp check_topic_owner(conn, _params) do
    %{params: %{"id" => topic_id}} = conn
    if Repo.get(Topic, topic_id).user_id == conn.assigns.user.id do
      conn
    else
      conn
      |> put_flash(:error, "You cannot edit that")
      |> redirect(to: topic_path(conn, :index))
      |> halt()
    end
  end
end
