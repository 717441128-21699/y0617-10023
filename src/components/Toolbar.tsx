import { useState } from 'react';
import { Sun, Moon, FileDown, Copy, Check, FileText } from 'lucide-react';
import { useAppStore } from '@/store';
import { exportToPdf } from '@/utils/exportPdf';
import { copyHtmlToClipboard } from '@/utils/copyHtml';

interface ToolbarProps {
  previewRef: React.RefObject<HTMLDivElement | null>;
}

export default function Toolbar({ previewRef }: ToolbarProps) {
  const { theme, toggleTheme, html } = useAppStore();
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleCopyHtml = async () => {
    const success = await copyHtmlToClipboard(html);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleExportPdf = async () => {
    if (!previewRef.current) return;
    setExporting(true);
    try {
      await exportToPdf(previewRef.current, 'markdown-document.pdf');
    } finally {
      setExporting(false);
    }
  };

  return (
    <header
      className="h-14 flex items-center justify-between px-4 border-b"
      style={{
        backgroundColor: 'var(--color-bg-secondary)',
        borderColor: 'var(--color-border)',
      }}
    >
      <div className="flex items-center gap-2">
        <FileText size={22} style={{ color: 'var(--color-accent)' }} />
        <span
          className="font-semibold text-lg"
          style={{ color: 'var(--color-text-primary)' }}
        >
          Markdown 编辑器
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handleExportPdf}
          disabled={exporting}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50"
          style={{
            backgroundColor: 'var(--color-bg-tertiary)',
            color: 'var(--color-text-primary)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-bg-tertiary)';
          }}
        >
          <FileDown size={16} />
          {exporting ? '导出中...' : '导出 PDF'}
        </button>

        <button
          onClick={handleCopyHtml}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200"
          style={{
            backgroundColor: copied ? 'var(--color-accent-bg)' : 'var(--color-bg-tertiary)',
            color: copied ? 'var(--color-accent)' : 'var(--color-text-primary)',
          }}
          onMouseEnter={(e) => {
            if (!copied) {
              e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
            }
          }}
          onMouseLeave={(e) => {
            if (!copied) {
              e.currentTarget.style.backgroundColor = 'var(--color-bg-tertiary)';
            }
          }}
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
          {copied ? '已复制' : '复制 HTML'}
        </button>

        <button
          onClick={toggleTheme}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200"
          style={{
            backgroundColor: 'var(--color-bg-tertiary)',
            color: 'var(--color-text-primary)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-bg-tertiary)';
          }}
        >
          {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
          {theme === 'light' ? '暗色' : '亮色'}
        </button>
      </div>
    </header>
  );
}
