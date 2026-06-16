import html2pdf from 'html2pdf.js';
import type { PdfExportOptions, HeadingItem } from '@/types';

interface ExportPdfParams extends PdfExportOptions {
  contentElement: HTMLElement;
  outline?: HeadingItem[];
}

const generateOutlineHtml = (outline: HeadingItem[]): string => {
  if (outline.length === 0) return '';

  const items = outline.map((item, idx) => {
    const indent = `${(item.level - 1) * 20}px`;
    const fontSize = 16 - (item.level - 1) * 1.5;
    return `
      <div 
        style="
          padding-left: ${indent};
          padding-top: 6px;
          padding-bottom: 6px;
          font-size: ${fontSize}px;
          color: #0f172a;
          border-bottom: 1px dotted #cbd5e1;
        "
      >
        <span style="display: inline-block; min-width: 30px; color: #64748b;">
          ${idx + 1}.
        </span>
        <span style="font-weight: ${item.level <= 2 ? 600 : 400};">
          ${item.text}
        </span>
      </div>
    `;
  }).join('');

  return `
    <div style="
      page-break-after: always;
      padding: 40px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', sans-serif;
    ">
      <h1 style="
        font-size: 28px;
        font-weight: 700;
        color: #0f172a;
        margin-bottom: 30px;
        padding-bottom: 15px;
        border-bottom: 2px solid #0d9488;
      ">
        目录
      </h1>
      ${items}
    </div>
  `;
};

export const exportToPdf = async (params: ExportPdfParams): Promise<void> => {
  const { contentElement, filename, includeOutline, orientation, outline = [] } = params;

  const opt = {
    margin: [15, 15, 15, 15],
    filename: filename.endsWith('.pdf') ? filename : `${filename}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      letterRendering: true,
      backgroundColor: '#ffffff',
    },
    jsPDF: {
      unit: 'mm',
      format: 'a4',
      orientation,
    },
  };

  const wrapper = document.createElement('div');
  wrapper.style.position = 'absolute';
  wrapper.style.left = '-9999px';
  wrapper.style.top = '0';
  wrapper.style.width = orientation === 'landscape' ? '1123px' : '794px';
  wrapper.style.background = '#ffffff';
  wrapper.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif';
  wrapper.style.color = '#0f172a';
  wrapper.style.fontSize = '14px';
  wrapper.style.lineHeight = '1.6';

  if (includeOutline) {
    const outlineContainer = document.createElement('div');
    outlineContainer.innerHTML = generateOutlineHtml(outline);
    wrapper.appendChild(outlineContainer);
  }

  const contentClone = contentElement.cloneNode(true) as HTMLElement;
  contentClone.style.padding = includeOutline ? '20px 40px' : '40px';
  contentClone.style.maxWidth = '100%';
  contentClone.style.background = '#ffffff';
  contentClone.style.color = '#0f172a';
  
  wrapper.appendChild(contentClone);
  document.body.appendChild(wrapper);

  try {
    await html2pdf().set(opt).from(wrapper).save();
  } finally {
    document.body.removeChild(wrapper);
  }
};

export const generatePreviewHtml = (params: ExportPdfParams): string => {
  const { contentElement, includeOutline, outline = [] } = params;

  const outlineSection = includeOutline ? generateOutlineHtml(outline) : '';

  return `
    <div style="
      background: #ffffff;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif;
      color: #0f172a;
      font-size: 14px;
      line-height: 1.6;
      padding: 20px;
    ">
      ${outlineSection}
      <div style="padding: ${includeOutline ? '20px 0' : '0'};">
        ${contentElement.innerHTML}
      </div>
    </div>
  `;
};
