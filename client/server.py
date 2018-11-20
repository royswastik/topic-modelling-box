from flask import Flask, request, send_from_directory
from flask import jsonify
from sklearn.decomposition import PCA

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

@app.route("/get2DVectors", methods=['POST'])
def get2DVectors():
    post = request.get_json()
    print(post)
    vectors_tuple = []
    for topic_id, vector in post.items():
        vectors_tuple.append((topic_id, vector))
    tuple_2d = get_pca(vectors_tuple)
    res = []
    for t in tuple_2d:
        res[t[0]] = t[1]
    return jsonify(res)

def get_pca(data):
    sent = [v[0] for v in data]
    data_vect = [v[1] for v in data]
    pca = PCA(n_components=2)
    reduced_dims_vect = pca.fit_transform(data_vect)
    reduced_dims_data = [(sent[i], reduced_dims_vect[i]) for i in range(len(sent))]
    return reduced_dims_data