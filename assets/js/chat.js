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

//écoute pour le message de type "login" d'un autre user envoyé par le serveur ws
socket.on("login", function(data){
    //affiche un message dans le chat
    var specialMessage = `
        <div class="special_message">
            <p>${data.username} just connected!</p>
        </div>
    `;

    $("#messages_window").append(specialMessage);
    updateScroll();
});

//écoute pour le message de type "self_login" envoyé par le serveur ws
//pour sa propre connexion
socket.on("self_login", function (data) {
    //affiche un message dans le chat
    var specialMessage = `
        <div class="special_message">
            <p>Hello ${data.username}!</p>
        </div>
    `;

    $("#messages_window").append(specialMessage);
    updateScroll();
});

//écoute pour le message de type "login" envoyé par le serveur ws
socket.on("new_chat_message", function(data){

    var message = data.message;

    //prépare et affiche le message dans le chat
    var messageHTML = `
        <div class="message">
            <div>
                <span class="username_info">${data.username}</span>
                <span class="data_info">${data.formattedDate}</span>
            </div>
            <div class="message_content">${message}</div>
        </div>
    `;

    $("#messages_window").append(messageHTML);
    updateScroll();
})

socket.on("last_messages", function(data){
    console.log("last_messages");

    for(var i = 0; i < data.messages.length; i++){
        //prépare et affiche le message dans le chat
        var messageHTML = `
        <div class="message">
            <div>
                <span class="username_info">${data.messages[i].username}</span>
                <span class="data_info">${data.messages[i].formattedDate}</span>
            </div>
            <div class="message_content">${data.messages[i].message}</div>
        </div>
    `;

        $("#messages_window").append(messageHTML);
    }

    updateScroll();
});


socket.on("user_logout", function(data){
    //affiche un message dans le chat
    var specialMessage = `
        <div class="special_message orange">
            <p>${data.username} disconnected!</p>
        </div>
    `;

    $("#messages_window").append(specialMessage);
    updateScroll();
})

socket.on("user_list", function(data){
    var userListString = data.usernames.join(" / ");
    $("#user_list").html(userListString);
})