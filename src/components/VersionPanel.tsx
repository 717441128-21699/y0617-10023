import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import {
  Clock,
  Plus,
  RotateCcw,
  Trash2,
  FileText,
  X,
  ChevronLeft,
  Save,
  GitCompare,
  Check,
  Eye,
  EyeOff,
  ArrowLeftRight,
} from 'lucide-react';
import { useAppStore } from '@/store';
import { computeLineDiff, groupDiffToBlocks, detectModifiedBlocks, generateSummary } from '@/utils/diffUtils';
import type { DocumentVersion, DiffBlock, DiffLine } from '@/types';

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

  const [compareMode, setCompareMode] = useState(false);
  const [selectedVersionIds, setSelectedVersionIds] = useState<[string | null, string | null]>([null, null]);
  const [saveDescription, setSaveDescription] = useState('');
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [restoreConfirmId, setRestoreConfirmId] = useState<string | null>(null);
  const [expandedUnchangedBlocks, setExpandedUnchangedBlocks] = useState<Set<number>>(new Set());
  const [showRestoreWarning, setShowRestoreWarning] = useState(false);

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
    saveVersion(saveDescription.trim() || undefined);
    setSaveDescription('');
    setShowSaveForm(false);
  };

  const handleRestoreVersion = (versionId: string) => {
    restoreVersion(versionId);
    clearSearch();
    setRestoreConfirmId(null);
    setShowRestoreWarning(false);
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
    if (selectedVersionIds[0] === versionId) {
      setSelectedVersionIds((prev) => [null, prev[1]]);
    }
    if (selectedVersionIds[1] === versionId) {
      setSelectedVersionIds((prev) => [prev[0], null]);
    }
  };

  const handleToggleCompareSelection = (versionId: string) => {
    setSelectedVersionIds((prev) => {
      const [baseId, compareId] = prev;
      if (baseId === versionId) {
        return [null, compareId];
      }
      if (compareId === versionId) {
        return [baseId, null];
      }
      if (baseId === null) {
        return [versionId, compareId];
      }
      if (compareId === null) {
        return [baseId, versionId];
      }
      return [compareId, versionId];
    });
  };

  const handleBaseVersionChange = (versionId: string) => {
    setSelectedVersionIds((prev) => {
      if (prev[1] === versionId) {
        return [versionId, prev[0]];
      }
      return [versionId || null, prev[1]];
    });
  };

  const handleCompareVersionChange = (versionId: string) => {
    setSelectedVersionIds((prev) => {
      if (prev[0] === versionId) {
        return [prev[1], versionId];
      }
      return [prev[0], versionId || null];
    });
  };

  const handleSwapVersions = () => {
    setSelectedVersionIds((prev) => [prev[1], prev[0]]);
  };

  const handleEnterCompareMode = () => {
    if (versions.length >= 2) {
      const sorted = [...versions].sort((a, b) => b.savedAt - a.savedAt);
      setSelectedVersionIds([sorted[1]?.id || null, sorted[0]?.id || null]);
    }
    setCompareMode(true);
    setExpandedUnchangedBlocks(new Set());
  };

  const handleExitCompareMode = () => {
    setCompareMode(false);
    setExpandedUnchangedBlocks(new Set());
    setShowRestoreWarning(false);
  };

  const diffResult = useMemo(() => {
    const base = versions.find((v) => v.id === selectedVersionIds[0]);
    const compare = versions.find((v) => v.id === selectedVersionIds[1]);
    if (!base || !compare) return null;
    const lines = computeLineDiff(base.content, compare.content);
    const blocks = groupDiffToBlocks(lines);
    const modified = detectModifiedBlocks(blocks);
    const summary = generateSummary(base.content, compare.content);
    return { blocks: modified, summary };
  }, [selectedVersionIds, versions]);

  const toggleUnchangedBlock = (blockIndex: number) => {
    setExpandedUnchangedBlocks((prev) => {
      const next = new Set(prev);
      if (next.has(blockIndex)) {
        next.delete(blockIndex);
      } else {
        next.add(blockIndex);
      }
      return next;
    });
  };

  const isSelectionComplete = selectedVersionIds[0] !== null && selectedVersionIds[1] !== null;

  const renderDiffBlock = (block: DiffBlock, blockIndex: number) => {
    if (block.type === 'unchanged') {
      const isExpanded = expandedUnchangedBlocks.has(blockIndex);
      const totalLines = block.lines.length;
      const shouldCollapse = totalLines > 5 && !isExpanded;

      let visibleLines: DiffLine[];
      if (shouldCollapse) {
        visibleLines = [...block.lines.slice(0, 2), ...block.lines.slice(-2)];
      } else {
        visibleLines = block.lines;
      }

      return (
        <div key={blockIndex} className="mb-1">
          <div
            className="rounded-md overflow-hidden"
            style={{ backgroundColor: 'var(--color-bg-tertiary, #f3f4f6)' }}
          >
            {visibleLines.map((line, lineIdx) => {
              const isOmitted = shouldCollapse && lineIdx === 2;
              if (isOmitted) {
                return (
                  <div
                    key={`${blockIndex}-omit`}
                    className="flex items-center px-3 py-1 text-xs cursor-pointer hover:opacity-80 transition-opacity"
                    style={{ color: 'var(--color-text-muted)' }}
                    onClick={() => toggleUnchangedBlock(blockIndex)}
                  >
                    <Eye size={10} className="mr-1.5" />
                    <span>省略 {totalLines - 4} 行，点击展开</span>
                  </div>
                );
              }
              const actualLineIdx = shouldCollapse && lineIdx >= 2 ? lineIdx + (totalLines - 4) : lineIdx;
              return (
                <div
                  key={`${blockIndex}-${lineIdx}`}
                  className="flex items-start px-3 py-0.5"
                  style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace', fontSize: '11px' }}
                >
                  <span
                    className="shrink-0 w-10 text-right pr-2 select-none"
                    style={{ color: 'var(--color-text-muted, #9ca3af)' }}
                  >
                    {block.lines[actualLineIdx].lineNumber}
                  </span>
                  <span
                    className="shrink-0 w-4 text-center select-none"
                    style={{ color: 'var(--color-text-muted, #9ca3af)' }}
                  >
                    {' '}
                  </span>
                  <pre
                    className="flex-1 whitespace-pre-wrap break-all m-0"
                    style={{ color: 'var(--color-text-primary, #111827)' }}
                  >
                    {line.content || ' '}
                  </pre>
                </div>
              );
            })}
            {!shouldCollapse && totalLines > 5 && (
              <div
                className="flex items-center px-3 py-1 text-xs cursor-pointer hover:opacity-80 border-t transition-opacity"
                style={{ color: 'var(--color-text-muted)', borderColor: 'var(--color-border)' }}
                onClick={() => toggleUnchangedBlock(blockIndex)}
              >
                <EyeOff size={10} className="mr-1.5" />
                <span>点击折叠</span>
              </div>
            )}
          </div>
        </div>
      );
    }

    if (block.type === 'removed') {
      return (
        <div key={blockIndex} className="mb-1">
          <div
            className="rounded-md overflow-hidden"
            style={{ backgroundColor: '#fee2e2' }}
          >
            {block.lines.map((line, lineIdx) => (
              <div
                key={`${blockIndex}-${lineIdx}`}
                className="flex items-start px-3 py-0.5"
                style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace', fontSize: '11px' }}
              >
                <span
                  className="shrink-0 w-10 text-right pr-2 select-none"
                  style={{ color: '#9ca3af' }}
                >
                  {line.lineNumber}
                </span>
                <span
                  className="shrink-0 w-4 text-center select-none font-bold"
                  style={{ color: '#ef4444' }}
                >
                  -
                </span>
                <pre
                  className="flex-1 whitespace-pre-wrap break-all m-0"
                  style={{ color: '#b91c1c' }}
                >
                  {line.content || ' '}
                </pre>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (block.type === 'added') {
      return (
        <div key={blockIndex} className="mb-1">
          <div
            className="rounded-md overflow-hidden"
            style={{ backgroundColor: '#dcfce7' }}
          >
            {block.lines.map((line, lineIdx) => (
              <div
                key={`${blockIndex}-${lineIdx}`}
                className="flex items-start px-3 py-0.5"
                style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace', fontSize: '11px' }}
              >
                <span
                  className="shrink-0 w-10 text-right pr-2 select-none"
                  style={{ color: '#9ca3af' }}
                >
                  {line.lineNumber}
                </span>
                <span
                  className="shrink-0 w-4 text-center select-none font-bold"
                  style={{ color: '#16a34a' }}
                >
                  +
                </span>
                <pre
                  className="flex-1 whitespace-pre-wrap break-all m-0"
                  style={{ color: '#15803d' }}
                >
                  {line.content || ' '}
                </pre>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (block.type === 'modified') {
      const removedLines = block.lines.filter((l) => l.type === 'removed');
      const addedLines = block.lines.filter((l) => l.type === 'added');

      return (
        <div key={blockIndex} className="mb-2">
          <div
            className="flex items-center px-3 py-1.5 text-xs font-medium rounded-t-md"
            style={{ backgroundColor: '#fef3c7', color: '#a16207' }}
          >
            <ArrowLeftRight size={12} className="mr-1.5" />
            <span>修改于：{block.heading || '未知位置'}</span>
          </div>
          {removedLines.length > 0 && (
            <div
              className="overflow-hidden"
              style={{ backgroundColor: '#fee2e2' }}
            >
              {removedLines.map((line, lineIdx) => (
                <div
                  key={`${blockIndex}-r-${lineIdx}`}
                  className="flex items-start px-3 py-0.5"
                  style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace', fontSize: '11px' }}
                >
                  <span
                    className="shrink-0 w-10 text-right pr-2 select-none"
                    style={{ color: '#9ca3af' }}
                  >
                    {line.lineNumber}
                  </span>
                  <span
                    className="shrink-0 w-4 text-center select-none font-bold"
                    style={{ color: '#ef4444' }}
                  >
                    -
                  </span>
                  <pre
                    className="flex-1 whitespace-pre-wrap break-all m-0"
                    style={{ color: '#b91c1c' }}
                  >
                    {line.content || ' '}
                  </pre>
                </div>
              ))}
            </div>
          )}
          {addedLines.length > 0 && (
            <div
              className="overflow-hidden rounded-b-md"
              style={{ backgroundColor: '#dcfce7' }}
            >
              {addedLines.map((line, lineIdx) => (
                <div
                  key={`${blockIndex}-a-${lineIdx}`}
                  className="flex items-start px-3 py-0.5"
                  style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace', fontSize: '11px' }}
                >
                  <span
                    className="shrink-0 w-10 text-right pr-2 select-none"
                    style={{ color: '#9ca3af' }}
                  >
                    {line.lineNumber}
                  </span>
                  <span
                    className="shrink-0 w-4 text-center select-none font-bold"
                    style={{ color: '#16a34a' }}
                  >
                    +
                  </span>
                  <pre
                    className="flex-1 whitespace-pre-wrap break-all m-0"
                    style={{ color: '#15803d' }}
                  >
                    {line.content || ' '}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  if (!isOpen) {
    return null;
  }

  if (compareMode) {
    const baseVersion = versions.find((v) => v.id === selectedVersionIds[0]);
    const compareVersion = versions.find((v) => v.id === selectedVersionIds[1]);
    const panelWidth = '420px';

    return (
      <div
        className="flex flex-col border-l"
        style={{
          backgroundColor: 'var(--color-bg-secondary)',
          borderColor: 'var(--color-border)',
          width: panelWidth,
          minWidth: panelWidth,
          height: '100%',
        }}
      >
        <div
          className="flex items-center justify-between p-3 border-b"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <div className="flex items-center gap-2">
            <button
              onClick={handleExitCompareMode}
              className="p-1 rounded-lg transition-colors"
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
              <ChevronLeft size={18} />
            </button>
            <GitCompare size={18} style={{ color: 'var(--color-accent)' }} />
            <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
              版本对比
            </span>
          </div>
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

        <div
          className="p-3 border-b space-y-2.5"
          style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-tertiary)' }}
        >
          <div className="space-y-2">
            <div>
              <label
                className="text-xs font-medium mb-1 block flex items-center gap-1"
                style={{ color: '#2563eb' }}
              >
                <div
                  className="w-2.5 h-2.5 rounded-sm"
                  style={{ backgroundColor: '#2563eb' }}
                />
                基准版本
              </label>
              <select
                value={selectedVersionIds[0] || ''}
                onChange={(e) => handleBaseVersionChange(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg text-sm outline-none cursor-pointer"
                style={{
                  backgroundColor: 'var(--color-bg-secondary)',
                  border: '2px solid #2563eb',
                  color: 'var(--color-text-primary)',
                }}
              >
                <option value="">请选择基准版本...</option>
                {versions.map((v, idx) => (
                  <option key={v.id} value={v.id}>
                    {getVersionTitle(v, versions.length - 1 - idx)} — {formatDate(v.savedAt)}
                  </option>
                ))}
              </select>
              {baseVersion && (
                <p className="text-[11px] mt-1" style={{ color: 'var(--color-text-muted)' }}>
                  保存于 {formatDate(baseVersion.savedAt)}
                </p>
              )}
            </div>

            <div className="flex justify-center">
              <button
                onClick={handleSwapVersions}
                className="p-1 rounded-full transition-colors"
                style={{ color: 'var(--color-text-muted)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
                  e.currentTarget.style.color = 'var(--color-text-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--color-text-muted)';
                }}
                title="交换版本"
              >
                <ArrowLeftRight size={14} />
              </button>
            </div>

            <div>
              <label
                className="text-xs font-medium mb-1 block flex items-center gap-1"
                style={{ color: '#9333ea' }}
              >
                <div
                  className="w-2.5 h-2.5 rounded-sm"
                  style={{ backgroundColor: '#9333ea' }}
                />
                对比版本
              </label>
              <select
                value={selectedVersionIds[1] || ''}
                onChange={(e) => handleCompareVersionChange(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg text-sm outline-none cursor-pointer"
                style={{
                  backgroundColor: 'var(--color-bg-secondary)',
                  border: '2px solid #9333ea',
                  color: 'var(--color-text-primary)',
                }}
              >
                <option value="">请选择对比版本...</option>
                {versions.map((v, idx) => (
                  <option key={v.id} value={v.id}>
                    {getVersionTitle(v, versions.length - 1 - idx)} — {formatDate(v.savedAt)}
                  </option>
                ))}
              </select>
              {compareVersion && (
                <p className="text-[11px] mt-1" style={{ color: 'var(--color-text-muted)' }}>
                  保存于 {formatDate(compareVersion.savedAt)}
                </p>
              )}
            </div>
          </div>

          {!isSelectionComplete ? (
            <div
              className="flex items-center justify-center p-3 rounded-lg text-sm"
              style={{
                backgroundColor: 'var(--color-bg-secondary)',
                color: 'var(--color-text-muted)',
                border: '1px dashed var(--color-border)',
              }}
            >
              请选择两个版本进行对比
            </div>
          ) : diffResult?.summary ? (
            <div className="space-y-2">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-md" style={{ backgroundColor: '#dcfce7', color: '#15803d' }}>
                  <span className="font-bold">+</span>
                  <span>新增 {diffResult.summary.addedLines} 行</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-md" style={{ backgroundColor: '#fee2e2', color: '#b91c1c' }}>
                  <span className="font-bold">-</span>
                  <span>删除 {diffResult.summary.removedLines} 行</span>
                </div>
                {diffResult.summary.modifiedBlocks > 0 && (
                  <div className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-md" style={{ backgroundColor: '#fef3c7', color: '#a16207' }}>
                    <ArrowLeftRight size={12} />
                    <span>修改 {diffResult.summary.modifiedBlocks} 处</span>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                <span>基准: {diffResult.summary.totalOldLines} 行</span>
                <span>→</span>
                <span>对比: {diffResult.summary.totalNewLines} 行</span>
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {!isSelectionComplete ? null : diffResult?.blocks && diffResult.blocks.length > 0 ? (
            diffResult.blocks.map((block, idx) => renderDiffBlock(block, idx))
          ) : isSelectionComplete ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6">
              <Check size={40} className="mb-3 opacity-50" style={{ color: '#16a34a' }} />
              <p className="text-sm font-medium mb-1" style={{ color: 'var(--color-text-primary)' }}>
                两个版本完全相同
              </p>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                没有检测到任何差异
              </p>
            </div>
          ) : null}
        </div>

        <div
          className="p-3 border-t"
          style={{ borderColor: 'var(--color-border)' }}
        >
          {showRestoreWarning && compareVersion ? (
            <div
              className="p-3 rounded-lg mb-2"
              style={{
                backgroundColor: '#fef3c7',
                border: '1px solid #f59e0b',
              }}
            >
              <p className="text-xs mb-2 font-medium" style={{ color: '#92400e' }}>
                ⚠️ 确定要恢复到对比版本吗？
              </p>
              <p className="text-[11px] mb-2.5" style={{ color: '#a16207' }}>
                恢复后当前文档内容将被替换为「{getVersionTitle(compareVersion, 0)}」的内容。
              </p>
              <div className="flex items-center justify-end gap-1.5">
                <button
                  onClick={() => setShowRestoreWarning(false)}
                  className="px-2.5 py-1 rounded text-xs transition-colors"
                  style={{ color: '#92400e' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#fde68a';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  取消
                </button>
                <button
                  onClick={() => handleRestoreVersion(compareVersion.id)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors"
                  style={{
                    backgroundColor: '#f59e0b',
                    color: 'white',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '0.9';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '1';
                  }}
                >
                  <Check size={12} />
                  <span>确认恢复</span>
                </button>
              </div>
            </div>
          ) : null}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-text-muted)' }}>
              <GitCompare size={12} />
              <span>对比模式</span>
            </div>
            <button
              onClick={() => compareVersion && setShowRestoreWarning(true)}
              disabled={!compareVersion}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: 'var(--color-accent)',
                color: 'white',
              }}
              onMouseEnter={(e) => {
                if (compareVersion) {
                  e.currentTarget.style.opacity = '0.9';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '1';
              }}
            >
              <RotateCcw size={14} />
              <span>恢复到对比版本</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col border-l"
      style={{
        backgroundColor: 'var(--color-bg-secondary)',
        borderColor: 'var(--color-border)',
        width: '380px',
        minWidth: '380px',
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
            onClick={handleEnterCompareMode}
            disabled={versions.length < 2}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: selectedVersionIds[0] && selectedVersionIds[1] ? 'var(--color-accent-bg)' : 'var(--color-bg-tertiary)',
              color: selectedVersionIds[0] && selectedVersionIds[1] ? 'var(--color-accent)' : 'var(--color-text-muted)',
              border: '1px solid var(--color-border)',
            }}
            onMouseEnter={(e) => {
              if (versions.length >= 2) {
                e.currentTarget.style.backgroundColor = 'var(--color-accent-bg)';
                e.currentTarget.style.color = 'var(--color-accent)';
              }
            }}
            onMouseLeave={(e) => {
              if (!(selectedVersionIds[0] && selectedVersionIds[1])) {
                e.currentTarget.style.backgroundColor = 'var(--color-bg-tertiary)';
                e.currentTarget.style.color = 'var(--color-text-muted)';
              }
            }}
            title={versions.length < 2 ? '至少需要2个版本才能对比' : '进入对比模式'}
          >
            <GitCompare size={14} />
            <span>对比</span>
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
              value={saveDescription}
              onChange={(e) => setSaveDescription(e.target.value)}
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
                  setSaveDescription('');
                }
              }}
            />
          </div>
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => {
                setShowSaveForm(false);
                setSaveDescription('');
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
              const isRestoreConfirm = restoreConfirmId === version.id;
              const isSelectedBase = selectedVersionIds[0] === version.id;
              const isSelectedCompare = selectedVersionIds[1] === version.id;
              const isSelected = isSelectedBase || isSelectedCompare;

              let borderColor = 'var(--color-border)';
              if (isCurrent) {
                borderColor = 'var(--color-accent)';
              }
              if (isSelectedBase) {
                borderColor = '#2563eb';
              } else if (isSelectedCompare) {
                borderColor = '#9333ea';
              }

              return (
                <div
                  key={version.id}
                  className={`p-3 rounded-lg border transition-all duration-150`}
                  style={{
                    backgroundColor: isSelected
                      ? isSelectedBase
                        ? 'rgba(37, 99, 235, 0.06)'
                        : 'rgba(147, 51, 234, 0.06)'
                      : 'var(--color-bg-tertiary)',
                    borderColor,
                    borderWidth: isSelected ? '2px' : '1px',
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
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      {isSelectedBase && (
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                          style={{
                            backgroundColor: '#dbeafe',
                            color: '#2563eb',
                          }}
                        >
                          基准
                        </span>
                      )}
                      {isSelectedCompare && (
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                          style={{
                            backgroundColor: '#f3e8ff',
                            color: '#9333ea',
                          }}
                        >
                          对比
                        </span>
                      )}
                      {isCurrent && !isSelected && (
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                          style={{
                            backgroundColor: 'var(--color-accent-bg)',
                            color: 'var(--color-accent)',
                          }}
                        >
                          当前
                        </span>
                      )}
                    </div>
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
                          onClick={() => setDeleteConfirmId(null)}
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
                          onClick={() => handleDeleteVersion(version.id)}
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
                  ) : isRestoreConfirm ? (
                    <div className="mt-2 pt-2 border-t" style={{ borderColor: 'var(--color-border)' }}>
                      <p className="text-xs mb-2" style={{ color: 'var(--color-text-primary)' }}>
                        确定要恢复到此版本吗？
                      </p>
                      <p className="text-[11px] mb-2.5" style={{ color: 'var(--color-text-muted)' }}>
                        当前内容将被替换
                      </p>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setRestoreConfirmId(null)}
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
                          onClick={() => handleRestoreVersion(version.id)}
                          className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors"
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
                          <Check size={12} />
                          <span>确认恢复</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleToggleCompareSelection(version.id)}
                        className="flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors"
                        style={{
                          backgroundColor: isSelected
                            ? isSelectedBase
                              ? '#dbeafe'
                              : '#f3e8ff'
                            : 'var(--color-bg-secondary)',
                          color: isSelected
                            ? isSelectedBase
                              ? '#2563eb'
                              : '#9333ea'
                            : 'var(--color-text-muted)',
                          border: isSelected
                            ? `1px solid ${isSelectedBase ? '#2563eb' : '#9333ea'}`
                            : '1px solid transparent',
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
                            e.currentTarget.style.color = 'var(--color-text-primary)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.backgroundColor = 'var(--color-bg-secondary)';
                            e.currentTarget.style.color = 'var(--color-text-muted)';
                            e.currentTarget.style.border = '1px solid transparent';
                          }
                        }}
                        title={isSelected ? '取消选择' : '选择用于对比'}
                      >
                        {isSelected ? <Check size={12} /> : <GitCompare size={12} />}
                        <span>{isSelected ? '已选' : '对比'}</span>
                      </button>
                      {!isCurrent && (
                        <button
                          onClick={() => setRestoreConfirmId(version.id)}
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
                        onClick={() => setDeleteConfirmId(version.id)}
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
