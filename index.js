var express=require('express');
var app=express();
var _=require('underscore');
var mongoose=require('./db/connect');
var user=require('./db/indexUser');
var post=require('./db/indexPost');
var async=require('async');
var request=require('request');
var geonoder=require('geonoder');
var cookies=require('cookies');
var keys=require('./keys/keys.json');
var client = require('twilio')(keys.twilio.key1, keys.twilio.key2);
var applicationKey=keys.goibibo.applicationKey;
var applicationId=keys.goibibo.applicationId;
var nodemailer = require('nodemailer');
var fs=require('fs');
var hash={};
String.prototype.hashCode = function() {
  var hash = 0;
	if (this.length == 0) return hash;
	for (i = 0; i < this.length; i++) {
		char = this.charCodeAt(i);
		hash = ((hash<<5)-hash)+char;
		hash = hash & hash; // Convert to 32bit integer
	}
	return Math.abs(hash)%1000000;
};
// create reusable transporter object using SMTP transport
var transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user:keys.gmail.user,
        pass: keys.gmail.password
    }
});
var baseURL="http://developer.goibibo.com/api/stats/minfare/?app_id="+applicationId+"&app_key="+applicationKey+"&format=json";
db=mongoose.connection;
db.on('open',function(){
	console.log('connected to DB');
});
db.on('error',console.error.bind(console,"connection error"));
require('./config/express')(app);
app.get('/parseCSV',function(req,res){
	fs.readFile('city_list.csv',function(err,csv){
		if(err)
			res.send(err);
		else
		{
			csv=csv.toString();
			var lines=csv.split("\n");
			var result = [];
			var headers=lines[0].split(",");
		  	for(var i=1;i<lines.length;i++){
			  var obj = {};
			  var currentline=lines[i].split(",");
			  for(var j=0;j<headers.length;j++){
			  		if(j!=2 || currentline[j]!="1");
			  		else
			  		{
			  			obj[headers[j]] = currentline[j];
				  		hash[currentline[1].hashCode()]=currentline[0];
			  		}
			  }
			  result.push(obj);
		  	}
		  //return result; //JavaScript object
		  result=JSON.stringify(result);
		  res.send(JSON.parse(result));
		}
	});
});
app.get('/share',function(req,res){
	var userId=req.cookies.userId;
	if(userId==' '||userId==undefined)
	{
		res.redirect(301,'/');
	}
	else
		res.render('share');
});
app.get('/discover',function(req,res){
	var userId=req.cookies.userId;
	console.log(userId);
	if(userId==' '||userId==undefined)
	{
		console.log('Here');
		res.redirect(301,'/');
	}
	else{	
	var finalResult=[];
	user.find({'_id':userId},function(err,result){
		if(err)
			res.send(err);
		else
		{
			var len,rem;
			var iteration=0;
			var array=result[0].friendsByFb;
			var opArray=[];
			len=rem=result[0].friendsByFb.length;
			async.eachSeries(array,function(data,next){
				var friendId=data.id;
				var index=array.indexOf(data);
				//var opArray[index]=[];
				async.series([
					function(cb){
						user.find({'_id':friendId},function(err,resultFriend){
							if(resultFriend.length==0);
							else
							{
								opArray.push.apply(opArray,resultFriend[0].taggedPlaces);
								console.log(opArray);
							}
							cb(null,opArray);
						});
					}
				],function(err,resultSeries){
					console.log('async.eachSeries() callback iteration # = ' + iteration);
        			iteration++;
        			next(null, opArray);
				});
			},function(err,results){
				if(err)
					console.log(err);
				else
				{
					console.log(opArray);
					res.render('discover',{data:opArray});
      				console.log('All data has been processes successfully.');
				}
			})
		}
		});	
	}
	//res.render('discover');
});

