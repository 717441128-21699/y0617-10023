import { useRef, useEffect, useCallback } from 'react';
import { useAppStore } from '@/store';

interface EditorProps {
  onScroll: (scrollRatio: number) => void;
  scrollRef: React.RefObject<HTMLTextAreaElement | null>;
}

export default function Editor({ onScroll, scrollRef }: EditorProps) {
  const { markdown, setMarkdown } = useAppStore();
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const internalRef = useRef<HTMLTextAreaElement | null>(null);

  const setRefs = useCallback(
    (node: HTMLTextAreaElement | null) => {
      internalRef.current = node;
      if (scrollRef) {
        (scrollRef as React.MutableRefObject<HTMLTextAreaElement | null>).current = node;
      }
    },
    [scrollRef]
  );

  const lineCount = markdown.split('\n').length;
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);

  const handleScroll = () => {
    const textarea = internalRef.current;
    const lineNumbersEl = lineNumbersRef.current;
    if (textarea && lineNumbersEl) {
      lineNumbersEl.scrollTop = textarea.scrollTop;
      const scrollRatio = textarea.scrollTop / (textarea.scrollHeight - textarea.clientHeight || 1);
      onScroll(scrollRatio);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMarkdown(e.target.value);
  };

  useEffect(() => {
    const textarea = internalRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.max(textarea.scrollHeight, textarea.clientHeight)}px`;
    }
  }, [markdown]);

  return (
    <div
      className="flex flex-col h-full border-r"
      style={{
        backgroundColor: 'var(--color-bg-secondary)',
        borderColor: 'var(--color-border)',
      }}
    >
      <div
        className="h-10 flex items-center px-4 border-b text-xs font-medium uppercase tracking-wider"
        style={{
          backgroundColor: 'var(--color-bg-tertiary)',
          borderColor: 'var(--color-border)',
          color: 'var(--color-text-muted)',
        }}
      >
        编辑区
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div
          ref={lineNumbersRef}
          className="py-3 px-3 text-right select-none overflow-hidden border-r"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '13px',
            lineHeight: '1.6',
            color: 'var(--color-text-muted)',
            backgroundColor: 'var(--color-bg-tertiary)',
            borderColor: 'var(--color-border)',
            minWidth: '50px',
          }}
        >
          {lineNumbers.map((num) => (
            <div key={num}>{num}</div>
          ))}
        </div>

        <textarea
          ref={setRefs}
          value={markdown}
          onChange={handleChange}
          onScroll={handleScroll}
          spellCheck={false}
          className="flex-1 py-3 px-4 resize-none outline-none"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '13px',
            lineHeight: '1.6',
            color: 'var(--color-text-primary)',
            backgroundColor: 'var(--color-bg-secondary)',
            caretColor: 'var(--color-accent)',
          }}
          placeholder="在此输入 Markdown..."
        />
      </div>
    </div>
  );
}
