//pour se prémunir des attaques xss
const xssFilters = require('xss-filters');

//pour manipuler les dates
const moment = require("moment");
moment.locale("fr");
dateFormat = "DD MMM à HH:mm:ss";

//pour sauvegarder les messages en bdd
const db = require('./db.js');

//contient la liste des users connectés
const chatUsers = [];

//contient les 20 derniers messages envoyés
const lastChatMessages = [];

//cette fonction sera appelée dans index.js
//en nous passant la variable http (dont les 2 fichiers ont besoin)
function chatServer(http){
    //notre serveur socket.io
    const io = require('socket.io')(http);

//////envoie la liste des pseudos des utilisateurs connectés aux clients
    function sendUserList(){
        //on ne veut envoyer que les username, pas les sockets...
        let usernames = [];
        for(let i = 0; i < chatUsers.length; i++){
            usernames.push(chatUsers[i].username);
        }

        //émet le message
        io.emit("user_list", {usernames: usernames});
    }

//////quand on perd la connexion avec un socket
    function onDisconnect(socket) {
        //cherche le user dans le tableau des utilisateurs connectés
        for (let i = 0; i < chatUsers.length; i++) {
            //si le socket qui vient de se déconnecter est le même qu'on avait stocké...
            if (chatUsers[i].socket == socket) {
                //prévient tout le monde de la déconnexion
                io.emit("user_logout", {
                    username: chatUsers[i].username
                });

                //retire le user du tableau des utilisateurs
                chatUsers.splice(i, 1);
            }
        }

        //rafraîchit la liste des users connectés
        sendUserList();
    }

//////quand quelqu'un envoie son username
    function onLogin(data, socket) {

        //crée un petit objet contenant à la fois le username et le socket
        //ce sera utile lors de la déconnexion d'un socket, pour savoir quel username y est associé
        let user = {
            username: data.username,
            socket: socket
        };

        //on ajoute ce petit objet dans le tableau des users connectés
        chatUsers.push(user);

        //on envoie ces données à tout le monde...
        let sendData = {
            username: data.username,
            date: moment(),
            formattedDate: moment().format(dateFormat),
        }

        //...mais on envoie un message différent à la personne qui vient de se logger qu'à tous les autres
        
        //aux autres
        socket.broadcast.emit("login", sendData);
        
        //à la personne qui vient de se logger
        socket.emit("self_login", sendData);
        
        //envoie les 20 derniers messages
        socket.emit("last_messages", { messages: lastChatMessages });

        //actualise la liste des utilisateurs connectés
        sendUserList();
    }

//////quand on reçoit un nouveau message de chat...
    function onNewChatMessage(data, socket) {
        //prépare les données
        sendData = {
            username: xssFilters.inHTMLData(data.username), //protection xss
            message: xssFilters.inHTMLData(data.message), 
            date: moment(),
            formattedDate: moment().format(dateFormat), //formate la date pour l'affichage
        };

        //sauvegarde dans mysql pour la postérité. voir db.js
        db.saveChatMessage({
            username: sendData.username,
            message: sendData.message,
            mysqlDate: moment(sendData.date).format("YYYY-MM-DD HH:mm:ss")
        });

        //garde en mémoire ce message
        //retire le plus vieux message si y'en a 20
        if (lastChatMessages.length >= 20) {
            lastChatMessages.shift();
        }
        //ajoute au tableau global
        lastChatMessages.push(sendData);

        //on répond à tous les users en envoyant un message portant le même nom
        //le message contient le pseudo, le message et la date
        io.emit("new_chat_message", sendData);
    }

//////appelée lors d'une nouvelle connexion
    function onConnection(socket) {
        console.log("nouvelle connection sur le serveur ws !");

        //lorsqu'on perd la connexion avec un socket...
        socket.on("disconnect", () => {
            onDisconnect(socket);
        });

        //quand qqn a entré son pseudo...
        socket.on("login", (data) => {
            onLogin(data, socket);
        });

        //quad on recoit un nouveau message de chat...
        socket.on("new_chat_message", (data) => {
            onNewChatMessage(data, socket);
        });
    }

    //lorsque qqn se connecte sur le serveur de ws...
    io.on("connection", onConnection);
}

//rend la FONCTION disponible dans index.js
module.exports = chatServer;