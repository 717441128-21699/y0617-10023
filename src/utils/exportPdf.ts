import html2pdf from 'html2pdf.js';
import type { PdfExportOptions, HeadingItem, PdfExportTemplate } from '@/types';

interface ExportPdfParams extends PdfExportOptions {
  contentElement: HTMLElement;
  outline?: HeadingItem[];
  documentName?: string;
}

const generateOutlineHtml = (outline: HeadingItem[], template: PdfExportTemplate): string => {
  if (outline.length === 0 || template.outlineStyle === 'none') return '';

  const getMarker = (idx: number, level: number): string => {
    if (template.outlineStyle === 'bulleted') {
      return '•';
    }
    if (template.outlineStyle === 'numbered') {
      return `${idx + 1}.`;
    }
    return '';
  };

  const items = outline.map((item, idx) => {
    const indent = `${(item.level - 1) * 24}px`;
    const fontSize = Math.max(12, 18 - (item.level - 1) * 1.5);
    const marker = getMarker(idx, item.level);

    return `
      <div 
        style="
          padding-left: ${indent};
          padding-top: 8px;
          padding-bottom: 8px;
          font-size: ${fontSize}px;
          color: #0f172a;
          border-bottom: 1px dotted #e2e8f0;
          display: flex;
          align-items: baseline;
          gap: 10px;
          font-family: ${template.fontFamily};
        "
      >
        <span style="min-width: 30px; color: #64748b; font-size: ${fontSize - 2}px;">
          ${marker}
        </span>
        <span style="font-weight: ${item.level <= 2 ? 600 : 400}; flex: 1;">
          ${item.text}
        </span>
      </div>
    `;
  }).join('');

  return `
    <div style="
      page-break-after: always;
      padding: ${template.margin.top}px ${template.margin.right}px ${template.margin.bottom}px ${template.margin.left}px;
      font-family: ${template.fontFamily};
      background: #ffffff;
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

const generateCoverPageHtml = (template: PdfExportTemplate, documentName: string): string => {
  if (!template.coverPage) return '';

  const dateStr = template.coverDate 
    ? new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
    : '';

  return `
    <div style="
      page-break-after: always;
      height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: ${template.margin.top * 2}px ${template.margin.right * 2}px;
      font-family: ${template.fontFamily};
      background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
      text-align: center;
    ">
      <div style="flex: 1; display: flex; flex-direction: column; justify-content: center; width: 100%;">
        <div style="
          width: 60px;
          height: 4px;
          background: #0d9488;
          margin: 0 auto 40px;
          border-radius: 2px;
        "></div>
        
        <h1 style="
          font-size: 42px;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 20px 0;
          line-height: 1.3;
        ">
          ${template.coverTitle || documentName || '文档'}
        </h1>
        
        ${template.coverSubtitle ? `
          <p style="
            font-size: 18px;
            color: #64748b;
            margin: 0 0 30px 0;
            line-height: 1.6;
          ">
            ${template.coverSubtitle}
          </p>
        ` : ''}
        
        ${template.coverDate ? `
          <p style="
            font-size: 14px;
            color: #94a3b8;
            margin: 0;
          ">
            ${dateStr}
          </p>
        ` : ''}
      </div>
      
      <div style="
        width: 60px;
        height: 4px;
        background: #0d9488;
        margin: 40px auto 0;
        border-radius: 2px;
      "></div>
    </div>
  `;
};

const generateHeaderHtml = (template: PdfExportTemplate): string => {
  if (!template.header) return '';
  return `
    <div style="
      position: running(header);
      font-family: ${template.fontFamily};
      font-size: 12px;
      color: #64748b;
      padding-bottom: 10px;
      border-bottom: 1px solid #e2e8f0;
    ">
      ${template.headerText}
    </div>
  `;
};

const generateFooterHtml = (template: PdfExportTemplate, showPageNumber: boolean = false): string => {
  if (!template.footer && !template.pageNumber) return '';

  const pageNumberHtml = template.pageNumber ? `
    <span class="page-number" style="
      font-size: 11px;
      color: #94a3b8;
    "></span>
  ` : '';

  const footerContent = template.footer ? template.footerText : '';

  let justifyContent = 'flex-start';
  if (template.pageNumberPosition === 'bottom-center') {
    justifyContent = 'center';
  } else if (template.pageNumberPosition === 'bottom-right') {
    justifyContent = 'flex-end';
  }

  return `
    <div style="
      position: running(footer);
      font-family: ${template.fontFamily};
      font-size: 11px;
      color: #94a3b8;
      padding-top: 10px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    ">
      <span>${footerContent}</span>
      ${template.pageNumberPosition === 'bottom-left' ? pageNumberHtml : ''}
      ${template.pageNumberPosition === 'bottom-center' ? `<span style="flex:1; text-align:center;">${pageNumberHtml}</span>` : ''}
      ${template.pageNumberPosition === 'bottom-right' ? pageNumberHtml : ''}
    </div>
  `;
};

const getDefaultTemplate = (): PdfExportTemplate => ({
  coverPage: false,
  coverTitle: '',
  coverSubtitle: '',
  coverDate: true,
  header: false,
  headerText: '',
  footer: false,
  footerText: '',
  pageNumber: true,
  pageNumberPosition: 'bottom-right',
  outlineStyle: 'numbered',
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif",
  fontSize: 14,
  lineHeight: 1.6,
  margin: {
    top: 40,
    bottom: 40,
    left: 50,
    right: 50,
  },
});

export const exportToPdf = async (params: ExportPdfParams): Promise<void> => {
  const { 
    contentElement, 
    filename, 
    includeOutline, 
    orientation, 
    outline = [],
    documentName = '文档',
    template
  } = params;

  const effectiveTemplate = { ...getDefaultTemplate(), ...template };

  const opt = {
    margin: [
      effectiveTemplate.margin.top,
      effectiveTemplate.margin.right,
      effectiveTemplate.margin.bottom,
      effectiveTemplate.margin.left,
    ],
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

  if (effectiveTemplate.coverPage) {
    const coverContainer = document.createElement('div');
    coverContainer.innerHTML = generateCoverPageHtml(effectiveTemplate, documentName);
    wrapper.appendChild(coverContainer);
  }

  if (includeOutline) {
    const outlineContainer = document.createElement('div');
    outlineContainer.innerHTML = generateOutlineHtml(outline, effectiveTemplate);
    wrapper.appendChild(outlineContainer);
  }

  const contentWrapper = document.createElement('div');
  contentWrapper.style.padding = `0px`;
  contentWrapper.style.fontFamily = effectiveTemplate.fontFamily;
  contentWrapper.style.fontSize = `${effectiveTemplate.fontSize}px`;
  contentWrapper.style.lineHeight = String(effectiveTemplate.lineHeight);
  contentWrapper.style.color = '#0f172a';
  contentWrapper.style.background = '#ffffff';

  const contentClone = contentElement.cloneNode(true) as HTMLElement;
  contentClone.style.maxWidth = '100%';
  contentWrapper.appendChild(contentClone);
  wrapper.appendChild(contentWrapper);

  document.body.appendChild(wrapper);

  try {
    await html2pdf().set(opt).from(wrapper).save();
  } finally {
    document.body.removeChild(wrapper);
  }
};

export const generatePreviewHtml = (params: ExportPdfParams): string => {
  const { 
    contentElement, 
    includeOutline, 
    orientation,
    outline = [],
    documentName = '文档',
    template
  } = params;

  const effectiveTemplate = { ...getDefaultTemplate(), ...template };

  const coverSection = effectiveTemplate.coverPage 
    ? generateCoverPageHtml(effectiveTemplate, documentName) 
    : '';

  const outlineSection = includeOutline 
    ? generateOutlineHtml(outline, effectiveTemplate) 
    : '';

  const contentStyle = `
    padding: ${effectiveTemplate.margin.top / 2}px ${effectiveTemplate.margin.right / 2}px;
    font-family: ${effectiveTemplate.fontFamily};
    font-size: ${effectiveTemplate.fontSize}px;
    line-height: ${effectiveTemplate.lineHeight};
    color: #0f172a;
    background: #ffffff;
  `;

  const headerHtml = effectiveTemplate.header ? `
    <div style="
      padding: 10px ${effectiveTemplate.margin.right / 2}px;
      font-size: 12px;
      color: #64748b;
      border-bottom: 1px solid #e2e8f0;
      font-family: ${effectiveTemplate.fontFamily};
      background: #ffffff;
    ">
      ${effectiveTemplate.headerText}
    </div>
  ` : '';

  const footerHtml = effectiveTemplate.footer || effectiveTemplate.pageNumber ? `
    <div style="
      padding: 10px ${effectiveTemplate.margin.right / 2}px;
      font-size: 11px;
      color: #94a3b8;
      border-top: 1px solid #e2e8f0;
      font-family: ${effectiveTemplate.fontFamily};
      display: flex;
      justify-content: ${
        effectiveTemplate.pageNumberPosition === 'bottom-right' ? 'space-between' :
        effectiveTemplate.pageNumberPosition === 'bottom-center' ? 'center' :
        'space-between'
      };
      background: #ffffff;
    ">
      <span>${effectiveTemplate.footer ? effectiveTemplate.footerText : ''}</span>
      ${effectiveTemplate.pageNumber ? '<span>第 1 页</span>' : ''}
    </div>
  ` : '';

  return `
    <div style="
      background: #ffffff;
      border-radius: 4px;
      overflow: hidden;
    ">
      ${headerHtml}
      ${coverSection}
      ${outlineSection}
      <div style="${contentStyle}">
        ${contentElement.innerHTML}
      </div>
      ${footerHtml}
    </div>
  `;
};

export { getDefaultTemplate };
