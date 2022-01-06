defmodule Discuss.ReadTimestamp do
  use Discuss.Web, :model

  schema "read_timestamps" do
    belongs_to :user, Discuss.User
    belongs_to :topic, Discuss.Topic

    timestamps()
  end

  def changeset(struct, _params \\ %{}) do
    change(struct)
  end
end
