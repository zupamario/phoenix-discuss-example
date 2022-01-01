defmodule Discuss.Documents do

    alias Discuss.Documents.Upload
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
                :ok <- File.cp(tmp_path, Upload.local_path(upload.id, filename))
            do
                upload
            else
                {:error, reason} -> Repo.rollback(reason)
            end
        end
    end

    def list_uploads do
        Repo.all(Upload)
    end

    @spec get_upload!(any) :: Upload
    def get_upload!(id) do
      Repo.get!(Upload, id)
    end

    def delete_upload(id) do
        upload = Repo.get!(Upload, id)
        Repo.delete(upload)
        File.rm(Upload.local_path(id, upload.filename))
    end
end