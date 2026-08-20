import { motion } from "framer-motion";

export default function DashboardHeader() {
    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10"
        >
            <h1 className="text-5xl font-bold text-white">
                Welcome back 👋
            </h1>

            <p className="mt-2 text-lg text-zinc-400">
                Let's create something amazing today.
            </p>
        </motion.div>
    );
}