import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [
    googleAI({apiKey: "AIzaSyC-9xdKvXH29GN4k9fMnh_jlu4CDUIRtCc"}),
  ],
});
