export function filterModels(models, { query = "", provider = "all", feature = "all" } = {}) {
  const normalized = query.trim().toLowerCase();
  return models.filter((model) => {
    const durations = model.duration?.values?.join(" ") || (model.duration ? `${model.duration.min} ${model.duration.max}` : "");
    const text = `${model.displayName || ""} ${model.provider || ""} ${(model.capabilities || []).join(" ")} ${(model.resolutions || []).join(" ")} ${durations}`.toLowerCase();
    return (!normalized || text.includes(normalized))
      && (provider === "all" || model.providerId === provider)
      && (feature === "all" || model.capabilities?.includes(feature));
  });
}

export function groupModels(models) {
  return models.reduce((groups, model) => {
    (groups[model.provider] ||= []).push(model);
    return groups;
  }, {});
}

export function toggleProviderGroup(expanded, provider) {
  return { ...expanded, [provider]: !expanded[provider] };
}

export function getCapabilityBadges(model) {
  return [
    ...(model.capabilities || []),
    ...(model.resolutions || []),
    ...(model.duration ? [model.duration.values ? `${model.duration.values.join(" / ")}s` : `${model.duration.min}–${model.duration.max}s`] : []),
  ];
}
