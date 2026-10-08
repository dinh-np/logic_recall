import React, { useRef, useEffect } from 'react';
import { Bold, Italic, Underline, Eraser } from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, placeholder, className = '' }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  
  // Update innerHTML if value changes externally (e.g. initial load or file upload)
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      // Ensure we don't overwrite if the user is typing
      if (document.activeElement !== editorRef.current) {
        editorRef.current.innerHTML = value;
      }
    }
  }, [value]);

  const exec = (command: string, arg?: string) => {
    document.execCommand(command, false, arg);
    editorRef.current?.focus();
    onChange(editorRef.current?.innerHTML || '');
  };

  const handleInput = () => {
    onChange(editorRef.current?.innerHTML || '');
  };

  // Nút hiển thị cho Tiêu đề (Dropdown custom hoặc select)
  return (
    <div className={`flex flex-col w-full border-2 border-krones-ice rounded focus-within:border-krones-blue bg-white shadow-inner ${className}`}>
      {/* Toolbar - Viền xanh nhẹ chuẩn Krones */}
      <div className="flex items-center gap-1 p-2 border-b border-krones-ice bg-gray-50 rounded-t">
        <button 
          onClick={() => exec('bold')} 
          className="p-2 hover:bg-gray-200 rounded text-krones-navy transition-colors font-bold" 
          title="In đậm (Bold)"
        >
          <Bold size={18} />
        </button>
        <button 
          onClick={() => exec('italic')} 
          className="p-2 hover:bg-gray-200 rounded text-krones-navy transition-colors italic" 
          title="In nghiêng (Italic)"
        >
          <Italic size={18} />
        </button>
        <button 
          onClick={() => exec('underline')} 
          className="p-2 hover:bg-gray-200 rounded text-krones-navy transition-colors underline" 
          title="Gạch chân (Underline)"
        >
          <Underline size={18} />
        </button>
        
        <div className="w-px h-6 bg-gray-300 mx-2"></div>
        
        <select 
          onChange={(e) => {
            if (e.target.value) {
              exec('formatBlock', e.target.value);
              e.target.value = ""; // reset select after apply
            }
          }}
          className="text-sm bg-transparent border border-gray-300 rounded px-2 py-1 outline-none text-krones-navy cursor-pointer hover:border-krones-blue transition-colors"
          title="Cỡ chữ (Font size)"
        >
          <option value="">Cỡ chữ...</option>
          <option value="H1">Tiêu đề lớn (L)</option>
          <option value="H2">Tiêu đề phụ (M)</option>
          <option value="P">Bình thường (S)</option>
        </select>

        <div className="w-px h-6 bg-gray-300 mx-2"></div>
        
        <button 
          onClick={() => exec('removeFormat')} 
          className="p-2 hover:bg-gray-200 rounded text-krones-navy transition-colors" 
          title="Xóa định dạng (Clear)"
        >
          <Eraser size={18} />
        </button>
      </div>

      {/* Editor */}
      <div className="relative flex-1">
        {!value && (
          <div className="absolute top-4 left-4 text-gray-400 pointer-events-none text-lg">
            {placeholder}
          </div>
        )}
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onBlur={handleInput}
          className="w-full min-h-[200px] p-4 outline-none text-lg leading-relaxed font-sans prose max-w-none"
          style={{ whiteSpace: 'pre-wrap' }}
        />
      </div>
    </div>
  );
};
