from flask import Flask, request, send_from_directory
from flask import jsonify, make_response
from sklearn.decomposition import PCA
import json

from gensim.test.utils import common_texts, get_tmpfile
from gensim.models import Word2Vec
import numpy as np
from sklearn.cluster import KMeans
from sklearn import metrics
from sklearn.utils import check_random_state
from sklearn.metrics.pairwise import distance_metrics
from sklearn.metrics.pairwise import pairwise_distances

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


@app.route("/api/getClustersWord2Vec", methods=['POST'])
def getWord2Vec_TopicClusters():
    post = request.get_json()
    print(post)
    docs = post["docs"]
    res = getWord2VecClusters(docs)
    return jsonify(res)


def get_pca(data):
    sent = [v[0] for v in data]
    data_vect = [v[1] for v in data]
    pca = PCA(n_components=2)
    reduced_dims_vect = pca.fit_transform(data_vect)
    reduced_dims_data = [(sent[i], reduced_dims_vect[i]) for i in range(len(sent))]
    return reduced_dims_data


def find_centroid(vectors):
    return np.mean(vectors, axis=0)


def cosine(u, v):
    return np.dot(u, v) / (np.linalg.norm(u) * np.linalg.norm(v))


def getWord2VecClusters(docs):
    model = Word2Vec(docs, size=100, window=5, min_count=1, workers=4)

    def make_clusters(embeddings, texts):
        kmeans_model = 0
        old_silhoutte = -1
        best_k = 0
        best_silhoutte = -100
        labels = []
        print(len(texts) // 2)
        for k in range(2, max(len(texts) // 2, 2)):
            kmeans_model_tmp = KMeans(n_clusters=k, random_state=1).fit(embeddings)
            silhoutte = metrics.silhouette_score(embeddings, kmeans_model_tmp.labels_, metric='cosine')
            print("Silhoutte for k=" + str(k) + " is " + str(silhoutte))
            if silhoutte > best_silhoutte:
                kmeans_model = kmeans_model_tmp
                print("best k updated = " + str(best_k) + " -> " + str(k))
                print("best silhoutte updated = " + str(old_silhoutte) + " -> " + str(silhoutte))
                best_k = k
                best_silhoutte = silhoutte
                labels = kmeans_model_tmp.labels_
                centroids = kmeans_model_tmp.cluster_centers_
                old_silhoutte = silhoutte

        print("best k = " + str(best_k))
        print(labels)  # [1 0 1 0 2 1 0 1] Sample Output for labels\
        return labels, centroids

    def make_word2vec_clusters(documents):
        word_set = set()
        for document in documents:
            word_set |= set(document)
        word_list = list(word_set)
        model = Word2Vec([word_list], size=100, window=5, min_count=1, workers=4)
        embeddings = []
        for index, word in enumerate(word_list):
            emb = model.wv[word]
            embeddings.append(emb)
        res = {
            "word_embeddings": [],
            "topic_embeddings": {},
            "document_embeddings": [],
            "document_word": [],
            "topic_word": {},
            "document_topic": {},
            "overall_centroid": []
        }

        labels, centroids = make_clusters(embeddings, word_list)
        res["overall_centroid"] = find_centroid(centroids)
        res["topic_embeddings"] = centroids
        document_embeddings = [find_centroid([model.wv[word] for word in d]) for d in documents]
        res["document_embeddings"] = document_embeddings
        for index, word in enumerate(word_list):
            emb = model.wv[word]
            embeddings.append(emb)
            res["word_embeddings"].append([word, labels[index], emb])
            valDocWord = {}
            valDocWord[word] = cosine(emb, res["overall_centroid"])
            res["document_word"].append(valDocWord)
            topic = labels[index]

            if topic not in res["topic_word"]:
                res["topic_word"][topic] = {}
            res["topic_word"][topic][word] = cosine(res["topic_embeddings"][topic], emb)

        for index, topic in enumerate(res["topic_word"].keys()):
            emb = res["topic_embeddings"][topic]
            for doc_index, doc_emb in enumerate(res["document_embeddings"]):
                if doc_index not in res["document_topic"]:
                    res["document_topic"][doc_index] = {}
                res["document_topic"][doc_index][topic] = cosine(res["topic_embeddings"][topic], doc_emb)
        return res
    res = make_word2vec_clusters(docs)
    words_set = set()
    for key1, val1 in res["topic_word"].items():
        for key, val in val1.items():
            words_set.add(key)

    vectors_tuple = []
    # Get 2D coordinates for topics using PCA
    for topic_id, vector in enumerate(res["topic_embeddings"]):
        vectors_tuple.append((topic_id, vector))
    tuple_2d = get_pca(vectors_tuple)
    topic_vectors = {}
    for t in tuple_2d:
        topic_vectors[str(t[0])] = [t[1][0], t[1][1]]

    res = {
        "topic_word": res["topic_word"],
        "document_topic": res["document_topic"],
        "document_word": res["document_word"],
        "words": list(words_set),
        "topic_vectors": topic_vectors
    }
    res = stringify_keys(res)
    res["topics"] = list(res["topic_word"].keys())
    # res = jsonify({"res": res})

    res = json.dumps(res)
    # return json.dumps(res)
    # return make_response(res)
    return res

def stringify_keys(d):
    """Convert a dict's keys to strings if they are not."""
    for key in d.keys():

        # check inner dict
        if isinstance(d[key], dict):
            value = stringify_keys(d[key])
        else:
            value = d[key]

        # convert nonstring to string if needed
        if not isinstance(key, str):
            try:
                d[str(key)] = value
            except Exception:
                try:
                    d[repr(key)] = value
                except Exception:
                    raise

            # delete old key
            del d[key]
    return d
