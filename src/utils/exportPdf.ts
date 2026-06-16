import html2pdf from 'html2pdf.js';

export const exportToPdf = async (contentElement: HTMLElement, filename = 'document.pdf'): Promise<void> => {
  const opt = {
    margin: [15, 15, 15, 15],
    filename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      letterRendering: true,
    },
    jsPDF: {
      unit: 'mm',
      format: 'a4',
      orientation: 'portrait',
    },
  };

  const clone = contentElement.cloneNode(true) as HTMLElement;
  clone.style.padding = '20px';
  clone.style.maxWidth = '100%';
  clone.style.background = '#ffffff';
  clone.style.color = '#0f172a';

  const wrapper = document.createElement('div');
  wrapper.style.position = 'absolute';
  wrapper.style.left = '-9999px';
  wrapper.style.top = '0';
  wrapper.style.width = '794px';
  wrapper.appendChild(clone);
  document.body.appendChild(wrapper);

  try {
    await html2pdf().set(opt).from(clone).save();
  } finally {
    document.body.removeChild(wrapper);
  }
};
