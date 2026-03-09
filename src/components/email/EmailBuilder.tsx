import { useRef } from 'react';
import EmailEditor, { EditorRef, EmailEditorProps } from 'react-email-editor';

interface EmailBuilderProps {
  initialContent?: Record<string, unknown>;
  onChange?: (html: string, json: Record<string, unknown>) => void;
  minHeight?: string;
}

export function EmailBuilder({ initialContent, onChange, minHeight = '700px' }: EmailBuilderProps) {
  const emailEditorRef = useRef<EditorRef>(null);

  const onReady: EmailEditorProps['onReady'] = (unlayer) => {
    // Unlayer is ready
    console.log('Unlayer ready');

    // Load initial content if provided
    if (initialContent) {
      unlayer.loadDesign(initialContent);
    }

    // Register event listener for design changes
    unlayer.addEventListener('design:updated', () => {
      unlayer.exportHtml((data) => {
        const { design, html } = data;
        if (onChange) {
          onChange(html, design as Record<string, unknown>);
        }
      });
    });
  };

  return (
    <div className="border rounded-lg overflow-hidden bg-white" style={{ minHeight }}>
      <EmailEditor
        ref={emailEditorRef}
        onReady={onReady}
        appearance={{
          theme: 'light',
          panels: {
            tools: {
              dock: 'right',
            },
          },
        }}
        options={{
          version: 'latest',
          id: 'unlayer-editor-container',
          displayMode: 'email',
        }}
      />
    </div>
  );
}
