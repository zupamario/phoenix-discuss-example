defmodule Discuss.Router do
  use Discuss.Web, :router

  pipeline :browser do
    plug :accepts, ["html", "json"]
    plug :fetch_session
    plug :fetch_flash
    plug :put_root_layout, {Discuss.LayoutView, :app}
    plug :protect_from_forgery
    plug :put_secure_browser_headers
    plug Discuss.Plugs.SetUser
  end

  pipeline :api do
    plug :accepts, ["json"]
  end

  scope "/", Discuss do
    pipe_through :browser # Use the default browser stack

    # get "/", TopicController, :index
    # get "/topics/new", TopicController, :new
    # post "/topics", TopicController, :create
    # get "/topics", TopicController, :index
    # get "/topics/:id/edit", TopicController, :edit
    # put "/topics/:id", TopicController, :update
    # delete "/topics/:id", TopicController, :delete

    resources "/uploads", UploadController, only: [:index, :new, :create, :show, :delete] do
      get "/thumbnail", UploadController, :thumbnail, as: "thumbnail"
    end

    get "/allread", TopicController, :allread
    get "/whiteboard", TopicController, :whiteboard

    resources "/", TopicController

  end

  scope "/auth", Discuss do
    pipe_through :browser

    get "/signout", AuthController, :signout
    get "/:provider", AuthController, :request
    get "/:provider/callback", AuthController, :callback
  end

  # Other scopes may use custom stacks.
  # scope "/api", Discuss do
  #   pipe_through :api
  # end
end
