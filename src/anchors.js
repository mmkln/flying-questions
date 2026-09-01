function normalizeAnchor(value) {
  if (
    !value
    || typeof value !== 'object'
    || Array.isArray(value)
    || !Number.isFinite(value.createdAt)
  ) {
    return null;
  }

  return { createdAt: value.createdAt };
}

function latestLegacyAnchor(meta) {
  const anchors = meta?.navigation?.anchors;
  if (!anchors || typeof anchors !== 'object' || Array.isArray(anchors)) {
    return null;
  }

  return Object.values(anchors)
    .map(normalizeAnchor)
    .filter(Boolean)
    .sort((first, second) => second.createdAt - first.createdAt)[0] ?? null;
}

function navigationVersion(navigation) {
  return Math.max(2, Number.isInteger(navigation?.version) ? navigation.version : 0);
}

/**
 * Reads the canonical global anchor and keeps legacy per-space anchors visible
 * until the next explicit write migrates the thought to the current schema.
 */
export function getAnchor(thought) {
  return normalizeAnchor(thought?.meta?.navigation?.anchor)
    ?? latestLegacyAnchor(thought?.meta);
}

export function hasAnchor(thought) {
  return getAnchor(thought) !== null;
}

export function withAnchor(meta, createdAt = Date.now()) {
  const navigation = { ...(meta?.navigation || {}) };
  delete navigation.anchors;

  return {
    ...(meta || {}),
    navigation: {
      ...navigation,
      version: navigationVersion(navigation),
      anchor: {
        createdAt: Number.isFinite(createdAt) ? createdAt : Date.now(),
      },
    },
  };
}

export function withoutAnchor(meta) {
  const nextMeta = { ...(meta || {}) };
  const navigation = { ...(meta?.navigation || {}) };
  delete navigation.anchor;
  delete navigation.anchors;

  const remainingKeys = Object.keys(navigation).filter((key) => key !== 'version');
  if (!remainingKeys.length) {
    delete nextMeta.navigation;
    return nextMeta;
  }

  nextMeta.navigation = {
    ...navigation,
    version: navigationVersion(navigation),
  };
  return nextMeta;
}
