import React, { createContext } from "react";

const EditorContext = createContext("");

export function EditorProvider({ children }) {
  const [textOptions, setTextOptions] = React.useState({
    text: "Click to edit",
    fontSize: 32,
    fontFamily: "Chakra Petch",
    textAlign: "center",
    fill: "#ffffff",
    backgroundColor: "#00000000",
    bold: false,
    italic: false,
    stroke: "#00000000",
    strokeWidth: 0,
    underline: false,
  });

  const [textMode, setTextMode] = React.useState("create");

  return (
    <EditorContext.Provider
      value={{ textOptions, setTextOptions, textMode, setTextMode }}
    >
      {children}
    </EditorContext.Provider>
  );
}

export const useEditor = () => {
  const context = React.useContext(EditorContext);
  if (!context) {
    throw new Error("useEditor must be used within an EditorProvider");
  }
  return context;
};
