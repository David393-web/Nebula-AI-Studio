import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  LayoutDashboard,
  Sparkles,
  Users,
  Clapperboard,
  FolderOpen,
  Video,
} from "lucide-react";

import useCharacterStore from "@/stores/characters/characterStore";

import VideoPanel from "@/components/workspace/video/VideoPanel";
import AssetsPanel from "@/components/workspace/assets/AssetsPanel";
import CharactersPanel from "@/components/workspace/characters/CharactersPanel";
import GeneratePanel from "@/components/workspace/generate/GeneratePanel";

import SceneCard from "@/components/workspace/storyboard/SceneCard";
import SceneEditor from "@/components/workspace/storyboard/SceneEditor";
import SceneTimeline from "@/components/workspace/storyboard/SceneTimeline";
import StoryboardToolbar from "@/components/workspace/storyboard/StoryboardToolbar";

const tabs = [
  {
    id: "overview",
    label: "Overview",
    icon: LayoutDashboard,
  },
  {
    id: "generate",
    label: "Generate",
    icon: Sparkles,
  },
  {
    id: "characters",
    label: "Characters",
    icon: Users,
  },
  {
    id: "storyboard",
    label: "Storyboard",
    icon: Clapperboard,
  },
  {
    id: "video",
    label: "Video",
    icon: Video,
  },
  {
    id: "assets",
    label: "Assets",
    icon: FolderOpen,
  },
];

