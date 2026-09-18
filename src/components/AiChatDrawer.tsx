import React, { useState, useRef } from 'react';
import {
  Sparkles,
  Send,
  Upload,
  Paperclip,
  FileText,
  FileSpreadsheet,
  FileCode,
  File as FileIcon,
  X,
  CheckCircle2,
  Layers,
  ArrowRight,
  Loader2,
  RefreshCw,
  Zap,
  HelpCircle,
} from 'lucide-react';
import {
  ChatMessage,
  OutlineResponse,
  Slide,
  UploadedFileRef,
  SlideLayoutType,
  PresentationTheme,
} from '../types';
import { generateSlideFromLayout } from '../utils/slideGenerator';
import { PRESENTATION_THEMES } from '../utils/themes';

interface AiChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  slides: Slide[];
  activeSlideId: string;
  theme: PresentationTheme;
  onThemeChange: (themeId: string) => void;
  onApplyNewDeck: (newSlides: Slide[], title: string) => void;
  onUpdateActiveSlide: (slide: Slide) => void;
  onInsertSlide: (slide: Slide) => void;
}

const SAMPLE_PROMPTS = [
  '2026 新能源出海战略与全球化布局',
  '企业级 AI Agent 商业落地计划书 (BP)',
  '多云技术架构升级与微服务重构方案',
  '年度业务经营复盘与 Q3 增长突破点',
];

