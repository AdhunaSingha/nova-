import api from "./api";

const teamService = {
  /*
  |--------------------------------------------------------------------------
  | Get Team
  |--------------------------------------------------------------------------
  */

  getTeam: async () => {
    const response =
      await api.get("/team");

    return response.data;
  },


  /*
  |--------------------------------------------------------------------------
  | Create Team Member
  |--------------------------------------------------------------------------
  */

  createMember: async (
    memberData
  ) => {
    const response =
      await api.post(
        "/team/members",
        memberData
      );

    return response.data;
  },


  /*
  |--------------------------------------------------------------------------
  | Update Team Member
  |--------------------------------------------------------------------------
  */

  updateMember: async (
    memberId,
    memberData
  ) => {
    const response =
      await api.put(
        `/team/members/${memberId}`,
        memberData
      );

    return response.data;
  },
};


export default teamService;