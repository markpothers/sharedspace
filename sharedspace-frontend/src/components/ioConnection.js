import socketIO from 'socket.io-client'

// const io = socketIO('http://10.185.5.173:8080')

let io = null

const initSocket = () => {
  if (!io) {
    io = socketIO('http://10.185.5.173:8080', { //socket.io = io =......
      transportOptions: {
        polling: {
          extraHeaders: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      }
    })
  }
}

export  {io, initSocket}
// export const socket =   { io }
