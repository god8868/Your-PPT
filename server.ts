import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

// Increase payload limit for file uploads (PDF, text, images)
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY || "",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Health check
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
  });
});

// 1. Generate Outline from Topic and Source Materials
app.post("/api/chat/outline", async (req, res) => {
  try {
    const { topic, files = [], referenceText = "" } = req.body;

    if (!topic && !referenceText && files.length === 0) {
      return res.status(400).json({ error: "请输入PPT主题或上传参考材料" });
    }

    const ai = getAiClient();

    // Prepare multimodal parts if files are present
    const parts: any[] = [];

    let fileContext = "";
    if (Array.isArray(files) && files.length > 0) {
      for (const file of files) {
        if (file.textContent) {
          fileContext += `\n\n--- 附件文件 [${file.name}] ---\n${file.textContent.slice(0, 10000)}`;
        } else if (file.base64Data && file.mimeType) {
          // Native multimodal document part (PDF or image)
          parts.push({
            inlineData: {
              mimeType: file.mimeType,
              data: file.base64Data,
            },
          });
        }
      }
    }

    const systemInstruction = `你是一位顶尖的麦肯锡/高盛商业演说顾问兼视觉演示文稿（PPT）架构总监。
你的任务是根据用户给定的主题、需求以及提供的任何参考文件资料，构思并生成一份逻辑严密、结构清晰、极具说服力的专业PPT大纲（Outline）。

要求：
1. 包含 5 到 7 页幻灯片（通常包括：1. 封面 Cover, 2. 目录/核心脉络 Catalog, 3. 核心现状或背景洞察 Split/Cards, 4. 关键指标或亮点飞轮 Stats, 5. 解决方案或多维拆解 Cards/Comparison, 6. 实施路径或时间线 Process/Timeline, 7. 战略总结或行动建议 Summary）。
2. 每张幻灯片的 layoutType 必须从以下合法值中选取之一：
   - 'cover' (封面)
   - 'catalog' (目录)
   - 'stats' (数字指标亮点)
   - 'cards-3' (3列重点卡片)
   - 'cards-4' (4列重点卡片)
   - 'split' (左右图文拆解)
   - 'timeline' (时间轴里程碑)
   - 'process' (步骤流程)
   - 'comparison' (方案/痛点对比)
   - 'quote' (金句/核心名言)
   - 'summary' (行动倡议与总结)
3. 提炼出适合该主题的推荐配色方案 suggestedTheme: ('tech-dark' | 'corporate-navy' | 'minimal-light' | 'emerald-venture' | 'sunset-amber')。
4. 返回严格合法的 JSON 对象，不要添加任何 Markdown 反引号或额外解释文字。

JSON格式规范：
{
  "topic": "提炼的主题名称",
  "targetAudience": "核心受众群体",
  "tone": "演说基调（如：专业严谨、前瞻创新、务实高效）",
  "suggestedTheme": "tech-dark",
  "outline": [
    {
      "slideNumber": 1,
      "title": "幻灯片主标题",
      "layoutType": "cover",
      "summary": "1-2句核心信息或副标题",
      "keyPoints": ["核心观点1", "核心观点2", "核心观点3"],
      "visualSuggestion": "视觉排版呈现建议"
    }
  ]
}`;

    const promptText = `请根据以下输入生成PPT大纲：
用户需求与主题：${topic || "综合分析汇报"}
补充参考说明：${referenceText || "无"}
${fileContext ? `参考附件内容：${fileContext}` : ""}

请输出符合要求的 JSON 数据：`;

    parts.push({ text: promptText });

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: { parts },
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        temperature: 0.7,
      },
    });

    const responseText = response.text || "{}";
    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      // Clean possible wrapper if any
      const cleaned = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
      data = JSON.parse(cleaned);
    }

    res.json({ success: true, data });
  } catch (error: any) {
    console.error("Error in /api/chat/outline:", error);
    res.status(500).json({
      error: error?.message || "生成大纲时发生错误",
      fallback: true,
    });
  }
});

