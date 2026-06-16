import { create } from 'zustand';
import { marked } from 'marked';
import { markedHighlight } from 'marked-highlight';
import hljs from 'highlight.js';
import type { HeadingItem, Theme, Document } from '@/types';
import { defaultMarkdown } from '@/utils/defaultContent';

marked.use(
  markedHighlight({
    langPrefix: 'hljs language-',
    highlight(code, lang) {
      const language = hljs.getLanguage(lang) ? lang : 'plaintext';
      return hljs.highlight(code, { language }).value;
    },
  })
);

marked.setOptions({
  gfm: true,
  breaks: true,
});

interface AppState {
  markdown: string;
  html: string;
  outline: HeadingItem[];
  theme: Theme;
  documents: Document[];
  currentDocId: string;
  searchQuery: string;
  searchMatches: { element: HTMLElement; index: number }[];
  currentSearchIndex: number;
  setMarkdown: (markdown: string) => void;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  parseMarkdown: (markdown: string) => string;
  extractOutline: (markdown: string) => HeadingItem[];
  setSearchQuery: (query: string, previewElement: HTMLElement | null) => void;
  setCurrentSearchIndex: (index: number) => void;
  clearSearch: () => void;
  createDocument: () => void;
  renameDocument: (id: string, name: string) => void;
  deleteDocument: (id: string) => void;
  switchDocument: (id: string) => void;
}

const STORAGE_KEY_DOCS = 'md-editor-documents';
const STORAGE_KEY_CURRENT_DOC = 'md-editor-current-doc';
const STORAGE_KEY_THEME = 'md-editor-theme';

const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\u4e00-\u9fa5\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
};

const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

const removeCodeBlocks = (markdown: string): string => {
  const lines = markdown.split('\n');
  const result: string[] = [];
  let inCodeBlock = false;

  for (const line of lines) {
    if (line.trim().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (!inCodeBlock) {
      result.push(line);
    }
  }

  return result.join('\n');
};

const parseMarkdownToHtml = (markdown: string): string => {
  let headingIndex = 0;
  const headingMap = new Map<string, number>();

  const renderer = new marked.Renderer();

  renderer.heading = (tokens) => {
    const text = tokens.text;
    const level = tokens.depth;
    let baseId = slugify(text);
    if (!baseId) {
      baseId = `heading-${headingIndex}`;
    }
    
    let id = baseId;
    const count = headingMap.get(baseId) || 0;
    if (count > 0) {
      id = `${baseId}-${count}`;
    }
    headingMap.set(baseId, count + 1);
    headingIndex++;

    return `<h${level} id="${id}">${text}</h${level}>\n`;
  };

  return marked.parse(markdown, { renderer }) as string;
};

const extractOutlineFromMarkdown = (markdown: string): HeadingItem[] => {
  const cleanedMarkdown = removeCodeBlocks(markdown);
  const headingRegex = /^(#{1,6})\s+(.+)$/gm;
  const headings: HeadingItem[] = [];
  const headingMap = new Map<string, number>();
  let match;

  while ((match = headingRegex.exec(cleanedMarkdown)) !== null) {
    const level = match[1].length as 1 | 2 | 3 | 4 | 5 | 6;
    const text = match[2].trim();
    let baseId = slugify(text);
    if (!baseId) {
      baseId = `heading-${headings.length}`;
    }
    
    let id = baseId;
    const count = headingMap.get(baseId) || 0;
    if (count > 0) {
      id = `${baseId}-${count}`;
    }
    headingMap.set(baseId, count + 1);

    headings.push({ id, text, level });
  }

  return headings;
};

const loadDocumentsFromStorage = (): { docs: Document[]; currentId: string } => {
  if (typeof localStorage === 'undefined') {
    return {
      docs: [
        {
          id: generateId(),
          name: '未命名文档',
          content: defaultMarkdown,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ],
      currentId: '',
    };
  }

  try {
    const saved = localStorage.getItem(STORAGE_KEY_DOCS);
    const currentId = localStorage.getItem(STORAGE_KEY_CURRENT_DOC);
    
    if (saved) {
      const docs = JSON.parse(saved) as Document[];
      if (docs.length > 0) {
        return {
          docs,
          currentId: currentId && docs.some((d) => d.id === currentId) ? currentId : docs[0].id,
        };
      }
    }
  } catch {
    // ignore
  }

  const defaultDoc: Document = {
    id: generateId(),
    name: '未命名文档',
    content: defaultMarkdown,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  return { docs: [defaultDoc], currentId: defaultDoc.id };
};

const saveDocumentsToStorage = (docs: Document[], currentId: string): void => {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_DOCS, JSON.stringify(docs));
    localStorage.setItem(STORAGE_KEY_CURRENT_DOC, currentId);
  } catch {
    // ignore
  }
};

const highlightSearchMatches = (
  element: HTMLElement,
  query: string
): { element: HTMLElement; index: number }[] => {
  const matches: { element: HTMLElement; index: number }[] = [];
  
  if (!query.trim()) {
    return matches;
  }

  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!node.nodeValue || !node.nodeValue.trim()) {
        return NodeFilter.FILTER_REJECT;
      }
      const parent = node.parentElement;
      if (parent && (parent.tagName === 'SCRIPT' || parent.tagName === 'STYLE' || parent.classList.contains('search-highlight'))) {
        return NodeFilter.FILTER_REJECT;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  const textNodes: Text[] = [];
  let currentNode: Node | null = walker.nextNode();
  while (currentNode) {
    textNodes.push(currentNode as Text);
    currentNode = walker.nextNode();
  }

  const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
  let matchIndex = 0;

  for (const textNode of textNodes) {
    const text = textNode.nodeValue;
    if (!text) continue;

    regex.lastIndex = 0;
    let match: RegExpExecArray | null;
    const fragments: (string | HTMLElement)[] = [];
    let lastIndex = 0;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        fragments.push(text.slice(lastIndex, match.index));
      }

      const span = document.createElement('span');
      span.className = 'search-highlight';
      span.textContent = match[0];
      span.dataset.searchIndex = String(matchIndex);
      fragments.push(span);

      matches.push({ element: span, index: matchIndex });
      matchIndex++;
      lastIndex = match.index + match[0].length;
    }

    if (fragments.length > 0) {
      if (lastIndex < text.length) {
        fragments.push(text.slice(lastIndex));
      }

      const parent = textNode.parentNode;
      if (parent) {
        for (const fragment of fragments) {
          if (typeof fragment === 'string') {
            parent.insertBefore(document.createTextNode(fragment), textNode);
          } else {
            parent.insertBefore(fragment, textNode);
          }
        }
        parent.removeChild(textNode);
      }
    }
  }

  return matches;
};

