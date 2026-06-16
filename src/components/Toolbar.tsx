import { useState, useMemo } from 'react';
import { Sun, Moon, Download, Copy, Check, FileText, FolderOpen, ChevronDown, Search, Clock } from 'lucide-react';
import { useAppStore } from '@/store';
import { copyHtmlToClipboard } from '@/utils/copyHtml';
import DocumentManager from './DocumentManager';
import PdfExportDialog from './PdfExportDialog';

interface ToolbarProps {
  previewRef: React.RefObject<HTMLDivElement> | null;
  onToggleSearchPanel: () => void;
  searchPanelOpen: boolean;
  onToggleVersionPanel: () => void;
  versionPanelOpen: boolean;
}

export default function Toolbar({ previewRef, onToggleSearchPanel, searchPanelOpen, onToggleVersionPanel, versionPanelOpen }: ToolbarProps) {
  const { theme, toggleTheme, html, documents, currentDocId, outline, clearSearch, searchMatches, saveVersion, currentVersionId, getCurrentVersions } = useAppStore();
  const [copied, setCopied] = useState(false);
  const [docManagerOpen, setDocManagerOpen] = useState(false);
  const [pdfDialogOpen, setPdfDialogOpen] = useState(false);

  const currentDoc = useMemo(() => {
    return documents.find((d) => d.id === currentDocId);
  }, [documents, currentDocId]);

  const versions = useMemo(() => {
    return getCurrentVersions();
  }, [getCurrentVersions]);

  const searchMatchCount = searchMatches.length;

  const handleCopyHtml = async () => {
    const success = await copyHtmlToClipboard(html);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleOpenPdfDialog = () => {
    clearSearch();
    setPdfDialogOpen(true);
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
            onClick={() => setDocManagerOpen(true)}
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
          <button
            onClick={() => setDocManagerOpen(true)}
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
            title="文档管理"
          >
            <FolderOpen size={16} />
            <span className="hidden sm:inline">文档管理</span>
          </button>

          <button
            onClick={onToggleVersionPanel}
            className="relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200"
            style={{
              backgroundColor: versionPanelOpen
                ? 'var(--color-accent-bg)'
                : 'var(--color-bg-tertiary)',
              color: versionPanelOpen
                ? 'var(--color-accent)'
                : 'var(--color-text-primary)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = versionPanelOpen
                ? 'var(--color-accent-bg)'
                : 'var(--color-bg-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = versionPanelOpen
                ? 'var(--color-accent-bg)'
                : 'var(--color-bg-tertiary)';
            }}
            title="历史版本"
          >
            <Clock size={16} />
            <span className="hidden sm:inline">历史版本</span>
            {versions.length > 0 && (
              <span
                className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-semibold rounded-full px-1"
                style={{
                  backgroundColor: 'var(--color-accent)',
                  color: 'white',
                }}
              >
                {versions.length > 9 ? '9+' : versions.length}
              </span>
            )}
          </button>

          <button
            onClick={onToggleSearchPanel}
            className="relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200"
            style={{
              backgroundColor: searchPanelOpen
                ? 'var(--color-accent-bg)'
                : 'var(--color-bg-tertiary)',
              color: searchPanelOpen
                ? 'var(--color-accent)'
                : 'var(--color-text-primary)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = searchPanelOpen
                ? 'var(--color-accent-bg)'
                : 'var(--color-bg-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = searchPanelOpen
                ? 'var(--color-accent-bg)'
                : 'var(--color-bg-tertiary)';
            }}
            title="搜索 (Ctrl+F)"
          >
            <Search size={16} />
            <span className="hidden sm:inline">搜索</span>
            {searchMatchCount > 0 && (
              <span
                className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-semibold rounded-full px-1"
                style={{
                  backgroundColor: 'var(--color-accent)',
                  color: 'white',
                }}
              >
                {searchMatchCount > 99 ? '99+' : searchMatchCount}
              </span>
            )}
          </button>

          <div
            className="w-px h-6 mx-1"
            style={{ backgroundColor: 'var(--color-border)' }}
          />

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
            title="导出 PDF"
          >
            <Download size={16} />
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
            title="复制 HTML"
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
            title={theme === 'light' ? '切换到暗色主题' : '切换到亮色主题'}
          >
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            <span className="hidden sm:inline">{theme === 'light' ? '暗色' : '亮色'}</span>
          </button>
        </div>
      </header>

      <DocumentManager
        isOpen={docManagerOpen}
        onClose={() => setDocManagerOpen(false)}
      />

      <PdfExportDialog
        isOpen={pdfDialogOpen}
        onClose={() => setPdfDialogOpen(false)}
        previewElement={previewRef}
        outline={outline}
        defaultFilename={currentDoc?.name || 'document'}
      />
    </>
  );
}
