import { GoogleGenAI } from "@google/genai";
import { TimeEntry } from '../types';

const getAiClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const analyzeTimeUsage = async (entries: TimeEntry[]): Promise<string> => {
  if (entries.length === 0) return "暂无数据可供分析。";

  const ai = getAiClient();
  
  // Format entries for the prompt
  const today = new Date().toLocaleDateString('zh-CN');
  const recentEntries = entries.slice(0, 30).map(e => {
    const date = new Date(e.startTime).toLocaleDateString('zh-CN');
    const durationMin = Math.round(e.duration / 60);
    return `- ${date}: "${e.title}" 持续 ${durationMin} 分钟`;
  }).join('\n');

  const prompt = `
    你是一个 ChronoMark 应用的生产力专家助手。
    当前日期: ${today}
    
    以下是用户最近的时间记录（最多30条）:
    ${recentEntries}

    请对用户的时间使用情况提供简明、鼓励性和有洞察力的总结。
    识别模式（例如：长时间的深度工作、碎片化时间、深夜工作等）。
    请用中文回答。保持在3段以内。使用 Markdown 格式。
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: "你是一位乐于助人的生产力教练。回答要简洁、激励人心，并必须使用中文。"
      }
    });
    return response.text || "无法生成分析报告。";
  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    return "无法连接到 AI 服务进行分析。";
  }
};
