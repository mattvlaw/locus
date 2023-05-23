from flask import Flask, jsonify, request, send_from_directory
from flask_login import login_user, logout_user, LoginManager
from flask_socketio import SocketIO, emit

import logging
logging.basicConfig(level=logging.DEBUG)

from flask_cors import CORS
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from api.models import Base, Content
from api.openaichat import openai_single_prompt_chat, build_doc_explanation_msg, openai_chat
from dotenv import load_dotenv
import os

from api.database import get_content_list, store_latest_version, get_latest_version, store_content_list, get_chats, create_highlight, get_highlights, sync_content, get_chat_by_id, create_chat, update_chat, store_user, get_user, update_content
from api.zotero_sync import sync_zotero_down, download_zotero_attachment
from api.converters import quill2Dict


login_manager = LoginManager()

@login_manager.user_loader
def load_user(user_id):
    return get_user({'id':user_id})

DATABASE_URL = 'sqlite:///locus.db'

load_dotenv()

ZOTERO_API_KEY = os.getenv("ZOTERO_API_KEY")
ZOTERO_USER_ID = os.getenv("ZOTERO_USER_ID")
ZOTERO_COLLECTION_NAME = os.getenv("ZOTERO_COLLECTION", "locus") 
CONTENT_FILE_PATH = os.getenv("CONTENT_FILE_PATH")
OPEN_AI_API_KEY = os.getenv("OPEN_AI_API_KEY")

app = Flask(__name__)
app.secret_key = os.environ.get('FLASK_APP_SECRET_KEY')
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")
engine = create_engine(DATABASE_URL)
Base.metadata.create_all(engine)
Session = sessionmaker(bind=engine)
login_manager.init_app(app)


@socketio.on('user_message')
def on_user_message(message):
    print("Received message:", message)
    
    chat_id = message.get('id')
    msg_text = message['content']
    highlight = message.get('highlight')
    doc = message.get('doc')
    
    if chat_id:
        # Chat exists, load the history from the db and send with the new message
        chat_info = get_chat_by_id(chat_id, return_dict=True)
        chat_highlights = chat_info['content_metadata']['chat']['highlights']
        chat_messages = chat_info['content_metadata']['chat']['messages']
    else:
        # Create a new chat
        chat_highlights = []
        chat_messages = []
        chat_info = create_chat({'title': 'Chat Session'}, chat_messages, chat_highlights, return_dict=True)
        chat_id = chat_info['id']
    
    if highlight and len(highlight)>0:
        # Build message with highlight
        expl_text = build_doc_explanation_msg(doc, highlight)
        msg_text += expl_text
    
    # Add the new message to the chat history
    chat_messages.append({
        'role': 'user',
        'content': msg_text
    })
    
    # Send the message to the OpenAI API and get LLM response
    reply = ""
    for chunk in openai_chat(chat_messages, "user"):
        content = chunk["content"]
        is_final = chunk["is_final"]
        llm_response = {"type": "llm", "content": content, "is_final": is_final, "id": chat_id}
        print(f'LLM Response: {llm_response}')
        emit('llm_response', llm_response)
        # Add LLM response to the chat history
        if content:
            reply += content

    chat_messages.append({
        'role': 'assistant',
        'content': reply
    })
    
    # Update the chat entry in the database with new messages
    update_chat(chat_id, chat_messages, chat_highlights)

# @socketio.on('user_message')
# def on_user_message(message):
#     print("Received message:", message)
    
#     if 'id' in message:
#         # chat exists, load the history from the db and send with the new message
#         chat_id = message['id']
#         # get the chat history
#         chat_info = get_content_list({'id':chat_id}, asdict=True)[0]
#         # add the new message to the history
#         # chat_history['content_metadata']['message_stack'].append(message['content'])
#         llm = chat_info["content_metadata"]["llm"]
        

    
#     else:
#         # create a new chat

#         # store the chat in the db
#         # send the chat to the llm
#         pass
#     msg_text = message['content']
#     if 'highlight' in message:
#         highlight = message['highlight']
#         doc = message['doc']
#         expl_text = build_doc_explanation_msg(doc, highlight)
#         msg_text += expl_text
#     for chunk in openai_single_prompt_chat(msg_text, "user"):
#         content = chunk["content"]
#         is_final = chunk["is_final"]
#         llm_response = {"type": "llm", "content": content, "is_final": is_final, id: chat_id}
#         print(f'LLM Response: {llm_response}')
#         emit('llm_response', llm_response)

