// NOTE: The contents of this file will only be executed if
// you uncomment its entry in "web/static/js/app.js".

// To use Phoenix channels, the first step is to import Socket
// and connect at the socket path in "lib/my_app/endpoint.ex":
import {Socket, Presence} from "phoenix"

let socket = new Socket("/socket", {params: {token: window.userToken}})
socket.onError( () => console.log("there was an error with the socket connection!") )
socket.onClose( () => console.log("the socket connection dropped") )

// When you connect, you'll often need to authenticate the client.
// For example, imagine you have an authentication plug, `MyAuth`,
// which authenticates the session and assigns a `:current_user`.
// If the current user exists you can assign the user's token in
// the connection for use in the layout.
//
// In your "web/router.ex":
//
//     pipeline :browser do
//       ...
//       plug MyAuth
//       plug :put_user_token
//     end
//
//     defp put_user_token(conn, _) do
//       if current_user = conn.assigns[:current_user] do
//         token = Phoenix.Token.sign(conn, "user socket", current_user.id)
//         assign(conn, :user_token, token)
//       else
//         conn
//       end
//     end
//
// Now you need to pass this token to JavaScript. You can do so
// inside a script tag in "web/templates/layout/app.html.eex":
//
//     <script>window.userToken = "<%= assigns[:user_token] %>";</script>
//
// You will need to verify the user token in the "connect/2" function
// in "web/channels/user_socket.ex":
//
//     def connect(%{"token" => token}, socket) do
//       # max_age: 1209600 is equivalent to two weeks in seconds
//       case Phoenix.Token.verify(socket, "user socket", token, max_age: 1209600) do
//         {:ok, user_id} ->
//           {:ok, assign(socket, :user, user_id)}
//         {:error, reason} ->
//           :error
//       end
//     end
//
// Finally, pass the token on connect as below. Or remove it
// from connect if you don't care about authentication.

socket.connect()
socket.connect()
socket.connect()
socket.connect()
socket.connect()

const createSocket = (topicId) => {
  // Now that you are connected, you can join channels with a topic:
  let channel = socket.channel(`comments:${topicId}`, {})
  const presence = new Presence(channel);
  
  presence.onSync(() => {
    renderPresence(presence.list());
  });
  
  presence.onJoin((key, current, joiner) => {
    console.log('join', key, current, joiner);
  });

  presence.onLeave((key, current, leaver) => {
    console.log('leave', key, current, leaver);
  });

  channel.join()
    .receive("ok", resp => { 
      console.log("Joined successfully", resp)
      renderComments(resp.comments);
    })
    .receive("error", resp => { console.log("Unable to join", resp) })
  
  channel.on(`comments:${topicId}:new`, renderComment);

  channel.onError( () => console.log("there was an error with the channel connection!") )
  channel.onClose( () => console.log("the channel has gone away gracefully") )

  document.querySelector('button').addEventListener('click', () => {
    const content = document.querySelector('textarea').value;
    document.querySelector('textarea').value = "";
    channel.push('comment:add', { content: content })
  });

  document.querySelector('.materialize-textarea').addEventListener("keypress", (event) => {
    if(event.which === 13 && !event.shiftKey){
      const content = document.querySelector('textarea').value;
      channel.push('comment:add', { content: content })
      event.target.value = "";
      event.preventDefault(); // Prevents the addition of a new line in the text field (not needed in a lot of cases)
    }
  });
};

function renderPresence(presence) {
  const templates = [];
  for (const [key, value] of Object.entries(presence)) {
    console.log(key, value);
    templates.push(presenceChipTemplate(value.metas[0].user.email));
  }
  document.querySelector('.presence-chips').innerHTML = templates.join('');
}

function presenceChipTemplate(name) {
  return `
  <div class="chip teal accent-3">
    ${name}
  </div>`
}

function renderComments(comments) {
  const renderedComments = comments.reverse().map(comment => {
    return commentTemplate(comment);
  });
  document.querySelector('.collection').innerHTML = renderedComments.join('');
}

function renderComment(event) {
  const renderedComment = commentTemplate(event.comment);
  document.querySelector('.collection').innerHTML = renderedComment + document.querySelector('.collection').innerHTML;
}

function commentTemplate(comment) {
  let email = 'Anonymous';
  if (comment.user) {
    email = comment.user.email;
  }

  return `
  <li class="collection-item teal-text text-darken-3">
    ${comment.content}
    <div class = "secondary-content">
      <span class="teal-text text-lighten-2" style="font-size: 12px;">${email}</span>
    </div>
  </li>
`;
}

window.createSocket = createSocket;
