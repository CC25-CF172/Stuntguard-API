const Joi = require("joi");
const authController = require("../controllers/authController");
const stuntingController = require("../controllers/stuntingController");
const forumController = require("../controllers/forumController");
const chatBotController = require("../controllers/chatBotController");
const verifyToken = require("../Middleware/middleware");
const path = require("path");

const apiRoutes = [
  {
    method: "GET",
    path: "/",
    handler: async (request, h) => {
      try {
        return h.file(path.join(__dirname, "../views", "index.html"));
      } catch (error) {
        console.error("Error serving index.html:", error);
        return h
          .response({ success: false, message: "Failed to retrieve homepage." })
          .code(500);
      }
    },
  },
  {
    method: "GET",
    path: "/api/v1",
    handler: async (request, h) => {
      try {
        const apiInfo = {
          name: "Stuntguard API",
          version: "1.0.0",
          description:
            "Welcome to the Stuntguard API! This API provides endpoints for user authentication, stunting check management, and forum interactions. It supports user registration, login (via email or Google), password management, profile updates, stunting data tracking, and forum messaging with replies.",
        };
        return h.response(apiInfo).code(200);
      } catch {
        return h
          .response({ error: "Failed to retrieve API information." })
          .code(500);
      }
    },
  },
  {
    method: "POST",
    path: "/api/v1/register",
    options: {
      payload: {
        multipart: true,
      },
      validate: {
        payload: Joi.object({
          name: Joi.string().required().label("name"),
          email: Joi.string().email().required().label("email"),
          password: Joi.string().min(6).required().label("password"),
        }),
        failAction: async (request, h, err) => {
          throw err;
        },
      },
    },
    handler: authController.register,
  },
  {
    method: "POST",
    path: "/api/v1/login",
    options: {
      payload: {
        multipart: true,
      },
      validate: {
        payload: Joi.object({
          provider: Joi.string().required().label("provider"),
          user: Joi.object({
            email: Joi.string().email().required().label("email"),
            password: Joi.string().min(6).required().label("password"),
          }).required(),
        }),
        failAction: async (request, h, err) => {
          throw err;
        },
      },
    },
    handler: authController.loginEmail,
  },
  {
    method: "POST",
    path: "/api/v1/auth/callback/google",
    options: {
      payload: {
        multipart: true,
      },
      state: {
        parse: false,
        failAction: "ignore",
      },
      validate: {
        payload: Joi.object({
          provider: Joi.string().required().label("provider"),
          user: Joi.object({
            email: Joi.string().email().required(),
          }).required(),
        }),
        failAction: async (request, h, err) => {
          throw err;
        },
      },
    },
    handler: authController.loginGoogle,
  },
  {
    method: "POST",
    path: "/api/v1/forgot-password",
    options: {
      payload: {
        multipart: true,
      },
      validate: {
        payload: Joi.object({
          email: Joi.string().email().required().label("email"),
        }),
        failAction: async (request, h, err) => {
          throw err;
        },
      },
    },
    handler: authController.forgotPassword,
  },

  {
    method: "POST",
    path: "/api/v1/reset-password",
    options: {
      payload: {
        multipart: true,
      },
      validate: {
        payload: Joi.object({
          token: Joi.string().required().label("token"),
          new_password: Joi.string().min(6).required().label("new_password"),
        }),
        failAction: async (request, h, err) => {
          throw err;
        },
      },
    },
    handler: authController.resetPassword,
  },
  {
    method: "GET",
    path: "/api/v1/profile",
    options: {
      pre: [verifyToken],
    },
    handler: authController.getProfile,
  },
  {
    method: "PUT",
    path: "/api/v1/edit-profile",
    options: {
      pre: [verifyToken],
      validate: {
        payload: Joi.object({
          name: Joi.string().optional().label("name"),
          email: Joi.string().email().optional().label("email"),
          new_password: Joi.string().min(6).optional().label("new_password"),
        }),
        failAction: async (request, h, err) => {
          throw err;
        },
      },
    },
    handler: authController.editProfile,
  },

  {
    method: "GET",
    path: "/api/v1/stunting",
    options: {
      pre: [verifyToken],
    },
    handler: stuntingController.getAllCheckStunting,
  },
  {
    method: "GET",
    path: "/api/v1/stunting/{id}",
    options: {
      pre: [verifyToken],
      validate: {
        params: Joi.object({
          id: Joi.number().required(),
        }),
      },
    },
    handler: stuntingController.getCheckStunting,
  },
  {
    method: "GET",
    path: "/api/v1/stunting/history/{user_id}",
    options: {
      pre: [verifyToken],
      validate: {
        params: Joi.object({
          user_id: Joi.number().required(),
        }),
      },
    },
    handler: stuntingController.getStuntingHistory,
  },
  {
    method: "POST",
    path: "/api/v1/stunting",
    options: {
      payload: {
        multipart: true,
      },
      pre: [verifyToken],
      validate: {
        payload: Joi.object({
          gender: Joi.string().allow("").label("gender"),
          age_months: Joi.number().min(0).max(60).integer().label("age_months"),
          birth_weight_kg: Joi.number().positive().label("birth_weight_kg"),
          birth_length_cm: Joi.number().positive().label("birth_length_cm"),
          current_weight_kg: Joi.number().positive().label("current_weight_kg"),
          current_length_cm: Joi.number().positive().label("current_length_cm"),
          exclusive_breastfeeding: Joi.string()
            .allow("")
            .label("exclusive_breastfeeding"),
        }),
        failAction: async (request, h, err) => {
          throw err;
        },
      },
    },
    handler: stuntingController.createCheckStunting,
  },
  {
    method: "PUT",
    path: "/api/v1/stunting/{id}",
    options: {
      payload: {
        multipart: true,
      },
      pre: [verifyToken],
      validate: {
        payload: Joi.object({
          gender: Joi.string().allow("").label("gender"),
          age_months: Joi.number().min(0).max(60).integer().label("age_months"),
          birth_weight_kg: Joi.number().positive().label("birth_weight_kg"),
          birth_length_cm: Joi.number().positive().label("birth_length_cm"),
          current_weight_kg: Joi.number().positive().label("current_weight_kg"),
          current_length_cm: Joi.number().positive().label("current_length_cm"),
          exclusive_breastfeeding: Joi.string()
            .allow("")
            .label("exclusive_breastfeeding"),
        }),
        failAction: async (request, h, err) => {
          throw err;
        },
      },
    },
    handler: stuntingController.updateCheckStunting,
  },
  {
    method: "DELETE",
    path: "/api/v1/stunting/{id}",
    options: {
      pre: [verifyToken],
      validate: {
        params: Joi.object({
          id: Joi.number().required(),
        }),
      },
    },
    handler: stuntingController.deleteCheckStunting,
  },

  {
    method: "GET",
    path: "/api/v1/forum",
    options: {
      pre: [verifyToken],
    },
    handler: forumController.getAllMessageForum,
  },
  {
    method: "GET",
    path: "/api/v1/forum/{id}",
    options: {
      pre: [verifyToken],
      validate: {
        params: Joi.object({
          id: Joi.number().required(),
        }),
      },
    },
    handler: forumController.getMessageForum,
  },
  {
    method: "POST",
    path: "/api/v1/forum",
    options: {
      payload: {
        multipart: true,
      },
      pre: [verifyToken],
      validate: {
        payload: Joi.object({
          title: Joi.string().allow("").label("title"),
          content: Joi.string().allow("").label("content"),
        }),
        failAction: async (request, h, err) => {
          throw err;
        },
      },
    },
    handler: forumController.createMessageForum,
  },

  {
    method: "PUT",
    path: "/api/v1/forum/{id}",
    options: {
      payload: {
        multipart: true,
      },
      pre: [verifyToken],
      validate: {
        params: Joi.object({
          id: Joi.number().required(),
        }),
        payload: Joi.object({
          title: Joi.string().allow("").label("title"),
          content: Joi.string().allow("").label("content"),
        }),
        failAction: async (request, h, err) => {
          throw err;
        },
      },
    },
    handler: forumController.updateMessageForum,
  },

  {
    method: "DELETE",
    path: "/api/v1/forum/{id}",
    options: {
      pre: [verifyToken],
      validate: {
        params: Joi.object({
          id: Joi.number().required(),
        }),
      },
    },
    handler: forumController.deleteMessageForum,
  },

  {
    method: "GET",
    path: "/api/v1/forum-replies",
    options: {
      pre: [verifyToken],
    },
    handler: forumController.getAllMessageForumReplies,
  },

  {
    method: "GET",
    path: "/api/v1/forum-replies/{id}",
    options: {
      pre: [verifyToken],
      validate: {
        params: Joi.object({
          id: Joi.number().required(),
        }),
      },
    },
    handler: forumController.getMessageForumReply,
  },

  {
    method: "POST",
    path: "/api/v1/forum-replies",
    options: {
      pre: [verifyToken],
      validate: {
        payload: Joi.object({
          forum_id: Joi.number().required(),
          content: Joi.string().required(),
        }),
        failAction: async (request, h, err) => {
          throw err;
        },
      },
    },
    handler: forumController.createMessageForumReply,
  },

  {
    method: "PUT",
    path: "/api/v1/forum-replies/{id}",
    options: {
      pre: [verifyToken],
      validate: {
        params: Joi.object({
          id: Joi.number().required(),
        }),
        payload: Joi.object({
          content: Joi.string().required(),
        }),
        failAction: async (request, h, err) => {
          throw err;
        },
      },
    },
    handler: forumController.updateMessageForumReply,
  },

  {
    method: "DELETE",
    path: "/api/v1/forum-replies/{id}",
    options: {
      pre: [verifyToken],
      validate: {
        params: Joi.object({
          id: Joi.number().required(),
        }),
      },
    },
    handler: forumController.deleteMessageForumReply,
  },

  {
    method: "POST",
    path: "/api/v1/chatbot",
    options: {
      pre: [verifyToken],
      validate: {
        payload: Joi.object({
          message: Joi.string().required(),
        }),
        failAction: async (request, h, err) => {
          throw err;
        },
      },
    },
    handler: chatBotController.replyMessageBot,
  },
];

module.exports = apiRoutes;
