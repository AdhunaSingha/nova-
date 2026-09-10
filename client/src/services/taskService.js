import api from "./api";

const taskService = {
  /*
   * Get all tasks
   *
   * Optional filters:
   * {
   *   project,
   *   status,
   *   priority,
   *   assignee,
   *   sprint,
   *   search,
   *   archived,
   *   sort
   * }
   */
  getTasks: async (params = {}) => {
    const response = await api.get("/tasks", {
      params,
    });

    return response.data;
  },

  /*
   * Get one task
   */
  getTask: async (id) => {
    const response = await api.get(`/tasks/${id}`);

    return response.data;
  },

  /*
   * Create task
   */
  createTask: async (taskData) => {
    const response = await api.post("/tasks", taskData);

    return response.data;
  },

  /*
   * Update task
   */
  updateTask: async (id, taskData) => {
    const response = await api.put(
      `/tasks/${id}`,
      taskData
    );

    return response.data;
  },

  /*
   * Move task between Kanban columns
   */
  updateTaskStatus: async (id, status) => {
    const response = await api.patch(
      `/tasks/${id}/status`,
      {
        status,
      }
    );

    return response.data;
  },

  /*
   * Add comment
   */
  addComment: async (id, message) => {
    const response = await api.post(
      `/tasks/${id}/comments`,
      {
        message,
      }
    );

    return response.data;
  },

  /*
   * Add subtask
   */
  addSubtask: async (id, title) => {
    const response = await api.post(
      `/tasks/${id}/subtasks`,
      {
        title,
      }
    );

    return response.data;
  },

  /*
   * Update subtask
   */
  updateSubtask: async (
    taskId,
    subtaskId,
    data
  ) => {
    const response = await api.patch(
      `/tasks/${taskId}/subtasks/${subtaskId}`,
      data
    );

    return response.data;
  },

  /*
   * Update logged time
   */
  updateTimeLogged: async (id, minutes) => {
    const response = await api.patch(
      `/tasks/${id}/time`,
      {
        minutes,
      }
    );

    return response.data;
  },

  /*
   * Archive task
   */
  deleteTask: async (id) => {
    const response = await api.delete(
      `/tasks/${id}`
    );

    return response.data;
  },
};

export default taskService;