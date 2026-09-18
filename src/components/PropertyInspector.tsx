import React, { useState } from 'react';
import {
  Sliders,
  Type,
  Square,
  Sparkles,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  ArrowUp,
  ArrowDown,
  Trash2,
  Copy,
  Layers,
  Palette,
  Loader2,
  Check,
  Globe,
  FileText,
} from 'lucide-react';
import { Slide, SlideElement, PresentationTheme } from '../types';

interface PropertyInspectorProps {
  slide: Slide;
  theme: PresentationTheme;
  selectedElementId: string | null;
  onUpdateElement: (id: string, updates: Partial<SlideElement>) => void;
  onUpdateSlide: (updates: Partial<Slide>) => void;
  onDeleteElement: (id: string) => void;
  onDuplicateElement: (id: string) => void;
  onReorderElement: (id: string, direction: 'forward' | 'backward') => void;
  onClose: () => void;
}

const COLOR_PALETTE = [
  '#f8fafc',
  '#cbd5e1',
  '#94a3b8',
  '#38bdf8',
  '#3b82f6',
  '#6366f1',
  '#8b5cf6',
  '#ec4899',
  '#f43f5e',
  '#f97316',
  '#eab308',
  '#10b981',
  '#065f46',
  '#1e293b',
  '#0f172a',
  '#000000',
];

