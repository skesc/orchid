import React from "react";

export const Tooltip = ({text, children, position = "right"}) => {
  const [show, setShow] = React.useState(false);

  const positionClasses = {
    right: "left-full ml-2",
    left: "right-full mr-2",
    top: "bottom-full mb-2",
    bottom: "top-full mt-2",
  };

  return (
    <div className="relative flex items-center">
      <div onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
        {children}
      </div>
      <div className={`absolute z-50 px-2 py-1 text-sm font-medium text-white bg-gray-900 rounded-md whitespace-nowrap ${positionClasses[position]} transition-opacity duration-200 ${show ? "opacity-100" : "opacity-0 pointer-events-none"}`} role="tooltip">
        {text}
        <div className={`absolute w-1 h-1 bg-gray-900 transform rotate-45 ${position === "right" ? "left-0 -translate-x-1/2 top-1/2 -translate-y-1/2" : position === "left" ? "right-0 translate-x-1/2 top-1/2 -translate-y-1/2" : position === "top" ? "bottom-0 translate-y-1/2 left-1/2 -translate-x-1/2" : "top-0 -translate-y-1/2 left-1/2 -translate-x-1/2"}`} />
      </div>
    </div>
  );
};

export const ButtonWithTooltip = ({icon: Icon, tooltip, onClick, active, disabled}) => {
  return (
    <Tooltip text={tooltip}>
      <button onClick={onClick} disabled={disabled} className={`text-neutral-100 hover:text-violet-400 transition-colors ${active ? "text-violet-400" : ""} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}>
        <Icon size={24} />
      </button>
    </Tooltip>
  );
};
