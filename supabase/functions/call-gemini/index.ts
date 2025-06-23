// supabase/functions/call-gemini/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// 定义CORS头，允许任何来源的请求，这对于浏览器扩展是必须的
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// 【关键】我们将 promptLibrary 从前端移到了这里！
const promptLibrary = {
  optimize_initial: (input: string) => `作为一名顶级的提示词工程师,请将以下用户的初步想法,转换成一个结构清晰、内容丰富、高质量的AI提示词。直接给出优化后的提示词,不要包含任何解释性文字或标题。\n\n用户输入：\n---\n${input}`,
  optimize_again: (previous_prompt: string) => `作为一名提示词优化专家,请对以下这个已经很不错的提示词进行“锦上添花”式的增强。在不破坏其核心结构的前提下,为它增加3-4句更具体、更有深度的细节。直接返回增强后的完整提示词,不要包含任何解释性的文字或标题。\n\n需要增强的提示词：\n---\n${previous_prompt}`,
  analyze: (input: string) => `你是一位提示词分析专家。请简要分析以下用户输入,指出其可能存在的问题,并给出1-2条具体的改进建议。\n\n用户输入：\n---\n${input}`,
  structure: (input: string) => `你是一位结构化思维专家。请分析以下用户输入,并为其添加结构化的参数。请以 Markdown 格式返回。\n\n用户输入：\n---\n${input}`,
};

serve(async (req) => {
  // 处理浏览器的 OPTIONS 预检请求
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

    try {
    // 【关键】从请求体中获取 "action" 和 "input"
    const { action, input } = await req.json()
    if (!action || !input) {
      throw new Error("Request body must contain 'action' and 'input'.")
    }
    
    // 【关键】在服务器端动态构建 prompt
    const metaPrompt = promptLibrary[action as keyof typeof promptLibrary]?.(input);
    if (!metaPrompt) {
      throw new Error(`Unknown action: ${action}`);
    }

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiApiKey) {
      throw new Error("GEMINI_API_KEY is not set.")
    }

    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiApiKey}`;

    const geminiResponse = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ "contents": [{ "parts": [{ "text": metaPrompt }] }] }), // 使用构建好的 metaPrompt
    });

    if (!geminiResponse.ok) {
        const errorData = await geminiResponse.json();
        throw new Error(`Gemini API Error: ${geminiResponse.status} - ${errorData.error.message}`);
    }

    const data = await geminiResponse.json();
    const text = data.candidates[0].content.parts[0].text;
    
    return new Response(JSON.stringify({ result: text }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})