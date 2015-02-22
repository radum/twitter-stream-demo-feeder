'use strict';

var _ = require('lodash');
var _config = require('./twitter.json');
var Twitter = require('twitter');
var countries = require('./countries.json');

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
    consumer_key: process.env.twitter_consumer_key || _config[0],
    consumer_secret: process.env.twitter_consumer_secret || _config[1],
    access_token_key: process.env.twitter_access_token_key || _config[2],
    access_token_secret: process.env.twitter_access_token_secret || _config[3]
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