export const AiChatDrawer: React.FC<AiChatDrawerProps> = ({
  isOpen,
  onClose,
  slides,
  activeSlideId,
  theme,
  onThemeChange,
  onApplyNewDeck,
  onUpdateActiveSlide,
  onInsertSlide,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome_1',
      role: 'assistant',
      content:
        '您好！我是您的 AI PPT 首席演示设计师。请输入任何 PPT 主题，或上传您的任何格式资料（TXT、Markdown、PDF、DOCX、CSV、JSON、图片等），我将即刻为您生成专属大纲并自动化智能排版！',
      timestamp: Date.now(),
      suggestedActions: [
        '生成一份 AI Agent 商业计划书',
        '2026 新能源出海增长战略',
        '上传企业财报生成核心指标页',
      ],
    },
  ]);

  const [inputPrompt, setInputPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<UploadedFileRef[]>([]);
  const [currentOutline, setCurrentOutline] = useState<OutlineResponse | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Handle Upload Any Format File
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileId = `file_${Date.now()}_${i}`;

      const isText =
        file.type.startsWith('text/') ||
        file.name.endsWith('.md') ||
        file.name.endsWith('.txt') ||
        file.name.endsWith('.json') ||
        file.name.endsWith('.csv') ||
        file.name.endsWith('.ts') ||
        file.name.endsWith('.js') ||
        file.name.endsWith('.html');

      const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf');
      const isImage = file.type.startsWith('image/');

      if (isText) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const textContent = (event.target?.result as string) || '';
          setAttachedFiles((prev) => [
            ...prev,
            {
              id: fileId,
              name: file.name,
              size: file.size,
              type: file.type || 'text/plain',
              textContent,
            },
          ]);
        };
        reader.readAsText(file);
      } else if (isPdf || isImage) {
        // Base64 for multimodal Gemini ingestion
        const reader = new FileReader();
        reader.onload = (event) => {
          const result = (event.target?.result as string) || '';
          const base64Data = result.split(',')[1];
          setAttachedFiles((prev) => [
            ...prev,
            {
              id: fileId,
              name: file.name,
              size: file.size,
              type: file.type || (isPdf ? 'application/pdf' : 'image/png'),
              mimeType: file.type || (isPdf ? 'application/pdf' : 'image/png'),
              base64Data,
            },
          ]);
        };
        reader.readAsDataURL(file);
      } else {
        // Fallback for docx/others: read binary as text or name/size representation
        const reader = new FileReader();
        reader.onload = (event) => {
          const textContent = (event.target?.result as string) || `[Uploaded file: ${file.name}]`;
          setAttachedFiles((prev) => [
            ...prev,
            {
              id: fileId,
              name: file.name,
              size: file.size,
              type: file.type || 'application/octet-stream',
              textContent: textContent.slice(0, 15000),
            },
          ]);
        };
        reader.readAsText(file);
      }
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (id: string) => {
    setAttachedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  // Submit Prompt (either Outline Generation or Interactive Iteration)
  const handleSubmit = async (customPrompt?: string) => {
    const text = (customPrompt || inputPrompt).trim();
    if (!text && attachedFiles.length === 0) return;

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: text || `请根据我上传的 ${attachedFiles.length} 份参考文件生成专业 PPT`,
      timestamp: Date.now(),
      attachments: [...attachedFiles],
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputPrompt('');
    const filesToSend = [...attachedFiles];
    setAttachedFiles([]);
    setIsGenerating(true);
    scrollToBottom();

    try {
      // Determine if this is initial generation / outline or an ongoing conversation edit
      const isInitialOrGenerate =
        !currentOutline ||
        text.includes('生成') ||
        text.includes('制作') ||
        text.includes('写一份') ||
        text.includes('大纲');

      if (isInitialOrGenerate) {
        // Step 1: Call Outline API
        const res = await fetch('/api/chat/outline', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topic: text,
            files: filesToSend,
          }),
        });

        const data = await res.json();
        if (data.data) {
          const outlineData: OutlineResponse = data.data;
          setCurrentOutline(outlineData);

          // If suggested theme provided, auto-switch
          if (outlineData.suggestedTheme && PRESENTATION_THEMES[outlineData.suggestedTheme]) {
            onThemeChange(outlineData.suggestedTheme);
          }

          setMessages((prev) => [
            ...prev,
            {
              id: `msg_outline_${Date.now()}`,
              role: 'assistant',
              content: `已为您定制生成【${outlineData.topic}】的演讲大纲与架构规划（共 ${outlineData.outline.length} 页）。您可以预览大纲并一键生成整套精装幻灯片，或继续对话调整！`,
              timestamp: Date.now(),
              type: 'outline_proposal',
              outlineData: outlineData,
              suggestedActions: [
                '一键生成整套精美排版',
                '将风格换成极简纯白',
                '增加一页竞品对比分析',
                '突出量化收益数据',
              ],
            },
          ]);
        } else {
          throw new Error(data.error || '未能生成大纲');
        }
      } else {
        // Step 2: Conversational Slide Iteration (一边对话一边修改/生成)
        const res = await fetch('/api/chat/iterate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: text,
            currentSlides: slides,
            activeSlideId,
            themeId: theme.id,
            files: filesToSend,
          }),
        });

        const result = await res.json();
        if (result.data) {
          const { reply, action, slideData, suggestedActions } = result.data;

          if (slideData) {
            const currentThemeObj = PRESENTATION_THEMES[theme.id] || theme;
            const newSlide = generateSlideFromLayout(
              slideData.slideTitle || '优化幻灯片',
              slideData.layoutType || 'split',
              currentThemeObj,
              {
                summary: slideData.summary,
                keyPoints: slideData.keyPoints,
                metrics: slideData.metrics,
              }
            );

            if (action === 'update_active_slide') {
              onUpdateActiveSlide(newSlide);
            } else if (action === 'add_new_slide') {
              onInsertSlide(newSlide);
            }
          }

          setMessages((prev) => [
            ...prev,
            {
              id: `msg_${Date.now()}`,
              role: 'assistant',
              content: reply || '已根据您的需求完成幻灯片调整并重新自动化排版。',
              timestamp: Date.now(),
              suggestedActions: suggestedActions || [
                '将第三页改为时间轴',
                '优化当前页文字排版',
                '增加数据增长箭头',
              ],
            },
          ]);
        } else {
          throw new Error(result.error || '修改执行失败');
        }
      }
    } catch (err: any) {
      console.error('AI chat error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `msg_err_${Date.now()}`,
          role: 'assistant',
          content: `处理您的请求时遇到问题：${err.message || '网络繁忙'}。请尝试重试或修改提示词。`,
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsGenerating(false);
      scrollToBottom();
    }
  };

  // Convert current outline to full slides deck
  const handleGenerateFullDeck = (outlineData: OutlineResponse) => {
    const currentThemeObj = PRESENTATION_THEMES[theme.id] || theme;
    const generatedSlides: Slide[] = outlineData.outline.map((item) => {
      return generateSlideFromLayout(
        item.title,
        item.layoutType,
        currentThemeObj,
        {
          summary: item.summary,
          keyPoints: item.keyPoints,
        }
      );
    });

    onApplyNewDeck(generatedSlides, outlineData.topic);

    setMessages((prev) => [
      ...prev,
      {
        id: `msg_done_${Date.now()}`,
        role: 'assistant',
        content: `🎉 整套《${outlineData.topic}》（共 ${generatedSlides.length} 页）已全部生成并完成麦肯锡专业级自动化排版！您现在可以在中间画布上自由点击拖拽编辑任何文字、形状和线条，也可以继续在对话框向我发号施令！`,
        timestamp: Date.now(),
        suggestedActions: [
          '把第一页标题加大并润色',
          '为第3页加入核心数据飞轮',
          '在末尾增加一页团队介绍',
        ],
      },
    ]);
    scrollToBottom();
  };

  if (!isOpen) return null;

  return (
    <div className="w-96 border-r border-slate-800 bg-[#0d121c] flex flex-col h-full shrink-0 z-20 shadow-2xl animate-in slide-in-from-left duration-200">
      {/* Header */}
      <div className="p-3.5 border-b border-slate-800 bg-[#121824] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
              <span>AI 协同演示设计</span>
              <span className="text-[10px] text-blue-400 bg-blue-500/10 px-1.5 py-0.2 rounded font-mono">
                Gemini 3.8
              </span>
            </div>
            <div className="text-[10px] text-slate-400">一边对话一边生成 · 支持任何文件上传</div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          title="关闭侧边栏"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[90%] rounded-2xl p-3.5 leading-relaxed shadow-sm ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-xs'
                  : 'bg-[#161f30] border border-slate-800 text-slate-200 rounded-bl-xs'
              }`}
            >
              {/* User Attachment Chips */}
              {msg.attachments && msg.attachments.length > 0 && (
                <div className="mb-2 space-y-1">
                  {msg.attachments.map((att) => (
                    <div
                      key={att.id}
                      className="flex items-center gap-1.5 px-2 py-1 rounded bg-blue-700/60 text-[11px] text-blue-100 truncate"
                    >
                      <FileText className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{att.name}</span>
                    </div>
                  ))}
                </div>
              )}

              <p className="whitespace-pre-wrap">{msg.content}</p>

              {/* Outline Proposal Card */}
              {msg.type === 'outline_proposal' && msg.outlineData && (
                <div className="mt-3.5 pt-3 border-t border-slate-700/60 space-y-2.5">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-blue-300">
                    <span>📑 规划大纲预览</span>
                    <span className="text-slate-400 font-normal">
                      受众: {msg.outlineData.targetAudience}
                    </span>
                  </div>

                  <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                    {msg.outlineData.outline.map((item) => (
                      <div
                        key={item.slideNumber}
                        className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 text-[11px]"
                      >
                        <div className="flex items-center justify-between font-bold text-slate-200">
                          <span>
                            {item.slideNumber}. {item.title}
                          </span>
                          <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300">
                            {item.layoutType}
                          </span>
                        </div>
                        <div className="text-slate-400 text-[10px] mt-0.5">{item.summary}</div>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => handleGenerateFullDeck(msg.outlineData!)}
                    className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/20 transition active:scale-98"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>一键生成全套 PPT ({msg.outlineData.outline.length}页)</span>
                  </button>
                </div>
              )}
            </div>

            {/* Suggested Follow-up Actions */}
            {msg.suggestedActions && msg.suggestedActions.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2 max-w-[95%]">
                {msg.suggestedActions.map((action, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      if (action.includes('一键生成') && msg.outlineData) {
                        handleGenerateFullDeck(msg.outlineData);
                      } else {
                        handleSubmit(action);
                      }
                    }}
                    className="text-[10px] px-2.5 py-1 rounded-full bg-slate-900/80 hover:bg-blue-950/60 border border-slate-800 hover:border-blue-700/60 text-slate-300 hover:text-blue-300 transition text-left"
                  >
                    {action}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {isGenerating && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-blue-400 text-xs animate-pulse">
            <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
            <span>AI 正在分析资料并排版幻灯片...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 border-t border-slate-800 bg-[#101622] space-y-2">
        {/* Quick sample chips (when conversation is young) */}
        {messages.length <= 2 && (
          <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar">
            {SAMPLE_PROMPTS.map((p, idx) => (
              <button
                key={idx}
                onClick={() => setInputPrompt(p)}
                className="whitespace-nowrap px-2 py-0.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-[10px] text-slate-400 hover:text-slate-200 transition"
              >
                {p}
              </button>
            ))}
          </div>
        )}

        {/* Uploaded File Badges */}
        {attachedFiles.length > 0 && (
          <div className="flex flex-wrap gap-1.5 p-2 rounded-lg bg-slate-900/80 border border-slate-800">
            {attachedFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center gap-1.5 px-2 py-1 rounded bg-blue-950/60 border border-blue-800/50 text-[11px] text-blue-200"
              >
                <FileText className="w-3 h-3 text-blue-400" />
                <span className="max-w-[140px] truncate">{file.name}</span>
                <button
                  onClick={() => removeFile(file.id)}
                  className="hover:text-rose-400 ml-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input Box */}
        <div className="relative bg-slate-900 border border-slate-700/80 rounded-xl focus-within:border-blue-500 transition shadow-inner">
          <textarea
            rows={2}
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder="输入PPT主题、或输入修改指令 (例如：增加竞品分析页)..."
            className="w-full bg-transparent p-2.5 pb-8 text-xs text-slate-100 placeholder:text-slate-500 outline-none resize-none"
          />

          {/* Bottom actions: File attach button & send button */}
          <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between">
            <div className="flex items-center gap-1">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-slate-800 transition flex items-center gap-1 text-[11px]"
                title="上传参考资料 (PDF / DOC / TXT / CSV / 图片等)"
              >
                <Paperclip className="w-3.5 h-3.5" />
                <span>上传资料</span>
              </button>
            </div>

            <button
              onClick={() => handleSubmit()}
              disabled={isGenerating || (!inputPrompt.trim() && attachedFiles.length === 0)}
              className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:hover:bg-blue-600 text-white transition flex items-center gap-1 text-xs font-semibold shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
