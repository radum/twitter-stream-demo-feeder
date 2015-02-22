'use strict';

var _ = require('lodash');
var Twitter = require('twitter');
var countries = require('./countries.json');
var app = require('express')();

var redisConfig = {
    host: '192.168.59.103',
    port: 6379
};

var url = require('url').parse(process.env.REDISCLOUD_URL || '');

if(url.hostname !== null) {
    redisConfig = {
        host: url.hostname,
        port: url.port
    };
}

var redis = require('redis').createClient(redisConfig.port, redisConfig.host);

if(url.hostname !== null) {
    redis.auth(url.auth.split(':')[1]);
}

var twitter = new Twitter({
    consumer_key: process.env.twitter_consumer_key || require('./twitter.json')[0],
    consumer_secret: process.env.twitter_consumer_secret || require('./twitter.json')[1],
    access_token_key: process.env.twitter_access_token_key || require('./twitter.json')[2],
    access_token_secret: process.env.twitter_access_token_secret || require('./twitter.json')[3]
});

var regExp = new RegExp('(?:' + (countries.join('|')) + ')', 'g');

var scanCountries = function(str) {
    var matches = [];
    var idx = null;
    regExp.lastIndex = 0;

    while (idx = regExp.exec(str)) {
        matches.push(idx[0]);
    }

    return matches;
};

var args = ['country_score', 1, null];
var foundCountries = [];

twitter.stream('statuses/filter', {track: countries.join(',')}, function(stream) {
    stream.on('data', function(tweet) {
        foundCountries = _.uniq(scanCountries(tweet.text));

        _.forEach(foundCountries, function(val) {
            args[2] = val;

            redis.zincrby(args, function(err) {
                if(err) {
                    console.log(err);
                } else {
                    redis.publish('stream.score_updates', args[2]);
                }
            });

            // console.log(foundCountries);
        });
    });

    console.log('feeder running');

    stream.on('error', function(error) {
        throw error;
    });
});

// Bind web port for heroku not to crash
app.set('port', (process.env.PORT || 5000));

app.all('/', function(req, res){
    res.send('Hello World!');
});

app.listen(app.get('port'), function() {
    console.log('Node app is running at localhost:' + app.get('port'));
});