// 2. Chat Iteration (一边对话一边修改/生成)
app.post("/api/chat/iterate", async (req, res) => {
  try {
    const {
      message,
      currentSlides = [],
      activeSlideId,
      themeId = "tech-dark",
      files = [],
    } = req.body;

    if (!message) {
      return res.status(400).json({ error: "请输入修改需求" });
    }

    const ai = getAiClient();

    const activeSlide = currentSlides.find((s: any) => s.id === activeSlideId) || currentSlides[0];

    const slideSummaries = currentSlides.map((s: any, idx: number) => ({
      index: idx + 1,
      id: s.id,
      title: s.title,
      layoutType: s.layoutType,
      elementCount: s.elements?.length || 0,
      isActive: s.id === activeSlide?.id,
    }));

    let fileContext = "";
    if (Array.isArray(files) && files.length > 0) {
      for (const file of files) {
        if (file.textContent) {
          fileContext += `\n附件 [${file.name}]: ${file.textContent.slice(0, 3000)}`;
        }
      }
    }

    const systemInstruction = `你是一位高效、专业的 AI PPT 演示文稿协同设计助手。用户正在实时编辑幻灯片，并通过自然语言向你提出修改、扩充、增删或重新设计的诉求。
你需要理解用户的意图，并给出：
1. 简明亲切的对话回复 (reply)，解释你做出了什么调整或建议。
2. 操作指令 action:
   - "update_active_slide": 修改当前选中的单张幻灯片（修改文字、换布局、更新数据、调整样式等）
   - "add_new_slide": 在当前位置后新增一张幻灯片
   - "batch_update": 对整套或多张幻灯片进行批量调整（例如统一换主题或追加章节）
   - "chat_only": 纯文本解答咨询或建议
3. 针对更新或新增的幻灯片，提供精炼的结构化数据：
   - slideTitle: 幻灯片标题
   - layoutType: 适用的布局类型 ('cover' | 'catalog' | 'stats' | 'cards-3' | 'cards-4' | 'split' | 'timeline' | 'process' | 'comparison' | 'quote' | 'summary')
   - keyPoints: 提炼的要点列表 (字符串数组)
   - summary: 核心一句话总结/副标题
   - metrics?: 选填（如果布局是 stats），格式为 [{ "label": "指标名", "value": "数据值", "change": "同比或说明" }]
4. suggestedActions: 2-3 个用户接下来可能会想尝试的快捷快捷指令建议（如："风格切换为商务蓝", "在后方增加竞品对比页", "为本页生成英文双语对照"）。

严格返回 JSON 格式：
{
  "reply": "已为您将本页修改为3列卡片对比布局，强化了核心收益数据。",
  "action": "update_active_slide",
  "slideData": {
    "slideTitle": "新标题",
    "layoutType": "cards-3",
    "summary": "副标题/核心结论",
    "keyPoints": ["要点1", "要点2", "要点3"],
    "metrics": []
  },
  "suggestedActions": ["优化文字排版", "将本页数据换算为百分比", "新增一页时间轴计划"]
}`;

    const promptText = `用户指令：${message}
当前正在编辑的幻灯片信息：
- ID: ${activeSlide?.id}
- 当前标题: ${activeSlide?.title}
- 当前布局: ${activeSlide?.layoutType}
当前整个PPT大纲概览: ${JSON.stringify(slideSummaries)}
${fileContext ? `参考补充材料: ${fileContext}` : ""}

请生成满足要求的修改响应 JSON：`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: [{ text: promptText }],
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        temperature: 0.7,
      },
    });

    const responseText = response.text || "{}";
    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      const cleaned = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
      data = JSON.parse(cleaned);
    }

    res.json({ success: true, data });
  } catch (error: any) {
    console.error("Error in /api/chat/iterate:", error);
    res.status(500).json({
      error: error?.message || "对话修改处理失败",
      fallback: true,
    });
  }
});

// 3. AI Text Polish & Refine
app.post("/api/ai/refine-text", async (req, res) => {
  try {
    const { text, type = "polish" } = req.body;
    if (!text) return res.status(400).json({ error: "文本内容不能为空" });

    const ai = getAiClient();

    let instruction = "请对以下PPT文案进行专业润色，使之更加精炼、有商业洞察力且符合高级演说标准：";
    if (type === "summarize") {
      instruction = "请将以下内容精炼压缩为1句高含金量的核心论点（不超过30字）：";
    } else if (type === "bullet_points") {
      instruction = "请将以下内容拆解为 3 条结构化、层层递进的PPT演讲要点，每条带粗体核心关键词：";
    } else if (type === "translate_en") {
      instruction = "请将以下中文PPT文案翻译为地道、优雅的商务英语表达：";
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: `${instruction}\n\n${text}`,
    });

    res.json({ success: true, result: response.text?.trim() });
  } catch (error: any) {
    console.error("Error in /api/ai/refine-text:", error);
    res.status(500).json({ error: error?.message || "文案润色失败" });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AI PPT Designer server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
