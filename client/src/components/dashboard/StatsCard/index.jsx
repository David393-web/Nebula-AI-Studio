import { motion } from "framer-motion";

export default function StatsCard({
    title,
    value,
    icon: Icon,
    color = "from-violet-600 to-purple-500",
}) {
    return (
        <motion.div
            whileHover={{ y: -6 }}
            transition={{ duration: .25 }}
            className="rounded-2xl border border-white/5 bg-[#141418] p-6"
        >
            <div className="flex items-center justify-between">

                <div>

                    <p className="text-sm text-zinc-400">
                        {title}
                    </p>

                    <h2 className="mt-3 text-4xl font-bold text-white">
                        {value}
                    </h2>

                </div>

                <div
                    className={`flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-r ${color}`}
                >
                    <Icon className="text-white h-7 w-7" />
                </div>

            </div>
        </motion.div>
    );
}