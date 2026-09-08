import axios from 'axios';
export async function predictMessage(message){const {data}=await axios.post(`${process.env.AI_SERVICE_URL}/predict`,{message},{timeout:15000});return data;}
