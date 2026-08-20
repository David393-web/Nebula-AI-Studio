import {
  User,
  Palette,
  Bell,
  Shield,
  CreditCard,
  Database,
  ChevronRight,
  Check,
} from "lucide-react";
import { useState } from "react";

const settingsSections = [
  {
    id: "profile",
    title: "Profile",
    description: "Manage your personal information and account details.",
    icon: User,
  },
  {
    id: "appearance",
    title: "Appearance",
    description: "Customize how Nebula AI looks and feels.",
    icon: Palette,
  },
  {
    id: "notifications",
    title: "Notifications",
    description: "Choose what notifications you want to receive.",
    icon: Bell,
  },
  {
    id: "security",
    title: "Security",
    description: "Manage your password and account security.",
    icon: Shield,
  },
  {
    id: "billing",
    title: "Billing & Plan",
    description: "Manage your subscription and usage.",
    icon: CreditCard,
  },
  {
    id: "storage",
    title: "Storage",
    description: "Manage your creative storage and files.",
    icon: Database,
  },
];

export default function Settings() {
  const [activeSection, setActiveSection] = useState("profile");

  return (
    <div className="min-h-full text-white bg-zinc-950">

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2 text-sm text-purple-400">
          <User size={16} />
          <span>Account</span>
        </div>

        <h1 className="text-3xl font-bold tracking-tight">
          Settings
        </h1>

        <p className="mt-2 text-zinc-500">
          Manage your Nebula AI account and application preferences.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">

        {/* Settings Navigation */}
        <aside className="p-2 border h-fit rounded-2xl border-zinc-800 bg-zinc-900/60">
          {settingsSections.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;

            return (
              <button
                key={section.id}
                type="button"
                onClick={() => setActiveSection(section.id)}
                className={`mb-1 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition last:mb-0 ${
                  isActive
                    ? "bg-purple-600 text-white"
                    : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
                }`}
              >
                <Icon size={18} />

                <span className="flex-1 text-sm font-medium">
                  {section.title}
                </span>

                <ChevronRight size={16} />
              </button>
            );
          })}
        </aside>

        {/* Settings Content */}
        <section>
          {activeSection === "profile" && <ProfileSettings />}

          {activeSection === "appearance" && <AppearanceSettings />}

          {activeSection === "notifications" && (
            <NotificationSettings />
          )}

          {activeSection === "security" && <SecuritySettings />}

          {activeSection === "billing" && <BillingSettings />}

          {activeSection === "storage" && <StorageSettings />}
        </section>
      </div>
    </div>
  );
}

function ProfileSettings() {
  return (
    <SettingsCard
      title="Profile"
      description="Update your personal information."
    >
      <div className="flex items-center gap-4 mb-8">
        <div className="flex items-center justify-center w-16 h-16 text-xl font-semibold rounded-full bg-gradient-to-br from-purple-500 to-violet-700">
          S
        </div>

        <div>
          <h3 className="font-medium text-white">
            Samuel
          </h3>

          <p className="text-sm text-zinc-500">
            Creator
          </p>
        </div>

        <button
          type="button"
          className="px-4 py-2 ml-auto text-sm border rounded-xl border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white"
        >
          Change photo
        </button>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <InputField
          label="First name"
          value="Samuel"
        />

        <InputField
          label="Last name"
          value=""
          placeholder="Enter your last name"
        />

        <InputField
          label="Email address"
          value="samuel@example.com"
          type="email"
        />

        <InputField
          label="Username"
          value="samuel"
        />
      </div>

      <SaveButton />
    </SettingsCard>
  );
}

function AppearanceSettings() {
  const [theme, setTheme] = useState("dark");

  return (
    <SettingsCard
      title="Appearance"
      description="Customize the appearance of your workspace."
    >
      <h3 className="mb-4 text-sm font-medium text-white">
        Theme
      </h3>

      <div className="grid gap-4 sm:grid-cols-3">
        {["dark", "light", "system"].map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setTheme(option)}
            className={`rounded-2xl border p-4 text-left transition ${
              theme === option
                ? "border-purple-500 bg-purple-500/10"
                : "border-zinc-800 bg-zinc-950 hover:border-zinc-700"
            }`}
          >
            <div className="h-20 mb-3 rounded-xl bg-zinc-900" />

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium capitalize">
                {option}
              </span>

              {theme === option && (
                <Check
                  size={16}
                  className="text-purple-400"
                />
              )}
            </div>
          </button>
        ))}
      </div>

      <SaveButton />
    </SettingsCard>
  );
}

function NotificationSettings() {
  return (
    <SettingsCard
      title="Notifications"
      description="Control how Nebula AI keeps you informed."
    >
      <ToggleRow
        title="Generation completed"
        description="Notify me when an image or video finishes generating."
        enabled
      />

      <ToggleRow
        title="Project updates"
        description="Receive updates about your projects."
        enabled
      />

      <ToggleRow
        title="Product announcements"
        description="Get notified about new Nebula AI features."
        enabled={false}
      />

      <ToggleRow
        title="Email notifications"
        description="Receive important notifications by email."
        enabled
      />

      <SaveButton />
    </SettingsCard>
  );
}

