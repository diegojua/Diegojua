
import { GoogleGenAI, Type } from "@google/genai";
import type { Student } from '../types';

if (!process.env.API_KEY) {
  // This is a placeholder for environments where the API key is not set.
  // In a real deployed environment, the key would be securely provided.
  console.warn("API_KEY environment variable not set. Using a dummy key.");
  process.env.API_KEY = "dummy-key-for-local-development";
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

export const generateStudyPlan = async (student: Student): Promise<string> => {
  const prompt = `
    Baseado nas seguintes informações de um aluno de uma escola de reforço, crie uma sugestão de plano de estudos inicial, breve e personalizado.
    Seja encorajador e foque em 2-3 passos iniciais claros e práticos.

    - Ano Escolar: ${student.schoolGrade}
    - Matérias de Interesse/Dificuldade: ${student.subjectsOfInterest.join(', ')}
    - Detalhes das Dificuldades: ${student.learningDifficulties}

    A resposta deve ser um texto conciso e motivador para o aluno e seus responsáveis.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            plan: {
              type: Type.STRING,
              description: 'O plano de estudos sugerido em formato de texto.',
            },
          },
          required: ['plan'],
        },
      },
    });

    const jsonText = response.text.trim();
    const result = JSON.parse(jsonText);
    return result.plan || "Não foi possível gerar um plano de estudos. Por favor, revise as informações do aluno.";

  } catch (error) {
    console.error("Error generating study plan with Gemini:", error);
    // Provide a helpful fallback message
    return `Não foi possível gerar um plano de estudos no momento. 
            Uma sugestão genérica é: 
            1. Revisar os conceitos básicos da matéria de maior dificuldade. 
            2. Fazer uma lista de dúvidas específicas para trazer ao tutor. 
            3. Praticar com exercícios simples todos os dias por 15-20 minutos.`;
  }
};
