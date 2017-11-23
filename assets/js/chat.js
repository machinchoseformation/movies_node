//se connecte au serveur de websocket
var socket = io();

//on stocke ici le pseudo choisi
var username = null;

//tente de récupérer le pseudo depuis le local storage
if (null !== window.localStorage.getItem("chat_username")){
    username = window.localStorage.getItem("chat_username");
    loginAndShowChat(username);
}
else {
    showLogin();
}

//permet de faire défiler la fenêtre de chat jusqu'en bas
function updateScroll() {
    $('#messages_window').scrollTop($('#messages_window')[0].scrollHeight);
}

function showLogin(){
    //cache et affiche les fenêtres
    $("#username_form").show();
    $("#message_form").hide();
    $("#messages_window").hide();
}

//lance l'événement de login et affiche le chat
function loginAndShowChat(username){
    //émet un évènement de "login" en envoyant le pseudo
    socket.emit("login", {
        username: username
    });

    //cache et affiche les fenêtres
    $("#username_form").hide();
    $("#message_form").show();
    $("#messages_window").show();
}

//écoute la soumission du formulaire de pseudo
$("#username_form").on("submit", function(e){
    //empêche la soumission du formulaire
    e.preventDefault();

    //récupère la valeur du pseudo entrée par le user
    username = $("#username_input").val();

    //stocke le pseudo dans le localstorage
    window.localStorage.setItem("chat_username", username);

    loginAndShowChat(username);
});

//écoute la soumission du formulaire de message
$("#message_form").on("submit", function(e){
    //empêche la soumission du formulaire
    e.preventDefault();

    //récupère le message tapé
    var message = $("#message_input").val();

    //envoie le message au serveur, avec le username
    socket.emit("new_chat_message", {
        username: username,
        message: message
    });

    //vide le champ
    $("#message_input").val("");
});

function addSpecialChatMessage(message, color){
    color = color || "";

    //affiche un message spécial dans le chat
    var specialMessage = `
        <div class="special_message ${color}">
            <p>${message}</p>
        </div>
    `;

    $("#messages_window").append(specialMessage);
    updateScroll();
}

//écoute pour le message de type "login" d'un autre user envoyé par le serveur ws
socket.on("login", function(data){
    addSpecialChatMessage(data.username + ' just connected!');
});

//écoute pour le message de type "self_login" envoyé par le serveur ws
//pour sa propre connexion
socket.on("self_login", function (data) {
    addSpecialChatMessage('Hello ' + data.username);
});

//quand un utilisateur s'est déconnecté...
socket.on("user_logout", function (data) {
    addSpecialChatMessage(data.username + ' disconnected!', 'orange');
})

//ajoute un message au chat
function addChatMessage(data){
    //prépare le message pour le chat
    var messageHTML = `
        <div class="message">
            <div>
                <span class="username_info">${data.username}</span>
                <span class="data_info">${data.formattedDate}</span>
            </div>
            <div class="message_content">${data.message}</div>
        </div>
    `;

    //ajoute au dom
    $("#messages_window").append(messageHTML);
}

//écoute pour le message de type "login" envoyé par le serveur ws
socket.on("new_chat_message", function(data){
    addChatMessage(data);
    updateScroll();
})

//quand on vient de se connecter, on recoit aussi ce message content les 20 derniers messages
socket.on("last_messages", function(data){
    console.log("last_messages");

    for(var i = 0; i < data.messages.length; i++){
        addChatMessage(data.messages[i]);
    }

    updateScroll();
});

//quand on reçoit la liste des users connectés...
socket.on("user_list", function(data){
    var userListString = data.usernames.join(" / ");
    $("#user_list").html(userListString);
})