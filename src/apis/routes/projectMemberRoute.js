const express = require('express');
const router = express.Router();
const ProjectMemberController = require('../controllers/projectMemberController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

const projectMemberController = new ProjectMemberController();

router.post('/', authMiddleware, roleMiddleware(['Admin', 'Manager']), projectMemberController.addProjectMember);
router.delete('/', authMiddleware, roleMiddleware(['Admin', 'Manager']), projectMemberController.removeProjectMember);
router.get(
  "/:project_id",
  authMiddleware,
  roleMiddleware(["Admin", "Manager", "Employee"]),
  projectMemberController.getProjectMembers
);
router.get("/", authMiddleware, projectMemberController.getAllMembers);
router.get(
  "/user/:user_id",
  authMiddleware,
  roleMiddleware(["Admin", "Manager", "Employee", "Account"]),
  projectMemberController.getProjectsByMember
);

module.exports = router;