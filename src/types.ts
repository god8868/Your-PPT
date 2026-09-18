export type ElementType = 'text' | 'shape' | 'line' | 'badge' | 'icon' | 'card' | 'image';

export type ShapeType = 'rect' | 'rounded-rect' | 'circle' | 'pill' | 'card' | 'star' | 'diamond';

export type LineType = 'horizontal' | 'vertical' | 'arrow' | 'dashed' | 'connector';

export interface BaseElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  zIndex: number;
  opacity?: number;
  locked?: boolean;
}

export interface TextElement extends BaseElement {
  type: 'text';
  content: string;
  fontSize: number;
  fontWeight?: 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold';
  color: string;
  textAlign?: 'left' | 'center' | 'right';
  lineHeight?: number;
  fontFamily?: string;
  isBullet?: boolean;
  bullets?: string[];
}

export interface ShapeElement extends BaseElement {
  type: 'shape';
  shapeType: ShapeType;
  fill: string;
  stroke?: string;
  strokeWidth?: number;
  borderRadius?: number;
  shadow?: 'none' | 'sm' | 'md' | 'lg';
  label?: string;
  labelColor?: string;
}

export interface LineElement extends BaseElement {
  type: 'line';
  lineType: LineType;
  stroke: string;
  strokeWidth: number;
  strokeStyle?: 'solid' | 'dashed' | 'dotted';
  startArrow?: boolean;
  endArrow?: boolean;
}

export interface BadgeElement extends BaseElement {
  type: 'badge';
  text: string;
  bg: string;
  color: string;
  iconName?: string;
}

export interface IconElement extends BaseElement {
  type: 'icon';
  iconName: string;
  color: string;
  bgShape?: 'circle' | 'square' | 'none';
  bgColor?: string;
}

export interface CardElement extends BaseElement {
  type: 'card';
  title: string;
  subtitle?: string;
  value?: string;
  body?: string;
  iconName?: string;
  bg: string;
  textColor: string;
  accentColor?: string;
  tag?: string;
  borderRadius?: number;
}

export interface ImageElement extends BaseElement {
  type: 'image';
  url: string;
  alt?: string;
  borderRadius?: number;
  objectFit?: 'cover' | 'contain';
}

export type SlideElement =
  | TextElement
  | ShapeElement
  | LineElement
  | BadgeElement
  | IconElement
  | CardElement
  | ImageElement;

export interface SlideBackground {
  type: 'color' | 'gradient' | 'image';
  value: string;
}

export type SlideLayoutType =
  | 'cover'
  | 'catalog'
  | 'split'
  | 'stats'
  | 'cards-3'
  | 'cards-4'
  | 'timeline'
  | 'process'
  | 'comparison'
  | 'quote'
  | 'summary'
  | 'blank';

export interface Slide {
  id: string;
  title: string;
  layoutType: SlideLayoutType;
  background: SlideBackground;
  elements: SlideElement[];
  notes?: string;
}

export interface PresentationTheme {
  id: string;
  name: string;
  nameZh: string;
  bg: string;
  canvasBg: string;
  cardBg: string;
  textPrimary: string;
  textSecondary: string;
  accent: string;
  accentGradient: string;
  border: string;
  badgeBg: string;
  badgeText: string;
}

export interface OutlineItem {
  slideNumber: number;
  title: string;
  layoutType: SlideLayoutType;
  summary: string;
  keyPoints: string[];
  visualSuggestion?: string;
}

export interface OutlineResponse {
  topic: string;
  targetAudience: string;
  tone: string;
  suggestedTheme: string;
  outline: OutlineItem[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  type?: 'text' | 'outline_proposal' | 'slide_generated' | 'diff_applied';
  outlineData?: OutlineResponse;
  suggestedActions?: string[];
  attachments?: UploadedFileRef[];
}

export interface UploadedFileRef {
  id: string;
  name: string;
  size: number;
  type: string;
  textContent?: string;
  base64Data?: string;
  mimeType?: string;
}
