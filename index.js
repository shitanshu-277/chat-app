const express = require('express');
const app=express();
const http=require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const connect = require('./config/db-config');

const Group = require('./models/group');
const Chat = require('./models/chat');

app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.set('view engine','ejs');
// app.use('/',express.static(__dirname+'/public'));

io.on('connection',(socket)=>{
    console.log("a user connected",socket.id)
    socket.on('disconnect',()=>{
        console.log('user disconnected');
    })

    // socket.on('from_client',()=>{
    //     console.log("recieved event from client");
    // })

    // setInterval(function f(){
    //     socket.emit('from_server');
    // },3000);

    socket.on('join_room',(data)=>{
        console.log("joning a room",data.roomid);
        socket.join(data.roomid);
    })

    socket.on('new_msg',async(data)=>{
        console.log("recieved a new message",data);
        const chat = await Chat.create({
            roomid: data.roomid,
            sender: data.sender,
            content: data.message
        })
        io.to(data.roomid).emit('msg_rcvd',data);
        //io.emit('msg_rcvd',data); //emiting to everyone 
        //socket.emit('msg_rcvd',data); // send back to same connection
        //socket.broadcast.emit('msg_rcvd',data); // send to everyone except for on its own
    });
})

app.get('/chat/:roomid/:user',async(req,res)=>{
    const group = await Group.findById(req.params.roomid);
    //console.log(group);
    const chats = await Chat.find({
        roomid:req.params.roomid
    });
    console.log(chats);
    res.render('index',{
        roomid:req.params.roomid,
        user: req.params.user,
        groupname: group.name,
        previousmsgs: chats
    });
})

app.get('/group',async(req,res)=>{
    res.render('group');
})

app.post('/group',async(req,res)=>{
    console.log(req.body);
    await Group.create({
        name: req.body.name
    });
    res.redirect('/group');
})

server.listen(3000,async ()=>{
    console.log('Server is listening on 3000');
    await connect();
    console.log("DB connected");
})