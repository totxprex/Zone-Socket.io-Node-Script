let dotenv = require("dotenv")
dotenv.config({ path: "./config.env" })
let { dbUsers, dbSockets, dbTweets } = require("./schemas.js")

let mongoose = require("mongoose")

mongoose.connect(process.env.mongodb, {
  useCreateIndex: true,
  useFindAndModify: false,
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(function () {
  console.log("Database connected")
})



//All done

const io = require("socket.io")

const socket = io(process.env.PORT, {
  cors: {
    origin: "*"
  }
})

socket.on("connection", function (userSocket) {
  let userSocketId = userSocket.id

  console.log(userSocket.id)

  userSocket.on("username", function (username) {

    //update user new socket id in database
    dbSockets.findOneAndUpdate({ username: username }, { socketId: userSocketId }, {
      runValidators: true
    }).then(function () {
      userSocket.emit("socketIdUpdated", userSocketId)

      //receive push notification request
      userSocket.on("pushNotificationRequest", function (pushNotificationType, toWhichUserName, senderUserName) {
        dbSockets.findOne({ username: toWhichUserName }).then(function (data) {
          let recievingUserSocketId = data.socketId

          userSocket.to(recievingUserSocketId).emit("takePushNotification", pushNotificationType, senderUserName)
        }).catch(function () {
          userSocket.emit("error", "Cannot Connect to Socket")
        })
      })



      //messaging notification
      userSocket.on("sendMessage", function (recieverUsername, messageOBJ) {
        console.log("in mesage")
        let rUsername = recieverUsername
        let msgObj = messageOBJ
        dbSockets.findOne({ username: rUsername }).then(function (data) {
          let recievingUserSocketId = data.socketId

          userSocket.to(recievingUserSocketId).emit("newMessage", msgObj)

          console.log(recievingUserSocketId, msgObj)
        }).catch(function () {
          userSocket.emit("error", "Cannot Connect to Socket")
        })
      })

    }).catch(function () {
      userSocket.emit("error", "Internal Server Error")
    })
  })

})


