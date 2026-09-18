import React from 'react';
import {
  Plus,
  Copy,
  Trash2,
  ChevronUp,
  ChevronDown,
  LayoutGrid,
} from 'lucide-react';
import { Slide, SlideLayoutType, PresentationTheme } from '../types';

interface SlideThumbnailBarProps {
  slides: Slide[];
  activeSlideId: string;
  theme: PresentationTheme;
  onSelectSlide: (slideId: string) => void;
  onAddSlide: (layoutType: SlideLayoutType) => void;
  onDuplicateSlide: (slideId: string) => void;
  onDeleteSlide: (slideId: string) => void;
  onMoveSlide: (slideId: string, direction: 'up' | 'down') => void;
  onOpenLayoutModal: () => void;
}

export const SlideThumbnailBar: React.FC<SlideThumbnailBarProps> = ({
  slides,
  activeSlideId,
  theme,
  onSelectSlide,
  onDuplicateSlide,
  onDeleteSlide,
  onMoveSlide,
  onOpenLayoutModal,
}) => {
  return (
    <aside className="w-56 border-r border-slate-800 bg-[#0d121c] flex flex-col h-full shrink-0 select-none">
      {/* Header */}
      <div className="p-3 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
          <LayoutGrid className="w-3.5 h-3.5 text-blue-400" />
          <span>幻灯片列表</span>
          <span className="text-[11px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
            {slides.length}
          </span>
        </div>

        <button
          onClick={onOpenLayoutModal}
          className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition flex items-center gap-1 text-xs font-medium shadow-sm"
          title="新建幻灯片"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>加页</span>
        </button>
      </div>

      {/* Slide Thumbnails Scroll Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {slides.map((slide, index) => {
          const isActive = slide.id === activeSlideId;

          return (
            <div
              key={slide.id}
              className={`group relative rounded-xl transition-all cursor-pointer ${
                isActive
                  ? 'ring-2 ring-blue-500 shadow-lg shadow-blue-500/10 bg-slate-800/60'
                  : 'hover:bg-slate-800/30'
              }`}
              onClick={() => onSelectSlide(slide.id)}
            >
              {/* Slide Number & Layout Tag */}
              <div className="flex items-center justify-between px-2 pt-1.5 pb-1 text-[11px]">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <span className={`font-mono font-bold ${isActive ? 'text-blue-400' : ''}`}>
                    {index + 1}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-slate-500">
                    {slide.layoutType}
                  </span>
                </div>

                {/* Hover Action Buttons */}
                <div
                  className={`flex items-center gap-0.5 transition ${
                    isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  }`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => onMoveSlide(slide.id, 'up')}
                    disabled={index === 0}
                    className="p-1 rounded text-slate-400 hover:text-slate-100 hover:bg-slate-700 disabled:opacity-20"
                    title="上移"
                  >
                    <ChevronUp className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => onMoveSlide(slide.id, 'down')}
                    disabled={index === slides.length - 1}
                    className="p-1 rounded text-slate-400 hover:text-slate-100 hover:bg-slate-700 disabled:opacity-20"
                    title="下移"
                  >
                    <ChevronDown className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => onDuplicateSlide(slide.id)}
                    className="p-1 rounded text-slate-400 hover:text-slate-100 hover:bg-slate-700"
                    title="复制本页"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => onDeleteSlide(slide.id)}
                    disabled={slides.length <= 1}
                    className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-700 disabled:opacity-20"
                    title="删除本页"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Miniature Slide Preview */}
              <div className="p-1.5 pt-0">
                <div
                  className="w-full aspect-[16/9] rounded-lg border border-slate-700/60 overflow-hidden relative shadow-inner p-2 flex flex-col justify-between"
                  style={{
                    backgroundColor: slide.background?.value || theme.canvasBg,
                  }}
                >
                  {/* Miniature decorative accent dot */}
                  <div
                    className="w-2 h-2 rounded-full absolute top-1.5 right-1.5 opacity-70"
                    style={{ background: theme.accent }}
                  />

                  {/* Title Preview */}
                  <div className="text-[10px] font-bold leading-tight line-clamp-2 text-slate-200">
                    {slide.title || '无标题幻灯片'}
                  </div>

                  {/* Layout representation bars */}
                  <div className="space-y-1 opacity-60">
                    <div className="h-1 bg-slate-600/70 rounded-full w-3/4" />
                    <div className="flex gap-1">
                      <div className="h-1 bg-slate-700 rounded-full w-1/3" />
                      <div className="h-1 bg-slate-700 rounded-full w-1/3" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer quick add template */}
      <div className="p-3 border-t border-slate-800 bg-slate-900/40 text-center">
        <button
          onClick={onOpenLayoutModal}
          className="w-full py-2 px-3 rounded-lg border border-dashed border-slate-700 hover:border-blue-500/80 hover:bg-blue-950/20 text-slate-400 hover:text-blue-300 text-xs font-medium transition flex items-center justify-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>选择版式添加</span>
        </button>
      </div>
    </aside>
  );
};
