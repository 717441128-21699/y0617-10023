import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  X,
  ChevronUp,
  ChevronDown,
  Settings,
  Filter,
  Hash,
  FileText,
  Code,
  Layers,
  RotateCcw,
} from 'lucide-react';
import { useAppStore } from '@/store';
import type { SearchOptions, SearchScope } from '@/types';

interface SearchPanelProps {
  isOpen: boolean;
  onClose: () => void;
  previewRef: React.RefObject<HTMLDivElement> | null;
}

const DEFAULT_OPTIONS: SearchOptions = {
  scope: 'all',
  caseSensitive: false,
  wholeWord: false,
};

const SCOPE_OPTIONS: { value: SearchScope; label: string; Icon: typeof Layers }[] = [
  { value: 'all', label: '全部', Icon: Layers },
  { value: 'heading', label: '标题', Icon: Hash },
  { value: 'content', label: '正文', Icon: FileText },
  { value: 'code', label: '代码', Icon: Code },
];

const SCOPE_LABELS: Record<SearchScope, string> = {
  all: '全部',
  heading: '标题',
  content: '正文',
  code: '代码',
};

export default function SearchPanel({ isOpen, onClose, previewRef }: SearchPanelProps) {
  const {
    searchQuery,
    searchMatches,
    currentSearchIndex,
    searchOptions,
    setSearchOptions,
    setSearchQuery,
    setCurrentSearchIndex,
    clearSearch,
  } = useAppStore();

  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [localQuery, setLocalQuery] = useState(searchQuery);
  const [showOptions, setShowOptions] = useState(false);

  const handleSearchImmediate = useCallback(
    (query: string) => {
      setSearchQuery(query, previewRef?.current ?? null);
    },
    [setSearchQuery, previewRef]
  );

  const handleSearchDebounced = useCallback(
    (query: string) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        handleSearchImmediate(query);
      }, 200);
    },
    [handleSearchImmediate]
  );

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalQuery(value);
    handleSearchDebounced(value);
  };

  const handleClearInput = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    setLocalQuery('');
    clearSearch();
  }, [clearSearch]);

  const handlePrev = useCallback(() => {
    if (searchMatches.length > 0) {
      setCurrentSearchIndex(currentSearchIndex - 1);
    }
  }, [searchMatches.length, currentSearchIndex, setCurrentSearchIndex]);

  const handleNext = useCallback(() => {
    if (searchMatches.length > 0) {
      setCurrentSearchIndex(currentSearchIndex + 1);
    }
  }, [searchMatches.length, currentSearchIndex, setCurrentSearchIndex]);

  const handleResetOptions = useCallback(() => {
    setSearchOptions(DEFAULT_OPTIONS);
  }, [setSearchOptions]);

  const handleScopeChange = useCallback(
    (scope: SearchScope) => {
      setSearchOptions({ scope });
    },
    [setSearchOptions]
  );

  const handleToggleCaseSensitive = useCallback(() => {
    setSearchOptions({ caseSensitive: !searchOptions.caseSensitive });
  }, [searchOptions.caseSensitive, setSearchOptions]);

  const handleToggleWholeWord = useCallback(() => {
    setSearchOptions({ wholeWord: !searchOptions.wholeWord });
  }, [searchOptions.wholeWord, setSearchOptions]);

  const handleMatchClick = useCallback(
    (index: number) => {
      setCurrentSearchIndex(index);
    },
    [setCurrentSearchIndex]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      clearSearch();
      setLocalQuery('');
      onClose();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (searchMatches.length > 0) {
        if (e.shiftKey) {
          handlePrev();
        } else {
          handleNext();
        }
      }
    }
  };

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        if (isOpen) {
          inputRef.current?.focus();
          if (localQuery) {
            inputRef.current?.select();
          }
        }
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isOpen, localQuery]);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
        if (localQuery) {
          inputRef.current?.select();
        }
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isOpen, localQuery]);

  useEffect(() => {
    setLocalQuery(searchQuery);
  }, [searchQuery]);

  const highlightContext = useMemo(() => {
    return (context: string, query: string) => {
      if (!query.trim()) return context;

      const { caseSensitive, wholeWord } = searchOptions;
      let escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (wholeWord) {
        escapedQuery = `\\b${escapedQuery}\\b`;
      }
      const flags = caseSensitive ? 'g' : 'gi';

      try {
        const regex = new RegExp(`(${escapedQuery})`, flags);
        const parts = context.split(regex);
        return parts.map((part, i) => {
          if (regex.test(part)) {
            return (
              <mark
                key={i}
                className="px-0.5 rounded"
                style={{
                  backgroundColor: '#fef08a',
                  color: '#854d0e',
                }}
              >
                {part}
              </mark>
            );
          }
          return <span key={i}>{part}</span>;
        });
      } catch {
        return context;
      }
    };
  }, [searchOptions]);

  const renderScopeIcon = (scope: SearchScope, size = 12) => {
    switch (scope) {
      case 'heading':
        return <Hash size={size} style={{ color: 'var(--color-accent)' }} />;
      case 'code':
        return <Code size={size} style={{ color: '#a855f7' }} />;
      case 'content':
      case 'all':
      default:
        return <FileText size={size} style={{ color: 'var(--color-text-muted)' }} />;
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="flex flex-col border-r"
      style={{
        backgroundColor: 'var(--color-bg-secondary)',
        borderColor: 'var(--color-border)',
        width: '340px',
        minWidth: '340px',
      }}
    >
      <div
        className="flex items-center justify-between px-3 py-2.5 border-b"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <div className="flex items-center gap-2">
          <Search size={16} style={{ color: 'var(--color-text-primary)' }} />
          <span
            className="text-sm font-semibold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            搜索
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setShowOptions((v) => !v)}
            className="p-1.5 rounded-md transition-colors"
            style={{
              color: showOptions
                ? 'var(--color-accent)'
                : 'var(--color-text-muted)',
              backgroundColor: showOptions
                ? 'var(--color-accent-bg)'
                : 'transparent',
            }}
            onMouseEnter={(e) => {
              if (!showOptions) {
                e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
                e.currentTarget.style.color = 'var(--color-text-primary)';
              }
            }}
            onMouseLeave={(e) => {
              if (!showOptions) {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--color-text-muted)';
              }
            }}
            title="搜索选项"
          >
            <Filter size={15} />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md transition-colors"
            style={{ color: 'var(--color-text-muted)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
              e.currentTarget.style.color = 'var(--color-text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--color-text-muted)';
            }}
            title="关闭"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {showOptions && (
        <div
          className="px-3 py-3 border-b space-y-3"
          style={{
            borderColor: 'var(--color-border)',
            backgroundColor: 'var(--color-bg-tertiary)',
          }}
        >
          <div>
            <div
              className="flex items-center gap-1.5 mb-2 text-xs font-medium"
              style={{ color: 'var(--color-text-muted)' }}
            >
              <Settings size={11} />
              <span>搜索范围</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {SCOPE_OPTIONS.map(({ value, label, Icon }) => {
                const isActive = searchOptions.scope === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => handleScopeChange(value)}
                    className="flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-md text-xs transition-colors"
                    style={{
                      backgroundColor: isActive
                        ? 'var(--color-accent)'
                        : 'var(--color-bg-secondary)',
                      color: isActive
                        ? '#ffffff'
                        : 'var(--color-text-primary)',
                      border: `1px solid ${
                        isActive
                          ? 'var(--color-accent)'
                          : 'var(--color-border)'
                      }`,
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor =
                          'var(--color-bg-hover)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor =
                          'var(--color-bg-secondary)';
                      }
                    }}
                  >
                    <Icon size={14} />
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <button
              type="button"
              onClick={handleToggleCaseSensitive}
              className="w-full flex items-center justify-between px-2.5 py-2 rounded-md transition-colors"
              style={{
                backgroundColor: searchOptions.caseSensitive
                  ? 'var(--color-accent-bg)'
                  : 'var(--color-bg-secondary)',
                border: `1px solid ${
                  searchOptions.caseSensitive
                    ? 'var(--color-accent)'
                    : 'var(--color-border)'
                }`,
              }}
              onMouseEnter={(e) => {
                if (!searchOptions.caseSensitive) {
                  e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
                }
              }}
              onMouseLeave={(e) => {
                if (!searchOptions.caseSensitive) {
                  e.currentTarget.style.backgroundColor =
                    'var(--color-bg-secondary)';
                }
              }}
            >
              <span
                className="text-xs"
                style={{ color: 'var(--color-text-primary)' }}
              >
                区分大小写
              </span>
              <div
                className="relative w-8 h-4 rounded-full transition-colors"
                style={{
                  backgroundColor: searchOptions.caseSensitive
                    ? 'var(--color-accent)'
                    : 'var(--color-border)',
                }}
              >
                <div
                  className="absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all shadow"
                  style={{
                    left: searchOptions.caseSensitive ? '18px' : '2px',
                  }}
                />
              </div>
            </button>
          </div>

          <div>
            <button
              type="button"
              onClick={handleToggleWholeWord}
              className="w-full flex items-center justify-between px-2.5 py-2 rounded-md transition-colors"
              style={{
                backgroundColor: searchOptions.wholeWord
                  ? 'var(--color-accent-bg)'
                  : 'var(--color-bg-secondary)',
                border: `1px solid ${
                  searchOptions.wholeWord
                    ? 'var(--color-accent)'
                    : 'var(--color-border)'
                }`,
              }}
              onMouseEnter={(e) => {
                if (!searchOptions.wholeWord) {
                  e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
                }
              }}
              onMouseLeave={(e) => {
                if (!searchOptions.wholeWord) {
                  e.currentTarget.style.backgroundColor =
                    'var(--color-bg-secondary)';
                }
              }}
            >
              <span
                className="text-xs"
                style={{ color: 'var(--color-text-primary)' }}
              >
                全词匹配
              </span>
              <div
                className="relative w-8 h-4 rounded-full transition-colors"
                style={{
                  backgroundColor: searchOptions.wholeWord
                    ? 'var(--color-accent)'
                    : 'var(--color-border)',
                }}
              >
                <div
                  className="absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all shadow"
                  style={{
                    left: searchOptions.wholeWord ? '18px' : '2px',
                  }}
                />
              </div>
            </button>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={handleResetOptions}
              className="text-xs px-2 py-1 rounded transition-colors"
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
              重置选项
            </button>
          </div>
        </div>
      )}

      <div
        className="px-3 py-2.5 border-b"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <div className="flex items-center gap-1.5">
          <div
            className="flex-1 flex items-center gap-1.5 px-3 py-2 rounded-lg"
            style={{
              backgroundColor: 'var(--color-bg-tertiary)',
              border: '1px solid var(--color-border)',
            }}
          >
            <Search size={14} style={{ color: 'var(--color-text-muted)' }} />
            <input
              ref={inputRef}
              type="text"
              value={localQuery}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="搜索关键词..."
              className="flex-1 bg-transparent outline-none text-sm"
              style={{ color: 'var(--color-text-primary)' }}
            />
            {localQuery && (
              <button
                type="button"
                onClick={handleClearInput}
                className="p-0.5 rounded transition-colors"
                style={{ color: 'var(--color-text-muted)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--color-text-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--color-text-muted)';
                }}
                title="清空"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {searchMatches.length > 0 && (
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrev}
                className="flex items-center gap-1 px-2 py-1 rounded-md transition-colors"
                style={{
                  color: 'var(--color-text-muted)',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-bg-tertiary)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
                  e.currentTarget.style.color = 'var(--color-text-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor =
                    'var(--color-bg-tertiary)';
                  e.currentTarget.style.color = 'var(--color-text-muted)';
                }}
                title="上一个 (Shift+Enter)"
              >
                <ChevronUp size={13} />
                <span className="text-xs">
                  {currentSearchIndex + 1}/{searchMatches.length}
                </span>
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-1 px-2 py-1 rounded-md transition-colors"
                style={{
                  color: 'var(--color-text-muted)',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-bg-tertiary)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
                  e.currentTarget.style.color = 'var(--color-text-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor =
                    'var(--color-bg-tertiary)';
                  e.currentTarget.style.color = 'var(--color-text-muted)';
                }}
                title="下一个 (Enter)"
              >
                <span className="text-xs">
                  {currentSearchIndex + 1}/{searchMatches.length}
                </span>
                <ChevronDown size={13} />
              </button>
            </div>
            <span
              className="text-xs"
              style={{ color: 'var(--color-text-muted)' }}
            >
              共找到 {searchMatches.length} 个匹配
            </span>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {!localQuery.trim() ? (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <Search
              size={32}
              style={{ color: 'var(--color-text-muted)' }}
              className="mb-3 opacity-50"
            />
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              输入关键词开始搜索
            </p>
            <p
              className="text-xs mt-1"
              style={{ color: 'var(--color-text-muted)' }}
            >
              支持 Ctrl+F 快速打开
            </p>
          </div>
        ) : searchMatches.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <X
              size={32}
              style={{ color: 'var(--color-text-muted)' }}
              className="mb-3 opacity-50"
            />
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              未找到匹配结果
            </p>
            <p
              className="text-xs mt-1"
              style={{ color: 'var(--color-text-muted)' }}
            >
              尝试更换关键词或调整搜索范围
            </p>
          </div>
        ) : (
          <div className="p-2 space-y-1.5">
            {searchMatches.map((match) => {
              const isActive = currentSearchIndex === match.index;
              return (
                <button
                  key={match.index}
                  type="button"
                  onClick={() => handleMatchClick(match.index)}
                  className={`w-full text-left p-2.5 rounded-lg transition-all duration-150 border`}
                  style={{
                    backgroundColor: isActive
                      ? 'var(--color-accent-bg)'
                      : 'var(--color-bg-tertiary)',
                    borderColor: isActive
                      ? 'var(--color-accent)'
                      : 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor =
                        'var(--color-bg-hover)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor =
                        'var(--color-bg-tertiary)';
                    }
                  }}
                >
                  <div className="flex items-center gap-1.5 mb-1.5">
                    {renderScopeIcon(match.scope, 12)}
                    <span
                      className="text-xs font-medium truncate flex-1"
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      {match.heading || '文档开头'}
                    </span>
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded shrink-0"
                      style={{
                        backgroundColor:
                          match.scope === 'heading'
                            ? 'var(--color-accent-bg)'
                            : match.scope === 'code'
                            ? '#f3e8ff'
                            : 'var(--color-bg-secondary)',
                        color:
                          match.scope === 'heading'
                            ? 'var(--color-accent)'
                            : match.scope === 'code'
                            ? '#9333ea'
                            : 'var(--color-text-muted)',
                      }}
                    >
                      {SCOPE_LABELS[match.scope]}
                    </span>
                  </div>
                  <p
                    className="text-sm leading-relaxed break-words"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    {highlightContext(match.context, localQuery)}
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div
        className="px-2 py-2 border-t flex items-center justify-between gap-2"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <button
          type="button"
          onClick={() => {
            clearSearch();
            setLocalQuery('');
          }}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs transition-colors"
          style={{
            color: 'var(--color-text-muted)',
            border: '1px solid var(--color-border)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
            e.currentTarget.style.color = 'var(--color-text-primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = 'var(--color-text-muted)';
          }}
          title="清空所有"
        >
          <RotateCcw size={12} />
          <span>清空所有</span>
        </button>
        <button
          type="button"
          onClick={onClose}
          className="px-2.5 py-1.5 rounded-md text-xs transition-colors"
          style={{
            color: 'var(--color-text-muted)',
            border: '1px solid var(--color-border)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
            e.currentTarget.style.color = 'var(--color-text-primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = 'var(--color-text-muted)';
          }}
        >
          收起
        </button>
      </div>
    </div>
  );
}
