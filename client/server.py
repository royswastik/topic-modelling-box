from flask import Flask, request, send_from_directory
from flask import jsonify

app = Flask(__name__)
indexUrl = "http://127.0.0.1:9200/java_sections_swastik"

# @app.route("/", methods=['GET', 'POST'])
# def recommendations():
#     return jsonify(request.get_json())


@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def themecss(path):
    return send_from_directory('.', path)
