defmodule Discuss.WhiteboardAgent do
  use Agent

  def start_link(name) do
    Agent.start_link(fn -> [] end, name: name)
  end
end
