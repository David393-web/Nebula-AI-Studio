import {
  Image,
  Video,
  Users,
  Clapperboard,
} from "lucide-react";

const stats = [
  {
    icon: Image,
    title: "Images",
    value: 0,
  },
  {
    icon: Video,
    title: "Videos",
    value: 0,
  },
  {
    icon: Users,
    title: "Characters",
    value: 0,
  },
  {
    icon: Clapperboard,
    title: "Scenes",
    value: 0,
  },
];

export default function ProjectStats() {
  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">

      {stats.map((item) => (
        <div
          key={item.title}
          className="p-6 border rounded-2xl bg-zinc-900 border-zinc-800"
        >
          <item.icon className="mb-5 text-purple-500" />

          <h3 className="text-zinc-400">
            {item.title}
          </h3>

          <p className="mt-2 text-3xl font-bold">
            {item.value}
          </p>

        </div>
      ))}

    </div>
  );
}