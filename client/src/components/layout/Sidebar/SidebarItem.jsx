import { NavLink } from "react-router-dom";

export default function SidebarItem({
  label,
  path,
  icon: Icon,
}) {
  return (
    <NavLink
      to={path}
      className={({ isActive }) =>
        [
          "group",
          "mb-1",
          "flex",
          "h-11",
          "items-center",
          "gap-3",
          "rounded-xl",
          "px-3.5",
          "text-sm",
          "font-medium",
          "transition-all",
          "duration-200",

          isActive
            ? "bg-violet-600 text-white shadow-lg shadow-violet-900/20"
            : "text-zinc-400 hover:bg-zinc-900 hover:text-white",
        ].join(" ")
      }
    >
      {Icon && (
        <Icon
          size={18}
          strokeWidth={1.8}
          className="shrink-0"
        />
      )}

      <span className="truncate">
        {label}
      </span>
    </NavLink>
  );
}