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
  ShieldCheck,
  WandSparkles,
} from "lucide-react";
import { ADMIN_DASHBOARD_PATH } from "@/router/authRouting";

export const sidebarItems = [
  {
    section: "Workspace",
    label: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    section: "Workspace",
    label: "Projects",
    path: "/projects",
    icon: Folder,
  },
  {
    section: "Create",
    label: "Generate",
    path: "/generate",
    icon: WandSparkles,
  },
  {
    section: "Create",
    label: "Images",
    path: "/images",
    icon: Image,
  },
  {
    section: "Create",
    label: "Videos",
    path: "/videos",
    icon: Video,
  },
  {
    section: "Create",
    label: "Characters",
    path: "/characters",
    icon: Users,
  },
  {
    section: "Create",
    label: "Storyboard",
    path: "/storyboard",
    icon: Clapperboard,
  },
  {
    section: "Library",
    label: "Gallery",
    path: "/gallery",
    icon: Images,
  },
  {
    section: "Library",
    label: "Downloads",
    path: "/downloads",
    icon: Download,
  },
  { section: "Account", label: "Credits & Billing", path: "/billing", icon: CreditCard },
  { section: "Account", label: "Admin", path: ADMIN_DASHBOARD_PATH, icon: ShieldCheck, adminOnly: true },
  {
    section: "Account",
    label: "Settings",
    path: "/settings",
    icon: Settings,
  },
];
