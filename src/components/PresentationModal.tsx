import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  FileText,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { Slide, PresentationTheme } from '../types';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../utils/slideGenerator';

interface PresentationModalProps {
  isOpen: boolean;
  slides: Slide[];
  initialSlideIndex?: number;
  theme: PresentationTheme;
  onClose: () => void;
}

export const PresentationModal: React.FC<PresentationModalProps> = ({
  isOpen,
  slides,
  initialSlideIndex = 0,
  theme,
  onClose,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialSlideIndex);
  const [showNotes, setShowNotes] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialSlideIndex);
    }
  }, [isOpen, initialSlideIndex]);

  // Compute responsive scale for fullscreen viewport
  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const scaleX = (w * 0.94) / CANVAS_WIDTH;
      const scaleY = (h * (showNotes ? 0.72 : 0.88)) / CANVAS_HEIGHT;
      setScale(Math.min(scaleX, scaleY));
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [showNotes]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
        e.preventDefault();
        setCurrentIndex((i) => Math.min(slides.length - 1, i + 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        setCurrentIndex((i) => Math.max(0, i - 1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, slides.length, onClose]);

  if (!isOpen || slides.length === 0) return null;

  const currentSlide = slides[currentIndex] || slides[0];

  return (
    <div className="fixed inset-0 z-50 bg-[#060910] flex flex-col items-center justify-between p-4 select-none animate-in fade-in duration-200">
      {/* Top Floating Control Bar */}
      <div className="w-full flex items-center justify-between max-w-6xl px-4 py-2 text-slate-300">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm text-white">{currentSlide.title}</span>
          <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
            {currentIndex + 1} / {slides.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNotes(!showNotes)}
            className={`px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition ${
              showNotes ? 'bg-blue-600 text-white' : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>演讲备注</span>
          </button>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
            title="退出放映 (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Slide Canvas */}
      <div className="flex-1 flex items-center justify-center relative w-full overflow-hidden">
        {/* Previous Button */}
        <button
          onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
          disabled={currentIndex === 0}
          className="absolute left-4 z-20 p-3 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white disabled:opacity-20 border border-slate-800 shadow-xl transition"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {/* Slide Board */}
        <div
          ref={stageRef}
          style={{
            width: `${CANVAS_WIDTH}px`,
            height: `${CANVAS_HEIGHT}px`,
            transform: `scale(${scale})`,
            transformOrigin: 'center center',
            backgroundColor: currentSlide.background?.value || theme.canvasBg,
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.9)',
          }}
          className="relative overflow-hidden rounded-xl"
        >
          {/* Render Elements sorted by z-index */}
          {[...currentSlide.elements]
            .sort((a, b) => a.zIndex - b.zIndex)
            .map((elem) => {
              return (
                <div
                  key={elem.id}
                  style={{
                    position: 'absolute',
                    left: `${elem.x}px`,
                    top: `${elem.y}px`,
                    width: `${elem.width}px`,
                    height: `${elem.height}px`,
                    zIndex: elem.zIndex,
                    opacity: elem.opacity ?? 1,
                  }}
                >
                  {elem.type === 'text' && (
                    <div
                      style={{
                        fontSize: `${elem.fontSize}px`,
                        fontWeight: elem.fontWeight || 'normal',
                        color: elem.color,
                        textAlign: elem.textAlign || 'left',
                        lineHeight: elem.lineHeight || 1.3,
                        whiteSpace: 'pre-wrap',
                      }}
                      className="w-full h-full leading-snug"
                    >
                      {elem.content}
                    </div>
                  )}

                  {elem.type === 'shape' && (
                    <div
                      className="w-full h-full flex items-center justify-center overflow-hidden"
                      style={{
                        backgroundColor: elem.fill,
                        border: elem.stroke ? `${elem.strokeWidth || 1}px solid ${elem.stroke}` : undefined,
                        borderRadius:
                          elem.shapeType === 'circle'
                            ? '9999px'
                            : elem.shapeType === 'pill'
                            ? '9999px'
                            : elem.shapeType === 'star'
                            ? '0'
                            : `${elem.borderRadius ?? 8}px`,
                        clipPath:
                          elem.shapeType === 'star'
                            ? 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)'
                            : undefined,
                      }}
                    >
                      {elem.label && (
                        <span
                          className="font-bold text-center px-2"
                          style={{ color: elem.labelColor || '#ffffff', fontSize: '14px' }}
                        >
                          {elem.label}
                        </span>
                      )}
                    </div>
                  )}

                  {elem.type === 'line' && (
                    <div className="w-full h-full flex items-center relative">
                      <svg className="w-full h-full overflow-visible">
                        <defs>
                          <marker
                            id={`arrow_play_${elem.id}`}
                            viewBox="0 0 10 10"
                            refX="6"
                            refY="5"
                            markerWidth="6"
                            markerHeight="6"
                            orient="auto-start-reverse"
                          >
                            <path d="M 0 1 L 10 5 L 0 9 z" fill={elem.stroke} />
                          </marker>
                        </defs>
                        <line
                          x1="0"
                          y1={elem.height / 2}
                          x2={elem.width}
                          y2={elem.height / 2}
                          stroke={elem.stroke}
                          strokeWidth={elem.strokeWidth}
                          strokeDasharray={
                            elem.strokeStyle === 'dashed'
                              ? '6,6'
                              : elem.strokeStyle === 'dotted'
                              ? '2,4'
                              : undefined
                          }
                          markerEnd={elem.endArrow ? `url(#arrow_play_${elem.id})` : undefined}
                        />
                      </svg>
                    </div>
                  )}

                  {elem.type === 'badge' && (
                    <div
                      className="w-full h-full rounded-full flex items-center justify-center px-3 font-semibold text-xs tracking-wider uppercase shadow-sm"
                      style={{
                        backgroundColor: elem.bg,
                        color: elem.color,
                        border: `1px solid ${elem.color}30`,
                      }}
                    >
                      <span>{elem.text}</span>
                    </div>
                  )}

                  {elem.type === 'card' && (
                    <div
                      className="w-full h-full p-4 rounded-xl flex flex-col justify-between overflow-hidden shadow-lg border"
                      style={{
                        backgroundColor: elem.bg,
                        borderColor: elem.accentColor ? `${elem.accentColor}40` : theme.border,
                        borderRadius: `${elem.borderRadius ?? 12}px`,
                      }}
                    >
                      <div>
                        {elem.tag && (
                          <div
                            className="inline-block px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase mb-2"
                            style={{
                              backgroundColor: elem.accentColor ? `${elem.accentColor}20` : '#38bdf820',
                              color: elem.accentColor || '#38bdf8',
                            }}
                          >
                            {elem.tag}
                          </div>
                        )}
                        <h4
                          className="font-bold text-base leading-tight mb-1"
                          style={{ color: elem.textColor }}
                        >
                          {elem.title}
                        </h4>
                        {elem.subtitle && (
                          <p
                            className="text-xs uppercase font-medium tracking-wide mb-2 opacity-70"
                            style={{ color: elem.textColor }}
                          >
                            {elem.subtitle}
                          </p>
                        )}
                      </div>

                      <p
                        className="text-xs leading-relaxed opacity-85 mt-auto"
                        style={{ color: elem.textColor }}
                      >
                        {elem.body}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
        </div>

        {/* Next Button */}
        <button
          onClick={() => setCurrentIndex((i) => Math.min(slides.length - 1, i + 1))}
          disabled={currentIndex === slides.length - 1}
          className="absolute right-4 z-20 p-3 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white disabled:opacity-20 border border-slate-800 shadow-xl transition"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Speaker Notes Drawer (Optional) */}
      {showNotes && (
        <div className="w-full max-w-4xl p-3.5 bg-slate-900/90 border border-slate-800 rounded-xl text-xs text-slate-300 animate-in slide-in-from-bottom-2 duration-150">
          <div className="font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-blue-400" />
            <span>当前页演讲者备注：</span>
          </div>
          <p className="leading-relaxed text-slate-200">
            {currentSlide.notes || '本页暂无备注信息。'}
          </p>
        </div>
      )}

      {/* Bottom Hint */}
      <div className="text-[11px] text-slate-500 py-1">
        使用方向键 ← → 或空格键切换幻灯片，按 ESC 退出放映
      </div>
    </div>
  );
};
