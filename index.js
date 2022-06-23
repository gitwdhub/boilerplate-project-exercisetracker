const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongodb = require("mongodb");
const mongoose=require('mongoose');
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true });
app.use('/',bodyParser.urlencoded({extended: false}));
app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

let User
const {Schema}=mongoose;
const userSchema=new Schema({
  username: {
    type: String,
    required: true
  },
  log: [{
    description: {
      type: String,
      required: true
    },
    duration: {
      type: Number,
      required: true
    },
    date: {
      type: Date,
      required: true
    }
  }]
});
User=mongoose.model('User',userSchema);

app.post('/api/users',function(req,res){
  var {username}=req.body;

  User.findOne({username:username},function(err,data){
    if(err){
      return console.log(err)
           }
    if(data){
//            console.log('username already taken, please try another name');
            res.send(`${username}  already taken, please try another name`);
           }else{
                var newUser= new User({
                                username: username,
                                log:[]
                                });
                newUser.save(function(err,data){
                    if(err){return console.log('saving err:'+err)};
                    var {username,_id}=data;
                    res.json({username:username,_id:_id})
                })
           };
  })
})

app.get('/api/users',function(req,res){
  User.find({}).select({log:0,__v:0}).exec(function(err,data){
    if(err){return console.log(err)};
    res.send(data)
  });
})

app.post('/api/users/:_id/exercises',function(req,res){
  var{description,duration,date}=req.body;
  var {_id}=req.params;
  if(!date){
  var dateT=new Date();
  }else{
  var dateT=new Date(date);
  }

  if(!dateT){
    res.send('wrong date input');
  }
  if(_id==''){
    console.log('_id is MUST');
    res.send('pls input _id');
  }else if(description==''|| duration==''){
    console.log('pls input description AND duration')
    res.send('pls input description AND duration')
  }
//  console.log(res)
  User.findById({_id:_id},function(err,data){
    if(err){return console.log(err)};

    var log={description:description,
            duration:duration,
            date:dateT,}
    data.log.push(log);

    data.save((err,updateData)=>{
      if(err){return console.log('saving err:'+err)};
      var{_id,username}=updateData;
      var{description,duration,date}=updateData.log[0];
      res.json({
        username:username,
        description:description,
        duration:duration,
        date:date.toDateString(),
        _id:_id
      })
    })
  })
//  res.json({userId:req.body[':_id'],user_id:_id})
})

app.get('/api/users/:_id/logs',function(req,res){
  var {_id}=req.params;
  var {from,to,limit}=req.query;
  limit=parseInt(limit);
  User.findOne({_id:_id},function(err,data){
    if(err){return console.log(err)};
    if(data){
    var {_id,username,log}=data;
    var totalLog=[...log];

    
    if(from){
      tFrom=new Date(from)
      totalLog=totalLog.filter((l)=> {

        if (l.date >= tFrom){
          return l;
        }});
//      console.log('from:'+totalLog)
    };
    if(to){
      tTo=new Date(to);
      totalLog=totalLog.filter((l)=>{
        if(l.date <= tTo){
          return l;
        }});
//      console.log('to:'+totalLog)
    };
    totalLog=totalLog.sort((a,b)=>{

      return b.date-a.date;
    }).map(items=>({
        description:items.description,
        duration:items.duration,
        date:items.date.toDateString(),
    }));
    
    if(limit && limit<totalLog.length){
      totalLog=totalLog.slice(0,limit);
      };
    
   
  res.json({
      _id:_id, 
      username:username,
      count:totalLog.length,
      log:totalLog
    });
  
    }else{
      res.send('wrong data')
    }
  })
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
