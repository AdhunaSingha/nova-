import api from "./api";

/*
|--------------------------------------------------------------------------
| Project Service
|--------------------------------------------------------------------------
*/

const projectService = {
  /*
  |--------------------------------------------------------------------------
  | Get Projects
  |--------------------------------------------------------------------------
  */

  getProjects: async (params = {}) => {
    const response = await api.get("/projects", {
      params,
    });

    return response.data;
  },

  /*
  |--------------------------------------------------------------------------
  | Get Single Project
  |--------------------------------------------------------------------------
  */

  getProject: async (id) => {
    const response = await api.get(
      `/projects/${id}`
    );

    return response.data;
  },

  /*
  |--------------------------------------------------------------------------
  | Create Project
  |--------------------------------------------------------------------------
  */

  createProject: async (projectData) => {
    const response = await api.post(
      "/projects",
      projectData
    );

    return response.data;
  },

  /*
  |--------------------------------------------------------------------------
  | Update Project
  |--------------------------------------------------------------------------
  */

  updateProject: async (id, projectData) => {
    const response = await api.put(
      `/projects/${id}`,
      projectData
    );

    return response.data;
  },

  /*
  |--------------------------------------------------------------------------
  | Archive Project
  |--------------------------------------------------------------------------
  */

  deleteProject: async (id) => {
    const response = await api.delete(
      `/projects/${id}`
    );

    return response.data;
  },
};

export default projectService;