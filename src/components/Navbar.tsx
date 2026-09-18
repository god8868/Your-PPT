import React, { useState } from 'react';
import {
  Sparkles,
  Play,
  Download,
  RotateCcw,
  RotateCw,
  Palette,
  Check,
  ChevronDown,
  Layers,
  FileText,
  Copy,
  Sliders,
} from 'lucide-react';
import { PresentationTheme } from '../types';
import { PRESENTATION_THEMES } from '../utils/themes';

interface NavbarProps {
  title: string;
  onTitleChange: (newTitle: string) => void;
  currentTheme: PresentationTheme;
  onThemeChange: (themeId: string) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onPlaySlideshow: () => void;
  onExportPptx: () => void;
  onExportOutlineText: () => void;
  isAiDrawerOpen: boolean;
  onToggleAiDrawer: () => void;
  isPropertyOpen: boolean;
  onToggleProperty: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  title,
  onTitleChange,
  currentTheme,
  onThemeChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onPlaySlideshow,
  onExportPptx,
  onExportOutlineText,
  isAiDrawerOpen,
  onToggleAiDrawer,
  isPropertyOpen,
  onToggleProperty,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(title);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [copiedNotice, setCopiedNotice] = useState(false);

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    if (titleInput.trim()) {
      onTitleChange(titleInput.trim());
    } else {
      setTitleInput(title);
    }
  };

  const handleCopyOutline = () => {
    onExportOutlineText();
    setCopiedNotice(true);
    setTimeout(() => setCopiedNotice(false), 2000);
    setShowExportMenu(false);
  };

  return (
    <header className="h-14 border-b border-slate-800 bg-[#121824] px-4 flex items-center justify-between z-30 shrink-0 select-none">
      {/* Left: Brand & Title */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-blue-600/20 to-indigo-600/20 border border-blue-500/30">
          <Sparkles className="w-4 h-4 text-blue-400 animate-pulse" />
          <span className="text-sm font-bold tracking-wide text-blue-100">AI PPT</span>
          <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300">
            PRO
          </span>
        </div>

        <div className="h-5 w-px bg-slate-800" />

        {/* Editable Title */}
        {isEditingTitle ? (
          <input
            type="text"
            value={titleInput}
            onChange={(e) => setTitleInput(e.target.value)}
            onBlur={handleTitleSubmit}
            onKeyDown={(e) => e.key === 'Enter' && handleTitleSubmit()}
            autoFocus
            className="px-2 py-1 text-sm font-medium bg-slate-900 border border-blue-500 rounded text-slate-100 outline-none w-72"
          />
        ) : (
          <button
            onClick={() => {
              setTitleInput(title);
              setIsEditingTitle(true);
            }}
            className="px-2 py-1 text-sm font-medium text-slate-200 hover:text-white hover:bg-slate-800/80 rounded transition flex items-center gap-1.5 max-w-[280px] truncate group text-left"
            title="点击修改演示文稿标题"
          >
            <span className="truncate">{title}</span>
            <span className="text-[11px] text-slate-500 group-hover:text-slate-400">✎</span>
          </button>
        )}
      </div>

      {/* Center: Quick Canvas Action Bar */}
      <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-800/80 rounded-lg p-1">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          title="撤销 (Ctrl+Z)"
          className="p-1.5 rounded text-slate-400 hover:text-slate-100 hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          title="重做 (Ctrl+Y)"
          className="p-1.5 rounded text-slate-400 hover:text-slate-100 hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition"
        >
          <RotateCw className="w-3.5 h-3.5" />
        </button>

        <div className="h-4 w-px bg-slate-800 mx-1" />

        {/* Theme Picker Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowThemeMenu(!showThemeMenu)}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded transition"
          >
            <Palette className="w-3.5 h-3.5 text-slate-400" />
            <span>{currentTheme.nameZh}</span>
            <ChevronDown className="w-3 h-3 text-slate-500" />
          </button>

          {showThemeMenu && (
            <div
              className="absolute top-full mt-1.5 left-0 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl py-1.5 z-50 text-xs"
              onMouseLeave={() => setShowThemeMenu(false)}
            >
              <div className="px-3 py-1 text-[10px] uppercase font-semibold text-slate-500 tracking-wider">
                选择演示主题风格
              </div>
              {Object.values(PRESENTATION_THEMES).map((th) => (
                <button
                  key={th.id}
                  onClick={() => {
                    onThemeChange(th.id);
                    setShowThemeMenu(false);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-800/80 transition text-left"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-slate-700 shrink-0"
                      style={{ background: th.accent }}
                    />
                    <span>{th.nameZh}</span>
                  </div>
                  {currentTheme.id === th.id && <Check className="w-3.5 h-3.5 text-blue-400" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right: AI Drawer Toggle, Inspector Toggle, Play & Export */}
      <div className="flex items-center gap-2">
        {/* Toggle Inspector */}
        <button
          onClick={onToggleProperty}
          className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition ${
            isPropertyOpen
              ? 'bg-slate-800 text-slate-100 border border-slate-700'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
          title="切换图层属性面板"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">属性</span>
        </button>

        {/* AI Co-pilot Chat Drawer Toggle */}
        <button
          onClick={onToggleAiDrawer}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-sm ${
            isAiDrawerOpen
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-blue-500/20 shadow-md ring-1 ring-blue-400/40'
              : 'bg-blue-950/60 text-blue-300 hover:bg-blue-900/60 border border-blue-800/60'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-blue-300" />
          <span>AI 对话生成</span>
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
        </button>

        <div className="h-5 w-px bg-slate-800 mx-1" />

        {/* Play Slideshow */}
        <button
          onClick={onPlaySlideshow}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-100 flex items-center gap-1.5 border border-slate-700 transition"
          title="全屏放映演示文稿"
        >
          <Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
          <span className="hidden md:inline">放映</span>
        </button>

        {/* Export Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 transition shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>导出</span>
            <ChevronDown className="w-3 h-3 text-emerald-200" />
          </button>

          {showExportMenu && (
            <div
              className="absolute top-full mt-1.5 right-0 w-52 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl py-1.5 z-50 text-xs"
              onMouseLeave={() => setShowExportMenu(false)}
            >
              <button
                onClick={() => {
                  onExportPptx();
                  setShowExportMenu(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-slate-200 hover:text-white hover:bg-emerald-950/40 hover:text-emerald-300 transition text-left"
              >
                <Layers className="w-4 h-4 text-emerald-400" />
                <div>
                  <div className="font-semibold">导出 PPTX 文件</div>
                  <div className="text-[10px] text-slate-400">适配 PowerPoint / Keynote / WPS</div>
                </div>
              </button>

              <button
                onClick={handleCopyOutline}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-slate-200 hover:text-white hover:bg-slate-800 transition text-left border-t border-slate-800"
              >
                <FileText className="w-4 h-4 text-blue-400" />
                <div>
                  <div className="font-semibold">复制 Markdown 大纲</div>
                  <div className="text-[10px] text-slate-400">
                    {copiedNotice ? '✓ 已复制到剪贴板' : '包含每页核心论述与结构'}
                  </div>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
