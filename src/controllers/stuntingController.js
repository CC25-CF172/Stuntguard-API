const supabase = require("../config/database");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");
const { PythonShell } = require("python-shell");
const path = require("path");

dayjs.extend(utc);
dayjs.extend(timezone);

const stuntingController = {
  createCheckStunting: async (request, h) => {
    try {
      const {
        gender,
        age_months,
        birth_weight_kg,
        birth_length_cm,
        current_weight_kg,
        current_length_cm,
        exclusive_breastfeeding,
      } = request.payload;

      const user_id = request.auth.credentials.id;

      if (
        !user_id ||
        !gender ||
        !age_months ||
        !birth_weight_kg ||
        !birth_length_cm ||
        !current_weight_kg ||
        !current_length_cm ||
        !exclusive_breastfeeding
      ) {
        return h
          .response({
            success: false,
            message: "Missing required fields.",
          })
          .code(400);
      }

      const modelInput = {
        Sex: [gender],
        Age: [age_months],
        "Birth Weight": [birth_weight_kg],
        "Birth Length": [birth_length_cm],
        "Body Weight": [current_weight_kg],
        "Body Length": [current_length_cm],
        "ASI Eksklusif": [exclusive_breastfeeding],
      };

      const options = {
        mode: "text",
        scriptPath: path.join(__dirname, "../utils"),
        pythonPath: "python",
        args: [],
      };

      const results = await new Promise((resolve, reject) => {
        const pyshell = new PythonShell("modelWrapper.py", options);

        pyshell.send(JSON.stringify(modelInput));

        let resultData = "";

        pyshell.on("message", (message) => {
          resultData = message;
        });

        pyshell.end((err) => {
          if (err) {
            console.error("Python Error:", err);
            reject(err);
          } else {
            try {
              const jsonMatch = resultData.match(/(\{.*\})/);
              if (jsonMatch && jsonMatch[1]) {
                const jsonStr = jsonMatch[1];
                const parsedResult = JSON.parse(jsonStr);
                resolve(parsedResult);
              } else {
                console.error("No valid JSON found in:", resultData);
                reject(
                  new Error("Tidak menemukan JSON yang valid dalam output"),
                );
              }
            } catch (parseError) {
              console.error("Error parsing Python output:", parseError);
              reject(new Error("Gagal memproses hasil prediksi"));
            }
          }
        });
      });

      if (!results || !results.stunting_probability) {
        return h
          .response({ success: false, message: "Model prediction failed" })
          .code(400);
      }

      const {
        stunting_probability,
        stunting_prediction,
        who_classification,
        height_for_age_z_score,
      } = results;

      let predict_risk_type;
      if (height_for_age_z_score < -3) {
        predict_risk_type = "Parah";
      } else if (height_for_age_z_score >= -3 && height_for_age_z_score < -2) {
        predict_risk_type = "Sedang";
      } else if (height_for_age_z_score >= -2 && height_for_age_z_score < -1) {
        predict_risk_type = "Ringan";
      } else {
        predict_risk_type = "Normal";
      }

      const { data: recommendationData, error: recommendationError } =
        await supabase
          .from("recommendations")
          .select("id, risk_type, notes")
          .eq("risk_type", predict_risk_type)
          .single();

      if (recommendationError || !recommendationData) {
        console.error(
          "Error fetching recommendation data:",
          recommendationError || "No matching recommendation found",
        );
        return h
          .response({
            success: false,
            message: "Failed to fetch recommendation data",
          })
          .code(400);
      }

      const recommendation_id = recommendationData.id;
      const risk_type = recommendationData.risk_type;
      const notes = recommendationData.notes;
      const timestamp = dayjs().tz("Asia/Jakarta").toISOString();

      const newItem = {
        user_id,
        recommendation_id,
        gender,
        age_months,
        birth_weight_kg,
        birth_length_cm,
        current_weight_kg,
        current_length_cm,
        exclusive_breastfeeding,
        stunting_probability,
        stunting_prediction,
        who_classification,
        height_for_age_z_score,
        created_at: timestamp,
        updated_at: timestamp,
      };

      const { data, error } = await supabase
        .from("stunting_checks")
        .insert([newItem])
        .select();

      if (error) {
        console.error("Error inserting data:", error);
        return h
          .response({ success: false, message: "Failed to add stunting data" })
          .code(400);
      }

      return h
        .response({
          success: true,
          data: {
            ...data[0],
            risk_type: risk_type,
            recommendation_notes: notes,
          },
          message: "Insert data successfully.",
        })
        .code(201);
    } catch (error) {
      console.error("Error adding data:", error);
      return h.response({ success: false, message: error.message }).code(500);
    }
  },

  getCheckStunting: async (request, h) => {
    try {
      const { id } = request.params;

      const { data, error } = await supabase
        .from("stunting_checks")
        .select(
          `
          *,
          recommendations!stunting_checks_recommendation_id_fkey(risk_type, notes)
        `,
        )
        .eq("id", id)
        .single();

      if (error || !data) {
        return h
          .response({
            success: false,
            message: "Stunting data not found.",
          })
          .code(404);
      }

      const { recommendations, ...stuntingData } = data;

      return h
        .response({
          success: true,
          data: {
            ...stuntingData,
            risk_type: recommendations.risk_type,
            recommendation_notes: recommendations.notes,
          },
          message: "Stunting data retrieved successfully.",
        })
        .code(200);
    } catch (error) {
      console.error("Error fetching data:", error);
      return h
        .response({
          success: false,
          message: "An error occurred while fetching the stunting data.",
        })
        .code(500);
    }
  },

  getAllCheckStunting: async (request, h) => {
    try {
      const { data, error } = await supabase.from("stunting_checks").select(`
          *,
          recommendations!stunting_checks_recommendation_id_fkey(risk_type, notes)
        `);

      if (error) {
        return h
          .response({
            success: false,
            message: "An error occurred while fetching the data.",
          })
          .code(500);
      }

      const dataWithRecommendations = data.map((item) => {
        const { recommendations, ...stuntingData } = item;
        return {
          ...stuntingData,
          risk_type: recommendations.risk_type,
          recommendation_notes: recommendations.notes,
        };
      });

      return h
        .response({
          success: true,
          data: dataWithRecommendations,
          message: "Stunting data retrieved successfully.",
        })
        .code(200);
    } catch (error) {
      console.error("Error fetching data:", error);
      return h
        .response({
          success: false,
          message: "An error occurred while fetching the stunting data.",
        })
        .code(500);
    }
  },

  updateCheckStunting: async (request, h) => {
    try {
      const { id } = request.params;
      const {
        gender,
        age_months,
        birth_weight_kg,
        birth_length_cm,
        current_weight_kg,
        current_length_cm,
        exclusive_breastfeeding,
      } = request.payload;

      if (
        !gender ||
        !age_months ||
        !birth_weight_kg ||
        !birth_length_cm ||
        !current_weight_kg ||
        !current_length_cm ||
        !exclusive_breastfeeding
      ) {
        return h
          .response({
            success: false,
            message: "Missing required fields.",
          })
          .code(400);
      }

      const modelInput = {
        Sex: [gender],
        Age: [age_months],
        "Birth Weight": [birth_weight_kg],
        "Birth Length": [birth_length_cm],
        "Body Weight": [current_weight_kg],
        "Body Length": [current_length_cm],
        "ASI Eksklusif": [exclusive_breastfeeding],
      };

      const options = {
        mode: "text",
        scriptPath: path.join(__dirname, "../utils"),
        pythonPath: "python",
        args: [],
      };

      const results = await new Promise((resolve, reject) => {
        const pyshell = new PythonShell("modelWrapper.py", options);

        pyshell.send(JSON.stringify(modelInput));

        let resultData = "";

        pyshell.on("message", (message) => {
          resultData = message;
        });

        pyshell.end((err) => {
          if (err) {
            console.error("Python Error:", err);
            reject(err);
          } else {
            try {
              const jsonMatch = resultData.match(/(\{.*\})/);
              if (jsonMatch && jsonMatch[1]) {
                const jsonStr = jsonMatch[1];
                const parsedResult = JSON.parse(jsonStr);
                resolve(parsedResult);
              } else {
                console.error("No valid JSON found in:", resultData);
                reject(new Error("Invalid JSON found in the output"));
              }
            } catch (parseError) {
              console.error("Error parsing Python output:", parseError);
              reject(new Error("Failed to process prediction results"));
            }
          }
        });
      });

      if (!results || !results.stunting_probability) {
        return h
          .response({ success: false, message: "Model prediction failed" })
          .code(400);
      }

      const {
        stunting_probability,
        stunting_prediction,
        who_classification,
        height_for_age_z_score,
      } = results;

      let predict_risk_type;
      if (height_for_age_z_score < -3) {
        predict_risk_type = "Parah";
      } else if (height_for_age_z_score >= -3 && height_for_age_z_score < -2) {
        predict_risk_type = "Sedang";
      } else if (height_for_age_z_score >= -2 && height_for_age_z_score < -1) {
        predict_risk_type = "Ringan";
      } else {
        predict_risk_type = "Normal";
      }

      const { data: recommendationData, error: recommendationError } =
        await supabase
          .from("recommendations")
          .select("id, risk_type, notes")
          .eq("risk_type", predict_risk_type)
          .single();

      if (recommendationError || !recommendationData) {
        console.error(
          "Error fetching recommendation data:",
          recommendationError,
        );
        return h
          .response({
            success: false,
            message: "Failed to fetch recommendation data",
          })
          .code(400);
      }

      const recommendation_id = recommendationData.id;
      const risk_type = recommendationData.risk_type;
      const notes = recommendationData.notes;
      const timestamp = dayjs().tz("Asia/Jakarta").toISOString();

      const { data, error } = await supabase
        .from("stunting_checks")
        .update({
          recommendation_id,
          gender,
          age_months,
          birth_weight_kg,
          birth_length_cm,
          current_weight_kg,
          current_length_cm,
          exclusive_breastfeeding,
          stunting_probability,
          stunting_prediction,
          who_classification,
          height_for_age_z_score,
          updated_at: timestamp,
        })
        .eq("id", id)
        .select();

      if (error) {
        console.error("Error updating data:", error);
        return h
          .response({
            success: false,
            message: "Failed to update stunting data",
          })
          .code(400);
      }

      return h
        .response({
          success: true,
          message: "Stunting data updated successfully.",
          data: {
            ...data[0],
            risk_type: risk_type,
            recommendation_notes: notes,
          },
        })
        .code(200);
    } catch (error) {
      console.error("Error updating data:", error);
      return h
        .response({
          success: false,
          message: error.message,
        })
        .code(500);
    }
  },

  deleteCheckStunting: async (request, h) => {
    try {
      const { id } = request.params;

      const { data, error } = await supabase
        .from("stunting_checks")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !data) {
        return h
          .response({
            success: false,
            message: "Stunting data not found.",
          })
          .code(404);
      }

      const { error: deleteError } = await supabase
        .from("stunting_checks")
        .delete()
        .eq("id", id);

      if (deleteError) {
        console.error("Error deleting data:", deleteError);
        return h
          .response({
            success: false,
            message: "Failed to delete stunting data",
          })
          .code(400);
      }

      return h
        .response({
          success: true,
          message: "Stunting data deleted successfully.",
        })
        .code(200);
    } catch (error) {
      console.error("Error deleting data:", error);
      return h
        .response({
          success: false,
          message: error.message,
        })
        .code(500);
    }
  },

  getStuntingHistory: async (request, h) => {
    try {
      const { user_id } = request.params;

      const { data, error } = await supabase
        .from("stunting_checks")
        .select(
          `
          *,
          recommendations!stunting_checks_recommendation_id_fkey(risk_type, notes)
        `,
        )
        .eq("user_id", user_id);

      if (error) {
        console.error("Error fetching stunting history:", error);
        return h
          .response({
            success: false,
            message: "An error occurred while fetching stunting history.",
          })
          .code(500);
      }

      if (data.length === 0) {
        return h
          .response({
            success: false,
            message: "No stunting history found for this user.",
          })
          .code(404);
      }

      const dataWithRecommendations = data.map((item) => {
        const { recommendations, ...stuntingData } = item;
        return {
          ...stuntingData,
          risk_type: recommendations.risk_type,
          recommendation_notes: recommendations.notes,
        };
      });

      return h
        .response({
          success: true,
          data: dataWithRecommendations,
          message: "Stunting history retrieved successfully.",
        })
        .code(200);
    } catch (error) {
      console.error("Error fetching stunting history:", error);
      return h
        .response({
          success: false,
          message: error.message,
        })
        .code(500);
    }
  },
};

module.exports = stuntingController;
