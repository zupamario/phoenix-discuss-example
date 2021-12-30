defmodule Discuss.Presence do
    use Phoenix.Presence,
        otp_app: :discuss,
        pubsub_server: Discuss.PubSub
end