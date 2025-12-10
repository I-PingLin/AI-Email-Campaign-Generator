
import { Injectable, signal } from '@angular/core';
import { GoogleGenAI, Type, Chat, GenerateContentResponse } from '@google/genai';
import { Campaign } from '../models/campaign.model';

@Injectable({
  providedIn: 'root',
})
export class GeminiService {
  private ai: GoogleGenAI;
  public error = signal<string | null>(null);

  constructor() {
    // IMPORTANT: This relies on `process.env.API_KEY` being set in the environment.
    if (!process.env.API_KEY) {
      throw new Error("API_KEY environment variable not set");
    }
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async generateCampaign(prompt: string): Promise<Campaign | null> {
    this.error.set(null);
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Based on the following prompt, generate a complete email marketing campaign.
          Prompt: "${prompt}"`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              subject: {
                type: Type.STRING,
                description: 'A compelling and concise subject line for the email.'
              },
              previewText: {
                type: Type.STRING,
                description: 'A short, engaging preview text that appears after the subject line in the inbox.'
              },
              body: {
                type: Type.STRING,
                description: 'The main body content of the email, formatted in simple HTML with paragraphs <p>, bold <strong>, and line breaks <br>. The tone should be engaging and persuasive.'
              },
              imagePrompt: {
                type: Type.STRING,
                description: 'A detailed, descriptive prompt for an AI image generator to create a visually appealing and relevant hero image for this email campaign.'
              }
            },
            required: ['subject', 'previewText', 'body', 'imagePrompt']
          },
        },
      });

      const campaignJson = response.text.trim();
      return JSON.parse(campaignJson) as Campaign;
    } catch (err) {
      console.error('Error generating campaign:', err);
      this.error.set('Failed to generate the email campaign. Please check the console for more details.');
      return null;
    }
  }

  async generateImage(prompt: string, aspectRatio: string): Promise<string | null> {
     this.error.set(null);
    try {
        const response = await this.ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: prompt,
            config: {
              numberOfImages: 1,
              outputMimeType: 'image/jpeg',
              aspectRatio: aspectRatio,
            },
        });

        const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
        return `data:image/jpeg;base64,${base64ImageBytes}`;
    } catch (err) {
        console.error('Error generating image:', err);
        this.error.set('Failed to generate the campaign image. The image prompt may have been unsafe. Please try again.');
        return null;
    }
  }

  createChatSession(): Chat {
    return this.ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: 'You are a helpful and friendly marketing assistant chatbot. Provide concise and useful answers to questions about marketing, email campaigns, and content strategy.',
      },
    });
  }
}
