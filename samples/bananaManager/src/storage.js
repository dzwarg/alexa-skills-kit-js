'use strict';
var AWS = require("aws-sdk");

var storage = (function () {
    var dynamodb = new AWS.DynamoDB({apiVersion: '2012-08-10'});

    /*
     * The Game class stores all game states for the user
     */
    function Store(session, data) {
        if (data) {
            this.data = data;
        } else {
            this.data = {
                bananas: {},
                types: []
            };
        }
        this._session = session;
    }

    Store.prototype = {
        count: function(bananaType) {
          var bananaCount = 0,
            bananaData = this.data;
          if (bananaType) {
            if (bananaType in bananaData.bananas) {
              return bananaData.bananas[bananaType];
            }
            return 0;
          }
          bananaData.types.forEach(function (bananaType) {
            bananaCount += bananaData.bananas[bananaType];
          });
          return bananaCount;
        },
        isEmpty: function () {
          var allEmpty = true;
          var bananaData = this.data;
          bananaData.types.forEach(function (bananaType) {
              if (bananaData.bananas[bananaType] !== 0) {
                  allEmpty = false;
              }
          });
          return allEmpty;
        },
        save: function (callback) {
          //save the game states in the session,
          //so next time we can save a read from dynamoDB
          this._session.attributes.store = this.data;
          dynamodb.putItem({
              TableName: 'BananaManagerUserData',
              Item: {
                  CustomerId: {
                      S: this._session.user.userId
                  },
                  Data: {
                      S: JSON.stringify(this.data)
                  }
              }
          }, function (err, data) {
              if (err) {
                  console.log(err, err.stack);
              }
              if (callback) {
                  callback();
              }
          });
        }
    };

    return {
        loadStore: function (session, callback) {
            if (session.attributes.store) {
                console.log('get store from session=' + session.attributes.store);
                callback(new Store(session, session.attributes.store));
                return;
            }
            dynamodb.getItem({
                TableName: 'BananaManagerUserData',
                Key: {
                    CustomerId: {
                        S: session.user.userId
                    }
                }
            }, function (err, data) {
                var currentStore;
                if (err) {
                    console.log(err, err.stack);
                    currentStore = new Store(session);
                    session.attributes.store = currentStore.data;
                    callback(currentStore);
                } else if (data.Item === undefined) {
                    currentStore = new Store(session);
                    session.attributes.store = currentStore.data;
                    callback(currentStore);
                } else {
                    console.log('get store from dynamodb=' + data.Item.Data.S);
                    currentStore = new Store(session, JSON.parse(data.Item.Data.S));
                    session.attributes.store = currentStore.data;
                    callback(currentStore);
                }
            });
        },
        newGame: function (session) {
            return new Store(session);
        }
    };
})();
module.exports = storage;
