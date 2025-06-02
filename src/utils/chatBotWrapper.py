import sys
import json
import nltk
from nltk.stem import WordNetLemmatizer
import pickle
import numpy as np
import tensorflow as tf
import random

# Nonaktifkan logging TensorFlow
import os
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
tf.compat.v1.logging.set_verbosity(tf.compat.v1.logging.ERROR)

# Inisialisasi lemmatizer
lemmatizer = WordNetLemmatizer()

# Muat model dan data
model = tf.keras.models.load_model('./models/chatbot/chatbot_model.h5')
words = pickle.load(open('./models/chatbot/words.pkl', 'rb'))
classes = pickle.load(open('./models/chatbot/classes.pkl', 'rb'))
intents = json.load(open('./models/chatbot/stunting_intents.json', 'r'))

def clean_up_sentence(sentence):
    sentence_words = nltk.word_tokenize(sentence)
    sentence_words = [lemmatizer.lemmatize(word.lower()) for word in sentence_words]
    return sentence_words

def bow(sentence, words, show_details=False):
    sentence_words = clean_up_sentence(sentence)
    bag = [0] * len(words)
    for s in sentence_words:
        for i, w in enumerate(words):
            if w == s:
                bag[i] = 1
                if show_details:
                    print(f'Found in bag: {w}')
    return np.array(bag)

def predict_class(sentence, model):
    p = bow(sentence, words, show_details=False)
    res = model.predict(np.array([p]), verbose=0)[0]
    ERROR_THRESHOLD = 0.25
    results = [[i, r] for i, r in enumerate(res) if r > ERROR_THRESHOLD]
    results.sort(key=lambda x: x[1], reverse=True)
    return_list = []
    for r in results:
        return_list.append({"intent": classes[r[0]], "probability": str(r[1])})
    return return_list

def get_response(ints, intents_json):
    if not ints:
        return "I'm sorry, I didn't understand that."
    tag = ints[0]['intent']
    list_of_intents = intents_json['intents']
    for i in list_of_intents:
        if tag == i['tag']:
            result = random.choice(i['responses'])
            break
    else:
        result = "I'm sorry, I didn't understand that."
    return result

def chatbot_response(msg):
    ints = predict_class(msg, model)
    res = get_response(ints, intents)
    return res

# Fungsi utama untuk memproses input
def process_message(data_json):
    try:
        data_dict = json.loads(data_json)
        if isinstance(data_dict, str):
            data_dict = json.loads(data_dict)
        message = data_dict.get('message')
        if not message:
            raise ValueError("No message provided")
        reply = chatbot_response(message)
        return {"success": True, "reply": reply}
    except Exception as e:
        return {"success": False, "message": str(e)}

# Main execution
if __name__ == "__main__":
    input_json = sys.stdin.read().strip()
    result = process_message(input_json)
    print(json.dumps(result))