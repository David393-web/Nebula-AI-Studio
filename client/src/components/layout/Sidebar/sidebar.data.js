import {
  LayoutDashboard,
  Folder,
  Image,
  Video,
  Users,
  Clapperboard,
  Images,
  Download,
  Settings,
  CreditCard,
} from "lucide-react";

export const sidebarItems = [
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Projects",
    path: "/projects",
    icon: Folder,
  },
  {
    label: "Images",
    path: "/images",
    icon: Image,
  },
  {
    label: "Videos",
    path: "/videos",
    icon: Video,
  },
  {
    label: "Characters",
    path: "/characters",
    icon: Users,
  },
  {
    label: "Storyboard",
    path: "/storyboard",
    icon: Clapperboard,
  },
  {
    label: "Gallery",
    path: "/gallery",
    icon: Images,
  },
  {
    label: "Downloads",
    path: "/downloads",
    icon: Download,
  },
  { label: "Credits & Billing", path: "/billing", icon: CreditCard },
  {
    label: "Settings",
    path: "/settings",
    icon: Settings,
  },
];
