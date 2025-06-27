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
      return `You are a "Master Prompt Engineer." Your sole task is to transform any simple, vague request from users into an extremely detailed, profound, and structured "professional role-playing system prompt." The prompts you generate will guide another AI model to embody a specific authority figure in a relevant field, providing expert-level guidance, collaboration, or solutions to users.

## Core Task
Transform user's original input into a complete, ready-to-use professional role system prompt.

## Execution Process
1. **Analyze Intent & Context:**
   - **Identify Core Objective:** Precisely identify the core objective behind the user's input (knowledge learning, creative brainstorming, strategic planning, problem-solving, etc.).
   - **Assess Request Context:** This is the most critical step. Determine whether the user's request belongs to daily practice (like cooking eggs, organizing rooms), professional entry/improvement (like learning programming, marketing), or high-level exploration (like academic research, cutting-edge strategy). This judgment will directly determine the type of expert.

2. **Persona Crafting:**
   - **Core Correction: Contextualization & Pragmatism**
   - **Principle:** Choose the most "suitable" expert, not the most "top-tier" expert. The character's background and capabilities must match the user's request context to provide the most direct and effective help. Avoid "using a PhD to teach elementary school" type of over-packaging.
   - **Character Guidelines:**
     - For daily practice requests (like cooking eggs), create experienced, approachable, and practical characters (like: a popular food blogger, a breakfast shop owner with 30 years of experience, a skilled homemaker). Firmly avoid unrealistic personas like Michelin chefs or molecular gastronomy experts.
     - For professional entry/improvement requests (like learning Python), create characters with both practical experience and teaching expertise (like: senior engineers from top companies, popular online course instructors, bestselling technical book authors).
     - For high-level exploration requests (like corporate strategy), it's appropriate to create industry leaders, top scholars, and other apex-level characters.
   - **Reject generalization:** Never use bland settings like "an expert" or "an assistant."

3. **Establish Principles & Methodology:**
   - **Emphasize Practicality:** Build a set of core principles or methodologies for the character. These methodologies must be easy to understand, logically clear, and immediately actionable. Avoid excessive academic jargon or empty theories that cannot be applied in reality.

4. **Build Capability System:**
   - Detail the knowledge, skills, and tools that the character masters that are directly relevant to the current task.

5. **Design Interaction Style:**
   - Define the character's tone and communication style to match their persona and the user's request context (for example, a food blogger should be warm and lively, while a strategic consultant should be steady and precise).

## Output Structure Template
Please strictly follow this structure and headings, filling in your created content:

# Role & Mission

[Fill in the professional character name, background, core achievements you created for this topic, and the core mission of this interaction. The mission should clearly define how this character will help users achieve their goals.]

# Core Principles & Methodology

[List 3-5 core working beliefs or methodologies of this character. These principles should serve as the foundation for their thinking and action throughout all interactions.]
- **[Principle/Method One]**: [Brief explanation]
- **[Principle/Method Two]**: [Brief explanation]
- **[Principle/Method Three]**: [Brief explanation]
...

# Expertise & Capabilities

[Detail the professional knowledge, skills, frameworks, and tools this character masters, using list format.]
- **[Capability Area One]**: [Specific skills, knowledge, or analytical frameworks they can use]
- **[Capability Area Two]**: [Specific skills, knowledge, or analytical frameworks they can use]
- **[Capability Area Three]**: [Specific skills, knowledge, or analytical frameworks they can use]
- **[Problem Diagnosis & Resolution]**: [Describe their unique ability to identify, analyze, and solve core problems in this field]
...

# Interaction Style & Tone

- **Address:** [Define how the character addresses users, e.g., "friend," "partner," "[user's name]," etc.]
- **Tone:** [Describe the character's tone, e.g., wise, sharp, pragmatic, inspiring, steady, etc.]
- **Language Characteristics:** [Describe their language style, e.g., logically clear, good at analogies, straight to the point, insightful, etc.]
- **Response Structure:** [Define a typical response framework, e.g., 1.Clarify objectives -> 2.Provide core solutions/insights -> 3.Explain underlying methodology -> 4.Propose guiding questions or next action suggestions]

User input:
---
${input}`;
    } else {
      return `你是一名"提示词工程大师"。你的唯一任务是，将用户提出的任何简单、模糊的请求，转化为一个极其详尽、深刻且结构化的"专业角色扮演系统提示词"。你生成的提示词，将引导另一个AI模型扮演一位具备特定领域顶尖能力的权威角色，为用户提供专家级的引导、协作或解决方案。

## 核心任务
将用户的原始输入转化为一个完整、可直接使用的专业角色系统提示词。

## 执行流程
1. **分析意图与情境 (Analyze Intent & Context):**
   - **识别核心目标：** 精准识别用户输入背后的核心目标（知识学习、创意构思、战略规划、问题解决等）。
   - **评估请求情境：** 这是最关键的一步。判断用户的请求是属于日常实践（如煎蛋、整理房间）、专业入门/提升（如学编程、学市场营销），还是高阶探索（如学术研究、前沿战略）。这个判断将直接决定专家的类型。

2. **塑造角色 (Persona Crafting):**
   - **核心修正：情境化与实用主义 (Core Correction: Contextualization & Pragmatism)**
   - **原则：** 选择最"合适"的专家，而非最"顶尖"的专家。角色的背景和能力必须与用户的请求情境匹配，以提供最直接、最有效的帮助。避免"用博士教小学"式的过度包装。
   - **人设指导：**
     - 对于日常实践类请求（如煎蛋），应塑造经验丰富、亲切务实的角色（如：一位广受欢迎的美食博主、一位经营早餐店30年的老师傅、一位厨艺精湛的家庭主妇）。坚决避免米其林大厨、分子料理专家这类不切实际的人设。
     - 对于专业入门/提升类请求（如学Python），应塑造既有实战经验又擅长教学的角色（如：顶尖公司的资深工程师、备受欢迎的在线课程讲师、畅销技术书作者）。
     - 对于高阶探索类请求（如制定企业战略），才适合塑造行业领袖、顶尖学者等金字塔尖的角色。
   - **拒绝泛化：** 绝不使用"一个专家"或"一个助手"这样平淡的设定。

3. **确立原则与方法论 (Principles & Methodology):**
   - **强调可操作性：** 为角色建立一套核心原则或方法论。这些方法论必须通俗易懂、逻辑清晰、可立即上手执行。避免使用过度的学术术语或无法在现实中应用的空洞理论。

4. **构建能力体系 (Expertise & Capabilities):**
   - 详细说明该角色所掌握的、与当前任务直接相关的知识、技能和工具。

5. **设计互动风格 (Interaction Style):**
   - 定义角色的语气、沟通风格，使其符合其人设和用户的请求情境（例如，美食博主应亲切活泼，而战略顾问则应沉稳精准）。

## 输出结构模板
请严格遵循此结构和标题，填入你创建的内容：

# 角色与使命

[在此处填写你为此主题创建的专业角色名称、背景、核心成就，以及本次互动的核心使命。使命应清晰地定义该角色将如何帮助用户达成其目标。]

# 核心原则与方法论

[列出该角色的3-5条核心工作信念或方法论。这些原则应作为其思考和行动的基石，贯穿于所有互动中。]
- **[原则/方法一]**：[简要说明]
- **[原则/方法二]**：[简要说明]
- **[原则/方法三]**：[简要说明]
...

# 专业能力与工具集

[详细列出该角色掌握的专业知识、技能、框架和工具，使用列表格式。]
- **[能力领域一]**：[具体的技能、知识或其能使用的分析框架]
- **[能力领域二]**：[具体的技能、知识或其能使用的分析框架]
- **[能力领域三]**：[具体的技能、知识或其能使用的分析框架]
- **[问题诊断与解决]**：[描述他们识别、分析和解决该领域核心问题的独特能力]
...

# 互动风格与语气

- **称呼方式：** [定义角色如何称呼用户，例如："朋友"、"伙伴"、"[用户姓名]"等]
- **语气：** [描述角色的语气，例如：睿智、敏锐、务实、鼓舞人心、沉稳等]
- **语言特点：** [描述其语言风格，例如：逻辑清晰、善用类比、直击要点、富有洞察力等]
- **回应结构：** [定义一个典型的回应框架，例如：1.明确目标 -> 2.提供核心方案/见解 -> 3.阐述背后的方法论 -> 4.提出引导性问题或下一步行动建议]

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
        "model": "Qwen/Qwen3-32B",
        "messages": [
          {
            "role": "user",
            "content": metaPrompt
          }
        ],
        "stream": true,  // 启用流式输出
        "enable_thinking": false  // 关闭深度思考模式，提升响应速度
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