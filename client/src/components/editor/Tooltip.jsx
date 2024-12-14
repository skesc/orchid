import React from "react";

export const Tooltip = ({ text, children, position = "right", shortcut }) => {
  const [show, setShow] = React.useState(false);

  const positionClasses = {
    right: "left-full ml-2",
    left: "right-full mr-2",
    top: "bottom-full mb-2",
    bottom: "top-full mt-2",
  };

  return (
    <div className="relative flex items-center">
      <div
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}>
        {children}
      </div>
      <div
        className={`absolute z-50 px-2 py-1 text-sm font-medium text-white bg-neutral-900 rounded-md whitespace-nowrap ${positionClasses[position]} transition-opacity duration-200 ${show ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        role="tooltip">
        <div className="flex items-center gap-2">
          <span>{text}</span>
          {shortcut && (
            <>
              <span className="text-neutral-400">|</span>
              <kbd className="px-1.5 py-0.5 text-xs font-semibold text-neutral-900 bg-neutral-200 rounded-md">
                {shortcut}
              </kbd>
            </>
          )}
        </div>
        <div
          className={`absolute w-1 h-1 bg-gray-900 transform rotate-45 ${position === "right" ? "left-0 -translate-x-1/2 top-1/2 -translate-y-1/2" : position === "left" ? "right-0 translate-x-1/2 top-1/2 -translate-y-1/2" : position === "top" ? "bottom-0 translate-y-1/2 left-1/2 -translate-x-1/2" : "top-0 -translate-y-1/2 left-1/2 -translate-x-1/2"}`}
        />
      </div>
    </div>
  );
};

export const ButtonWithTooltip = ({
  icon: Icon,
  tooltip,
  shortcut,
  onClick,
  active,
  disabled,
}) => {
  return (
    <Tooltip text={tooltip} shortcut={shortcut}>
      <button
        onClick={onClick}
        disabled={disabled}
        className={`text-neutral-900 relative hover:text-violet-600 transition-colors ${active ? "text-violet-600" : ""} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}>
        <Icon size={24} />
      </button>
    </Tooltip>
  );
};
