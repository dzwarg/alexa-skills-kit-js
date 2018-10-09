/**
 * App ID for the skill
 */
var APP_ID = 'amzn1.ask.skill.fce7e3b2-59e0-41db-8477-5c1dc4d6392b';

/**
 * The AlexaSkill prototype and helper functions
 */
var AlexaSkill = require('./AlexaSkill'),
  storage = require('./storage');

/**
 * BananaManager is a child of AlexaSkill.
 * To read more about inheritance in JavaScript, see the link below.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Introduction_to_Object-Oriented_JavaScript#Inheritance
 */
var BananaManager = function () {
    AlexaSkill.call(this, APP_ID);
};

// Extend AlexaSkill
BananaManager.prototype = Object.create(AlexaSkill.prototype);
BananaManager.prototype.constructor = BananaManager;

BananaManager.prototype.eventHandlers.onSessionStarted = function (sessionStartedRequest, session) {
    console.log("BananaManager onSessionStarted requestId: " + sessionStartedRequest.requestId
        + ", sessionId: " + session.sessionId);
    // any initialization logic goes here
};

BananaManager.prototype.eventHandlers.onLaunch = function (launchRequest, session, response) {
    console.log("BananaManager onLaunch requestId: " + launchRequest.requestId + ", sessionId: " + session.sessionId);
    storage.loadStore(session, function (currentStore) {
      var speechOutput = "I am your banana manager. I can tell you how many bananas there are. You can ask me how many bananas.";
      var repromptText = "You can say how many bananas";
      response.ask(speechOutput, repromptText);
    });
};

BananaManager.prototype.eventHandlers.onSessionEnded = function (sessionEndedRequest, session) {
    console.log("BananaManager onSessionEnded requestId: " + sessionEndedRequest.requestId
        + ", sessionId: " + session.sessionId);
    // any cleanup logic goes here
};

BananaManager.prototype.intentHandlers = {
    "AddBananas": function (intent, session, response) {
      storage.loadStore(session, function (currentStore) {
        var bananaCount = (intent.slots.Some.value ? parseInt(intent.slots.Some.value, 10) : 0),
          bananaType = (intent.slots.Freshness.value ? intent.slots.Freshness.value : "normal");

        if (currentStore.data.bananas[bananaType] !== undefined) {
          currentStore.data.bananas[bananaType] = parseInt(currentStore.data.bananas[bananaType], 10) + bananaCount;
        } else {
          currentStore.data.types.push(bananaType);
          currentStore.data.bananas[bananaType] = bananaCount;
        }

        currentStore.save(function () {
          response.tellWithCard(
            "Added " + bananaCount + " " + bananaType + " bananas", // speechOutput
            "Banana Manager", // cardTitle
            "Added " + bananaCount + " " + bananaType + " bananas. Now there are " + currentStore.data.bananas[bananaType] + " " + bananaType + " bananas" // cardText
          );
        });
      })
    },
    "GetBananas": function (intent, session, response) {
      storage.loadStore(session, function (currentStore) {
        var bananaCount = currentStore.count(intent.slots.Freshness.value),
          bananaType = (intent.slots.Freshness.value ? intent.slots.Freshness.value : "");
        response.tellWithCard(
          "There are " + bananaCount + " " + bananaType + " bananas", // speechOutput
          "Banana Manager", // cardTitle
          "" + bananaCount + " " + bananaType + "bananas"); // cardText
      })
    },
    "RemoveBananas": function (intent, session, response) {
      storage.loadStore(session, function(currentStore) {
        var bananaCount = (intent.slots.Some.value ? parseInt(intent.slots.Some.value, 10) : 0),
          bananaType = (intent.slots.Freshness.value ? intent.slots.Freshness.value : "normal");

        if (currentStore.data.bananas[bananaType] !== undefined) {
          if (currentStore.data.bananas[bananaType] == 0) {
            response.tellWithCard(
              "There are no more " + bananaType + " bananas", // speechOutput
              "Banana Manager", // cardTitle
              "0 " + bananaType + " bananas" // cardText
            );
            return;
          } else if (currentStore.data.bananas[bananaType] - bananaCount < 0) {
            response.tellWithCard(
              "There are not enough " + bananaType + " bananas to do that", // speechOutput
              "Banana Manager", // cardTitle
              "No bananas removed. " + bananaCount + " " + bananaType + " bananas" // cardText
            );
            return;
          }

          currentStore.data.bananas[bananaType] = currentStore.data.bananas[bananaType] - bananaCount;

          currentStore.save(function () {
            response.tellWithCard(
              "Removed " + bananaCount + " " + bananaType + " bananas", // speechOutput
              "Banana Manager", // cardTitle
              "Removed " + bananaCount + " " + bananaType + " bananas. Now there are " + currentStore.data.bananas[bananaType] + " " + bananaType + " bananas" // cardText
            );
          });
        } else {
          response.tellWithCard(
            "There are no " + bananaType + " bananas", // speechOutput
            "Banana Manager", // cardTitle
            "There are no " + bananaType + " bananas" // cardText
          );
          return;
        }
      });
    },
    "AMAZON.HelpIntent": function (intent, session, response) {
        response.ask("Ask me about bananas!", "Ask me about bananas!");
    }
};

// Create the handler that responds to the Alexa Request.
exports.handler = function (event, context) {
    // Create an instance of the BananaManager skill.
    new BananaManager().execute(event, context);
};
