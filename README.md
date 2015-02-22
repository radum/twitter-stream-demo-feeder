#Twitter streams using node, redis, pubsub and sse

##Feeder App

This takes the twitter API and looks for tweets contining country names and save the info in a REDIS store.

Also once we found a country we publish `stream.score_updates` with the info.

###About Twitter stream API

When you use the statuses/filter endpoint, you are filtering from the full firehose, with a maximum resulting volume of 1% of the total Tweets at that moment.

In other words, if the keywords you are tracking account for less than 1% of the firehose, you will receive all the matching Tweets, otherwise you will be capped around 1%.

There are more than 500 million Tweets posted every single day on Twitter, so 1% of those is already a very large number!

#Considerations

The code by now means must be considered production ready. It is just an idea and a proof of concept. I can be improved quite a great deal.

#TODO

- [ ] better docs on how to run
- [ ] better code, clean shit up
- [ ] demo
