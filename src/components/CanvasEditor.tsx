import React, { useState, useRef, useEffect } from 'react';
import {
  Type,
  Square,
  Circle,
  MoveRight,
  Minus,
  Sparkles,
  Trash2,
  Copy,
  Layers,
  Star,
  Tag,
  CreditCard,
  ZoomIn,
  ZoomOut,
  Maximize2,
  ArrowUp,
  ArrowDown,
  RotateCw,
  Magnet,
  Grid,
} from 'lucide-react';
import {
  Slide,
  SlideElement,
  PresentationTheme,
  ElementType,
  ShapeType,
  LineType,
} from '../types';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../utils/slideGenerator';

interface AlignmentGuide {
  id: string;
  type: 'vertical' | 'horizontal';
  position: number;
  label?: string;
  isCenter?: boolean;
}

interface CanvasEditorProps {
  slide: Slide;
  theme: PresentationTheme;
  selectedElementId: string | null;
  onSelectElement: (id: string | null) => void;
  onUpdateElement: (id: string, updates: Partial<SlideElement>) => void;
  onAddElement: (element: SlideElement) => void;
  onDeleteElement: (id: string) => void;
  onDuplicateElement: (id: string) => void;
  onReorderElement: (id: string, direction: 'forward' | 'backward') => void;
}

