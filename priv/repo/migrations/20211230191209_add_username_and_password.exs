defmodule Discuss.Repo.Migrations.AddUsernameAndPassword do
  use Ecto.Migration

  def change do
    alter table(:users) do
      add :name, :string
      add :password_hash, :string
    end
  end
end
