const supabase = require("../config/database");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");

dayjs.extend(utc);
dayjs.extend(timezone);

const forumController = {
  createMessageForum: async (request, h) => {
    try {
      const { title, content } = request.payload;
      const user_id = request.auth.credentials.id;

      if (!user_id || !title || !content) {
        return h
          .response({
            success: false,
            message: "Missing required fields.",
          })
          .code(400);
      }

      const timestamp = dayjs().tz("Asia/Jakarta").toISOString();

      const newItem = {
        user_id,
        title,
        content,
        status: true,
        created_at: timestamp,
        updated_at: timestamp,
      };

      const { data, error } = await supabase
        .from("forum")
        .insert([newItem])
        .select();

      if (error) {
        console.error("Error inserting data:", error);
        return h
          .response({ success: false, message: "Failed to add forum data" })
          .code(400);
      }

      return h
        .response({
          success: true,
          data: {
            ...data[0],
          },
          message: "Insert data successfully.",
        })
        .code(201);
    } catch (error) {
      console.error("Error adding data:", error);
      return h.response({ success: false, message: error.message }).code(500);
    }
  },

  getMessageForum: async (request, h) => {
    try {
      const { id } = request.params;

      const { data, error } = await supabase
        .from("forum")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !data) {
        return h
          .response({
            success: false,
            message: "Forum data not found.",
          })
          .code(404);
      }

      return h
        .response({
          success: true,
          data: { ...data },
          message: "Forum data retrieved successfully.",
        })
        .code(200);
    } catch (error) {
      console.error("Error fetching data:", error);
      return h
        .response({
          success: false,
          message: "An error occurred while fetching the forum data.",
        })
        .code(500);
    }
  },

  getAllMessageForum: async (request, h) => {
    try {
      const { data, error } = await supabase.from("forum").select("*");

      if (error) {
        return h
          .response({
            success: false,
            message: "An error occurred while fetching the data.",
          })
          .code(500);
      }

      return h
        .response({
          success: true,
          data: data,
          message: "Forum data retrieved successfully.",
        })
        .code(200);
    } catch (error) {
      console.error("Error fetching data:", error);
      return h
        .response({
          success: false,
          message: "An error occurred while fetching the forum data.",
        })
        .code(500);
    }
  },

  updateMessageForum: async (request, h) => {
    try {
      const { id } = request.params;
      const { title, content } = request.payload;

      if (!title && !content) {
        return h
          .response({
            success: false,
            message: "At least one of 'title' or 'content' must be provided.",
          })
          .code(400);
      }

      const updateData = {};
      if (title) updateData.title = title;
      if (content) updateData.content = content;

      updateData.updated_at = dayjs().tz("Asia/Jakarta").toISOString();

      const { data, error } = await supabase
        .from("forum")
        .update(updateData)
        .eq("id", id)
        .select();

      if (error) {
        console.error("Error updating data:", error);
        return h
          .response({
            success: false,
            message: "Failed to update forum data",
          })
          .code(400);
      }

      if (!data || data.length === 0) {
        return h
          .response({
            success: false,
            message: "Forum data not found",
          })
          .code(404);
      }

      return h
        .response({
          success: true,
          message: "Forum data updated successfully.",
          data: data[0],
        })
        .code(200);
    } catch (error) {
      console.error("Error updating data:", error);
      return h
        .response({
          success: false,
          message: "An error occurred while updating the forum data.",
        })
        .code(500);
    }
  },

  deleteMessageForum: async (request, h) => {
    try {
      const { id } = request.params;

      const { error } = await supabase.from("forum").delete().eq("id", id);

      if (error) {
        console.error("Error deleting data:", error);
        return h
          .response({
            success: false,
            message: "Failed to delete forum data",
          })
          .code(400);
      }

      return h
        .response({
          success: true,
          message: "Forum data deleted successfully.",
        })
        .code(200);
    } catch (error) {
      console.error("Error deleting data:", error);
      return h
        .response({
          success: false,
          message: "An error occurred while deleting the forum data.",
        })
        .code(500);
    }
  },

  createMessageForumReply: async (request, h) => {
    try {
      const { forum_id, content } = request.payload;
      const user_id = request.auth.credentials.id;
      const timestamp = dayjs().tz("Asia/Jakarta").toISOString();

      const newReply = {
        forum_id,
        user_id,
        content,
        created_at: timestamp,
        updated_at: timestamp,
      };

      const { data, error } = await supabase
        .from("forum_replies")
        .insert([newReply])
        .select();
      if (error) {
        console.error("Error inserting forum reply:", error);
        return h
          .response({ success: false, message: "Failed to add forum reply" })
          .code(400);
      }

      return h
        .response({
          success: true,
          data: data[0],
          message: "Forum reply added successfully",
        })
        .code(201);
    } catch (error) {
      console.error("Error adding forum reply:", error);
      return h.response({ success: false, message: error.message }).code(500);
    }
  },

  getAllMessageForumReplies: async (request, h) => {
    try {
      const { data, error } = await supabase.from("forum_replies").select("*");
      if (error) {
        return h
          .response({
            success: false,
            message: "Failed to fetch forum replies",
          })
          .code(500);
      }
      return h
        .response({
          success: true,
          data,
          message: "Forum replies retrieved successfully",
        })
        .code(200);
    } catch (error) {
      console.error("Error fetching forum replies:", error);
      return h
        .response({
          success: false,
          message: "Error occurred while fetching forum replies",
        })
        .code(500);
    }
  },

  getMessageForumReply: async (request, h) => {
    try {
      const { id } = request.params;
      const { data, error } = await supabase
        .from("forum_replies")
        .select("*")
        .eq("id", id)
        .single();
      if (error || !data) {
        return h
          .response({ success: false, message: "Forum reply not found" })
          .code(404);
      }
      return h
        .response({
          success: true,
          data,
          message: "Forum reply retrieved successfully",
        })
        .code(200);
    } catch (error) {
      console.error("Error fetching forum reply:", error);
      return h
        .response({
          success: false,
          message: "Error occurred while fetching forum reply",
        })
        .code(500);
    }
  },

  updateMessageForumReply: async (request, h) => {
    try {
      const { id } = request.params;
      const { content } = request.payload;
      const timestamp = dayjs().tz("Asia/Jakarta").toISOString();

      const { data, error } = await supabase
        .from("forum_replies")
        .update({ content, updated_at: timestamp })
        .eq("id", id)
        .select();

      if (error) {
        console.error("Error updating forum reply:", error);
        return h
          .response({ success: false, message: "Failed to update forum reply" })
          .code(400);
      }

      if (!data || data.length === 0) {
        return h
          .response({ success: false, message: "Forum reply not found" })
          .code(404);
      }

      return h
        .response({
          success: true,
          message: "Forum reply updated successfully",
          data: data[0],
        })
        .code(200);
    } catch (error) {
      console.error("Error updating forum reply:", error);
      return h
        .response({
          success: false,
          message: "An error occurred while updating the forum reply",
        })
        .code(500);
    }
  },

  deleteMessageForumReply: async (request, h) => {
    try {
      const { id } = request.params;
      const { error } = await supabase
        .from("forum_replies")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Error deleting forum reply:", error);
        return h
          .response({ success: false, message: "Failed to delete forum reply" })
          .code(400);
      }

      return h
        .response({
          success: true,
          message: "Forum reply deleted successfully",
        })
        .code(200);
    } catch (error) {
      console.error("Error deleting forum reply:", error);
      return h
        .response({
          success: false,
          message: "An error occurred while deleting the forum reply",
        })
        .code(500);
    }
  },
};

module.exports = forumController;