export const PropertyInspector: React.FC<PropertyInspectorProps> = ({
  slide,
  theme,
  selectedElementId,
  onUpdateElement,
  onUpdateSlide,
  onDeleteElement,
  onDuplicateElement,
  onReorderElement,
}) => {
  const [aiLoading, setAiLoading] = useState(false);
  const [aiNotice, setAiNotice] = useState<string | null>(null);

  const selectedElement = slide.elements.find((e) => e.id === selectedElementId);

  // Trigger AI Text Refinement
  const handleAiRefine = async (type: 'polish' | 'summarize' | 'bullet_points' | 'translate_en') => {
    if (!selectedElement || selectedElement.type !== 'text') return;
    setAiLoading(true);
    setAiNotice(null);

    try {
      const res = await fetch('/api/ai/refine-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: selectedElement.content, type }),
      });
      const data = await res.json();
      if (data.result) {
        onUpdateElement(selectedElement.id, { content: data.result });
        setAiNotice('✓ AI 润色成功并应用');
        setTimeout(() => setAiNotice(null), 2500);
      }
    } catch (err) {
      console.error('Failed to refine text with AI:', err);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <aside className="w-72 border-l border-slate-800 bg-[#0d121c] flex flex-col h-full shrink-0 select-none overflow-y-auto text-xs text-slate-300">
      {/* Header */}
      <div className="p-3 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-1.5 font-semibold text-slate-200">
          <Sliders className="w-3.5 h-3.5 text-blue-400" />
          <span>{selectedElement ? '图层属性' : '页面属性与备注'}</span>
        </div>

        {selectedElement && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => onDuplicateElement(selectedElement.id)}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
              title="复制"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDeleteElement(selectedElement.id)}
              className="p-1 rounded text-rose-400 hover:text-rose-300 hover:bg-rose-950/40"
              title="删除"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      <div className="p-4 space-y-5">
        {selectedElement ? (
          <>
            {/* Element Type Badge & ID */}
            <div className="flex items-center justify-between bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-400">图层类型</span>
              <span className="font-semibold text-blue-400 uppercase tracking-wider text-[11px] bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                {selectedElement.type}
              </span>
            </div>

            {/* Position & Dimensions */}
            <div>
              <div className="font-medium text-slate-400 mb-2">坐标与尺寸</div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-500 mb-1 block">X 坐标</label>
                  <input
                    type="number"
                    value={selectedElement.x}
                    onChange={(e) =>
                      onUpdateElement(selectedElement.id, { x: Number(e.target.value) })
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-100 outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 mb-1 block">Y 坐标</label>
                  <input
                    type="number"
                    value={selectedElement.y}
                    onChange={(e) =>
                      onUpdateElement(selectedElement.id, { y: Number(e.target.value) })
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-100 outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 mb-1 block">宽度 W</label>
                  <input
                    type="number"
                    value={selectedElement.width}
                    onChange={(e) =>
                      onUpdateElement(selectedElement.id, { width: Number(e.target.value) })
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-100 outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 mb-1 block">高度 H</label>
                  <input
                    type="number"
                    value={selectedElement.height}
                    onChange={(e) =>
                      onUpdateElement(selectedElement.id, { height: Number(e.target.value) })
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-100 outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Layer Hierarchy (Z-Index) & Opacity */}
            <div>
              <div className="font-medium text-slate-400 mb-2">层级与不透明度</div>
              <div className="flex items-center gap-2 mb-3">
                <button
                  onClick={() => onReorderElement(selectedElement.id, 'forward')}
                  className="flex-1 py-1.5 px-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded text-slate-200 flex items-center justify-center gap-1.5 transition"
                >
                  <ArrowUp className="w-3.5 h-3.5 text-blue-400" />
                  <span>上移一层</span>
                </button>
                <button
                  onClick={() => onReorderElement(selectedElement.id, 'backward')}
                  className="flex-1 py-1.5 px-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded text-slate-200 flex items-center justify-center gap-1.5 transition"
                >
                  <ArrowDown className="w-3.5 h-3.5 text-slate-400" />
                  <span>下移一层</span>
                </button>
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>不透明度</span>
                  <span>{Math.round((selectedElement.opacity ?? 1) * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.05"
                  value={selectedElement.opacity ?? 1}
                  onChange={(e) =>
                    onUpdateElement(selectedElement.id, { opacity: Number(e.target.value) })
                  }
                  className="w-full accent-blue-500 cursor-pointer"
                />
              </div>
            </div>

            {/* SPECIFIC CONTROLS: TEXT */}
            {selectedElement.type === 'text' && (
              <div className="space-y-4 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-300">文本与排版</span>
                  <Type className="w-3.5 h-3.5 text-blue-400" />
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 mb-1 block">文本内容</label>
                  <textarea
                    rows={3}
                    value={selectedElement.content}
                    onChange={(e) =>
                      onUpdateElement(selectedElement.id, { content: e.target.value })
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-slate-100 outline-none focus:border-blue-500 font-sans"
                  />
                </div>

                {/* AI Text Refinement Tools */}
                <div className="p-2.5 rounded-xl bg-blue-950/20 border border-blue-800/40 space-y-2">
                  <div className="flex items-center justify-between text-blue-300 font-semibold text-[11px]">
                    <div className="flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-blue-400" />
                      <span>AI 智能文案助手</span>
                    </div>
                    {aiLoading && <Loader2 className="w-3 h-3 animate-spin text-blue-400" />}
                  </div>

                  {aiNotice && (
                    <div className="text-[10px] text-emerald-400 font-medium">
                      {aiNotice}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => handleAiRefine('polish')}
                      disabled={aiLoading}
                      className="py-1 px-1.5 rounded bg-slate-800/80 hover:bg-blue-600/30 text-slate-200 text-[11px] flex items-center justify-center gap-1 transition"
                    >
                      <span>专业润色</span>
                    </button>
                    <button
                      onClick={() => handleAiRefine('summarize')}
                      disabled={aiLoading}
                      className="py-1 px-1.5 rounded bg-slate-800/80 hover:bg-blue-600/30 text-slate-200 text-[11px] flex items-center justify-center gap-1 transition"
                    >
                      <span>提炼金句</span>
                    </button>
                    <button
                      onClick={() => handleAiRefine('bullet_points')}
                      disabled={aiLoading}
                      className="py-1 px-1.5 rounded bg-slate-800/80 hover:bg-blue-600/30 text-slate-200 text-[11px] flex items-center justify-center gap-1 transition"
                    >
                      <FileText className="w-3 h-3 text-blue-400" />
                      <span>扩充为3点</span>
                    </button>
                    <button
                      onClick={() => handleAiRefine('translate_en')}
                      disabled={aiLoading}
                      className="py-1 px-1.5 rounded bg-slate-800/80 hover:bg-blue-600/30 text-slate-200 text-[11px] flex items-center justify-center gap-1 transition"
                    >
                      <Globe className="w-3 h-3 text-emerald-400" />
                      <span>翻译英文</span>
                    </button>
                  </div>
                </div>

                {/* Font Size & Weight */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500 mb-1 block">字号 (px)</label>
                    <input
                      type="number"
                      value={selectedElement.fontSize}
                      onChange={(e) =>
                        onUpdateElement(selectedElement.id, { fontSize: Number(e.target.value) })
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-100 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 mb-1 block">字重</label>
                    <select
                      value={selectedElement.fontWeight || 'normal'}
                      onChange={(e) =>
                        onUpdateElement(selectedElement.id, { fontWeight: e.target.value as any })
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-100 outline-none"
                    >
                      <option value="normal">常规 Normal</option>
                      <option value="medium">中等 Medium</option>
                      <option value="semibold">半粗 Semibold</option>
                      <option value="bold">粗体 Bold</option>
                      <option value="extrabold">特粗 ExtraBold</option>
                    </select>
                  </div>
                </div>

                {/* Alignment */}
                <div>
                  <label className="text-[10px] text-slate-500 mb-1 block">对齐方式</label>
                  <div className="flex rounded border border-slate-800 overflow-hidden bg-slate-900">
                    {(['left', 'center', 'right'] as const).map((align) => (
                      <button
                        key={align}
                        onClick={() => onUpdateElement(selectedElement.id, { textAlign: align })}
                        className={`flex-1 py-1 flex items-center justify-center ${
                          (selectedElement.textAlign || 'left') === align
                            ? 'bg-blue-600 text-white'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {align === 'left' && <AlignLeft className="w-3.5 h-3.5" />}
                        {align === 'center' && <AlignCenter className="w-3.5 h-3.5" />}
                        {align === 'right' && <AlignRight className="w-3.5 h-3.5" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Text Color Picker */}
                <div>
                  <label className="text-[10px] text-slate-500 mb-1.5 block">文字颜色</label>
                  <div className="flex flex-wrap gap-1.5">
                    {COLOR_PALETTE.map((c) => (
                      <button
                        key={c}
                        onClick={() => onUpdateElement(selectedElement.id, { color: c })}
                        className={`w-5 h-5 rounded-full border transition ${
                          selectedElement.color === c ? 'ring-2 ring-blue-500 scale-110' : 'border-slate-700'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* SPECIFIC CONTROLS: SHAPE */}
            {selectedElement.type === 'shape' && (
              <div className="space-y-4 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-300">形状外观</span>
                  <Square className="w-3.5 h-3.5 text-amber-400" />
                </div>

                {/* Center Label */}
                <div>
                  <label className="text-[10px] text-slate-500 mb-1 block">内置中心文字</label>
                  <input
                    type="text"
                    value={selectedElement.label || ''}
                    onChange={(e) =>
                      onUpdateElement(selectedElement.id, { label: e.target.value })
                    }
                    placeholder="选填"
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-100 outline-none"
                  />
                </div>

                {/* Fill Color */}
                <div>
                  <label className="text-[10px] text-slate-500 mb-1.5 block">填充颜色</label>
                  <div className="flex flex-wrap gap-1.5">
                    {COLOR_PALETTE.map((c) => (
                      <button
                        key={c}
                        onClick={() => onUpdateElement(selectedElement.id, { fill: c })}
                        className={`w-5 h-5 rounded-full border transition ${
                          selectedElement.fill === c ? 'ring-2 ring-blue-500 scale-110' : 'border-slate-700'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>

                {/* Border Radius */}
                <div>
                  <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                    <span>圆角半径</span>
                    <span>{selectedElement.borderRadius ?? 8}px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="40"
                    value={selectedElement.borderRadius ?? 8}
                    onChange={(e) =>
                      onUpdateElement(selectedElement.id, {
                        borderRadius: Number(e.target.value),
                      })
                    }
                    className="w-full accent-blue-500 cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* SPECIFIC CONTROLS: LINE */}
            {selectedElement.type === 'line' && (
              <div className="space-y-4 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-300">线条与箭头</span>
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 mb-1 block">粗细 (Stroke Width)</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={selectedElement.strokeWidth}
                    onChange={(e) =>
                      onUpdateElement(selectedElement.id, {
                        strokeWidth: Number(e.target.value),
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-100 outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 mb-1 block">线条样式</label>
                  <select
                    value={selectedElement.strokeStyle || 'solid'}
                    onChange={(e) =>
                      onUpdateElement(selectedElement.id, {
                        strokeStyle: e.target.value as any,
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-100 outline-none"
                  >
                    <option value="solid">实线 Solid</option>
                    <option value="dashed">虚线 Dashed</option>
                    <option value="dotted">点线 Dotted</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 mb-1 block">箭头指示</label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(selectedElement.endArrow)}
                      onChange={(e) =>
                        onUpdateElement(selectedElement.id, { endArrow: e.target.checked })
                      }
                      className="accent-blue-500"
                    />
                    <span>末端指示箭头</span>
                  </label>
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 mb-1.5 block">线条颜色</label>
                  <div className="flex flex-wrap gap-1.5">
                    {COLOR_PALETTE.map((c) => (
                      <button
                        key={c}
                        onClick={() => onUpdateElement(selectedElement.id, { stroke: c })}
                        className={`w-5 h-5 rounded-full border transition ${
                          selectedElement.stroke === c ? 'ring-2 ring-blue-500 scale-110' : 'border-slate-700'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* SPECIFIC CONTROLS: CARD */}
            {selectedElement.type === 'card' && (
              <div className="space-y-4 pt-2 border-t border-slate-800">
                <div className="font-medium text-slate-300">卡片内容编辑</div>

                <div>
                  <label className="text-[10px] text-slate-500 mb-1 block">卡片标题</label>
                  <input
                    type="text"
                    value={selectedElement.title}
                    onChange={(e) =>
                      onUpdateElement(selectedElement.id, { title: e.target.value })
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-100 outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 mb-1 block">副标题 / 英文</label>
                  <input
                    type="text"
                    value={selectedElement.subtitle || ''}
                    onChange={(e) =>
                      onUpdateElement(selectedElement.id, { subtitle: e.target.value })
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-100 outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 mb-1 block">标签 (Tag)</label>
                  <input
                    type="text"
                    value={selectedElement.tag || ''}
                    onChange={(e) =>
                      onUpdateElement(selectedElement.id, { tag: e.target.value })
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-100 outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 mb-1 block">卡片说明正文</label>
                  <textarea
                    rows={3}
                    value={selectedElement.body || ''}
                    onChange={(e) =>
                      onUpdateElement(selectedElement.id, { body: e.target.value })
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-slate-100 outline-none"
                  />
                </div>
              </div>
            )}
          </>
        ) : (
          /* NO ELEMENT SELECTED: SLIDE SETTINGS */
          <div className="space-y-4">
            <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-800">
              <div className="text-slate-400 mb-1">当前幻灯片</div>
              <div className="text-sm font-bold text-white mb-2">{slide.title}</div>
              <div className="text-[11px] text-slate-500">
                当前版式: <span className="text-blue-400 font-semibold">{slide.layoutType}</span>
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-500 mb-1 block">幻灯片名称</label>
              <input
                type="text"
                value={slide.title}
                onChange={(e) => onUpdateSlide({ title: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-slate-100 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-500 mb-1.5 block">画布背景颜色</label>
              <div className="flex flex-wrap gap-1.5">
                {COLOR_PALETTE.map((c) => (
                  <button
                    key={c}
                    onClick={() =>
                      onUpdateSlide({
                        background: { type: 'color', value: c },
                      })
                    }
                    className={`w-5 h-5 rounded-full border transition ${
                      slide.background?.value === c ? 'ring-2 ring-blue-500 scale-110' : 'border-slate-700'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-500 mb-1 block">演讲者备注 (Speaker Notes)</label>
              <textarea
                rows={4}
                value={slide.notes || ''}
                onChange={(e) => onUpdateSlide({ notes: e.target.value })}
                placeholder="在此添加演讲提示、数据来源或备忘要点..."
                className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-slate-100 outline-none focus:border-blue-500 text-xs"
              />
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
              💡 <strong className="text-slate-300">操作提示：</strong>
              <br />
              • 单击画布中的任何文字、形状或线条即可展开深度属性配置。
              • 双击文字框可直接进入打字编辑模式。
              • 支持拖拽四周控制点无级缩放尺寸。
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
