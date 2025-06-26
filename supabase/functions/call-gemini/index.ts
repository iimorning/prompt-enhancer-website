// supabase/functions/call-gemini/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// 类型定义
type PromptFunction = (input: string, language?: string) => string;

// 定义CORS头，允许任何来源的请求，这对于浏览器扩展是必须的
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// 【关键】我们将 promptLibrary 从前端移到了这里，并添加多语言支持！
const promptLibrary: Record<string, PromptFunction> = {
  optimize_initial: (input: string, language: string = 'zh_CN') => {
    if (language === 'en') {
      return `As a prompt optimization expert, please enhance the user's original input by adding only 3-4 sentences to improve its clarity and specificity. Maintain the core intent of the original content without major rewrites.

Please output the optimized prompt in logical paragraphs, separated by blank lines for better readability. Output the optimized prompt directly without explanations.

User input:
---
${input}`;
    } else {
      return `作为提示词优化专家，请在用户原始输入的基础上，只添加3-4句话来增强其清晰度和具体性。保持原始内容的核心意图，不要大幅改写。

请将优化后的提示词按逻辑分段输出，每段之间用空行分隔，让内容更易阅读。直接输出优化后的提示词，不要包含解释。

用户输入：
---
${input}`;
    }
  },
  optimize_again: (previous_prompt: string, language: string = 'zh_CN') => {
    if (language === 'en') {
      return `As a prompt optimization expert, please enhance this already good prompt with "icing on the cake" improvements. Without breaking its core structure, add 3-4 more specific and in-depth details.

Please output the optimized prompt in logical paragraphs, separated by blank lines for better readability. Do not include any explanatory text or titles.

Prompt to enhance:
---
${previous_prompt}`;
    } else {
      return `作为一名提示词优化专家,请对以下这个已经很不错的提示词进行“锦上添花”式的增强。在不破坏其核心结构的前提下,为它增加3-4句更具体、更有深度的细节。

请将优化后的提示词按逻辑分段输出，每段之间用空行分隔，让内容更易阅读。不要包含任何解释性的文字或标题。

需要增强的提示词：
---
${previous_prompt}`;
    }
  },
  analyze: (input: string, language: string = 'zh_CN') => {
    if (language === 'en') {
      return `You are a prompt analysis expert. Please briefly analyze the following user input, identify potential issues, and provide 1-2 specific improvement suggestions.

User input: "${input}"

Please output in the following format, without using any markdown formatting, and do not repeat the user input:

Potential Issues:
1. [Issue description]
2. [Issue description]

Improvement Suggestions:
1. [Specific suggestion]
2. [Specific suggestion]`;
    } else {
      return `你是一位提示词分析专家。请简要分析以下用户输入，指出其可能存在的问题，并给出1-2条具体的改进建议。

用户输入："${input}"

请按以下格式输出，不要使用任何markdown标记，不要重复显示用户输入：

潜在问题：
1. [问题描述]
2. [问题描述]

改进建议：
1. [具体建议]
2. [具体建议]`;
    }
  },
  structure: (input: string, language: string = 'zh_CN') => {
    if (language === 'en') {
      return `You are a "Master Prompt Engineer." Your sole task is to transform users' simple, vague requests about learning topics into extremely detailed, profound, and structured "expert role-playing system prompts." The prompts you generate will guide another AI model to interact with users as a world-class expert with passion and wisdom for deep educational engagement.

## Core Task
Transform user's original input (e.g., "I want to learn Python," "How to manage time," "I want to understand astronomy") into a complete, ready-to-use expert role system prompt.

## Execution Process
1. **Parse Topic:** Precisely identify the core learning topic from user input (e.g., programming, personal effectiveness, science, etc.).
2. **Create Persona:**
   - Reject generalization: Never use bland settings like "an expert" or "a teacher."
   - Deep characterization: Create a unique, compelling expert character. Give them a specific name, an engaging backstory (e.g., former NASA mission commander, hermit monk in Kyoto temple, rebellious street artist, etc.), and a distinct personality. This character should be a "legend" or "master" in their field.
3. **Define Philosophy & Principles:** Establish a unique and profound set of core principles or philosophy for this character. This philosophy is the soul of their teaching, reflecting their unique insights in the field.
4. **Build Knowledge System:** Detail the knowledge domains and specific skills this expert character masters. This section needs to be specific and comprehensive, showcasing their professional depth.
5. **Design Interaction Style:** Define the character's tone, communication style, common phrases, metaphor usage, and how they address users. This determines the immersive experience for users.

## Output Structure Template
Please strictly follow this structure and headings, filling in your created content:

# Role & Objectives

[Fill in the expert character name, backstory, unique identity you created for this topic, and their core teaching objectives. The goal should be to inspire and guide, not just answer questions.]

# Core Principles & Philosophy

[List 3-5 core beliefs or teaching philosophies of this character. These principles should run through all their responses as the foundation of their thinking.]
1. **[Principle One]**: [Brief explanation]
2. **[Principle Two]**: [Brief explanation]
3. **[Principle Three]**: [Brief explanation]
...

# Knowledge Domains

[Detail the professional knowledge and skills this character masters, using list format.]
- **[Domain One]**: [Specific skills or knowledge points]
- **[Domain Two]**: [Specific skills or knowledge points]
- **[Domain Three]**: [Specific skills or knowledge points]
- **[Problem Diagnosis & Resolution]**: [Describe their ability to solve common problems in this field]
...

# Interaction Style & Tone

- **Address:** [Define how the character addresses users]
- **Tone:** [Describe the character's tone, such as: wise, witty, serious, warm, etc.]
- **Language Characteristics:** [Describe their language style, e.g., good at metaphors, philosophical, straightforward, passionate, etc.]
- **Response Structure:** [Define a typical response framework, e.g., 1.Greeting -> 2.Core Answer -> 3.Principle Explanation -> 4.Encouraging Conclusion]

User input:
---
${input}`;
    } else {
      return `你是一个"大师级提示词工程师"（Master Prompt Engineer）。你的唯一任务是将用户提出的、关于某个学习主题的简单、模糊的请求，转化成一个极其详尽、深刻且结构化的"专家角色扮演系统提示词"。你生成的提示词将用于引导另一个AI模型，使其能够以一位世界级专家的身份，富有激情和智慧地与用户进行深度教学互动。

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
${input}`;
    }
  },
};

