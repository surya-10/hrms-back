require("dotenv/config");


const messageConfig = {
  new_users: {
    message: "A new user has been created.",
    success: "A new user has been created.",
    required:
      "All required fields (first name, last name, email, password, role) must be provided.",
    duplicate: "A user with this email already exists.",
    type: "User Creation",
    event: "Manage Users",
    failure: "An error occurred while creating a new user.",
    error: "An error occurred while creating the user.",
  },
  getUsers: {
    success: "Users have been fetched successfully.",
    failure: "No users were found.",
    error: "An error occurred while retrieving users.",
  },
  getUserDetail: {
    failure: "No user was found with the provided ID.",
    error: "An error occurred while retrieving the user with ID=",
  },
  update_users: {
    userNotFound: "No user was found with the provided ID.",
    success: "The user has been updated successfully.",
    event: "Manage Users",
    error: "An error occurred while updating the user with ID=",
  },
  delete_users: {
    message: "The user has been deleted.",
    success: "The user was deleted successfully.",
    failure:
      "Cannot delete the user with the provided ID; the user may not have been found.",
    type: "User Deletion",
    event: "Manage Users",
    error: "An error occurred while deleting the user.",
  },
  login: {
    message: "The user has logged in.",
    required: "Content cannot be empty.",
    failure: "Attempted to log in with a non-existent email.",
    failure2: "Invalid username or password.",
    failure3: "An error occurred while managing the user session.",
    userNotFound: "No user was found.",
    userDeactivated: "The user account is deactivated.",
    type: "Login",
    event: "Login",
    error: "An error occurred while accessing the login.",
  },
  logout: {
    required: "User ID is required.",
    failure: "No user session was found.",
    failure2: "No user session was found or it was not deleted.",
    message: "The user has logged out.",
    type: "Logout",
    event: "Logout",
    error: "An error occurred while logging out the user.",
  },
  createLog: {
    failure: "Content cannot be empty.",
    error: "An error occurred while creating the log.",
  },
  getLog: {
    success: "All activity logs have been fetched.",
    error: "An error occurred while fetching activity logs.",
  },
  createIndustry: {
    success: "The industry has been created successfully.",
    duplicate: "A duplicate industry name already exists.",
    failure: "Content cannot be empty.",
    error: "An error occurred while creating the industry.",
  },
  getAllIndustry: {
    success: "The industry has been fetched successfully.",
    error: "An error occurred while fetching the industry.",
  },
  getAllIndustryDetail: {
    success: "The industry has been fetched successfully.",
    failure: "No industry was found.",
    error: "An error occurred while fetching the industry.",
  },
  updateIndustry: {
    success: "The industry has been updated successfully.",
    failure: "The industry was not found or has been deleted.",
    error: "An error occurred while updating the industry.",
  },
  deleteIndustry: {
    success: "The industry has been deleted successfully.",
    failure: "The industry was not found.",
    error: "An error occurred while deleting the industry.",
  },
  createTechnology: {
    success: "The technology has been created successfully.",
    duplicate: "A duplicate technology name already exists.",
    failure: "Content cannot be empty.",
    error: "An error occurred while creating the technology.",
  },
  getAllTechnology: {
    success: "Technologies have been fetched successfully.",
    error: "An error occurred while fetching technologies.",
  },
  getAllTechnologyDetail: {
    success: "The technology has been fetched successfully.",
    failure: "No technology was found.",
    error: "An error occurred while fetching the technology.",
  },
  updateTechnology: {
    success: "The technology has been updated successfully.",
    failure: "The technology was not found or has been deleted.",
    error: "An error occurred while updating the technology.",
  },
  deleteTechnology: {
    success: "The technology has been deleted successfully.",
    failure: "The technology was not found.",
    error: "An error occurred while deleting the technology.",
  },
  createProject: {
    userIdRequired: "User ID is required.",
    industryIdRequired: "Industry ID is required.",
    technologyIdRequired: "Technology ID is required.",
    projectTitleRequired: "Project title is required.",
    basicIdeaRequired: "A basic idea is required.",
    invalidUser: "Invalid user for creating the project.",
    userNotExists: "Invalid User ID - User does not exist.",
    industryNotExists: "Invalid Industry ID - Industry does not exist.",
    technologyNotExists: "Invalid Technology ID - Technology does not exist.",
    projectNotExists: "A project with this name already exists.",
    success: "The project has been created successfully.",
    error: "An error occurred while creating the project.",
    updateSuccess: "The project has been updated successfully.",
  },
  getAllProject: {
    success: "All projects have been fetched successfully.",
    error: "An error occurred while fetching the projects.",
  },
  getProject: {
    success: "The project has been fetched successfully.",
    failure: "The project was not found.",
    error: "An error occurred while fetching the project.",
  },
  updateProject: {
    success: "The project has been updated successfully.",
    failure: "The project was not found.",
    error: "An error occurred while updating the project.",
  },
  deleteProject: {
    success: "The project has been deleted successfully.",
    failure: "The project was not found.",
    error: "An error occurred while deleting the project.",
  },
  generateVision: {
    failure: "Project ID is required.",
    projectRequired: "No project was found for the provided project ID.",
    purposeRequired: "Purpose not found for the provided project ID.",
    questionRequired: "Question is not available.",
  },
  enhanceVision: {
    success: "The vision statement has been updated successfully.",
    failure: "Project ID is required.",
    userFeedbackRequired: "User feedback is required.",
    projectRequired: "No project was found for the provided project ID.",
    purposeRequired: "Purpose not found for the provided project ID.",
    visionStatementRequired:
      "No vision statement was found for the provided project ID.",
  },
  generateMission: {
    projectRequired: "Project ID is required.",
    projectError: "No project was found for the provided project ID.",
    purposeError: "Purpose not found for the provided project ID.",
  },
  enhanceMission: {
    failure: "Project ID is required.",
    userFeedbackRequired: "User feedback is required.",
    projectRequired: "No project was found for the provided project ID.",
    visionStatementRequired:
      "No vision statement was found for the provided project ID.",
  },
  getVisionQuestions: {
    failure: "No vision questions were found.",
    error: "An error occurred while fetching vision questions.",
    success: "All vision questions have been fetched.",
  },
  getMissionQuestions: {
    success: "All mission questions have been fetched.",
    failure: "No mission questions were found.",
    error: "An error occurred while fetching mission questions.",
  },
  createVisionQuestion: {
    required: "Missing or invalid required fields.",
    invalidUserId: "Invalid User ID format.",
    invalidProjectId: "Invalid Project ID format.",
    noUserFound: "No user was found.",
    noProjectFound: "No project was found.",
    success: "Vision questions have been saved successfully.",
    error: "An error occurred while saving vision questions.",
  },
  createMissionQuestion: {
    required: "Missing required fields or incorrect format.",
    invalidPurposeId: "Invalid Purpose ID format.",
    purposeNotFound: "Purpose not found or has been deleted.",
    success: "Mission questions have been created successfully.",
    error: "An error occurred while updating mission questions.",
  },
  createSimilar: {
    projectIdRequired: "Missing Project ID.",
    productsRequired: "Missing required fields or incorrect format.",
    projectNotExists: "The project does not exist.",
    duplicateProject: "A duplicate project already exists.",
    updateSuccess: "Similar apps have been added for the project.",
  },
  getAllSimilars: {
    error: "An error occurred while fetching similar projects.",
  },
  getSimilar: {
    failure: "No similar data was found.",
    error: "An error occurred while fetching data.",
  },
  updateSimilar: {
    failure: "Invalid ID format.",
    success: "Updated successfully.",
    error: "An error occurred while updating.",
  },
  deleteSimilar: {
    failure: "Invalid ID format.",
    success: "Deleted successfully.",
    error: "An error occurred while deleting.",
  },
};

module.exports = messageConfig;
