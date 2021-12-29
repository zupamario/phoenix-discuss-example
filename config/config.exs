# This file is responsible for configuring your application
# and its dependencies with the aid of the Mix.Config module.
#
# This configuration file is loaded before any dependency and
# is restricted to this project.
import Config

# General application configuration
config :discuss,
  ecto_repos: [Discuss.Repo]

# Configures the endpoint
config :discuss, Discuss.Endpoint,
  url: [host: "localhost"],
  secret_key_base: "wHIQ+cHm0thgI29XeUmrRzS9rQpRBGx9MGA/LCdlw//TTeaLnnEjPJDbXH1KSah8",
  render_errors: [view: Discuss.ErrorView, accepts: ~w(html json)],
  pubsub_server: Discuss.PubSub

# Configures Elixir's Logger
config :logger, :console,
  format: "$time $metadata[$level] $message\n",
  metadata: [:request_id]

config :phoenix, :json_library, Jason

# Import environment specific config. This must remain at the bottom
# of this file so it overrides the configuration defined above.
import_config "#{Mix.env}.exs"

# Configure uberauth
config :ueberauth, Ueberauth,
  providers: [
    github: { Ueberauth.Strategy.Github, [default_scope: "user:email", send_redirect_uri: false] }
  ]

# This is safe on the server but you should hide these keys when putting stuff on Github
# Hide the key!
config :ueberauth, Ueberauth.Strategy.Github.OAuth,
  #client_id: System.get_env("GITHUB_CLIENT_ID"),
  #client_secret: System.get_env("GITHUB_CLIENT_SECRET")
  client_id: "fdabdea1d8e42ebb5faa",
  client_secret: "122fdaa7b0e3a3a424b50a1d060a01d092a7a1d4"
