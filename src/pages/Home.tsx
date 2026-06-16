import { useEffect, useRef, useState, useCallback } from 'react';
import Toolbar from '@/components/Toolbar';
import Outline from '@/components/Outline';
import Editor from '@/components/Editor';
import Preview from '@/components/Preview';
import SearchPanel from '@/components/SearchPanel';
import { useAppStore } from '@/store';

export default function Home() {
  const { theme, setTheme, outline, searchQuery, clearSearchHighlightsInDom } = useAppStore();
  const previewRef = useRef<HTMLDivElement>(null);
  const editorScrollRef = useRef<HTMLTextAreaElement>(null);
  const [scrollRatio, setScrollRatio] = useState(0);
  const [activeHeadingId, setActiveHeadingId] = useState<string | null>(null);
  const [searchPanelOpen, setSearchPanelOpen] = useState(!!searchQuery);
  const isProgrammaticScroll = useRef(false);
  const scrollTimeout = useRef<number | null>(null);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }, [theme]);

  useEffect(() => {
    if (searchQuery) {
      setSearchPanelOpen(true);
    }
  }, [searchQuery]);

  useEffect(() => {
    return () => {
      const previewEl = document.querySelector('.markdown-body') as HTMLElement | null;
      if (previewEl) {
        clearSearchHighlightsInDom(previewEl);
      }
    };
  }, [clearSearchHighlightsInDom]);

  const handleToggleSearchPanel = useCallback(() => {
    setSearchPanelOpen((prev) => {
      if (prev) {
        const previewEl = document.querySelector('.markdown-body') as HTMLElement | null;
        if (previewEl) {
          clearSearchHighlightsInDom(previewEl);
        }
      }
      return !prev;
    });
  }, [clearSearchHighlightsInDom]);

  const handleEditorScroll = useCallback((ratio: number) => {
    if (isProgrammaticScroll.current) return;
    setScrollRatio(ratio);
    
    const previewContainer = previewRef.current;
    if (previewContainer) {
      isProgrammaticScroll.current = true;
      previewContainer.scrollTop = ratio * (previewContainer.scrollHeight - previewContainer.clientHeight);
      
      if (scrollTimeout.current) {
        window.clearTimeout(scrollTimeout.current);
      }
      scrollTimeout.current = window.setTimeout(() => {
        isProgrammaticScroll.current = false;
      }, 100);
    }
  }, []);

  const handlePreviewScroll = useCallback(() => {
    const previewContainer = previewRef.current;
    if (!previewContainer || isProgrammaticScroll.current) return;

    const ratio = previewContainer.scrollTop / (previewContainer.scrollHeight - previewContainer.clientHeight || 1);
    setScrollRatio(ratio);

    const editor = editorScrollRef.current;
    if (editor) {
      isProgrammaticScroll.current = true;
      editor.scrollTop = ratio * (editor.scrollHeight - editor.clientHeight);
      
      if (scrollTimeout.current) {
        window.clearTimeout(scrollTimeout.current);
      }
      scrollTimeout.current = window.setTimeout(() => {
        isProgrammaticScroll.current = false;
      }, 100);
    }

    if (outline.length === 0) return;

    let currentHeading: string | null = null;
    for (let i = outline.length - 1; i >= 0; i--) {
      const heading = document.getElementById(outline[i].id);
      if (heading) {
        const rect = heading.getBoundingClientRect();
        const previewRect = previewContainer.getBoundingClientRect();
        if (rect.top <= previewRect.top + 100) {
          currentHeading = outline[i].id;
          break;
        }
      }
    }
    setActiveHeadingId(currentHeading || outline[0]?.id || null);
  }, [outline]);

  useEffect(() => {
    const previewContainer = previewRef.current;
    if (previewContainer) {
      previewContainer.addEventListener('scroll', handlePreviewScroll, { passive: true });
      return () => previewContainer.removeEventListener('scroll', handlePreviewScroll);
    }
  }, [handlePreviewScroll]);

  const handleNavigate = useCallback((id: string) => {
    const element = document.getElementById(id);
    const previewContainer = previewRef.current;
    if (element && previewContainer) {
      isProgrammaticScroll.current = true;
      const rect = element.getBoundingClientRect();
      const containerRect = previewContainer.getBoundingClientRect();
      const scrollTop = previewContainer.scrollTop + (rect.top - containerRect.top) - 20;
      previewContainer.scrollTo({ top: scrollTop, behavior: 'smooth' });
      setActiveHeadingId(id);
      
      if (scrollTimeout.current) {
        window.clearTimeout(scrollTimeout.current);
      }
      scrollTimeout.current = window.setTimeout(() => {
        isProgrammaticScroll.current = false;
      }, 500);
    }
  }, []);

  return (
    <div
      className="h-screen flex flex-col"
      style={{ backgroundColor: 'var(--color-bg-primary)' }}
    >
      <Toolbar
        previewRef={previewRef}
        onToggleSearchPanel={handleToggleSearchPanel}
        searchPanelOpen={searchPanelOpen}
      />

      <div className="flex-1 flex overflow-hidden">
        {searchPanelOpen && (
          <SearchPanel previewRef={previewRef} />
        )}

        <Outline onNavigate={handleNavigate} activeHeadingId={activeHeadingId} />

        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 min-w-0">
            <Editor onScroll={handleEditorScroll} scrollRef={editorScrollRef} />
          </div>

          <div className="flex-1 min-w-0 border-l" style={{ borderColor: 'var(--color-border)' }}>
            <Preview ref={previewRef} scrollRatio={scrollRatio} />
          </div>
        </div>
      </div>
    </div>
  );
}