export const CanvasEditor: React.FC<CanvasEditorProps> = ({
  slide,
  theme,
  selectedElementId,
  onSelectElement,
  onUpdateElement,
  onAddElement,
  onDeleteElement,
  onDuplicateElement,
  onReorderElement,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [zoomFactor, setZoomFactor] = useState(1); // 1 = fit, 1.25 = 125%, etc.

  // Smart Guides & Grid Snapping state
  const [smartGuidesEnabled, setSmartGuidesEnabled] = useState(true);
  const [snapToGridEnabled, setSnapToGridEnabled] = useState(false);
  const [showGridOverlay, setShowGridOverlay] = useState(false);
  const [activeGuides, setActiveGuides] = useState<AlignmentGuide[]>([]);

  // Dragging & Resizing state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ mouseX: number; mouseY: number; elemX: number; elemY: number } | null>(null);

  const [resizingHandle, setResizingHandle] = useState<string | null>(null);
  const [resizeStart, setResizeStart] = useState<{
    mouseX: number;
    mouseY: number;
    elemX: number;
    elemY: number;
    elemW: number;
    elemH: number;
  } | null>(null);

  const [editingTextId, setEditingTextId] = useState<string | null>(null);

  // Quick Add Toolbars open dropdown state
  const [shapeMenuOpen, setShapeMenuOpen] = useState(false);
  const [lineMenuOpen, setLineMenuOpen] = useState(false);

  // Calculate fit scale based on container size
  useEffect(() => {
    const updateScale = () => {
      if (!containerRef.current) return;
      const { clientWidth, clientHeight } = containerRef.current;
      const padding = 48; // comfortable canvas margin
      const availableW = clientWidth - padding;
      const availableH = clientHeight - padding;

      const scaleX = availableW / CANVAS_WIDTH;
      const scaleY = availableH / CANVAS_HEIGHT;
      const fit = Math.min(scaleX, scaleY, 1.2);
      setScale(Math.max(0.3, fit) * zoomFactor);
    };

    updateScale();
    const ro = new ResizeObserver(updateScale);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [zoomFactor]);

  const selectedElement = slide.elements.find((e) => e.id === selectedElementId);

  // Keyboard shortcut listener (Delete, arrows)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in input or textarea or contenteditable
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        editingTextId !== null
      ) {
        return;
      }

      if (!selectedElementId) return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        onDeleteElement(selectedElementId);
      } else if (e.key === 'Escape') {
        onSelectElement(null);
      } else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 2;
        const elem = slide.elements.find((el) => el.id === selectedElementId);
        if (!elem) return;

        let newX = elem.x;
        let newY = elem.y;
        if (e.key === 'ArrowUp') newY -= step;
        if (e.key === 'ArrowDown') newY += step;
        if (e.key === 'ArrowLeft') newX -= step;
        if (e.key === 'ArrowRight') newX += step;

        onUpdateElement(selectedElementId, { x: newX, y: newY });
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        onDuplicateElement(selectedElementId);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElementId, editingTextId, slide.elements, onDeleteElement, onSelectElement, onUpdateElement, onDuplicateElement]);

  // Drag Element Handling
  const handleMouseDownElement = (e: React.MouseEvent, elem: SlideElement) => {
    if (elem.locked) return;
    e.stopPropagation();

    onSelectElement(elem.id);
    if (editingTextId && editingTextId !== elem.id) {
      setEditingTextId(null);
    }

    setIsDragging(true);
    setDragStart({
      mouseX: e.clientX,
      mouseY: e.clientY,
      elemX: elem.x,
      elemY: elem.y,
    });
  };

  // Resize Element Handling
  const handleMouseDownResize = (e: React.MouseEvent, handle: string) => {
    e.stopPropagation();
    if (!selectedElement) return;

    setResizingHandle(handle);
    setResizeStart({
      mouseX: e.clientX,
      mouseY: e.clientY,
      elemX: selectedElement.x,
      elemY: selectedElement.y,
      elemW: selectedElement.width,
      elemH: selectedElement.height,
    });
  };

  // Grid size constant
  const GRID_SIZE = 10;
  const SNAP_THRESHOLD = 6;

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && dragStart && selectedElementId) {
      const dx = (e.clientX - dragStart.mouseX) / scale;
      const dy = (e.clientY - dragStart.mouseY) / scale;

      let rawX = dragStart.elemX + dx;
      let rawY = dragStart.elemY + dy;

      const currentElem = slide.elements.find((el) => el.id === selectedElementId);
      if (!currentElem) return;

      const elemW = currentElem.width;
      const elemH = currentElem.height;

      // 1. Grid snapping (if enabled)
      if (snapToGridEnabled) {
        rawX = Math.round(rawX / GRID_SIZE) * GRID_SIZE;
        rawY = Math.round(rawY / GRID_SIZE) * GRID_SIZE;
      }

      let finalX = rawX;
      let finalY = rawY;
      const detectedGuides: AlignmentGuide[] = [];

      // 2. Smart Guides alignment & snapping (if enabled)
      if (smartGuidesEnabled) {
        const otherElems = slide.elements.filter((el) => el.id !== selectedElementId);

        // --- X Axis / Vertical Guides ---
        // Target vertical lines: Slide Center (480), Slide margins (0, 960)
        // and other elements: left, center, right
        interface SnapTargetX {
          pos: number;
          label: string;
          isCenter?: boolean;
        }

        const xTargets: SnapTargetX[] = [
          { pos: CANVAS_WIDTH / 2, label: '画布水平居中', isCenter: true },
          { pos: 40, label: '左安全边距' },
          { pos: CANVAS_WIDTH - 40, label: '右安全边距' },
        ];

        otherElems.forEach((other) => {
          xTargets.push({ pos: other.x, label: '左对齐' });
          xTargets.push({ pos: other.x + other.width / 2, label: '中心对齐', isCenter: true });
          xTargets.push({ pos: other.x + other.width, label: '右对齐' });
        });

        // Test current element points: left (rawX), center (rawX + elemW / 2), right (rawX + elemW)
        let bestDiffX = SNAP_THRESHOLD + 1;
        let snapAdjustmentX = 0;
        let matchedGuideX: AlignmentGuide | null = null;

        for (const target of xTargets) {
          // 1. Dragged element Left edge snaps to target
          const diffLeft = Math.abs(rawX - target.pos);
          if (diffLeft < SNAP_THRESHOLD && diffLeft < bestDiffX) {
            bestDiffX = diffLeft;
            snapAdjustmentX = target.pos - rawX;
            matchedGuideX = {
              id: `v_${target.pos}_l`,
              type: 'vertical',
              position: target.pos,
              label: target.label,
              isCenter: target.isCenter,
            };
          }

          // 2. Dragged element Center snaps to target
          const currentCenterX = rawX + elemW / 2;
          const diffCenter = Math.abs(currentCenterX - target.pos);
          if (diffCenter < SNAP_THRESHOLD && diffCenter < bestDiffX) {
            bestDiffX = diffCenter;
            snapAdjustmentX = target.pos - currentCenterX;
            matchedGuideX = {
              id: `v_${target.pos}_c`,
              type: 'vertical',
              position: target.pos,
              label: target.label,
              isCenter: target.isCenter,
            };
          }

          // 3. Dragged element Right edge snaps to target
          const currentRightX = rawX + elemW;
          const diffRight = Math.abs(currentRightX - target.pos);
          if (diffRight < SNAP_THRESHOLD && diffRight < bestDiffX) {
            bestDiffX = diffRight;
            snapAdjustmentX = target.pos - currentRightX;
            matchedGuideX = {
              id: `v_${target.pos}_r`,
              type: 'vertical',
              position: target.pos,
              label: target.label,
              isCenter: target.isCenter,
            };
          }
        }

        if (matchedGuideX) {
          finalX = rawX + snapAdjustmentX;
          detectedGuides.push(matchedGuideX);
        }

        // --- Y Axis / Horizontal Guides ---
        interface SnapTargetY {
          pos: number;
          label: string;
          isCenter?: boolean;
        }

        const yTargets: SnapTargetY[] = [
          { pos: CANVAS_HEIGHT / 2, label: '画布垂直居中', isCenter: true },
          { pos: 40, label: '顶部安全边距' },
          { pos: CANVAS_HEIGHT - 40, label: '底部安全边距' },
        ];

        otherElems.forEach((other) => {
          yTargets.push({ pos: other.y, label: '顶部对齐' });
          yTargets.push({ pos: other.y + other.height / 2, label: '中心对齐', isCenter: true });
          yTargets.push({ pos: other.y + other.height, label: '底部对齐' });
        });

        let bestDiffY = SNAP_THRESHOLD + 1;
        let snapAdjustmentY = 0;
        let matchedGuideY: AlignmentGuide | null = null;

        for (const target of yTargets) {
          // 1. Dragged element Top edge snaps to target
          const diffTop = Math.abs(rawY - target.pos);
          if (diffTop < SNAP_THRESHOLD && diffTop < bestDiffY) {
            bestDiffY = diffTop;
            snapAdjustmentY = target.pos - rawY;
            matchedGuideY = {
              id: `h_${target.pos}_t`,
              type: 'horizontal',
              position: target.pos,
              label: target.label,
              isCenter: target.isCenter,
            };
          }

          // 2. Dragged element Center snaps to target
          const currentCenterY = rawY + elemH / 2;
          const diffCenter = Math.abs(currentCenterY - target.pos);
          if (diffCenter < SNAP_THRESHOLD && diffCenter < bestDiffY) {
            bestDiffY = diffCenter;
            snapAdjustmentY = target.pos - currentCenterY;
            matchedGuideY = {
              id: `h_${target.pos}_c`,
              type: 'horizontal',
              position: target.pos,
              label: target.label,
              isCenter: target.isCenter,
            };
          }

          // 3. Dragged element Bottom edge snaps to target
          const currentBottomY = rawY + elemH;
          const diffBottom = Math.abs(currentBottomY - target.pos);
          if (diffBottom < SNAP_THRESHOLD && diffBottom < bestDiffY) {
            bestDiffY = diffBottom;
            snapAdjustmentY = target.pos - currentBottomY;
            matchedGuideY = {
              id: `h_${target.pos}_b`,
              type: 'horizontal',
              position: target.pos,
              label: target.label,
              isCenter: target.isCenter,
            };
          }
        }

        if (matchedGuideY) {
          finalY = rawY + snapAdjustmentY;
          detectedGuides.push(matchedGuideY);
        }
      }

      setActiveGuides(detectedGuides);
      onUpdateElement(selectedElementId, { x: Math.round(finalX), y: Math.round(finalY) });
    } else if (resizingHandle && resizeStart && selectedElementId) {
      const dx = (e.clientX - resizeStart.mouseX) / scale;
      const dy = (e.clientY - resizeStart.mouseY) / scale;

      let newX = resizeStart.elemX;
      let newY = resizeStart.elemY;
      let newW = resizeStart.elemW;
      let newH = resizeStart.elemH;

      if (resizingHandle.includes('e')) newW = Math.max(20, resizeStart.elemW + dx);
      if (resizingHandle.includes('s')) newH = Math.max(15, resizeStart.elemH + dy);
      if (resizingHandle.includes('w')) {
        const potentialW = resizeStart.elemW - dx;
        if (potentialW > 20) {
          newW = potentialW;
          newX = resizeStart.elemX + dx;
        }
      }
      if (resizingHandle.includes('n')) {
        const potentialH = resizeStart.elemH - dy;
        if (potentialH > 15) {
          newH = potentialH;
          newY = resizeStart.elemY + dy;
        }
      }

      if (snapToGridEnabled) {
        newX = Math.round(newX / GRID_SIZE) * GRID_SIZE;
        newY = Math.round(newY / GRID_SIZE) * GRID_SIZE;
        newW = Math.round(newW / GRID_SIZE) * GRID_SIZE;
        newH = Math.round(newH / GRID_SIZE) * GRID_SIZE;
      }

      onUpdateElement(selectedElementId, {
        x: Math.round(newX),
        y: Math.round(newY),
        width: Math.round(newW),
        height: Math.round(newH),
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragStart(null);
    setResizingHandle(null);
    setResizeStart(null);
    setActiveGuides([]);
  };

  // Quick Element Creation Handlers
  const handleAddText = (type: 'title' | 'sub' | 'body') => {
    const id = `text_${Date.now()}`;
    const maxZ = Math.max(...slide.elements.map((e) => e.zIndex), 0) + 1;

    let content = '输入文本内容';
    let fontSize = 16;
    let fontWeight: any = 'normal';
    let color = theme.textPrimary;
    let height = 40;

    if (type === 'title') {
      content = '新模块标题';
      fontSize = 32;
      fontWeight = 'bold';
      height = 50;
    } else if (type === 'sub') {
      content = '简要说明或辅助信息';
      fontSize = 18;
      fontWeight = 'medium';
      color = theme.textSecondary;
      height = 36;
    }

    onAddElement({
      id,
      type: 'text',
      content,
      fontSize,
      fontWeight,
      color,
      textAlign: 'left',
      x: 100,
      y: 180,
      width: 400,
      height,
      zIndex: maxZ,
    });
    onSelectElement(id);
  };

  const handleAddShape = (shapeType: ShapeType) => {
    const id = `shape_${Date.now()}`;
    const maxZ = Math.max(...slide.elements.map((e) => e.zIndex), 0) + 1;
    setShapeMenuOpen(false);

    onAddElement({
      id,
      type: 'shape',
      shapeType,
      fill: shapeType === 'card' ? theme.cardBg : theme.accent,
      stroke: theme.border,
      strokeWidth: 1,
      borderRadius: shapeType === 'circle' ? 999 : shapeType === 'pill' ? 999 : 12,
      x: 200,
      y: 200,
      width: shapeType === 'pill' ? 180 : 160,
      height: shapeType === 'pill' ? 44 : 140,
      zIndex: maxZ,
      label: shapeType === 'pill' ? '核心标签' : undefined,
      labelColor: '#ffffff',
    });
    onSelectElement(id);
  };

  const handleAddLine = (lineType: LineType) => {
    const id = `line_${Date.now()}`;
    const maxZ = Math.max(...slide.elements.map((e) => e.zIndex), 0) + 1;
    setLineMenuOpen(false);

    onAddElement({
      id,
      type: 'line',
      lineType,
      stroke: theme.accent,
      strokeWidth: 3,
      strokeStyle: lineType === 'dashed' ? 'dashed' : 'solid',
      endArrow: lineType === 'arrow',
      x: 150,
      y: 260,
      width: 300,
      height: 10,
      zIndex: maxZ,
    });
    onSelectElement(id);
  };

  const handleAddBadge = () => {
    const id = `badge_${Date.now()}`;
    const maxZ = Math.max(...slide.elements.map((e) => e.zIndex), 0) + 1;

    onAddElement({
      id,
      type: 'badge',
      text: '亮点聚焦',
      bg: theme.badgeBg,
      color: theme.badgeText,
      x: 100,
      y: 120,
      width: 120,
      height: 28,
      zIndex: maxZ,
    });
    onSelectElement(id);
  };

  const handleAddCard = () => {
    const id = `card_${Date.now()}`;
    const maxZ = Math.max(...slide.elements.map((e) => e.zIndex), 0) + 1;

    onAddElement({
      id,
      type: 'card',
      title: '核心策略卡片',
      subtitle: 'STRATEGY MODULE',
      body: '在此描述关键业务落地方案或竞争壁垒要素。',
      bg: theme.cardBg,
      textColor: theme.textPrimary,
      accentColor: theme.accent,
      tag: '01',
      borderRadius: 14,
      x: 240,
      y: 180,
      width: 260,
      height: 240,
      zIndex: maxZ,
    });
    onSelectElement(id);
  };

  return (
    <div
      ref={containerRef}
      className="flex-1 bg-[#090d16] relative flex flex-col items-center justify-center overflow-hidden select-none"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onClick={() => {
        onSelectElement(null);
        setEditingTextId(null);
        setShapeMenuOpen(false);
        setLineMenuOpen(false);
      }}
    >
      {/* Top Floating Quick Insertion Bar */}
      <div
        className="absolute top-4 z-40 bg-[#151c2c]/90 backdrop-blur-md border border-slate-700/80 rounded-xl px-2.5 py-1.5 flex items-center gap-1 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-[11px] font-semibold text-slate-400 px-1.5 mr-1 flex items-center gap-1 border-r border-slate-700">
          <Layers className="w-3.5 h-3.5 text-blue-400" />
          <span>插入图层</span>
        </span>

        {/* Add Text Buttons */}
        <button
          onClick={() => handleAddText('title')}
          className="px-2 py-1 rounded-lg hover:bg-slate-700/80 text-xs font-medium text-slate-200 flex items-center gap-1 transition"
          title="插入大标题文本框"
        >
          <Type className="w-3.5 h-3.5 text-blue-400" />
          <span>大标题</span>
        </button>

        <button
          onClick={() => handleAddText('body')}
          className="px-2 py-1 rounded-lg hover:bg-slate-700/80 text-xs font-medium text-slate-200 flex items-center gap-1 transition"
          title="插入正文段落"
        >
          <Type className="w-3.5 h-3.5 text-slate-400" />
          <span>正文</span>
        </button>

        {/* Add Shape Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShapeMenuOpen(!shapeMenuOpen);
              setLineMenuOpen(false);
            }}
            className="px-2 py-1 rounded-lg hover:bg-slate-700/80 text-xs font-medium text-slate-200 flex items-center gap-1 transition"
          >
            <Square className="w-3.5 h-3.5 text-amber-400" />
            <span>形状</span>
          </button>

          {shapeMenuOpen && (
            <div className="absolute top-full mt-2 left-0 w-44 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-1 z-50 text-xs">
              <button
                onClick={() => handleAddShape('rect')}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-slate-800 text-slate-300"
              >
                <Square className="w-3.5 h-3.5 text-blue-400" />
                <span>矩形 (Rectangle)</span>
              </button>
              <button
                onClick={() => handleAddShape('rounded-rect')}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-slate-800 text-slate-300"
              >
                <Square className="w-3.5 h-3.5 rounded-sm text-indigo-400" />
                <span>圆角卡片 (Card)</span>
              </button>
              <button
                onClick={() => handleAddShape('circle')}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-slate-800 text-slate-300"
              >
                <Circle className="w-3.5 h-3.5 text-emerald-400" />
                <span>圆形 (Circle)</span>
              </button>
              <button
                onClick={() => handleAddShape('pill')}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-slate-800 text-slate-300"
              >
                <Tag className="w-3.5 h-3.5 text-purple-400" />
                <span>胶囊标签 (Pill)</span>
              </button>
              <button
                onClick={() => handleAddShape('star')}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-slate-800 text-slate-300"
              >
                <Star className="w-3.5 h-3.5 text-amber-400" />
                <span>五角星 (Star)</span>
              </button>
            </div>
          )}
        </div>

        {/* Add Line / Arrow Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setLineMenuOpen(!lineMenuOpen);
              setShapeMenuOpen(false);
            }}
            className="px-2 py-1 rounded-lg hover:bg-slate-700/80 text-xs font-medium text-slate-200 flex items-center gap-1 transition"
          >
            <MoveRight className="w-3.5 h-3.5 text-cyan-400" />
            <span>线条与箭头</span>
          </button>

          {lineMenuOpen && (
            <div className="absolute top-full mt-2 left-0 w-44 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-1 z-50 text-xs">
              <button
                onClick={() => handleAddLine('arrow')}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-slate-800 text-slate-300"
              >
                <MoveRight className="w-3.5 h-3.5 text-cyan-400" />
                <span>指示箭头 (Arrow)</span>
              </button>
              <button
                onClick={() => handleAddLine('horizontal')}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-slate-800 text-slate-300"
              >
                <Minus className="w-3.5 h-3.5 text-slate-400" />
                <span>水平实线 (Solid)</span>
              </button>
              <button
                onClick={() => handleAddLine('dashed')}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-slate-800 text-slate-300"
              >
                <Minus className="w-3.5 h-3.5 text-amber-400 stroke-dasharray" />
                <span>虚线连接线 (Dashed)</span>
              </button>
            </div>
          )}
        </div>

        <button
          onClick={handleAddCard}
          className="px-2 py-1 rounded-lg hover:bg-slate-700/80 text-xs font-medium text-slate-200 flex items-center gap-1 transition"
          title="插入格式化策略卡片"
        >
          <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
          <span>卡片</span>
        </button>

        <button
          onClick={handleAddBadge}
          className="px-2 py-1 rounded-lg hover:bg-slate-700/80 text-xs font-medium text-slate-200 flex items-center gap-1 transition"
          title="插入徽章高亮标签"
        >
          <Tag className="w-3.5 h-3.5 text-pink-400" />
          <span>徽章</span>
        </button>
      </div>

      {/* Slide Canvas Stage Wrapper */}
      <div
        className="relative shadow-2xl transition-transform ease-out duration-75"
        style={{
          width: `${CANVAS_WIDTH}px`,
          height: `${CANVAS_HEIGHT}px`,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.08)',
        }}
        onClick={(e) => {
          e.stopPropagation();
          onSelectElement(null);
          setEditingTextId(null);
        }}
      >
        {/* Grid Overlay Layer when enabled */}
        {showGridOverlay && (
          <div
            className="absolute inset-0 pointer-events-none z-20 opacity-30"
            style={{
              backgroundImage:
                'linear-gradient(to right, rgba(56, 189, 248, 0.2) 1px, transparent 1px), linear-gradient(to bottom, rgba(56, 189, 248, 0.2) 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }}
          />
        )}

        {/* Alignment Guides (Smart Guides) */}
        {activeGuides.map((guide) => {
          if (guide.type === 'vertical') {
            return (
              <div
                key={guide.id}
                className="absolute top-0 bottom-0 pointer-events-none z-50 flex flex-col items-center"
                style={{
                  left: `${guide.position}px`,
                  width: '1px',
                  backgroundColor: guide.isCenter ? '#f43f5e' : '#38bdf8',
                  boxShadow: guide.isCenter
                    ? '0 0 6px rgba(244, 63, 94, 0.9)'
                    : '0 0 6px rgba(56, 189, 248, 0.9)',
                }}
              >
                {guide.label && (
                  <div
                    className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold tracking-tight text-white shadow-lg select-none mt-2 whitespace-nowrap"
                    style={{
                      backgroundColor: guide.isCenter ? '#e11d48' : '#0284c7',
                    }}
                  >
                    {guide.label} {Math.round(guide.position)}px
                  </div>
                )}
              </div>
            );
          } else {
            return (
              <div
                key={guide.id}
                className="absolute left-0 right-0 pointer-events-none z-50 flex items-center justify-start"
                style={{
                  top: `${guide.position}px`,
                  height: '1px',
                  backgroundColor: guide.isCenter ? '#f43f5e' : '#38bdf8',
                  boxShadow: guide.isCenter
                    ? '0 0 6px rgba(244, 63, 94, 0.9)'
                    : '0 0 6px rgba(56, 189, 248, 0.9)',
                }}
              >
                {guide.label && (
                  <div
                    className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold tracking-tight text-white shadow-lg select-none ml-3 whitespace-nowrap"
                    style={{
                      backgroundColor: guide.isCenter ? '#e11d48' : '#0284c7',
                    }}
                  >
                    {guide.label} {Math.round(guide.position)}px
                  </div>
                )}
              </div>
            );
          }
        })}

        {/* Canvas Background Layer */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{
            backgroundColor: slide.background?.value || theme.canvasBg,
          }}
        >
          {/* Subtle grid pattern for visual design guide */}
          <div
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{
              backgroundImage:
                'radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)',
              backgroundSize: '24px 24px',
            }}
          />

          {/* Render Slide Elements sorted by z-index */}
          {[...slide.elements]
            .sort((a, b) => a.zIndex - b.zIndex)
            .map((elem) => {
              const isSelected = elem.id === selectedElementId;
              const isEditing = elem.id === editingTextId;

              return (
                <div
                  key={elem.id}
                  id={`canvas_elem_${elem.id}`}
                  style={{
                    position: 'absolute',
                    left: `${elem.x}px`,
                    top: `${elem.y}px`,
                    width: `${elem.width}px`,
                    height: `${elem.height}px`,
                    zIndex: elem.zIndex,
                    opacity: elem.opacity ?? 1,
                    cursor: elem.locked ? 'default' : 'move',
                  }}
                  onMouseDown={(e) => handleMouseDownElement(e, elem)}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    if (elem.type === 'text') {
                      setEditingTextId(elem.id);
                    }
                  }}
                  className={`group transition-shadow ${
                    isSelected
                      ? 'ring-2 ring-blue-500 shadow-md ring-offset-1 ring-offset-transparent'
                      : 'hover:ring-1 hover:ring-blue-400/50'
                  }`}
                >
                  {/* Floating Action Menu for Selected Element */}
                  {isSelected && (
                    <div
                      className="absolute -top-10 left-0 bg-slate-900/95 border border-slate-700/80 rounded-lg px-1 py-1 flex items-center gap-1 shadow-xl z-50 pointer-events-auto"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => onDuplicateElement(elem.id)}
                        className="p-1 rounded text-slate-300 hover:text-white hover:bg-slate-800"
                        title="复制图层 (Ctrl+D)"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onReorderElement(elem.id, 'forward')}
                        className="p-1 rounded text-slate-300 hover:text-white hover:bg-slate-800"
                        title="上移一层"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onReorderElement(elem.id, 'backward')}
                        className="p-1 rounded text-slate-300 hover:text-white hover:bg-slate-800"
                        title="下移一层"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <div className="h-3.5 w-px bg-slate-700" />
                      <button
                        onClick={() => onDeleteElement(elem.id)}
                        className="p-1 rounded text-rose-400 hover:text-rose-300 hover:bg-rose-950/40"
                        title="删除图层 (Delete)"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* ELEMENT TYPE: TEXT */}
                  {elem.type === 'text' && (
                    <div className="w-full h-full p-1 overflow-hidden select-text">
                      {isEditing ? (
                        <textarea
                          value={elem.content}
                          onChange={(e) =>
                            onUpdateElement(elem.id, { content: e.target.value })
                          }
                          onBlur={() => setEditingTextId(null)}
                          autoFocus
                          className="w-full h-full bg-slate-950/80 border border-blue-500 rounded p-1 outline-none resize-none font-sans text-white"
                          style={{
                            fontSize: `${elem.fontSize}px`,
                            fontWeight: elem.fontWeight || 'normal',
                            color: elem.color,
                            textAlign: elem.textAlign || 'left',
                            lineHeight: elem.lineHeight || 1.3,
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            fontSize: `${elem.fontSize}px`,
                            fontWeight: elem.fontWeight || 'normal',
                            color: elem.color,
                            textAlign: elem.textAlign || 'left',
                            lineHeight: elem.lineHeight || 1.3,
                            whiteSpace: 'pre-wrap',
                          }}
                          className="w-full h-full leading-snug tracking-tight"
                        >
                          {elem.content}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ELEMENT TYPE: SHAPE */}
                  {elem.type === 'shape' && (
                    <div
                      className="w-full h-full flex items-center justify-center overflow-hidden transition-all"
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
                          className="font-bold text-center px-2 pointer-events-none"
                          style={{ color: elem.labelColor || '#ffffff', fontSize: '14px' }}
                        >
                          {elem.label}
                        </span>
                      )}
                    </div>
                  )}

                  {/* ELEMENT TYPE: LINE */}
                  {elem.type === 'line' && (
                    <div className="w-full h-full flex items-center relative">
                      <svg className="w-full h-full overflow-visible">
                        <defs>
                          <marker
                            id={`arrow_${elem.id}`}
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
                          markerEnd={elem.endArrow ? `url(#arrow_${elem.id})` : undefined}
                        />
                      </svg>
                    </div>
                  )}

                  {/* ELEMENT TYPE: BADGE */}
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

                  {/* ELEMENT TYPE: CARD */}
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

                  {/* RESIZE HANDLES (When Selected) */}
                  {isSelected && (
                    <>
                      <div
                        className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-blue-600 rounded-sm cursor-nwse-resize z-30"
                        onMouseDown={(e) => handleMouseDownResize(e, 'nw')}
                      />
                      <div
                        className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-blue-600 rounded-sm cursor-nesw-resize z-30"
                        onMouseDown={(e) => handleMouseDownResize(e, 'ne')}
                      />
                      <div
                        className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-blue-600 rounded-sm cursor-nesw-resize z-30"
                        onMouseDown={(e) => handleMouseDownResize(e, 'sw')}
                      />
                      <div
                        className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-blue-600 rounded-sm cursor-nwse-resize z-30"
                        onMouseDown={(e) => handleMouseDownResize(e, 'se')}
                      />
                      <div
                        className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-2 h-4 bg-white border border-blue-600 rounded-sm cursor-ew-resize z-30"
                        onMouseDown={(e) => handleMouseDownResize(e, 'e')}
                      />
                      <div
                        className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-4 h-2 bg-white border border-blue-600 rounded-sm cursor-ns-resize z-30"
                        onMouseDown={(e) => handleMouseDownResize(e, 's')}
                      />
                    </>
                  )}
                </div>
              );
            })}
        </div>
      </div>

      {/* Bottom Floating Toolbar: Guides, Grid & Zoom */}
      <div
        className="absolute bottom-4 right-4 z-40 bg-[#151c2c]/90 backdrop-blur-md border border-slate-700/80 rounded-xl px-2.5 py-1.5 flex items-center gap-2 text-xs text-slate-300 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Smart Guides Toggle */}
        <button
          onClick={() => setSmartGuidesEnabled((v) => !v)}
          className={`px-2 py-1 rounded-lg flex items-center gap-1.5 transition text-[11px] font-medium ${
            smartGuidesEnabled
              ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
          title="智能对齐参考线 (拖拽图层时显示中心对齐线与图层间对齐线)"
        >
          <Magnet className="w-3.5 h-3.5 text-blue-400" />
          <span>智能对齐</span>
        </button>

        {/* Snap to Grid Toggle */}
        <button
          onClick={() => setSnapToGridEnabled((v) => !v)}
          className={`px-2 py-1 rounded-lg flex items-center gap-1.5 transition text-[11px] font-medium ${
            snapToGridEnabled
              ? 'bg-amber-600/30 text-amber-300 border border-amber-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
          title="网格吸附 (按 10px 网格对齐)"
        >
          <Grid className="w-3.5 h-3.5 text-amber-400" />
          <span>网格吸附</span>
        </button>

        {/* Show Grid Overlay Toggle */}
        <button
          onClick={() => setShowGridOverlay((v) => !v)}
          className={`px-1.5 py-1 rounded-lg transition text-[11px] ${
            showGridOverlay
              ? 'bg-slate-700 text-sky-300 font-medium'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
          title="显示/隐藏画布网格"
        >
          <span className="font-mono text-[10px]"># 网格</span>
        </button>

        <div className="h-4 w-px bg-slate-700 mx-0.5" />

        {/* Zoom Controls */}
        <button
          onClick={() => setZoomFactor((z) => Math.max(0.5, z - 0.15))}
          className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
          title="缩小"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <span className="font-mono text-[11px] min-w-[36px] text-center">
          {Math.round(scale * 100)}%
        </span>
        <button
          onClick={() => setZoomFactor((z) => Math.min(2.0, z + 0.15))}
          className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
          title="放大"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => setZoomFactor(1)}
          className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
          title="适应窗口"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
