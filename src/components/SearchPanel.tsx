import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  Search, ChevronUp, ChevronDown, X, List, FileText, Hash
} from 'lucide-react';
import { useAppStore } from '@/store';
import type { SearchMatchItem } from '@/types';

interface SearchPanelProps {
  previewRef: React.RefObject<HTMLDivElement | null>;
}

interface SearchGroup {
  heading: string;
  matches: SearchMatchItem[];
}

export default function SearchPanel({ previewRef }: SearchPanelProps) {
  const {
    searchQuery,
    searchMatches,
    currentSearchIndex,
    setSearchQuery,
    setCurrentSearchIndex,
    clearSearch,
  } = useAppStore();

  const [inputValue, setInputValue] = useState(searchQuery);
  const [isOpen, setIsOpen] = useState(!!searchQuery);

  const groupedMatches = useMemo(() => {
    const groups = new Map<string, SearchMatchItem[]>();
    searchMatches.forEach((match) => {
      const key = match.heading || '文档开头';
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(match);
    });
    const result: SearchGroup[] = [];
    groups.forEach((matches, heading) => {
      result.push({ heading, matches });
    });
    return result;
  }, [searchMatches]);

  const handleSearch = useCallback(
    (query: string) => {
      setSearchQuery(query, previewRef.current);
    },
    [setSearchQuery, previewRef]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(inputValue);
  };

  const handlePrev = () => {
    if (searchMatches.length > 0) {
      setCurrentSearchIndex(currentSearchIndex - 1);
    }
  };

  const handleNext = () => {
    if (searchMatches.length > 0) {
      setCurrentSearchIndex(currentSearchIndex + 1);
    }
  };

  const handleClear = () => {
    setInputValue('');
    clearSearch();
    setIsOpen(false);
  };

  const handleMatchClick = (index: number) => {
    setCurrentSearchIndex(index);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClear();
    } else if (e.key === 'Enter' && searchMatches.length > 0) {
      e.preventDefault();
      if (e.shiftKey) {
        handlePrev();
      } else {
        handleNext();
      }
    }
  };

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        setIsOpen(true);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  useEffect(() => {
    setInputValue(searchQuery);
    if (searchQuery && !isOpen) {
      setIsOpen(true);
    }
  }, [searchQuery, isOpen]);

  const highlightContext = (context: string, query: string) => {
    if (!query.trim()) return context;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
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
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200"
        style={{
          backgroundColor: 'var(--color-bg-tertiary)',
          color: 'var(--color-text-muted)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
          e.currentTarget.style.color = 'var(--color-text-primary)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--color-bg-tertiary)';
          e.currentTarget.style.color = 'var(--color-text-muted)';
        }}
        title="搜索 (Ctrl+F)"
      >
        <Search size={16} />
        <span className="hidden sm:inline">搜索</span>
        <span
          className="hidden md:inline text-xs px-1.5 py-0.5 rounded"
          style={{
            backgroundColor: 'var(--color-bg-hover)',
            color: 'var(--color-text-muted)',
          }}
        >
          Ctrl+F
        </span>
      </button>
    );
  }

  return (
    <div
      className="flex flex-col border-r"
      style={{
        backgroundColor: 'var(--color-bg-secondary)',
        borderColor: 'var(--color-border)',
        width: '300px',
        minWidth: '300px',
      }}
    >
      <div
        className="p-3 border-b"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <form onSubmit={handleSubmit} className="flex items-center gap-1.5">
          <div
            className="flex-1 flex items-center gap-1.5 px-3 py-2 rounded-lg"
            style={{
              backgroundColor: 'var(--color-bg-tertiary)',
              border: '1px solid var(--color-border)',
            }}
          >
            <Search size={14} style={{ color: 'var(--color-text-muted)' }} />
            <input
              autoFocus
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="搜索关键词..."
              className="flex-1 bg-transparent outline-none text-sm"
              style={{ color: 'var(--color-text-primary)' }}
            />
            {searchMatches.length > 0 && (
              <span
                className="text-xs px-1.5 py-0.5 rounded"
                style={{
                  backgroundColor: 'var(--color-bg-secondary)',
                  color: 'var(--color-text-muted)',
                }}
              >
                {currentSearchIndex + 1}/{searchMatches.length}
              </span>
            )}
            {inputValue && (
              <button
                type="button"
                onClick={handleClear}
                className="p-0.5 rounded transition-colors"
                style={{ color: 'var(--color-text-muted)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--color-text-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--color-text-muted)';
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>
          {searchMatches.length > 0 && (
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={handlePrev}
                className="p-2 rounded-lg transition-colors"
                style={{ color: 'var(--color-text-muted)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
                  e.currentTarget.style.color = 'var(--color-text-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--color-text-muted)';
                }}
                title="上一个 (Shift+Enter)"
              >
                <ChevronUp size={16} />
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="p-2 rounded-lg transition-colors"
                style={{ color: 'var(--color-text-muted)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
                  e.currentTarget.style.color = 'var(--color-text-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--color-text-muted)';
                }}
                title="下一个 (Enter)"
              >
                <ChevronDown size={16} />
              </button>
            </div>
          )}
        </form>
      </div>

      <div className="flex-1 overflow-y-auto">
        {!searchQuery.trim() ? (
          <div
            className="flex flex-col items-center justify-center h-full p-6 text-center"
          >
            <Search size={32} style={{ color: 'var(--color-text-muted)' }} className="mb-3 opacity-50" />
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              输入关键词开始搜索
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
              支持 Ctrl+F 快速打开
            </p>
          </div>
        ) : searchMatches.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center h-full p-6 text-center"
          >
            <X size={32} style={{ color: 'var(--color-text-muted)' }} className="mb-3 opacity-50" />
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              未找到匹配结果
            </p>
            <p
              className="text-xs mt-1"
              style={{ color: 'var(--color-text-muted)' }}
            >
              尝试更换关键词
            </p>
          </div>
        ) : (
          <div className="p-2">
            {groupedMatches.map((group, groupIdx) => (
              <div key={groupIdx} className="mb-3 last:mb-0">
                <div
                  className="flex items-center gap-1.5 px-2 py-1.5 text-xs font-medium"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  <Hash size={12} />
                  <span className="truncate">{group.heading}</span>
                  <span
                    className="ml-auto px-1.5 py-0.5 rounded text-[10px]"
                    style={{
                      backgroundColor: 'var(--color-bg-tertiary)',
                    }}
                  >
                    {group.matches.length}
                  </span>
                </div>
                <div className="space-y-1">
                  {group.matches.map((match) => (
                    <button
                      key={match.index}
                      onClick={() => handleMatchClick(match.index)}
                      className={`w-full text-left p-2.5 rounded-lg transition-all duration-150 border ${
                        currentSearchIndex === match.index
                          ? ''
                          : 'border-transparent'
                      }`}
                      style={{
                        backgroundColor:
                          currentSearchIndex === match.index
                            ? 'var(--color-accent-bg)'
                            : 'var(--color-bg-tertiary)',
                        borderColor:
                          currentSearchIndex === match.index
                            ? 'var(--color-accent)'
                            : 'transparent',
                      }}
                      onMouseEnter={(e) => {
                        if (currentSearchIndex !== match.index) {
                          e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (currentSearchIndex !== match.index) {
                          e.currentTarget.style.backgroundColor = 'var(--color-bg-tertiary)';
                        }
                      }}
                    >
                      <div
                        className="flex items-center gap-1.5 mb-1 text-xs"
                        style={{ color: 'var(--color-text-muted)' }}
                      >
                        <List size={10} />
                        <span>匹配 #{match.index + 1}</span>
                      </div>
                      <p
                        className="text-sm leading-relaxed break-words"
                        style={{ color: 'var(--color-text-primary)' }}
                      >
                        {highlightContext(match.context, searchQuery)}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div
        className="p-2 border-t flex items-center justify-between"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
          <FileText size={12} />
          <span>
            {searchMatches.length > 0
              ? `共 ${searchMatches.length} 个结果`
              : '暂无结果'}
          </span>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="text-xs px-2 py-1 rounded transition-colors"
          style={{ color: 'var(--color-text-muted)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-bg-tertiary)';
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
