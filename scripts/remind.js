// Description:
//  Trello Task Remind

schedule = require('node-schedule')
Trello = require('node-trello')
Slack = require('slack-node')
moment = require('moment')
config = JSON.parse(process.env.HUBOT_CONFIG_JSON)

trello = new Trello(
  process.env.HUBOT_TRELLO_KEY,
  process.env.HUBOT_TRELLO_TOKEN
)
slack = new Slack(process.env.HUBOT_SLACK_TOKEN)
now = moment()

remindBoard = (robot, board) => {
  trello.get(`/1/boards/${board.boardId}/cards`, {}, (err, data) => {
    if(err){
      robot.send(err)
      return
    }

    for(card of data){
      if (card.due !== null && board.lists.includes(card.idList)){
        due = moment(card.due)
        diff = due.diff(now, 'days')

        if (diff >= 0 && diff <= config.remindDays) {
          mention = card.idMembers.map(m => `<@${config.members[m]}>`).join([separator = ' '])
          attachments = [
            {
              color: '#c30',
              pretext: `${mention} タスクの期限が近づいています！`,
              title: `${card.name}`,
              title_link: `${card.url}`,
              fields: [
                {
                  title: '期限',
                  value: `${due.format("YYYY/MM/DD h:mm A")}`,
                  short: true
                }
              ]
            }
          ]
          options = { attachments: attachments }
          robot.send({ room: board.channel }, '', options)
        }
      }
    }
  })
}

module.exports = (robot) => {
  schedule = new schedule.scheduleJob(config.schedule, () => {
      for(board of config.boards){
        remindBoard(robot,board)
      }
  })

  robot.hear(/\bslack members/i, (res) =>{
    slack.api("users.list", {}, (err, data) => {
      if(err){
        robot.send(err)
        return
      }

      var msg = "\nSlackメンバー情報！\n"
      msg += data.members.map(m => `名前：${m.profile.real_name} Slack ID：${m.id}`).join([separator = '\n'])
      robot.send({ room: res.envelope.room }, msg)
    })
  })

  robot.hear(/\btrello members/i, (res) =>{
    for(board of config.boards){
      trello.get(`/1/boards/${board.boardId}/members`, {}, (err, data) => {
        if(err){
          robot.send(err)
          return
        }
        var msg = `\nTrelloメンバー情報！\nボードID：${board.boardId}\n`
        msg += data.map(m => `名前：${m.fullName} Trello ID：${m.id}`).join([separator = '\n'])
        robot.send({ room: res.envelope.room }, msg, {})
      })
    }
  })

  robot.hear(/\bshow env/i, (res) =>{
    robot.send({ room: res.envelope.room }, `\`\`\`${JSON.stringify(config)}\`\`\``)
  })
  
  robot.hear(/\bshow schedule/i, (res) =>{
    for(board of config.boards){
        remindBoard(robot,board)
      }
  })

  robot.hear(/\bset members\s+(\S+)/i, (res) =>{
    config.members = JSON.parse(res.match[1])
    process.env.HUBOT_CONFIG_JSON = JSON.stringify(config)
    robot.send({ room: res.envelope.room }, `\`\`\`${process.env.HUBOT_CONFIG_JSON}\`\`\``)
  })
}
