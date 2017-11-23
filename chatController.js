//crée un objet ressemblant à une classe
const chatController = {
    chatPage: function(req, res){
        res.render("chat.html");
    },
}

//on exporte notre variable pour la rendre disponible dans les autres fichiers
module.exports = chatController;