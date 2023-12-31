const express = require('express')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)
const { v4: uuidV4 } = require('uuid')
const { ExpressPeerServer } = require("peer")
const nodemailer = require('nodemailer')
const download = require('downloadjs')
const FileSaver = require('file-saver')


const peerServer = ExpressPeerServer(server, {
  debug: true,
  config: {
    'iceServers' : [{urls : "stun:stun.stunprotocol.org"
          },
          {
            urls: 'turn:numb.viagenie.ca',
          credential: 'Ahel@2000',
          username : 'aheldc@gmail.com'
        },
      ]
  }
})

app.use('/peerjs', peerServer)
app.set('view engine', 'ejs')
app.use(express.static('public'))

/*app.get('/', (req, res) => {
  res.redirect(`/${uuidV4()}`)
})

app.get('/:room', (req, res) => {
  res.render('room', { roomId: req.params.room })
})

app.get('/home/create',(req,res) => {
  res.render('landing')
})

app.get('/home/create-meeting',(req,res) => {
  res.render('create')
})*/

var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'msteams72@gmail.com',
    pass: 'Demo@2021'
  }
});

const admin = require('firebase-admin');


const serviceAccount = require('./public/firebase/firebaseService.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const doc = db.collection('meetings');

app.get('/', (req, res) => {
  res.redirect('/home')
})

app.get('/home',(req,res) => {
  res.render('landing')
})

app.get('/create-meeting',(req,res) => {
  res.render('create')
})

app.get('/join-meeting',(req,res) => {
  res.render('join')
})

app.get('/meeting',(req,res) => {
  const room = uuidV4()
  doc.add({
    meetingId: room
  })

  res.redirect(`/${room}`)
})

app.get('/:room', (req, res) => {
  
  res.render('room', { roomId: req.params.room})
})

app.get('/home/404',(req,res) => {
  res.render('404')
})

app.get('/home/whiteboard',(req,res) => {
  res.render('whiteboard')
})

io.on('connection', socket => {
  socket.on('send-message',(id,message,room) => {
    socket.to(room).broadcast.emit('receive-message',id,message)
  })

  socket.on('share-link',(mailId,user,roomId) => {
    var mailOptions = {
      from: 'msteams72@gmail.com',
      to: mailId,
      subject: user + ' invited you to a Teams meeting',
      html: `<p>Please visit <a href='https://stormy-brook-32763.herokuapp.com/join-meeting'>here</a> and enter the Meeting Id <b>${roomId}</b> when prompted.
      <br></br>
      <p>Or you may also join the meeting directly from <a href='https://stormy-brook-32763.herokuapp.com/${roomId}'>here</a>. Your video and audio will both be switched off by default.</p>
      Regards,
      <br></br>
      MS Teams</p>`,
    };

    transporter.sendMail(mailOptions, function(error, info){
      if (error) {
        console.log(error);
      } else {
        console.log('Email sent: ' + info.response);
      }
    });
  })

  socket.on('download-video',data => {
    download(data,"test.webm","video/webm")
  })

  socket.on('join-room', (roomId, userId) => {
    socket.join(roomId)
    socket.to(roomId).broadcast.emit('user-connected', userId)

    socket.on('disconnect', () => {
      socket.to(roomId).broadcast.emit('user-disconnected', userId)
    })
  })

  
})

server.listen(process.env.PORT || 3009, ()=>{
  console.log('Listening in port 3000...')
})