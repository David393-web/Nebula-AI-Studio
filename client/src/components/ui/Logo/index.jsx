export default function Logo() {
    return (
        <div className="flex items-center gap-3">
            <div className="flex items-center justify-center text-xl font-bold h-11 w-11 rounded-2xl bg-violet-600">
                N
            </div>

            <div>
                <h1 className="text-lg font-bold text-white">
                    Nebula AI
                </h1>

                <p className="text-xs text-zinc-400">
                    Studio
                </p>
            </div>
        </div>
    );
}