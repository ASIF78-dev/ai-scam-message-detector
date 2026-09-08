import Scan from '../models/Scan.js';
import { predictMessage } from '../services/aiService.js';
export async function analyze(req,res){try{const {message}=req.body;if(typeof message!=='string'||!message.trim())return res.status(400).json({message:'Message is required'});const prediction=await predictMessage(message.trim());const scan=await Scan.create({...prediction,message:message.trim(),userId:req.user?.id});res.json(predictionWithId(prediction,scan._id));}catch(error){console.error(error.message);res.status(502).json({message:'AI service unavailable or analysis failed'});}}
function predictionWithId(pred,id){return {...pred,scanId:id};}
