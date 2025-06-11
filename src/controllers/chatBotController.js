const { PythonShell } = require("python-shell");
const path = require("path");

const chatBotController = {
  replyMessageBot: async (request, h) => {
    try {
      const { message } = request.payload;

      if (!message) {
        return h
          .response({
            success: false,
            message: "No message provided.",
          })
          .code(400);
      }

      const options = {
        mode: "text",
        scriptPath: path.join(__dirname, "../utils"),
        pythonPath: "python",
        args: [],
      };

      const results = await new Promise((resolve, reject) => {
        const pyshell = new PythonShell("chatBotWrapper.py", options);

        // Kirim input sebagai JSON
        pyshell.send(JSON.stringify({ message }));

        let resultData = "";

        // Kumpulkan output dari Python
        pyshell.on("message", (message) => {
          resultData += message;
        });

        // Tangani akhir eksekusi
        pyshell.end((err) => {
          if (err) {
            console.error("Python Error:", err);
            reject(err);
          } else {
            try {
              // Cari JSON valid dalam output
              const jsonMatch = resultData.match(/(\{.*\})/);
              if (jsonMatch && jsonMatch[1]) {
                const jsonStr = jsonMatch[1];
                const parsedResult = JSON.parse(jsonStr);
                resolve(parsedResult);
              } else {
                console.error("No valid JSON found in:", resultData);
                reject(new Error("No valid JSON found in output"));
              }
            } catch (parseError) {
              console.error("Error parsing Python output:", parseError);
              reject(new Error("Failed to process chatbot response"));
            }
          }
        });
      });

      // Periksa hasil dari Python
      if (!results.success || !results.reply) {
        return h
          .response({
            success: false,
            message: results.message || "Chatbot processing failed",
          })
          .code(400);
      }

      return h
        .response({
          success: true,
          data: {
            reply: results.reply,
          },
          message: "Successfully processed message.",
        })
        .code(201);
    } catch (error) {
      console.error("Error:", error);
      return h.response({ success: false, message: error.message }).code(500);
    }
  },
};

module.exports = chatBotController;
