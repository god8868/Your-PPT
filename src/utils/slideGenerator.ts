import { Slide, SlideElement, SlideLayoutType, PresentationTheme } from '../types';
import { PRESENTATION_THEMES, DEFAULT_THEME_ID } from './themes';

export const CANVAS_WIDTH = 960;
export const CANVAS_HEIGHT = 540;

function createId(prefix = 'elem'): string {
  return `${prefix}_${Math.random().toString(36).substr(2, 9)}`;
}

export function generateSlideFromLayout(
  title: string,
  layoutType: SlideLayoutType,
  theme: PresentationTheme = PRESENTATION_THEMES[DEFAULT_THEME_ID],
  options?: {
    subtitle?: string;
    keyPoints?: string[];
    summary?: string;
    metrics?: Array<{ label: string; value: string; change?: string }>;
  }
): Slide {
  const slideId = `slide_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  const elements: SlideElement[] = [];

  const baseTitle = title || '演示文稿标题';
  const points = options?.keyPoints && options.keyPoints.length > 0 
    ? options.keyPoints 
    : ['核心观点解析与背景洞察', '关键驱动因素与技术突破', '落地实施方案与预期效益'];

  // Background subtle decorative accent shape
  elements.push({
    id: createId('bg_glow'),
    type: 'shape',
    shapeType: 'circle',
    x: CANVAS_WIDTH - 240,
    y: -80,
    width: 320,
    height: 320,
    fill: theme.accent,
    opacity: 0.06,
    zIndex: 1,
    locked: true,
  });

  switch (layoutType) {
    case 'cover': {
      // Badge top
      elements.push({
        id: createId('badge'),
        type: 'badge',
        text: 'AI 赋能 · 商业规划',
        bg: theme.badgeBg,
        color: theme.badgeText,
        x: 80,
        y: 110,
        width: 140,
        height: 32,
        zIndex: 2,
      });

      // Main Title
      elements.push({
        id: createId('title'),
        type: 'text',
        content: baseTitle,
        fontSize: 44,
        fontWeight: 'bold',
        color: theme.textPrimary,
        textAlign: 'left',
        lineHeight: 1.25,
        x: 80,
        y: 160,
        width: 800,
        height: 120,
        zIndex: 3,
      });

      // Subtitle
      elements.push({
        id: createId('sub'),
        type: 'text',
        content: options?.subtitle || options?.summary || '深度洞悉行业趋势，构建高韧性全链路创新解决方案',
        fontSize: 18,
        fontWeight: 'normal',
        color: theme.textSecondary,
        textAlign: 'left',
        lineHeight: 1.6,
        x: 80,
        y: 290,
        width: 740,
        height: 60,
        zIndex: 3,
      });

      // Accent dividing line
      elements.push({
        id: createId('line'),
        type: 'line',
        lineType: 'horizontal',
        stroke: theme.accent,
        strokeWidth: 3,
        strokeStyle: 'solid',
        x: 80,
        y: 370,
        width: 200,
        height: 10,
        zIndex: 3,
      });

      // Presenter meta text
      elements.push({
        id: createId('meta'),
        type: 'text',
        content: '演讲汇报：战略创新团队  |  时间：2026年度 Q3 战略研讨会',
        fontSize: 14,
        fontWeight: 'medium',
        color: theme.textSecondary,
        textAlign: 'left',
        x: 80,
        y: 410,
        width: 600,
        height: 30,
        zIndex: 3,
      });
      break;
    }

    case 'catalog': {
      // Header
      addSlideHeader(elements, theme, baseTitle, '目录与核心章节概览');

      const items = points.slice(0, 4);
      const cardWidth = 195;
      const startX = 60;
      const spacing = 20;

      items.forEach((pt, idx) => {
        const x = startX + idx * (cardWidth + spacing);
        // Chapter number
        elements.push({
          id: createId('cat_card'),
          type: 'card',
          title: `0${idx + 1}`,
          subtitle: `SECTION 0${idx + 1}`,
          body: pt,
          bg: theme.cardBg,
          textColor: theme.textPrimary,
          accentColor: theme.accent,
          tag: `章节 0${idx + 1}`,
          borderRadius: 12,
          x: x,
          y: 180,
          width: cardWidth,
          height: 250,
          zIndex: 3,
        });
      });
      break;
    }

    case 'stats': {
      addSlideHeader(elements, theme, baseTitle, options?.summary || '核心指标与业务增长量化分析');

      const defaultMetrics = [
        { label: '全年营收总规模', value: '¥2.48B', change: '+48.6% 同比' },
        { label: '企业级客户续约率', value: '98.5%', change: '+3.2% 提升' },
        { label: 'AI 自动化交付效能', value: '4.2x', change: '节省 65% 工时' },
      ];
      const metrics = options?.metrics || defaultMetrics;

      const cardWidth = 260;
      const startX = 60;
      const spacing = 30;

      metrics.slice(0, 3).forEach((m, idx) => {
        const x = startX + idx * (cardWidth + spacing);

        elements.push({
          id: createId('metric_card'),
          type: 'shape',
          shapeType: 'rounded-rect',
          fill: theme.cardBg,
          stroke: theme.border,
          strokeWidth: 1,
          borderRadius: 14,
          x: x,
          y: 170,
          width: cardWidth,
          height: 260,
          zIndex: 2,
        });

        // Icon or tag
        elements.push({
          id: createId('stat_badge'),
          type: 'badge',
          text: m.change || '持续增长',
          bg: theme.badgeBg,
          color: theme.badgeText,
          x: x + 24,
          y: 195,
          width: 120,
          height: 28,
          zIndex: 3,
        });

        // Big Value
        elements.push({
          id: createId('stat_val'),
          type: 'text',
          content: m.value,
          fontSize: 46,
          fontWeight: 'extrabold',
          color: theme.accent,
          textAlign: 'left',
          x: x + 24,
          y: 245,
          width: cardWidth - 48,
          height: 60,
          zIndex: 3,
        });

        // Metric label
        elements.push({
          id: createId('stat_label'),
          type: 'text',
          content: m.label,
          fontSize: 16,
          fontWeight: 'semibold',
          color: theme.textPrimary,
          textAlign: 'left',
          x: x + 24,
          y: 320,
          width: cardWidth - 48,
          height: 30,
          zIndex: 3,
        });

        // Sub description
        elements.push({
          id: createId('stat_sub'),
          type: 'text',
          content: points[idx] || '基于大数据全域回溯分析，表现优于行业基准水平。',
          fontSize: 13,
          fontWeight: 'normal',
          color: theme.textSecondary,
          textAlign: 'left',
          lineHeight: 1.5,
          x: x + 24,
          y: 355,
          width: cardWidth - 48,
          height: 60,
          zIndex: 3,
        });
      });
      break;
    }

    case 'cards-3': {
      addSlideHeader(elements, theme, baseTitle, options?.summary || '核心策略与实施模块');

      const cardWidth = 260;
      const startX = 60;
      const spacing = 30;

      points.slice(0, 3).forEach((pt, idx) => {
        const x = startX + idx * (cardWidth + spacing);
        elements.push({
          id: createId('card3'),
          type: 'card',
          title: `重点 0${idx + 1}`,
          subtitle: `模块分析与实施对策`,
          body: pt,
          bg: theme.cardBg,
          textColor: theme.textPrimary,
          accentColor: theme.accent,
          tag: `0${idx + 1}`,
          borderRadius: 14,
          x: x,
          y: 170,
          width: cardWidth,
          height: 280,
          zIndex: 3,
        });
      });
      break;
    }

    case 'cards-4': {
      addSlideHeader(elements, theme, baseTitle, options?.summary || '多维矩阵与关键指标拆解');

      const cardWidth = 195;
      const startX = 60;
      const spacing = 20;

      const fourPoints = points.length >= 4 ? points : [...points, '风险把控与持续复盘', '组织协同机制构建'];

      fourPoints.slice(0, 4).forEach((pt, idx) => {
        const x = startX + idx * (cardWidth + spacing);
        elements.push({
          id: createId('card4'),
          type: 'card',
          title: `要素 0${idx + 1}`,
          subtitle: `维度分解`,
          body: pt,
          bg: theme.cardBg,
          textColor: theme.textPrimary,
          accentColor: theme.accent,
          tag: `0${idx + 1}`,
          borderRadius: 12,
          x: x,
          y: 170,
          width: cardWidth,
          height: 280,
          zIndex: 3,
        });
      });
      break;
    }

    case 'timeline':
    case 'process': {
      addSlideHeader(elements, theme, baseTitle, options?.summary || '关键实施路径与阶段性交付目标');

      // Process line across
      elements.push({
        id: createId('proc_line'),
        type: 'line',
        lineType: 'arrow',
        stroke: theme.border,
        strokeWidth: 4,
        strokeStyle: 'solid',
        endArrow: true,
        x: 80,
        y: 220,
        width: 780,
        height: 10,
        zIndex: 2,
      });

      const steps = points.slice(0, 4);
      const stepWidth = 190;
      const startX = 60;
      const spacing = 26;

      steps.forEach((st, idx) => {
        const x = startX + idx * (stepWidth + spacing);

        // Node circle
        elements.push({
          id: createId('step_circle'),
          type: 'shape',
          shapeType: 'circle',
          fill: idx === 0 ? theme.accent : theme.cardBg,
          stroke: theme.accent,
          strokeWidth: 3,
          label: `${idx + 1}`,
          labelColor: idx === 0 ? '#ffffff' : theme.accent,
          x: x + stepWidth / 2 - 20,
          y: 200,
          width: 40,
          height: 40,
          zIndex: 4,
        });

        // Step card
        elements.push({
          id: createId('step_box'),
          type: 'shape',
          shapeType: 'rounded-rect',
          fill: theme.cardBg,
          stroke: theme.border,
          strokeWidth: 1,
          borderRadius: 12,
          x: x,
          y: 260,
          width: stepWidth,
          height: 180,
          zIndex: 3,
        });

        elements.push({
          id: createId('step_title'),
          type: 'text',
          content: `阶段 ${idx + 1}`,
          fontSize: 16,
          fontWeight: 'bold',
          color: theme.accent,
          textAlign: 'center',
          x: x + 10,
          y: 276,
          width: stepWidth - 20,
          height: 25,
          zIndex: 4,
        });

        elements.push({
          id: createId('step_body'),
          type: 'text',
          content: st,
          fontSize: 13,
          fontWeight: 'normal',
          color: theme.textSecondary,
          textAlign: 'left',
          lineHeight: 1.5,
          x: x + 16,
          y: 310,
          width: stepWidth - 32,
          height: 115,
          zIndex: 4,
        });
      });
      break;
    }

    case 'comparison': {
      addSlideHeader(elements, theme, baseTitle, options?.summary || '传统模式与新一代方案综合对比');

      const colW = 390;

      // Col 1 (Traditional)
      elements.push({
        id: createId('comp_box_1'),
        type: 'shape',
        shapeType: 'rounded-rect',
        fill: theme.cardBg,
        stroke: theme.border,
        strokeWidth: 1,
        borderRadius: 14,
        x: 70,
        y: 170,
        width: colW,
        height: 290,
        zIndex: 2,
      });

      elements.push({
        id: createId('comp_t1'),
        type: 'text',
        content: '传统运作模式与现状痛点',
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.textSecondary,
        textAlign: 'left',
        x: 95,
        y: 195,
        width: colW - 50,
        height: 30,
        zIndex: 3,
      });

      const traditionalPoints = ['信息孤岛严重，跨部门流程冗长', '手工排版效率低，版本难以同步', '缺乏智能化洞察，决策滞后'];
      elements.push({
        id: createId('comp_b1'),
        type: 'text',
        content: traditionalPoints.map((p, i) => `• ${p}`).join('\n\n'),
        fontSize: 14,
        fontWeight: 'normal',
        color: theme.textSecondary,
        textAlign: 'left',
        lineHeight: 1.6,
        x: 95,
        y: 240,
        width: colW - 50,
        height: 190,
        zIndex: 3,
      });

      // Col 2 (AI Solution)
      elements.push({
        id: createId('comp_box_2'),
        type: 'shape',
        shapeType: 'rounded-rect',
        fill: theme.cardBg,
        stroke: theme.accent,
        strokeWidth: 2,
        borderRadius: 14,
        x: 500,
        y: 170,
        width: colW,
        height: 290,
        zIndex: 2,
      });

      elements.push({
        id: createId('comp_badge2'),
        type: 'badge',
        text: 'RECOMMENDED',
        bg: theme.badgeBg,
        color: theme.badgeText,
        x: 525,
        y: 190,
        width: 130,
        height: 26,
        zIndex: 3,
      });

      elements.push({
        id: createId('comp_t2'),
        type: 'text',
        content: 'AI 驱动的新一代智能演进方案',
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.accent,
        textAlign: 'left',
        x: 525,
        y: 225,
        width: colW - 50,
        height: 30,
        zIndex: 3,
      });

      elements.push({
        id: createId('comp_b2'),
        type: 'text',
        content: points.map((p, i) => `✓ ${p}`).join('\n\n'),
        fontSize: 14,
        fontWeight: 'medium',
        color: theme.textPrimary,
        textAlign: 'left',
        lineHeight: 1.6,
        x: 525,
        y: 265,
        width: colW - 50,
        height: 170,
        zIndex: 3,
      });
      break;
    }

    case 'quote': {
      addSlideHeader(elements, theme, baseTitle, '核心观点与行业金句');

      elements.push({
        id: createId('quote_box'),
        type: 'shape',
        shapeType: 'rounded-rect',
        fill: theme.cardBg,
        stroke: theme.border,
        strokeWidth: 1,
        borderRadius: 16,
        x: 100,
        y: 170,
        width: 760,
        height: 280,
        zIndex: 2,
      });

      elements.push({
        id: createId('quote_text'),
        type: 'text',
        content: `“ ${options?.summary || points[0] || '科技创新的本质不是代替人类思考，而是放大每一个团队的认知与创造力杠杆。'} ”`,
        fontSize: 26,
        fontWeight: 'bold',
        color: theme.textPrimary,
        textAlign: 'center',
        lineHeight: 1.6,
        x: 140,
        y: 230,
        width: 680,
        height: 120,
        zIndex: 3,
      });

      elements.push({
        id: createId('quote_author'),
        type: 'text',
        content: '—— 战略管理专家 · 领衔智库寄语',
        fontSize: 15,
        fontWeight: 'semibold',
        color: theme.accent,
        textAlign: 'center',
        x: 140,
        y: 370,
        width: 680,
        height: 30,
        zIndex: 3,
      });
      break;
    }

    case 'summary': {
      addSlideHeader(elements, theme, baseTitle, '总结回顾与下一步行动计划');

      // Left column: 3 takeaways
      elements.push({
        id: createId('sum_left_box'),
        type: 'shape',
        shapeType: 'rounded-rect',
        fill: theme.cardBg,
        stroke: theme.border,
        strokeWidth: 1,
        borderRadius: 14,
        x: 60,
        y: 170,
        width: 480,
        height: 280,
        zIndex: 2,
      });

      elements.push({
        id: createId('sum_left_title'),
        type: 'text',
        content: '三大核心战略共识',
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.accent,
        textAlign: 'left',
        x: 90,
        y: 195,
        width: 420,
        height: 30,
        zIndex: 3,
      });

      elements.push({
        id: createId('sum_left_body'),
        type: 'text',
        content: points.map((p, idx) => `0${idx + 1}. ${p}`).join('\n\n'),
        fontSize: 14,
        fontWeight: 'normal',
        color: theme.textPrimary,
        textAlign: 'left',
        lineHeight: 1.6,
        x: 90,
        y: 240,
        width: 420,
        height: 180,
        zIndex: 3,
      });

      // Right column: Action Plan
      elements.push({
        id: createId('sum_right_box'),
        type: 'shape',
        shapeType: 'rounded-rect',
        fill: theme.cardBg,
        stroke: theme.accent,
        strokeWidth: 1.5,
        borderRadius: 14,
        x: 570,
        y: 170,
        width: 330,
        height: 280,
        zIndex: 2,
      });

      elements.push({
        id: createId('sum_right_title'),
        type: 'text',
        content: '下一步推进路线 (Next Steps)',
        fontSize: 17,
        fontWeight: 'bold',
        color: theme.textPrimary,
        textAlign: 'left',
        x: 595,
        y: 195,
        width: 280,
        height: 30,
        zIndex: 3,
      });

      const actions = [
        '即日起：成立跨职能敏捷推进工作组',
        '第 2 周：完成系统技术评估与资源采购',
        '第 4 周：启动试点运行并进行阶段复盘',
        '季度末：全场景规模化推广与成果交付',
      ];

      elements.push({
        id: createId('sum_right_body'),
        type: 'text',
        content: actions.map(a => `→ ${a}`).join('\n\n'),
        fontSize: 13,
        fontWeight: 'medium',
        color: theme.textSecondary,
        textAlign: 'left',
        lineHeight: 1.6,
        x: 595,
        y: 240,
        width: 280,
        height: 180,
        zIndex: 3,
      });
      break;
    }

    case 'split':
    default: {
      addSlideHeader(elements, theme, baseTitle, options?.summary || '深度分析与核心洞察解析');

      // Left main body
      elements.push({
        id: createId('split_left'),
        type: 'shape',
        shapeType: 'rounded-rect',
        fill: theme.cardBg,
        stroke: theme.border,
        strokeWidth: 1,
        borderRadius: 14,
        x: 60,
        y: 170,
        width: 480,
        height: 290,
        zIndex: 2,
      });

      elements.push({
        id: createId('split_body_text'),
        type: 'text',
        content: points.map(p => `• ${p}`).join('\n\n'),
        fontSize: 15,
        fontWeight: 'normal',
        color: theme.textPrimary,
        textAlign: 'left',
        lineHeight: 1.7,
        x: 90,
        y: 200,
        width: 420,
        height: 230,
        zIndex: 3,
      });

      // Right feature card
      elements.push({
        id: createId('split_right'),
        type: 'card',
        title: '核心结论提炼',
        subtitle: 'KEY TAKEAWAY',
        body: options?.summary || '通过系统性架构重构与智能化赋能，大幅降低试错成本，实现高确定性业务增长。',
        bg: theme.cardBg,
        textColor: theme.textPrimary,
        accentColor: theme.accent,
        tag: 'INSIGHT',
        borderRadius: 14,
        x: 570,
        y: 170,
        width: 330,
        height: 290,
        zIndex: 3,
      });
      break;
    }
  }

  return {
    id: slideId,
    title: baseTitle,
    layoutType: layoutType,
    background: {
      type: 'color',
      value: theme.canvasBg,
    },
    elements,
    notes: options?.summary || `本页核心重点：${baseTitle}`,
  };
}

function addSlideHeader(
  elements: SlideElement[],
  theme: PresentationTheme,
  title: string,
  subtitle?: string
) {
  // Category / tag line
  elements.push({
    id: createId('header_badge'),
    type: 'badge',
    text: 'AI PRESENTATION',
    bg: theme.badgeBg,
    color: theme.badgeText,
    x: 60,
    y: 45,
    width: 125,
    height: 24,
    zIndex: 3,
  });

  // Slide Title
  elements.push({
    id: createId('header_title'),
    type: 'text',
    content: title,
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.textPrimary,
    textAlign: 'left',
    x: 60,
    y: 78,
    width: 740,
    height: 40,
    zIndex: 3,
  });

  if (subtitle) {
    elements.push({
      id: createId('header_sub'),
      type: 'text',
      content: subtitle,
      fontSize: 14,
      fontWeight: 'normal',
      color: theme.textSecondary,
      textAlign: 'left',
      x: 60,
      y: 122,
      width: 740,
      height: 24,
      zIndex: 3,
    });
  }

  // Thin header divider
  elements.push({
    id: createId('header_div'),
    type: 'line',
    lineType: 'horizontal',
    stroke: theme.border,
    strokeWidth: 1,
    strokeStyle: 'solid',
    x: 60,
    y: 152,
    width: 840,
    height: 2,
    zIndex: 2,
  });
}

export function createInitialPresentation(themeId = DEFAULT_THEME_ID): Slide[] {
  const theme = PRESENTATION_THEMES[themeId] || PRESENTATION_THEMES[DEFAULT_THEME_ID];
  return [
    generateSlideFromLayout(
      '2026 智能商业演进与出海战略',
      'cover',
      theme,
      {
        subtitle: '基于多模态大模型驱动的全球化业务重塑与敏捷增长实践',
      }
    ),
    generateSlideFromLayout(
      '核心章节与研讨脉络',
      'catalog',
      theme,
      {
        keyPoints: [
          '全球市场环境与宏观红利',
          'AI 智能化全栈赋能体系',
          '商业模式创新与落地实践',
          '组织能力建设与未来展望',
        ],
      }
    ),
    generateSlideFromLayout(
      '核心增长量化飞轮',
      'stats',
      theme,
      {
        summary: '依托智能协同架构，实现关键指标多维度指数级跨越',
        metrics: [
          { label: '出海业务营收同比', value: '+142%', change: '连续 6 季度增长' },
          { label: 'AI 内容生成交付周期', value: '1.5 小时', change: '降低 85% 耗时' },
          { label: '多地区客户满意度 NPS', value: '88.4', change: '稳居行业 Top 1' },
        ],
        keyPoints: [
          '全链路数字化闭环，自动化触达海量高净值客户',
          'AI 多语言内容本地化与合规自动化审核',
          '高可靠敏捷架构保障全球 24/7 服务可用性',
        ],
      }
    ),
    generateSlideFromLayout(
      '实施路径与关键里程碑',
      'process',
      theme,
      {
        summary: '稳扎稳打分步落地，确保战略目标与业务战术敏捷对齐',
        keyPoints: [
          '战略对齐与可行性调研分析',
          'MVP 原型快速验证与灰度测试',
          '多渠道联动与全域规模化放量',
          '数据驱动敏捷迭代与复盘沉淀',
        ],
      }
    ),
    generateSlideFromLayout(
      '战略总结与未来展望',
      'summary',
      theme,
      {
        summary: '把握 AI 范式转移机遇，构建长效核心竞争力',
        keyPoints: [
          '全面拥抱 AI 生产力变革，升级产品底座',
          '建立全球化本地化运营矩阵，增强抗风险力',
          '以用户价值为核心驱动，夯实行业龙头地位',
        ],
      }
    ),
  ];
}
