"use client";

import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Bold, Italic, List, ListOrdered, Redo2, Undo2 } from "lucide-react";
import type { ReactNode } from "react";

/** Editor de texto simples: parágrafos, negrito, itálico e listas */
export function RichTextEditor({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (html: string) => void;
}) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: false,
        blockquote: false,
        code: false,
        codeBlock: false,
        horizontalRule: false,
        strike: false,
        underline: false,
        link: false,
      }),
    ],
    content: value,
    editorProps: {
      attributes: {
        id,
        role: "textbox",
        "aria-multiline": "true",
        "aria-label": "Descrição do imóvel",
        class:
          "min-h-48 px-4 py-3 text-base leading-relaxed text-grafite-900 outline-none [&_li]:my-0.5 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-2 [&_ul]:list-disc [&_ul]:pl-6",
      },
    },
    onUpdate: ({ editor }) => onChange(editor.isEmpty ? "" : editor.getHTML()),
  });

  const state = useEditorState({
    editor,
    selector: ({ editor }) => ({
      bold: editor?.isActive("bold") ?? false,
      italic: editor?.isActive("italic") ?? false,
      bulletList: editor?.isActive("bulletList") ?? false,
      orderedList: editor?.isActive("orderedList") ?? false,
      canUndo: editor?.can().undo() ?? false,
      canRedo: editor?.can().redo() ?? false,
    }),
  });

  return (
    <div className="overflow-hidden rounded-lg border border-areia-300 bg-white focus-within:border-marinho-700 focus-within:ring-2 focus-within:ring-marinho-100">
      <div role="toolbar" aria-label="Formatação" className="flex flex-wrap gap-1 border-b border-areia-300 bg-areia-100 p-1.5">
        <ToolButton label="Negrito" active={state?.bold} onClick={() => editor?.chain().focus().toggleBold().run()}>
          <Bold className="size-4" />
        </ToolButton>
        <ToolButton label="Itálico" active={state?.italic} onClick={() => editor?.chain().focus().toggleItalic().run()}>
          <Italic className="size-4" />
        </ToolButton>
        <span className="mx-1 w-px bg-areia-300" aria-hidden />
        <ToolButton label="Lista com marcadores" active={state?.bulletList} onClick={() => editor?.chain().focus().toggleBulletList().run()}>
          <List className="size-4" />
        </ToolButton>
        <ToolButton label="Lista numerada" active={state?.orderedList} onClick={() => editor?.chain().focus().toggleOrderedList().run()}>
          <ListOrdered className="size-4" />
        </ToolButton>
        <span className="mx-1 w-px bg-areia-300" aria-hidden />
        <ToolButton label="Desfazer" disabled={!state?.canUndo} onClick={() => editor?.chain().focus().undo().run()}>
          <Undo2 className="size-4" />
        </ToolButton>
        <ToolButton label="Refazer" disabled={!state?.canRedo} onClick={() => editor?.chain().focus().redo().run()}>
          <Redo2 className="size-4" />
        </ToolButton>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}

function ToolButton({
  label,
  active,
  disabled,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={`flex size-9 items-center justify-center rounded-md transition disabled:opacity-30 ${
        active ? "bg-marinho-700 text-white" : "text-grafite-700 hover:bg-white"
      }`}
    >
      {children}
    </button>
  );
}
