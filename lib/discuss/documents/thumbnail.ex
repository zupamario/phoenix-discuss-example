defmodule Discuss.Documents.Thumbnail do
  require Logger
  def make_thumbnail(source_path) do
    case System.cmd("vipsthumbnail", [source_path, "--size", "512x", "-o", "%s_tn.png"]) do
      {_output, 0} ->
        Logger.info("thumbnail created for #{source_path}")
        :ok
      {_output, _} ->
        Logger.error("failed to create thumbnail for #{source_path}")
        :error
    end
  end
end