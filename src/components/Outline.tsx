import { useState, useEffect } from 'react';
import { List, ChevronRight } from 'lucide-react';
import { useAppStore } from '@/store';
import type { HeadingItem } from '@/types';

interface OutlineProps {
  onNavigate: (id: string) => void;
  activeHeadingId: string | null;
}

export default function Outline({ onNavigate, activeHeadingId }: OutlineProps) {
  const { outline, theme } = useAppStore();
  const [collapsed, setCollapsed] = useState(false);

  const getIndent = (level: number) => {
    return `${(level - 1) * 12}px`;
  };

  const getFontSize = (level: number) => {
    const sizes: Record<number, string> = {
      1: '14px',
      2: '13.5px',
      3: '13px',
      4: '12.5px',
      5: '12px',
      6: '11.5px',
    };
    return sizes[level] || '12px';
  };

  const getFontWeight = (level: number) => {
    return level <= 2 ? 600 : 500;
  };

  if (collapsed) {
    return (
      <div
        className="w-10 flex flex-col items-center py-2 border-r cursor-pointer transition-all duration-200"
        style={{
          backgroundColor: 'var(--color-bg-secondary)',
          borderColor: 'var(--color-border)',
        }}
        onClick={() => setCollapsed(false)}
      >
        <ChevronRight size={18} style={{ color: 'var(--color-text-muted)' }} />
        <List size={16} className="mt-2" style={{ color: 'var(--color-text-muted)' }} />
      </div>
    );
  }

  return (
    <aside
      className="w-56 flex flex-col border-r transition-all duration-200"
      style={{
        backgroundColor: 'var(--color-bg-secondary)',
        borderColor: 'var(--color-border)',
      }}
    >
      <div
        className="h-10 flex items-center justify-between px-3 border-b"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <div className="flex items-center gap-1.5">
          <List size={15} style={{ color: 'var(--color-text-secondary)' }} />
          <span
            className="text-sm font-medium"
            style={{ color: 'var(--color-text-primary)' }}
          >
            大纲
          </span>
        </div>
        <button
          onClick={() => setCollapsed(true)}
          className="p-1 rounded transition-colors"
          style={{ color: 'var(--color-text-muted)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <ChevronRight size={14} />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-2">
        {outline.length === 0 ? (
          <div
            className="px-3 py-2 text-xs"
            style={{ color: 'var(--color-text-muted)' }}
          >
            暂无标题
          </div>
        ) : (
          outline.map((item: HeadingItem, index: number) => (
            <button
              key={`${item.id}-${index}`}
              onClick={() => onNavigate(item.id)}
              className="w-full text-left py-1.5 pr-2 transition-all duration-150 border-l-2"
              style={{
                paddingLeft: `calc(12px + ${getIndent(item.level)})`,
                fontSize: getFontSize(item.level),
                fontWeight: getFontWeight(item.level),
                color:
                  activeHeadingId === item.id
                    ? 'var(--color-accent)'
                    : 'var(--color-text-secondary)',
                backgroundColor:
                  activeHeadingId === item.id
                    ? 'var(--color-accent-bg)'
                    : 'transparent',
                borderColor:
                  activeHeadingId === item.id
                    ? 'var(--color-accent)'
                    : 'transparent',
              }}
              onMouseEnter={(e) => {
                if (activeHeadingId !== item.id) {
                  e.currentTarget.style.backgroundColor = 'var(--color-bg-tertiary)';
                  e.currentTarget.style.color = 'var(--color-text-primary)';
                }
              }}
              onMouseLeave={(e) => {
                if (activeHeadingId !== item.id) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--color-text-secondary)';
                }
              }}
            >
              {item.text}
            </button>
          ))
        )}
      </nav>
    </aside>
  );
}
