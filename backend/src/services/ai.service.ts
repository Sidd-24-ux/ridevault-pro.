import https from 'https';

/**
 * Service to connect to Google's Gemini LLM models without requiring third-party libraries.
 * Leverages native Node.js HTTPS request calls.
 */
export class GoogleGenAI {
  static generateText(prompt: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return resolve('Gemini API key not configured. Running mock AI mode.');
      }

      const postData = JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt }
            ]
          }
        ]
      });

      const options = {
        hostname: 'generativelanguage.googleapis.com',
        path: `/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => {
          body += chunk;
        });

        res.on('end', () => {
          try {
            if (res.statusCode && res.statusCode >= 400) {
              console.error(`Gemini API returned error code ${res.statusCode}:`, body);
              return resolve('Error calling Gemini. Running mock AI mode.');
            }
            
            const parsed = JSON.parse(body);
            const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text || '';
            resolve(text);
          } catch (e) {
            console.error('Failed to parse Gemini response payload:', e);
            resolve('Error parsing response from Gemini API. Running mock AI mode.');
          }
        });
      });

      req.on('error', (err) => {
        console.error('Gemini HTTPS connection error:', err);
        resolve('Failed to connect to Gemini API. Running mock AI mode.');
      });

      req.write(postData);
      req.end();
    });
  }
}
