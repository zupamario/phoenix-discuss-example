defmodule Discuss.UploadController do
    use Discuss.Web, :controller

    plug Discuss.Plugs.RequireAuth

    alias Discuss.Documents
    alias Discuss.Documents.Upload

    def new(conn, _params) do
        render(conn, "new.html")
    end

    def create(conn, %{"upload" => %Plug.Upload{} = upload}) do
        case Documents.create_upload_from_plug_upload(upload) do
            {:ok, _upload} ->
                conn
                |> put_flash(:info, "file uploaded correctly")
                |> redirect(to: upload_path(conn, :index))
            {:error, reason} ->
                conn
                |> put_flash(:error, "file uploaded failed with reason #{reason}")
                |> render("new.html")
        end
    end

    def index(conn, _params) do
        uploads = Documents.list_uploads()
        render(conn, "index.html", uploads: uploads, show_new_link: true)
    end

    def show(conn, %{"id" => id}) do
      upload = Documents.get_upload!(id)
      local_path = Upload.local_path(upload.id, upload.filename)
      send_download conn, {:file, local_path}, filename: upload.filename
    end

    def delete(conn, %{"id" => id}) do
        case Documents.delete_upload(id) do
          :ok ->
            conn
            |> put_flash(:info, "uploaded file deleted")
            |> redirect(to: upload_path(conn, :index))
          {:error, _reason} ->
            conn
            |> put_flash(:error, "could not delete uploaded file")
            |> redirect(to: upload_path(conn, :index))
        end
    end

    def thumbnail(conn, %{"upload_id" => id}) do
      conn
      |> put_resp_content_type("image/png")
      |> send_file(200, Upload.thumbnail_path(id))
    end
 end