function SecuritySettings() {
  return (
    <SettingsCard
      title="Security"
      description="Keep your account secure."
    >
      <div className="space-y-5">
        <InputField
          label="Current password"
          type="password"
          placeholder="Enter current password"
        />

        <InputField
          label="New password"
          type="password"
          placeholder="Enter new password"
        />

        <InputField
          label="Confirm new password"
          type="password"
          placeholder="Confirm new password"
        />
      </div>

      <SaveButton text="Update password" />
    </SettingsCard>
  );
}

function BillingSettings() {
  return (
    <SettingsCard
      title="Billing & Plan"
      description="Manage your subscription and usage."
    >
      <div className="p-5 border rounded-2xl border-purple-500/30 bg-purple-500/10">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-purple-300">
              Current plan
            </p>

            <h3 className="mt-1 text-2xl font-bold">
              Creator
            </h3>

            <p className="mt-1 text-sm text-zinc-500">
              20 GB storage included
            </p>
          </div>

          <span className="px-3 py-1 text-xs font-medium bg-purple-600 rounded-lg">
            Active
          </span>
        </div>
      </div>

      <div className="p-4 mt-5 border rounded-xl border-zinc-800 bg-zinc-950">
        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-400">
            Monthly usage
          </span>

          <span className="text-sm text-white">
            0.8 GB / 20 GB
          </span>
        </div>

        <div className="h-2 mt-3 rounded-full bg-zinc-800">
          <div className="h-full w-[4%] rounded-full bg-purple-500" />
        </div>
      </div>

      <button
        type="button"
        className="px-5 py-3 mt-6 text-sm font-medium bg-purple-600 rounded-xl hover:bg-purple-500"
      >
        Manage plan
      </button>
    </SettingsCard>
  );
}

function StorageSettings() {
  return (
    <SettingsCard
      title="Storage"
      description="Manage your Nebula AI creative storage."
    >
      <div className="p-6 border rounded-2xl border-zinc-800 bg-zinc-950">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-zinc-500">
              Storage used
            </p>

            <p className="mt-1 text-2xl font-bold">
              0.8 GB
              <span className="text-sm font-normal text-zinc-600">
                {" "}
                / 20 GB
              </span>
            </p>
          </div>

          <Database
            size={28}
            className="text-purple-400"
          />
        </div>

        <div className="h-3 mt-5 overflow-hidden rounded-full bg-zinc-800">
          <div className="h-full w-[4%] rounded-full bg-purple-500" />
        </div>

        <p className="mt-3 text-xs text-zinc-600">
          You have 19.2 GB of storage remaining.
        </p>
      </div>

      <div className="flex items-center justify-between p-4 mt-5 border rounded-xl border-zinc-800">
        <div>
          <p className="text-sm font-medium">
            Clear temporary files
          </p>

          <p className="mt-1 text-xs text-zinc-600">
            Remove unused temporary generation files.
          </p>
        </div>

        <button
          type="button"
          className="px-4 py-2 text-sm border rounded-lg border-zinc-700 text-zinc-300 hover:bg-zinc-800"
        >
          Clear
        </button>
      </div>
    </SettingsCard>
  );
}

function SettingsCard({ title, description, children }) {
  return (
    <div className="p-6 border rounded-2xl border-zinc-800 bg-zinc-900/60 md:p-8">
      <div className="pb-6 mb-8 border-b border-zinc-800">
        <h2 className="text-xl font-semibold">
          {title}
        </h2>

        <p className="mt-1 text-sm text-zinc-500">
          {description}
        </p>
      </div>

      {children}
    </div>
  );
}

function InputField({
  label,
  value,
  placeholder,
  type = "text",
}) {
  return (
    <label className="block">
      <span className="block mb-2 text-sm text-zinc-400">
        {label}
      </span>

      <input
        type={type}
        defaultValue={value}
        placeholder={placeholder}
        className="w-full px-4 text-sm text-white border outline-none h-11 rounded-xl border-zinc-800 bg-zinc-950 placeholder:text-zinc-700 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/10"
      />
    </label>
  );
}

function ToggleRow({
  title,
  description,
  enabled,
}) {
  const [active, setActive] = useState(enabled);

  return (
    <div className="flex items-center justify-between py-5 border-b border-zinc-800 last:border-b-0">
      <div className="pr-6">
        <p className="text-sm font-medium text-white">
          {title}
        </p>

        <p className="mt-1 text-xs text-zinc-600">
          {description}
        </p>
      </div>

      <button
        type="button"
        onClick={() => setActive((value) => !value)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${
          active ? "bg-purple-600" : "bg-zinc-700"
        }`}
        aria-label={`Toggle ${title}`}
      >
        <span
          className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
            active ? "left-6" : "left-1"
          }`}
        />
      </button>
    </div>
  );
}

function SaveButton({ text = "Save changes" }) {
  return (
    <div className="pt-6 mt-8 border-t border-zinc-800">
      <button
        type="button"
        className="px-5 py-3 text-sm font-medium text-white transition bg-purple-600 rounded-xl hover:bg-purple-500"
      >
        {text}
      </button>
    </div>
  );
}