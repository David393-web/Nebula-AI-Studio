import {
    Folder,
    Image,
    Video,
    Users,
} from "lucide-react";

import StatsCard from "../StatsCard";

export default function StatsGrid() {
    return (

        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">

            <StatsCard
                title="Projects"
                value="24"
                icon={Folder}
            />

            <StatsCard
                title="Images"
                value="326"
                icon={Image}
            />

            <StatsCard
                title="Videos"
                value="82"
                icon={Video}
            />

            <StatsCard
                title="Characters"
                value="18"
                icon={Users}
            />

        </section>
    );
}