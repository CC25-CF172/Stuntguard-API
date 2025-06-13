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
        .select(
          `
        id,
        user_id,
        title,
        content,
        status,
        created_at,
        updated_at,
        users (name)
      `,
        )
        .eq("id", id)
        .single();

      if (error) {
        console.error("Supabase error:", error);
        return h
          .response({
            success: false,
            message: error.message || "Forum data not found.",
          })
          .code(404);
      }

      if (!data) {
        return h
          .response({
            success: false,
            message: "Forum data not found.",
          })
          .code(404);
      }

      const transformedData = {
        id: data.id,
        user_id: data.user_id,
        user_name: data.users?.name || "Unknown User",
        title: data.title,
        content: data.content,
        status: data.status,
        created_at: data.created_at,
        updated_at: data.updated_at,
      };

      return h
        .response({
          success: true,
          data: transformedData,
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
      const { data, error } = await supabase.from("forum").select(`
        id,
        user_id,
        title,
        content,
        status,
        created_at,
        updated_at,
        users (name)
      `);

      if (error) {
        console.error("Supabase error:", error);
        return h
          .response({
            success: false,
            message:
              error.message || "An error occurred while fetching the data.",
          })
          .code(500);
      }

      if (!data || data.length === 0) {
        return h
          .response({
            success: false,
            message: "No forum data found.",
          })
          .code(404);
      }

      const transformedData = data.map((item) => ({
        id: item.id,
        user_id: item.user_id,
        user_name: item.users?.name || "Unknown User",
        title: item.title,
        content: item.content,
        status: item.status,
        created_at: item.created_at,
        updated_at: item.updated_at,
      }));

      return h
        .response({
          success: true,
          data: transformedData,
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
      const { data, error } = await supabase.from("forum_replies").select(`
        id,
        forum_id,
        user_id,
        content,
        created_at,
        updated_at,
        users (name)
      `);

      if (error) {
        console.error("Supabase error:", error);
        return h
          .response({
            success: false,
            message: error.message || "Failed to fetch forum replies",
          })
          .code(500);
      }

      if (!data || data.length === 0) {
        return h
          .response({
            success: false,
            message: "No forum replies found.",
          })
          .code(404);
      }

      // Transformasi data untuk menyertakan user_name
      const transformedData = data.map((item) => ({
        id: item.id,
        forum_id: item.forum_id,
        user_id: item.user_id,
        user_name: item.users?.name || "Unknown User",
        content: item.content,
        created_at: item.created_at,
        updated_at: item.updated_at,
      }));

      return h
        .response({
          success: true,
          data: transformedData,
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
        .select(
          `
        id,
        forum_id,
        user_id,
        content,
        created_at,
        updated_at,
        users (name)
      `,
        )
        .eq("id", id);

      if (error) {
        console.error("Supabase error:", error);
        return h
          .response({
            success: false,
            message: error.message || "Forum reply not found",
          })
          .code(404);
      }

      if (!data || data.length === 0) {
        return h
          .response({
            success: false,
            message: "Forum reply not found.",
          })
          .code(404);
      }

      // Ambil baris pertama karena id seharusnya unik
      const item = data[0];

      // Transformasi data untuk menyertakan user_name
      const transformedData = {
        id: item.id,
        forum_id: item.forum_id,
        user_id: item.user_id,
        user_name: item.users?.name || "Unknown User",
        content: item.content,
        created_at: item.created_at,
        updated_at: item.updated_at,
      };

      return h
        .response({
          success: true,
          data: transformedData,
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
