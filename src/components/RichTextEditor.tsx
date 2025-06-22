import React, { useState, useRef } from 'react';

export interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
}

interface ContentElement {
  id: string;
  type: 'heading' | 'paragraph' | 'link' | 'list' | 'divider';
  content: string;
  style?: {
    color?: string;
    backgroundColor?: string;
    fontSize?: string;
    fontWeight?: string;
    textAlign?: 'left' | 'center' | 'right';
    borderRadius?: string;
    padding?: string;
    margin?: string;
  };
  href?: string; // for links
  level?: 1 | 2 | 3 | 4 | 5 | 6; // for headings
  listType?: 'bullet' | 'numbered'; // for lists
  items?: string[]; // for lists
}

/*
 * Advanced website builder-style editor with customizable elements
 */
const RichTextEditor: React.FC<RichTextEditorProps> = ({ content, onChange }) => {
  // Utility: minimal HTML -> elements parser
  const parseHtmlToElements = (html: string): ContentElement[] => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const nodes = Array.from(doc.body.childNodes);
    const els: ContentElement[] = [];

    nodes.forEach((node, idx) => {
      if (node.nodeType === 3) return; // skip text nodes
      if (!(node instanceof HTMLElement)) return;

      const tag = node.tagName.toLowerCase();
      const base: Partial<ContentElement> = {
        id: Date.now().toString() + idx
      };

      if (/h[1-6]/.test(tag)) {
        els.push({
          ...base,
          type: 'heading',
          level: parseInt(tag[1]) as 1|2|3|4|5|6,
          content: node.textContent || '',
          style: { color: '#000000' }
        } as ContentElement);
      } else if (tag === 'p') {
        // check if only link pill inside
        const link = node.querySelector('a');
        if (link && node.childElementCount === 1) {
          els.push({
            ...base,
            type: 'link',
            content: link.textContent || 'Link',
            href: link.getAttribute('href') || '',
            style: {
              backgroundColor: link.style.backgroundColor || '#3B82F6',
              color: link.style.color || '#FFFFFF',
              borderRadius: link.style.borderRadius || '9999px',
              padding: link.style.padding || '0.5rem 1rem'
            }
          } as ContentElement);
        } else {
          els.push({
            ...base,
            type: 'paragraph',
            content: node.textContent || '',
            style: { color: '#000000' }
          } as ContentElement);
        }
      } else if (tag === 'hr') {
        els.push({ ...base, type: 'divider', content: '', style: { color: '#000000' } } as ContentElement);
      } else if (tag === 'ul' || tag === 'ol') {
        const items = Array.from(node.children).map(li => li.textContent || '');
        els.push({
          ...base,
          type: 'list',
          listType: tag === 'ol' ? 'numbered' : 'bullet',
          items,
          content: '',
          style: { color: '#000000' }
        } as ContentElement);
      }
    });

    if (els.length === 0) {
      return [{ id: '1', type: 'paragraph', content: 'Start building your content...', style: { color: '#000000' } } as ContentElement];
    }
    return els;
  };

  const [elements, setElements] = useState<ContentElement[]>(() => parseHtmlToElements(content));

  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);

  // Convert elements back to HTML
  const elementsToHtml = (elements: ContentElement[]): string => {
    return elements.map(element => {
      // Ensure color is always set to black if not specified
      const elementStyle = { color: '#000000', ...element.style };
      const style = Object.entries(elementStyle)
        .map(([key, value]) => `${key.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value}`)
        .join('; ');

      switch (element.type) {
        case 'heading':
          const sz = element.level === 1 ? '2.25rem' :
                      element.level === 2 ? '1.875rem' :
                      element.level === 3 ? '1.5rem' :
                      element.level === 4 ? '1.25rem' : '1.125rem';
          const headingStyle = `${style}; font-size: ${sz}; font-weight: 700;`;
          return `<h${element.level || 2} style="${headingStyle}">${element.content}</h${element.level || 2}>`;
        case 'paragraph':
          return `<p style="${style}">${element.content}</p>`;
        case 'link':
          const href = element.href && /^(http|https):\/\//i.test(element.href) ? element.href : `https://${element.href || ''}`;
          return `<a href="${href}" target="_blank" rel="noopener noreferrer" style="${style}" class="inline-block px-3 py-1 rounded-full text-sm font-medium">${element.content}</a>`;
        case 'list':
          const tag = element.listType === 'numbered' ? 'ol' : 'ul';
          const listClass = element.listType === 'numbered' ? 'list-decimal list-inside' : 'list-disc list-inside';
          const items = element.items?.map(item => `<li style="color: #000000; margin-left: 1rem;">${item}</li>`).join('') || '';
          return `<${tag} class="${listClass}" style="${style}; margin-left: 1rem;">${items}</${tag}>`;
        case 'divider':
          return `<hr style="${style}" />`;
        default:
          return `<p style="${style}">${element.content}</p>`;
      }
    }).join('');
  };

  // Update elements and notify parent
  const updateElements = (newElements: ContentElement[]) => {
    setElements(newElements);
    onChange(elementsToHtml(newElements));
  };

  // Add new element
  const addElement = (type: ContentElement['type']) => {
    const newElement: ContentElement = {
      id: Date.now().toString(),
      type,
      content: type === 'heading' ? 'New Heading' : 
               type === 'link' ? 'Link Text' :
               type === 'divider' ? '' :
               type === 'list' ? '' :
               'New content',
      style: type === 'link' ? {
        backgroundColor: '#3B82F6',
        color: '#FFFFFF',
        borderRadius: '9999px',
        padding: '0.5rem 1rem',
        textAlign: 'center'
      } : {
        color: '#000000' // Ensure all elements have black text by default
      },
      level: type === 'heading' ? 2 : undefined,
      href: type === 'link' ? '#' : undefined,
      listType: type === 'list' ? 'bullet' : undefined,
      items: type === 'list' ? ['Item 1', 'Item 2'] : undefined
    };

    updateElements([...elements, newElement]);
    setSelectedElement(newElement.id);
    setShowAddMenu(false);
  };

  // Update element
  const updateElement = (id: string, updates: Partial<ContentElement>) => {
    updateElements(elements.map(el => 
      el.id === id ? { ...el, ...updates } : el
    ));
  };

  // Delete element
  const deleteElement = (id: string) => {
    updateElements(elements.filter(el => el.id !== id));
    setSelectedElement(null);
  };

  // Move element
  const moveElement = (id: string, direction: 'up' | 'down') => {
    const index = elements.findIndex(el => el.id === id);
    if (index === -1) return;

    const newElements = [...elements];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (newIndex >= 0 && newIndex < elements.length) {
      [newElements[index], newElements[newIndex]] = [newElements[newIndex], newElements[index]];
      updateElements(newElements);
    }
  };

  const selectedEl = elements.find(el => el.id === selectedElement);

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Toolbar */}
      <div className="border-b border-gray-200 p-4 bg-gray-50">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-gray-900">Content</h4>
          <button
            onClick={() => setShowAddMenu(!showAddMenu)}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Add Element</span>
          </button>
        </div>

        {/* Add Menu */}
        {showAddMenu && (
          <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="grid grid-cols-3 gap-2">
              {[
                { type: 'heading' as const, icon: 'H', label: 'Heading' },
                { type: 'paragraph' as const, icon: 'P', label: 'Paragraph' },
                { type: 'link' as const, icon: '🔗', label: 'Link Pill' },
                { type: 'list' as const, icon: '•', label: 'List' },
                { type: 'divider' as const, icon: '—', label: 'Divider' },
              ].map(({ type, icon, label }) => (
                <button
                  key={type}
                  onClick={() => addElement(type)}
                  className="p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-center text-gray-700"
                >
                  <div className="text-lg mb-1">{icon}</div>
                  <div className="text-xs text-gray-600">{label}</div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="flex flex-col">
        {/* Properties Panel - now on top */}
        {selectedEl && (
          <div className="w-full max-h-60 overflow-y-auto border-b border-gray-200 p-4 bg-gray-50">
            <h5 className="font-semibold text-gray-900 mb-3">Properties</h5>
            
            {/* Content Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
              {selectedEl.type === 'list' ? (
                <div className="space-y-2">
                  {selectedEl.items?.map((item, index) => (
                    <input
                      key={index}
                      type="text"
                      value={item}
                      onChange={(e) => {
                        const newItems = [...(selectedEl.items || [])];
                        newItems[index] = e.target.value;
                        updateElement(selectedEl.id, { items: newItems });
                      }}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  ))}
                  <button
                    onClick={() => {
                      const newItems = [...(selectedEl.items || []), 'New item'];
                      updateElement(selectedEl.id, { items: newItems });
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    + Add item
                  </button>
                </div>
              ) : selectedEl.type !== 'divider' ? (
                <input
                  type="text"
                  value={selectedEl.content}
                  onChange={(e) => updateElement(selectedEl.id, { content: e.target.value })}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                />
              ) : null}
            </div>

            {/* Heading Level */}
            {selectedEl.type === 'heading' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
                <select
                  value={selectedEl.level || 2}
                  onChange={(e) => updateElement(selectedEl.id, { level: parseInt(e.target.value) as 1 | 2 | 3 | 4 | 5 | 6 })}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                >
                  {[1, 2, 3, 4, 5, 6].map(level => (
                    <option key={level} value={level}>H{level}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Link URL */}
            {selectedEl.type === 'link' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
                <input
                  type="text"
                  value={selectedEl.href || ''}
                  onChange={(e) => updateElement(selectedEl.id, { href: e.target.value })}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  placeholder="https://..."
                />
              </div>
            )}

            {/* List Type */}
            {selectedEl.type === 'list' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={selectedEl.listType || 'bullet'}
                  onChange={(e) => updateElement(selectedEl.id, { listType: e.target.value as 'bullet' | 'numbered' })}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                >
                  <option value="bullet">Bullet List</option>
                  <option value="numbered">Numbered List</option>
                </select>
              </div>
            )}

            {/* Style Controls */}
            <div className="space-y-3">
              <h6 className="font-medium text-gray-800">Styling</h6>
              
              {/* Colors */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Text Color</label>
                  <input
                    type="color"
                    value={selectedEl.style?.color || '#000000'}
                    onChange={(e) => updateElement(selectedEl.id, {
                      style: { ...selectedEl.style, color: e.target.value }
                    })}
                    className="w-full h-8 border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Background</label>
                  <input
                    type="color"
                    value={selectedEl.style?.backgroundColor || '#ffffff'}
                    onChange={(e) => updateElement(selectedEl.id, {
                      style: { ...selectedEl.style, backgroundColor: e.target.value }
                    })}
                    className="w-full h-8 border border-gray-300 rounded"
                  />
                </div>
              </div>

              {/* Text Alignment */}
              <div>
                <label className="block text-xs text-gray-600 mb-1">Alignment</label>
                <div className="flex space-x-1">
                  {(['left', 'center', 'right'] as const).map(align => (
                    <button
                      key={align}
                      onClick={() => updateElement(selectedEl.id, {
                        style: { ...selectedEl.style, textAlign: align }
                      })}
                      className={`px-2 py-1 text-xs rounded ${
                        selectedEl.style?.textAlign === align 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {align}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Style Presets for Links */}
              {selectedEl.type === 'link' && (
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Quick Styles</label>
                  <div className="grid grid-cols-2 gap-1">
                    {[
                      { name: 'Primary', bg: '#3B82F6', color: '#FFFFFF' },
                      { name: 'Success', bg: '#10B981', color: '#FFFFFF' },
                      { name: 'Warning', bg: '#F59E0B', color: '#FFFFFF' },
                      { name: 'Danger', bg: '#EF4444', color: '#FFFFFF' },
                      { name: 'Dark', bg: '#1F2937', color: '#FFFFFF' },
                      { name: 'Light', bg: '#F3F4F6', color: '#1F2937' }
                    ].map(preset => (
                      <button
                        key={preset.name}
                        onClick={() => updateElement(selectedEl.id, {
                          style: {
                            ...selectedEl.style,
                            backgroundColor: preset.bg,
                            color: preset.color,
                            borderRadius: '9999px',
                            padding: '0.5rem 1rem'
                          }
                        })}
                        className="text-xs px-2 py-1 rounded border border-gray-300 hover:bg-gray-50"
                        style={{ backgroundColor: preset.bg, color: preset.color }}
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Elements List */}
        <div className="p-4 space-y-3 bg-white">
          {elements.map((element, index) => (
            <div
              key={element.id}
              className={`group relative border rounded-lg p-3 cursor-pointer transition-all ${
                selectedElement === element.id 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedElement(element.id)}
            >
              {/* Element Content */}
              <div className="mb-2">
                {element.type === 'heading' && (
                  <div 
                    className="font-bold"
                    style={{
                      fontSize: element.level === 1 ? '2.25rem' : 
                               element.level === 2 ? '1.875rem' :
                               element.level === 3 ? '1.5rem' :
                               element.level === 4 ? '1.25rem' :
                               '1.125rem',
                      color: element.style?.color || '#000000',
                      fontWeight: '700',
                      ...element.style
                    }}
                  >
                    {element.content}
                  </div>
                )}
                {element.type === 'paragraph' && (
                  <div style={{ color: element.style?.color || '#000000', ...element.style }}>{element.content}</div>
                )}
                {element.type === 'link' && (
                  <span 
                    className="inline-block px-3 py-1 rounded-full text-sm font-medium"
                    style={{ color: element.style?.color || '#000000', ...element.style }}
                  >
                    {element.content}
                  </span>
                )}
                {element.type === 'list' && (
                  <div>
                    {element.listType === 'numbered' ? (
                      <ol className="list-decimal list-inside" style={{ color: element.style?.color || '#000000', ...element.style }}>
                        {element.items?.map((item, i) => <li key={i}>{item}</li>)}
                      </ol>
                    ) : (
                      <ul className="list-disc list-inside" style={{ color: element.style?.color || '#000000', ...element.style }}>
                        {element.items?.map((item, i) => <li key={i}>{item}</li>)}
                      </ul>
                    )}
                  </div>
                )}
                {element.type === 'divider' && (
                  <hr className="border-gray-300" style={{ color: element.style?.color || '#000000', ...element.style }} />
                )}
              </div>

              {/* Element Controls */}
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span className="capitalize">{element.type}</span>
                <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.stopPropagation(); moveElement(element.id, 'up'); }}
                    disabled={index === 0}
                    className="p-1 hover:bg-gray-200 rounded disabled:opacity-50"
                  >
                    ↑
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); moveElement(element.id, 'down'); }}
                    disabled={index === elements.length - 1}
                    className="p-1 hover:bg-gray-200 rounded disabled:opacity-50"
                  >
                    ↓
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteElement(element.id); }}
                    className="p-1 hover:bg-red-200 text-red-600 rounded"
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Preview */}
      <div className="border-t border-gray-200 p-4 bg-white text-gray-900">
        <div className="text-xs text-gray-400 mb-2">Live Preview:</div>
        <div
          className="prose max-w-none prose-ul:list-disc prose-ol:list-decimal prose-li:ml-4"
          style={{
            '--tw-prose-bullets': '#000000',
            '--tw-prose-counters': '#000000'
          } as React.CSSProperties}
          dangerouslySetInnerHTML={{ __html: elementsToHtml(elements) }}
        />
      </div>
    </div>
  );
};

export default RichTextEditor; 