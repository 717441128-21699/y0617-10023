import { create } from 'zustand';
import { marked } from 'marked';
import { markedHighlight } from 'marked-highlight';
import hljs from 'highlight.js';
import type { HeadingItem, Theme, Document, DocumentVersion, Folder, SearchMatchItem, SortType, DocumentFilter } from '@/types';
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
  folders: Folder[];
  currentDocId: string;
  searchQuery: string;
  searchMatches: SearchMatchItem[];
  currentSearchIndex: number;
  filter: DocumentFilter;
  availableTags: string[];
  currentVersionId: string | null;
  setMarkdown: (markdown: string) => void;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  parseMarkdown: (markdown: string) => string;
  extractOutline: (markdown: string) => HeadingItem[];
  setSearchQuery: (query: string, previewElement: HTMLElement | null) => void;
  setCurrentSearchIndex: (index: number) => void;
  clearSearch: () => void;
  clearSearchHighlightsInDom: (previewElement: HTMLElement | null) => void;
  createDocument: (folderId?: string | null) => void;
  renameDocument: (id: string, name: string) => void;
  deleteDocument: (id: string) => void;
  switchDocument: (id: string) => void;
  addDocumentTag: (id: string, tag: string) => void;
  removeDocumentTag: (id: string, tag: string) => void;
  moveDocument: (docId: string, folderId: string | null) => void;
  createFolder: (name: string) => void;
  renameFolder: (id: string, name: string) => void;
  deleteFolder: (id: string) => void;
  setFilterKeyword: (keyword: string) => void;
  setFilterTag: (tag: string | null) => void;
  setFilterFolder: (folderId: string | null) => void;
  setFilterDateRange: (dateFrom: number | null, dateTo: number | null) => void;
  setFilterSortType: (type: SortType) => void;
  resetFilter: () => void;
  refreshAvailableTags: () => void;
  getFilteredDocuments: () => Document[];
  saveVersion: (description?: string) => void;
  restoreVersion: (versionId: string) => void;
  deleteVersion: (versionId: string) => void;
  getCurrentVersions: () => DocumentVersion[];
}

const STORAGE_KEY_DOCS = 'md-editor-documents';
const STORAGE_KEY_FOLDERS = 'md-editor-folders';
const STORAGE_KEY_CURRENT_DOC = 'md-editor-current-doc';
const STORAGE_KEY_THEME = 'md-editor-theme';
const STORAGE_KEY_FILTER = 'md-editor-filter';

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

    return `<h${level} id="${id}" data-heading>${text}</h${level}>\n`;
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

const loadFoldersFromStorage = (): Folder[] => {
  if (typeof localStorage === 'undefined') return [];
  try {
    const saved = localStorage.getItem(STORAGE_KEY_FOLDERS);
    if (saved) {
      return JSON.parse(saved) as Folder[];
    }
  } catch {
    // ignore
  }
  return [];
};

const saveFoldersToStorage = (folders: Folder[]): void => {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_FOLDERS, JSON.stringify(folders));
  } catch {
    // ignore
  }
};

