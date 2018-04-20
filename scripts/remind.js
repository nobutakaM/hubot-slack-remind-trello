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
          robot.send({ room: board.channel }, `
          ${mention}
          以下のタスクの期限が近づいています！
          タイトル：${card.name}
          期限：${due.format("YYYY/MM/DD h:mm A")}
          URL：${card.url}`)
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
    var msg = "\nTrelloメンバー情報！\n"
    for(board of config.boards){
      trello.get(`/1/boards/${board.boardId}/members`, {}, (err, data) => {
        console.log(board)
        if(err){
          robot.send(err)
          return
        }
        msg += data.map(m => `名前：${m.fullName} Trello ID：${m.id} Slack ID：${config.members[m.id]}`).join([separator = '\n'])
      })
    }
    robot.send({ room: res.envelope.room }, msg)
  })
}
