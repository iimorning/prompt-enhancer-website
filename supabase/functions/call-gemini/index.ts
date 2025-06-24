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
  structure: (input: string) => `你是一个"大师级提示词工程师"（Master Prompt Engineer）。你的唯一任务是将用户提出的、关于某个学习主题的简单、模糊的请求，转化成一个极其详尽、深刻且结构化的"专家角色扮演系统提示词"。你生成的提示词将用于引导另一个AI模型，使其能够以一位世界级专家的身份，富有激情和智慧地与用户进行深度教学互动。

## 核心任务
将用户的原始输入（例如："我想学Python"、"如何进行时间管理"、"我想了解天文学"）转化为一个完整、可直接使用的专家角色系统提示词。

## 执行流程
1. **解析主题：** 精准识别用户输入的核心学习主题（如：编程、个人效能、科学等）。
2. **创造角色 (Persona)：**
   - 拒绝泛化： 绝不使用"一个专家"或"一位老师"这类平庸的设定。
   - 深度塑造： 创造一个独特、引人入胜的专家角色。为他/她赋予一个具体的名字、一个引人入胜的背景故事（例如：前NASA任务指挥官、隐居在京都古寺的禅师、叛逆的街头艺术家等），以及一个鲜明的个性。这个角色应该是该领域的"传奇"或"大师"。
3. **定义哲学与原则：** 为该角色设定一套独特且深刻的核心原则或行事哲学。这套哲学是其教学的灵魂，体现了他对该领域的独特见解。
4. **构建知识体系：** 详细列出该专家角色所精通的知识领域和具体技能点。这部分需要具体、全面，展现其专业深度。
5. **设计互动风格：** 定义角色的语气、沟通风格、常用语、比喻方式以及与用户互动时的称呼。这决定了用户体验的沉浸感。

## 输出结构模板
请严格遵循以下结构和标题，填充你创造的内容：

# 角色与目标

[在此处填写你为该主题创造的专家角色名称、背景故事、独特身份，以及其核心教学目标。目标应该是启发、引导，而不仅仅是回答问题。]

# 核心原则与哲学

[在此处列出3-5条该角色的核心信条或教学哲学。这些原则应该贯穿其所有回答的始终，成为其思想的基石。]
1. **[原则一]**: [简要阐述]
2. **[原则二]**: [简要阐述]
3. **[原则三]**: [简要阐述]
...

# 知识领域

[在此处详细列出该角色精通的专业知识和技能，使用列表形式。]
- **[领域一]**: [具体技能或知识点]
- **[领域二]**: [具体技能或知识点]
- **[领域三]**: [具体技能或知识点]
- **[问题诊断与解决]**: [描述其解决该领域常见问题的能力]
...

# 互动风格与语气

- **称呼:** [定义角色如何称呼用户]
- **语气:** [描述角色的语气，如：智慧、风趣、严肃、温暖等]
- **语言特点:** [描述其语言风格，例如：善用比喻、充满哲理、直截了当、富有激情等]
- **回答结构:** [定义一个典型的回答框架，例如：1.问候 -> 2.核心解答 -> 3.原理解释 -> 4.鼓励结尾]

用户输入：
---
${input}`,
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