app.get('/getCity/:name',function(req,res){
	var cityName=req.params.name;
	fs.readFile('city_list.csv',function(err,csv){
		if(err)
			res.send(err);
		else
		{
			csv=csv.toString();
			var lines=csv.split("\n");
			var result = [];
			var headers=lines[0].split(",");
		  	for(var i=1;i<511;i++){
				var obj = {};
				var currentline=lines[i].split(",");				
				var hashKey=currentline[0].replace(" ","");
				//console.log(hashKey.trim());
				hash[hashKey]=currentline[1];
				//console.log(hashKey,hash.hashKey);
		  	}
		  	console.log(hash['"Panvel"']);
		  	console.log('\'"'+cityName+'"\'');
		  	console.log(hash['\''+cityName+'\'']);
		}
	});
});
app.get('/',function(req,res){
	fs.readFile('city_list.csv',function(err,csv){
		if(err)
			res.send(err);
		else
		{
			csv=csv.toString();
			var lines=csv.split("\n");
			var result = [];
			var headers=lines[0].split(",");
		  	for(var i=1;i<511;i++){
				var obj = {};
				var currentline=lines[i].split(",");				
				var hashKey=currentline[0].replace(" ","");
				//console.log(hashKey.trim());
				hash[hashKey]=currentline[1];
				//console.log(hashKey,hash.hashKey);
		  	}
		  	console.log(hash);
		  	console.log(hash['"Doha"']);
		}
	});
	res.render('index',{data:true});
});
app.post('/findIfId',function(req,res){
	var id=req.body.id;
	user.find({'_id':id},function(err,result){
		if(err)
			res.send(err);
		else
		{
			if(result.length!=0)
			{
				res.send(false);
			}
			else
			{
				var newUser=user({
					_id:id,
					userName:req.body.name
				});
				newUser.save(function(err){
					if(err)
					{
						console.log(err);
					}
					else
					{
						console.log('New User Created!');
						res.send('New User Created');
					}
				})
			}
		}
	})
});
app.post('/addTaggedPlaces',function(req,res){
	var data=req.body.data;
	var id=req.body.userId;
	console.log(id);
	var finalResult=[];
	user.find({'_id':id},function(err,result){
		if(err)
			res.send(err);
		console.log(result);
		result[0].taggedPlaces=[];
		data.forEach(function(element,index){
			result[0].taggedPlaces.push({latitude:element.place["location"].latitude,longitude:element.place["location"].longitude,city:element.place["location"].city});
		});
		result[0].save();
		console.log("Places Tagged!");
		res.cookie('userId', id).send('Cookie is set');
	});
});
app.get('/getPlaces/:Id',function(req,res){
	var finalResult=[];
	var userId=req.params.Id;
	user.find({'_id':userId},function(err,result){
		if(err)
			res.send(err);
		else
		{
			var len,rem;
			var iteration=0;
			var array=result[0].friendsByFb;
			var opArray=[];
			len=rem=result[0].friendsByFb.length;
			async.eachSeries(array,function(data,next){
				var friendId=data.id;
				var index=array.indexOf(data);
				//var opArray[index]=[];
				async.series([
					function(cb){
						user.find({'_id':friendId},function(err,resultFriend){
							if(resultFriend.length==0);
							else
							{
								opArray.push.apply(opArray,resultFriend[0].taggedPlaces);
								console.log(opArray);
							}
							cb(null,opArray);
						});
					}
				],function(err,resultSeries){
					console.log('async.eachSeries() callback iteration # = ' + iteration);
        			iteration++;
        			next(null, opArray);
				});
			},function(err,results){
				if(err)
					console.log(err);
				else
				{
					res.send(opArray);
      				console.log('All data has been processes successfully.');
				}
			})
		}
	});
});
app.post('/addFriends',function(req,res){
	var data=req.body.data;
	//console.log(data);
	var id=req.body.id;
	user.find({'_id':id},function(err,result){
		result[0].friendsByFb=[];
		data.forEach(function(element,index){
			result[0].friendsByFb.push(element);
		});
		result[0].save();
		console.log('Added Friends');
		res.send("Friends Added Successfully");
	});
});/*
app.get('/getInfo/:placeName',function(req,res){
	var placeName=req.params.placeName;
	geonoder.toCoordinates('Delhi', geonoder.providers.google, function(latitude, longitude) {
    	console.log('Lat: ' + latitude + ' Long: ' + longitude) // Lat: 41.8965209 Long: 12.4805225 

	});
});*/
app.post('/getInfo',function(req,res){
	var userLat=req.body.userLat,userLong=req.body.userLong,lat=req.body.lat,longi=req.body.longi;
	var iataArray=[];
	async.parallel([
		function(cb){
			request('https://weekend.tripcombi.com/coordinates?callback=JSON_CALLBACK&lat='+userLat+'&long='+userLong,function(err,response,body){
	    		if(!err && response.statusCode==200)
	    		{
	    			var str=body.substr(24,3);
	    			console.log("IATA code of user is "+str);
	    			cb(null,{'userIATA':str});
	    		}
			});
		},
		function(cb){
			request('https://weekend.tripcombi.com/coordinates?callback=JSON_CALLBACK&lat='+lat+'&long='+longi,function(err,response,body){
	    		if(!err && response.statusCode==200)
	    		{
	    			var str=body.substr(24,3);
	    			console.log("IATA code of destination is "+str);
	    			cb(null,{'destinationIATA':str});
	    		}
			});
		},
		function(cb){
			geonoder.toAddress(userLat, userLong, geonoder.providers.google, function(address) {
				var arr=address.split(',');
    			console.log('Address: ' + arr[arr.length-3]); // 'Via del Plebiscito, 102 00186 Roma' 
    			cb(null,{userCity:arr[arr.length-3]});
			});
		},
		function(cb){
			geonoder.toAddress(lat, longi, geonoder.providers.google, function(address) {
				var arr=address.split(',');
    			console.log('Address: ' + arr[arr.length-3]); // 'Via del Plebiscito, 102 00186 Roma' 
    			cb(null,{destinationCity:arr[arr.length-3]});
			});
		}],function(err,result){
			console.log(result);
			iataArray.push.apply(iataArray,result);
			var dt=new Date();
			var date=dt.getDate();
			var month=dt.getMonth()+1;
			if(month<10)
				month="0"+month;
			var year=dt.getFullYear();
			var depDate=(""+year+month+date).trim();
			//console.log(depDate);
			dt.setDate(dt.getDate()+7);
			var date=dt.getDate();
			var month=dt.getMonth()+1;
			if(month<10)
				month="0"+month;
			var year=dt.getFullYear();
			var arrDate=(""+year+month+date).trim();
			async.parallel([
				function(callback){
					request(baseURL+"&vertical=flight&source="+result[0].userIATA+"&destination="+result[1].destinationIATA+"&mode=all&sdate="+depDate+"&edate="+arrDate+"&class=E",function(err,response,body){
						if(!err && response.statusCode==200)
						{
							var array=[];
							var random1=parseInt(1+Math.random()%19);
							var frst='resource'+random1;
							//console.log(body);
							body=JSON.parse(body);
							console.log(body[frst]);
							array.push({
								'fare':body[frst].fare,
								'carrier':body[frst].carrier
							});
							callback(null,{flightData:array});
						}
					});
				},
				function(callback){
					request("http://developer.goibibo.com/api/bus/search/?app_id="+applicationId+"&app_key="+applicationKey+"&format=json&source="+(result[2].userCity).trim()+"&destination="+(result[3].destinationCity).trim()+"&dateofdeparture="+depDate+"&dateofarrival="+arrDate,function(err,response,body){
						if(!err && response.statusCode==200)
						{
							var body=JSON.parse(body);
							//console.log(body);
							var array=[];
							if(body['data'].returnflights.length<=0)
							{
								callback(null,{busData:{'fare':'Not Available','busCondition':'AC'}})
							}
							var fare=body['data'].returnflights[0].fare.totalfare;
							array.push({
								'fare':fare,
								'busCondition':body['data'].returnflights[0].busCondition
							})
							callback(null,{busData:array});
						}
					});	
				}
				],function(err,result){
					res.send(result);
				})
			
		}); 	
   	
});
app.post('/invite',function(req,res){
	var mail=req.body.email;
	var number=req.body.number;
	var msg=req.body.msg;
	console.log(mail,number,msg);
	async.parallel([
		function(cb){
			//send mail
			var mailOptions = {
			    from: '', // sender address
			    to: mail, // list of receivers
			    subject: 'Invite from tripFriend', // Subject line
			    text: msg, // plaintext body
			    html: msg
			};
    		// send mail with defined transport object
			transporter.sendMail(mailOptions, function(error, info){
			    if(error){
			        return cb(error);
			    }
			    console.log('Message sent: ' + info.response);
			    cb(null);
			});
		},
		function(cb){
			client.sendMessage({
	            to:'', // Any number Twilio can deliver to
	            from: '', // A number you bought from Twilio and can use for outbound communication
	            body: msg // body of the SMS message
	        }, function(err, responseData) { //this function is executed when a response is received from Twilio
	            if(err)
	             return cb(err);
	            if (!err) { // "err" is an error received during the request, if any
	                // "responseData" is a JavaScript object containing data received from Twilio.
	                // A sample response from sending an SMS message is here (click "JSON" to see how the data appears in JavaScript):
	                // http://w...content-available-to-author-only...o.com/docs/api/rest/sending-sms#example-1
	                console.log("From "+responseData.from+ " To "+responseData.to); // outputs "+14506667788"
	                console.log(responseData.body); // outputs "word to your mother.
	                cb(null);
	            }
	        });
		}],function(err)
		{
			if(err)
				res.send(err);
			else
				res.send(true);
		});
});
var port=process.env.PORT||3000;
app.listen(port);
console.log('Server Listening at:',port);