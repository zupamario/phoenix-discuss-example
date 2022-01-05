defmodule Discuss.Repo.Migrations.AddCascadingDelete do
  use Ecto.Migration

  def change do
    alter table(:comments) do
      modify(:topic_id, references(:topics, on_delete: :delete_all),
        from: references(:topics, on_delete: :nothing))
    end
  end
end
