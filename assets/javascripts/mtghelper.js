/*********************************************
 *   MTGHelper functions                     *
 *********************************************/

/**
 * We add a function to merge two arrays and remove duplicates by modifying Array.prototype
 */ 
Array.prototype.unique = function() {
    var a = this.concat();
    for(var i=0; i<a.length; ++i) {
        for(var j=i+1; j<a.length; ++j) {
            if(a[i] === a[j])
                a.splice(j--, 1);
        }
    }
    return a;
};

var allCardList = [];
var colorCardList = {
    "black":    [],
    "blue":    [],
    "green":    [],
    "red":    [],
    "white":    [],
    "none":    []
};
var selectedColors = [];
var deck = [];


/*
function cardNextList(card) {
    var cardLists = [
        "card-list-search",
        "card-list-deck"
    ];
    var idParent = card.parent().id;
    var idNext = cardLists[(cardLists.indexOf(idParent) + 1 ) % cardLists.length];
    console.log(idNext);
    return idNext;
}
*/

function getCardName(card) {
    var name = card.name;
    
    // Aftermath cards
    if (card.layout == "aftermath")
        name = card.names.join(" // ");

    return name;
}

function getCardID(card) {
    var cardName = getCardName(card)
                    .replace(/\/|,|\./gi, "")
                    .replace(/ |'/gi, "-")
                    .replace(/--/gi, "-")
                    .toLowerCase();
    return "card-" /*+ card.number + "-"*/ + cardName;  
}

function nameToURL(name) {
    return name.replace(/ /gi, "+")
                .toLowerCase();
}

function createCardElement(item, index) {
    var container = $("#card-list-all");
    var cardName = getCardName(item);
    var cardID = getCardID(item);
    
    // Check if item does not exists
    if ($("#" + cardID).size() > 0)
        return;
    
    var card = $("<div>", {
        id:     cardID,
        class:  "card-list-card",
        css:    {
            width:      223,
            height:     311
        }
    });
    var img = $("<img>", {
        src:    "http://gatherer.wizards.com/Handlers/Image.ashx?type=card&name=" + nameToURL(cardName)
    });
    
    card.html(img);
    container.append(card);
    
    
    // Click event on card
    card.click(function(e) {
        var nextContainerID = "card-list-deck";
        var nextContainer = $("#" + nextContainerID);
        
        // Configuration clon
        var clone = $(this).clone();
        clone.click(function(e) {
        
            // On supprime l'information de la carte dans le deck
            var index = deck.indexOf(item);
            deck.splice(index, 1);
            
            // Suppression de l'element du DOM
            $(this).remove();
            
            // On actualise le compteur de cartes
            $("#deck-size-label").html(deck.length + " cards");
        });
        
        // Ajout du clon dans le conteneur
        clone.appendTo(nextContainer);
        resizeContainer("#" + nextContainerID);
        
        // On ajoute l'info de la carte au deck
        deck.push(item);
        
        // On actualise le compteur de cartes
        $("#deck-size-label").html(deck.length + " cards");
    });
}

function processCard(item, index) {
    createCardElement(item, index);
    
    allCardList.push(item);
    
    if (item.colors) {
        item.colors.forEach(function(color, indexColor) {
            colorCardList[color.toLowerCase()].push(item);
        });
    }
    else {
        colorCardList["none"].push(item);
    }
}

function resizeContainer(containerSelector) {
    var container = $(containerSelector);
    var firstCard = $(container.children()[0]);
    var widthCard = firstCard.outerWidth(true);
    container.css({width: (widthCard * (container.children().length + 1))});
}

$(function() {
    // Load cards information
    $.ajax({
        url: "https://mtgjson.com/json/XLN.json",
        method: "GET",
        dataType: "json",
        
        error: function(jqXHR, textStatus, errorThrown) {
            console.log(errorThrown);
        },
        
        success: function(data, textStatus, jqXHR) {
            // Création de cartes
            var cards = data.cards;
            cards.forEach(processCard);
            
            resizeContainer("#card-list-all");
        }
    });


    // Click color checkbox
    $(".card-list-search-color input[type=\"checkbox\"]").click(function(e) {
        var color = $(this).val();
        
        if (color == "all") {
            $(".card-list-search-color input[type=\"checkbox\"]").each(function (index, checkbox) {
                if ($(checkbox).val() != "all") {
                    $(checkbox).attr({"checked" : false});
                }
            });
            
            if (this.checked) {
                selectedColors = [];
            }
        }
        else {
            $(".card-list-search-color input[type=\"checkbox\"]").each(function (index, checkbox) {
                if ($(checkbox).val() == "all") {
                    $(checkbox).attr({"checked" : false});
                }
            });
            
            if (this.checked) {
                selectedColors.push(color);
            }
            else {
                selectedColors.splice(selectedColors.indexOf(color), 1);
            }
            
            selectedColors.sort();
        }
        
        
        // Filtrage de la liste de cartes
        var selectedCardLists = [];
        if (selectedColors.length == 0) {
            selectedCardLists = [].concat(allCardList);
        }
        else {
            selectedColors.forEach(function(color, index) {
                selectedCardLists = selectedCardLists.concat(colorCardList[color]).unique();
            });
        }

        // Affichage de cartes
        var container = $("#card-list-all");
        container.html("");
        
        selectedCardLists.forEach(createCardElement);
        
        // Redimension du conteneur
        resizeContainer("#card-list-all");
    });
    
    
    // Select deck list
    $("#deck-load-select").ready(function(e) {
        //var deckFolderURL = document.location.href + "/../decks/";
        var deckFolderURL = "decks/decks.php";
        
        $.ajax({
            url: deckFolderURL,
            success: function(data){
                var files = [];
                files = data.split("|");
                
                /*
                $(data).find("td > a").each(function(index, item) {
                    if (index > 0) {
                        var file = $(this).attr("href");
                        files.push(file);
                    }
                });
                */
                
                files.forEach(function(item, index) {
                    $.ajax({
                        url: "decks/" + item,
                        success: function(data) {
                            var option = $("<option>", {
                                "value" : JSON.stringify(data)
                            });
                            option.html(item.replace(/%20/gi, " "));
                            $("#deck-load-select").append(option);
                        }
                    });
                });
            }
        });
        
        $(this).change(function(e) {
            console.log("click !");
            var value = $(this).find("option:selected").val();
            console.log(value);
            if (value != "") {
                $("#deck-load-input-text").val(value);
                $("#deck-load").click();
            }
        });
    });
    
    
    // Load deck button
    $("#deck-load").click(function(e) {
        $("#card-list-deck .card-list-card").each(function(index, item) {
            $(item).click();
        });
        
        var str = $("#deck-load-input-text").val();
        var deckCardIDs = JSON.parse(str);
        deckCardIDs.forEach(function(cardID, index) {
            $("#card-list-all #" + cardID).click();
        });
        
        $("#deck-load-input-text").val("");
    });
    
    
    // Save deck button
    $("#deck-save").click(function(e) {
        var deckCardIDs = [];
        deck.forEach(function(item, index) {
            deckCardIDs.push(getCardID(item));
        });
        
        var str = JSON.stringify(deckCardIDs);
        console.log(str);
        
        //Save the file contents as a DataURI
        var dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(str);

        //Write it as the href for the link
        window.open(dataUri);
    });
    
    
    // ============= TEST =============
    
    function updateTestDeckCounter() {
        // On actualise le compteur de cartes
        $("#test-size-label").html(deckTest.length + " cards left");
    }
    
    function shuffleDeck(deckCardsLeft, toDeck) {
        while(deckCardsLeft.length > 0) {
            var rand = Math.floor((Math.random() * deckCardsLeft.length));
            var card = deckCardsLeft.splice(rand, 1)[0];
            deckTest.push(card);
        }
    }
    
    // Restart test deck button
    $("#test-restart").click(function(e) {
        deckTest = [];
        shuffleDeck(deck.slice(0), deckTest);
        $("#card-list-test").html("");
        updateTestDeckCounter();
    });
    
    // Shuffle test deck button
    $("#test-shuffle").click(function(e) {
        deckTest = [];
        shuffleDeck(deckTest.slice(0), deckTest);
    });
    
    // Draw one card test button
    $("#test-draw").click(function(e) {
        var card = deckTest.splice(0, 1)[0];
        
        var cardID = getCardID(card);
        var cardDOM = $("#card-list-all #" + cardID);
        
        // Show drawn card
        var nextContainerID = "card-list-test";
        var nextContainer = $("#" + nextContainerID);
        
        // Configuration clon
        var clone = cardDOM.clone();
        clone.click(function(e) {
            $(this).remove();
        });
        
        // Ajout du clon dans le conteneur
        clone.appendTo(nextContainer);
        //resizeContainer("#" + nextContainerID);
        
        updateTestDeckCounter();
    });
    
    // First hand test button
    $("#test-hand").click(function(e) {
        $("#test-restart").click();
        for (var i = 0; i < 7; i++) {
            $("#test-draw").click();
        }
    });
});
