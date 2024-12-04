import {IText} from "fabric";
import {AlertCircle, Bold, Italic, Type, Underline, X} from "lucide-react";
import React, {useState} from "react";
import {ChromePicker} from "react-color";

const fonts = ["Arial", "Times New Roman", "Courier New", "Georgia", "Verdana", "Helvetica", "Chakra Petch"];

const TextEditor = ({canvas, isOpen, onClose}) => {
  const [textOptions, setTextOptions] = useState({
    text: "Click to edit",
    fontSize: 32,
    fontFamily: "Chakra Petch",
    fill: "#ffffff",
    backgroundColor: "#00000000",
    bold: false,
    italic: false,
    underline: false,
  });
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showBgColorPicker, setShowBgColorPicker] = useState(false);

  const addText = () => {
    if (!canvas) return;

    const text = new IText(textOptions.text, {
      left: canvas.width / 2,
      top: canvas.height / 2,
      originX: "center",
      originY: "center",
      fontSize: textOptions.fontSize,
      fontFamily: textOptions.fontFamily,
      fill: textOptions.fill,
      backgroundColor: textOptions.backgroundColor,
      fontWeight: textOptions.bold ? "bold" : "normal",
      fontStyle: textOptions.italic ? "italic" : "normal",
      underline: textOptions.underline,
      id: `text-${Date.now()}`,
      name: "Text Layer",
    });

    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
    setTextOptions({
      text: "Click to edit",
      fontSize: 32,
      fontFamily: "Chakra Petch",
      fill: "#ffffff",
      backgroundColor: "#00000000",
      bold: false,
      italic: false,
      underline: false,
    });

    onClose();
  };

  const handleTextAreaKeyDown = (e) => {
    e.stopPropagation();
  };

  const handleTextChange = (e) => {
    setTextOptions((prev) => ({...prev, text: e.target.value}));
  };

  const handleFontSizeChange = (e) => {
    setTextOptions((prev) => ({...prev, fontSize: parseInt(e.target.value)}));
  };

  const handleFontFamilyChange = (e) => {
    setTextOptions((prev) => ({...prev, fontFamily: e.target.value}));
  };

  const handleColorChange = (color) => {
    setTextOptions((prev) => ({...prev, fill: color.hex}));
  };

  const handleBackgroundColorChange = (color) => {
    const alpha = Math.round(color.rgb.a * 255)
      .toString(16)
      .padStart(2, "0");
    setTextOptions((prev) => ({...prev, backgroundColor: color.hex + alpha}));
  };

  const toggleStyle = (style) => {
    setTextOptions((prev) => ({...prev, [style]: !prev[style]}));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed left-24 top-[16rem] bg-neutral-200 box-shadow-3d w-72 text-neutral-900 p-4 rounded-lg shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Type size={16} />
          <h3 className="font-bold">Text Editor</h3>
        </div>
        <div className="flex items-center gap-2">
          <AlertCircle size={16} className="text-neutral-400" title="Double click text to edit after adding" />
          <button onClick={onClose} className="p-1 hover:text-violet-600 rounded-lg transition-colors">
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <textarea value={textOptions.text} onChange={handleTextChange} onKeyDown={handleTextAreaKeyDown} className="w-full px-3 py-2 bg-neutral-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:outline-none" rows={2} placeholder="Enter your text..." />

        <div className="space-y-4">
          <div>
            <label className="block text-xs mb-1">Font Size</label>
            <input type="number" value={textOptions.fontSize} onChange={handleFontSizeChange} onKeyDown={handleTextAreaKeyDown} min={8} max={200} className="w-full px-3 py-1.5 bg-neutral-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:outline-none" />
          </div>

          <div>
            <label className="block text-xs mb-1">Text Color</label>
            <div className="relative">
              <button
                onClick={() => {
                  setShowColorPicker(!showColorPicker);
                  setShowBgColorPicker(false);
                }}
                className="w-full h-8 rounded-lg flex items-center px-3 bg-neutral-300 hover:bg-neutral-400 transition-colors">
                <div className="w-6 h-6 rounded-md mr-2" style={{backgroundColor: textOptions.fill}} />
                <span className="text-sm">{textOptions.fill}</span>
              </button>
              {showColorPicker && (
                <div className="absolute z-50 mt-2">
                  <div className="fixed inset-0" onClick={() => setShowColorPicker(false)} />
                  <div className="relative">
                    <ChromePicker color={textOptions.fill} onChange={handleColorChange} disableAlpha={true} />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs mb-1">Background Color</label>
            <div className="relative">
              <button
                onClick={() => {
                  setShowBgColorPicker(!showBgColorPicker);
                  setShowColorPicker(false);
                }}
                className="w-full h-8 rounded-lg flex items-center px-3 bg-neutral-300 hover:bg-neutral-400 transition-colors">
                <div className="w-6 h-6 rounded-md mr-2 bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAIAAADZF8uwAAAAGUlEQVQYV2M4gwH+YwCGIasIUwhT25BVBADtzYNYrHvv4gAAAABJRU5ErkJggg==')] border border-neutral-400">
                  <div className="w-full h-full rounded-md" style={{backgroundColor: textOptions.backgroundColor}} />
                </div>
                <span className="text-sm">{textOptions.backgroundColor}</span>
              </button>
              {showBgColorPicker && (
                <div className="absolute z-50 mt-2">
                  <div className="fixed inset-0" onClick={() => setShowBgColorPicker(false)} />
                  <div className="relative">
                    <ChromePicker color={textOptions.backgroundColor} onChange={handleBackgroundColorChange} />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs mb-1">Font Family</label>
            <select value={textOptions.fontFamily} onChange={handleFontFamilyChange} onKeyDown={handleTextAreaKeyDown} className="w-full px-3 py-1.5 bg-neutral-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:outline-none">
              {fonts.map((font) => (
                <option key={font} value={font} style={{fontFamily: font}}>
                  {font}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <button onClick={() => toggleStyle("bold")} className={`flex-1 p-1.5 rounded-lg font-medium transition-colors ${textOptions.bold ? "bg-violet-500 text-white" : "bg-neutral-300 text-neutral-900"}`}>
              <Bold size={16} className="mx-auto" />
            </button>
            <button onClick={() => toggleStyle("italic")} className={`flex-1 p-1.5 rounded-lg font-medium transition-colors ${textOptions.italic ? "bg-violet-500 text-white" : "bg-neutral-300 text-neutral-900"}`}>
              <Italic size={16} className="mx-auto" />
            </button>
            <button onClick={() => toggleStyle("underline")} className={`flex-1 p-1.5 rounded-lg font-medium transition-colors ${textOptions.underline ? "bg-violet-500 text-white" : "bg-neutral-300 text-neutral-900"}`}>
              <Underline size={16} className="mx-auto" />
            </button>
          </div>

          <button onClick={addText} className="w-full px-4 py-2 bg-violet-500 text-white rounded-lg hover:bg-violet-600 transition-colors">
            Add Text
          </button>
        </div>
      </div>
    </div>
  );
};

export default TextEditor;
