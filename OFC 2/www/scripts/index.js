isTablet = false;

cards = [];
visibleCards = [];

function getCurrentFile() {
    return window.location.pathname.split("/").pop();
};

function getCurrentCategory() {
    return document.getElementById("category_selector").value;
}

function addCard(card) {
    cards.push(card);
}

function newCategory() {

}

function deleteCard(card) {
    var index = cards.indexOf(card);
    if (index > -1) {
        cards.splice(index, 1);
    }
    save();
}

function askDelete(card) {
    console.log(card);
    navigator.notification.confirm("Are you sure you want to delete the card " + card.title + "?", function (btn) {
        console.log("Deletion ? " + btn);
        if (btn == 1) {
            deleteCard(card);
            showCategoryCards();
        }
    }, "Confirm Deletion", ["Yes", "No"]);
}

function aboutAlert() {
    navigator.vibrate(200);
    navigator.notification.alert(
        "Open Flashcards 2: A simple flashcards app programmed by Adam Furman using Apache Cordova and HTML/JS. \n Information: Version 1.0\n Cards in database: "+cards.length, //UPDATE VERSION
        null,
        "About OFC 2",
        "OK");
}

function openSettings(){}

function Card(title, front, back, category) {
    this.title = title;
    this.front = front;
    this.back = back;
    this.currentSide = 0;
    this.selected = false;
    this.element = null;
    this.content_element = null;
    this.category = category;

    this.toggleSelect = function () {
        console.log(this);
        if (this.selected) {
            this.selected = false;
            this.element.setAttribute("style", "border: 2px solid #171717;");
        } else {
            this.selected = true;
            this.element.setAttribute("style", "border: 2px solid #406acf;");
        }
        navigator.vibrate(200);
    }

    this.edit = function () {
        //Edit the flashcard
    }

    this.resetSide = function () {
        this.currentSide = 0;
        $(this.content_element).last().hide(10);
    }

    this.generateElement = function () {
        this.element = document.createElement("div");
        this.element.setAttribute("class", "card");
        var e_title = document.createElement("p");
        var e_front = document.createElement("div");
        var e_back = document.createElement("div");
        this.content_element = document.createElement("div");
        var e_del = document.createElement("div");
        e_title.setAttribute("class", "titleText");
        e_del.setAttribute("class", "delDiv");
        $(e_del).click({ thisCard: this }, function (evt) {
            askDelete(evt.data.thisCard);
        });
        e_title.innerHTML = this.title;
        $(e_title).longpress($.proxy(this.toggleSelect, this), $.proxy(this.edit, this), 500);
        this.content_element.setAttribute("class", "content");
        e_front.setAttribute("class", "front");
        e_back.setAttribute("class", "back");
        e_front.innerHTML = this.front;
        e_back.innerHTML = this.back;
        e_back.setAttribute("style", "display: none");
        $(this.content_element).click($.proxy(function () {
            if (this.currentSide == 0) {
                this.currentSide = 1;
                $(e_front).hide(250, function () { $(e_back).show(250); });
            } else {
                this.currentSide = 0;
                $(e_back).hide(250, function () { $(e_front).show(250); });
            }
        }, this))
        this.content_element.appendChild(e_front);
        this.content_element.appendChild(e_back);
        this.element.appendChild(e_title);
        this.element.appendChild(this.content_element);
        this.element.appendChild(e_del);
        this.resetSide();
    }

    this.add = function () {
        if (this.element == null) {
            this.generateElement();
        }
        document.getElementById("main").appendChild(this.element);
    }
}

function implementTabletMode() {
    var tcss = document.createElement("link");
    tcss.rel = "stylesheet";
    tcss.href = "css/tablet.css";
    isTablet = true;
    document.head.appendChild(tcss);
}

function removeTabletMode() {
    if (isTablet) {
        $("link[href='css/tablet.css']").remove();
        isTablet = false;
    }
}

function getDataDirectory() {
    if (window.device.platform == "Android") {
        return cordova.file.dataDirectory;
    } else if (window.device.platform == "iOS" || window.device.platform == "WinCE") {
        return cordova.file.syncedDataDirectory;
    } else {
        return cordova.file.dataDirectory;
    }
}

function showCategoryCards() {
    visibleCards = [];
    document.getElementById("main").innerHTML = "";
    cards.forEach(function (card) {
        if (card.category == getCurrentCategory()) {
            visibleCards.push(card);
            card.add();
        }
    });
}

function save() {
    var jsonText = JSON.stringify(cards);
    console.log(jsonText);
    window.resolveLocalFileSystemURL(getDataDirectory(), function (dir) {
        console.log("Data Directory located: " + dir);
        dir.getFile("cards.json", { create: true }, function (file) {
            console.log("cards.json located.");
            file.createWriter(function (fileWriter) {
                var datablob = new Blob([jsonText], { type: "text/plain" });
                fileWriter.write(datablob);
                console.log("Data has been written.");
            });
        });
    });
}

function load(noshow) {
    window.resolveLocalFileSystemURL(getDataDirectory(), function (dir) {
        console.log("Data Directory located for load:.");
        dir.getFile("cards.json", {}, function (file) {
            var reader = new FileReader();
            reader.onloadend = function (e) {
                var datalist = JSON.parse(this.result);
                for (c in datalist) {
                    var curr_c = datalist[c];
                    cards.push(new Card(curr_c.title, curr_c.front, curr_c.back, curr_c.category));
                }
                if (cards == [] && getCurrentCategory() == "Default") {
                    var introCard = new Card("Welcome to OFC2", "Welcome to the Open Flashcards application. Tap or click here to flip.", "This is the back of a card. Tap below to delete.", getCurrentCategory());
                    addCard(introCard);
                }
                if (noshow != true) { showCategoryCards(); }
            }
            file.file(function (wfile) {
                reader.readAsText(wfile);
            });
        }, function () {
            //Something bad has happened. The file does not exist (first run).
            var introCard = new Card("Welcome to OFC2", "Welcome to the Open Flashcards application. Tap or click here to flip.", "This is the back of a card. Tap below to delete.", getCurrentCategory());
            addCard(introCard);
            if (noshow != true) { showCategoryCards(); }
        });
    });
}

function init_main() {
    //Toolbar button setup
    $("#settings_button").longpress(aboutAlert, openSettings, 500);
    $("#new_card_button").longpress(newCategory, function () {
        window.localStorage.setItem("currentCategory", getCurrentCategory());
        window.location = "add_card.html";
    });
    $("#category_selector").change(function () {
        showCategoryCards();
    });
    //Load
    load();
}

(function () {
    "use strict";

    document.addEventListener('deviceready', onDeviceReady.bind(this), false);
    window.addEventListener("orientationchange", function () {
        console.log("Orientation is: " + window.orientation);
        if (Math.abs(window.orientation) == 90 && !isTablet) {
            implementTabletMode();
        } else {
            removeTabletMode();
        }
    });

    function onDeviceReady() {
        // Handle the Cordova pause and resume events
        document.addEventListener( 'pause', onPause.bind( this ), false );
        document.addEventListener( 'resume', onResume.bind( this ), false );

        if (getCurrentFile() == "index.html") {
            init_main();
        } else {
            load(true);
            if(getCurrentFile() == "add_card.html"){
                init_addcard();
            }
        }
    };

    function onPause() {
        // TODO: This application has been suspended. Save application state here.
        save();
    };

    function onResume() {
        // TODO: This application has been reactivated. Restore application state here.
    };
} )();