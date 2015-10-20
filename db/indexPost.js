var mongoose=require('./connect');
var Schema=mongoose.Schema;
var postSchema=new Schema({
	_id:String,
	by:String,
	numberOfViews:{
		type:Number,
		default:1
	},
	taggedPlaces:[{
		latitude:String,
		longitude:String,
		city:String
	}],
	costIncurred:Number,
	daysStayed:Number,
	numberOfLikes:{
		type:Number,
		default:0
	},
	photos:[String]
});
var Post = mongoose.model('Post', postSchema);
module.exports=Post;