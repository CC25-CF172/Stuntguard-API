const supabase = require("../config/database");
const jwt = require("jsonwebtoken");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

dayjs.extend(utc);
dayjs.extend(timezone);

const authController = {
  register: async (request, h) => {
    try {
      const { name, email, password } = request.payload;

      if (!name || !email || !password) {
        return h
          .response({
            success: false,
            message: "Name, email, and password are required.",
          })
          .code(400);
      }

      let { data: existingUsers, error: fetchError } = await supabase
        .from("users")
        .select("*")
        .eq("email", email)
        .limit(1);

      if (fetchError) throw fetchError;

      if (existingUsers.length > 0) {
        return h
          .response({
            success: false,
            message: "Email already registered.",
          })
          .code(400);
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const timestamp = dayjs().tz("Asia/Jakarta").toISOString();
      const { data: insertedUser, error: insertError } = await supabase
        .from("users")
        .insert([
          {
            name,
            email,
            password: hashedPassword,
            created_at: timestamp,
            updated_at: timestamp,
          },
        ])
        .select()
        .single();

      if (insertError) throw insertError;

      const { error: accountInsertError } = await supabase
        .from("accounts")
        .insert([
          {
            user_id: insertedUser.id,
            provider: "email",
            access_token: "",
            expires_at: dayjs().add(1, "day").toISOString(),
            created_at: timestamp,
          },
        ])
        .select()
        .single();

      if (accountInsertError) throw accountInsertError;

      if (!process.env.JWT_SECRET) {
        throw new Error(
          "JWT_SECRET is not defined in the environment variables.",
        );
      }

      const token = jwt.sign(
        { id: insertedUser.id, email: insertedUser.email },
        process.env.JWT_SECRET,
        { expiresIn: "1d" },
      );

      return h
        .response({
          success: true,
          data: { token },
          message: "User registered successfully.",
        })
        .code(201);
    } catch (error) {
      console.error("Registration error:", error);
      return h.response({ success: false, message: error.message }).code(500);
    }
  },

  loginEmail: async (request, h) => {
    try {
      const { provider, user } = request.payload;

      if (provider !== "email") {
        return h
          .response({
            success: false,
            message: "Invalid provider, must be 'email'.",
          })
          .code(400);
      }

      const { email, password } = user;

      if (!email || !password) {
        return h
          .response({
            success: false,
            message: "Email and password are required.",
          })
          .code(400);
      }

      let { data: existingUsers, error: fetchError } = await supabase
        .from("users")
        .select("*")
        .eq("email", email)
        .limit(1);

      if (fetchError) throw fetchError;

      let userRecord = existingUsers.length > 0 ? existingUsers[0] : null;

      if (!userRecord) {
        return h
          .response({
            success: false,
            message: "User not found.",
          })
          .code(404);
      }

      const isPasswordCorrect = await bcrypt.compare(
        password,
        userRecord.password,
      );

      if (!isPasswordCorrect) {
        return h
          .response({
            success: false,
            message: "Invalid password.",
          })
          .code(400);
      }

      if (!process.env.JWT_SECRET) {
        throw new Error(
          "JWT_SECRET is not defined in the environment variables.",
        );
      }

      const token = jwt.sign(
        { id: userRecord.id, email: userRecord.email },
        process.env.JWT_SECRET,
        { expiresIn: "1d" },
      );

      const { error: updateAccountError } = await supabase
        .from("accounts")
        .update({
          access_token: token,
          expires_at: dayjs().add(1, "day").toISOString(),
        })
        .eq("user_id", userRecord.id);

      if (updateAccountError) {
        console.error("Error updating access token:", updateAccountError);
        return h
          .response({
            success: false,
            message: "Failed to update access token.",
          })
          .code(500);
      }

      return h
        .response({
          success: true,
          data: { token },
          message: "User login successful.",
        })
        .code(200);
    } catch (error) {
      console.error("Login error:", error);
      return h.response({ success: false, message: error.message }).code(500);
    }
  },

  loginGoogle: async (request, h) => {
    try {
      const {
        provider,
        user: { email },
      } = request.payload;

      if (provider !== "google") {
        return h
          .response({
            success: false,
            message: "Invalid provider, must be 'google'.",
          })
          .code(400);
      }

      let { data: existingUsers, error: fetchError } = await supabase
        .from("users")
        .select("*")
        .eq("email", email)
        .limit(1);

      if (fetchError) throw fetchError;

      let user = existingUsers.length > 0 ? existingUsers[0] : null;

      if (!user) {
        const timestamp = dayjs().tz("Asia/Jakarta").toISOString();

        const name = email ? email.split("@")[0] : "";
        const randomPassword = crypto.randomBytes(16).toString("hex");
        const hashedPassword = await bcrypt.hash(randomPassword, 10);

        const { data: insertedUsers, error: insertError } = await supabase
          .from("users")
          .insert([
            {
              email,
              name: name || "",
              password: hashedPassword,
              created_at: timestamp,
              updated_at: timestamp,
            },
          ])
          .select()
          .single();

        if (insertError) throw insertError;

        user = insertedUsers;
      }

      if (!process.env.JWT_SECRET) {
        throw new Error(
          "JWT_SECRET is not defined in the environment variables.",
        );
      }

      const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: "1d" },
      );

      const expiresAt = dayjs().add(1, "day").format("YYYY-MM-DD HH:mm:ss");
      const now = dayjs().toISOString();
      const { error: upsertError } = await supabase.from("accounts").upsert(
        {
          user_id: user.id,
          provider: "google",
          access_token: token,
          expires_at: expiresAt,
          created_at: now,
        },
        { onConflict: "user_id" },
      );

      if (upsertError) throw upsertError;

      return h
        .response({
          success: true,
          data: { token },
          message: "User login successful.",
        })
        .code(200);
    } catch (error) {
      console.error("Login error:", error);
      return h.response({ success: false, message: error.message }).code(500);
    }
  },

  forgotPassword: async (request, h) => {
    try {
      const { email } = request.payload;

      const { data: users, error } = await supabase
        .from("users")
        .select("*")
        .eq("email", email)
        .limit(1);

      if (error) throw error;

      if (!users || users.length === 0) {
        return h
          .response({ success: false, message: "Email not registered." })
          .code(404);
      }

      const user = users[0];

      if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET environment variable is not defined.");
      }

      const resetToken = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: "1h" },
      );

      const expiresAt = dayjs().add(1, "hour").toISOString();
      const { error: updateError } = await supabase
        .from("users")
        .update({
          reset_password_token: resetToken,
          reset_password_expires: expiresAt,
        })
        .eq("id", user.id);

      if (updateError) throw updateError;

      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

      const mailOptions = {
        from: '"Stuntguard" <no-reply@stuntguard.com>',
        to: user.email,
        subject: "Reset Password Request",
        text: `Klik link ini untuk reset password Anda: ${resetUrl}.\nToken berlaku selama 1 jam.`,
        html: `<p>Klik link ini untuk reset password Anda:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>Token berlaku selama 1 jam.</p>`,
      };

      await transporter.sendMail(mailOptions);

      return h
        .response({
          success: true,
          message: "Password reset link sent to your email.",
        })
        .code(200);
    } catch (error) {
      console.error("Forgot password error:", error);
      return h.response({ success: false, message: error.message }).code(500);
    }
  },

  resetPassword: async (request, h) => {
    try {
      const { token, new_password } = request.payload;

      if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET environment variable is not defined.");
      }

      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log(decoded);
      } catch {
        return h
          .response({ success: false, message: "Invalid or expired token." })
          .code(400);
      }

      const { data: users, error } = await supabase
        .from("users")
        .select("*")
        .eq("reset_password_token", token)
        .limit(1);

      if (error) throw error;

      if (!users || users.length === 0) {
        return h
          .response({ success: false, message: "Invalid or expired token." })
          .code(400);
      }

      const user = users[0];

      if (dayjs().isAfter(dayjs(user.reset_password_expires))) {
        return h
          .response({ success: false, message: "Token has expired." })
          .code(400);
      }

      const hashedPassword = await bcrypt.hash(new_password, 10);

      const { error: updateError } = await supabase
        .from("users")
        .update({
          password: hashedPassword,
          reset_password_token: null,
          reset_password_expires: null,
          updated_at: dayjs().toISOString(),
        })
        .eq("id", user.id);

      if (updateError) throw updateError;

      return h
        .response({
          success: true,
          message: "Password has been reset successfully.",
        })
        .code(200);
    } catch (error) {
      console.error("Reset password error:", error);
      return h.response({ success: false, message: error.message }).code(500);
    }
  },

  editProfile: async (request, h) => {
    try {
      const { name, email, new_password } = request.payload;
      const user_id = request.auth.credentials.id;

      const { data: user, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("id", user_id)
        .single();

      if (userError) {
        console.error("Error fetching user data:", userError);
        return h
          .response({
            success: false,
            message: "Failed to fetch user data.",
          })
          .code(500);
      }

      if (!user) {
        return h
          .response({
            success: false,
            message: "User not found.",
          })
          .code(404);
      }

      if (email && email !== user.email) {
        let { data: existingUsers, error: fetchError } = await supabase
          .from("users")
          .select("*")
          .eq("email", email)
          .limit(1);

        if (fetchError) {
          console.error("Error checking email:", fetchError);
          return h
            .response({
              success: false,
              message: "Error checking email availability.",
            })
            .code(500);
        }

        if (existingUsers.length > 0) {
          return h
            .response({
              success: false,
              message: "Email already in use by another account.",
            })
            .code(400);
        }
      }

      const updateData = {};
      if (name) updateData.name = name;
      if (email) updateData.email = email;
      if (new_password) {
        const hashedPassword = await bcrypt.hash(new_password, 10);
        updateData.password = hashedPassword;
      }

      if (Object.keys(updateData).length === 0) {
        return h
          .response({
            success: false,
            message: "No data provided to update.",
          })
          .code(400);
      }

      const timestamp = dayjs().toISOString();
      updateData.updated_at = timestamp;

      const { data, error: updateError } = await supabase
        .from("users")
        .update(updateData)
        .eq("id", user_id)
        .select();

      if (updateError) {
        console.error("Error updating user data:", updateError);
        return h
          .response({
            success: false,
            message: "Failed to update profile.",
          })
          .code(400);
      }

      return h
        .response({
          success: true,
          message: "Profile updated successfully.",
          data: data[0],
        })
        .code(200);
    } catch (error) {
      console.error("Error updating profile:", error);
      return h
        .response({
          success: false,
          message: "An error occurred while updating the profile.",
        })
        .code(500);
    }
  },
};

module.exports = authController;
