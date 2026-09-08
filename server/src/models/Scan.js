import mongoose from 'mongoose';
const scanSchema=new mongoose.Schema({userId:{type:mongoose.Schema.Types.ObjectId,ref:'User'},message:{type:String,required:true},prediction:{type:String,enum:['normal','suspicious','scam'],required:true},riskScore:{type:Number,min:0,max:100,required:true},confidence:{type:Number,min:0,max:100},category:String,detectedPatterns:[String],extractedUrls:[String],recommendation:String,modelVersion:String},{timestamps:true});
export default mongoose.model('Scan',scanSchema);
