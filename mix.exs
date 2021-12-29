defmodule Discuss.Mixfile do
  use Mix.Project

  def project do
    [app: :discuss,
     version: "0.0.1",
     elixir: "~> 1.13",
     elixirc_paths: elixirc_paths(Mix.env),
     compilers: [:phoenix, :gettext] ++ Mix.compilers,
     build_embedded: Mix.env == :prod,
     start_permanent: Mix.env == :prod,
     aliases: aliases(),
     deps: deps()]
  end

  # Configuration for the OTP application.
  #
  # Type `mix help compile.app` for more information.
  def application do
    [mod: {Discuss, []},
    extra_applications: [:logger, :runtime_tools]]
  end

  # Specifies which paths to compile per environment.
  defp elixirc_paths(:test), do: ["lib", "web", "test/support"]
  defp elixirc_paths(_),     do: ["lib", "web"]

  # Specifies your project dependencies.
  #
  # Type `mix help deps` for examples and options.
  defp deps do
    [{:phoenix, "~> 1.6.5"},
     {:phoenix_ecto, "~> 4.4"},
     {:ecto_sql, "~> 3.6"},
     {:postgrex, ">= 0.0.0"},
     {:phoenix_html, "~> 3.0"},
     {:phoenix_live_reload, "~> 1.2", only: :dev},
     {:phoenix_pubsub, "~> 2.0"},
     {:gettext, "~> 0.18"},
     {:plug_cowboy, "~> 2.5"},
     {:ueberauth, "~> 0.5"},
     {:ueberauth_github, "~> 0.8"},
     {:jason, "~> 1.2"}]
  end

  # Aliases are shortcuts or tasks specific to the current project.
  # For example, to create, migrate and run the seeds file at once:
  #
  #     $ mix ecto.setup
  #
  # See the documentation for `Mix` for more info on aliases.
  defp aliases do
    ["ecto.setup": ["ecto.create", "ecto.migrate", "run priv/repo/seeds.exs"],
     "ecto.reset": ["ecto.drop", "ecto.setup"],
     test: ["ecto.create --quiet", "ecto.migrate", "test"],
     "assets.deploy": ["cmd ./node_modules/brunch/bin/brunch build", "phx.digest"]]
  end
end
