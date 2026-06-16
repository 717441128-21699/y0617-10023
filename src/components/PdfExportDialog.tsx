import { useState, useEffect, useMemo } from 'react';
import { X, FileDown, Eye, List, FileText } from 'lucide-react';
import type { PdfExportOptions, HeadingItem } from '@/types';
import { generatePreviewHtml } from '@/utils/exportPdf';

interface PdfExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  defaultFilename: string;
  onExport: (options: PdfExportOptions) => Promise<void>;
  exporting: boolean;
  previewElement: HTMLElement | null;
  outline: HeadingItem[];
}

export default function PdfExportDialog({
  isOpen,
  onClose,
  defaultFilename,
  onExport,
  exporting,
  previewElement,
  outline,
}: PdfExportDialogProps) {
  const [filename, setFilename] = useState(defaultFilename.replace('.pdf', ''));
  const [includeOutline, setIncludeOutline] = useState(false);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFilename(defaultFilename.replace('.pdf', ''));
      setIncludeOutline(false);
      setOrientation('portrait');
      setShowPreview(false);
    }
  }, [isOpen, defaultFilename]);

  const toggleIncludeOutline = () => {
    setIncludeOutline((prev) => !prev);
  };

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleIncludeOutline();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onExport({
      filename: filename || 'document',
      includeOutline,
      orientation,
    });
    onClose();
  };

  const previewHtml = useMemo(() => {
    if (!previewElement || !showPreview) return '';
    const markdownBody = previewElement.querySelector('.markdown-body') as HTMLElement | null;
    if (!markdownBody) return '';
    return generatePreviewHtml({
      contentElement: markdownBody,
      filename,
      includeOutline,
      orientation,
      outline,
    });
  }, [previewElement, filename, includeOutline, orientation, outline, showPreview]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
    >
      <div
        className="w-full max-w-[600px] max-h-[90vh] flex flex-col rounded-xl shadow-2xl"
        style={{ backgroundColor: 'var(--color-bg-secondary)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between px-5 py-4 border-b"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <div className="flex items-center gap-2">
            <FileDown size={20} style={{ color: 'var(--color-accent)' }} />
            <span
              className="text-lg font-semibold"
              style={{ color: 'var(--color-text-primary)' }}
            >
              导出 PDF
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--color-text-muted)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <X size={18} />
          </button>
        </div>

        {showPreview ? (
          <div className="flex-1 flex flex-col min-h-0">
            <div
              className="flex items-center justify-between px-5 py-3 border-b"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <div className="flex items-center gap-2">
                <Eye size={16} style={{ color: 'var(--color-accent)' }} />
                <span
                  className="text-sm font-medium"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  预览效果
                </span>
                {includeOutline && (
                  <span
                    className="text-xs px-2 py-0.5 rounded"
                    style={{
                      backgroundColor: 'var(--color-accent-bg)',
                      color: 'var(--color-accent)',
                    }}
                  >
                    含目录
                  </span>
                )}
              </div>
              <button
                onClick={() => setShowPreview(false)}
                className="text-sm px-3 py-1.5 rounded-lg transition-colors"
                style={{
                  backgroundColor: 'var(--color-bg-tertiary)',
                  color: 'var(--color-text-secondary)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-bg-tertiary)';
                }}
              >
                返回设置
              </button>
            </div>
            <div
              className="flex-1 overflow-y-auto"
              style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
            >
              <div
                className="mx-auto my-4 p-4 shadow-lg"
                style={{
                  width: orientation === 'landscape' ? '560px' : '400px',
                  minHeight: '560px',
                  background: '#ffffff',
                  transform: 'scale(0.9)',
                  transformOrigin: 'top center',
                }}
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  文件名
                </label>
                <div className="flex items-center">
                  <input
                    autoFocus
                    type="text"
                    value={filename}
                    onChange={(e) => setFilename(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg border outline-none text-sm transition-colors"
                    style={{
                      backgroundColor: 'var(--color-bg-tertiary)',
                      borderColor: 'var(--color-border)',
                      color: 'var(--color-text-primary)',
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = 'var(--color-accent)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'var(--color-border)';
                    }}
                    placeholder="请输入文件名"
                  />
                  <span
                    className="ml-2 text-sm"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    .pdf
                  </span>
                </div>
              </div>

              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  纸张方向
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setOrientation('portrait')}
                    className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 border"
                    style={{
                      backgroundColor:
                        orientation === 'portrait'
                          ? 'var(--color-accent-bg)'
                          : 'var(--color-bg-tertiary)',
                      borderColor:
                        orientation === 'portrait'
                          ? 'var(--color-accent)'
                          : 'var(--color-border)',
                      color:
                        orientation === 'portrait'
                          ? 'var(--color-accent)'
                          : 'var(--color-text-primary)',
                    }}
                  >
                    <FileText size={16} className="inline-block mr-2" />
                    纵向
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrientation('landscape')}
                    className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 border"
                    style={{
                      backgroundColor:
                        orientation === 'landscape'
                          ? 'var(--color-accent-bg)'
                          : 'var(--color-bg-tertiary)',
                      borderColor:
                        orientation === 'landscape'
                          ? 'var(--color-accent)'
                          : 'var(--color-border)',
                      color:
                        orientation === 'landscape'
                          ? 'var(--color-accent)'
                          : 'var(--color-text-primary)',
                    }}
                  >
                    <FileText
                      size={16}
                      className="inline-block mr-2"
                      style={{ transform: 'rotate(90deg)' }}
                    />
                    横向
                  </button>
                </div>
              </div>

              <div
                className="flex items-start gap-3 p-4 rounded-lg cursor-pointer transition-all duration-150 border-2"
                style={{
                  backgroundColor: includeOutline
                    ? 'var(--color-accent-bg)'
                    : 'var(--color-bg-tertiary)',
                  borderColor: includeOutline
                    ? 'var(--color-accent)'
                    : 'var(--color-border)',
                }}
                onClick={toggleIncludeOutline}
              >
                <div
                  className="mt-0.5 flex items-center justify-center w-5 h-5 rounded border-2 transition-all duration-150"
                  style={{
                    backgroundColor: includeOutline ? 'var(--color-accent)' : 'transparent',
                    borderColor: includeOutline
                      ? 'var(--color-accent)'
                      : 'var(--color-text-muted)',
                  }}
                  onClick={handleCheckboxClick}
                >
                  {includeOutline && (
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#ffffff"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
                <label className="flex-1 text-sm cursor-pointer select-none">
                  <span
                    className="flex items-center gap-1.5 font-medium"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    <List size={16} />
                    包含标题大纲
                  </span>
                  <span
                    className="block text-xs mt-1"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    在 PDF 开头生成目录导航页，当前文档共 {outline.length} 个标题
                  </span>
                </label>
              </div>
            </div>

            <div
              className="flex justify-between gap-3 p-5 pt-3 border-t"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <button
                type="button"
                onClick={() => setShowPreview(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
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
                <Eye size={16} />
                预览
              </button>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
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
                  取消
                </button>
                <button
                  type="submit"
                  disabled={exporting || !filename.trim()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                  style={{
                    backgroundColor: 'var(--color-accent)',
                    color: '#ffffff',
                  }}
                  onMouseEnter={(e) => {
                    if (!e.currentTarget.disabled) {
                      e.currentTarget.style.backgroundColor = 'var(--color-accent-hover)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!e.currentTarget.disabled) {
                      e.currentTarget.style.backgroundColor = 'var(--color-accent)';
                    }
                  }}
                >
                  <FileDown size={16} />
                  {exporting ? '导出中...' : '确认导出'}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
