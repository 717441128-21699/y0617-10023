import html2pdf from 'html2pdf.js';
import type { PdfExportOptions } from '@/types';

interface ExportPdfParams extends PdfExportOptions {
  contentElement: HTMLElement;
  outlineHtml?: string;
}

const generateOutlineHtml = (): string => {
  return '';
};

export const exportToPdf = async (params: ExportPdfParams): Promise<void> => {
  const { contentElement, filename, includeOutline, orientation } = params;

  const opt = {
    margin: [15, 15, 15, 15],
    filename: filename.endsWith('.pdf') ? filename : `${filename}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      letterRendering: true,
    },
    jsPDF: {
      unit: 'mm',
      format: 'a4',
      orientation,
    },
  };

  const clone = contentElement.cloneNode(true) as HTMLElement;
  clone.style.padding = '20px';
  clone.style.maxWidth = '100%';
  clone.style.background = '#ffffff';
  clone.style.color = '#0f172a';
  clone.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif';
  clone.style.fontSize = '14px';
  clone.style.lineHeight = '1.6';

  const wrapper = document.createElement('div');
  wrapper.style.position = 'absolute';
  wrapper.style.left = '-9999px';
  wrapper.style.top = '0';
  wrapper.style.width = orientation === 'landscape' ? '1123px' : '794px';
  wrapper.style.background = '#ffffff';
  wrapper.appendChild(clone);
  document.body.appendChild(wrapper);

  try {
    await html2pdf().set(opt).from(clone).save();
  } finally {
    document.body.removeChild(wrapper);
  }
};
