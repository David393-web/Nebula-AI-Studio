const activities = [
    "Generated 5 Images",
    "Created Video",
    "Downloaded Project",
    "Storyboard Updated",
];

export default function ActivityFeed() {

    return (

        <div className="rounded-2xl border border-white/5 bg-[#141418] p-6">

            <h3 className="mb-6 text-xl font-semibold text-white">
                Activity
            </h3>

            <div className="space-y-4">

                {activities.map(activity => (

                    <div
                        key={activity}
                        className="rounded-xl bg-[#1A1A20] p-4 text-zinc-300"
                    >
                        {activity}
                    </div>

                ))}

            </div>

        </div>

    );
}