'use server';

export async function generateImage(prompt: string) {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error('GOOGLE_API_KEY is not set');
  }

  const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent';
  
  const payload = {
    contents: [
      {
        parts: [
          {
            text: prompt,
          },
        ],
      },
    ],
    generationConfig: {
      responseModalities: ["IMAGE"],
      imageConfig: {
        aspectRatio: "1:1",
        imageSize: "1K"
      }
    }
  };

  try {
      const response = await fetch(url, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
              'x-goog-api-key': apiKey
          },
          body: JSON.stringify(payload)
      });

      if (!response.ok) {
          const errorText = await response.text();
          console.error("Gemini API Error:", errorText);
          throw new Error(`Gemini API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Parse response to find inlineData (image)
      // Structure: candidates[0].content.parts[].inlineData.data
      const candidate = data.candidates?.[0];
      if (!candidate?.content?.parts) {
          throw new Error("Invalid response structure from Gemini API");
      }

      const imagePart = candidate.content.parts.find((part: any) => part.inlineData);
      
      if (imagePart && imagePart.inlineData && imagePart.inlineData.data) {
          return `data:image/png;base64,${imagePart.inlineData.data}`;
      } else {
          throw new Error("No image data found in response");
      }

  } catch (error) {
      console.error("Image generation failed:", error);
      throw error;
  }
}
