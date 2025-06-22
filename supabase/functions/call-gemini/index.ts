// supabase/functions/call-gemini/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// 定义CORS头，允许任何来源的请求，这对于浏览器扩展是必须的
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // 处理浏览器的 OPTIONS 预检请求
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 从请求体中获取用户发送的 prompt
    const { prompt } = await req.json()
    if (!prompt) {
      throw new Error("No prompt provided in the request body.")
    }

    // 从环境变量中安全地获取 Gemini API Key
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiApiKey) {
      throw new Error("GEMINI_API_KEY is not set in the server environment.")
    }

    const modelName = 'gemini-1.5-flash-latest';
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiApiKey}`;

    // 向 Gemini API 发送请求
    const geminiResponse = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ "contents": [{ "parts": [{ "text": prompt }] }] }),
    });

    if (!geminiResponse.ok) {
        const errorData = await geminiResponse.json();
        throw new Error(`Gemini API Error: ${geminiResponse.status} - ${errorData.error.message}`);
    }

    const data = await geminiResponse.json();
    const text = data.candidates[0].content.parts[0].text;
    
    // 将 Gemini 的返回结果成功地返回给前端
    return new Response(JSON.stringify({ result: text }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    // 处理任何可能发生的错误
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})