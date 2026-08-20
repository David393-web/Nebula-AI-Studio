export default function WorkspaceTabs() {

    const tabs = [

        "Images",

        "Videos",

        "Characters",

        "Storyboard",

    ];

    return (

        <div className="flex gap-4 border-b border-zinc-800">

            {tabs.map((tab)=>(

                <button

                    key={tab}

                    className="px-3 pb-4 border-b-2 border-transparent hover:border-purple-500 text-zinc-300"

                >

                    {tab}

                </button>

            ))}

        </div>

    );

}