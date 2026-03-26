export function isAdmin(user) {
  return user?.role === 'admin';
}

export function isHelper(user) {
  return user?.role === 'helper';
}

export function isRequester(user) {
  return user?.role === 'requester';
}

export function hasAssistantAccess(user, assistantUserIds = []) {
  if (!user?.id) {
    return false;
  }

  return assistantUserIds.includes(Number(user.id));
}

export function canViewHelpRequest(user, helpRequest, assistantUserIds = []) {
  if (!user || !helpRequest) {
    return false;
  }

  return isAdmin(user)
    || (isHelper(user) && Number(helpRequest.helper_user_id) === Number(user.id))
    || (isRequester(user) && Number(helpRequest.requester_user_id) === Number(user.id))
    || hasAssistantAccess(user, assistantUserIds);
}

export function canUpdateHelpRequest(user, helpRequest) {
  if (!user || !helpRequest) {
    return false;
  }

  return isAdmin(user)
    || (isHelper(user) && Number(helpRequest.helper_user_id) === Number(user.id));
}

export function canAddAssistant(user, helpRequest) {
  return canUpdateHelpRequest(user, helpRequest);
}

export function canReassignHelper(user) {
  return isAdmin(user);
}

export function canAddCollaborationLog(user, helpRequest, assistantUserIds = []) {
  if (!user || !helpRequest) {
    return false;
  }

  return isAdmin(user) || hasAssistantAccess(user, assistantUserIds);
}

export function canViewDashboard(user) {
  return isAdmin(user) || isHelper(user) || isRequester(user);
}

export function canViewProject(user, project, memberUserIds = []) {
  if (!user || !project) {
    return false;
  }

  return isAdmin(user)
    || Number(project.owner_user_id) === Number(user.id)
    || memberUserIds.includes(Number(user.id));
}

export function canUpdateProject(user) {
  return isAdmin(user);
}

export function canAddProjectMember(user, project) {
  if (!user || !project) {
    return false;
  }

  return isAdmin(user) || Number(project.owner_user_id) === Number(user.id);
}

export function buildHelpRequestListScope(user, tableAlias = 'hr') {
  if (isAdmin(user)) {
    return {
      clause: 'WHERE 1 = 1',
      params: []
    };
  }

  if (isHelper(user)) {
    return {
      clause: `WHERE ${tableAlias}.helper_user_id = ?`,
      params: [user.id]
    };
  }

  if (isRequester(user)) {
    return {
      clause: `WHERE ${tableAlias}.requester_user_id = ?`,
      params: [user.id]
    };
  }

  return {
    clause: 'WHERE 1 = 0',
    params: []
  };
}

export function buildNotificationScope(user, tableAlias = 'n') {
  if (isAdmin(user)) {
    return {
      clause: 'WHERE 1 = 1',
      params: []
    };
  }

  return {
    clause: `WHERE ${tableAlias}.receiver_user_id = ?`,
    params: [user.id]
  };
}

export function buildProjectListScope(user, tableAlias = 'p') {
  if (isAdmin(user)) {
    return {
      clause: 'WHERE 1 = 1',
      params: []
    };
  }

  return {
    clause: `WHERE (
      ${tableAlias}.owner_user_id = ?
      OR EXISTS (
        SELECT 1
        FROM project_members pm
        WHERE pm.project_id = ${tableAlias}.id
          AND pm.user_id = ?
      )
    )`,
    params: [user.id, user.id]
  };
}
