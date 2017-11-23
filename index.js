//inclue le framework express
const express = require("express");
//inclue notre moteur de templates, nunjucks
const nunjucks = require("nunjucks");

const xssFilters = require('xss-filters');

const moment = require("moment");
moment.locale("fr");
dateFormat = "DD MMM à HH:mm:ss";

const db = require('./db.js');

//crée un serveur HTTP avec express
const app = express();

//crée un serveur en lui passant notre application express
//requis par socket.io
const http = require('http').Server(app);
io = require('socket.io')(http);

const chatUsers = [];

const lastChatMessages = [];

function sendUserList(){
    var usernames = [];
    for(var i = 0; i < chatUsers.length; i++){
        usernames.push(chatUsers[i].username);
    }

    io.emit("user_list", {usernames: usernames});
}

//lorsque qqn se connecte sur le serveur de ws...
io.on("connection", function(socket){
    console.log("nouvelle connection sur le serveur ws !");

    socket.on("disconnect", function(){
        //cherche le user dans le tableau des utilisateurs connectés
        for(var i = 0; i < chatUsers.length; i++){
            //si le socket qui vient de se déconnecter est le même qu'on avait stocké...
            if (chatUsers[i].socket == socket){

                console.log(chatUsers[i].username + " disconnected");
                
                //prévient tout le monde de la déconnexion
                io.emit("user_logout", {
                    username: chatUsers[i].username
                });

                //retire le user du tableau des utilisateurs
                chatUsers.splice(i, 1);
            }
        }

        sendUserList();
    });

    //quand qqn a entré son pseudo...
    socket.on("login", function (data) {

        let user = {
            username: data.username,
            socket: socket
        };

        chatUsers.push(user);

        //on envoie les mêmes données à tout le monde
        let sendData = {
            username: data.username,
            date: moment(),
            formattedDate: moment().format(dateFormat),
        }

        //on envoie un message différent à la personne qui vient de se logger qu'à tous les autres
        //aux autres
        socket.broadcast.emit("login", sendData);
        //à la personne qui vient de se logger
        socket.emit("self_login", sendData);
        //envoie les derniers messages
        socket.emit("last_messages", {messages: lastChatMessages});

        sendUserList();        
    });

    //quad on recoit un nouveau message...
    socket.on("new_chat_message", function (data) {
        //prépare les données
        sendData = {
            username: xssFilters.inHTMLData(data.username),
            message: xssFilters.inHTMLData(data.message),
            date: moment(),
            formattedDate: moment().format(dateFormat),
        };

        //sauvegarde dans mysql pour la postérité
        db.saveChatMessage({
            username: sendData.username,
            message: sendData.message,
            mysqlDate: moment(sendData.date).format("YYYY-MM-DD HH:mm:ss")
        });

        //garde en mémoire ce message
        //retire le plus vieux message si y'en a 20
        if (lastChatMessages.length >= 20){
            lastChatMessages.shift();
        }
        lastChatMessages.push(sendData);

        //on répond à tous les users en envoyant un message portant le même nom
        //le message contient le pseudo, le message et la date
        io.emit("new_chat_message", sendData);
    });
});

//inclue nos contrôleurs
const movieController = require("./movieController.js");
const chatController = require("./chatController.js");

//nos fichiers statiques css, js, img, etc... se trouve dans le dossier assets
app.use(express.static('assets'));

//nos fichiers de vue se trouve dans le dossier views/
nunjucks.configure('views', {
    autoescape: true, //on active l'échappement automatique des caractères spéciaux
    express: app //on associe nunjucks à notre serveur express
});

//si on est sur la page d'accueil, on appelle la méthode homePage() de notre contrôleur
app.get("/", movieController.homePage);

//si on est sur l'URL /detail/unIdDeFilm, on appelle detailPage()
app.get("/detail/:movieId", movieController.detailPage);

//utilisé par l'autocomplétion dans la recherche
//les requêtes ajax sont envoyées à cette URL
app.get("/api/ajax_search/", movieController.ajaxSearch);

app.get("/chat", chatController.chatPage);

//le serveur écoute sur le port 3000
http.listen(3000, function(){
    console.log("Express écoute à http://localhost:3000");
})