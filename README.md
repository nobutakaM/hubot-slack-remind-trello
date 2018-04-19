# hubot-slack-remind-trello

## setup

```
npm install
```

## heroku

### .env

```
HUBOT_SLACK_TOKEN: //slack token
HUBOT_TRELLO_KEY: //trello key
HUBOT_TRELLO_TOKEN: //trello token
HUBOT_CONFIG_JSON: /** json string
{
  "members":{(trello member id):(slack member id)},
  "boards":[
    {
      "boardId": (trello target board id),
      "lists":[(trello target list id), ... ],
      "channel": (slack channel)
    }, ...
  ],
  "remindDays":(days)
} **/
```
