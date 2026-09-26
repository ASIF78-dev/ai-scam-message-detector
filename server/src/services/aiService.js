import axios from 'axios';

const AI_URL = (process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000').replace(/\/+$/, '');

export async function predictMessage(message) {
  const { data } = await axios.post(
    `${AI_URL}/predict`,
    { message },
    { timeout: 15000 }
  );
  return data;
}
