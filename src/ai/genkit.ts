import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

if (!process.env.GOOGLE_AI_API_KEY) {
  throw new Error('Missing required environment variable: GOOGLE_AI_API_KEY');
}

export const ai = genkit({
  plugins: [
    googleAI({apiKey: process.env.GOOGLE_AI_API_KEY}),
  ],
});
