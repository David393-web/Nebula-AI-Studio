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

import api from "@/services/api";

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

  const [project, setProject] = useState(null);
  const [projectLoading, setProjectLoading] = useState(true);
  const [projectError, setProjectError] = useState("");

  const [activeTab, setActiveTab] = useState("generate");

  const [scenes, setScenes] = useState([]);
  const [storyboardLoading, setStoryboardLoading] = useState(true);
  const [storyboardError, setStoryboardError] = useState("");

  const [selectedScene, setSelectedScene] = useState(null);
  const [editingScene, setEditingScene] = useState(null);
  const [showSceneEditor, setShowSceneEditor] = useState(false);
  const [generationScene, setGenerationScene] = useState(null);

  const characters = useCharacterStore(
    (state) => state.characters,
  );

  /*
   * --------------------------------
   * Load Project + Storyboard
   * --------------------------------
   */
  useEffect(() => {
    let cancelled = false;

    const loadWorkspace = async () => {
      if (!id) {
        if (!cancelled) {
          setProject(null);
          setProjectError("Project ID is missing.");
          setProjectLoading(false);
          setStoryboardLoading(false);
        }

        return;
      }

      try {
        const projectResponse = await api.get(
          `/projects/${id}`,
        );

        const loadedProject =
          projectResponse.data?.data?.project || null;

        if (!loadedProject) {
          throw new Error("Project not found.");
        }

        if (!cancelled) {
          setProject(loadedProject);
          setProjectError("");
        }

        const storyboardResponse = await api.get(
          `/storyboards/project/${id}`,
        );

        const data =
          storyboardResponse.data?.data;

        const storyboardItems =
          data?.storyboards ||
          data?.scenes ||
          data ||
          [];

        const normalizedScenes = Array.isArray(
          storyboardItems,
        )
          ? storyboardItems
              .map((scene) =>
                normalizeStoryboard(scene),
              )
              .filter(Boolean)
          : [];

        if (!cancelled) {
          setScenes(normalizedScenes);

          setSelectedScene(
            (currentScene) => {
              if (!currentScene) {
                return null;
              }

              return (
                normalizedScenes.find(
                  (scene) =>
                    scene.id ===
                    currentScene.id,
                ) || null
              );
            },
          );

          setStoryboardError("");
        }
      } catch (error) {
        console.error(
          "Failed to load project workspace:",
          error,
        );

        if (!cancelled) {
          const message =
            error.response?.data?.message ||
            error.message ||
            "Failed to load project.";

          setProjectError(message);
          setProject(null);
          setScenes([]);
          setStoryboardError(
            error.response?.data?.message ||
              error.message ||
              "Failed to load storyboard.",
          );
        }
      } finally {
        if (!cancelled) {
          setProjectLoading(false);
          setStoryboardLoading(false);
        }
      }
    };

    loadWorkspace();

    return () => {
      cancelled = true;
    };
  }, [id]);

  /*
   * --------------------------------
   * Refresh Storyboard
   * --------------------------------
   */
  const handleRefreshStoryboard = async () => {
    if (!id) {
      return;
    }

    setStoryboardLoading(true);
    setStoryboardError("");

    try {
      const response = await api.get(
        `/storyboards/project/${id}`,
      );

      const data = response.data?.data;

      const storyboardItems =
        data?.storyboards ||
        data?.scenes ||
        data ||
        [];

      const normalizedScenes = Array.isArray(
        storyboardItems,
      )
        ? storyboardItems
            .map((scene) =>
              normalizeStoryboard(scene),
            )
            .filter(Boolean)
        : [];

      setScenes(normalizedScenes);

      setSelectedScene((currentScene) => {
        if (!currentScene) {
          return null;
        }

        return (
          normalizedScenes.find(
            (scene) =>
              scene.id === currentScene.id,
          ) || null
        );
      });
    } catch (error) {
      console.error(
        "Failed to refresh storyboard:",
        error,
      );

      setStoryboardError(
        error.response?.data?.message ||
          error.message ||
          "Failed to refresh storyboard.",
      );
    } finally {
      setStoryboardLoading(false);
    }
  };

  /*
   * --------------------------------
   * Navigation
   * --------------------------------
   */
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);

    if (tabId === "generate") {
      setGenerationScene(null);
    }
  };

  /*
   * --------------------------------
   * Scene Creation
   * --------------------------------
   */
  const handleAddScene = () => {
    setSelectedScene(null);
    setEditingScene(null);
    setShowSceneEditor(true);
  };

  /*
   * --------------------------------
   * Scene Editing
   * --------------------------------
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
   * --------------------------------
   * Scene Saving
   * --------------------------------
   */
  const handleSaveScene = async (sceneData) => {
    if (!sceneData || !id) {
      return;
    }

    setStoryboardError("");

    try {
      const existingScene = scenes.find(
        (scene) => scene.id === sceneData.id,
      );

      const payload = {
        name:
          sceneData.name ||
          sceneData.title ||
          "Untitled Scene",

        description:
          sceneData.description || null,

        imageUrl:
          sceneData.imageUrl || null,

        projectId: id,

        scenes: Array.isArray(sceneData.scenes)
          ? sceneData.scenes
          : null,

        metadata: {
          ...(sceneData.metadata &&
          typeof sceneData.metadata === "object"
            ? sceneData.metadata
            : {}),
          ...sceneData,
        },
      };

      let response;

      if (existingScene) {
        response = await api.patch(
          `/storyboards/${sceneData.id}`,
          payload,
        );
      } else {
        response = await api.post(
          "/storyboards",
          payload,
        );
      }

      const savedStoryboard =
        response.data?.data?.storyboard ||
        response.data?.data?.storyboards?.[0] ||
        response.data?.data?.scene ||
        null;

      if (!savedStoryboard) {
        throw new Error(
          "Storyboard was saved but no record was returned.",
        );
      }

      const savedScene =
        normalizeStoryboard(savedStoryboard);

      if (!savedScene) {
        throw new Error(
          "The saved storyboard could not be normalized.",
        );
      }

      setScenes((currentScenes) => {
        const alreadyExists =
          currentScenes.some(
            (scene) =>
              scene.id === savedScene.id,
          );

        if (alreadyExists) {
          return currentScenes.map((scene) =>
            scene.id === savedScene.id
              ? savedScene
              : scene,
          );
        }

        return [...currentScenes, savedScene];
      });

      setSelectedScene(savedScene);
      setEditingScene(null);
      setShowSceneEditor(false);
    } catch (error) {
      console.error(
        "Failed to save storyboard scene:",
        error,
      );

      setStoryboardError(
        error.response?.data?.message ||
          error.message ||
          "Failed to save storyboard scene.",
      );
    }
  };

  /*
   * --------------------------------
   * Scene Deletion
   * --------------------------------
   */
  const handleDeleteScene = async (sceneId) => {
    if (!sceneId) {
      return;
    }

    setStoryboardError("");

    try {
      await api.delete(
        `/storyboards/${sceneId}`,
      );

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
    } catch (error) {
      console.error(
        "Failed to delete storyboard scene:",
        error,
      );

      setStoryboardError(
        error.response?.data?.message ||
          error.message ||
          "Failed to delete storyboard scene.",
      );
    }
  };

  /*
   * --------------------------------
   * Scene Selection
   * --------------------------------
   */
  const handleSelectScene = (scene) => {
    if (!scene) {
      return;
    }

    setSelectedScene(scene);
  };

  /*
   * --------------------------------
   * Generate One Scene
   * --------------------------------
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
   * --------------------------------
   * Generation Completed
   * --------------------------------
   */
  const handleGeneratedResult = (
    generatedResult,
  ) => {
    if (!generatedResult?.sceneId) {
      return;
    }

    setScenes((currentScenes) =>
      currentScenes.map((scene) => {
        if (
          scene.id !==
          generatedResult.sceneId
        ) {
          return scene;
        }

        return {
          ...scene,

          generatedUrl:
            generatedResult.url,

          generatedType:
            generatedResult.type,

          generatedId:
            generatedResult.id,

          generatedAt:
            generatedResult.createdAt,
        };
      }),
    );

    setSelectedScene((currentScene) => {
      if (
        currentScene?.id !==
        generatedResult.sceneId
      ) {
        return currentScene;
      }

      return {
        ...currentScene,

        generatedUrl:
          generatedResult.url,

        generatedType:
          generatedResult.type,

        generatedId:
          generatedResult.id,

        generatedAt:
          generatedResult.createdAt,
      };
    });
  };

  /*
   * --------------------------------
   * Generate All Scenes
   * --------------------------------
   */
  const handleGenerateAll = () => {
    if (scenes.length === 0) {
      return;
    }

    const firstScene = scenes[0];

    setSelectedScene(firstScene);
    setGenerationScene(firstScene);
    setActiveTab("generate");
  };

  /*
   * --------------------------------
   * Video Generation
   * --------------------------------
   */
  const handleGenerateVideo = (videoData) => {
    console.log(
      "Video generation requested:",
      videoData,
    );
  };

  /*
   * --------------------------------
   * Project Loading State
   * --------------------------------
   */
  if (projectLoading) {
    return (
      <div className="flex items-center justify-center min-h-[500px] text-sm text-zinc-500">
        Loading project...
      </div>
    );
  }

  /*
   * --------------------------------
   * Project Error State
   * --------------------------------
   */
  if (projectError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] p-8 text-center">
        <div className="flex items-center justify-center mb-5 w-14 h-14 rounded-2xl bg-red-500/10">
          <FolderOpen
            size={26}
            className="text-red-400"
          />
        </div>

        <h2 className="text-xl font-semibold text-white">
          Unable to load project
        </h2>

        <p className="max-w-md mt-2 text-sm text-zinc-500">
          {projectError}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-full text-white">
      {/* --------------------------------
          Workspace Header
      --------------------------------- */}
      <header className="border-b border-zinc-800/70 bg-zinc-950/40">
        <div className="flex items-center justify-between px-2 py-5">
          <div className="min-w-0">
            <p className="text-sm text-zinc-500">
              Project Workspace
            </p>

            <h1 className="mt-1 text-2xl font-bold truncate">
              {project?.name ||
                "Untitled Project"}
            </h1>

            {project?.description && (
              <p className="max-w-xl mt-1 text-sm truncate text-zinc-600">
                {project.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="px-3 py-1 text-xs border rounded-full text-zinc-400 border-zinc-800">
              AI Studio
            </span>

            {project?.status && (
              <span className="hidden px-3 py-1 text-xs border rounded-full sm:inline-flex text-zinc-400 border-zinc-800">
                {project.status}
              </span>
            )}
          </div>
        </div>

        {/* --------------------------------
            Workspace Tabs
        --------------------------------- */}
        <div className="flex gap-1 px-2 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active =
              activeTab === tab.id;

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
            key={
              generationScene?.id ||
              "default"
            }
            scene={generationScene}
            onGenerated={
              handleGeneratedResult
            }
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
              onGenerateAll={
                handleGenerateAll
              }
              onRefresh={
                handleRefreshStoryboard
              }
            />

            {/* Storyboard Error */}
            {storyboardError && (
              <div className="p-4 border rounded-xl border-red-500/20 bg-red-500/5">
                <p className="text-sm text-red-400">
                  {storyboardError}
                </p>
              </div>
            )}

            {/* Storyboard Loading */}
            {storyboardLoading && (
              <div className="flex items-center justify-center py-10 text-sm text-zinc-500">
                Loading storyboard...
              </div>
            )}

            {/* Scene Editor */}
            {!storyboardLoading &&
              showSceneEditor && (
                <div className="max-w-3xl">
                  <SceneEditor
                    key={
                      editingScene?.id ||
                      "new"
                    }
                    scene={editingScene}
                    onSave={handleSaveScene}
                    onClose={
                      handleCloseEditor
                    }
                  />
                </div>
              )}

            {/* Scene Timeline */}
            {!storyboardLoading && (
              <SceneTimeline
                scenes={scenes}
                selectedScene={selectedScene}
                onSelect={handleSelectScene}
                onAdd={handleAddScene}
                onGenerate={
                  handleGenerateScene
                }
              />
            )}

            {/* Scene Cards */}
            {!storyboardLoading &&
              scenes.length > 0 && (
                <div>
                  <div className="mb-4">
                    <h2 className="text-lg font-semibold text-white">
                      Scene Generations
                    </h2>

                    <p className="mt-1 text-sm text-zinc-500">
                      Review and generate
                      individual storyboard
                      scenes.
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
            {!storyboardLoading &&
              scenes.length === 0 &&
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

/*
 * --------------------------------
 * Normalize Storyboard
 * --------------------------------
 */
function normalizeStoryboard(storyboard) {
  if (!storyboard) {
    return null;
  }

  const metadata =
    storyboard.metadata &&
    typeof storyboard.metadata === "object"
      ? storyboard.metadata
      : {};

  return {
    ...storyboard,

    id: storyboard.id,

    name:
      storyboard.name ||
      metadata.name ||
      metadata.title ||
      "Untitled Scene",

    title:
      storyboard.title ||
      metadata.title ||
      storyboard.name ||
      "Untitled Scene",

    description:
      storyboard.description ||
      metadata.description ||
      "",

    imageUrl:
      storyboard.imageUrl ||
      metadata.imageUrl ||
      null,

    projectId:
      storyboard.projectId ||
      metadata.projectId ||
      null,

    metadata,
  };
}

/*
 * --------------------------------
 * Workspace Placeholder
 * --------------------------------
 */
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