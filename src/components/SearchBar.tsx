import { useState, useCallback, useEffect } from 'react';
import { Search, ChevronUp, ChevronDown, X } from 'lucide-react';
import { useAppStore } from '@/store';

interface SearchBarProps {
  previewRef: React.RefObject<HTMLDivElement | null>;
}

export default function SearchBar({ previewRef }: SearchBarProps) {
  const {
    searchQuery,
    searchMatches,
    currentSearchIndex,
    setSearchQuery,
    setCurrentSearchIndex,
    clearSearch,
  } = useAppStore();
  
  const [inputValue, setInputValue] = useState(searchQuery);
  const [isExpanded, setIsExpanded] = useState(!!searchQuery);

  const handleSearch = useCallback(
    (query: string) => {
      setSearchQuery(query, previewRef.current?.querySelector('.markdown-body') as HTMLElement || null);
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
    setIsExpanded(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClear();
    } else if (e.key === 'Enter' && searchMatches.length > 0) {
      e.preventDefault();
      handleNext();
    }
  };

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        setIsExpanded(true);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  useEffect(() => {
    setInputValue(searchQuery);
  }, [searchQuery]);

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
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
        <span className="hidden md:inline text-xs" style={{ color: 'var(--color-text-muted)' }}>
          Ctrl+F
        </span>
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg transition-all duration-200"
      style={{
        backgroundColor: 'var(--color-bg-tertiary)',
        border: '1px solid var(--color-border)',
      }}
    >
      <Search size={16} style={{ color: 'var(--color-text-muted)' }} />
      <input
        autoFocus
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="搜索关键词..."
        className="w-36 sm:w-48 bg-transparent outline-none text-sm"
        style={{ color: 'var(--color-text-primary)' }}
      />
      {searchMatches.length > 0 && (
        <span
          className="text-xs px-2 py-0.5 rounded"
          style={{
            backgroundColor: 'var(--color-bg-secondary)',
            color: 'var(--color-text-muted)',
          }}
        >
          {currentSearchIndex + 1}/{searchMatches.length}
        </span>
      )}
      {searchMatches.length > 0 && (
        <>
          <button
            type="button"
            onClick={handlePrev}
            className="p-1 rounded transition-colors"
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
            className="p-1 rounded transition-colors"
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
        </>
      )}
      <button
        type="button"
        onClick={handleClear}
        className="p-1 rounded transition-colors"
        style={{ color: 'var(--color-text-muted)' }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
          e.currentTarget.style.color = 'var(--color-text-primary)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.color = 'var(--color-text-muted)';
        }}
        title="清除 (Esc)"
      >
        <X size={16} />
      </button>
    </form>
  );
}
