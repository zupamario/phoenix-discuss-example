defmodule Discuss.Documents do

    alias Discuss.Documents.Upload
    alias Discuss.Documents.Thumbnail
    alias Discuss.Repo

    def create_upload_from_plug_upload(%Plug.Upload{
        filename: filename,
        path: tmp_path,
        content_type: content_type
    }) do
        hash = File.stream!(tmp_path, [], 2048)
        |> Upload.sha256()

        Repo.transaction fn ->
            with {:ok, %File.Stat{size: size}} <- File.stat(tmp_path),
                {:ok, upload} <- %Upload{} |> Upload.changeset(%{
                    filename: filename,
                    content_type: content_type,
                    hash: hash,
                    size: size})
                    |> Repo.insert(),
                local_path <- Upload.local_path(upload.id, filename),
                :ok <- File.cp(tmp_path, local_path),
                {:ok, upload} <- create_thumbnail(upload, local_path)
            do
                upload
            else
                {:error, reason} -> Repo.rollback(reason)
            end
        end
    end

    defp create_thumbnail(upload, local_path) do
        case Thumbnail.make_thumbnail(local_path, upload.id) do
            :ok -> Upload.changeset(upload, %{thumbnail?: true}) |> Repo.update()
            :error -> Upload.changeset(upload, %{}) |> Repo.update()
        end
    end

    def list_uploads do
        unsorted = Repo.all(Upload)
        Enum.sort_by(unsorted, &(&1.id))
    end

    @spec get_upload!(any) :: Upload
    def get_upload!(id) do
      Repo.get!(Upload, id)
    end

    def delete_upload(id) do
        upload = Repo.get!(Upload, id)
        Repo.delete(upload)
        File.rm(Upload.local_path(id, upload.filename))
        File.rm(Upload.thumbnail_path(id))
    end
end
