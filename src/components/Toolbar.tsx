import { useState } from 'react';
import { Sun, Moon, FileDown, Copy, Check, FileText, FolderOpen, ChevronDown } from 'lucide-react';
import { useAppStore } from '@/store';
import { exportToPdf } from '@/utils/exportPdf';
import { copyHtmlToClipboard } from '@/utils/copyHtml';
import type { PdfExportOptions } from '@/types';
import DocumentManager from './DocumentManager';
import PdfExportDialog from './PdfExportDialog';
import SearchBar from './SearchBar';

interface ToolbarProps {
  previewRef: React.RefObject<HTMLDivElement | null>;
}

export default function Toolbar({ previewRef }: ToolbarProps) {
  const { theme, toggleTheme, html, documents, currentDocId } = useAppStore();
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showDocManager, setShowDocManager] = useState(false);
  const [showPdfDialog, setShowPdfDialog] = useState(false);

  const currentDoc = documents.find((d) => d.id === currentDocId);

  const handleCopyHtml = async () => {
    const success = await copyHtmlToClipboard(html);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleOpenPdfDialog = () => {
    setShowPdfDialog(true);
  };

  const handleExportPdf = async (options: PdfExportOptions) => {
    if (!previewRef.current) return;
    setExporting(true);
    try {
      const contentElement = previewRef.current.querySelector(
        '.markdown-body'
      ) as HTMLElement | null;
      if (contentElement) {
        await exportToPdf({
          ...options,
          contentElement,
        });
      }
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <header
        className="h-14 flex items-center justify-between px-4 border-b"
        style={{
          backgroundColor: 'var(--color-bg-secondary)',
          borderColor: 'var(--color-border)',
        }}
      >
        <div className="flex items-center gap-2">
          <FileText size={22} style={{ color: 'var(--color-accent)' }} />
          <button
            onClick={() => setShowDocManager(true)}
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg transition-colors"
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-bg-tertiary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <span
              className="font-semibold text-lg"
              style={{ color: 'var(--color-text-primary)' }}
            >
              {currentDoc?.name || 'Markdown 编辑器'}
            </span>
            <ChevronDown
              size={16}
              style={{ color: 'var(--color-text-muted)' }}
            />
          </button>
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: 'var(--color-accent-bg)',
              color: 'var(--color-accent)',
            }}
          >
            {documents.length} 篇
          </span>
        </div>

        <div className="flex items-center gap-2">
          <SearchBar previewRef={previewRef} />

          <button
            onClick={() => setShowDocManager(true)}
            className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200"
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
            <FolderOpen size={16} />
            <span>文档</span>
          </button>

          <button
            onClick={handleOpenPdfDialog}
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
            <FileDown size={16} />
            <span className="hidden sm:inline">导出 PDF</span>
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
            <span className="hidden sm:inline">{copied ? '已复制' : '复制 HTML'}</span>
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
            <span className="hidden sm:inline">{theme === 'light' ? '暗色' : '亮色'}</span>
          </button>
        </div>
      </header>

      <DocumentManager
        isOpen={showDocManager}
        onClose={() => setShowDocManager(false)}
      />

      <PdfExportDialog
        isOpen={showPdfDialog}
        onClose={() => setShowPdfDialog(false)}
        defaultFilename={currentDoc?.name || 'document'}
        onExport={handleExportPdf}
        exporting={exporting}
      />
    </>
  );
}
