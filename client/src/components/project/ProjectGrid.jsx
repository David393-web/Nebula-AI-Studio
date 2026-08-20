import ProjectCard from "./ProjectCard";

export default function ProjectGrid({ projects }) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">

      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
        />
      ))}

    </div>
  );
}