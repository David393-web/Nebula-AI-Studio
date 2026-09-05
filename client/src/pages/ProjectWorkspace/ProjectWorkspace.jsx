import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  Clapperboard,
  FolderOpen,
  Image,
  LayoutDashboard,
  Play,
  Plus,
  Sparkles,
  Users,
  Video,
  WandSparkles,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

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
  const navigate = useNavigate();

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

  const characters = useCharacterStore((state) => state.characters);

  /*
   * --------------------------------
   * Load Project
   * --------------------------------
   */
  const loadProject = useCallback(async (projectId) => {
    const response = await api.get(`/projects/${projectId}`);

    const loadedProject =
      response.data?.data?.project || response.data?.project || null;

    if (!loadedProject) {
      throw new Error("Project not found.");
    }

    return loadedProject;
  }, []);

  /*
   * --------------------------------
   * Load Storyboard
   * --------------------------------
   */
  const loadStoryboard = useCallback(async (projectId) => {
    const response = await api.get(`/storyboards/project/${projectId}`);

    const data = response.data?.data;

    const storyboardItems = data?.storyboards || data?.scenes || data || [];

    if (!Array.isArray(storyboardItems)) {
      return [];
    }

    return storyboardItems.map(normalizeStoryboard).filter(Boolean);
  }, []);

  /*
   * --------------------------------
   * Load Workspace
   * --------------------------------
   */
  useEffect(() => {
    let cancelled = false;

    const loadWorkspace = async () => {
      if (!id) {
        if (!cancelled) {
          setProject(null);
          setScenes([]);
          setSelectedScene(null);
          setGenerationScene(null);
          setProjectError("Project ID is missing.");
          setStoryboardError("");
          setProjectLoading(false);
          setStoryboardLoading(false);
        }

        return;
      }

      setProjectLoading(true);
      setStoryboardLoading(true);
      setProjectError("");
      setStoryboardError("");

      try {
        const [loadedProject, loadedScenes] = await Promise.all([
          loadProject(id),
          loadStoryboard(id),
        ]);

        if (cancelled) {
          return;
        }

        setProject(loadedProject);
        setScenes(loadedScenes);

        setSelectedScene((currentScene) => {
          if (!currentScene?.id) {
            return null;
          }

          return (
            loadedScenes.find((scene) => scene.id === currentScene.id) || null
          );
        });

        setGenerationScene((currentScene) => {
          if (!currentScene?.id) {
            return null;
          }

          return (
            loadedScenes.find((scene) => scene.id === currentScene.id) || null
          );
        });
      } catch (error) {
        console.error("Failed to load project workspace:", error);

        if (!cancelled) {
          const message =
            error.response?.data?.message ||
            error.message ||
            "Failed to load project.";

          setProjectError(message);
          setProject(null);
          setScenes([]);
          setSelectedScene(null);
          setGenerationScene(null);
          setStoryboardError(message);
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
  }, [id, loadProject, loadStoryboard]);

  /*
   * --------------------------------
   * Refresh Storyboard
   * --------------------------------
   */
  const handleRefreshStoryboard = useCallback(async () => {
    if (!id) {
      return;
    }

    setStoryboardLoading(true);
    setStoryboardError("");

    try {
      const loadedScenes = await loadStoryboard(id);

      setScenes(loadedScenes);

      setSelectedScene((currentScene) => {
        if (!currentScene?.id) {
          return null;
        }

        return (
          loadedScenes.find((scene) => scene.id === currentScene.id) || null
        );
      });

      setGenerationScene((currentScene) => {
        if (!currentScene?.id) {
          return null;
        }

        return (
          loadedScenes.find((scene) => scene.id === currentScene.id) || null
        );
      });
    } catch (error) {
      console.error("Failed to refresh storyboard:", error);

      setStoryboardError(
        error.response?.data?.message ||
          error.message ||
          "Failed to refresh storyboard.",
      );
    } finally {
      setStoryboardLoading(false);
    }
  }, [id, loadStoryboard]);

  /*
   * --------------------------------
   * Navigation
   * --------------------------------
   */
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);

    if (tabId === "generate") {
      /*
       * Do not clear generationScene here.
       *
       * A storyboard scene can intentionally open
       * the Generate tab with its scene selected.
       */
    }
  };

  const handleBackToProjects = () => {
    navigate("/projects");
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
    setActiveTab("storyboard");
  };

  /*
   * --------------------------------
   * Scene Editing
   * --------------------------------
   */
  const handleEditScene = (scene) => {
    if (!scene?.id) {
      return;
    }

    setSelectedScene(scene);
    setEditingScene(scene);
    setShowSceneEditor(true);
    setActiveTab("storyboard");
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
      throw new Error("Unable to save scene. Project information is missing.");
    }

    setStoryboardError("");

    try {
      const existingScene = sceneData.id
        ? scenes.find((scene) => scene.id === sceneData.id)
        : null;

      const metadata = {
        ...(sceneData.metadata && typeof sceneData.metadata === "object"
          ? sceneData.metadata
          : {}),
      };

      /*
       * Keep scene-specific editor data inside
       * metadata because the Storyboard model
       * stores flexible scene information there.
       */
      if (sceneData.prompt !== undefined) {
        metadata.prompt = sceneData.prompt || "";
      }

      if (sceneData.type !== undefined) {
        metadata.type = sceneData.type || "image";
      }

      if (sceneData.notes !== undefined) {
        metadata.notes = sceneData.notes || "";
      }

      if (sceneData.character !== undefined) {
        metadata.character = sceneData.character || null;
      }

      if (sceneData.generatedUrl !== undefined) {
        metadata.generatedUrl = sceneData.generatedUrl || null;
      }

      if (sceneData.generatedType !== undefined) {
        metadata.generatedType = sceneData.generatedType || null;
      }

      if (sceneData.generatedId !== undefined) {
        metadata.generatedId = sceneData.generatedId || null;
      }

      if (sceneData.generatedAt !== undefined) {
        metadata.generatedAt = sceneData.generatedAt || null;
      }

      const payload = {
        name: sceneData.name || sceneData.title || "Untitled Scene",

        description: sceneData.description || sceneData.prompt || null,

        imageUrl: sceneData.imageUrl || sceneData.image || null,

        projectId: id,

        scenes: Array.isArray(sceneData.scenes) ? sceneData.scenes : null,

        metadata,
      };

      let response;

      if (existingScene) {
        response = await api.patch(`/storyboards/${existingScene.id}`, payload);
      } else {
        response = await api.post("/storyboards", payload);
      }

      const savedStoryboard =
        response.data?.data?.storyboard ||
        response.data?.data?.storyboards?.[0] ||
        response.data?.data?.scene ||
        response.data?.storyboard ||
        null;

      if (!savedStoryboard) {
        throw new Error("Storyboard was saved but no record was returned.");
      }

      const savedScene = normalizeStoryboard(savedStoryboard);

      if (!savedScene?.id) {
        throw new Error("The saved storyboard could not be normalized.");
      }

      setScenes((currentScenes) => {
        const exists = currentScenes.some(
          (scene) => scene.id === savedScene.id,
        );

        if (exists) {
          return currentScenes.map((scene) =>
            scene.id === savedScene.id ? savedScene : scene,
          );
        }

        return [...currentScenes, savedScene];
      });

      setSelectedScene(savedScene);
      setEditingScene(null);
      setShowSceneEditor(false);

      return savedScene;
    } catch (error) {
      console.error("Failed to save storyboard scene:", error);

      setStoryboardError(
        error.response?.data?.message ||
          error.message ||
          "Failed to save storyboard scene.",
      );

      /*
       * Important:
       * Re-throw so SceneEditor knows the save
       * failed and can keep the editor open.
       */
      throw error;
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
      await api.delete(`/storyboards/${sceneId}`);

      setScenes((currentScenes) =>
        currentScenes.filter((scene) => scene.id !== sceneId),
      );

      setSelectedScene((currentScene) =>
        currentScene?.id === sceneId ? null : currentScene,
      );

      setEditingScene((currentScene) =>
        currentScene?.id === sceneId ? null : currentScene,
      );

      setGenerationScene((currentScene) =>
        currentScene?.id === sceneId ? null : currentScene,
      );

      if (editingScene?.id === sceneId) {
        setShowSceneEditor(false);
      }
    } catch (error) {
      console.error("Failed to delete storyboard scene:", error);

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
    if (!scene?.id) {
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
    if (!scene?.id) {
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
  const handleGeneratedResult = useCallback(
    async (generatedResult) => {
      if (!generatedResult) {
        return;
      }

      /*
       * A generation can exist without belonging
       * to a storyboard scene.
       */
      if (!generatedResult.sceneId) {
        return;
      }

      const updateScene = (scene) => {
        if (scene.id !== generatedResult.sceneId) {
          return scene;
        }

        return {
          ...scene,

          generatedUrl:
            generatedResult.url ||
            generatedResult.generatedUrl ||
            generatedResult.imageUrl ||
            generatedResult.videoUrl ||
            null,

          generatedType:
            generatedResult.type || generatedResult.generatedType || null,

          generatedId:
            generatedResult.id || generatedResult.generatedId || null,

          generatedAt:
            generatedResult.createdAt ||
            generatedResult.generatedAt ||
            new Date().toISOString(),
        };
      };

      const updatedScene = scenes
        .map(updateScene)
        .find((scene) => scene.id === generatedResult.sceneId);

      /*
       * Always update the visible UI immediately.
       */
      setScenes((currentScenes) => currentScenes.map(updateScene));

      setSelectedScene((currentScene) =>
        currentScene?.id === generatedResult.sceneId
          ? updateScene(currentScene)
          : currentScene,
      );

      setGenerationScene((currentScene) =>
        currentScene?.id === generatedResult.sceneId
          ? updateScene(currentScene)
          : currentScene,
      );

      /*
       * Persist the generation metadata so it
       * survives a workspace refresh.
       */
      if (!updatedScene) {
        return;
      }

      try {
        const metadata = {
          ...(updatedScene.metadata && typeof updatedScene.metadata === "object"
            ? updatedScene.metadata
            : {}),

          generatedUrl: updatedScene.generatedUrl || null,

          generatedType: updatedScene.generatedType || null,

          generatedId: updatedScene.generatedId || null,

          generatedAt: updatedScene.generatedAt || null,
        };

        const response = await api.patch(`/storyboards/${updatedScene.id}`, {
          name: updatedScene.name || updatedScene.title || "Untitled Scene",

          description: updatedScene.description || updatedScene.prompt || null,

          imageUrl: updatedScene.imageUrl || updatedScene.image || null,

          projectId: id,

          scenes: Array.isArray(updatedScene.scenes)
            ? updatedScene.scenes
            : null,

          metadata,
        });

        const savedStoryboard =
          response.data?.data?.storyboard || response.data?.storyboard || null;

        if (savedStoryboard) {
          const persistedScene = normalizeStoryboard(savedStoryboard);

          if (persistedScene?.id) {
            setScenes((currentScenes) =>
              currentScenes.map((scene) =>
                scene.id === persistedScene.id ? persistedScene : scene,
              ),
            );

            setSelectedScene((currentScene) =>
              currentScene?.id === persistedScene.id
                ? persistedScene
                : currentScene,
            );

            setGenerationScene((currentScene) =>
              currentScene?.id === persistedScene.id
                ? persistedScene
                : currentScene,
            );
          }
        }
      } catch (error) {
        /*
         * The generation itself succeeded, so don't
         * erase the visible result. Surface the
         * persistence problem instead.
         */
        console.error(
          "Generation succeeded but storyboard persistence failed:",
          error,
        );

        setStoryboardError(
          error.response?.data?.message ||
            error.message ||
            "Generation completed, but the result could not be saved to the storyboard.",
        );
      }
    },
    [id, scenes],
  );

  /*
   * --------------------------------
   * Generate All
   * --------------------------------
   *
   * The actual generation queue belongs to the
   * generation system. Until that system exposes
   * a queue/batch API, this safely opens the first
   * scene rather than pretending all scenes were
   * generated.
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
 *
 * VideoPanel handles the actual video creation
 * and keeps the generated result available for
 * immediate preview.
 *
 * ProjectWorkspace only responds to the successful
 * generation event and keeps the user on the Video tab.
 * --------------------------------
 */
const handleGenerateVideo = (videoData) => {
  if (!videoData) {
    return;
  }

  console.log(
    "Video generated successfully:",
    videoData,
  );

  setActiveTab("video");
};

  /*
   * --------------------------------
   * Loading State
   * --------------------------------
   */
  if (projectLoading) {
    return <WorkspaceLoading />;
  }

  /*
   * --------------------------------
   * Project Error State
   * --------------------------------
   */
  if (projectError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px] p-8 text-center bg-zinc-950">
        <div className="flex items-center justify-center w-16 h-16 mb-5 rounded-2xl bg-red-500/10">
          <FolderOpen size={28} className="text-red-400" />
        </div>

        <h2 className="text-xl font-semibold text-white">
          Unable to load project
        </h2>

        <p className="max-w-md mt-2 text-sm leading-6 text-zinc-500">
          {projectError}
        </p>

        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={handleBackToProjects}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition border rounded-lg text-zinc-300 border-zinc-800 hover:bg-zinc-900 hover:text-white"
          >
            <ArrowLeft size={16} />
            Back to Projects
          </button>

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-4 py-2.5 text-sm font-medium text-white transition bg-purple-600 rounded-lg hover:bg-purple-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const generatedSceneCount = scenes.filter((scene) =>
    Boolean(scene?.generatedUrl),
  ).length;

  const assetCount = Array.isArray(project?.assets) ? project.assets.length : 0;

  return (
    <div className="min-h-full text-white bg-zinc-950">
      {/* --------------------------------
          Workspace Header
      --------------------------------- */}
      <header className="sticky top-0 z-30 border-b border-zinc-800/80 bg-zinc-950/95 backdrop-blur-xl">
        <div className="px-4 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start min-w-0 gap-3">
              <button
                type="button"
                onClick={handleBackToProjects}
                aria-label="Back to projects"
                className="flex items-center justify-center flex-shrink-0 w-10 h-10 mt-1 transition border rounded-xl border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white hover:border-zinc-700"
              >
                <ArrowLeft size={18} />
              </button>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium tracking-wider text-purple-400 uppercase">
                    AI Studio
                  </span>

                  <span className="text-zinc-700">/</span>

                  <span className="text-xs text-zinc-500">
                    Project Workspace
                  </span>
                </div>

                <h1 className="mt-1 text-xl font-bold truncate sm:text-2xl">
                  {project?.name || "Untitled Project"}
                </h1>

                {project?.description && (
                  <p className="max-w-2xl mt-1 text-sm truncate text-zinc-500">
                    {project.description}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center flex-shrink-0 gap-2">
              {project?.status && <StatusBadge status={project.status} />}

              <button
                type="button"
                onClick={() => handleTabChange("generate")}
                className="hidden items-center gap-2 px-4 py-2.5 text-sm font-medium text-white transition bg-purple-600 rounded-lg sm:flex hover:bg-purple-700"
              >
                <Sparkles size={16} />
                Generate
              </button>
            </div>
          </div>
        </div>

        {/* --------------------------------
            Workspace Navigation
        --------------------------------- */}
        <div className="px-3 overflow-x-auto sm:px-6">
          <nav className="flex min-w-max">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabChange(tab.id)}
                  className={`relative flex items-center gap-2 px-4 py-3.5 text-sm font-medium transition whitespace-nowrap ${
                    active ? "text-white" : "text-zinc-500 hover:text-zinc-200"
                  }`}
                >
                  <Icon size={17} className={active ? "text-purple-400" : ""} />

                  {tab.label}

                  {tab.id === "storyboard" && scenes.length > 0 && (
                    <span
                      className={`min-w-5 px-1.5 py-0.5 text-[10px] text-center rounded-full ${
                        active
                          ? "bg-purple-500/15 text-purple-300"
                          : "bg-zinc-800 text-zinc-500"
                      }`}
                    >
                      {scenes.length}
                    </span>
                  )}

                  {active && (
                    <span className="absolute right-3 bottom-0 left-3 h-0.5 rounded-full bg-purple-500" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* --------------------------------
          Workspace Content
      --------------------------------- */}
      <main className="p-4 sm:p-6 lg:p-8">
        {/* --------------------------------
            Overview
        --------------------------------- */}
        {activeTab === "overview" && (
          <OverviewPanel
            project={project}
            scenes={scenes}
            characters={characters}
            assetCount={assetCount}
            generatedSceneCount={generatedSceneCount}
            onNavigate={handleTabChange}
            onAddScene={handleAddScene}
          />
        )}

        {/* --------------------------------
            Generate
        --------------------------------- */}
        {activeTab === "generate" && (
          <GeneratePanel
            key={generationScene?.id || "default"}
            scene={generationScene}
            onGenerationComplete={handleGeneratedResult}
          />
        )}

        {/* --------------------------------
            Characters
        --------------------------------- */}
        {activeTab === "characters" && <CharactersPanel />}

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
              loading={storyboardLoading}
            />

            {storyboardError && (
              <div className="flex items-start gap-3 p-4 border rounded-xl border-red-500/20 bg-red-500/5">
                <div className="flex items-center justify-center flex-shrink-0 w-8 h-8 rounded-lg bg-red-500/10">
                  <Clapperboard size={16} className="text-red-400" />
                </div>

                <div>
                  <p className="text-sm font-medium text-red-400">
                    Storyboard error
                  </p>

                  <p className="mt-1 text-xs leading-5 text-red-400/70">
                    {storyboardError}
                  </p>
                </div>
              </div>
            )}

            {storyboardLoading && (
              <div className="flex items-center justify-center py-16 border rounded-2xl border-zinc-800 bg-zinc-900/40">
                <div className="flex items-center gap-3 text-sm text-zinc-500">
                  <LoadingSpinner />
                  Loading storyboard...
                </div>
              </div>
            )}

            {!storyboardLoading && showSceneEditor && (
              <div className="max-w-3xl">
                <SceneEditor
                  key={editingScene?.id || "new"}
                  scene={editingScene}
                  onSave={handleSaveScene}
                  onClose={handleCloseEditor}
                />
              </div>
            )}

            {!storyboardLoading && (
              <SceneTimeline
                scenes={scenes}
                selectedScene={selectedScene}
                onSelect={handleSelectScene}
                onAdd={handleAddScene}
                onGenerate={handleGenerateScene}
              />
            )}

            {!storyboardLoading && scenes.length > 0 && (
              <div>
                <div className="flex items-end justify-between gap-4 mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-white">
                      Scene Generations
                    </h2>

                    <p className="mt-1 text-sm text-zinc-500">
                      Review and generate individual storyboard scenes.
                    </p>
                  </div>

                  <span className="hidden text-xs text-zinc-600 sm:block">
                    {generatedSceneCount} of {scenes.length} generated
                  </span>
                </div>

                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {scenes.map((scene, index) => (
                    <SceneCard
                      key={scene.id}
                      scene={scene}
                      index={index}
                      selected={selectedScene?.id === scene.id}
                      onSelect={handleSelectScene}
                      onEdit={handleEditScene}
                      onDelete={handleDeleteScene}
                      onGenerate={handleGenerateScene}
                    />
                  ))}
                </div>
              </div>
            )}

            {!storyboardLoading && scenes.length === 0 && !showSceneEditor && (
              <EmptyStoryboard onCreate={handleAddScene} />
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
            projectId={id}
            onGenerateVideo={handleGenerateVideo}
          />
        )}

        {/* --------------------------------
            Assets
        --------------------------------- */}
        {activeTab === "assets" && <AssetsPanel />}
      </main>
    </div>
  );
}

/*
 * --------------------------------
 * Overview Panel
 * --------------------------------
 */
function OverviewPanel({
  project,
  scenes,
  characters,
  assetCount,
  generatedSceneCount,
  onNavigate,
  onAddScene,
}) {
  const completion =
    scenes.length > 0
      ? Math.round((generatedSceneCount / scenes.length) * 100)
      : 0;

  return (
    <div className="mx-auto space-y-8 max-w-7xl">
      <section className="relative overflow-hidden border rounded-3xl border-zinc-800 bg-gradient-to-br from-purple-500/10 via-zinc-900 to-zinc-950">
        <div className="absolute w-64 h-64 rounded-full -top-32 -right-32 bg-purple-600/10 blur-3xl" />

        <div className="relative p-6 sm:p-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium border rounded-full border-purple-500/20 bg-purple-500/10 text-purple-300">
              <WandSparkles size={14} />
              AI Filmmaking Workspace
            </div>

            <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Bring your story to life.
            </h2>

            <p className="max-w-2xl mt-3 text-sm leading-6 text-zinc-400 sm:text-base">
              Build characters, develop scenes, generate visuals, and move your
              project toward a finished film — all from one workspace.
            </p>

            <div className="flex flex-wrap gap-3 mt-6">
              <button
                type="button"
                onClick={() => onNavigate("generate")}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white transition bg-purple-600 rounded-lg hover:bg-purple-700"
              >
                <Sparkles size={16} />
                Start Generating
              </button>

              <button
                type="button"
                onClick={onAddScene}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium transition border rounded-lg text-zinc-300 border-zinc-700 hover:bg-zinc-900 hover:text-white"
              >
                <Plus size={16} />
                Add Scene
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <WorkspaceStat
          icon={Clapperboard}
          label="Storyboard Scenes"
          value={scenes.length}
          description={
            scenes.length === 0
              ? "No scenes yet"
              : `${generatedSceneCount} generated`
          }
          onClick={() => onNavigate("storyboard")}
        />

        <WorkspaceStat
          icon={Users}
          label="Characters"
          value={characters.length}
          description={
            characters.length === 0
              ? "Add your first character"
              : "Available for generation"
          }
          onClick={() => onNavigate("characters")}
        />

        <WorkspaceStat
          icon={Image}
          label="Assets"
          value={assetCount}
          description="Project media library"
          onClick={() => onNavigate("assets")}
        />

        <WorkspaceStat
          icon={Play}
          label="Progress"
          value={`${completion}%`}
          description={
            scenes.length === 0
              ? "Create scenes to begin"
              : "Scene generation progress"
          }
          onClick={() => onNavigate("storyboard")}
        />
      </section>

      <section>
        <div className="mb-5">
          <h3 className="text-lg font-semibold text-white">
            Production Workflow
          </h3>

          <p className="mt-1 text-sm text-zinc-500">
            Move through the creative process from concept to final video.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <WorkflowCard
            step="01"
            icon={Users}
            title="Build Characters"
            description="Create and manage the characters that will appear in your story."
            onClick={() => onNavigate("characters")}
          />

          <WorkflowCard
            step="02"
            icon={Clapperboard}
            title="Build Storyboard"
            description="Turn your ideas into structured scenes ready for generation."
            onClick={() => onNavigate("storyboard")}
          />

          <WorkflowCard
            step="03"
            icon={Sparkles}
            title="Generate Visuals"
            description="Generate images using prompts, settings, references, and characters."
            onClick={() => onNavigate("generate")}
          />

          <WorkflowCard
            step="04"
            icon={Video}
            title="Create Video"
            description="Bring your generated scenes together into a cinematic sequence."
            onClick={() => onNavigate("video")}
          />
        </div>
      </section>

      <section className="p-6 border rounded-2xl border-zinc-800 bg-zinc-900/50">
        <div className="flex items-center justify-between gap-4 mb-5">
          <div>
            <h3 className="font-semibold text-white">Project Details</h3>

            <p className="mt-1 text-sm text-zinc-500">
              Current project information.
            </p>
          </div>

          {project?.status && <StatusBadge status={project.status} />}
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <DetailItem
            label="Project Name"
            value={project?.name || "Untitled Project"}
          />

          <DetailItem label="Status" value={project?.status || "Draft"} />

          <DetailItem label="Scenes" value={scenes.length} />
        </div>
      </section>
    </div>
  );
}

/*
 * --------------------------------
 * Workspace Stat
 * --------------------------------
 */
function WorkspaceStat({ icon: Icon, label, value, description, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="p-5 text-left transition border rounded-2xl border-zinc-800 bg-zinc-900/60 hover:border-purple-500/30 hover:bg-zinc-900"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-purple-500/10">
          <Icon size={19} className="text-purple-400" />
        </div>

        <span className="text-xs text-zinc-700">View</span>
      </div>

      <p className="mt-5 text-2xl font-bold text-white">{value}</p>

      <p className="mt-1 text-sm font-medium text-zinc-300">{label}</p>

      <p className="mt-1 text-xs text-zinc-600">{description}</p>
    </button>
  );
}

/*
 * --------------------------------
 * Workflow Card
 * --------------------------------
 */
function WorkflowCard({ step, icon: Icon, title, description, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="p-5 text-left transition border group rounded-2xl border-zinc-800 bg-zinc-900/40 hover:border-purple-500/30 hover:bg-zinc-900"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center justify-center w-10 h-10 transition rounded-xl bg-zinc-800 group-hover:bg-purple-500/10">
          <Icon
            size={18}
            className="transition text-zinc-400 group-hover:text-purple-400"
          />
        </div>

        <span className="text-xs font-medium tracking-wider text-zinc-700">
          {step}
        </span>
      </div>

      <h4 className="mt-5 font-semibold text-white">{title}</h4>

      <p className="mt-2 text-sm leading-6 text-zinc-500">{description}</p>

      <span className="inline-flex items-center gap-1 mt-4 text-xs font-medium text-purple-400">
        Open
        <span className="transition-transform group-hover:translate-x-1">
          →
        </span>
      </span>
    </button>
  );
}

/*
 * --------------------------------
 * Detail Item
 * --------------------------------
 */
function DetailItem({ label, value }) {
  return (
    <div>
      <p className="text-xs font-medium tracking-wide uppercase text-zinc-600">
        {label}
      </p>

      <p className="mt-2 text-sm font-medium text-zinc-300">{value}</p>
    </div>
  );
}

/*
 * --------------------------------
 * Status Badge
 * --------------------------------
 */
function StatusBadge({ status }) {
  const normalized = String(status || "").toLowerCase();

  let className = "border-zinc-800 bg-zinc-900 text-zinc-400";

  if (normalized === "active") {
    className = "border-emerald-500/20 bg-emerald-500/10 text-emerald-400";
  }

  if (normalized === "draft") {
    className = "border-amber-500/20 bg-amber-500/10 text-amber-400";
  }

  if (normalized === "archived") {
    className = "border-zinc-700 bg-zinc-800/70 text-zinc-500";
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium border rounded-full ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

/*
 * --------------------------------
 * Empty Storyboard
 * --------------------------------
 */
function EmptyStoryboard({ onCreate }) {
  return (
    <div className="flex flex-col items-center justify-center p-10 text-center border border-dashed rounded-2xl border-zinc-800 bg-zinc-900/40 sm:p-16">
      <div className="flex items-center justify-center w-16 h-16 mb-5 rounded-2xl bg-purple-500/10">
        <Clapperboard size={28} className="text-purple-400" />
      </div>

      <h2 className="text-xl font-semibold text-white">
        Build your first scene
      </h2>

      <p className="max-w-md mt-2 text-sm leading-6 text-zinc-500">
        Create a scene prompt and define the visual direction for your story.
      </p>

      <button
        type="button"
        onClick={onCreate}
        className="flex items-center gap-2 px-5 py-2.5 mt-6 text-sm font-medium text-white transition bg-purple-600 rounded-lg hover:bg-purple-700"
      >
        <Plus size={16} />
        Create First Scene
      </button>
    </div>
  );
}

/*
 * --------------------------------
 * Workspace Loading
 * --------------------------------
 */
function WorkspaceLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[600px] bg-zinc-950">
      <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-purple-500/10">
        <Sparkles size={24} className="text-purple-400 animate-pulse" />
      </div>

      <p className="mt-4 text-sm font-medium text-zinc-400">
        Loading workspace...
      </p>

      <p className="mt-1 text-xs text-zinc-600">
        Preparing your project studio
      </p>
    </div>
  );
}

/*
 * --------------------------------
 * Loading Spinner
 * --------------------------------
 */
function LoadingSpinner() {
  return (
    <span className="w-4 h-4 border-2 rounded-full border-zinc-700 border-t-purple-400 animate-spin" />
  );
}

/*
 * --------------------------------
 * Normalize Storyboard
 * --------------------------------
 *
 * The backend Storyboard record stores flexible
 * scene information in metadata. This function
 * converts that backend shape into the frontend
 * scene shape consistently.
 * --------------------------------
 */
function normalizeStoryboard(storyboard) {
  if (!storyboard?.id) {
    return null;
  }

  const metadata =
    storyboard.metadata && typeof storyboard.metadata === "object"
      ? storyboard.metadata
      : {};

  const metadataCharacter =
    metadata.character && typeof metadata.character === "object"
      ? metadata.character
      : null;

  const generatedUrl =
    storyboard.generatedUrl ||
    storyboard.generatedImageUrl ||
    storyboard.generatedVideoUrl ||
    metadata.generatedUrl ||
    metadata.generatedImageUrl ||
    metadata.generatedVideoUrl ||
    null;

  const generatedType =
    storyboard.generatedType ||
    metadata.generatedType ||
    (storyboard.generatedVideoUrl ? "video" : null) ||
    (storyboard.generatedImageUrl ? "image" : null) ||
    null;

  const title =
    storyboard.title ||
    storyboard.name ||
    metadata.title ||
    metadata.name ||
    "Untitled Scene";

  const prompt =
    storyboard.prompt ||
    metadata.prompt ||
    storyboard.description ||
    metadata.description ||
    "";

  const type = storyboard.type || metadata.type || generatedType || "image";

  const notes = storyboard.notes || metadata.notes || "";

  const character = storyboard.character || metadataCharacter || null;

  const imageUrl =
    storyboard.imageUrl ||
    storyboard.image ||
    metadata.imageUrl ||
    metadata.image ||
    null;

  return {
    ...storyboard,

    id: storyboard.id,

    projectId: storyboard.projectId || metadata.projectId || null,

    name: title,

    title,

    description: storyboard.description || metadata.description || prompt || "",

    prompt,

    type,

    notes,

    character,

    imageUrl,

    image: imageUrl,

    generatedUrl,

    generatedType,

    generatedId: storyboard.generatedId || metadata.generatedId || null,

    generatedAt: storyboard.generatedAt || metadata.generatedAt || null,

    metadata,
  };
}
