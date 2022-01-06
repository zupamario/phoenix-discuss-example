defmodule Discuss.Repo.Migrations.AddReadTimestamp do
  use Ecto.Migration

  def change do
    create table(:read_timestamps) do
      add :user_id, references(:users, on_delete: :delete_all)
      add :topic_id, references(:topics, on_delete: :delete_all)

      timestamps()
    end

    create unique_index(:read_timestamps, [:user_id, :topic_id], name: :only_one_per_user_and_topic)
  end
end
