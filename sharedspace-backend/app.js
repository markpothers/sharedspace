const User = require('./models/User')
const Message = require('./models/Message')
const express = require('express')
const cors = require('cors')
const app = express()
const bodyParser = require('body-parser')
const pry = require('pryjs')
const socketIo = require('socket.io')
const jwt = require('jsonwebtoken')

const io = socketIo(8080,  {
    handlePreflightRequest: function (req, res) {
        var headers = {
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Allow-Origin': 'http://localhost:3000',
            'Access-Control-Allow-Credentials': true
        }
        res.writeHead(200, headers)
        res.end()
    }
})

const usernamesAndSocketIDs = {}
const rooms = {}

io.on('connection', socket => {

console.log("trying to connect")
  //if the authorization is good, cool, if not close the socket
  console.log("attempting to connect")

  if (socket.handshake.headers.authorization !== "Bearer null") {
    console.log(socket.handshake.headers.authorization)
    let [ type, token ] = socket.handshake.headers.authorization.split(' ')
    let result = jwt.decode(token)
    let userID = result.id

    usernamesAndSocketIDs[socket.id] = result.username
    // puts the user in a room
    socket.on('room', (obj) => {
      socket.join(`room_${obj.roomID}`)
      console.log(obj)
      if (rooms[obj.roomID] === undefined) {
        rooms[obj.roomID] = {
          id: obj.roomID,
          users: [obj.username]
        }
      } else if (!rooms[obj.roomID].users.includes(obj.username)) {
        rooms[obj.roomID].users.push(obj.username)
      }

      io.sockets.in(`room_${obj.roomID}`).emit('usersInRoom', rooms[obj.roomID].users)
    })
    // Messages
    socket.on('messages.index', (room, respond) => {
      Message.findAll()
      .then( messages => {
        const roomMessages = messages.filter(msg => msg.roomID === room.roomID)
        respond(roomMessages)
      })
    })

    socket.on('messages.new', (message, respond) => {
      console.log(message)
      const roomID = message.roomID
      Message.create(message)
      Message.findAll()
      .then( messages => {
        const roomMessages = messages.filter(msg => {
          return msg.roomID == roomID
        })
        io.sockets.in(`room_${roomID}`).emit('messages.newMessageFromServer', roomMessages)
      })
    })
    // Instruments
    socket.on('pianoSend', (obj) => {
      io.sockets.in(`room_${obj.room}`).emit('pianoReceive', (`${obj.note}_piano`))
    })

    socket.on('drumSend', (obj) => {
      io.sockets.in(`room_${obj.room}`).emit('drumReceive', (`${obj.note}_drums`))
    })
    // Videos
    socket.on('playVideo', (obj) => {
      io.sockets.in(`room_${obj.room}`).emit('playVideoForAll', ("test"))
    })

    socket.on('pauseVideo', (obj) => {
      io.sockets.in(`room_${obj.room}`).emit('pauseVideoForAll', ("test"))
    })

    socket.on('updateVideoID', (obj) => {
      io.sockets.in(`room_${obj.room}`).emit('receiveNewVideoID', (obj.videoID))
    })
    // Removes a user from a room on disconnect
    socket.on('disconnect', () => {
      let departingUser = usernamesAndSocketIDs[socket.id]
      let currentRoom = null

      for (var room in rooms) {
        if (rooms[room].users.includes(departingUser)){
          currentRoom = rooms[room]
          break
        }
      }
      if (currentRoom) {
        currentRoom.users.splice(currentRoom.users.indexOf(departingUser),1)
        io.sockets.in(`room_${currentRoom.id}`).emit('usersInRoom', currentRoom.users)
      }
    })

  } else {
    console.log("shutting this socket down")
    io.close()
  }
})

io.listen(8081)
//------------------------------------------------------------------------------------
app.use(cors())
app.use(bodyParser())

app.post('/createUser', (req, res) => {
  newUser = User.build({username: req.body.username})
  newUser.password = req.body.password
  // eval(pry.it)
  newUser.save()
  .then(newUser => res.json(newUser.toJSON()))
  .catch(error => {
    console.log(error.errors[0])
    res.json({validationError: error.errors[0].path})
   })
})

app.post('/login', (req, res) => {
  // eval(pry.it)
  User.findOne({ where: {username: req.body.username} })
  .then(user => {
    // console.log(user)
    if (user == null){
      res.json("Username")
    } else {
      if (user.authenticate(req.body.password)) {
        res.json(user.toJSON())
      } else {
        res.json("Password")
      }
    }
  })
.catch(error => {
  console.log(error)
})
})

app.listen(3001)

console.log("backend up and running!")