export default function ProjectWorkspace() {
  const { id } = useParams();

  const [activeTab, setActiveTab] = useState("generate");

  const [scenes, setScenes] = useState(() => {
    try {
      const savedScenes = localStorage.getItem(
        `nebula-scenes-${id}`,
      );

      if (!savedScenes) {
        return [];
      }

      const parsedScenes = JSON.parse(savedScenes);

      return Array.isArray(parsedScenes)
        ? parsedScenes
        : [];
    } catch (error) {
      console.error(
        "Failed to load storyboard scenes:",
        error,
      );

      return [];
    }
  });

  const [selectedScene, setSelectedScene] =
    useState(null);

  const [editingScene, setEditingScene] =
    useState(null);

  const [showSceneEditor, setShowSceneEditor] =
    useState(false);

  const [generationScene, setGenerationScene] =
    useState(null);

  const characters = useCharacterStore(
    (state) => state.characters,
  );

  /*
   * Save storyboard scenes.
   */
  useEffect(() => {
    try {
      localStorage.setItem(
        `nebula-scenes-${id}`,
        JSON.stringify(scenes),
      );
    } catch (error) {
      console.error(
        "Failed to save storyboard scenes:",
        error,
      );
    }
  }, [id, scenes]);

  /*
   * -----------------------------
   * Navigation
   * -----------------------------
   */

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);

    if (tabId === "generate") {
      setGenerationScene(null);
    }
  };

  /*
   * -----------------------------
   * Scene Creation
   * -----------------------------
   */

  const handleAddScene = () => {
    setEditingScene(null);
    setShowSceneEditor(true);
  };

  /*
   * -----------------------------
   * Scene Editing
   * -----------------------------
   */

  const handleEditScene = (scene) => {
    if (!scene) {
      return;
    }

    setSelectedScene(scene);
    setEditingScene(scene);
    setShowSceneEditor(true);
  };

  const handleCloseEditor = () => {
    setEditingScene(null);
    setShowSceneEditor(false);
  };

  /*
   * -----------------------------
   * Scene Saving
   * -----------------------------
   */

  const handleSaveScene = (sceneData) => {
    if (!sceneData) {
      return;
    }

    setScenes((currentScenes) => {
      const existingScene = currentScenes.some(
        (scene) => scene.id === sceneData.id,
      );

      if (existingScene) {
        return currentScenes.map((scene) =>
          scene.id === sceneData.id
            ? sceneData
            : scene,
        );
      }

      return [...currentScenes, sceneData];
    });

    setSelectedScene(sceneData);
    setEditingScene(null);
    setShowSceneEditor(false);
  };

  /*
   * -----------------------------
   * Scene Deletion
   * -----------------------------
   */

  const handleDeleteScene = (sceneId) => {
    if (!sceneId) {
      return;
    }

    setScenes((currentScenes) =>
      currentScenes.filter(
        (scene) => scene.id !== sceneId,
      ),
    );

    setSelectedScene((currentScene) =>
      currentScene?.id === sceneId
        ? null
        : currentScene,
    );

    setEditingScene((currentScene) =>
      currentScene?.id === sceneId
        ? null
        : currentScene,
    );

    setGenerationScene((currentScene) =>
      currentScene?.id === sceneId
        ? null
        : currentScene,
    );

    if (editingScene?.id === sceneId) {
      setShowSceneEditor(false);
    }
  };

  /*
   * -----------------------------
   * Scene Selection
   * -----------------------------
   */

  const handleSelectScene = (scene) => {
    if (!scene) {
      return;
    }

    setSelectedScene(scene);
  };

  /*
   * -----------------------------
   * Generate One Scene
   * -----------------------------
   */

  const handleGenerateScene = (scene) => {
    if (!scene) {
      return;
    }

    setSelectedScene(scene);
    setGenerationScene(scene);
    setActiveTab("generate");
  };

  /*
   * -----------------------------
   * Generation Completed
   * -----------------------------
   */

  const handleGeneratedResult = (generatedResult) => {
    if (!generatedResult?.sceneId) {
      return;
    }

    setScenes((currentScenes) =>
      currentScenes.map((scene) =>
        scene.id === generatedResult.sceneId
          ? {
              ...scene,
              generatedUrl:
                generatedResult.url,
              generatedType:
                generatedResult.type,
              generatedId:
                generatedResult.id,
              generatedAt:
                generatedResult.createdAt,
            }
          : scene,
      ),
    );

    setSelectedScene((currentScene) =>
      currentScene?.id === generatedResult.sceneId
        ? {
            ...currentScene,
            generatedUrl:
              generatedResult.url,
            generatedType:
              generatedResult.type,
            generatedId:
              generatedResult.id,
            generatedAt:
              generatedResult.createdAt,
          }
        : currentScene,
    );
  };

  /*
   * -----------------------------
   * Generate All Scenes
   * -----------------------------
   */

  const handleGenerateAll = () => {
    if (scenes.length === 0) {
      return;
    }

    console.log(
      "Generation queue prepared:",
      scenes,
    );

    const firstScene = scenes[0];

    setSelectedScene(firstScene);
    setGenerationScene(firstScene);
    setActiveTab("generate");
  };

  /*
   * -----------------------------
   * Refresh Storyboard
   * -----------------------------
   */

  const handleRefreshStoryboard = () => {
    setSelectedScene(null);
    setEditingScene(null);
    setGenerationScene(null);
    setShowSceneEditor(false);
  };

  /*
   * -----------------------------
   * Video Generation
   * -----------------------------
   */

  const handleGenerateVideo = (videoData) => {
    console.log(
      "Video generation requested:",
      videoData,
    );
  };

  return (
    <div className="min-h-full text-white">
      {/* --------------------------------
          Workspace Header
      --------------------------------- */}
      <header className="border-b border-zinc-800/70 bg-zinc-950/40">
        <div className="flex items-center justify-between px-2 py-5">
          <div>
            <p className="text-sm text-zinc-500">
              Project Workspace
            </p>

            <h1 className="mt-1 text-2xl font-bold">
              Project {id}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-3 py-1 text-xs border rounded-full text-zinc-400 border-zinc-800">
              AI Studio
            </span>
          </div>
        </div>

        {/* --------------------------------
            Workspace Tabs
        --------------------------------- */}
        <div className="flex gap-1 px-2 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() =>
                  handleTabChange(tab.id)
                }
                className={`flex items-center gap-2 rounded-t-lg px-4 py-3 text-sm font-medium transition border-b-2 whitespace-nowrap ${
                  active
                    ? "text-white border-purple-500"
                    : "text-zinc-500 border-transparent hover:text-white"
                }`}
              >
                <Icon size={17} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </header>

      {/* --------------------------------
          Workspace Content
      --------------------------------- */}
      <main className="p-6">
        {/* --------------------------------
            Overview
        --------------------------------- */}
        {activeTab === "overview" && (
          <WorkspacePlaceholder
            title="Overview"
            description="View and manage your AI project workspace."
            icon={LayoutDashboard}
          />
        )}

        {/* --------------------------------
            Generate
        --------------------------------- */}
        {activeTab === "generate" && (
          <GeneratePanel
            key={generationScene?.id || "default"}
            scene={generationScene}
            onGenerated={handleGeneratedResult}
          />
        )}

        {/* --------------------------------
            Characters
        --------------------------------- */}
        {activeTab === "characters" && (
          <CharactersPanel />
        )}

        {/* --------------------------------
            Storyboard
        --------------------------------- */}
        {activeTab === "storyboard" && (
          <div className="space-y-6">
            <StoryboardToolbar
              sceneCount={scenes.length}
              onAddScene={handleAddScene}
              onGenerateAll={handleGenerateAll}
              onRefresh={handleRefreshStoryboard}
            />

            {/* Scene Editor */}
            {showSceneEditor && (
              <div className="max-w-3xl">
                <SceneEditor
                  key={
                    editingScene?.id || "new"
                  }
                  scene={editingScene}
                  onSave={handleSaveScene}
                  onClose={handleCloseEditor}
                />
              </div>
            )}

            {/* Scene Timeline */}
            <SceneTimeline
              scenes={scenes}
              selectedScene={selectedScene}
              onSelect={handleSelectScene}
              onAdd={handleAddScene}
              onGenerate={handleGenerateScene}
            />

            {/* Scene Cards */}
            {scenes.length > 0 && (
              <div>
                <div className="mb-4">
                  <h2 className="text-lg font-semibold text-white">
                    Scene Generations
                  </h2>

                  <p className="mt-1 text-sm text-zinc-500">
                    Review and generate individual
                    storyboard scenes.
                  </p>
                </div>

                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {scenes.map(
                    (scene, index) => (
                      <SceneCard
                        key={scene.id}
                        scene={scene}
                        index={index}
                        selected={
                          selectedScene?.id ===
                          scene.id
                        }
                        onSelect={
                          handleSelectScene
                        }
                        onEdit={
                          handleEditScene
                        }
                        onDelete={
                          handleDeleteScene
                        }
                        onGenerate={
                          handleGenerateScene
                        }
                      />
                    ),
                  )}
                </div>
              </div>
            )}

            {/* Empty State */}
            {scenes.length === 0 &&
              !showSceneEditor && (
                <div className="flex flex-col items-center justify-center p-10 text-center border border-dashed rounded-2xl border-zinc-800 bg-zinc-900/40">
                  <div className="flex items-center justify-center mb-4 w-14 h-14 rounded-2xl bg-purple-500/10">
                    <Clapperboard
                      size={26}
                      className="text-purple-400"
                    />
                  </div>

                  <h2 className="text-xl font-semibold text-white">
                    Build your first scene
                  </h2>

                  <p className="max-w-md mt-2 text-sm leading-6 text-zinc-500">
                    Create a scene prompt and
                    define whether Nebula should
                    generate an image or video.
                  </p>

                  <button
                    type="button"
                    onClick={handleAddScene}
                    className="px-5 py-2.5 mt-5 text-sm font-medium text-white transition bg-purple-600 rounded-lg hover:bg-purple-700"
                  >
                    Create First Scene
                  </button>
                </div>
              )}
          </div>
        )}

        {/* --------------------------------
            Video
        --------------------------------- */}
        {activeTab === "video" && (
          <VideoPanel
            scenes={scenes}
            characters={characters}
            onGenerateVideo={
              handleGenerateVideo
            }
          />
        )}

        {/* --------------------------------
            Assets
        --------------------------------- */}
        {activeTab === "assets" && (
          <AssetsPanel />
        )}
      </main>
    </div>
  );
}

function WorkspacePlaceholder({
  title,
  description,
  icon: Icon,
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center border rounded-2xl border-zinc-800 bg-zinc-900/40">
      <div className="flex items-center justify-center mb-5 w-14 h-14 rounded-2xl bg-purple-500/10">
        <Icon
          size={26}
          className="text-purple-400"
        />
      </div>

      <h2 className="text-2xl font-semibold">
        {title}
      </h2>

      <p className="max-w-lg mt-2 text-zinc-500">
        {description}
      </p>
    </div>
  );
}