@app.route('/')
def hello_world():
    return jsonify(message='Hello, Locus!')

@app.route('/sync', methods=['POST'])
def sync_zotero():
   return jsonify({"version":sync_zotero_down(ZOTERO_API_KEY, ZOTERO_USER_ID, ZOTERO_COLLECTION_NAME)})

# @app.route('/chat', methods=['POST'])
# def chat():
#     data = request.get_json()
#     if 'id' in data:
#         # chat exists, load the history from the db and send with the new message
#         chat_id = data['id']
#         # get the chat history
#         chat_history = get_content_list({'id':chat_id}, asdict=True)[0]
#         # add the new message to the history
#         chat_history['content_metadata']['message_stack'][-1].append(data['message'])
#         llm = chat_history["content_metadata"]["llm"]
#         # send the chat to the llm
#         if llm == "gpt-3.5-turbo":
#             # send the chat to the llm
#             pass
    
#     else:
#         # create a new chat
#         # store the chat in the db
#         # send the chat to the llm
#         pass

@app.route('/chats', methods=['GET'])
def get_chats_endpoint():
    # Get all chats from the database
    chats = get_chats(asdict=True)

    # Return a JSON response with the highlights
    return jsonify(chats)

@app.route('/create_highlight', methods=['POST'])
def create_highlight_endpoint():
    # Extract highlight data from the request JSON
    data = request.get_json()
    content = data.get('content')
    highlight_text = data.get('highlight_text')

    # Create the highlight entry in the database
    new_highlight = create_highlight(content, highlight_text, return_dict=True)

    # Return a JSON response with the new highlight's ID
    return jsonify(new_highlight)

@app.route('/highlights', methods=['GET'])
def get_highlights_endpoint():
    # Get all highlights from the database
    highlights = get_highlights(asdict=True)

    # Return a JSON response with the highlights
    return jsonify(highlights)
    
@app.route('/save_quill', methods=['POST'])
def save():
    data = request.get_json()
    print(data)
    # stored_contents, error = store_content_list([quill2Dict(data, storage_path = CONTENT_FILE_PATH, storage_fmt="html")], return_dict=True)
    error = sync_content([quill2Dict(data, storage_path = CONTENT_FILE_PATH, storage_fmt="html")], [], sync_key="id")
    stored_contents = get_content_list(asdict=True)
    return jsonify({"message": "Saved", "error": error, "saved_content": stored_contents})

@app.route('/dl_zotero', methods=['POST'])
def dl_zotero():
    data = request.get_json()
    if data['content_type'] != 'zotero_entry':
        return jsonify({"message": "Not a zotero entry"}), 400
    content_id = data['id']
    zotero_key = data['zotero_key']
    attachment = download_zotero_attachment(ZOTERO_API_KEY, ZOTERO_USER_ID, zotero_key, CONTENT_FILE_PATH)
    if attachment:
        print("updating the filename")
        # update the content entry
        update_obj = {"id":content_id, "filename": attachment['data']['filename'] }
        # print(update_obj)
        update_content([update_obj,])
        return "successfully downloaded file", 200

@app.route('/content', methods=['GET'])
def get_all_content():
    content_data = get_content_list(asdict=True)
    return jsonify(content_data)

@app.route('/content/<content_id>', methods=['GET'])
def get_single_content(content_id):
    # Implement fetching a single content by its ID here
    pass

@app.route('/content/<content_id>', methods=['PUT'])
def update_content_by_id(content_id):
    # Implement updating a single content by its ID here
    pass

@app.route('/attachment/<filename>', methods=['GET'])
def get_attachment(filename):
    return send_from_directory(CONTENT_FILE_PATH, filename)


@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    
    user, error = store_user(data)
    
    if error:
        return jsonify({'message': error}), 400
    with Session() as session:
        user = get_user({'username': user.username}, session)
        login_user(user)
        return jsonify({'message': 'User registered and logged in', 'user': user.to_dict()}), 201

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data['username']
    password = data['password']

    with Session() as session:
        user = get_user({'username': username}, session)
        if user and user.check_password(password):     
            login_user(user)
            return jsonify({'message': 'Logged in successfully', 'user':user.to_dict()}), 200
        else:
            return jsonify({'message': 'Invalid email or password'}), 401

@app.route('/logout', methods=['POST'])
def logout():
    logout_user()
    return jsonify({'message': 'Logged out successfully'}), 200


if __name__ == '__main__':
    app.run(debug=True,host="0.0.0.0", threaded=True) 
