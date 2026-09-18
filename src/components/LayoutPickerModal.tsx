import React from 'react';
import {
  X,
  CreditCard,
  ListOrdered,
  BarChart3,
  Columns3,
  LayoutGrid,
  SplitSquareVertical,
  Milestone,
  ArrowRightLeft,
  Quote,
  CheckCircle2,
  Square,
} from 'lucide-react';
import { SlideLayoutType } from '../types';

interface LayoutPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLayout: (layoutType: SlideLayoutType) => void;
}

const LAYOUT_OPTIONS: Array<{
  id: SlideLayoutType;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    id: 'cover',
    title: '封面排版 (Cover)',
    description: '大气主标题、副标题、标签与汇报人信息',
    icon: CreditCard,
  },
  {
    id: 'catalog',
    title: '目录脉络 (Catalog)',
    description: '4大模块章节编号与阶段主题导读',
    icon: ListOrdered,
  },
  {
    id: 'stats',
    title: '数字指标飞轮 (Stats)',
    description: '3组高对比度大数字核心成效量化卡片',
    icon: BarChart3,
  },
  {
    id: 'cards-3',
    title: '三列卡片矩阵 (3-Cards)',
    description: '横向三等分结构化论据卡片',
    icon: Columns3,
  },
  {
    id: 'cards-4',
    title: '四象限/四列卡片 (4-Cards)',
    description: '四维度要素拆解与要点陈列',
    icon: LayoutGrid,
  },
  {
    id: 'split',
    title: '左右图文图层 (Split)',
    description: '左侧深度论证要点，右侧提炼核心结论',
    icon: SplitSquareVertical,
  },
  {
    id: 'process',
    title: '流程步骤图 (Process)',
    description: '带指示箭头的阶段性推进实施节点',
    icon: Milestone,
  },
  {
    id: 'timeline',
    title: '时间轴里程碑 (Timeline)',
    description: '横向时间线与各阶段目标成果',
    icon: Milestone,
  },
  {
    id: 'comparison',
    title: '方案/优劣对比 (Comparison)',
    description: '传统现状痛点 vs 新一代创新方案横评',
    icon: ArrowRightLeft,
  },
  {
    id: 'quote',
    title: '金句与核心观点 (Quote)',
    description: '突出行业名言或战略愿景核心主张',
    icon: Quote,
  },
  {
    id: 'summary',
    title: '总结与行动计划 (Summary)',
    description: '核心共识总结 + 下一步落地执行路线',
    icon: CheckCircle2,
  },
  {
    id: 'blank',
    title: '空白画布 (Blank)',
    description: '从零自由拖拽添加任意文本、形状与线条',
    icon: Square,
  },
];

export const LayoutPickerModal: React.FC<LayoutPickerModalProps> = ({
  isOpen,
  onClose,
  onSelectLayout,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#131a29] border border-slate-700/80 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white">选择幻灯片版式</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              内置专业麦肯锡视觉规范，自动根据当前主题配色生成精美排版
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Grid of Layouts */}
        <div className="p-6 max-h-[70vh] overflow-y-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {LAYOUT_OPTIONS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectLayout(item.id);
                  onClose();
                }}
                className="group flex flex-col text-left p-4 rounded-xl border border-slate-800 bg-slate-900/60 hover:border-blue-500 hover:bg-blue-950/20 hover:shadow-lg hover:shadow-blue-500/5 transition"
              >
                <div className="w-9 h-9 rounded-lg bg-slate-800 group-hover:bg-blue-600/20 group-hover:text-blue-400 flex items-center justify-center text-slate-300 transition mb-3">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="font-semibold text-sm text-slate-100 group-hover:text-blue-300 transition mb-1">
                  {item.title}
                </div>
                <div className="text-xs text-slate-400 leading-relaxed">
                  {item.description}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
