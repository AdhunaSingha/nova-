const express = require("express");

const {
  getTeam,
  createMember,
  updateMember,
} = require("../controllers/teamController");

const {
  protect,
} = require("../middleware/authMiddleware");

const router =
  express.Router();


/*
|--------------------------------------------------------------------------
| GET TEAM
|--------------------------------------------------------------------------
*/

router.get(
  "/",
  protect,
  getTeam
);


/*
|--------------------------------------------------------------------------
| CREATE TEAM MEMBER
|--------------------------------------------------------------------------
*/

router.post(
  "/members",
  protect,
  createMember
);


/*
|--------------------------------------------------------------------------
| UPDATE TEAM MEMBER
|--------------------------------------------------------------------------
*/

router.put(
  "/members/:id",
  protect,
  updateMember
);


module.exports = router;