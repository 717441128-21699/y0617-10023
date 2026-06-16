import { useState, useMemo } from 'react';
import {
  Clock,
  Plus,
  RotateCcw,
  Trash2,
  FileText,
  X,
  ChevronLeft,
  Save,
} from 'lucide-react';
import { useAppStore } from '@/store';
import type { DocumentVersion } from '@/types';

interface VersionPanelProps {
  isOpen: boolean;
  onClose: () => void;
  previewRef?: React.RefObject<HTMLDivElement> | null;
}

export default function VersionPanel({ isOpen, onClose, previewRef }: VersionPanelProps) {
  const {
    currentVersionId,
    saveVersion,
    restoreVersion,
    deleteVersion,
    getCurrentVersions,
    clearSearch,
  } = useAppStore();

  const [showSaveForm, setShowSaveForm] = useState(false);
  const [description, setDescription] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const versions = useMemo(() => {
    return [...getCurrentVersions()].sort((a, b) => b.savedAt - a.savedAt);
  }, [getCurrentVersions]);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  };

  const getVersionTitle = (version: DocumentVersion, index: number) => {
    if (version.description) {
      return version.description;
    }
    return `版本 ${index + 1}`;
  };

  const handleSaveVersion = () => {
    saveVersion(description.trim() || undefined);
    setDescription('');
    setShowSaveForm(false);
  };

  const handleRestoreVersion = (versionId: string) => {
    restoreVersion(versionId);
    clearSearch();
    if (previewRef?.current) {
      const previewEl = previewRef.current.querySelector('.markdown-body') as HTMLElement | null;
      if (previewEl) {
        useAppStore.getState().clearSearchHighlightsInDom(previewEl.parentElement);
      }
    }
  };

  const handleDeleteVersion = (versionId: string) => {
    deleteVersion(versionId);
    setDeleteConfirmId(null);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="flex flex-col border-l"
      style={{
        backgroundColor: 'var(--color-bg-secondary)',
        borderColor: 'var(--color-border)',
        width: '320px',
        minWidth: '320px',
        height: '100%',
      }}
    >
      <div
        className="flex items-center justify-between p-3 border-b"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <div className="flex items-center gap-2">
          <Clock size={18} style={{ color: 'var(--color-text-primary)' }} />
          <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
            历史版本
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowSaveForm(!showSaveForm)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium transition-colors"
            style={{
              backgroundColor: 'var(--color-accent)',
              color: 'white',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.9';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1';
            }}
          >
            <Plus size={14} />
            <span>保存版本</span>
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--color-text-muted)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
              e.currentTarget.style.color = 'var(--color-text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--color-text-muted)';
            }}
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {showSaveForm && (
        <div
          className="p-3 border-b"
          style={{
            borderColor: 'var(--color-border)',
            backgroundColor: 'var(--color-bg-tertiary)',
          }}
        >
          <div className="mb-2">
            <label
              className="text-sm font-medium mb-1.5 block"
              style={{ color: 'var(--color-text-primary)' }}
            >
              版本描述（可选）
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="例如：修复了第二章的错误"
              className="w-full px-3 py-2 rounded-lg text-sm outline-none"
              style={{
                backgroundColor: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-primary)',
              }}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSaveVersion();
                } else if (e.key === 'Escape') {
                  setShowSaveForm(false);
                  setDescription('');
                }
              }}
            />
          </div>
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => {
                setShowSaveForm(false);
                setDescription('');
              }}
              className="px-3 py-1.5 rounded-lg text-sm transition-colors"
              style={{ color: 'var(--color-text-muted)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
                e.currentTarget.style.color = 'var(--color-text-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--color-text-muted)';
              }}
            >
              取消
            </button>
            <button
              onClick={handleSaveVersion}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
              style={{
                backgroundColor: 'var(--color-accent)',
                color: 'white',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '0.9';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '1';
              }}
            >
              <Save size={14} />
              <span>确认保存</span>
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {versions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <Clock size={40} style={{ color: 'var(--color-text-muted)' }} className="mb-3 opacity-50" />
            <p className="text-sm font-medium mb-1" style={{ color: 'var(--color-text-primary)' }}>
              暂无历史版本
            </p>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              点击上方"保存版本"创建第一个版本
            </p>
          </div>
        ) : (
          <div className="p-2 space-y-2">
            {versions.map((version, index) => {
              const isCurrent = currentVersionId === version.id;
              const isDeleteConfirm = deleteConfirmId === version.id;

              return (
                <div
                  key={version.id}
                  className={`p-3 rounded-lg border transition-all duration-150 cursor-pointer ${
                    isCurrent ? '' : 'border-transparent'
                  }`}
                  style={{
                    backgroundColor: 'var(--color-bg-tertiary)',
                    borderColor: isCurrent ? 'var(--color-accent)' : 'var(--color-border)',
                  }}
                  onMouseEnter={(e) => {
                    if (!isCurrent) {
                      e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isCurrent) {
                      e.currentTarget.style.backgroundColor = 'var(--color-bg-tertiary)';
                    }
                  }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      <FileText size={14} style={{ color: 'var(--color-text-muted)' }} />
                      <span
                        className="text-sm font-medium truncate"
                        style={{ color: 'var(--color-text-primary)' }}
                      >
                        {getVersionTitle(version, versions.length - 1 - index)}
                      </span>
                    </div>
                    {isCurrent && (
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0 ml-2"
                        style={{
                          backgroundColor: 'var(--color-accent-bg)',
                          color: 'var(--color-accent)',
                        }}
                      >
                        当前
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 mb-2 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    <Clock size={12} />
                    <span>{formatDate(version.savedAt)}</span>
                  </div>

                  {isDeleteConfirm ? (
                    <div className="mt-2 pt-2 border-t" style={{ borderColor: 'var(--color-border)' }}>
                      <p className="text-xs mb-2" style={{ color: 'var(--color-text-primary)' }}>
                        确定要删除这个版本吗？
                      </p>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirmId(null);
                          }}
                          className="px-2 py-1 rounded text-xs transition-colors"
                          style={{ color: 'var(--color-text-muted)' }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
                            e.currentTarget.style.color = 'var(--color-text-primary)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.color = 'var(--color-text-muted)';
                          }}
                        >
                          取消
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteVersion(version.id);
                          }}
                          className="px-2 py-1 rounded text-xs font-medium transition-colors"
                          style={{
                            backgroundColor: 'var(--color-error-bg, #fee2e2)',
                            color: 'var(--color-error, #dc2626)',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.opacity = '0.9';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.opacity = '1';
                          }}
                        >
                          确认删除
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      {!isCurrent && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRestoreVersion(version.id);
                          }}
                          className="flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors"
                          style={{
                            backgroundColor: 'var(--color-bg-secondary)',
                            color: 'var(--color-text-muted)',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--color-accent-bg)';
                            e.currentTarget.style.color = 'var(--color-accent)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--color-bg-secondary)';
                            e.currentTarget.style.color = 'var(--color-text-muted)';
                          }}
                        >
                          <RotateCcw size={12} />
                          <span>恢复</span>
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirmId(version.id);
                        }}
                        className="flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ml-auto"
                        style={{
                          backgroundColor: 'var(--color-bg-secondary)',
                          color: 'var(--color-text-muted)',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--color-error-bg, #fee2e2)';
                          e.currentTarget.style.color = 'var(--color-error, #dc2626)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--color-bg-secondary)';
                          e.currentTarget.style.color = 'var(--color-text-muted)';
                        }}
                      >
                        <Trash2 size={12} />
                        <span>删除</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div
        className="p-3 border-t"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-text-muted)' }}>
            <FileText size={12} />
            <span>共 {versions.length} 个版本</span>
          </div>
          <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            最多保留 10 个
          </span>
        </div>
      </div>
    </div>
  );
}
