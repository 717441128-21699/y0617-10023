import html2pdf from 'html2pdf.js';
import type { PdfExportOptions, HeadingItem, PdfExportTemplate } from '@/types';

interface ExportPdfParams extends PdfExportOptions {
  contentElement: HTMLElement;
  outline?: HeadingItem[];
  documentName?: string;
}

const A4_PORTRAIT = { width: 794, height: 1123 };
const A4_LANDSCAPE = { width: 1123, height: 794 };

const getPageDimensions = (orientation: 'portrait' | 'landscape') =>
  orientation === 'portrait' ? A4_PORTRAIT : A4_LANDSCAPE;

const escapeHtml = (str: string): string => {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
};

const generateWatermarkStyle = (text: string): string => {
  const escaped = escapeHtml(text);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="180">
    <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
      font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif"
      font-size="22" fill="rgba(0,0,0,0.15)"
      transform="rotate(-45 120 90)">${escaped}</text>
  </svg>`;
  return `background-image:url("data:image/svg+xml,${encodeURIComponent(svg)}");background-repeat:repeat;`;
};

const generateOutlineHtml = (outline: HeadingItem[], template: PdfExportTemplate): string => {
  if (outline.length === 0 || template.outlineStyle === 'none') return '';

  const getMarker = (idx: number) => {
    if (template.outlineStyle === 'bulleted') return '•';
    if (template.outlineStyle === 'numbered') return `${idx + 1}.`;
    return '';
  };

  const items = outline.map((item, idx) => {
    const indent = (item.level - 1) * 24;
    const fontSize = Math.max(12, 18 - (item.level - 1) * 1.5);
    return `
      <div style="padding-left:${indent}px;padding-top:8px;padding-bottom:8px;font-size:${fontSize}px;
        color:#0f172a;border-bottom:1px dotted #e2e8f0;display:flex;align-items:baseline;gap:10px;
        font-family:${template.fontFamily}">
        <span style="min-width:30px;color:#64748b;font-size:${fontSize - 2}px">${getMarker(idx)}</span>
        <span style="font-weight:${item.level <= 2 ? 600 : 400};flex:1">${escapeHtml(item.text)}</span>
      </div>`;
  }).join('');

  return `
    <div style="padding:${template.margin.top}px ${template.margin.right}px ${template.margin.bottom}px ${template.margin.left}px;
      font-family:${template.fontFamily};background:#fff;height:100%;box-sizing:border-box">
      <h1 style="font-size:28px;font-weight:700;color:#0f172a;margin:0 0 30px 0;padding-bottom:15px;border-bottom:2px solid #0d9488">目录</h1>
      ${items}
    </div>`;
};

const generateCoverPageHtml = (template: PdfExportTemplate, documentName: string): string => {
  if (!template.coverPage) return '';
  const dateStr = template.coverDate
    ? new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
    : '';

  const logoBlock = template.coverLogo
    ? `<div style="margin:0 auto 40px"><img src="${template.coverLogo}" alt="Logo" style="max-width:180px;max-height:120px;object-fit:contain"/></div>`
    : `<div style="width:60px;height:4px;background:#0d9488;margin:0 auto 40px;border-radius:2px"></div>`;

  const metaBlock = (template.coverAuthor || template.coverCompany || template.coverDate)
    ? `<div style="margin-top:30px;padding-top:30px;border-top:1px solid #cbd5e1">
        <div style="display:flex;justify-content:center;flex-wrap:wrap;gap:30px;font-size:14px;color:#475569">
          ${template.coverAuthor ? `<span>作者：<strong style="color:#0f172a">${escapeHtml(template.coverAuthor)}</strong></span>` : ''}
          ${template.coverCompany ? `<span>公司：<strong style="color:#0f172a">${escapeHtml(template.coverCompany)}</strong></span>` : ''}
          ${template.coverDate ? `<span>日期：<strong style="color:#0f172a">${dateStr}</strong></span>` : ''}
        </div>
      </div>`
    : '';

  return `
    <div style="height:100%;display:flex;flex-direction:column;justify-content:center;align-items:center;
      padding:${template.margin.top * 2}px ${template.margin.right * 2}px;font-family:${template.fontFamily};
      background:linear-gradient(135deg,#f8fafc 0%,#e2e8f0 100%);text-align:center;box-sizing:border-box">
      <div style="flex:1;display:flex;flex-direction:column;justify-content:center;width:100%">
        ${logoBlock}
        <h1 style="font-size:42px;font-weight:700;color:#0f172a;margin:0 0 20px 0;line-height:1.3">
          ${escapeHtml(template.coverTitle || documentName || '文档')}
        </h1>
        ${template.coverSubtitle ? `<p style="font-size:18px;color:#64748b;margin:0 0 30px 0;line-height:1.6">${escapeHtml(template.coverSubtitle)}</p>` : ''}
        ${metaBlock}
      </div>
      <div style="width:60px;height:4px;background:#0d9488;margin:40px auto 0;border-radius:2px"></div>
    </div>`;
};

const getHeaderHtml = (template: PdfExportTemplate, documentName: string, pageNumber: number): string => {
  if (!template.header && !template.headerIncludeTitle && !template.headerIncludePageNumber) return '';

  const left: string[] = [];
  const center: string[] = [];
  const right: string[] = [];

  if (template.header && template.headerText) {
    left.push(escapeHtml(template.headerText));
  }
  if (template.headerIncludeTitle) {
    if (left.length === 0) left.push(escapeHtml(documentName));
    else if (right.length === 0) right.push(escapeHtml(documentName));
    else center.push(escapeHtml(documentName));
  }
  if (template.headerIncludePageNumber) {
    const pageStr = `<span style="color:#94a3b8">第 ${pageNumber} 页</span>`;
    if (template.pageNumberPosition === 'top-left') left.unshift(pageStr);
    else if (template.pageNumberPosition === 'top-right') right.push(pageStr);
    else right.push(pageStr);
  }

  return `
    <div style="padding:0 ${template.margin.right}px 10px ${template.margin.left}px;
      font-family:${template.fontFamily};font-size:12px;color:#64748b;
      border-bottom:1px solid #e2e8f0;display:flex;align-items:center;gap:16px;box-sizing:border-box">
      <span style="flex:1;text-align:left">${left.join(' ')}</span>
      <span style="flex:1;text-align:center">${center.join(' ')}</span>
      <span style="flex:1;text-align:right">${right.join(' ')}</span>
    </div>`;
};

const getFooterHtml = (template: PdfExportTemplate, pageNumber: number): string => {
  if (!template.footer && !template.footerIncludeDate && !template.footerIncludePageNumber) return '';

  const left: string[] = [];
  const center: string[] = [];
  const right: string[] = [];

  if (template.footer && template.footerText) {
    left.push(escapeHtml(template.footerText));
  }
  if (template.footerIncludeDate) {
    const date = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
    if (left.length === 0) left.push(date);
    else if (right.length === 0) right.push(date);
    else center.push(date);
  }
  if (template.footerIncludePageNumber) {
    const pageStr = `第 ${pageNumber} 页`;
    switch (template.pageNumberPosition) {
      case 'bottom-left':
        if (left.length === 0) {
          left.push(pageStr);
        } else {
          left.unshift(pageStr);
        }
        break;
      case 'bottom-center':
        center.push(pageStr);
        break;
      case 'bottom-right':
      default:
        right.push(pageStr);
    }
  }

  return `
    <div style="padding:10px ${template.margin.right}px 0 ${template.margin.left}px;
      font-family:${template.fontFamily};font-size:11px;color:#94a3b8;
      border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center;box-sizing:border-box">
      <span style="flex:1;text-align:left">${left.join(' ')}</span>
      <span style="flex:1;text-align:center">${center.join(' ')}</span>
      <span style="flex:1;text-align:right">${right.join(' ')}</span>
    </div>`;
};

const splitContentIntoPages = (
  element: HTMLElement,
  contentWidth: number,
  maxHeight: number,
  template: PdfExportTemplate
): string[] => {
  const pages: string[] = [];
  const clone = element.cloneNode(true) as HTMLElement;

  const measure = document.createElement('div');
  Object.assign(measure.style, {
    position: 'absolute', left: '-99999px', top: '-99999px',
    width: `${contentWidth}px`, visibility: 'hidden',
    fontFamily: template.fontFamily, fontSize: `${template.fontSize}px`,
    lineHeight: String(template.lineHeight), color: '#0f172a'
  });
  measure.appendChild(clone);
  document.body.appendChild(measure);

  try {
    if (clone.scrollHeight <= maxHeight) {
      pages.push(clone.innerHTML);
      return pages;
    }

    const children = Array.from(clone.children) as HTMLElement[];
    let current = '';
    let currentH = 0;

    for (const child of children) {
      const h = child.offsetHeight || child.getBoundingClientRect().height || 50;

      if (currentH + h > maxHeight && current) {
        pages.push(current);
        current = '';
        currentH = 0;
      }

      if (h > maxHeight) {
        if (current) { pages.push(current); current = ''; currentH = 0; }
        pages.push(child.outerHTML);
        continue;
      }

      current += child.outerHTML;
      currentH += h;
    }

    if (current) pages.push(current);
    if (pages.length === 0) pages.push(clone.innerHTML);
  } finally {
    document.body.removeChild(measure);
  }

  return pages;
};

const splitOutlineIntoPages = (
  outline: HeadingItem[],
  contentWidth: number,
  maxHeight: number,
  template: PdfExportTemplate
): HeadingItem[][] => {
  if (outline.length === 0 || template.outlineStyle === 'none') return [];

  const chunks: HeadingItem[][] = [];
  const perPage = Math.max(10, Math.floor(maxHeight / 40));

  for (let i = 0; i < outline.length; i += perPage) {
    chunks.push(outline.slice(i, i + perPage));
  }

  if (chunks.length <= 1) {
    const measure = document.createElement('div');
    Object.assign(measure.style, {
      position: 'absolute', left: '-99999px', top: '-99999px',
      width: `${contentWidth}px`, visibility: 'hidden'
    });
    measure.innerHTML = generateOutlineHtml(outline, template);
    document.body.appendChild(measure);
    const fits = measure.scrollHeight <= maxHeight;
    document.body.removeChild(measure);
    if (fits) return [outline];
  }

  return chunks;
};

const wrapPage = (
  innerHtml: string,
  template: PdfExportTemplate,
  orientation: 'portrait' | 'landscape',
  pageNumber: number,
  documentName: string,
  type: 'cover' | 'outline' | 'content'
): string => {
  const { width, height } = getPageDimensions(orientation);
  const wm = template.watermarkEnabled && template.watermarkText
    ? generateWatermarkStyle(template.watermarkText) : '';

  if (type === 'cover') {
    return `
      <div style="position:relative;width:${width}px;height:${height}px;
        page-break-after:always;page-break-inside:avoid;overflow:hidden;
        box-sizing:border-box;${wm}">
        ${generateCoverPageHtml(template, documentName)}
      </div>`;
  }

  const showHeaderFooter = type === 'content' || type === 'outline';
  const header = showHeaderFooter ? getHeaderHtml(template, documentName, pageNumber) : '';
  const footer = showHeaderFooter ? getFooterHtml(template, pageNumber) : '';

  const contentStyle = type === 'content'
    ? `flex:1;padding:${template.margin.top}px ${template.margin.right}px ${template.margin.bottom}px ${template.margin.left}px;
      overflow:hidden;box-sizing:border-box;font-family:${template.fontFamily};
      font-size:${template.fontSize}px;line-height:${template.lineHeight};color:#0f172a;background:#fff`
    : `flex:1;overflow:hidden;box-sizing:border-box`;

  return `
    <div style="position:relative;width:${width}px;height:${height}px;
      page-break-after:always;page-break-inside:avoid;overflow:hidden;
      box-sizing:border-box;background:#fff;display:flex;flex-direction:column;${wm}">
      ${header}
      <div style="${contentStyle}">${innerHtml}</div>
      ${footer}
    </div>`;
};

export const getDefaultTemplate = (): PdfExportTemplate => ({
  coverPage: false,
  coverTitle: '',
  coverSubtitle: '',
  coverDate: true,
  coverAuthor: '',
  coverCompany: '',
  coverLogo: '',
  header: false,
  headerText: '',
  headerIncludeTitle: false,
  headerIncludePageNumber: false,
  footer: false,
  footerText: '',
  footerIncludeDate: true,
  footerIncludePageNumber: true,
  pageNumber: true,
  pageNumberPosition: 'bottom-right',
  pageNumberStartFrom: 1,
  outlineStyle: 'numbered',
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif",
  fontSize: 14,
  lineHeight: 1.6,
  margin: { top: 40, bottom: 40, left: 50, right: 50 },
  watermarkText: '草稿',
  watermarkEnabled: false,
});

export const exportToPdf = async (params: ExportPdfParams): Promise<void> => {
  const {
    contentElement, filename, includeOutline, orientation,
    outline = [], documentName = '文档', template
  } = params;

  const eff = { ...getDefaultTemplate(), ...template };
  const { width, height } = getPageDimensions(orientation);
  const contentWidth = width - eff.margin.left - eff.margin.right;
  const hasHeader = eff.header || eff.headerIncludeTitle || eff.headerIncludePageNumber;
  const hasFooter = eff.footer || eff.footerIncludeDate || eff.footerIncludePageNumber;
  const headerH = hasHeader ? 40 : 0;
  const footerH = hasFooter ? 40 : 0;
  const maxH = height - eff.margin.top - eff.margin.bottom - headerH - footerH - 20;

  const opt = {
    margin: 0,
    filename: filename.endsWith('.pdf') ? filename : `${filename}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, letterRendering: true, backgroundColor: '#fff' },
    jsPDF: { unit: 'px' as const, format: [width, height] as [number, number], orientation }
  };

  const wrapper = document.createElement('div');
  Object.assign(wrapper.style, {
    position: 'absolute', left: '-99999px', top: '0', background: '#fff'
  });

  const contentPages = splitContentIntoPages(contentElement, contentWidth, maxH, eff);
  const outlineChunks = includeOutline && outline.length > 0
    ? splitOutlineIntoPages(outline, contentWidth, maxH, eff)
    : [];

  let pageNum = eff.pageNumberStartFrom;
  let html = '';

  if (eff.coverPage) {
    html += wrapPage('', eff, orientation, 0, documentName, 'cover');
  }

  for (const chunk of outlineChunks) {
    html += wrapPage(
      generateOutlineHtml(chunk, eff),
      eff, orientation, pageNum, documentName, 'outline'
    );
    pageNum++;
  }

  for (const pageContent of contentPages) {
    html += wrapPage(pageContent, eff, orientation, pageNum, documentName, 'content');
    pageNum++;
  }

  wrapper.innerHTML = html;
  document.body.appendChild(wrapper);

  try {
    await html2pdf().set(opt).from(wrapper).save();
  } finally {
    document.body.removeChild(wrapper);
  }
};

export const generatePreviewHtml = (params: ExportPdfParams): string => {
  const {
    contentElement, includeOutline, orientation,
    outline = [], documentName = '文档', template
  } = params;

  const eff = { ...getDefaultTemplate(), ...template };
  const { width, height } = getPageDimensions(orientation);
  const contentWidth = width - eff.margin.left - eff.margin.right;
  const hasHeader = eff.header || eff.headerIncludeTitle || eff.headerIncludePageNumber;
  const hasFooter = eff.footer || eff.footerIncludeDate || eff.footerIncludePageNumber;
  const maxH = height - eff.margin.top - eff.margin.bottom - (hasHeader ? 40 : 0) - (hasFooter ? 40 : 0) - 20;

  const contentPages = splitContentIntoPages(contentElement, contentWidth, maxH, eff);
  const outlineChunks = includeOutline && outline.length > 0
    ? splitOutlineIntoPages(outline, contentWidth, maxH, eff)
    : [];

  let pageNum = eff.pageNumberStartFrom;
  const pageBlocks: string[] = [];

  if (eff.coverPage) {
    pageBlocks.push(wrapPage('', eff, orientation, 0, documentName, 'cover'));
  }

  for (const chunk of outlineChunks) {
    pageBlocks.push(wrapPage(
      generateOutlineHtml(chunk, eff),
      eff, orientation, pageNum, documentName, 'outline'
    ));
    pageNum++;
  }

  for (const pc of contentPages) {
    pageBlocks.push(wrapPage(pc, eff, orientation, pageNum, documentName, 'content'));
    pageNum++;
  }

  return `
    <div style="display:flex;flex-direction:column;align-items:center;gap:20px;padding:20px;background:#f1f5f9">
      ${pageBlocks.map(p => `
        <div style="box-shadow:0 4px 20px rgba(0,0,0,0.1);background:#fff">${p}</div>
      `).join('')}
    </div>`;
};
