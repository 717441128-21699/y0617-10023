import { useState } from 'react';
import { X, FileDown } from 'lucide-react';
import type { PdfExportOptions } from '@/types';

interface PdfExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  defaultFilename: string;
  onExport: (options: PdfExportOptions) => Promise<void>;
  exporting: boolean;
}

export default function PdfExportDialog({
  isOpen,
  onClose,
  defaultFilename,
  onExport,
  exporting,
}: PdfExportDialogProps) {
  const [filename, setFilename] = useState(defaultFilename.replace('.pdf', ''));
  const [includeOutline, setIncludeOutline] = useState(false);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onExport({
      filename: filename || 'document',
      includeOutline,
      orientation,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={onClose}
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
    >
      <div
        className="w-[420px] rounded-xl shadow-2xl"
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

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
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
                className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 border ${
                  orientation === 'portrait' ? '' : ''
                }`}
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
                横向
              </button>
            </div>
          </div>

          <div
            className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors"
            style={{
              backgroundColor: 'var(--color-bg-tertiary)',
            }}
            onClick={() => setIncludeOutline(!includeOutline)}
          >
            <input
              type="checkbox"
              id="include-outline"
              checked={includeOutline}
              onChange={(e) => setIncludeOutline(e.target.checked)}
              className="w-4 h-4 rounded cursor-pointer"
              style={{ accentColor: 'var(--color-accent)' }}
            />
            <label
              htmlFor="include-outline"
              className="flex-1 text-sm cursor-pointer"
              style={{ color: 'var(--color-text-primary)' }}
            >
              包含标题大纲
              <span
                className="block text-xs mt-0.5"
                style={{ color: 'var(--color-text-muted)' }}
              >
                在 PDF 开头生成目录导航
              </span>
            </label>
          </div>

          <div
            className="flex justify-end gap-3 pt-2"
          >
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
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
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
              {exporting ? '导出中...' : '确认导出'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
