import sys
import json
import numpy as np
import pandas as pd
import tensorflow as tf
import joblib
import os

# Disable TensorFlow logging
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
tf.compat.v1.logging.set_verbosity(tf.compat.v1.logging.ERROR)

# Load model and preprocessor
model = tf.keras.models.load_model('./models/stunting_prediction_model.h5')
preprocessor = joblib.load('./models/stunting_preprocessor.joblib')

# WHO standards for Height-for-Age (Length-for-Age) at 24 months
WHO_HFA = {
    'M': {'median': 87.1, 'sd': 3.2},  # Boys 24 mo: median ~87.1 cm, SD ~3.2 cm
    'F': {'median': 85.7, 'sd': 3.2},  # Girls 24 mo: median 85.7 cm, SD ~3.2 cm
}

# Function to calculate WHO z-scores for Height-for-Age
def calculate_height_for_age_z(row):
    age = row['Age']
    height = row['Body Length']
    sex = row['Sex']

    # Only using standard for age <=24 mo. For >24, extend with appropriate values or tables.
    ref = WHO_HFA.get(sex)
    if ref is None:
        raise ValueError(f"Unknown sex: {sex}")

    median = ref['median']
    sd = ref['sd']
    z_score = (height - median) / sd
    return z_score

# Function to calculate WHO z-scores for Weight-for-Age
WHO_WFA = {
    'M': {'median': 11.5, 'sd': 1.5},  # Boys 24 mo: median ~11.5 kg, SD ~1.5 kg
    'F': {'median': 10.8, 'sd': 1.4},  # Girls 24 mo: median ~10.8 kg, SD ~1.4 kg
}

def calculate_weight_for_age_z(row):
    weight = row['Body Weight']
    sex = row['Sex']
    ref = WHO_WFA.get(sex)
    if ref is None:
        raise ValueError(f"Unknown sex: {sex}")

    median = ref['median']
    sd = ref['sd']
    z_score = (weight - median) / sd
    return z_score

# Function to calculate Weight-for-Height z-score (simplified)
WHO_WFH_slope = {'M': 0.10, 'F': 0.095}  # expected weight = slope * height
WHO_WFH_sd = {'M': 1.2, 'F': 1.1}

def calculate_weight_for_height_z(row):
    height = row['Body Length']
    weight = row['Body Weight']
    sex = row['Sex']
    expected = WHO_WFH_slope[sex] * height
    sd = WHO_WFH_sd[sex]
    z_score = (weight - expected) / sd
    return z_score

# Wrapper for prediction
def predict_stunting(data_json):
    # Parse JSON input
    try:
        data_dict = json.loads(data_json)
        # If double-encoded
        if isinstance(data_dict, str):
            data_dict = json.loads(data_dict)
    except json.JSONDecodeError:
        raise ValueError("Invalid JSON input")

    # Build DataFrame
    data = pd.DataFrame(data_dict)

    # Feature engineering
    data['BMI'] = data['Body Weight'] / ((data['Body Length'] / 100) ** 2)
    data['Height_for_Age_Z'] = data.apply(calculate_height_for_age_z, axis=1)
    data['Weight_for_Age_Z'] = data.apply(calculate_weight_for_age_z, axis=1)
    data['Weight_for_Height_Z'] = data.apply(calculate_weight_for_height_z, axis=1)

    # Preprocess and predict
    processed = preprocessor.transform(data)
    prob = float(model.predict(processed, verbose=0).ravel()[0])
    pred = 'Yes' if prob > 0.5 else 'No'

    # WHO classification
    hfa_z = data['Height_for_Age_Z'].iloc[0]
    if hfa_z < -3:
        who_class = 'Severely stunted (WHO)'
    elif hfa_z < -2:
        who_class = 'Stunted (WHO)'
    else:
        who_class = 'Not stunted (WHO)'

    return {
        'stunting_probability': prob,
        'stunting_prediction': pred,
        'who_classification': who_class,
        'height_for_age_z_score': hfa_z
    }

# Main execution
if __name__ == "__main__":
    input_json = sys.stdin.read().strip()
    result = predict_stunting(input_json)
    print(json.dumps(result))
