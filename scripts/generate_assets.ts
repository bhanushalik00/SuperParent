import { GoogleGenAI } from "@google/genai";

export async function generateFeatureGraphic() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-image-preview',
      contents: {
        parts: [
          {
            text: "A professional Google Play Store feature graphic for a parenting app named 'SuperParent'. The design is clean, modern, and vibrant. It features a diverse, happy parent and child high-fiving in a warm, sunlit home environment. In the background, floating 3D golden stars and a subtle UI overlay showing a 'Star Bank' with a high balance. The text 'SuperParent' is prominent in a bold, friendly, rounded sans-serif font. A tagline below says 'Build Discipline Without Shouting'. The overall mood is joyful, peaceful, and empowering. High resolution, marketing quality, 1024x500 aspect ratio.",
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "2:1", // Closest to 1024:500
          imageSize: "1K"
        },
      },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return part.inlineData.data;
      }
    }
  } catch (error) {
    console.error("Error generating image:", error);
  }
  return null;
}
