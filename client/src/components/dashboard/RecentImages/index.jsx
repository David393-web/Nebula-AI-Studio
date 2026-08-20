const images = [1, 2, 3, 4];

export default function RecentImages() {

    return (

        <div className="rounded-2xl border border-white/5 bg-[#141418] p-6">

            <h3 className="mb-6 text-xl font-semibold text-white">
                Recent Images
            </h3>

            <div className="grid grid-cols-2 gap-4">

                {images.map(image => (

                    <div
                        key={image}
                        className="aspect-square rounded-xl bg-zinc-800"
                    />

                ))}

            </div>

        </div>

    );
}