serve(async (req: Request) => {
  // 处理浏览器的 OPTIONS 预检请求
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

    try {
    // 【关键】从请求体中获取 "action"、"input" 和 "language"
    const { action, input, language = 'zh_CN' } = await req.json()
    if (!action || !input) {
      throw new Error("Request body must contain 'action' and 'input'.")
    }

    // 【关键】在服务器端动态构建 prompt，传递语言参数
    const promptFunction = promptLibrary[action as keyof typeof promptLibrary];
    if (!promptFunction) {
      throw new Error(`Unknown action: ${action}`);
    }
    const metaPrompt = promptFunction(input, language);

    // 使用 Qwen API 替代 Gemini API
    const qwenApiKey = Deno.env.get('QWEN_API_KEY')
    if (!qwenApiKey) {
      throw new Error("QWEN_API_KEY is not set.")
    }

    const API_URL = 'https://api.siliconflow.cn/v1/chat/completions';

    const qwenResponse = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${qwenApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        "model": "Qwen/QwQ-32B",
        "messages": [
          {
            "role": "user",
            "content": metaPrompt
          }
        ],
        "stream": true  // 启用流式输出
      }),
    });

    if (!qwenResponse.ok) {
        const errorData = await qwenResponse.text();
        throw new Error(`Qwen API Error: ${qwenResponse.status} - ${errorData}`);
    }

    // 返回流式响应给前端
    return new Response(qwenResponse.body, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})