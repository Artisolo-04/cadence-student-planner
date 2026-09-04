export const WORKSPACE_GROUP_CHANGED_EVENT = "cadence:workspace-group-changed";
export const WORKSPACE_GROUP_SYNC_KEY = "cadence_workspace_group_sync";
export const WORKSPACE_LIST_CHANGED_EVENT = "cadence:workspace-list-changed";

export function publishWorkspaceGroupChange({ workspaceId, myGroup }) {
  if (workspaceId == null) return;

  const detail = {
    workspaceId: String(workspaceId),
    myGroup: myGroup ?? null,
    timestamp: Date.now(),
  };

  window.dispatchEvent(
    new CustomEvent(WORKSPACE_GROUP_CHANGED_EVENT, { detail })
  );

  try {
    localStorage.setItem(WORKSPACE_GROUP_SYNC_KEY, JSON.stringify(detail));
  } catch (error) {
    console.warn("Couldn't persist workspace group synchronization event:", error);
  }
}

export function publishWorkspaceListChanged() {
  window.dispatchEvent(new CustomEvent(WORKSPACE_LIST_CHANGED_EVENT));
}