const clearSearchHighlights = (element: HTMLElement): void => {
  const highlights = element.querySelectorAll('.search-highlight');
  highlights.forEach((el) => {
    const span = el as HTMLElement;
    const parent = span.parentNode;
    if (parent) {
      const text = document.createTextNode(span.textContent || '');
      parent.replaceChild(text, span);
      parent.normalize();
    }
  });
};

export const useAppStore = create<AppState>((set, get) => {
  const savedTheme = (typeof localStorage !== 'undefined' 
    ? localStorage.getItem(STORAGE_KEY_THEME) as Theme | null 
    : null) || 'light';
  
  const { docs, currentId } = loadDocumentsFromStorage();
  const currentDoc = docs.find((d) => d.id === currentId) || docs[0];
  
  const initialHtml = parseMarkdownToHtml(currentDoc.content);
  const initialOutline = extractOutlineFromMarkdown(currentDoc.content);

  return {
    markdown: currentDoc.content,
    html: initialHtml,
    outline: initialOutline,
    theme: savedTheme,
    documents: docs,
    currentDocId: currentDoc.id,
    searchQuery: '',
    searchMatches: [],
    currentSearchIndex: -1,

    setMarkdown: (markdown: string) => {
      const { currentDocId, documents, searchQuery } = get();
      const html = get().parseMarkdown(markdown);
      const outline = get().extractOutline(markdown);
      
      const updatedDocs = documents.map((doc) =>
        doc.id === currentDocId
          ? { ...doc, content: markdown, updatedAt: Date.now() }
          : doc
      );
      
      saveDocumentsToStorage(updatedDocs, currentDocId);
      set({ markdown, html, outline, documents: updatedDocs });
      
      if (searchQuery && typeof setTimeout) {
        setTimeout(() => {
          const currentState = get();
          if (currentState.searchQuery === searchQuery) {
            const previewEl = document.querySelector('.markdown-body') as HTMLElement | null;
            if (previewEl) {
              currentState.setSearchQuery(searchQuery, previewEl.parentElement);
            }
          }
        }, 0);
      }
    },

    setTheme: (theme: Theme) => {
      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-theme', theme);
      }
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_THEME, theme);
      }
      set({ theme });
    },

    toggleTheme: () => {
      const newTheme = get().theme === 'light' ? 'dark' : 'light';
      get().setTheme(newTheme);
    },

    parseMarkdown: parseMarkdownToHtml,
    extractOutline: extractOutlineFromMarkdown,

    setSearchQuery: (query: string, previewElement: HTMLElement | null) => {
      const { searchQuery } = get();
      
      if (previewElement && searchQuery) {
        clearSearchHighlights(previewElement);
      }

      if (!query.trim()) {
        set({ searchQuery: '', searchMatches: [], currentSearchIndex: -1 });
        return;
      }

      let matches: { element: HTMLElement; index: number }[] = [];
      if (previewElement) {
        matches = highlightSearchMatches(previewElement, query);
      }

      set({
        searchQuery: query,
        searchMatches: matches,
        currentSearchIndex: matches.length > 0 ? 0 : -1,
      });
    },

    setCurrentSearchIndex: (index: number) => {
      const { searchMatches } = get();
      if (searchMatches.length === 0) return;
      
      const normalizedIndex = ((index % searchMatches.length) + searchMatches.length) % searchMatches.length;
      set({ currentSearchIndex: normalizedIndex });
      
      const match = searchMatches[normalizedIndex];
      if (match && match.element) {
        match.element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        match.element.classList.add('search-highlight-active');
        
        searchMatches.forEach((m, i) => {
          if (i !== normalizedIndex && m.element) {
            m.element.classList.remove('search-highlight-active');
          }
        });
      }
    },

    clearSearch: () => {
      set({ searchQuery: '', searchMatches: [], currentSearchIndex: -1 });
    },

    createDocument: () => {
      const { documents, currentDocId } = get();
      const newDoc: Document = {
        id: generateId(),
        name: `未命名文档 ${documents.length + 1}`,
        content: '# 新文档\n\n开始编写你的内容...',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const updatedDocs = [...documents, newDoc];
      saveDocumentsToStorage(updatedDocs, newDoc.id);
      
      const html = parseMarkdownToHtml(newDoc.content);
      const outline = extractOutlineFromMarkdown(newDoc.content);
      
      set({
        documents: updatedDocs,
        currentDocId: newDoc.id,
        markdown: newDoc.content,
        html,
        outline,
        searchQuery: '',
        searchMatches: [],
        currentSearchIndex: -1,
      });
    },

    renameDocument: (id: string, name: string) => {
      const { documents, currentDocId } = get();
      const updatedDocs = documents.map((doc) =>
        doc.id === id ? { ...doc, name: name.trim() || '未命名文档', updatedAt: Date.now() } : doc
      );
      saveDocumentsToStorage(updatedDocs, currentDocId);
      set({ documents: updatedDocs });
    },

    deleteDocument: (id: string) => {
      const { documents, currentDocId } = get();
      if (documents.length <= 1) return;

      const updatedDocs = documents.filter((doc) => doc.id !== id);
      let newCurrentId = currentDocId;
      
      if (currentDocId === id) {
        newCurrentId = updatedDocs[0].id;
      }

      saveDocumentsToStorage(updatedDocs, newCurrentId);
      
      if (currentDocId === id) {
        const newDoc = updatedDocs[0];
        const html = parseMarkdownToHtml(newDoc.content);
        const outline = extractOutlineFromMarkdown(newDoc.content);
        set({
          documents: updatedDocs,
          currentDocId: newCurrentId,
          markdown: newDoc.content,
          html,
          outline,
          searchQuery: '',
          searchMatches: [],
          currentSearchIndex: -1,
        });
      } else {
        set({ documents: updatedDocs });
      }
    },

    switchDocument: (id: string) => {
      const { documents } = get();
      const doc = documents.find((d) => d.id === id);
      if (!doc) return;

      saveDocumentsToStorage(documents, id);
      
      const html = parseMarkdownToHtml(doc.content);
      const outline = extractOutlineFromMarkdown(doc.content);
      
      set({
        currentDocId: id,
        markdown: doc.content,
        html,
        outline,
        searchQuery: '',
        searchMatches: [],
        currentSearchIndex: -1,
      });
    },
  };
});
