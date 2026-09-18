import React, { useState, useCallback } from 'react';
import { Slide, SlideElement, SlideLayoutType } from './types';
import { PRESENTATION_THEMES, DEFAULT_THEME_ID } from './utils/themes';
import { createInitialPresentation, generateSlideFromLayout } from './utils/slideGenerator';
import { exportToPptx } from './utils/pptxExport';
import { Navbar } from './components/Navbar';
import { SlideThumbnailBar } from './components/SlideThumbnailBar';
import { CanvasEditor } from './components/CanvasEditor';
import { PropertyInspector } from './components/PropertyInspector';
import { AiChatDrawer } from './components/AiChatDrawer';
import { LayoutPickerModal } from './components/LayoutPickerModal';
import { PresentationModal } from './components/PresentationModal';

export default function App() {
  const [themeId, setThemeId] = useState<string>(DEFAULT_THEME_ID);
  const currentTheme = PRESENTATION_THEMES[themeId] || PRESENTATION_THEMES[DEFAULT_THEME_ID];

  const [presentationTitle, setPresentationTitle] = useState('2026 智能商业演进与出海战略');
  const [slides, setSlides] = useState<Slide[]>(() => createInitialPresentation(DEFAULT_THEME_ID));
  const [activeSlideId, setActiveSlideId] = useState<string>(() => slides[0]?.id || '');
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);

  // Undo / Redo History
  const [history, setHistory] = useState<Slide[][]>(() => [createInitialPresentation(DEFAULT_THEME_ID)]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // UI Panels State
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(true);
  const [isPropertyOpen, setIsPropertyOpen] = useState(true);
  const [isLayoutPickerOpen, setIsLayoutPickerOpen] = useState(false);
  const [isSlideshowOpen, setIsSlideshowOpen] = useState(false);

  // Push to history helper
  const recordHistory = useCallback((newSlides: Slide[]) => {
    setHistory((prev) => {
      const sliced = prev.slice(0, historyIndex + 1);
      return [...sliced, newSlides];
    });
    setHistoryIndex((prev) => prev + 1);
  }, [historyIndex]);

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevIdx = historyIndex - 1;
      const targetState = history[prevIdx];
      setHistoryIndex(prevIdx);
      setSlides(targetState);
      if (!targetState.some((s) => s.id === activeSlideId)) {
        setActiveSlideId(targetState[0]?.id || '');
      }
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIdx = historyIndex + 1;
      const targetState = history[nextIdx];
      setHistoryIndex(nextIdx);
      setSlides(targetState);
      if (!targetState.some((s) => s.id === activeSlideId)) {
        setActiveSlideId(targetState[0]?.id || '');
      }
    }
  };

  const activeSlide = slides.find((s) => s.id === activeSlideId) || slides[0];

  // Theme change
  const handleThemeChange = (newThemeId: string) => {
    setThemeId(newThemeId);
    const newThemeObj = PRESENTATION_THEMES[newThemeId] || PRESENTATION_THEMES[DEFAULT_THEME_ID];

    // Re-skin current slides with new theme canvas background
    const updated = slides.map((s) => ({
      ...s,
      background: {
        type: 'color' as const,
        value: newThemeObj.canvasBg,
      },
    }));

    setSlides(updated);
    recordHistory(updated);
  };

  // Update Slide Content
  const handleUpdateActiveSlide = (updatedSlide: Slide) => {
    const updated = slides.map((s) => (s.id === updatedSlide.id ? updatedSlide : s));
    setSlides(updated);
    recordHistory(updated);
  };

  const handleUpdateSlideField = (updates: Partial<Slide>) => {
    if (!activeSlide) return;
    const updated = slides.map((s) => (s.id === activeSlide.id ? { ...s, ...updates } : s));
    setSlides(updated);
    recordHistory(updated);
  };

  // Element CRUD
  const handleUpdateElement = (id: string, updates: Partial<SlideElement>) => {
    if (!activeSlide) return;
    const updatedElements = activeSlide.elements.map((elem) =>
      elem.id === id ? ({ ...elem, ...updates } as SlideElement) : elem
    );
    const updatedSlide = { ...activeSlide, elements: updatedElements };
    handleUpdateActiveSlide(updatedSlide);
  };

  const handleAddElement = (element: SlideElement) => {
    if (!activeSlide) return;
    const updatedSlide = {
      ...activeSlide,
      elements: [...activeSlide.elements, element],
    };
    handleUpdateActiveSlide(updatedSlide);
    setSelectedElementId(element.id);
  };

  const handleDeleteElement = (id: string) => {
    if (!activeSlide) return;
    const updatedElements = activeSlide.elements.filter((e) => e.id !== id);
    const updatedSlide = { ...activeSlide, elements: updatedElements };
    handleUpdateActiveSlide(updatedSlide);
    if (selectedElementId === id) setSelectedElementId(null);
  };

  const handleDuplicateElement = (id: string) => {
    if (!activeSlide) return;
    const elem = activeSlide.elements.find((e) => e.id === id);
    if (!elem) return;

    const newId = `${elem.type}_${Date.now()}`;
    const maxZ = Math.max(...activeSlide.elements.map((e) => e.zIndex), 0) + 1;
    const duplicated = {
      ...elem,
      id: newId,
      x: elem.x + 20,
      y: elem.y + 20,
      zIndex: maxZ,
    } as SlideElement;

    handleAddElement(duplicated);
  };

  const handleReorderElement = (id: string, direction: 'forward' | 'backward') => {
    if (!activeSlide) return;
    const elemIndex = activeSlide.elements.findIndex((e) => e.id === id);
    if (elemIndex === -1) return;

    const currentElem = activeSlide.elements[elemIndex];
    let newZ = currentElem.zIndex;

    if (direction === 'forward') {
      newZ += 1;
    } else {
      newZ = Math.max(1, newZ - 1);
    }

    handleUpdateElement(id, { zIndex: newZ });
  };

  // Slide Management
  const handleAddSlide = (layoutType: SlideLayoutType) => {
    const newSlide = generateSlideFromLayout('新幻灯片页面', layoutType, currentTheme);
    const activeIndex = slides.findIndex((s) => s.id === activeSlideId);
    const insertIndex = activeIndex === -1 ? slides.length : activeIndex + 1;

    const updated = [
      ...slides.slice(0, insertIndex),
      newSlide,
      ...slides.slice(insertIndex),
    ];

    setSlides(updated);
    setActiveSlideId(newSlide.id);
    setSelectedElementId(null);
    recordHistory(updated);
  };

  const handleDuplicateSlide = (slideId: string) => {
    const targetIndex = slides.findIndex((s) => s.id === slideId);
    if (targetIndex === -1) return;

    const original = slides[targetIndex];
    const newSlide: Slide = {
      ...original,
      id: `slide_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      title: `${original.title} (副本)`,
      elements: original.elements.map((e) => ({
        ...e,
        id: `${e.type}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      })) as SlideElement[],
    };

    const updated = [
      ...slides.slice(0, targetIndex + 1),
      newSlide,
      ...slides.slice(targetIndex + 1),
    ];

    setSlides(updated);
    setActiveSlideId(newSlide.id);
    recordHistory(updated);
  };

  const handleDeleteSlide = (slideId: string) => {
    if (slides.length <= 1) return;
    const targetIndex = slides.findIndex((s) => s.id === slideId);
    const updated = slides.filter((s) => s.id !== slideId);

    setSlides(updated);
    const nextActiveIndex = Math.min(targetIndex, updated.length - 1);
    setActiveSlideId(updated[nextActiveIndex].id);
    setSelectedElementId(null);
    recordHistory(updated);
  };

  const handleMoveSlide = (slideId: string, direction: 'up' | 'down') => {
    const index = slides.findIndex((s) => s.id === slideId);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === slides.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const updated = [...slides];
    const [removed] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, removed);

    setSlides(updated);
    recordHistory(updated);
  };

  // Apply new deck from AI Generation
  const handleApplyNewDeck = (newSlides: Slide[], title: string) => {
    setSlides(newSlides);
    if (title) setPresentationTitle(title);
    if (newSlides.length > 0) {
      setActiveSlideId(newSlides[0].id);
    }
    setSelectedElementId(null);
    recordHistory(newSlides);
  };

  const handleInsertSlide = (newSlide: Slide) => {
    const activeIndex = slides.findIndex((s) => s.id === activeSlideId);
    const insertIndex = activeIndex === -1 ? slides.length : activeIndex + 1;

    const updated = [
      ...slides.slice(0, insertIndex),
      newSlide,
      ...slides.slice(insertIndex),
    ];

    setSlides(updated);
    setActiveSlideId(newSlide.id);
    recordHistory(updated);
  };

  // Export handlers
  const handleExportPptx = async () => {
    try {
      await exportToPptx(slides, presentationTitle);
    } catch (err) {
      console.error('PPTX export error:', err);
    }
  };

  const handleExportOutlineText = () => {
    const markdown = `# ${presentationTitle}\n\n` +
      slides
        .map((s, idx) => {
          const texts = s.elements
            .filter((e) => e.type === 'text')
            .map((e: any) => e.content)
            .join('\n');
          return `## ${idx + 1}. ${s.title} [${s.layoutType}]\n${s.notes ? `> 备注: ${s.notes}\n` : ''}\n${texts}\n`;
        })
        .join('\n---\n\n');

    navigator.clipboard.writeText(markdown);
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#0a0e17] text-slate-100 font-sans">
      {/* Top Application Navbar */}
      <Navbar
        title={presentationTitle}
        onTitleChange={setPresentationTitle}
        currentTheme={currentTheme}
        onThemeChange={handleThemeChange}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onPlaySlideshow={() => setIsSlideshowOpen(true)}
        onExportPptx={handleExportPptx}
        onExportOutlineText={handleExportOutlineText}
        isAiDrawerOpen={isAiDrawerOpen}
        onToggleAiDrawer={() => setIsAiDrawerOpen(!isAiDrawerOpen)}
        isPropertyOpen={isPropertyOpen}
        onToggleProperty={() => setIsPropertyOpen(!isPropertyOpen)}
      />

      {/* Main Workspace Body */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left AI Conversational Drawer (一边对话一边生成) */}
        {isAiDrawerOpen && (
          <AiChatDrawer
            isOpen={isAiDrawerOpen}
            onClose={() => setIsAiDrawerOpen(false)}
            slides={slides}
            activeSlideId={activeSlideId}
            theme={currentTheme}
            onThemeChange={handleThemeChange}
            onApplyNewDeck={handleApplyNewDeck}
            onUpdateActiveSlide={handleUpdateActiveSlide}
            onInsertSlide={handleInsertSlide}
          />
        )}

        {/* Slide Thumbnail Sidebar */}
        <SlideThumbnailBar
          slides={slides}
          activeSlideId={activeSlideId}
          theme={currentTheme}
          onSelectSlide={(id) => {
            setActiveSlideId(id);
            setSelectedElementId(null);
          }}
          onAddSlide={handleAddSlide}
          onDuplicateSlide={handleDuplicateSlide}
          onDeleteSlide={handleDeleteSlide}
          onMoveSlide={handleMoveSlide}
          onOpenLayoutModal={() => setIsLayoutPickerOpen(true)}
        />

        {/* Center Interactive Canvas Editor (支持编辑任何文字、线条、图形) */}
        {activeSlide && (
          <CanvasEditor
            slide={activeSlide}
            theme={currentTheme}
            selectedElementId={selectedElementId}
            onSelectElement={setSelectedElementId}
            onUpdateElement={handleUpdateElement}
            onAddElement={handleAddElement}
            onDeleteElement={handleDeleteElement}
            onDuplicateElement={handleDuplicateElement}
            onReorderElement={handleReorderElement}
          />
        )}

        {/* Right Property Inspector Panel */}
        {isPropertyOpen && activeSlide && (
          <PropertyInspector
            slide={activeSlide}
            theme={currentTheme}
            selectedElementId={selectedElementId}
            onUpdateElement={handleUpdateElement}
            onUpdateSlide={handleUpdateSlideField}
            onDeleteElement={handleDeleteElement}
            onDuplicateElement={handleDuplicateElement}
            onReorderElement={handleReorderElement}
            onClose={() => setIsPropertyOpen(false)}
          />
        )}
      </div>

      {/* Layout Selection Modal */}
      <LayoutPickerModal
        isOpen={isLayoutPickerOpen}
        onClose={() => setIsLayoutPickerOpen(false)}
        onSelectLayout={(layout) => {
          handleAddSlide(layout);
          setIsLayoutPickerOpen(false);
        }}
      />

      {/* Fullscreen Slideshow Presentation Modal */}
      <PresentationModal
        isOpen={isSlideshowOpen}
        slides={slides}
        initialSlideIndex={slides.findIndex((s) => s.id === activeSlideId)}
        theme={currentTheme}
        onClose={() => setIsSlideshowOpen(false)}
      />
    </div>
  );
}
