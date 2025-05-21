from flask import Flask, request, jsonify
from flask_socketio import SocketIO
from flask_cors import CORS
import os
import json

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

# 内存数据存储
players = {}  # 连接池
game_states = {}  # 游戏状态
high_scores = {}  # 最高分存档

@app.route('/api/score', methods=['POST'])
def save_score():
    data = request.get_json()
    score = data.get('score')
    board = data.get('board')
    user_id = request.headers.get('Authorization', 'default')
    
    if not score or not board:
        return jsonify({'success': False, 'error': 'Missing parameters'})
        
    # 更新最高分
    current_high = high_scores.get(user_id, 0)
    if score > current_high:
        high_scores[user_id] = score
        
    # 保存游戏状态
    game_states[user_id] = {
        'board': board,
        'score': score,
        'highScore': high_scores[user_id]
    }
    
    return jsonify({
        'success': True,
        'highScore': high_scores[user_id]
    })

@app.route('/api/load', methods=['GET'])
def load_game():
    user_id = request.headers.get('Authorization', 'default')
    
    # 获取存档数据
    saved_state = game_states.get(user_id, {
        'board': [[0] * 4 for _ in range(4)],
        'score': 0,
        'highScore': high_scores.get(user_id, 0)
    })
    
    return jsonify(saved_state)

@socketio.on('connect')
def handle_connect():
    player_id = request.sid
    players[player_id] = {
        'id': player_id,
        'status': 'online'
    }

@socketio.on('disconnect')
def handle_disconnect():
    player_id = request.sid
    if player_id in players:
        del players[player_id]

@socketio.on('game_action')
def handle_game_action(data):
    player_id = request.sid
    action = data.get('action')
    board = data.get('board')
    score = data.get('score')
    
    # 更新游戏状态
    game_states[player_id] = {
        'board': board,
        'score': score,
        'lastAction': action
    }
    
    # 广播游戏状态更新
    socketio.emit('game_update', game_states[player_id], room=player_id)

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000)