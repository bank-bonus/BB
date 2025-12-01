import { GoogleGenAI } from "@google/genai";

let aiClient: GoogleGenAI | null = null;

// Initialize strictly with process.env.API_KEY
if (process.env.API_KEY) {
  aiClient = new GoogleGenAI({ apiKey: process.env.API_KEY });
}

export interface PassengerFlavor {
  name: string;
  story: string;
  destination: string;
}

const FALLBACK_DATA: PassengerFlavor = {
  name: "Иван",
  story: "Просто еду на работу, опаздываю.",
  destination: "Бизнес-центр"
};

export const generatePassengerData = async (shiftTime: string): Promise<PassengerFlavor> => {
  if (!aiClient) return FALLBACK_DATA;

  try {
    const prompt = `Сгенерируй очень короткий JSON профиль пассажира такси для смены "${shiftTime}" в России. 
    Обязательные поля: "name" (имя на русском), "story" (история максимум 10 слов на русском, смешная или жизненная, например "Везет кота к ветеринару" или "Едет на свидание вслепую"), "destination" (место назначения на русском, например "Центральный Рынок").
    Сделай разнообразно.`;
    
    const response = await aiClient.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const text = response.text;
    if (!text) return FALLBACK_DATA;

    const data = JSON.parse(text) as PassengerFlavor;
    return data;
  } catch (error) {
    console.error("Gemini generation failed:", error);
    return FALLBACK_DATA;
  }
};