const loadDocumentsFromStorage = (): { docs: Document[]; currentId: string } => {
  if (typeof localStorage === 'undefined') {
    return {
      docs: [
        {
          id: generateId(),
          name: '未命名文档',
          content: defaultMarkdown,
          tags: ['示例'],
          folderId: null,
          versions: [],
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
      const rawDocs = JSON.parse(saved) as (Document & { tags?: string[]; folderId?: string | null; versions?: DocumentVersion[] })[];
      const docs = rawDocs.map((d) => ({
        ...d,
        tags: d.tags || [],
        folderId: d.folderId || null,
        versions: d.versions || [],
      }));
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
    tags: ['示例'],
    folderId: null,
    versions: [],
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

const loadFilterFromStorage = (): DocumentFilter => {
  if (typeof localStorage === 'undefined') {
    return {
      keyword: '',
      tag: null,
      folderId: null,
      dateFrom: null,
      dateTo: null,
      sortType: 'updatedAt',
    };
  }
  try {
    const saved = localStorage.getItem(STORAGE_KEY_FILTER);
    if (saved) {
      return JSON.parse(saved) as DocumentFilter;
    }
  } catch {
    // ignore
  }
  return {
    keyword: '',
    tag: null,
    folderId: null,
    dateFrom: null,
    dateTo: null,
    sortType: 'updatedAt',
  };
};

const saveFilterToStorage = (filter: DocumentFilter): void => {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_FILTER, JSON.stringify(filter));
  } catch {
    // ignore
  }
};

const clearSearchHighlights = (element: HTMLElement): void => {
  const highlights = element.querySelectorAll('.search-highlight, .search-highlight-active');
  highlights.forEach((el) => {
    const span = el as HTMLElement;
    const parent = span.parentNode;
    if (parent) {
      const text = document.createTextNode(span.textContent || '');
      parent.replaceChild(text, span);
    }
  });
  element.normalize();
};

const highlightSearchMatches = (
  element: HTMLElement,
  query: string,
  outline: HeadingItem[]
): SearchMatchItem[] => {
  const matches: SearchMatchItem[] = [];
  
  if (!query.trim()) {
    return matches;
  }

  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!node.nodeValue || !node.nodeValue.trim()) {
        return NodeFilter.FILTER_REJECT;
      }
      const parent = node.parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      if (parent.tagName === 'SCRIPT' || parent.tagName === 'STYLE') {
        return NodeFilter.FILTER_REJECT;
      }
      if (parent.classList.contains('search-highlight') || parent.classList.contains('search-highlight-active')) {
        return NodeFilter.FILTER_REJECT;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  const textNodes: { node: Text; heading: string }[] = [];
  let currentHeading = '文档开头';
  let currentNode: Node | null = walker.nextNode();
  
  while (currentNode) {
    let el: HTMLElement | null = currentNode.parentElement;
    while (el && el !== element) {
      if (el.tagName && el.tagName.match(/^H[1-6]$/) && el.dataset.heading !== undefined) {
        currentHeading = el.textContent || currentHeading;
        break;
      }
      el = el.previousElementSibling as HTMLElement | null;
      if (!el) {
        let parentEl = currentNode.parentElement?.parentElement;
        while (parentEl && parentEl !== element) {
          if (parentEl.previousElementSibling) {
            el = parentEl.previousElementSibling as HTMLElement;
            break;
          }
          parentEl = parentEl.parentElement;
        }
      }
    }
    textNodes.push({ node: currentNode as Text, heading: currentHeading });
    currentNode = walker.nextNode();
  }

  const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
  let matchIndex = 0;

  for (const { node, heading } of textNodes) {
    const text = node.nodeValue;
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

      const contextStart = Math.max(0, match.index - 20);
      const contextEnd = Math.min(text.length, match.index + match[0].length + 20);
      let context = text.slice(contextStart, contextEnd);
      if (contextStart > 0) context = '...' + context;
      if (contextEnd < text.length) context = context + '...';

      matches.push({
        element: span,
        index: matchIndex,
        text: match[0],
        context,
        heading,
      });
      matchIndex++;
      lastIndex = match.index + match[0].length;
    }

    if (fragments.length > 0) {
      if (lastIndex < text.length) {
        fragments.push(text.slice(lastIndex));
      }

      const parent = node.parentNode;
      if (parent) {
        for (const fragment of fragments) {
          if (typeof fragment === 'string') {
            parent.insertBefore(document.createTextNode(fragment), node);
          } else {
            parent.insertBefore(fragment, node);
          }
        }
        parent.removeChild(node);
      }
    }
  }

  return matches;
};

export const useAppStore = create<AppState>((set, get) => {
  const savedTheme = (typeof localStorage !== 'undefined' 
    ? localStorage.getItem(STORAGE_KEY_THEME) as Theme | null 
    : null) || 'light';
  
  const folders = loadFoldersFromStorage();
  const { docs, currentId } = loadDocumentsFromStorage();
  const currentDoc = docs.find((d) => d.id === currentId) || docs[0];
  
  const initialHtml = parseMarkdownToHtml(currentDoc.content);
  const initialOutline = extractOutlineFromMarkdown(currentDoc.content);
  
  const allTags = Array.from(new Set(docs.flatMap((d) => d.tags)));
  const savedFilter = loadFilterFromStorage();

  return {
    markdown: currentDoc.content,
    html: initialHtml,
    outline: initialOutline,
    theme: savedTheme,
    documents: docs,
    folders,
    currentDocId: currentDoc.id,
    searchQuery: '',
    searchMatches: [],
    currentSearchIndex: -1,
    filter: savedFilter,
    availableTags: allTags,
    currentVersionId: null,

    setMarkdown: (markdown: string) => {
      const { currentDocId, documents, searchQuery, clearSearchHighlightsInDom } = get();
      const html = get().parseMarkdown(markdown);
      const outline = get().extractOutline(markdown);
      
      const updatedDocs = documents.map((doc) =>
        doc.id === currentDocId
          ? { ...doc, content: markdown, updatedAt: Date.now() }
          : doc
      );
      
      saveDocumentsToStorage(updatedDocs, currentDocId);
      set({ markdown, html, outline, documents: updatedDocs, currentVersionId: null });
      
      if (searchQuery && typeof setTimeout) {
        setTimeout(() => {
          const currentState = get();
          if (currentState.searchQuery === searchQuery) {
            const previewEl = document.querySelector('.markdown-body') as HTMLElement | null;
            if (previewEl) {
              clearSearchHighlightsInDom(previewEl.parentElement);
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

    clearSearchHighlightsInDom: (previewElement: HTMLElement | null) => {
      if (previewElement) {
        clearSearchHighlights(previewElement);
      }
    },

    setSearchQuery: (query: string, previewElement: HTMLElement | null) => {
      const { searchQuery, clearSearchHighlightsInDom, outline } = get();
      
      const markdownBody = previewElement?.querySelector('.markdown-body') as HTMLElement | null;
      
      if (markdownBody && searchQuery) {
        clearSearchHighlights(markdownBody);
      }

      if (!query.trim()) {
        if (markdownBody) {
          clearSearchHighlights(markdownBody);
        }
        set({ searchQuery: '', searchMatches: [], currentSearchIndex: -1 });
        return;
      }

      let matches: SearchMatchItem[] = [];
      if (markdownBody) {
        matches = highlightSearchMatches(markdownBody, query, outline);
      }

      set({
        searchQuery: query,
        searchMatches: matches,
        currentSearchIndex: matches.length > 0 ? 0 : -1,
      });

      if (matches.length > 0 && matches[0].element) {
        matches[0].element.classList.remove('search-highlight');
        matches[0].element.classList.add('search-highlight-active');
      }
    },

    setCurrentSearchIndex: (index: number) => {
      const { searchMatches } = get();
      if (searchMatches.length === 0) return;
      
      const normalizedIndex = ((index % searchMatches.length) + searchMatches.length) % searchMatches.length;
      
      searchMatches.forEach((m, i) => {
        if (m.element) {
          if (i === normalizedIndex) {
            m.element.classList.add('search-highlight-active');
            m.element.classList.remove('search-highlight');
          } else {
            m.element.classList.remove('search-highlight-active');
            m.element.classList.add('search-highlight');
          }
        }
      });

      set({ currentSearchIndex: normalizedIndex });
      
      const match = searchMatches[normalizedIndex];
      if (match && match.element) {
        match.element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    },

    clearSearch: () => {
      const { clearSearchHighlightsInDom } = get();
      const previewEl = document.querySelector('.markdown-body') as HTMLElement | null;
      if (previewEl) {
        clearSearchHighlights(previewEl);
      }
      set({ searchQuery: '', searchMatches: [], currentSearchIndex: -1 });
    },

    createDocument: (folderId: string | null = null) => {
      const { documents, currentDocId } = get();
      const newDoc: Document = {
        id: generateId(),
        name: `未命名文档 ${documents.length + 1}`,
        content: '# 新文档\n\n开始编写你的内容...',
        tags: [],
        folderId,
        versions: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const updatedDocs = [...documents, newDoc];
      saveDocumentsToStorage(updatedDocs, newDoc.id);
      
      const html = parseMarkdownToHtml(newDoc.content);
      const outline = extractOutlineFromMarkdown(newDoc.content);
      const allTags = Array.from(new Set(updatedDocs.flatMap((d) => d.tags)));
      
      set({
        documents: updatedDocs,
        currentDocId: newDoc.id,
        markdown: newDoc.content,
        html,
        outline,
        searchQuery: '',
        searchMatches: [],
        currentSearchIndex: -1,
        availableTags: allTags,
        currentVersionId: null,
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
      const { documents, currentDocId, folders } = get();
      if (documents.length <= 1) return;

      const updatedDocs = documents.filter((doc) => doc.id !== id);
      let newCurrentId = currentDocId;
      
      if (currentDocId === id) {
        newCurrentId = updatedDocs[0].id;
      }

      saveDocumentsToStorage(updatedDocs, newCurrentId);
      const allTags = Array.from(new Set(updatedDocs.flatMap((d) => d.tags)));
      
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
          availableTags: allTags,
          currentVersionId: null,
        });
      } else {
        set({ 
          documents: updatedDocs, 
          availableTags: allTags,
        });
      }

      const { filter } = get();
      if (filter.tag && !allTags.includes(filter.tag)) {
        get().setFilterTag(null);
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
        currentVersionId: null,
      });
    },

    addDocumentTag: (id: string, tag: string) => {
      const { documents, currentDocId } = get();
      const cleanTag = tag.trim();
      if (!cleanTag) return;
      
      const updatedDocs = documents.map((doc) =>
        doc.id === id && !doc.tags.includes(cleanTag)
          ? { ...doc, tags: [...doc.tags, cleanTag], updatedAt: Date.now() }
          : doc
      );
      saveDocumentsToStorage(updatedDocs, currentDocId);
      const allTags = Array.from(new Set(updatedDocs.flatMap((d) => d.tags)));
      set({ documents: updatedDocs, availableTags: allTags });
    },

    removeDocumentTag: (id: string, tag: string) => {
      const { documents, currentDocId, filter } = get();
      const updatedDocs = documents.map((doc) =>
        doc.id === id
          ? { ...doc, tags: doc.tags.filter((t) => t !== tag), updatedAt: Date.now() }
          : doc
      );
      saveDocumentsToStorage(updatedDocs, currentDocId);
      const allTags = Array.from(new Set(updatedDocs.flatMap((d) => d.tags)));
      
      set({
        documents: updatedDocs,
        availableTags: allTags,
      });

      if (filter.tag === tag && !allTags.includes(tag)) {
        get().setFilterTag(null);
      }
    },

    moveDocument: (docId: string, folderId: string | null) => {
      const { documents, currentDocId } = get();
      const updatedDocs = documents.map((doc) =>
        doc.id === docId
          ? { ...doc, folderId, updatedAt: Date.now() }
          : doc
      );
      saveDocumentsToStorage(updatedDocs, currentDocId);
      set({ documents: updatedDocs });
    },

    createFolder: (name: string) => {
      const { folders } = get();
      const newFolder: Folder = {
        id: generateId(),
        name: name.trim() || '未命名分组',
        createdAt: Date.now(),
      };
      const updatedFolders = [...folders, newFolder];
      saveFoldersToStorage(updatedFolders);
      set({ folders: updatedFolders });
    },

    renameFolder: (id: string, name: string) => {
      const { folders } = get();
      const updatedFolders = folders.map((f) =>
        f.id === id ? { ...f, name: name.trim() || '未命名分组' } : f
      );
      saveFoldersToStorage(updatedFolders);
      set({ folders: updatedFolders });
    },

    deleteFolder: (id: string) => {
      const { folders, documents, currentDocId } = get();
      const updatedFolders = folders.filter((f) => f.id !== id);
      saveFoldersToStorage(updatedFolders);
      
      const updatedDocs = documents.map((doc) =>
        doc.folderId === id ? { ...doc, folderId: null } : doc
      );
      saveDocumentsToStorage(updatedDocs, currentDocId);
      
      set({ folders: updatedFolders, documents: updatedDocs });
      
      const { filter } = get();
      if (filter.folderId === id) {
        get().setFilterFolder(null);
      }
    },

    setFilterKeyword: (keyword: string) => {
      const filter = { ...get().filter, keyword };
      saveFilterToStorage(filter);
      set({ filter });
    },

    setFilterTag: (tag: string | null) => {
      const filter = { ...get().filter, tag };
      saveFilterToStorage(filter);
      set({ filter });
    },

    setFilterFolder: (folderId: string | null) => {
      const filter = { ...get().filter, folderId };
      saveFilterToStorage(filter);
      set({ filter });
    },

    setFilterDateRange: (dateFrom: number | null, dateTo: number | null) => {
      const filter = { ...get().filter, dateFrom, dateTo };
      saveFilterToStorage(filter);
      set({ filter });
    },

    setFilterSortType: (type: SortType) => {
      const filter = { ...get().filter, sortType: type };
      saveFilterToStorage(filter);
      set({ filter });
    },

    resetFilter: () => {
      const defaultFilter: DocumentFilter = {
        keyword: '',
        tag: null,
        folderId: null,
        dateFrom: null,
        dateTo: null,
        sortType: 'updatedAt',
      };
      saveFilterToStorage(defaultFilter);
      set({ filter: defaultFilter });
    },

    refreshAvailableTags: () => {
      const { documents } = get();
      const allTags = Array.from(new Set(documents.flatMap((d) => d.tags)));
      set({ availableTags: allTags });
    },

    getFilteredDocuments: () => {
      const { documents, filter } = get();
      let filtered = [...documents];

      if (filter.keyword) {
        const keyword = filter.keyword.toLowerCase();
        filtered = filtered.filter((d) =>
          d.name.toLowerCase().includes(keyword) ||
          d.content.toLowerCase().includes(keyword)
        );
      }

      if (filter.tag) {
        filtered = filtered.filter((d) => d.tags.includes(filter.tag!));
      }

      if (filter.folderId !== null) {
        filtered = filtered.filter((d) => d.folderId === filter.folderId);
      }

      if (filter.dateFrom) {
        filtered = filtered.filter((d) => d.updatedAt >= filter.dateFrom!);
      }
      if (filter.dateTo) {
        const endOfDay = filter.dateTo + 24 * 60 * 60 * 1000 - 1;
        filtered = filtered.filter((d) => d.updatedAt <= endOfDay);
      }
      
      filtered.sort((a, b) => {
        if (filter.sortType === 'name') {
          return a.name.localeCompare(b.name, 'zh-CN');
        } else if (filter.sortType === 'updatedAt') {
          return b.updatedAt - a.updatedAt;
        } else {
          return b.createdAt - a.createdAt;
        }
      });
      
      return filtered;
    },

    saveVersion: (description?: string) => {
      const { currentDocId, documents, markdown } = get();
      const currentDoc = documents.find((d) => d.id === currentDocId);
      const newVersion: DocumentVersion = {
        id: generateId(),
        content: markdown,
        name: currentDoc?.name || '未命名',
        savedAt: Date.now(),
        description,
      };

      const updatedDocs = documents.map((doc) => {
        if (doc.id === currentDocId) {
          const versions = [...doc.versions.slice(-9)];
          versions.push(newVersion);
          return { ...doc, versions, updatedAt: Date.now() };
        }
        return doc;
      });

      saveDocumentsToStorage(updatedDocs, currentDocId);
      set({ documents: updatedDocs, currentVersionId: newVersion.id });
    },

    restoreVersion: (versionId: string) => {
      const { currentDocId, documents } = get();
      const doc = documents.find((d) => d.id === currentDocId);
      const version = doc?.versions.find((v) => v.id === versionId);
      
      if (!doc || !version) return;

      const html = parseMarkdownToHtml(version.content);
      const outline = extractOutlineFromMarkdown(version.content);

      const updatedDocs = documents.map((d) =>
        d.id === currentDocId
          ? { ...d, content: version.content, name: version.name, updatedAt: Date.now() }
          : d
      );
      saveDocumentsToStorage(updatedDocs, currentDocId);

      set({
        markdown: version.content,
        html,
        outline,
        documents: updatedDocs,
        currentVersionId: versionId,
        searchQuery: '',
        searchMatches: [],
        currentSearchIndex: -1,
      });
    },

    deleteVersion: (versionId: string) => {
      const { currentDocId, documents, currentVersionId } = get();
      const updatedDocs = documents.map((doc) => {
        if (doc.id === currentDocId) {
          return {
            ...doc,
            versions: doc.versions.filter((v) => v.id !== versionId),
          };
        }
        return doc;
      });
      saveDocumentsToStorage(updatedDocs, currentDocId);
      set({
        documents: updatedDocs,
        currentVersionId: currentVersionId === versionId ? null : currentVersionId,
      });
    },

    getCurrentVersions: () => {
      const { currentDocId, documents } = get();
      const doc = documents.find((d) => d.id === currentDocId);
      return doc?.versions || [];
    },
  };
});
