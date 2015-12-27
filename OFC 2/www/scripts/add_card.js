function saveCard() {
    var card = new Card($("#title").val(), $("#front").val(), $("#back").val(), window.localStorage.getItem("currentCategory"));
    cards.push(card);
    save();
}

function cancel() {
    window.location = "index.html";
}

function init_addcard() {
    $("#save_card").click(saveCard);
    $("#cancel_creation").click(cancel);
}