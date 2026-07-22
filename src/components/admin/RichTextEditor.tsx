'use client'

import { useEffect, useRef } from 'react'

// A small dependency-free rich text editor (no react-quill/tiptap install
// needed — everything here is plain contentEditable + document.execCommand,
// which is all these two fields need: bold/italic/underline/lists/link,
// mirroring what the plugin's wp_editor gives admins for intro/SEO copy).
// Produces/accepts an HTML string; the storefront pages must render it with
// dangerouslySetInnerHTML (already updated) instead of as plain text.

// Toolbar button — declared outside the editor component so it isn't
// recreated on every render (which would reset any internal state/identity).
function ToolbarButton({ label, title, onClick }: { label: React.ReactNode; title: string; onClick: () => void }) {
  return (
    <button type="button" title={title} onMouseDown={(e) => e.preventDefault()} onClick={onClick}
      className="w-7 h-7 flex items-center justify-center rounded text-sm text-gray-600 hover:bg-gray-200 transition">
      {label}
    </button>
  )
}

export default function RichTextEditor({
  value, onChange, placeholder,
}: {
  value: string
  onChange: (html: string) => void
  placeholder?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const lastValue = useRef<string | null>(null)

  // Initial mount: seed the contentEditable div once. Using innerHTML here
  // (rather than a React-controlled child) is what lets the browser's native
  // caret/selection handling work correctly inside the editable area.
  useEffect(() => {
    if (ref.current) {
      ref.current.innerHTML = value
      lastValue.current = value
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount only
  }, [])

  // Keep in sync with external changes (e.g. switching products) without
  // clobbering the caret while the admin is actively typing in this field.
  useEffect(() => {
    if (ref.current && value !== lastValue.current && document.activeElement !== ref.current) {
      ref.current.innerHTML = value
      lastValue.current = value
    }
  }, [value])

  const handleInput = () => {
    if (ref.current) {
      lastValue.current = ref.current.innerHTML
      onChange(ref.current.innerHTML)
    }
  }

  const exec = (command: string, arg?: string) => {
    ref.current?.focus()
    document.execCommand(command, false, arg)
    handleInput()
  }

  const addLink = () => {
    const url = window.prompt('Link URL (e.g. https://example.com)')
    if (url) exec('createLink', url)
  }

  return (
    <div className="border rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-black">
      <div className="flex items-center gap-0.5 border-b bg-gray-50 px-1.5 py-1">
        <ToolbarButton label={<b>B</b>} title="Bold" onClick={() => exec('bold')} />
        <ToolbarButton label={<i>I</i>} title="Italic" onClick={() => exec('italic')} />
        <ToolbarButton label={<u>U</u>} title="Underline" onClick={() => exec('underline')} />
        <span className="w-px h-4 bg-gray-300 mx-1" />
        <ToolbarButton label="•⁠ ⁠" title="Bullet list" onClick={() => exec('insertUnorderedList')} />
        <ToolbarButton label="1." title="Numbered list" onClick={() => exec('insertOrderedList')} />
        <span className="w-px h-4 bg-gray-300 mx-1" />
        <ToolbarButton label="🔗" title="Insert link" onClick={addLink} />
        <ToolbarButton label="✕" title="Clear formatting" onClick={() => exec('removeFormat')} />
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        data-placeholder={placeholder}
        className="rich-text-editable px-3 py-2 text-sm min-h-[90px] max-h-72 overflow-y-auto focus:outline-none [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:text-blue-600 [&_a]:underline"
      />
    </div>
  )
}
