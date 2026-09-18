import pptxgen from 'pptxgenjs';
import { Slide, SlideElement } from '../types';

export async function exportToPptx(slides: Slide[], presentationTitle = 'AI_Presentation') {
  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_16x9';
  pptx.title = presentationTitle;

  // 16x9 slide in inches is 10 x 5.625
  const SLIDE_WIDTH = 10;
  const SLIDE_HEIGHT = 5.625;
  const CANVAS_W = 960;
  const CANVAS_H = 540;

  const toInchesX = (px: number) => (px / CANVAS_W) * SLIDE_WIDTH;
  const toInchesY = (px: number) => (px / CANVAS_H) * SLIDE_HEIGHT;
  const toInchesW = (px: number) => (px / CANVAS_W) * SLIDE_WIDTH;
  const toInchesH = (px: number) => (px / CANVAS_H) * SLIDE_HEIGHT;

  const cleanHex = (colorStr: string) => {
    if (!colorStr) return 'FFFFFF';
    if (colorStr.startsWith('#')) return colorStr.slice(1).toUpperCase();
    if (colorStr.startsWith('rgba') || colorStr.startsWith('rgb')) {
      return '3B82F6';
    }
    return colorStr.toUpperCase();
  };

  slides.forEach((s) => {
    const slide = pptx.addSlide();

    // Background
    if (s.background && s.background.type === 'color' && s.background.value) {
      slide.background = { color: cleanHex(s.background.value) };
    } else {
      slide.background = { color: '0F172A' };
    }

    if (s.notes) {
      slide.addNotes(s.notes);
    }

    // Sort elements by zIndex
    const sorted = [...s.elements].sort((a, b) => a.zIndex - b.zIndex);

    sorted.forEach((elem) => {
      const x = toInchesX(elem.x);
      const y = toInchesY(elem.y);
      const w = toInchesW(elem.width);
      const h = toInchesH(elem.height);

      if (elem.type === 'text') {
        slide.addText(elem.content || '', {
          x,
          y,
          w,
          h,
          fontSize: Math.max(10, Math.round((elem.fontSize || 16) * 0.75)),
          bold: elem.fontWeight === 'bold' || elem.fontWeight === 'extrabold',
          color: cleanHex(elem.color),
          align: (elem.textAlign as any) || 'left',
          valign: 'top',
          margin: 0,
        });
      } else if (elem.type === 'shape') {
        let shapeType = pptx.ShapeType.rect;
        if (elem.shapeType === 'circle') shapeType = pptx.ShapeType.ellipse;
        if (elem.shapeType === 'rounded-rect' || elem.shapeType === 'card') {
          shapeType = pptx.ShapeType.roundRect;
        }

        slide.addShape(shapeType, {
          x,
          y,
          w,
          h,
          fill: { color: cleanHex(elem.fill), transparency: elem.opacity ? Math.round((1 - elem.opacity) * 100) : 0 },
          line: elem.stroke ? { color: cleanHex(elem.stroke), width: elem.strokeWidth || 1 } : undefined,
        });

        if (elem.label) {
          slide.addText(elem.label, {
            x,
            y,
            w,
            h,
            fontSize: 14,
            bold: true,
            color: cleanHex(elem.labelColor || '#FFFFFF'),
            align: 'center',
            valign: 'middle',
          });
        }
      } else if (elem.type === 'card') {
        slide.addShape(pptx.ShapeType.roundRect, {
          x,
          y,
          w,
          h,
          fill: { color: cleanHex(elem.bg) },
          line: elem.accentColor ? { color: cleanHex(elem.accentColor), width: 1 } : undefined,
        });

        const textParts = [
          elem.tag ? `[${elem.tag}]\n` : '',
          elem.title ? `${elem.title}\n` : '',
          elem.subtitle ? `${elem.subtitle}\n\n` : '\n',
          elem.body || '',
        ].filter(Boolean).join('');

        slide.addText(textParts, {
          x: x + 0.15,
          y: y + 0.15,
          w: w - 0.3,
          h: h - 0.3,
          fontSize: 12,
          color: cleanHex(elem.textColor),
          valign: 'top',
        });
      } else if (elem.type === 'line') {
        slide.addShape(pptx.ShapeType.line, {
          x,
          y,
          w,
          h: 0.05,
          line: {
            color: cleanHex(elem.stroke),
            width: elem.strokeWidth || 2,
            dashType: elem.strokeStyle === 'dashed' ? 'dash' : 'solid',
            endArrowType: elem.endArrow ? 'triangle' : 'none',
          },
        });
      } else if (elem.type === 'badge') {
        slide.addShape(pptx.ShapeType.roundRect, {
          x,
          y,
          w,
          h,
          fill: { color: cleanHex(elem.bg) },
        });
        slide.addText(elem.text, {
          x,
          y,
          w,
          h,
          fontSize: 10,
          bold: true,
          color: cleanHex(elem.color),
          align: 'center',
          valign: 'middle',
        });
      }
    });
  });

  const filename = `${presentationTitle.replace(/[\s/\\?%*:|"<>]/g, '_')}.pptx`;
  await pptx.writeFile({ fileName: filename });
}
