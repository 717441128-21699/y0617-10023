export const copyHtmlToClipboard = async (html: string): Promise<boolean> => {
  try {
    if (navigator.clipboard && window.ClipboardItem) {
      const blob = new Blob([html], { type: 'text/html' });
      const clipboardItem = new ClipboardItem({
        'text/html': blob,
        'text/plain': new Blob([html], { type: 'text/plain' }),
      });
      await navigator.clipboard.write([clipboardItem]);
      return true;
    }

    const textarea = document.createElement('textarea');
    textarea.value = html;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.top = '0';
    document.body.appendChild(textarea);
    textarea.select();
    
    const success = document.execCommand('copy');
    document.body.removeChild(textarea);
    return success;
  } catch {
    return false;
  }
};
