import React from "react";
import clsx from "clsx";

interface ChoiceboxGroupProps {
  direction: "row" | "column";
  label?: string;
  showLabel?: boolean;
  onChange: React.Dispatch<React.SetStateAction<string>> | React.Dispatch<React.SetStateAction<string[]>>;
  type: "radio" | "checkbox";
  value: string | string[];
  children: React.ReactNode;
  disabled?: boolean;
}

export const ChoiceboxGroup = ({
  direction,
  label,
  showLabel,
  onChange,
  type,
  value,
  children,
  disabled
}: ChoiceboxGroupProps) => {
  return (
    <div className="flex flex-col gap-2">
      {showLabel && label && (
        <label className="font-sans text-[13px] text-gray-900">{label}</label>
      )}
      <div className={clsx("flex gap-4", direction === "row" ? "flex-row" : "flex-col")}>
        {React.Children.map(children, (child) => {
          const props = disabled ? {
            onChange,
            type,
            valueSelected: value,
            disabled
          } : {
            onChange,
            type,
            valueSelected: value
          };
          return React.cloneElement(child as React.ReactElement<any>, props);
        })}
      </div>
    </div>
  );
};

const getChoiceboxGroupClasses = (isSelected: boolean, type: "radio" | "checkbox") => {
  let className = "relative border w-4 h-4 duration-200";
  if (type === "radio") {
    className += " rounded-[50%] after:w-2 after:h-2 after:rounded-[50%] after:absolute after:top-1/2 after:left-1/2 after:-translate-x-1/2 after:-translate-y-1/2 bg-background-100";
    if (isSelected) {
      className += " border-[#076784] dark:border-[#7CCFCE] after:bg-[#076784] dark:after:bg-[#7CCFCE] after:scale-100";
    } else {
      className += " border-gray-500 after:bg-gray-500 after:scale-0";
    }
  } else {
    className += " rounded inline-flex items-center justify-center";
    if (isSelected) {
      className += " bg-[#076784] dark:bg-[#7CCFCE] border-[#076784] dark:border-[#7CCFCE]";
    } else {
      className += " bg-background-100 border-gray-500";
    }
  }

  return className;
};

interface ChoiceboxItemProps {
  title: string;
  description: string;
  value: string;
  type?: "radio" | "checkbox";
  valueSelected?: string | string[];
  onChange?: (value: string | string[]) => void;
  disabled?: boolean;
  children?: React.ReactNode;
}

ChoiceboxGroup.Item = ({
  title,
  description,
  value,
  type = "radio",
  valueSelected,
  onChange,
  disabled,
  children
}: ChoiceboxItemProps) => {
  const isSelected = !!(typeof valueSelected === "string" ? value === valueSelected : valueSelected?.includes(value));

  const onClick = () => {
    if (onChange && !disabled) {
      if (typeof valueSelected === "string") {
        onChange(value);
      } else {
        if (valueSelected) {
          if (isSelected) {
            onChange(valueSelected.filter((item) => item !== value));
          } else {
            onChange([...valueSelected, value]);
          }
        } else {
          onChange([value]);
        }
      }
    }
  };

  return (
    <div
      className={clsx(
        "border w-full rounded-md duration-150",
        isSelected ? "border-[#076784] dark:border-[#7CCFCE]" : "border-gray-400",
        disabled ? "cursor-not-allowed" : "cursor-pointer",
        isSelected ? "bg-[#076784]/10 dark:bg-[#7CCFCE]/10" : "bg-transparent"
      )}
      onClick={onClick}
    >
      <div className="flex items-center gap-4 p-4">
        <div className="flex flex-col gap-1 font-sans text-sm">
          <span className={clsx(
            "font-medium",
            disabled ? "text-gray-500 mb-2" : isSelected ? "text-[#076784] dark:text-[#7CCFCE] mb-2" : "text-gray-1000 mb-2"
          )}>
            {title}
          </span>
          <span className={disabled ? "text-gray-500 mr-2" : isSelected ? "text-[#076784] dark:text-[#7CCFCE] mr-2" : "text-gray-900 mr-2"}>
            {description}
          </span>
        </div>
        <div className="flex items-center ml-auto">
          <input
            disabled={disabled}
            type={type}
            value={value}
            checked={isSelected}
            onChange={onClick}
            className="absolute w-px h-px p-0 m-[-1] overflow-hidden whitespace-nowrap border-none"
          />
          <span className={getChoiceboxGroupClasses(isSelected, type)}>
            {type === "checkbox" && (
              <svg
                className={clsx("shrink-0", isSelected ? "fill-[#076784] dark:fill-[#7CCFCE]" : "fill-background")}
                height="16"
                viewBox="0 0 20 20"
                width="16"
              >
                <path
                  className="stroke-background"
                  d="M14 7L8.5 12.5L6 10"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                />
              </svg>
            )}
          </span>
        </div>
      </div>
      {children && isSelected && (
        <div className={clsx("border-t", isSelected ? "border-[#076784] dark:border-[#7CCFCE]" : "border-gray-400")}>
          {children}
        </div>
      )}
    </div>
  );
};
