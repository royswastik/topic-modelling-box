"use strict";

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

Array.prototype.contains = function (v) {
  for (var i = 0; i < this.length; i++) {
    if (this[i] === v) return true;
  }

  return false;
};

Array.prototype.unique = function () {
  var arr = [];

  for (var i = 0; i < this.length; i++) {
    if (!arr.includes(this[i])) {
      arr.push(this[i]);
    }
  }

  return arr;
};

function renderClusterForceLayout(data) {
  var dataVal = data["topic_word"];
  var final_dict = {};

  for (var key in dataVal) {
    if (dataVal.hasOwnProperty(key)) {
      var childrenWords = dataVal[key];

      for (var childKey in childrenWords) {
        if (childrenWords.hasOwnProperty(childKey) && childrenWords[childKey] > window.vueApp.params.wordThreshold) {
          if (!(childKey in final_dict)) {
            final_dict[childKey] = [];
          }

          final_dict[childKey].push(key);
        }
      }
    }
  }

  var cluster_data = {
    "name": "",
    "children": []
  };
  var count = 0;

  for (var key in final_dict) {
    if (final_dict.hasOwnProperty(key) && data["overall_word"][key] && data["overall_word"][key] > window.vueApp.params.wordOverallThreshold) {
      count = count + 1;
      var hash = {};
      hash["order"] = count;
      hash["alias"] = "White/red/jack pine";
      hash["color"] = "#C7EAFB";
      hash["name"] = key;
      var array_child = final_dict[key].unique();
      var childs = [];

      for (var i = 0; i < array_child.length; i++) {
        var child_hash = {};
        child_hash["order"] = i + 1;
        child_hash["alias"] = i + 1 + "";
        child_hash["color"] = "#C7EAFB";
        child_hash["name"] = array_child[i];
        childs.push(child_hash);
      }

      hash["children"] = childs;
      cluster_data.children.push(hash);
    }
  }

  var d3 = window.d3V3;
  renderCluster(cluster_data, d3);
}

function renderCluster(cluster_data, d3) {
  var radius = 200;
  var dendogramContainer = "speciescollapsible";
  var rootNodeSize = 6;
  var levelOneNodeSize = 3;
  var levelTwoNodeSize = 3;
  var levelThreeNodeSize = 2;
  var i = 0;
  var duration = 300; //Changing value doesn't seem any changes in the duration ??

  var rootJsonData;
  var cluster = d3.layout.cluster().size([360, radius - 120]).separation(function (a, b) {
    return (a.parent == b.parent ? 1 : 2) / a.depth;
  });
  var diagonal = d3.svg.diagonal.radial().projection(function (d) {
    return [d.y, d.x / 180 * Math.PI];
  });
  var containerDiv = d3.select(document.getElementById(dendogramContainer));
  containerDiv.append("button").attr("id", "collapse-button").text("Collapse!").on("click", collapseLevels);
  var svgRoot = containerDiv.append("svg:svg").attr("width", "100%").attr("height", "100%").attr("viewBox", "-" + radius + " -" + (radius - 50) + " " + radius * 2 + " " + radius * 2).call(d3.behavior.zoom().scale(0.9).scaleExtent([0.1, 3]).on("zoom", zoom)).on("dblclick.zoom", null).append("svg:g"); // Add the clipping path

  svgRoot.append("svg:clipPath").attr("id", "clipper-path").append("svg:rect").attr('id', 'clip-rect-anim');
  var animGroup = svgRoot.append("svg:g").attr("clip-path", "url(#clipper-path)");
  rootJsonData = cluster_data; //Start with all children collapsed

  rootJsonData.children.forEach(collapse); //Initialize the dendrogram

  createCollapsibleDendroGram(rootJsonData);

  function createCollapsibleDendroGram(source) {
    // Compute the new tree layout.
    var nodes = cluster.nodes(rootJsonData);
    var pathlinks = cluster.links(nodes); // Normalize for nodes' fixed-depth.

    nodes.forEach(function (d) {
      if (d.depth <= 2) {
        d.y = d.depth * 70;
      } else {
        d.y = d.depth * 100;
      }
    }); // Update the nodes…

    var node = svgRoot.selectAll("g.node").data(nodes, function (d) {
      return d.id || (d.id = ++i);
    }); // Enter any new nodes at the parent's previous position.

    var nodeEnter = node.enter().append("g").attr("class", "node").on("click", toggleChildren);
    nodeEnter.append("circle");
    nodeEnter.append("text").attr("x", 10).attr("dy", ".35em").attr("text-anchor", "start").text(function (d) {
      if (d.depth === 2) {
        return d.alias;
      }

      return d.name;
    }); // Transition nodes to their new position.

    var nodeUpdate = node.transition().duration(duration).attr("transform", function (d) {
      return "rotate(" + (d.x - 90) + ")translate(" + d.y + ")";
    });
    nodeUpdate.select("circle").attr("r", function (d) {
      if (d.depth == 0) {
        return rootNodeSize;
      } else if (d.depth === 1) {
        return levelOneNodeSize;
      } else if (d.depth === 2) {
        return levelTwoNodeSize;
      }

      return levelThreeNodeSize;
    }).style("fill", function (d) {
      if (d.depth === 0) {
        return "#808080";
      } else if (d.depth === 1) {
        if (d.name == "Hardwoods") return "#816854";
        return "#C3B9A0";
      } else {
        return d.color;
      }
    }).style("stroke", function (d) {
      if (d.depth > 1) {
        return "white";
      } else {
        return "lightgray";
      }
    });
    nodeUpdate.select("text").attr('id', function (d) {
      var order = 0;
      if (d.order) order = d.order;
      return 'T-' + d.depth + "-" + order;
    }).attr("text-anchor", function (d) {
      if (d.depth === 1) {
        return d.x < 180 ? "end" : "start";
      }

      return d.x < 180 ? "start" : "end";
    }).attr("dy", function (d) {
      if (d.depth === 1) {
        return d.x < 180 ? "1.4em" : "-0.2em";
      }

      return ".31em";
    }).attr("dx", function (d) {
      if (d.depth === 1) {
        return 0; //return d.x > 180 ? 2 : -2;
      }

      return d.x < 180 ? 1 : -20;
    }).attr("transform", function (d) {
      if (d.depth < 2) {
        return "rotate(" + (90 - d.x) + ")";
      } else {
        return d.x < 180 ? null : "rotate(180)";
      }
    }); // TODO: appropriate transform

    var nodeExit = node.exit().transition().duration(duration).remove(); // Update the links…

    var link = svgRoot.selectAll("path.link").data(pathlinks, function (d) {
      return d.target.id;
    }); // Enter any new links at the parent's previous position.

    link.enter().insert("path", "g").attr("class", "link").attr("d", function (d) {
      var o = {
        x: source.x0,
        y: source.y0
      };
      return diagonal({
        source: o,
        target: o
      });
    }).style("fill", function (d) {
      return d.color;
    }); // Transition links to their new position.

    link.transition().duration(duration).attr("d", diagonal); // Transition exiting nodes to the parent's new position.

    link.exit().transition().duration(duration).attr("d", function (d) {
      var o = {
        x: source.x,
        y: source.y
      };
      return diagonal({
        source: o,
        target: o
      });
    }).remove();
  } // Toggle children on click.


  function toggleChildren(d, clickType) {
    if (d.children) {
      d._children = d.children;
      d.children = null;
    } else {
      d.children = d._children;
      d._children = null;
    }

    var type = _typeof(clickType) == undefined ? "node" : clickType; //Activities on node click

    createCollapsibleDendroGram(d);
    highlightNodeSelections(d);
    highlightRootToNodePath(d, type);
  } // Collapse nodes


  function collapse(d) {
    if (d.children) {
      d._children = d.children;

      d._children.forEach(collapse);

      d.children = null;
    }
  } // highlights subnodes of a node


  function highlightNodeSelections(d) {
    var highlightLinkColor = "darkslategray"; //"#f03b20";

    var defaultLinkColor = "lightgray";
    var depth = d.depth;
    var nodeColor = d.color;

    if (depth === 1) {
      nodeColor = highlightLinkColor;
    }

    var pathLinks = svgRoot.selectAll("path.link");
    pathLinks.style("stroke", function (dd) {
      if (dd.source.depth === 0) {
        if (d.name === '') {
          return highlightLinkColor;
        }

        return defaultLinkColor;
      }

      if (dd.source.name === d.name) {
        return nodeColor;
      } else {
        return defaultLinkColor;
      }
    });
  } //Walking parents' chain for root to node tracking


  function highlightRootToNodePath(d, clickType) {
    var ancestors = [];
    var parent = d;

    while (!_.isUndefined(parent)) {
      ancestors.push(parent);
      parent = parent.parent;
    } // Get the matched links


    var matchedLinks = [];
    svgRoot.selectAll('path.link').filter(function (d, i) {
      return _.any(ancestors, function (p) {
        return p === d.target;
      });
    }).each(function (d) {
      matchedLinks.push(d);
    });
    animateChains(matchedLinks, clickType);

    function animateChains(links, clickType) {
      animGroup.selectAll("path.selected").data([]).exit().remove();
      animGroup.selectAll("path.selected").data(links).enter().append("svg:path").attr("class", "selected").attr("d", diagonal); //Reset path highlight if collapse button clicked

      if (clickType == 'button') {
        animGroup.selectAll("path.selected").classed('reset-selected', true);
      }

      var overlayBox = svgRoot.node().getBBox();
      svgRoot.select("#clip-rect-anim").attr("x", -radius).attr("y", -radius).attr("width", 0).attr("height", radius * 2).transition().duration(duration).attr("width", radius * 2);
    }
  }

  function zoom() {
    svgRoot.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
  }

  function collapseLevels() {
    if (checkForThirdLevelOpenChildren()) {
      toggleAllSecondLevelChildren();
    } else {
      toggleSecondLevelChildren();
    } // Open first level only by collapsing second level


    function toggleSecondLevelChildren() {
      for (var rootIndex = 0, rootLength = rootJsonData.children.length; rootIndex < rootLength; rootIndex++) {
        if (isNodeOpen(rootJsonData.children[rootIndex])) {
          toggleChildren(rootJsonData.children[rootIndex], 'button');
        }
      }
    } // Open first level only by collapsing second level


    function toggleAllSecondLevelChildren() {
      for (var rootIndex = 0, rootLength = rootJsonData.children.length; rootIndex < rootLength; rootIndex++) {
        if (isNodeOpen(rootJsonData.children[rootIndex])) {
          for (var childIndex = 0, childLength = rootJsonData.children[rootIndex].children.length; childIndex < childLength; childIndex++) {
            var secondLevelChild = rootJsonData.children[rootIndex].children[childIndex];

            if (isNodeOpen(secondLevelChild)) {
              toggleChildren(rootJsonData.children[rootIndex].children[childIndex], 'button');
            }
          }
        }
      }
    } // Check if any nodes opens at second level


    function checkForThirdLevelOpenChildren() {
      for (var rootIndex = 0, rootLength = rootJsonData.children.length; rootIndex < rootLength; rootIndex++) {
        if (isNodeOpen(rootJsonData.children[rootIndex])) {
          for (var childIndex = 0, childLength = rootJsonData.children[rootIndex].children.length; childIndex < childLength; childIndex++) {
            var secondLevelChild = rootJsonData.children[rootIndex].children[childIndex];

            if (isNodeOpen(secondLevelChild)) {
              return true;
            }
          }
        }
      }
    }

    function isNodeOpen(d) {
      if (d.children) {
        return true;
      }

      return false;
    }
  }
}
"use strict";

function loadJquery() {
  $(document).ready(function () {
    $("#toggle-sidebar").click(function () {
      $('.ui.sidebar').sidebar('toggle');
    });
  });
}
"use strict";

require.config({
  paths: {
    "d3": "https://d3js.org/d3.v3.min"
  }
});

function loadD3() {
  window.d3Old = d3;

  require(['d3'], function (d3V3) {
    window.d3V3 = d3V3;
    window.d3 = d3Old; // window.documents = [
    //         //   ["i", "am", "batman", "of", "winterfall"],
    //         //   ["there", "should", "always", "be", "a", "stark", "in", "winterfell"],
    //         //   ["prophecy", "says", "prince", "will", "be" , "reborn"]
    //         // ];
    //     window.documents = [['project', 'classification', 'compare', 'neural', 'nets', 'SVM', 'due', 'due'], ['two', 'new', 'progress', 'checks', 'final', 'project',  'assigned', 'follows'], ['report', 'graded',  'contribute', 'points',  'total', 'semester', 'grade'], ['progress', 'update', 'evaluated', 'TA', 'peers'], ['class', 'meeting', 'tomorrow','teams', 'work', 'progress', 'report', 'final', 'project'], [ 'quiz',  'sections', 'regularization', 'Tuesday'], [ 'quiz', 'Thursday', 'logistics', 'work', 'online', 'student', 'postpone',  'quiz', 'Tuesday'], ['quiz', 'cover', 'Thursday'], ['quiz', 'chap', 'chap', 'linear', 'regression']];

    window.documents = [['serious', 'talk', 'friends', 'flaky', 'lately', 'understood', 'good', 'evening', 'hanging'], ['got', 'gift', 'elder', 'brother', 'really', 'surprising'], ['completed', '5', 'miles', 'run', 'without', 'break', 'makes', 'feel', 'strong'], ['son', 'performed', 'well', 'test', 'preparation']];
    getAnalysis("LDA");
  });
}

function getDocs(texts) {
  return window.documents = texts.map(function (x) {
    return x.split();
  });
}

function getAnalysis(method, success, fail) {
  var docs = window.documents;

  var fnc = function fnc(x) {
    return x;
  };

  if (method === "LDA") {
    fnc = getLDAClusters;
  } else {
    fnc = getWord2VecClusters;
  }

  window.loadDFunc = fnc;
  fnc(docs, function (resp) {
    window.global_data = resp;
    initPage1(resp);
    initPage2(resp);
    initPage3(resp);
    initPage4();

    if (success) {
      success(resp);
    }
  }, fail);
}

function loadVisualizations() {}

function initPage1(resp) {
  renderClusterAnalysis(resp);
}

function initPage2(resp) {
  $("#speciescollapsible").html("");
  renderClusterForceLayout(resp);
}

function initPage3(resp) {
  $("#parallel-coordinate-vis").html("");
  $("#pc-container").html("");
  loadParallelCoordinate(resp);
  loadParallelCoordinatesHC(resp);
}

function initPage4() {
  $("#overall-wc").html("");
  loadWordCloud(window.global_data);
}
"use strict";

//vectors format: Map[string(topic_id): List[float]]
function get2DVectors(vectors, successCallback) {
  var request = $.ajax({
    url: "/get2DVectors",
    method: "POST",
    data: vectors
  });
  request.done(function (response) {
    successCallback(response);
  });
  request.fail(function (jqXHR, textStatus) {
    alert("Request failed: " + textStatus);
  });
}

function getTokenizedDocs(docs, successCallback, failureCallback) {
  var request = $.ajax({
    url: "/getDocsFromTexts",
    method: "POST",
    data: JSON.stringify({
      docs: docs
    }),
    contentType: "application/json; charset=utf-8",
    dataType: "json"
  });
  request.done(function (response) {
    successCallback(response.docs);
  });
  request.fail(function (jqXHR, textStatus) {
    if (failureCallback) failureCallback(textStatus);else {
      alert("Request failed: " + textStatus);
    }
  });
} // docs format: List[List[string(word)]]


function getWord2VecClusters(docs, successCallback, failureCallback) {
  var request = $.ajax({
    url: "/api/getClustersWord2Vec",
    method: "POST",
    data: JSON.stringify({
      docs: docs,
      start: window.vueApp.settings.start2,
      end: window.vueApp.settings.end2,
      selected: window.vueApp.settings.selectedDataset
    }),
    contentType: "application/json; charset=utf-8",
    dataType: "json"
  });
  request.done(function (response) {
    successCallback(JSON.parse(response));
  });
  request.fail(function (jqXHR, textStatus) {
    if (failureCallback) failureCallback(textStatus);else {
      alert("Request failed: " + textStatus);
    }
  });
}

function getLDAClusters(docs, successCallback, failureCallback) {
  var request = $.ajax({
    url: "/api/getLDAData",
    method: "POST",
    data: JSON.stringify({
      docs: docs,
      start: window.vueApp.settings.start1,
      end: window.vueApp.settings.end1,
      selected: window.vueApp.settings.selectedDataset
    }),
    contentType: "application/json; charset=utf-8",
    dataType: "json"
  });
  request.done(function (response) {
    successCallback(response);
  });
  request.fail(function (jqXHR, textStatus) {
    if (failureCallback) failureCallback(textStatus);else {
      alert("Request failed: " + textStatus);
    }
  });
}
"use strict";

function loadParallelCoordinatesHC(resp) {
  var data = generateParallelCoordinateDataHC(resp, window.vueApp.params.topicThreshold, window.vueApp.params.wordThreshold);
  Highcharts.chart('pc-container', {
    chart: {
      type: 'spline',
      parallelCoordinates: true,
      parallelAxes: {
        lineWidth: 2
      }
    },
    title: {
      text: 'Document - Topic - Word Relationship'
    },
    plotOptions: {
      series: {
        animation: false,
        marker: {
          enabled: false,
          states: {
            hover: {
              enabled: false
            }
          }
        },
        states: {
          hover: {
            halo: {
              size: 0
            }
          }
        },
        events: {
          mouseOver: function mouseOver() {
            this.group.toFront();
          }
        }
      }
    },
    // tooltip: {
    //     pointFormat: '<span style="color:{point.color}">\u25CF</span>' +
    //         '{series.name}: <b>{point.formattedValue}</b><br/>'
    // },
    xAxis: {
      categories: ['Document', 'Topic', 'Word'],
      offset: 10
    },
    yAxis: [{
      categories: Object.keys(resp["document_topic"]).map(function (x) {
        return "................Document " + x;
      })
    }, {
      categories: resp["topics"].map(function (x) {
        return "................Topic " + x;
      })
    }, {
      categories: Object.values(resp["words"]).map(function (x) {
        return "................" + x;
      })
    }],
    colors: ['rgba(11, 200, 200, 0.1)'],
    series: data.map(function (set, i) {
      return {
        name: '',
        data: set,
        shadow: false
      };
    })
  });
}
"use strict";

function loadParallelCoordinate(resp) {
  var margin = {
    top: 30,
    right: 10,
    bottom: 10,
    left: 10
  },
      width = 960 - margin.left - margin.right,
      height = 500 - margin.top - margin.bottom;
  var x = d3V3.scale.ordinal().rangePoints([0, width], 1),
      y = {},
      dragging = {};
  var line = d3V3.svg.line(),
      background,
      foreground;
  var svg = d3V3.select("#parallel-coordinate-vis").append("svg").attr("width", width + margin.left + margin.right).attr("height", height + margin.top + margin.bottom).append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")"),
      dimensions; // Extract the list of dimensions and create a scale for each.

  var cars = generateParallelCoordinateData(resp, window.vueApp.params.topicThreshold, window.vueApp.params.wordThreshold); // var axisD = d3V3.svg.axis().orient("left").ticks(Object.keys(resp["document_topic"]).length),

  var axisD = d3V3.svg.axis().orient("left").tickValues(Object.keys(resp["document_topic"]).map(function (x) {
    return parseInt(x);
  })),
      axisT = d3V3.svg.axis().orient("left").tickValues(resp["topics"].map(function (x) {
    return parseInt(x);
  })),
      axisW = d3V3.svg.axis().orient("left").tickValues(Object.values(resp["overall_word"]).map(function (x) {
    return parseFloat(x);
  }));
  x.domain(dimensions = d3V3.keys(cars[0]).filter(function (d) {
    return d != "name" && (y[d] = d3V3.scale.linear().domain(d3V3.extent(cars, function (p) {
      return +p[d];
    })).range([height, 0]));
  })); // Add grey background lines for context.

  background = svg.append("g").attr("class", "background").selectAll("path").data(cars).enter().append("path").attr("d", path); // Add blue foreground lines for focus.

  foreground = svg.append("g").attr("class", "foreground").selectAll("path").data(cars).enter().append("path").attr("d", path); // Add a group element for each dimension.

  var g = svg.selectAll(".dimension").data(dimensions).enter().append("g").attr("class", "dimension").attr("transform", function (d) {
    return "translate(" + x(d) + ")";
  }).call(d3V3.behavior.drag().origin(function (d) {
    return {
      x: x(d)
    };
  }).on("dragstart", function (d) {
    dragging[d] = x(d);
    background.attr("visibility", "hidden");
  }).on("drag", function (d) {
    dragging[d] = Math.min(width, Math.max(0, d3V3.event.x));
    foreground.attr("d", path);
    dimensions.sort(function (a, b) {
      return position(a) - position(b);
    });
    x.domain(dimensions);
    g.attr("transform", function (d) {
      return "translate(" + position(d) + ")";
    });
  }).on("dragend", function (d) {
    delete dragging[d];
    transition(d3V3.select(this)).attr("transform", "translate(" + x(d) + ")");
    transition(foreground).attr("d", path);
    background.attr("d", path).transition().delay(500).duration(0).attr("visibility", null);
  })); // Add an axis and title.

  g.append("g").attr("class", "axis").each(function (d) {
    var axis = null;

    if (d == "document") {
      axis = axisD;
    } else if (d == "topic") {
      axis = axisT;
    } else {
      axis = axisW;
    }

    d3V3.select(this).call(axis.scale(y[d]));
  }).append("text").style("text-anchor", "middle").attr("y", -9).text(function (d) {
    return d;
  }); // Add and store a brush for each axis.

  g.append("g").attr("class", "brush").each(function (d) {
    d3V3.select(this).call(y[d].brush = d3V3.svg.brush().y(y[d]).on("brushstart", brushstart).on("brush", brush));
  }).selectAll("rect").attr("x", -8).attr("width", 16);

  function position(d) {
    var v = dragging[d];
    return v == null ? x(d) : v;
  }

  function transition(g) {
    return g.transition().duration(500);
  } // Returns the path for a given data point.


  function path(d) {
    return line(dimensions.map(function (p) {
      return [position(p), y[p](d[p])];
    }));
  }

  function brushstart() {
    d3V3.event.sourceEvent.stopPropagation();
  } // Handles a brush event, toggling the display of foreground lines.


  function brush() {
    var actives = dimensions.filter(function (p) {
      return !y[p].brush.empty();
    }),
        extents = actives.map(function (p) {
      return y[p].brush.extent();
    });
    foreground.style("display", function (d) {
      return actives.every(function (p, i) {
        return extents[i][0] <= d[p] && d[p] <= extents[i][1];
      }) ? null : "none";
    });
  }
}
"use strict";

function renderClusterAnalysis(resp) {
  d3.select(".chart12").remove();
  var document_topic = resp["document_topic"][0];
  var topic_vectors = resp["topic_vectors"];
  var bb = document.querySelector('#cluster').getBoundingClientRect(),
      width = 400;
  var height = 400;
  var margin = 80;
  var data = [];
  Object.keys(topic_vectors).forEach(function (key) {
    var value = topic_vectors[key];
    data.push({
      x: value[0],
      y: value[1],
      c: 1,
      size: document_topic[key],
      key: key
    });
  });
  var labelX = 'X';
  var labelY = 'Y';
  var svg = d3.select('#cluster').append('svg').attr('class', 'chart12').attr('id', 'cluster_id').attr("width", width + margin + margin).attr("height", height + margin + margin).append("g").attr("transform", "translate(" + margin + "," + margin + ")");
  var x = d3.scaleLinear().domain([d3.min(data, function (d) {
    return d.x;
  }), d3.max(data, function (d) {
    return d.x;
  })]).range([0, width]);
  var y = d3.scaleLinear().domain([d3.min(data, function (d) {
    return d.y;
  }), d3.max(data, function (d) {
    return d.y;
  })]).range([height, 0]);
  var scale = d3.scaleSqrt().domain([d3.min(data, function (d) {
    return d.size;
  }), d3.max(data, function (d) {
    return d.size;
  })]).range([10, 20]);
  var opacity = d3.scaleSqrt().domain([d3.min(data, function (d) {
    return d.size;
  }), d3.max(data, function (d) {
    return d.size;
  })]).range([1, .5]);
  var xAxis = d3.axisBottom().scale(x);
  var yAxis = d3.axisLeft().scale(y);
  svg.append("g").attr("class", "y axis").call(yAxis).append("text").attr("transform", "rotate(-90)").attr("x", 20).attr("y", -margin).attr("dy", ".71em").style("text-anchor", "end").text(labelY); // x axis and label

  svg.append("g").attr("class", "x axis").attr("transform", "translate(0," + height + ")").call(xAxis).append("text").attr("x", width + 20).attr("y", margin - 10).attr("dy", ".71em").style("text-anchor", "end").text(labelX);
  svg.selectAll("circle").data(data).enter().append("g").insert("circle").attr("cx", width / 2).attr("cy", height / 2).attr("r", function (d) {
    return scale(d.size);
  }).attr("id", function (d) {
    return d.key;
  }).style("fill", function (d) {
    return "#D0E3F0";
  }).on('mouseover', function (d, i) {
    renderBarGraph(d["key"], resp);
    fade(d["key"], 1);
  }).on('mouseout', function (d, i) {
    fadeOut();
  }).transition().delay(function (d, i) {
    return x(d.x) - y(d.y);
  }).duration(500).attr("cx", function (d) {
    return x(d.x);
  }).attr("cy", function (d) {
    return y(d.y);
  }); // text label for the x axis

  svg.append("text").attr("class", "x label").attr("text-anchor", "end").attr("x", width).attr("y", height + 40).text("PC1");
  svg.append("text").attr("class", "y label").attr("text-anchor", "end").attr("y", -50).attr("dy", ".75em").attr("transform", "rotate(-90)").text("PC2");

  function fade(key, opacity) {
    svg.selectAll("circle").filter(function (d) {
      return d.key == key;
    }).style("fill", "#C8423E");
  }

  function fadeOut() {
    svg.selectAll("circle").transition().style("fill", "#D0E3F0");
  }
}
"use strict";

function renderBarGraph(topic_number, resp) {
  d3.select("#stack-bar").remove();
  d3.select("#legendsvg").remove();
  var final_data = [];
  var dataVal = resp["topic_word"][topic_number];

  for (var key in dataVal) {
    if (dataVal.hasOwnProperty(key)) {
      var temp = {};
      temp.State = key;
      temp.topic_frequency = Math.abs(dataVal[key]);
      temp.overall = Math.abs(resp["overall_word"][key]);
      temp.total = temp.topic_frequency + temp.overall;
      final_data.push(temp);
      console.log(key + "->" + resp["overall_word"][key]);
    }
  }

  var bb = document.querySelector('#stacked-bar').getBoundingClientRect(),
      width = 400;
  var data = final_data;
  var height = data.length * 25 + 100;
  var svg = d3.select("#stacked-bar").append("svg").attr("width", width).attr("height", height).attr("id", "stack-bar"),
      margin = {
    top: 20,
    right: 0,
    bottom: 50,
    left: 80
  },
      width = +svg.attr("width") - margin.left - margin.right,
      height = +svg.attr("height") - margin.top - margin.bottom,
      g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");
  var y = d3.scaleBand() // x = d3.scaleBand()  
  .rangeRound([0, height]) // .rangeRound([0, width])
  .paddingInner(0.25).align(0.1);
  var x = d3.scaleLinear() // y = d3.scaleLinear()
  .rangeRound([0, width]); // .rangeRound([height, 0]);

  var z = d3.scaleOrdinal().range(["#C8423E", "#A1C7E0"]);
  var keys = ["topic_frequency", "overall"];
  data.sort(function (a, b) {
    return b.total - a.total;
  });
  y.domain(data.map(function (d) {
    return d.State;
  })); // x.domain...

  x.domain([0, d3.max(data, function (d) {
    return d.total;
  })]).nice(); // y.domain...

  z.domain(keys);
  g.append("g").selectAll("g").data(d3.stack().keys(keys)(data)).enter().append("g").attr("fill", function (d) {
    return z(d.key);
  }).selectAll("rect").data(function (d) {
    return d;
  }).enter().append("rect").attr("y", function (d) {
    return y(d.data.State);
  }) //.attr("x", function(d) { return x(d.data.State); })
  .attr("x", function (d) {
    return x(d[0]);
  }) //.attr("y", function(d) { return y(d[1]); }) 
  .attr("width", function (d) {
    return x(d[1]) - x(d[0]);
  }) //.attr("height", function(d) { return y(d[0]) - y(d[1]); })
  .attr("height", y.bandwidth()); //.attr("width", x.bandwidth());  

  g.append("g").attr("class", "axis").attr("transform", "translate(0,0)") //  .attr("transform", "translate(0," + height + ")")
  .call(d3.axisLeft(y)); //   .call(d3.axisBottom(x));

  g.append("g").attr("class", "axis").attr("transform", "translate(0," + height + ")") // New line
  .call(d3.axisBottom(x).ticks(null, "s")) //  .call(d3.axisLeft(y).ticks(null, "s"))
  .append("text").attr("y", 2) //     .attr("y", 2)
  .attr("x", x(x.ticks().pop()) + 0.5) //     .attr("y", y(y.ticks().pop()) + 0.5)
  .attr("dy", "4em") //     .attr("dy", "0.32em")
  .attr("fill", "#000").attr("text-anchor", "start").text("Probability/Cosine Similarity").attr("transform", "translate(" + -width + ",-10)"); // Newline

  var legend = g.append("g").attr("font-family", "sans-serif").attr("font-size", 10).attr("text-anchor", "end").selectAll("g").data(keys.slice().reverse()).enter().append("g") //.attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });
  .attr("transform", function (d, i) {
    return "translate(-50," + (300 + i * 20) + ")";
  });
  var keys1 = ["Overall Term Frequency/Overall Relevance", "Estimated Term frequency within the selected topic"];
  var svg1 = d3.select("#legendT").append("svg").attr("width", 500).attr("height", height).attr("id", "legendsvg");
  var legend = svg1.append("g").attr("font-family", "sans-serif").attr("font-size", 10).attr("text-anchor", "end").selectAll("g").data(keys1.slice().reverse()).enter().append("g") //.attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });
  .attr("transform", function (d, i) {
    return "translate(-50," + (0 + i * 20) + ")";
  });
  legend.append("rect").attr("x", width).attr("width", function (d, i) {
    if (i == 0) {
      return 60;
    }

    return 160;
  }).attr("height", 19).attr("fill", z);
  legend.append("text").attr("x", width - 10).attr("y", 18).attr("dy", "0.0em").text(function (d) {
    return d;
  });
}
"use strict";

function generateTopicVectors() {
  window.topicVectors = {};

  if (window.topic_word_probability_in_topic) {
    for (var x in window.topic_word_probability_in_topic) {
      var vector = [];

      for (var y in window.topic_word_probability_in_topic[x]) {
        vector.push(window.topic_word_probability_in_topic[x][y]);
      }

      window.topicVectors[x] = vector;
    }
  }
}

function generateParallelCoordinateData(response, topic_threshold, word_threshold) {
  var visData = [];

  for (var docKey in response["document_topic"]) {
    for (var topic in response["document_topic"][docKey]) {
      var topicScore = response["document_topic"][docKey][topic];

      if (topicScore > topic_threshold) {
        for (var word in response["topic_word"][topic]) {
          var wordScore = response["topic_word"][topic][word];

          if (wordScore > word_threshold) {
            visData.push({
              "name": docKey,
              "document": docKey,
              "topic": topic,
              "word": response["overall_word"][word]
            });
          }
        }
      }
    }
  }

  return visData;
}

function generateParallelCoordinateDataHC(response, topic_threshold, word_threshold) {
  var visData = [];

  for (var docKey in response["document_topic"]) {
    for (var topic in response["document_topic"][docKey]) {
      var topicScore = response["document_topic"][docKey][topic];

      if (topicScore > topic_threshold) {
        for (var word in response["topic_word"][topic]) {
          var wordScore = response["topic_word"][topic][word];

          if (wordScore > word_threshold) {
            visData.push([parseInt(docKey), parseInt(topic), response["words"].indexOf(word)]);
          }
        }
      }
    }
  }

  return visData;
}
"use strict";

window.vueApp = new Vue({
  el: '#vue-app',
  data: {
    message: 'Hello user!',
    noneSelected: true,
    selectedPage: 5,
    playerDetail: {
      name: "<Player Name>"
    },
    overviewFilters: {},
    newDocs: [],
    selectedMap: 1,
    success: false,
    loading: false,
    failure: false,
    newDoc: '',
    newDocsProccessed: '',
    showProcessed: false,
    settings: {
      selectedMethod: "LDA",
      selectedDataset: 0,
      start1: 0,
      //HappyDB
      end1: 10,
      //HappyDB
      start2: 0,
      //Medium
      end2: 5,
      //Medium
      ldaTopicThreshold: 0,
      word2VecThreshold: 0
    },
    params: {
      topicThreshold: 0.02,
      wordThreshold: 0.02,
      wordOverallThreshold: 0
    }
  },
  methods: {
    selectPage: function selectPage(x) {
      this.selectedPage = x;

      if (x == 1) {
        initPage1(window.global_data);
      }

      if (x == 2) {
        initPage2(window.global_data);
      }

      if (x == 3) {
        initPage3(window.global_data);
      }

      if (x == 4) {
        initPage4(window.global_data);
      }
    },
    addNewDoc: function addNewDoc() {
      if (this.newDoc.trim().split(" ").length < 3) {
        alert("Please add at least 3 words");
        return;
      }

      this.newDocs.push(this.newDoc);
      this.newDoc = '';
      this.showProcessed = false;
    },
    processDocs: function processDocs() {
      var self = this;
      getTokenizedDocs(this.newDocs, function (resp) {
        self.newDocsProccessed = resp;
        self.showProcessed = true;
      });
    },
    saveChanges: function saveChanges() {
      var self = this;
      self.success = false;
      self.failure = false;

      if (this.settings.selectedDataset == 0) {
        if (this.settings.end1 - this.settings.start1 < 10) {
          alert("There needs to be atleast 5 documents(& <= 50) for Happy DB. And start index can not be greater than end.");
          return;
        } else if (this.settings.end1 - this.settings.start1 > 50) {
          alert("There needs to be less than 50 documents for HappyDB.");
          return;
        }
      } else if (this.settings.selectedDataset == 1) {
        if (this.settings.end2 - this.settings.start2 < 5) {
          alert("There needs to be atleast 5 documents(& <= 30) for Medium Articles. And start index can not be greater than end.");
          return;
        } else if (this.settings.end2 - this.settings.start2 > 30) {
          alert("There needs to be less than 30 documents for Medium Articles.");
          return;
        }
      } else if (this.settings.selectedDataset == 2) {
        if (!this.showProcessed) {
          alert("Please process all documents first");
          return;
        }

        window.documents = this.newDocsProccessed;
      }

      self.loading = true;
      getAnalysis(this.settings.selectedMethod, function (resp) {
        self.success = true;
        self.loading = false;
      }, function (errorStatus) {
        self.loading = false;
        self.failure = true;
      });
    }
  },
  mounted: function mounted() {
    console.log("Mounted");
    loadD3();
    loadJquery();
  }
});
"use strict";

function loadWordCloud(resp) {
  var data = [];

  for (var word in resp["overall_word"]) {
    var weight = resp["overall_word"][word];
    data.push({
      name: word,
      weight: weight
    });
  }

  createWordCloud("overall-wc", data, "All Documents");

  for (var topic in resp["topic_word"]) {
    var _data = [];

    for (var word in resp["topic_word"][topic]) {
      var _weight = resp["topic_word"][topic][word];

      _data.push({
        name: word,
        weight: _weight
      });
    }

    $("#topic-wcs").append('<div class="col-sm-6"><div style="outline: solid 1px;" id="topic' + topic + '" style="height: 300px;"></div></div>');
    createWordCloud("topic" + topic, _data, "Topic " + topic);
  }
}

function createWordCloud(id, data, title) {
  Highcharts.chart(id, {
    series: [{
      type: 'wordcloud',
      data: data,
      rotation: {
        from: 0,
        to: 0,
        orientations: 5
      },
      name: 'Score'
    }],
    title: {
      text: title
    }
  });
}
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNsdXN0ZXJfZm9yY2VfbGF5b3V0LmpzIiwiZXZlbnRzLmpzIiwibWFpbi5qcyIsIm5ldHdvcmsuanMiLCJwYXJhbGxlbC1jb29yZGluYXRlLWhjLmpzIiwicGFyYWxsZWwtY29vcmRpbmF0ZS5qcyIsInNjYXR0ZXJfcGxvdF93aXRoX3dlaWdodHMuanMiLCJzdGFja2VkX2Jhcl9ncmFwaC5qcyIsInV0aWwuanMiLCJ2dWVfbW9kZWwuanMiLCJ3b3JkY2xvdWQuanMiXSwibmFtZXMiOlsiQXJyYXkiLCJwcm90b3R5cGUiLCJjb250YWlucyIsInYiLCJpIiwibGVuZ3RoIiwidW5pcXVlIiwiYXJyIiwiaW5jbHVkZXMiLCJwdXNoIiwicmVuZGVyQ2x1c3RlckZvcmNlTGF5b3V0IiwiZGF0YSIsImRhdGFWYWwiLCJmaW5hbF9kaWN0Iiwia2V5IiwiaGFzT3duUHJvcGVydHkiLCJjaGlsZHJlbldvcmRzIiwiY2hpbGRLZXkiLCJ3aW5kb3ciLCJ2dWVBcHAiLCJwYXJhbXMiLCJ3b3JkVGhyZXNob2xkIiwiY2x1c3Rlcl9kYXRhIiwiY291bnQiLCJ3b3JkT3ZlcmFsbFRocmVzaG9sZCIsImhhc2giLCJhcnJheV9jaGlsZCIsImNoaWxkcyIsImNoaWxkX2hhc2giLCJjaGlsZHJlbiIsImQzIiwiZDNWMyIsInJlbmRlckNsdXN0ZXIiLCJyYWRpdXMiLCJkZW5kb2dyYW1Db250YWluZXIiLCJyb290Tm9kZVNpemUiLCJsZXZlbE9uZU5vZGVTaXplIiwibGV2ZWxUd29Ob2RlU2l6ZSIsImxldmVsVGhyZWVOb2RlU2l6ZSIsImR1cmF0aW9uIiwicm9vdEpzb25EYXRhIiwiY2x1c3RlciIsImxheW91dCIsInNpemUiLCJzZXBhcmF0aW9uIiwiYSIsImIiLCJwYXJlbnQiLCJkZXB0aCIsImRpYWdvbmFsIiwic3ZnIiwicmFkaWFsIiwicHJvamVjdGlvbiIsImQiLCJ5IiwieCIsIk1hdGgiLCJQSSIsImNvbnRhaW5lckRpdiIsInNlbGVjdCIsImRvY3VtZW50IiwiZ2V0RWxlbWVudEJ5SWQiLCJhcHBlbmQiLCJhdHRyIiwidGV4dCIsIm9uIiwiY29sbGFwc2VMZXZlbHMiLCJzdmdSb290IiwiY2FsbCIsImJlaGF2aW9yIiwiem9vbSIsInNjYWxlIiwic2NhbGVFeHRlbnQiLCJhbmltR3JvdXAiLCJmb3JFYWNoIiwiY29sbGFwc2UiLCJjcmVhdGVDb2xsYXBzaWJsZURlbmRyb0dyYW0iLCJzb3VyY2UiLCJub2RlcyIsInBhdGhsaW5rcyIsImxpbmtzIiwibm9kZSIsInNlbGVjdEFsbCIsImlkIiwibm9kZUVudGVyIiwiZW50ZXIiLCJ0b2dnbGVDaGlsZHJlbiIsImFsaWFzIiwibmFtZSIsIm5vZGVVcGRhdGUiLCJ0cmFuc2l0aW9uIiwic3R5bGUiLCJjb2xvciIsIm9yZGVyIiwibm9kZUV4aXQiLCJleGl0IiwicmVtb3ZlIiwibGluayIsInRhcmdldCIsImluc2VydCIsIm8iLCJ4MCIsInkwIiwiY2xpY2tUeXBlIiwiX2NoaWxkcmVuIiwidHlwZSIsInVuZGVmaW5lZCIsImhpZ2hsaWdodE5vZGVTZWxlY3Rpb25zIiwiaGlnaGxpZ2h0Um9vdFRvTm9kZVBhdGgiLCJoaWdobGlnaHRMaW5rQ29sb3IiLCJkZWZhdWx0TGlua0NvbG9yIiwibm9kZUNvbG9yIiwicGF0aExpbmtzIiwiZGQiLCJhbmNlc3RvcnMiLCJfIiwiaXNVbmRlZmluZWQiLCJtYXRjaGVkTGlua3MiLCJmaWx0ZXIiLCJhbnkiLCJwIiwiZWFjaCIsImFuaW1hdGVDaGFpbnMiLCJjbGFzc2VkIiwib3ZlcmxheUJveCIsImdldEJCb3giLCJldmVudCIsInRyYW5zbGF0ZSIsImNoZWNrRm9yVGhpcmRMZXZlbE9wZW5DaGlsZHJlbiIsInRvZ2dsZUFsbFNlY29uZExldmVsQ2hpbGRyZW4iLCJ0b2dnbGVTZWNvbmRMZXZlbENoaWxkcmVuIiwicm9vdEluZGV4Iiwicm9vdExlbmd0aCIsImlzTm9kZU9wZW4iLCJjaGlsZEluZGV4IiwiY2hpbGRMZW5ndGgiLCJzZWNvbmRMZXZlbENoaWxkIiwibG9hZEpxdWVyeSIsIiQiLCJyZWFkeSIsImNsaWNrIiwic2lkZWJhciIsInJlcXVpcmUiLCJjb25maWciLCJwYXRocyIsImxvYWREMyIsImQzT2xkIiwiZG9jdW1lbnRzIiwiZ2V0QW5hbHlzaXMiLCJnZXREb2NzIiwidGV4dHMiLCJtYXAiLCJzcGxpdCIsIm1ldGhvZCIsInN1Y2Nlc3MiLCJmYWlsIiwiZG9jcyIsImZuYyIsImdldExEQUNsdXN0ZXJzIiwiZ2V0V29yZDJWZWNDbHVzdGVycyIsImxvYWRERnVuYyIsInJlc3AiLCJnbG9iYWxfZGF0YSIsImluaXRQYWdlMSIsImluaXRQYWdlMiIsImluaXRQYWdlMyIsImluaXRQYWdlNCIsImxvYWRWaXN1YWxpemF0aW9ucyIsInJlbmRlckNsdXN0ZXJBbmFseXNpcyIsImh0bWwiLCJsb2FkUGFyYWxsZWxDb29yZGluYXRlIiwibG9hZFBhcmFsbGVsQ29vcmRpbmF0ZXNIQyIsImxvYWRXb3JkQ2xvdWQiLCJnZXQyRFZlY3RvcnMiLCJ2ZWN0b3JzIiwic3VjY2Vzc0NhbGxiYWNrIiwicmVxdWVzdCIsImFqYXgiLCJ1cmwiLCJkb25lIiwicmVzcG9uc2UiLCJqcVhIUiIsInRleHRTdGF0dXMiLCJhbGVydCIsImdldFRva2VuaXplZERvY3MiLCJmYWlsdXJlQ2FsbGJhY2siLCJKU09OIiwic3RyaW5naWZ5IiwiY29udGVudFR5cGUiLCJkYXRhVHlwZSIsInN0YXJ0Iiwic2V0dGluZ3MiLCJzdGFydDIiLCJlbmQiLCJlbmQyIiwic2VsZWN0ZWQiLCJzZWxlY3RlZERhdGFzZXQiLCJwYXJzZSIsInN0YXJ0MSIsImVuZDEiLCJnZW5lcmF0ZVBhcmFsbGVsQ29vcmRpbmF0ZURhdGFIQyIsInRvcGljVGhyZXNob2xkIiwiSGlnaGNoYXJ0cyIsImNoYXJ0IiwicGFyYWxsZWxDb29yZGluYXRlcyIsInBhcmFsbGVsQXhlcyIsImxpbmVXaWR0aCIsInRpdGxlIiwicGxvdE9wdGlvbnMiLCJzZXJpZXMiLCJhbmltYXRpb24iLCJtYXJrZXIiLCJlbmFibGVkIiwic3RhdGVzIiwiaG92ZXIiLCJoYWxvIiwiZXZlbnRzIiwibW91c2VPdmVyIiwiZ3JvdXAiLCJ0b0Zyb250IiwieEF4aXMiLCJjYXRlZ29yaWVzIiwib2Zmc2V0IiwieUF4aXMiLCJPYmplY3QiLCJrZXlzIiwidmFsdWVzIiwiY29sb3JzIiwic2V0Iiwic2hhZG93IiwibWFyZ2luIiwidG9wIiwicmlnaHQiLCJib3R0b20iLCJsZWZ0Iiwid2lkdGgiLCJoZWlnaHQiLCJvcmRpbmFsIiwicmFuZ2VQb2ludHMiLCJkcmFnZ2luZyIsImxpbmUiLCJiYWNrZ3JvdW5kIiwiZm9yZWdyb3VuZCIsImRpbWVuc2lvbnMiLCJjYXJzIiwiZ2VuZXJhdGVQYXJhbGxlbENvb3JkaW5hdGVEYXRhIiwiYXhpc0QiLCJheGlzIiwib3JpZW50IiwidGlja1ZhbHVlcyIsInBhcnNlSW50IiwiYXhpc1QiLCJheGlzVyIsInBhcnNlRmxvYXQiLCJkb21haW4iLCJsaW5lYXIiLCJleHRlbnQiLCJyYW5nZSIsInBhdGgiLCJnIiwiZHJhZyIsIm9yaWdpbiIsIm1pbiIsIm1heCIsInNvcnQiLCJwb3NpdGlvbiIsImRlbGF5IiwiYnJ1c2giLCJicnVzaHN0YXJ0Iiwic291cmNlRXZlbnQiLCJzdG9wUHJvcGFnYXRpb24iLCJhY3RpdmVzIiwiZW1wdHkiLCJleHRlbnRzIiwiZXZlcnkiLCJkb2N1bWVudF90b3BpYyIsInRvcGljX3ZlY3RvcnMiLCJiYiIsInF1ZXJ5U2VsZWN0b3IiLCJnZXRCb3VuZGluZ0NsaWVudFJlY3QiLCJ2YWx1ZSIsImMiLCJsYWJlbFgiLCJsYWJlbFkiLCJzY2FsZUxpbmVhciIsInNjYWxlU3FydCIsIm9wYWNpdHkiLCJheGlzQm90dG9tIiwiYXhpc0xlZnQiLCJyZW5kZXJCYXJHcmFwaCIsImZhZGUiLCJmYWRlT3V0IiwidG9waWNfbnVtYmVyIiwiZmluYWxfZGF0YSIsInRlbXAiLCJTdGF0ZSIsInRvcGljX2ZyZXF1ZW5jeSIsImFicyIsIm92ZXJhbGwiLCJ0b3RhbCIsImNvbnNvbGUiLCJsb2ciLCJzY2FsZUJhbmQiLCJyYW5nZVJvdW5kIiwicGFkZGluZ0lubmVyIiwiYWxpZ24iLCJ6Iiwic2NhbGVPcmRpbmFsIiwibmljZSIsInN0YWNrIiwiYmFuZHdpZHRoIiwidGlja3MiLCJwb3AiLCJsZWdlbmQiLCJzbGljZSIsInJldmVyc2UiLCJrZXlzMSIsInN2ZzEiLCJnZW5lcmF0ZVRvcGljVmVjdG9ycyIsInRvcGljVmVjdG9ycyIsInRvcGljX3dvcmRfcHJvYmFiaWxpdHlfaW5fdG9waWMiLCJ2ZWN0b3IiLCJ0b3BpY190aHJlc2hvbGQiLCJ3b3JkX3RocmVzaG9sZCIsInZpc0RhdGEiLCJkb2NLZXkiLCJ0b3BpYyIsInRvcGljU2NvcmUiLCJ3b3JkIiwid29yZFNjb3JlIiwiaW5kZXhPZiIsIlZ1ZSIsImVsIiwibWVzc2FnZSIsIm5vbmVTZWxlY3RlZCIsInNlbGVjdGVkUGFnZSIsInBsYXllckRldGFpbCIsIm92ZXJ2aWV3RmlsdGVycyIsIm5ld0RvY3MiLCJzZWxlY3RlZE1hcCIsImxvYWRpbmciLCJmYWlsdXJlIiwibmV3RG9jIiwibmV3RG9jc1Byb2NjZXNzZWQiLCJzaG93UHJvY2Vzc2VkIiwic2VsZWN0ZWRNZXRob2QiLCJsZGFUb3BpY1RocmVzaG9sZCIsIndvcmQyVmVjVGhyZXNob2xkIiwibWV0aG9kcyIsInNlbGVjdFBhZ2UiLCJhZGROZXdEb2MiLCJ0cmltIiwicHJvY2Vzc0RvY3MiLCJzZWxmIiwic2F2ZUNoYW5nZXMiLCJlcnJvclN0YXR1cyIsIm1vdW50ZWQiLCJ3ZWlnaHQiLCJjcmVhdGVXb3JkQ2xvdWQiLCJyb3RhdGlvbiIsImZyb20iLCJ0byIsIm9yaWVudGF0aW9ucyJdLCJtYXBwaW5ncyI6Ijs7OztBQUFBQSxLQUFLLENBQUNDLFNBQU4sQ0FBZ0JDLFFBQWhCLEdBQTJCLFVBQVNDLENBQVQsRUFBWTtBQUNuQyxPQUFJLElBQUlDLENBQUMsR0FBRyxDQUFaLEVBQWVBLENBQUMsR0FBRyxLQUFLQyxNQUF4QixFQUFnQ0QsQ0FBQyxFQUFqQyxFQUFxQztBQUNqQyxRQUFHLEtBQUtBLENBQUwsTUFBWUQsQ0FBZixF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WUFBRCxDQUFKLENBQW1CcUssS0FBbkIsRUFBMEJFLElBQTFCLENBQWI7O0FBQ0E3VCxNQUFBQSxLQUFJLENBQUNGLElBQUwsQ0FBVTtBQUNOK0UsUUFBQUEsSUFBSSxFQUFFZ1AsSUFEQTtBQUVONkIsUUFBQUEsTUFBTSxFQUFFQTtBQUZGLE9BQVY7QUFJSDs7QUFDRDNOLElBQUFBLENBQUMsQ0FBQyxZQUFELENBQUQsQ0FBZ0I1RSxNQUFoQixDQUF1QixxRUFBbUV3USxLQUFuRSxHQUF5RSx1Q0FBaEc7QUFDQWdDLElBQUFBLGVBQWUsQ0FBQyxVQUFRaEMsS0FBVCxFQUFnQjNULEtBQWhCLEVBQXNCLFdBQVMyVCxLQUEvQixDQUFmO0FBQ0g7QUFDSjs7QUFFRCxTQUFTZ0MsZUFBVCxDQUF5Qm5SLEVBQXpCLEVBQTZCeEUsSUFBN0IsRUFBbUNvTSxLQUFuQyxFQUF5QztBQUNyQ0wsRUFBQUEsVUFBVSxDQUFDQyxLQUFYLENBQWlCeEgsRUFBakIsRUFBcUI7QUFDakI4SCxJQUFBQSxNQUFNLEVBQUUsQ0FBQztBQUNMeEcsTUFBQUEsSUFBSSxFQUFFLFdBREQ7QUFFTDlGLE1BQUFBLElBQUksRUFBRUEsSUFGRDtBQUdMNFYsTUFBQUEsUUFBUSxFQUFFO0FBQ05DLFFBQUFBLElBQUksRUFBRSxDQURBO0FBRU5DLFFBQUFBLEVBQUUsRUFBRSxDQUZFO0FBR05DLFFBQUFBLFlBQVksRUFBRTtBQUhSLE9BSEw7QUFRTGxSLE1BQUFBLElBQUksRUFBRTtBQVJELEtBQUQsQ0FEUztBQVdqQnVILElBQUFBLEtBQUssRUFBRTtBQUNIL0ksTUFBQUEsSUFBSSxFQUFFK0k7QUFESDtBQVhVLEdBQXJCO0FBZUgiLCJmaWxlIjoiYXBwLmpzIiwic291cmNlc0NvbnRlbnQiOlsiQXJyYXkucHJvdG90eXBlLmNvbnRhaW5zID0gZnVuY3Rpb24odikge1xyXG4gICAgZm9yKHZhciBpID0gMDsgaSA8IHRoaXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICBpZih0aGlzW2ldID09PSB2KSByZXR1cm4gdHJ1ZTtcclxuICAgIH1cclxuICAgIHJldHVybiBmYWxzZTtcclxufTtcclxuXHJcbkFycmF5LnByb3RvdHlwZS51bmlxdWUgPSBmdW5jdGlvbigpIHtcclxuICAgIHZhciBhcnIgPSBbXTtcclxuICAgIGZvcih2YXIgaSA9IDA7IGkgPCB0aGlzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgaWYoIWFyci5pbmNsdWRlcyh0aGlzW2ldKSkge1xyXG4gICAgICAgICAgICBhcnIucHVzaCh0aGlzW2ldKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gYXJyOyBcclxufVxyXG5cclxuZnVuY3Rpb24gcmVuZGVyQ2x1c3RlckZvcmNlTGF5b3V0KGRhdGEpe1xyXG5cdHZhciBkYXRhVmFsID0gZGF0YVtcInRvcGljX3dvcmRcIl07XHJcblx0dmFyIGZpbmFsX2RpY3QgPSB7fTtcclxuXHRmb3IgKHZhciBrZXkgaW4gZGF0YVZhbCkge1xyXG5cdCAgICBpZiAoZGF0YVZhbC5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XHJcblxyXG5cdCAgICBcdHZhciBjaGlsZHJlbldvcmRzID0gZGF0YVZhbFtrZXldO1xyXG5cclxuXHQgICAgXHRmb3IodmFyIGNoaWxkS2V5IGluIGNoaWxkcmVuV29yZHMpe1xyXG5cclxuXHQgICAgXHRcdGlmIChjaGlsZHJlbldvcmRzLmhhc093blByb3BlcnR5KGNoaWxkS2V5KSAmJiBjaGlsZHJlbldvcmRzW2NoaWxkS2V5XSA+IHdpbmRvdy52dWVBcHAucGFyYW1zLndvcmRUaHJlc2hvbGQpIHtcclxuXHJcblx0ICAgIFx0XHRcdGlmKCEoY2hpbGRLZXkgaW4gZmluYWxfZGljdCkpe1xyXG5cdCAgICBcdFx0XHRcdGZpbmFsX2RpY3RbY2hpbGRLZXldID0gW107XHJcblx0ICAgIFx0XHRcdH1cclxuICAgIFx0XHRcdFx0ZmluYWxfZGljdFtjaGlsZEtleV0ucHVzaChrZXkpO1xyXG5cdCAgICBcdFx0XHRcclxuXHQgICAgXHRcdH1cclxuXHQgICAgXHR9IFxyXG5cdCAgICB9XHJcbiAgXHR9XHJcbiAgXHR2YXIgY2x1c3Rlcl9kYXRhID0ge1xyXG4gIFx0XHRcIm5hbWVcIjpcIlwiLFxyXG4gIFx0XHRcImNoaWxkcmVuXCI6W11cclxuICBcdH1cclxuXHJcbiAgXHR2YXIgY291bnQ9MDtcclxuICBcdGZvcih2YXIga2V5IGluIGZpbmFsX2RpY3Qpe1xyXG4gIFx0XHRpZiAoZmluYWxfZGljdC5oYXNPd25Qcm9wZXJ0eShrZXkpICYmIChkYXRhW1wib3ZlcmFsbF93b3JkXCJdW2tleV0gJiYgZGF0YVtcIm92ZXJhbGxfd29yZFwiXVtrZXldID4gd2luZG93LnZ1ZUFwcC5wYXJhbXMud29yZE92ZXJhbGxUaHJlc2hvbGQpKSB7XHJcbiAgXHRcdFx0Y291bnQgPSBjb3VudCArIDE7XHJcbiAgXHRcdFx0dmFyIGhhc2ggPSB7fTtcclxuICBcdFx0XHRoYXNoW1wib3JkZXJcIl0gPSBjb3VudDtcclxuICBcdFx0XHRoYXNoW1wiYWxpYXNcIl0gPSBcIldoaXRlL3JlZC9qYWNrIHBpbmVcIjtcclxuICBcdFx0XHRoYXNoW1wiY29sb3JcIl0gPSBcIiNDN0VBRkJcIjtcclxuICBcdFx0XHRoYXNoW1wibmFtZVwiXSA9IGtleTtcclxuXHJcblxyXG4gIFx0XHRcdHZhciBhcnJheV9jaGlsZCA9IGZpbmFsX2RpY3Rba2V5XS51bmlxdWUoKTtcclxuICBcdFx0XHR2YXIgY2hpbGRzID1bXTtcclxuICBcdFx0XHRmb3IodmFyIGk9MDsgaSA8IGFycmF5X2NoaWxkLmxlbmd0aDtpKyspe1xyXG4gIFx0XHRcdFx0dmFyIGNoaWxkX2hhc2ggPSB7fTtcclxuICBcdFx0XHRcdGNoaWxkX2hhc2hbXCJvcmRlclwiXSA9IGkrMTtcclxuICBcdFx0XHRcdGNoaWxkX2hhc2hbXCJhbGlhc1wiXSA9IGkrMSArIFwiXCI7XHJcbiAgXHRcdFx0XHRjaGlsZF9oYXNoW1wiY29sb3JcIl0gPSBcIiNDN0VBRkJcIjtcclxuICBcdFx0XHRcdGNoaWxkX2hhc2hbXCJuYW1lXCJdPSBhcnJheV9jaGlsZFtpXTtcclxuICBcdFx0XHRcdGNoaWxkcy5wdXNoKGNoaWxkX2hhc2gpO1xyXG4gIFx0XHRcdH1cclxuICBcdFx0XHRoYXNoW1wiY2hpbGRyZW5cIl0gPSBjaGlsZHM7XHJcbiAgXHRcdFx0Y2x1c3Rlcl9kYXRhLmNoaWxkcmVuLnB1c2goaGFzaCk7XHJcbiAgXHRcdH1cclxuICBcdH1cclxuICBcdHZhciBkMyA9ICAgd2luZG93LmQzVjM7XHJcbiAgXHRyZW5kZXJDbHVzdGVyKGNsdXN0ZXJfZGF0YSwgZDMpO1xyXG59XHJcblxyXG5mdW5jdGlvbiByZW5kZXJDbHVzdGVyKGNsdXN0ZXJfZGF0YSwgZDMpe1xyXG4gIHZhciByYWRpdXMgPSAyMDA7XHJcbiAgdmFyIGRlbmRvZ3JhbUNvbnRhaW5lciA9IFwic3BlY2llc2NvbGxhcHNpYmxlXCI7XHJcblxyXG5cclxuICB2YXIgcm9vdE5vZGVTaXplID0gNjtcclxuICB2YXIgbGV2ZWxPbmVOb2RlU2l6ZSA9IDM7XHJcbiAgdmFyIGxldmVsVHdvTm9kZVNpemUgPSAzO1xyXG4gIHZhciBsZXZlbFRocmVlTm9kZVNpemUgPSAyO1xyXG5cclxuXHJcbiAgdmFyIGkgPSAwO1xyXG4gIHZhciBkdXJhdGlvbiA9IDMwMDsgLy9DaGFuZ2luZyB2YWx1ZSBkb2Vzbid0IHNlZW0gYW55IGNoYW5nZXMgaW4gdGhlIGR1cmF0aW9uID8/XHJcblxyXG4gIHZhciByb290SnNvbkRhdGE7XHJcblxyXG4gIHZhciBjbHVzdGVyID0gZDMubGF5b3V0LmNsdXN0ZXIoKVxyXG4gICAgICAuc2l6ZShbMzYwLHJhZGl1cyAtIDEyMF0pXHJcbiAgICAgIC5zZXBhcmF0aW9uKGZ1bmN0aW9uKGEsIGIpIHtcclxuICAgICAgICByZXR1cm4gKGEucGFyZW50ID09IGIucGFyZW50ID8gMSA6IDIpIC8gYS5kZXB0aDtcclxuICAgICAgfSk7XHJcblxyXG4gIHZhciBkaWFnb25hbCA9IGQzLnN2Zy5kaWFnb25hbC5yYWRpYWwoKVxyXG4gICAgICAucHJvamVjdGlvbihmdW5jdGlvbihkKSB7IHJldHVybiBbZC55LCBkLnggLyAxODAgKiBNYXRoLlBJXTsgfSk7XHJcblxyXG4gIHZhciBjb250YWluZXJEaXYgPSBkMy5zZWxlY3QoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoZGVuZG9ncmFtQ29udGFpbmVyKSk7XHJcblxyXG4gIGNvbnRhaW5lckRpdi5hcHBlbmQoXCJidXR0b25cIilcclxuICAgICAgLmF0dHIoXCJpZFwiLFwiY29sbGFwc2UtYnV0dG9uXCIpXHJcbiAgICAgIC50ZXh0KFwiQ29sbGFwc2UhXCIpXHJcbiAgICAgIC5vbihcImNsaWNrXCIsY29sbGFwc2VMZXZlbHMpO1xyXG5cclxuICB2YXIgc3ZnUm9vdCA9IGNvbnRhaW5lckRpdi5hcHBlbmQoXCJzdmc6c3ZnXCIpXHJcbiAgICAgIC5hdHRyKFwid2lkdGhcIiwgXCIxMDAlXCIpXHJcbiAgICAgIC5hdHRyKFwiaGVpZ2h0XCIsIFwiMTAwJVwiKVxyXG4gICAgICAuYXR0cihcInZpZXdCb3hcIiwgXCItXCIgKyAocmFkaXVzKSArIFwiIC1cIiArIChyYWRpdXMgLSA1MCkgK1wiIFwiKyByYWRpdXMqMiArXCIgXCIrIHJhZGl1cyoyKVxyXG4gICAgICAuY2FsbChkMy5iZWhhdmlvci56b29tKCkuc2NhbGUoMC45KS5zY2FsZUV4dGVudChbMC4xLCAzXSkub24oXCJ6b29tXCIsIHpvb20pKS5vbihcImRibGNsaWNrLnpvb21cIiwgbnVsbClcclxuICAgICAgLmFwcGVuZChcInN2ZzpnXCIpO1xyXG5cclxuICAvLyBBZGQgdGhlIGNsaXBwaW5nIHBhdGhcclxuICBzdmdSb290LmFwcGVuZChcInN2ZzpjbGlwUGF0aFwiKS5hdHRyKFwiaWRcIiwgXCJjbGlwcGVyLXBhdGhcIilcclxuICAgICAgLmFwcGVuZChcInN2ZzpyZWN0XCIpXHJcbiAgICAgIC5hdHRyKCdpZCcsICdjbGlwLXJlY3QtYW5pbScpO1xyXG5cclxuICB2YXIgYW5pbUdyb3VwID0gc3ZnUm9vdC5hcHBlbmQoXCJzdmc6Z1wiKVxyXG4gICAgICAuYXR0cihcImNsaXAtcGF0aFwiLCBcInVybCgjY2xpcHBlci1wYXRoKVwiKTtcclxuXHJcbiAgXHRyb290SnNvbkRhdGEgPSBjbHVzdGVyX2RhdGE7XHJcblxyXG4gICAgLy9TdGFydCB3aXRoIGFsbCBjaGlsZHJlbiBjb2xsYXBzZWRcclxuICAgIHJvb3RKc29uRGF0YS5jaGlsZHJlbi5mb3JFYWNoKGNvbGxhcHNlKTtcclxuXHJcbiAgICAvL0luaXRpYWxpemUgdGhlIGRlbmRyb2dyYW1cclxuICBcdGNyZWF0ZUNvbGxhcHNpYmxlRGVuZHJvR3JhbShyb290SnNvbkRhdGEpO1xyXG5cclxuXHJcblxyXG5cclxuICBmdW5jdGlvbiBjcmVhdGVDb2xsYXBzaWJsZURlbmRyb0dyYW0oc291cmNlKSB7XHJcblxyXG4gICAgLy8gQ29tcHV0ZSB0aGUgbmV3IHRyZWUgbGF5b3V0LlxyXG4gICAgdmFyIG5vZGVzID0gY2x1c3Rlci5ub2Rlcyhyb290SnNvbkRhdGEpO1xyXG4gICAgdmFyIHBhdGhsaW5rcyA9IGNsdXN0ZXIubGlua3Mobm9kZXMpO1xyXG5cclxuICAgIC8vIE5vcm1hbGl6ZSBmb3Igbm9kZXMnIGZpeGVkLWRlcHRoLlxyXG4gICAgbm9kZXMuZm9yRWFjaChmdW5jdGlvbihkKSB7XHJcbiAgICAgIGlmKGQuZGVwdGggPD0yKXtcclxuICAgICAgICBkLnkgPSBkLmRlcHRoKjcwO1xyXG4gICAgICB9ZWxzZVxyXG4gICAgICB7XHJcbiAgICAgICAgZC55ID0gZC5kZXB0aCoxMDA7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIC8vIFVwZGF0ZSB0aGUgbm9kZXPigKZcclxuICAgIHZhciBub2RlID0gc3ZnUm9vdC5zZWxlY3RBbGwoXCJnLm5vZGVcIilcclxuICAgICAgICAuZGF0YShub2RlcywgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5pZCB8fCAoZC5pZCA9ICsraSk7IH0pO1xyXG5cclxuICAgIC8vIEVudGVyIGFueSBuZXcgbm9kZXMgYXQgdGhlIHBhcmVudCdzIHByZXZpb3VzIHBvc2l0aW9uLlxyXG4gICAgdmFyIG5vZGVFbnRlciA9IG5vZGUuZW50ZXIoKS5hcHBlbmQoXCJnXCIpXHJcbiAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcIm5vZGVcIilcclxuICAgICAgICAub24oXCJjbGlja1wiLCB0b2dnbGVDaGlsZHJlbik7XHJcblxyXG4gICAgbm9kZUVudGVyLmFwcGVuZChcImNpcmNsZVwiKTtcclxuXHJcbiAgICBub2RlRW50ZXIuYXBwZW5kKFwidGV4dFwiKVxyXG4gICAgLmF0dHIoXCJ4XCIsIDEwKVxyXG4gICAgLmF0dHIoXCJkeVwiLCBcIi4zNWVtXCIpXHJcbiAgICAuYXR0cihcInRleHQtYW5jaG9yXCIsIFwic3RhcnRcIilcclxuICAgIC50ZXh0KGZ1bmN0aW9uKGQpIHtcclxuICAgICAgICAgIGlmKGQuZGVwdGggPT09IDIpe1xyXG4gICAgICAgICAgICByZXR1cm4gZC5hbGlhcztcclxuICAgICAgICAgIH1cclxuICAgICAgICAgcmV0dXJuIGQubmFtZTtcclxuICAgIH0pO1xyXG5cclxuXHJcbiAgICAvLyBUcmFuc2l0aW9uIG5vZGVzIHRvIHRoZWlyIG5ldyBwb3NpdGlvbi5cclxuICAgIHZhciBub2RlVXBkYXRlID0gbm9kZS50cmFuc2l0aW9uKClcclxuICAgICAgICAuZHVyYXRpb24oZHVyYXRpb24pXHJcbiAgICAgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4gXCJyb3RhdGUoXCIgKyAoZC54IC0gOTApICsgXCIpdHJhbnNsYXRlKFwiICsgZC55ICsgXCIpXCI7IH0pXHJcblxyXG4gICAgbm9kZVVwZGF0ZS5zZWxlY3QoXCJjaXJjbGVcIilcclxuICAgICAgICAuYXR0cihcInJcIiwgZnVuY3Rpb24oZCl7XHJcbiAgICAgICAgICAgIGlmIChkLmRlcHRoID09IDApIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiByb290Tm9kZVNpemU7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIGVsc2UgaWYgKGQuZGVwdGggPT09IDEpIHtcclxuICAgICAgICAgICAgICAgICAgcmV0dXJuIGxldmVsT25lTm9kZVNpemU7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIGVsc2UgaWYgKGQuZGVwdGggPT09IDIpIHtcclxuICAgICAgICAgICAgICAgICAgcmV0dXJuIGxldmVsVHdvTm9kZVNpemU7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICByZXR1cm4gbGV2ZWxUaHJlZU5vZGVTaXplO1xyXG5cclxuICAgICAgICB9KVxyXG4gICAgICAgIC5zdHlsZShcImZpbGxcIiwgZnVuY3Rpb24oZCkge1xyXG4gICAgICAgICAgICAgICBpZihkLmRlcHRoID09PTApe1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIFwiIzgwODA4MFwiO1xyXG4gICAgICAgICAgICAgICB9ZWxzZSBpZihkLmRlcHRoID09PSAxKXtcclxuICAgICAgICAgICAgICAgIGlmKGQubmFtZT09XCJIYXJkd29vZHNcIikgcmV0dXJuIFwiIzgxNjg1NFwiO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIFwiI0MzQjlBMFwiO1xyXG4gICAgICAgICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgICAgIHJldHVybiBkLmNvbG9yO1xyXG4gICAgICAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuICAgICAgICAuc3R5bGUoXCJzdHJva2VcIixmdW5jdGlvbihkKXtcclxuICAgICAgICAgICAgICBpZihkLmRlcHRoPjEpe1xyXG4gICAgICAgICAgICAgICAgICByZXR1cm4gXCJ3aGl0ZVwiO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICBlbHNle1xyXG4gICAgICAgICAgICAgICAgICByZXR1cm4gXCJsaWdodGdyYXlcIjtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgbm9kZVVwZGF0ZS5zZWxlY3QoXCJ0ZXh0XCIpXHJcblxyXG4gICAgICAgIC5hdHRyKCdpZCcsIGZ1bmN0aW9uKGQpe1xyXG4gICAgICAgICAgdmFyIG9yZGVyID0gMDtcclxuICAgICAgICAgIGlmKGQub3JkZXIpb3JkZXIgPSBkLm9yZGVyO1xyXG4gICAgICAgICAgcmV0dXJuICdULScgKyBkLmRlcHRoICsgXCItXCIgKyBvcmRlcjtcclxuICAgICAgICB9KVxyXG4gICAgICAgIC5hdHRyKFwidGV4dC1hbmNob3JcIiwgZnVuY3Rpb24gKGQpIHtcclxuICAgICAgICAgICAgaWYgKGQuZGVwdGggPT09IDEpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBkLnggPCAxODAgPyBcImVuZFwiIDogXCJzdGFydFwiO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBkLnggPCAxODAgPyBcInN0YXJ0XCIgOiBcImVuZFwiO1xyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLmF0dHIoXCJkeVwiLCBmdW5jdGlvbihkKXtcclxuICAgICAgICAgICAgaWYgKGQuZGVwdGggPT09IDEpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBkLnggPCAxODAgPyBcIjEuNGVtXCIgOiBcIi0wLjJlbVwiO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBcIi4zMWVtXCI7XHJcbiAgICAgICAgfSlcclxuICAgICAgICAuYXR0cihcImR4XCIsIGZ1bmN0aW9uIChkKSB7XHJcbiAgICAgICAgICAgIGlmIChkLmRlcHRoID09PSAxKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gMDsgLy9yZXR1cm4gZC54ID4gMTgwID8gMiA6IC0yO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBkLnggPCAxODAgPyAxIDogLTIwO1xyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgZnVuY3Rpb24gKGQpIHtcclxuICAgICAgICAgICAgaWYgKGQuZGVwdGggPCAyKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gXCJyb3RhdGUoXCIgKyAoOTAgLSBkLngpICsgXCIpXCI7XHJcbiAgICAgICAgICAgIH1lbHNlIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBkLnggPCAxODAgPyBudWxsIDogXCJyb3RhdGUoMTgwKVwiO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgLy8gVE9ETzogYXBwcm9wcmlhdGUgdHJhbnNmb3JtXHJcbiAgICB2YXIgbm9kZUV4aXQgPSBub2RlLmV4aXQoKS50cmFuc2l0aW9uKClcclxuICAgICAgICAuZHVyYXRpb24oZHVyYXRpb24pXHJcbiAgICAgICAgLnJlbW92ZSgpO1xyXG5cclxuICAgIC8vIFVwZGF0ZSB0aGUgbGlua3PigKZcclxuICAgIHZhciBsaW5rID0gc3ZnUm9vdC5zZWxlY3RBbGwoXCJwYXRoLmxpbmtcIilcclxuICAgICAgICAuZGF0YShwYXRobGlua3MsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQudGFyZ2V0LmlkOyB9KTtcclxuXHJcbiAgICAvLyBFbnRlciBhbnkgbmV3IGxpbmtzIGF0IHRoZSBwYXJlbnQncyBwcmV2aW91cyBwb3NpdGlvbi5cclxuICAgIGxpbmsuZW50ZXIoKS5pbnNlcnQoXCJwYXRoXCIsIFwiZ1wiKVxyXG4gICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJsaW5rXCIpXHJcbiAgICAgICAgLmF0dHIoXCJkXCIsIGZ1bmN0aW9uKGQpIHtcclxuICAgICAgICAgIHZhciBvID0ge3g6IHNvdXJjZS54MCwgeTogc291cmNlLnkwfTtcclxuICAgICAgICAgIHJldHVybiBkaWFnb25hbCh7c291cmNlOiBvLCB0YXJnZXQ6IG99KTtcclxuICAgICAgICB9KVxyXG4gICAgICAgIC5zdHlsZShcImZpbGxcIixmdW5jdGlvbihkKXtcclxuICAgICAgICAgIHJldHVybiBkLmNvbG9yO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgIC8vIFRyYW5zaXRpb24gbGlua3MgdG8gdGhlaXIgbmV3IHBvc2l0aW9uLlxyXG4gICAgbGluay50cmFuc2l0aW9uKClcclxuICAgICAgICAuZHVyYXRpb24oZHVyYXRpb24pXHJcbiAgICAgICAgLmF0dHIoXCJkXCIsIGRpYWdvbmFsKTtcclxuXHJcbiAgICAvLyBUcmFuc2l0aW9uIGV4aXRpbmcgbm9kZXMgdG8gdGhlIHBhcmVudCdzIG5ldyBwb3NpdGlvbi5cclxuICAgIGxpbmsuZXhpdCgpLnRyYW5zaXRpb24oKVxyXG4gICAgICAgIC5kdXJhdGlvbihkdXJhdGlvbilcclxuICAgICAgICAuYXR0cihcImRcIiwgZnVuY3Rpb24oZCkge1xyXG4gICAgICAgICAgdmFyIG8gPSB7eDogc291cmNlLngsIHk6IHNvdXJjZS55fTtcclxuICAgICAgICAgIHJldHVybiBkaWFnb25hbCh7c291cmNlOiBvLCB0YXJnZXQ6IG99KTtcclxuICAgICAgICB9KVxyXG4gICAgICAgIC5yZW1vdmUoKTtcclxuICB9XHJcblxyXG4gIC8vIFRvZ2dsZSBjaGlsZHJlbiBvbiBjbGljay5cclxuICBmdW5jdGlvbiB0b2dnbGVDaGlsZHJlbihkLGNsaWNrVHlwZSkge1xyXG4gICAgaWYgKGQuY2hpbGRyZW4pIHtcclxuICAgICAgZC5fY2hpbGRyZW4gPSBkLmNoaWxkcmVuO1xyXG4gICAgICBkLmNoaWxkcmVuID0gbnVsbDtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGQuY2hpbGRyZW4gPSBkLl9jaGlsZHJlbjtcclxuICAgICAgZC5fY2hpbGRyZW4gPSBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciB0eXBlID0gdHlwZW9mIGNsaWNrVHlwZSA9PSB1bmRlZmluZWQgPyBcIm5vZGVcIiA6IGNsaWNrVHlwZTtcclxuXHJcbiAgICAvL0FjdGl2aXRpZXMgb24gbm9kZSBjbGlja1xyXG4gICAgY3JlYXRlQ29sbGFwc2libGVEZW5kcm9HcmFtKGQpO1xyXG4gICAgaGlnaGxpZ2h0Tm9kZVNlbGVjdGlvbnMoZCk7XHJcblxyXG4gICAgaGlnaGxpZ2h0Um9vdFRvTm9kZVBhdGgoZCx0eXBlKTtcclxuXHJcbiAgfVxyXG5cclxuICAvLyBDb2xsYXBzZSBub2Rlc1xyXG4gIGZ1bmN0aW9uIGNvbGxhcHNlKGQpIHtcclxuICAgIGlmIChkLmNoaWxkcmVuKSB7XHJcbiAgICAgICAgZC5fY2hpbGRyZW4gPSBkLmNoaWxkcmVuO1xyXG4gICAgICAgIGQuX2NoaWxkcmVuLmZvckVhY2goY29sbGFwc2UpO1xyXG4gICAgICAgIGQuY2hpbGRyZW4gPSBudWxsO1xyXG4gICAgICB9XHJcbiAgfVxyXG5cclxuXHJcbiAgLy8gaGlnaGxpZ2h0cyBzdWJub2RlcyBvZiBhIG5vZGVcclxuICBmdW5jdGlvbiBoaWdobGlnaHROb2RlU2VsZWN0aW9ucyhkKSB7XHJcbiAgICAgIHZhciBoaWdobGlnaHRMaW5rQ29sb3IgPSBcImRhcmtzbGF0ZWdyYXlcIjsvL1wiI2YwM2IyMFwiO1xyXG4gICAgICB2YXIgZGVmYXVsdExpbmtDb2xvciA9IFwibGlnaHRncmF5XCI7XHJcblxyXG4gICAgICB2YXIgZGVwdGggPSAgZC5kZXB0aDtcclxuICAgICAgdmFyIG5vZGVDb2xvciA9IGQuY29sb3I7XHJcbiAgICAgIGlmIChkZXB0aCA9PT0gMSkge1xyXG4gICAgICAgICAgbm9kZUNvbG9yID0gaGlnaGxpZ2h0TGlua0NvbG9yO1xyXG4gICAgICB9XHJcblxyXG4gICAgICB2YXIgcGF0aExpbmtzID0gc3ZnUm9vdC5zZWxlY3RBbGwoXCJwYXRoLmxpbmtcIik7XHJcblxyXG4gICAgICBwYXRoTGlua3Muc3R5bGUoXCJzdHJva2VcIixmdW5jdGlvbihkZCkge1xyXG4gICAgICAgICAgaWYgKGRkLnNvdXJjZS5kZXB0aCA9PT0gMCkge1xyXG4gICAgICAgICAgICAgIGlmIChkLm5hbWUgPT09ICcnKSB7XHJcbiAgICAgICAgICAgICAgICAgIHJldHVybiBoaWdobGlnaHRMaW5rQ29sb3I7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIHJldHVybiBkZWZhdWx0TGlua0NvbG9yO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIGlmIChkZC5zb3VyY2UubmFtZSA9PT0gZC5uYW1lKSB7XHJcbiAgICAgICAgICAgICAgcmV0dXJuIG5vZGVDb2xvcjtcclxuICAgICAgICAgIH1lbHNlIHtcclxuICAgICAgICAgICAgICByZXR1cm4gZGVmYXVsdExpbmtDb2xvcjtcclxuICAgICAgICAgIH1cclxuICAgICAgfSk7XHJcbiAgfVxyXG5cclxuICAvL1dhbGtpbmcgcGFyZW50cycgY2hhaW4gZm9yIHJvb3QgdG8gbm9kZSB0cmFja2luZ1xyXG4gIGZ1bmN0aW9uIGhpZ2hsaWdodFJvb3RUb05vZGVQYXRoKGQsY2xpY2tUeXBlKXtcclxuICAgIHZhciBhbmNlc3RvcnMgPSBbXTtcclxuICAgIHZhciBwYXJlbnQgPSBkO1xyXG4gICAgd2hpbGUgKCFfLmlzVW5kZWZpbmVkKHBhcmVudCkpIHtcclxuICAgICAgICBhbmNlc3RvcnMucHVzaChwYXJlbnQpO1xyXG4gICAgICAgIHBhcmVudCA9IHBhcmVudC5wYXJlbnQ7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gR2V0IHRoZSBtYXRjaGVkIGxpbmtzXHJcbiAgICB2YXIgbWF0Y2hlZExpbmtzID0gW107XHJcblxyXG4gICAgc3ZnUm9vdC5zZWxlY3RBbGwoJ3BhdGgubGluaycpXHJcbiAgICAgICAgLmZpbHRlcihmdW5jdGlvbihkLCBpKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcmV0dXJuIF8uYW55KGFuY2VzdG9ycywgZnVuY3Rpb24ocClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHAgPT09IGQudGFyZ2V0O1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgfSlcclxuICAgICAgICAuZWFjaChmdW5jdGlvbihkKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgbWF0Y2hlZExpbmtzLnB1c2goZCk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgYW5pbWF0ZUNoYWlucyhtYXRjaGVkTGlua3MsY2xpY2tUeXBlKTtcclxuXHJcbiAgICBmdW5jdGlvbiBhbmltYXRlQ2hhaW5zKGxpbmtzLGNsaWNrVHlwZSl7XHJcbiAgICAgIGFuaW1Hcm91cC5zZWxlY3RBbGwoXCJwYXRoLnNlbGVjdGVkXCIpXHJcbiAgICAgICAgICAuZGF0YShbXSlcclxuICAgICAgICAgIC5leGl0KCkucmVtb3ZlKCk7XHJcblxyXG4gICAgICBhbmltR3JvdXAuc2VsZWN0QWxsKFwicGF0aC5zZWxlY3RlZFwiKVxyXG4gICAgICAgICAgLmRhdGEobGlua3MpXHJcbiAgICAgICAgICAuZW50ZXIoKS5hcHBlbmQoXCJzdmc6cGF0aFwiKVxyXG4gICAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcInNlbGVjdGVkXCIpXHJcbiAgICAgICAgICAuYXR0cihcImRcIiwgZGlhZ29uYWwpO1xyXG5cclxuXHJcbiAgICAgIC8vUmVzZXQgcGF0aCBoaWdobGlnaHQgaWYgY29sbGFwc2UgYnV0dG9uIGNsaWNrZWRcclxuICAgICAgaWYoY2xpY2tUeXBlID09ICdidXR0b24nKXtcclxuICAgICAgICBhbmltR3JvdXAuc2VsZWN0QWxsKFwicGF0aC5zZWxlY3RlZFwiKS5jbGFzc2VkKCdyZXNldC1zZWxlY3RlZCcsdHJ1ZSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHZhciBvdmVybGF5Qm94ID0gc3ZnUm9vdC5ub2RlKCkuZ2V0QkJveCgpO1xyXG5cclxuICAgICAgc3ZnUm9vdC5zZWxlY3QoXCIjY2xpcC1yZWN0LWFuaW1cIilcclxuICAgICAgICAgIC5hdHRyKFwieFwiLCAtcmFkaXVzKVxyXG4gICAgICAgICAgLmF0dHIoXCJ5XCIsIC1yYWRpdXMpXHJcbiAgICAgICAgICAuYXR0cihcIndpZHRoXCIsMClcclxuICAgICAgICAgIC5hdHRyKFwiaGVpZ2h0XCIscmFkaXVzKjIpXHJcbiAgICAgICAgICAudHJhbnNpdGlvbigpLmR1cmF0aW9uKGR1cmF0aW9uKVxyXG4gICAgICAgICAgLmF0dHIoXCJ3aWR0aFwiLCByYWRpdXMqMik7XHJcbiAgICB9XHJcblxyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gem9vbSgpIHtcclxuICAgICBzdmdSb290LmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoXCIgKyBkMy5ldmVudC50cmFuc2xhdGUgKyBcIilzY2FsZShcIiArIGQzLmV2ZW50LnNjYWxlICsgXCIpXCIpO1xyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gY29sbGFwc2VMZXZlbHMoKXtcclxuXHJcbiAgICBpZihjaGVja0ZvclRoaXJkTGV2ZWxPcGVuQ2hpbGRyZW4oKSl7XHJcbiAgICAgIHRvZ2dsZUFsbFNlY29uZExldmVsQ2hpbGRyZW4oKTtcclxuICAgIH1lbHNle1xyXG4gICAgIHRvZ2dsZVNlY29uZExldmVsQ2hpbGRyZW4oKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBPcGVuIGZpcnN0IGxldmVsIG9ubHkgYnkgY29sbGFwc2luZyBzZWNvbmQgbGV2ZWxcclxuICAgIGZ1bmN0aW9uIHRvZ2dsZVNlY29uZExldmVsQ2hpbGRyZW4oKXtcclxuICAgICAgZm9yKHZhciByb290SW5kZXggPSAwLCByb290TGVuZ3RoID0gcm9vdEpzb25EYXRhLmNoaWxkcmVuLmxlbmd0aDsgcm9vdEluZGV4PHJvb3RMZW5ndGg7IHJvb3RJbmRleCsrKXtcclxuICAgICAgICAgIGlmKGlzTm9kZU9wZW4ocm9vdEpzb25EYXRhLmNoaWxkcmVuW3Jvb3RJbmRleF0pKXtcclxuICAgICAgICAgICAgICAgdG9nZ2xlQ2hpbGRyZW4ocm9vdEpzb25EYXRhLmNoaWxkcmVuW3Jvb3RJbmRleF0sJ2J1dHRvbicpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gT3BlbiBmaXJzdCBsZXZlbCBvbmx5IGJ5IGNvbGxhcHNpbmcgc2Vjb25kIGxldmVsXHJcbiAgICBmdW5jdGlvbiB0b2dnbGVBbGxTZWNvbmRMZXZlbENoaWxkcmVuKCl7XHJcbiAgICAgIGZvcih2YXIgcm9vdEluZGV4ID0gMCwgcm9vdExlbmd0aCA9IHJvb3RKc29uRGF0YS5jaGlsZHJlbi5sZW5ndGg7IHJvb3RJbmRleDxyb290TGVuZ3RoOyByb290SW5kZXgrKyl7XHJcbiAgICAgICAgaWYoaXNOb2RlT3Blbihyb290SnNvbkRhdGEuY2hpbGRyZW5bcm9vdEluZGV4XSkpe1xyXG5cclxuICAgICAgICAgIGZvcih2YXIgY2hpbGRJbmRleCA9IDAsIGNoaWxkTGVuZ3RoID0gcm9vdEpzb25EYXRhLmNoaWxkcmVuW3Jvb3RJbmRleF0uY2hpbGRyZW4ubGVuZ3RoOyBjaGlsZEluZGV4PGNoaWxkTGVuZ3RoOyBjaGlsZEluZGV4Kyspe1xyXG4gICAgICAgICAgICB2YXIgc2Vjb25kTGV2ZWxDaGlsZCA9IHJvb3RKc29uRGF0YS5jaGlsZHJlbltyb290SW5kZXhdLmNoaWxkcmVuW2NoaWxkSW5kZXhdO1xyXG4gICAgICAgICAgICBpZihpc05vZGVPcGVuKHNlY29uZExldmVsQ2hpbGQpKXtcclxuICAgICAgICAgICAgICB0b2dnbGVDaGlsZHJlbihyb290SnNvbkRhdGEuY2hpbGRyZW5bcm9vdEluZGV4XS5jaGlsZHJlbltjaGlsZEluZGV4XSwnYnV0dG9uJyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIENoZWNrIGlmIGFueSBub2RlcyBvcGVucyBhdCBzZWNvbmQgbGV2ZWxcclxuICAgIGZ1bmN0aW9uIGNoZWNrRm9yVGhpcmRMZXZlbE9wZW5DaGlsZHJlbigpe1xyXG4gICAgICBmb3IodmFyIHJvb3RJbmRleCA9IDAsIHJvb3RMZW5ndGggPSByb290SnNvbkRhdGEuY2hpbGRyZW4ubGVuZ3RoOyByb290SW5kZXg8cm9vdExlbmd0aDsgcm9vdEluZGV4Kyspe1xyXG4gICAgICAgIGlmKGlzTm9kZU9wZW4ocm9vdEpzb25EYXRhLmNoaWxkcmVuW3Jvb3RJbmRleF0pKXtcclxuXHJcbiAgICAgICAgICBmb3IodmFyIGNoaWxkSW5kZXggPSAwLCBjaGlsZExlbmd0aCA9IHJvb3RKc29uRGF0YS5jaGlsZHJlbltyb290SW5kZXhdLmNoaWxkcmVuLmxlbmd0aDsgY2hpbGRJbmRleDxjaGlsZExlbmd0aDsgY2hpbGRJbmRleCsrKXtcclxuXHJcbiAgICAgICAgICAgIHZhciBzZWNvbmRMZXZlbENoaWxkID0gcm9vdEpzb25EYXRhLmNoaWxkcmVuW3Jvb3RJbmRleF0uY2hpbGRyZW5bY2hpbGRJbmRleF07XHJcbiAgICAgICAgICAgIGlmKGlzTm9kZU9wZW4oc2Vjb25kTGV2ZWxDaGlsZCkpe1xyXG4gICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gaXNOb2RlT3BlbihkKXtcclxuICAgICAgaWYoZC5jaGlsZHJlbil7cmV0dXJuIHRydWU7fVxyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuXHJcblxyXG5cclxufVxyXG5cclxuICAiLCJmdW5jdGlvbiBsb2FkSnF1ZXJ5KCl7XHJcbiAgICAkKGRvY3VtZW50KS5yZWFkeShmdW5jdGlvbigpe1xyXG4gICAgICAgICQoXCIjdG9nZ2xlLXNpZGViYXJcIikuY2xpY2soZnVuY3Rpb24oKXtcclxuICAgICAgICAgICAgJCgnLnVpLnNpZGViYXInKVxyXG4gICAgICAgICAgICAgICAgLnNpZGViYXIoJ3RvZ2dsZScpXHJcbiAgICAgICAgICAgIDtcclxuICAgICAgICB9KTtcclxuICAgICAgICBcclxuICAgIH0pO1xyXG59XHJcbiIsInJlcXVpcmUuY29uZmlnKHtcclxuICAgIHBhdGhzOiB7XHJcbiAgICAgICAgXCJkM1wiOiBcImh0dHBzOi8vZDNqcy5vcmcvZDMudjMubWluXCJcclxuICAgIH1cclxufSk7XHJcblxyXG5mdW5jdGlvbiBsb2FkRDMoKXtcclxuXHJcbiAgICB3aW5kb3cuZDNPbGQgPSBkMztcclxuICAgIHJlcXVpcmUoWydkMyddLCBmdW5jdGlvbihkM1YzKSB7XHJcbiAgICAgICAgd2luZG93LmQzVjMgPSBkM1YzO1xyXG4gICAgICAgIHdpbmRvdy5kMyA9IGQzT2xkO1xyXG4gICAgICAgIC8vIHdpbmRvdy5kb2N1bWVudHMgPSBbXHJcbiAgICAgICAgLy8gICAgICAgICAvLyAgIFtcImlcIiwgXCJhbVwiLCBcImJhdG1hblwiLCBcIm9mXCIsIFwid2ludGVyZmFsbFwiXSxcclxuICAgICAgICAvLyAgICAgICAgIC8vICAgW1widGhlcmVcIiwgXCJzaG91bGRcIiwgXCJhbHdheXNcIiwgXCJiZVwiLCBcImFcIiwgXCJzdGFya1wiLCBcImluXCIsIFwid2ludGVyZmVsbFwiXSxcclxuICAgICAgICAvLyAgICAgICAgIC8vICAgW1wicHJvcGhlY3lcIiwgXCJzYXlzXCIsIFwicHJpbmNlXCIsIFwid2lsbFwiLCBcImJlXCIgLCBcInJlYm9yblwiXVxyXG4gICAgICAgIC8vICAgICAgICAgLy8gXTtcclxuICAgICAgICAvLyAgICAgd2luZG93LmRvY3VtZW50cyA9IFtbJ3Byb2plY3QnLCAnY2xhc3NpZmljYXRpb24nLCAnY29tcGFyZScsICduZXVyYWwnLCAnbmV0cycsICdTVk0nLCAnZHVlJywgJ2R1ZSddLCBbJ3R3bycsICduZXcnLCAncHJvZ3Jlc3MnLCAnY2hlY2tzJywgJ2ZpbmFsJywgJ3Byb2plY3QnLCAgJ2Fzc2lnbmVkJywgJ2ZvbGxvd3MnXSwgWydyZXBvcnQnLCAnZ3JhZGVkJywgICdjb250cmlidXRlJywgJ3BvaW50cycsICAndG90YWwnLCAnc2VtZXN0ZXInLCAnZ3JhZGUnXSwgWydwcm9ncmVzcycsICd1cGRhdGUnLCAnZXZhbHVhdGVkJywgJ1RBJywgJ3BlZXJzJ10sIFsnY2xhc3MnLCAnbWVldGluZycsICd0b21vcnJvdycsJ3RlYW1zJywgJ3dvcmsnLCAncHJvZ3Jlc3MnLCAncmVwb3J0JywgJ2ZpbmFsJywgJ3Byb2plY3QnXSwgWyAncXVpeicsICAnc2VjdGlvbnMnLCAncmVndWxhcml6YXRpb24nLCAnVHVlc2RheSddLCBbICdxdWl6JywgJ1RodXJzZGF5JywgJ2xvZ2lzdGljcycsICd3b3JrJywgJ29ubGluZScsICdzdHVkZW50JywgJ3Bvc3Rwb25lJywgICdxdWl6JywgJ1R1ZXNkYXknXSwgWydxdWl6JywgJ2NvdmVyJywgJ1RodXJzZGF5J10sIFsncXVpeicsICdjaGFwJywgJ2NoYXAnLCAnbGluZWFyJywgJ3JlZ3Jlc3Npb24nXV07XHJcbiAgICAgICAgd2luZG93LmRvY3VtZW50cyA9IFtcclxuICAgICAgICAgICAgWydzZXJpb3VzJyxcclxuICAgICAgICAgICAgICAgICAgICAgICd0YWxrJyxcclxuICAgICAgICAgICAgICAgICAgICAgICdmcmllbmRzJyxcclxuICAgICAgICAgICAgICAgICAgICAgICdmbGFreScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAnbGF0ZWx5JyxcclxuICAgICAgICAgICAgICAgICAgICAgICd1bmRlcnN0b29kJyxcclxuICAgICAgICAgICAgICAgICAgICAgICdnb29kJyxcclxuICAgICAgICAgICAgICAgICAgICAgICdldmVuaW5nJyxcclxuICAgICAgICAgICAgICAgICAgICAgICdoYW5naW5nJ10sXHJcbiAgICAgICAgICAgIFsnZ290JywgJ2dpZnQnLCAnZWxkZXInLCAnYnJvdGhlcicsICdyZWFsbHknLCAnc3VycHJpc2luZyddLFxyXG4gICAgICAgICAgICAgICAgICAgICBbJ2NvbXBsZXRlZCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAnNScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAnbWlsZXMnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgJ3J1bicsXHJcbiAgICAgICAgICAgICAgICAgICAgICAnd2l0aG91dCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAnYnJlYWsnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgJ21ha2VzJyxcclxuICAgICAgICAgICAgICAgICAgICAgICdmZWVsJyxcclxuICAgICAgICAgICAgICAgICAgICAgICdzdHJvbmcnXSxcclxuXHJcbiAgICAgICAgICAgIFsnc29uJywgJ3BlcmZvcm1lZCcsICd3ZWxsJywgJ3Rlc3QnLFxyXG4gICAgICAgICAgICAgICAgJ3ByZXBhcmF0aW9uJ11cclxuICAgICAgICAgICAgXTtcclxuXHJcbiAgICAgICAgICAgICAgICBnZXRBbmFseXNpcyhcIkxEQVwiKTtcclxuICAgICAgICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0RG9jcyh0ZXh0cykge1xyXG4gIHJldHVybiB3aW5kb3cuZG9jdW1lbnRzID0gdGV4dHMubWFwKHggPT4geC5zcGxpdCgpKTtcclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0QW5hbHlzaXMobWV0aG9kLCBzdWNjZXNzLCBmYWlsKSB7XHJcbiAgbGV0IGRvY3MgPSB3aW5kb3cuZG9jdW1lbnRzO1xyXG4gIGxldCBmbmMgPSB4ID0+IHg7XHJcbiAgaWYgKG1ldGhvZCA9PT0gXCJMREFcIikge1xyXG4gICAgZm5jID0gZ2V0TERBQ2x1c3RlcnM7XHJcbiAgfSBlbHNlIHtcclxuICAgIGZuYyA9IGdldFdvcmQyVmVjQ2x1c3RlcnM7XHJcbiAgfVxyXG4gIHdpbmRvdy5sb2FkREZ1bmMgPSAgZm5jO1xyXG4gIGZuYyhkb2NzLCByZXNwID0+IHtcclxuICAgICAgd2luZG93Lmdsb2JhbF9kYXRhID0gcmVzcDtcclxuICAgIGluaXRQYWdlMShyZXNwKTtcclxuICAgIGluaXRQYWdlMihyZXNwKTtcclxuICAgIGluaXRQYWdlMyhyZXNwKTtcclxuICAgIGluaXRQYWdlNCgpO1xyXG4gICAgaWYoc3VjY2Vzcyl7XHJcbiAgICAgICAgc3VjY2VzcyhyZXNwKTtcclxuICAgIH1cclxuICB9LCBmYWlsKTtcclxufVxyXG5cclxuZnVuY3Rpb24gbG9hZFZpc3VhbGl6YXRpb25zKCkge1xyXG59XHJcblxyXG5mdW5jdGlvbiBpbml0UGFnZTEocmVzcCkge1xyXG4gIHJlbmRlckNsdXN0ZXJBbmFseXNpcyhyZXNwKTtcclxufVxyXG5cclxuXHJcblxyXG5mdW5jdGlvbiBpbml0UGFnZTIocmVzcCkge1xyXG4gICAgJChcIiNzcGVjaWVzY29sbGFwc2libGVcIikuaHRtbChcIlwiKTtcclxuICByZW5kZXJDbHVzdGVyRm9yY2VMYXlvdXQocmVzcCk7XHJcblxyXG59XHJcblxyXG5mdW5jdGlvbiBpbml0UGFnZTMocmVzcCl7XHJcbiAgICAkKFwiI3BhcmFsbGVsLWNvb3JkaW5hdGUtdmlzXCIpLmh0bWwoXCJcIik7XHJcbiAgICAkKFwiI3BjLWNvbnRhaW5lclwiKS5odG1sKFwiXCIpO1xyXG4gICAgbG9hZFBhcmFsbGVsQ29vcmRpbmF0ZShyZXNwKTtcclxuICAgIGxvYWRQYXJhbGxlbENvb3JkaW5hdGVzSEMocmVzcCk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGluaXRQYWdlNCgpe1xyXG4gICAgJChcIiNvdmVyYWxsLXdjXCIpLmh0bWwoXCJcIik7XHJcbiAgICBsb2FkV29yZENsb3VkKHdpbmRvdy5nbG9iYWxfZGF0YSk7XHJcbn0iLCIvL3ZlY3RvcnMgZm9ybWF0OiBNYXBbc3RyaW5nKHRvcGljX2lkKTogTGlzdFtmbG9hdF1dXHJcbmZ1bmN0aW9uIGdldDJEVmVjdG9ycyh2ZWN0b3JzLCBzdWNjZXNzQ2FsbGJhY2spe1xyXG4gICAgdmFyIHJlcXVlc3QgPSAkLmFqYXgoe1xyXG4gICAgICAgIHVybDogXCIvZ2V0MkRWZWN0b3JzXCIsXHJcbiAgICAgICAgbWV0aG9kOiBcIlBPU1RcIixcclxuICAgICAgICBkYXRhOiB2ZWN0b3JzXHJcbiAgICAgIH0pO1xyXG4gICAgICAgXHJcbiAgICAgIHJlcXVlc3QuZG9uZShmdW5jdGlvbiggcmVzcG9uc2UgKSB7XHJcbiAgICAgICAgc3VjY2Vzc0NhbGxiYWNrKHJlc3BvbnNlKTtcclxuICAgICAgfSk7XHJcbiAgICAgICBcclxuICAgICAgcmVxdWVzdC5mYWlsKGZ1bmN0aW9uKCBqcVhIUiwgdGV4dFN0YXR1cyApIHtcclxuICAgICAgICBhbGVydCggXCJSZXF1ZXN0IGZhaWxlZDogXCIgKyB0ZXh0U3RhdHVzICk7XHJcbiAgICAgIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBnZXRUb2tlbml6ZWREb2NzKGRvY3MsIHN1Y2Nlc3NDYWxsYmFjaywgZmFpbHVyZUNhbGxiYWNrKXtcclxuICAgIHZhciByZXF1ZXN0ID0gJC5hamF4KHtcclxuICAgICAgICB1cmw6IFwiL2dldERvY3NGcm9tVGV4dHNcIixcclxuICAgICAgICBtZXRob2Q6IFwiUE9TVFwiLFxyXG4gICAgICAgIGRhdGE6IEpTT04uc3RyaW5naWZ5KHtkb2NzOiBkb2NzfSksXHJcbiAgICAgICAgY29udGVudFR5cGU6IFwiYXBwbGljYXRpb24vanNvbjsgY2hhcnNldD11dGYtOFwiLFxyXG4gICAgICAgIGRhdGFUeXBlICAgOiBcImpzb25cIlxyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIHJlcXVlc3QuZG9uZShmdW5jdGlvbiggcmVzcG9uc2UgKSB7XHJcbiAgICAgICAgc3VjY2Vzc0NhbGxiYWNrKHJlc3BvbnNlLmRvY3MpO1xyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIHJlcXVlc3QuZmFpbChmdW5jdGlvbigganFYSFIsIHRleHRTdGF0dXMgKSB7XHJcbiAgICAgICAgaWYoZmFpbHVyZUNhbGxiYWNrKVxyXG4gICAgICAgICAgICBmYWlsdXJlQ2FsbGJhY2sodGV4dFN0YXR1cyk7XHJcbiAgICAgICAgICBlbHNle1xyXG4gICAgICAgICAgICAgIGFsZXJ0KCBcIlJlcXVlc3QgZmFpbGVkOiBcIiArIHRleHRTdGF0dXMgKTtcclxuICAgICAgICAgIH1cclxuICAgICAgfSk7XHJcbn1cclxuXHJcbi8vIGRvY3MgZm9ybWF0OiBMaXN0W0xpc3Rbc3RyaW5nKHdvcmQpXV1cclxuZnVuY3Rpb24gZ2V0V29yZDJWZWNDbHVzdGVycyhkb2NzLCBzdWNjZXNzQ2FsbGJhY2ssIGZhaWx1cmVDYWxsYmFjayl7XHJcbiAgICB2YXIgcmVxdWVzdCA9ICQuYWpheCh7XHJcbiAgICAgICAgdXJsOiBcIi9hcGkvZ2V0Q2x1c3RlcnNXb3JkMlZlY1wiLFxyXG4gICAgICAgIG1ldGhvZDogXCJQT1NUXCIsXHJcbiAgICAgICAgZGF0YTogSlNPTi5zdHJpbmdpZnkoe2RvY3M6IGRvY3MsIHN0YXJ0OiB3aW5kb3cudnVlQXBwLnNldHRpbmdzLnN0YXJ0MiwgZW5kOiB3aW5kb3cudnVlQXBwLnNldHRpbmdzLmVuZDIsIHNlbGVjdGVkOiB3aW5kb3cudnVlQXBwLnNldHRpbmdzLnNlbGVjdGVkRGF0YXNldH0pLFxyXG4gICAgICAgIGNvbnRlbnRUeXBlOiBcImFwcGxpY2F0aW9uL2pzb247IGNoYXJzZXQ9dXRmLThcIixcclxuICAgICAgICBkYXRhVHlwZSAgIDogXCJqc29uXCJcclxuICAgICAgfSk7XHJcbiAgICAgICBcclxuICAgICAgcmVxdWVzdC5kb25lKGZ1bmN0aW9uKCByZXNwb25zZSApIHtcclxuICAgICAgICBzdWNjZXNzQ2FsbGJhY2soSlNPTi5wYXJzZShyZXNwb25zZSkpO1xyXG4gICAgICB9KTtcclxuICAgICAgIFxyXG4gICAgICByZXF1ZXN0LmZhaWwoZnVuY3Rpb24oIGpxWEhSLCB0ZXh0U3RhdHVzICkge1xyXG4gICAgICAgICAgaWYoZmFpbHVyZUNhbGxiYWNrKVxyXG4gICAgICAgICAgICBmYWlsdXJlQ2FsbGJhY2sodGV4dFN0YXR1cyk7XHJcbiAgICAgICAgICBlbHNle1xyXG4gICAgICAgICAgICAgIGFsZXJ0KCBcIlJlcXVlc3QgZmFpbGVkOiBcIiArIHRleHRTdGF0dXMgKTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBnZXRMREFDbHVzdGVycyhkb2NzLCBzdWNjZXNzQ2FsbGJhY2ssIGZhaWx1cmVDYWxsYmFjayl7XHJcbiAgICB2YXIgcmVxdWVzdCA9ICQuYWpheCh7XHJcbiAgICAgICAgdXJsOiBcIi9hcGkvZ2V0TERBRGF0YVwiLFxyXG4gICAgICAgIG1ldGhvZDogXCJQT1NUXCIsXHJcbiAgICAgICAgZGF0YTogSlNPTi5zdHJpbmdpZnkoe2RvY3M6IGRvY3MsIHN0YXJ0OiB3aW5kb3cudnVlQXBwLnNldHRpbmdzLnN0YXJ0MSwgZW5kOiB3aW5kb3cudnVlQXBwLnNldHRpbmdzLmVuZDEsIHNlbGVjdGVkOiB3aW5kb3cudnVlQXBwLnNldHRpbmdzLnNlbGVjdGVkRGF0YXNldH0pLFxyXG4gICAgICAgIGNvbnRlbnRUeXBlOiBcImFwcGxpY2F0aW9uL2pzb247IGNoYXJzZXQ9dXRmLThcIixcclxuICAgICAgICBkYXRhVHlwZSAgIDogXCJqc29uXCJcclxuICAgICAgfSk7XHJcbiAgICAgICBcclxuICAgICAgcmVxdWVzdC5kb25lKGZ1bmN0aW9uKCByZXNwb25zZSApIHtcclxuICAgICAgICBzdWNjZXNzQ2FsbGJhY2socmVzcG9uc2UpO1xyXG4gICAgICB9KTtcclxuICAgICAgIFxyXG4gICAgICByZXF1ZXN0LmZhaWwoZnVuY3Rpb24oIGpxWEhSLCB0ZXh0U3RhdHVzICkge1xyXG4gICAgICAgIGlmKGZhaWx1cmVDYWxsYmFjaylcclxuICAgICAgICAgICAgZmFpbHVyZUNhbGxiYWNrKHRleHRTdGF0dXMpO1xyXG4gICAgICAgICAgZWxzZXtcclxuICAgICAgICAgICAgICBhbGVydCggXCJSZXF1ZXN0IGZhaWxlZDogXCIgKyB0ZXh0U3RhdHVzICk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG59XHJcbiIsImZ1bmN0aW9uIGxvYWRQYXJhbGxlbENvb3JkaW5hdGVzSEMocmVzcCl7XHJcblxyXG5cclxuICAgICAgICBsZXQgZGF0YSA9IGdlbmVyYXRlUGFyYWxsZWxDb29yZGluYXRlRGF0YUhDKHJlc3AsIHdpbmRvdy52dWVBcHAucGFyYW1zLnRvcGljVGhyZXNob2xkLCB3aW5kb3cudnVlQXBwLnBhcmFtcy53b3JkVGhyZXNob2xkKTtcclxuICAgICAgICBIaWdoY2hhcnRzLmNoYXJ0KCdwYy1jb250YWluZXInLCB7XHJcbiAgICAgICAgICAgIGNoYXJ0OiB7XHJcbiAgICAgICAgICAgICAgICB0eXBlOiAnc3BsaW5lJyxcclxuICAgICAgICAgICAgICAgIHBhcmFsbGVsQ29vcmRpbmF0ZXM6IHRydWUsXHJcbiAgICAgICAgICAgICAgICBwYXJhbGxlbEF4ZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICBsaW5lV2lkdGg6IDJcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgdGl0bGU6IHtcclxuICAgICAgICAgICAgICAgIHRleHQ6ICdEb2N1bWVudCAtIFRvcGljIC0gV29yZCBSZWxhdGlvbnNoaXAnXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHBsb3RPcHRpb25zOiB7XHJcbiAgICAgICAgICAgICAgICBzZXJpZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICBhbmltYXRpb246IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgICAgIG1hcmtlcjoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbmFibGVkOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3RhdGVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBob3Zlcjoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVuYWJsZWQ6IGZhbHNlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHN0YXRlczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBob3Zlcjoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaGFsbzoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNpemU6IDBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgZXZlbnRzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1vdXNlT3ZlcjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5ncm91cC50b0Zyb250KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIC8vIHRvb2x0aXA6IHtcclxuICAgICAgICAgICAgLy8gICAgIHBvaW50Rm9ybWF0OiAnPHNwYW4gc3R5bGU9XCJjb2xvcjp7cG9pbnQuY29sb3J9XCI+XFx1MjVDRjwvc3Bhbj4nICtcclxuICAgICAgICAgICAgLy8gICAgICAgICAne3Nlcmllcy5uYW1lfTogPGI+e3BvaW50LmZvcm1hdHRlZFZhbHVlfTwvYj48YnIvPidcclxuICAgICAgICAgICAgLy8gfSxcclxuICAgICAgICAgICAgeEF4aXM6IHtcclxuICAgICAgICAgICAgICAgIGNhdGVnb3JpZXM6IFtcclxuICAgICAgICAgICAgICAgICAgICAnRG9jdW1lbnQnLFxyXG4gICAgICAgICAgICAgICAgICAgICdUb3BpYycsXHJcbiAgICAgICAgICAgICAgICAgICAgJ1dvcmQnXHJcbiAgICAgICAgICAgICAgICBdLFxyXG4gICAgICAgICAgICAgICAgb2Zmc2V0OiAxMFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB5QXhpczogW3tcclxuICAgICAgICAgICAgICAgIGNhdGVnb3JpZXM6IE9iamVjdC5rZXlzKHJlc3BbXCJkb2N1bWVudF90b3BpY1wiXSkubWFwKHg9PiBcIi4uLi4uLi4uLi4uLi4uLi5Eb2N1bWVudCBcIit4KVxyXG4gICAgICAgICAgICB9LCB7XHJcbiAgICAgICAgICAgICAgICBjYXRlZ29yaWVzOiByZXNwW1widG9waWNzXCJdLm1hcCh4PT4gXCIuLi4uLi4uLi4uLi4uLi4uVG9waWMgXCIreClcclxuICAgICAgICAgICAgfSwge1xyXG4gICAgICAgICAgICAgICAgY2F0ZWdvcmllczogT2JqZWN0LnZhbHVlcyhyZXNwW1wid29yZHNcIl0pLm1hcCh4PT4gXCIuLi4uLi4uLi4uLi4uLi4uXCIreClcclxuICAgICAgICAgICAgfV0sXHJcbiAgICAgICAgICAgIGNvbG9yczogWydyZ2JhKDExLCAyMDAsIDIwMCwgMC4xKSddLFxyXG4gICAgICAgICAgICBzZXJpZXM6IGRhdGEubWFwKGZ1bmN0aW9uIChzZXQsIGkpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogJycsXHJcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogc2V0LFxyXG4gICAgICAgICAgICAgICAgICAgIHNoYWRvdzogZmFsc2VcclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgfSk7XHJcblxyXG59XHJcblxyXG5cclxuIiwiZnVuY3Rpb24gbG9hZFBhcmFsbGVsQ29vcmRpbmF0ZShyZXNwKXtcclxuICAgIHZhciBtYXJnaW4gPSB7dG9wOiAzMCwgcmlnaHQ6IDEwLCBib3R0b206IDEwLCBsZWZ0OiAxMH0sXHJcbiAgICAgICAgd2lkdGggPSA5NjAgLSBtYXJnaW4ubGVmdCAtIG1hcmdpbi5yaWdodCxcclxuICAgICAgICBoZWlnaHQgPSA1MDAgLSBtYXJnaW4udG9wIC0gbWFyZ2luLmJvdHRvbTtcclxuXHJcbiAgICB2YXIgeCA9IGQzVjMuc2NhbGUub3JkaW5hbCgpLnJhbmdlUG9pbnRzKFswLCB3aWR0aF0sIDEpLFxyXG4gICAgICAgIHkgPSB7fSxcclxuICAgICAgICBkcmFnZ2luZyA9IHt9O1xyXG5cclxuICAgIHZhciBsaW5lID0gZDNWMy5zdmcubGluZSgpLFxyXG4gICAgICAgIGJhY2tncm91bmQsXHJcbiAgICAgICAgZm9yZWdyb3VuZDtcclxuXHJcbiAgICB2YXIgc3ZnID0gZDNWMy5zZWxlY3QoXCIjcGFyYWxsZWwtY29vcmRpbmF0ZS12aXNcIikuYXBwZW5kKFwic3ZnXCIpXHJcbiAgICAgICAgLmF0dHIoXCJ3aWR0aFwiLCB3aWR0aCArIG1hcmdpbi5sZWZ0ICsgbWFyZ2luLnJpZ2h0KVxyXG4gICAgICAgIC5hdHRyKFwiaGVpZ2h0XCIsIGhlaWdodCArIG1hcmdpbi50b3AgKyBtYXJnaW4uYm90dG9tKVxyXG4gICAgLmFwcGVuZChcImdcIilcclxuICAgICAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZShcIiArIG1hcmdpbi5sZWZ0ICsgXCIsXCIgKyBtYXJnaW4udG9wICsgXCIpXCIpLCBkaW1lbnNpb25zO1xyXG5cclxuXHJcbiAgICAvLyBFeHRyYWN0IHRoZSBsaXN0IG9mIGRpbWVuc2lvbnMgYW5kIGNyZWF0ZSBhIHNjYWxlIGZvciBlYWNoLlxyXG4gICAgdmFyIGNhcnMgPSBnZW5lcmF0ZVBhcmFsbGVsQ29vcmRpbmF0ZURhdGEocmVzcCwgd2luZG93LnZ1ZUFwcC5wYXJhbXMudG9waWNUaHJlc2hvbGQsIHdpbmRvdy52dWVBcHAucGFyYW1zLndvcmRUaHJlc2hvbGQpO1xyXG4gICAgLy8gdmFyIGF4aXNEID0gZDNWMy5zdmcuYXhpcygpLm9yaWVudChcImxlZnRcIikudGlja3MoT2JqZWN0LmtleXMocmVzcFtcImRvY3VtZW50X3RvcGljXCJdKS5sZW5ndGgpLFxyXG4gICAgdmFyIGF4aXNEID0gZDNWMy5zdmcuYXhpcygpLm9yaWVudChcImxlZnRcIikudGlja1ZhbHVlcyhPYmplY3Qua2V5cyhyZXNwW1wiZG9jdW1lbnRfdG9waWNcIl0pLm1hcCh4ID0+IHBhcnNlSW50KHgpKSksXHJcbiAgICAgICAgYXhpc1QgPSBkM1YzLnN2Zy5heGlzKCkub3JpZW50KFwibGVmdFwiKS50aWNrVmFsdWVzKHJlc3BbXCJ0b3BpY3NcIl0ubWFwKHggPT4gcGFyc2VJbnQoeCkpKSxcclxuICAgICAgICBheGlzVyA9IGQzVjMuc3ZnLmF4aXMoKS5vcmllbnQoXCJsZWZ0XCIpLnRpY2tWYWx1ZXMoT2JqZWN0LnZhbHVlcyhyZXNwW1wib3ZlcmFsbF93b3JkXCJdKS5tYXAoeCA9PiBwYXJzZUZsb2F0KHgpKSk7XHJcblxyXG4gICAgeC5kb21haW4oZGltZW5zaW9ucyA9IGQzVjMua2V5cyhjYXJzWzBdKS5maWx0ZXIoZnVuY3Rpb24oZCkge1xyXG4gICAgICAgIHJldHVybiBkICE9IFwibmFtZVwiICYmICh5W2RdID0gZDNWMy5zY2FsZS5saW5lYXIoKVxyXG4gICAgICAgICAgICAuZG9tYWluKGQzVjMuZXh0ZW50KGNhcnMsIGZ1bmN0aW9uKHApIHsgcmV0dXJuICtwW2RdOyB9KSlcclxuICAgICAgICAgICAgLnJhbmdlKFtoZWlnaHQsIDBdKSk7XHJcbiAgICB9KSk7XHJcblxyXG4gICAgLy8gQWRkIGdyZXkgYmFja2dyb3VuZCBsaW5lcyBmb3IgY29udGV4dC5cclxuICAgIGJhY2tncm91bmQgPSBzdmcuYXBwZW5kKFwiZ1wiKVxyXG4gICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJiYWNrZ3JvdW5kXCIpXHJcbiAgICAgICAgLnNlbGVjdEFsbChcInBhdGhcIilcclxuICAgICAgICAuZGF0YShjYXJzKVxyXG4gICAgICAgIC5lbnRlcigpLmFwcGVuZChcInBhdGhcIilcclxuICAgICAgICAuYXR0cihcImRcIiwgcGF0aCk7XHJcblxyXG4gICAgLy8gQWRkIGJsdWUgZm9yZWdyb3VuZCBsaW5lcyBmb3IgZm9jdXMuXHJcbiAgICBmb3JlZ3JvdW5kID0gc3ZnLmFwcGVuZChcImdcIilcclxuICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwiZm9yZWdyb3VuZFwiKVxyXG4gICAgICAgIC5zZWxlY3RBbGwoXCJwYXRoXCIpXHJcbiAgICAgICAgLmRhdGEoY2FycylcclxuICAgICAgICAuZW50ZXIoKS5hcHBlbmQoXCJwYXRoXCIpXHJcbiAgICAgICAgLmF0dHIoXCJkXCIsIHBhdGgpO1xyXG5cclxuICAgIC8vIEFkZCBhIGdyb3VwIGVsZW1lbnQgZm9yIGVhY2ggZGltZW5zaW9uLlxyXG4gICAgdmFyIGcgPSBzdmcuc2VsZWN0QWxsKFwiLmRpbWVuc2lvblwiKVxyXG4gICAgICAgIC5kYXRhKGRpbWVuc2lvbnMpXHJcbiAgICAgICAgLmVudGVyKCkuYXBwZW5kKFwiZ1wiKVxyXG4gICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJkaW1lbnNpb25cIilcclxuICAgICAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBmdW5jdGlvbihkKSB7IHJldHVybiBcInRyYW5zbGF0ZShcIiArIHgoZCkgKyBcIilcIjsgfSlcclxuICAgICAgICAuY2FsbChkM1YzLmJlaGF2aW9yLmRyYWcoKVxyXG4gICAgICAgICAgICAub3JpZ2luKGZ1bmN0aW9uKGQpIHsgcmV0dXJuIHt4OiB4KGQpfTsgfSlcclxuICAgICAgICAgICAgLm9uKFwiZHJhZ3N0YXJ0XCIsIGZ1bmN0aW9uKGQpIHtcclxuICAgICAgICAgICAgZHJhZ2dpbmdbZF0gPSB4KGQpO1xyXG4gICAgICAgICAgICBiYWNrZ3JvdW5kLmF0dHIoXCJ2aXNpYmlsaXR5XCIsIFwiaGlkZGVuXCIpO1xyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAub24oXCJkcmFnXCIsIGZ1bmN0aW9uKGQpIHtcclxuICAgICAgICAgICAgZHJhZ2dpbmdbZF0gPSBNYXRoLm1pbih3aWR0aCwgTWF0aC5tYXgoMCwgZDNWMy5ldmVudC54KSk7XHJcbiAgICAgICAgICAgIGZvcmVncm91bmQuYXR0cihcImRcIiwgcGF0aCk7XHJcbiAgICAgICAgICAgIGRpbWVuc2lvbnMuc29ydChmdW5jdGlvbihhLCBiKSB7IHJldHVybiBwb3NpdGlvbihhKSAtIHBvc2l0aW9uKGIpOyB9KTtcclxuICAgICAgICAgICAgeC5kb21haW4oZGltZW5zaW9ucyk7XHJcbiAgICAgICAgICAgIGcuYXR0cihcInRyYW5zZm9ybVwiLCBmdW5jdGlvbihkKSB7IHJldHVybiBcInRyYW5zbGF0ZShcIiArIHBvc2l0aW9uKGQpICsgXCIpXCI7IH0pXHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIC5vbihcImRyYWdlbmRcIiwgZnVuY3Rpb24oZCkge1xyXG4gICAgICAgICAgICBkZWxldGUgZHJhZ2dpbmdbZF07XHJcbiAgICAgICAgICAgIHRyYW5zaXRpb24oZDNWMy5zZWxlY3QodGhpcykpLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoXCIgKyB4KGQpICsgXCIpXCIpO1xyXG4gICAgICAgICAgICB0cmFuc2l0aW9uKGZvcmVncm91bmQpLmF0dHIoXCJkXCIsIHBhdGgpO1xyXG4gICAgICAgICAgICBiYWNrZ3JvdW5kXHJcbiAgICAgICAgICAgICAgICAuYXR0cihcImRcIiwgcGF0aClcclxuICAgICAgICAgICAgICAgIC50cmFuc2l0aW9uKClcclxuICAgICAgICAgICAgICAgIC5kZWxheSg1MDApXHJcbiAgICAgICAgICAgICAgICAuZHVyYXRpb24oMClcclxuICAgICAgICAgICAgICAgIC5hdHRyKFwidmlzaWJpbGl0eVwiLCBudWxsKTtcclxuICAgICAgICAgICAgfSkpO1xyXG5cclxuICAgIC8vIEFkZCBhbiBheGlzIGFuZCB0aXRsZS5cclxuICAgIGcuYXBwZW5kKFwiZ1wiKVxyXG4gICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJheGlzXCIpXHJcbiAgICAgICAgLmVhY2goZnVuY3Rpb24oZCkge1xyXG4gICAgICAgICAgICBsZXQgYXhpcyA9IG51bGw7XHJcbiAgICAgICAgICAgIGlmKGQgPT0gXCJkb2N1bWVudFwiKXtcclxuICAgICAgICAgICAgICAgIGF4aXMgPSBheGlzRDtcclxuICAgICAgICAgICAgfSBlbHNlIGlmKGQgPT0gXCJ0b3BpY1wiKXtcclxuICAgICAgICAgICAgICAgIGF4aXMgPSBheGlzVDtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGF4aXMgPSBheGlzVztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBkM1YzLnNlbGVjdCh0aGlzKS5jYWxsKFxyXG4gICAgICAgICAgICAgICAgYXhpcy5zY2FsZSh5W2RdKVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLmFwcGVuZChcInRleHRcIilcclxuICAgICAgICAuc3R5bGUoXCJ0ZXh0LWFuY2hvclwiLCBcIm1pZGRsZVwiKVxyXG4gICAgICAgIC5hdHRyKFwieVwiLCAtOSlcclxuICAgICAgICAudGV4dChmdW5jdGlvbihkKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBkO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgIC8vIEFkZCBhbmQgc3RvcmUgYSBicnVzaCBmb3IgZWFjaCBheGlzLlxyXG4gICAgZy5hcHBlbmQoXCJnXCIpXHJcbiAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcImJydXNoXCIpXHJcbiAgICAgICAgLmVhY2goZnVuY3Rpb24oZCkge1xyXG4gICAgICAgICAgICBkM1YzLnNlbGVjdCh0aGlzKS5jYWxsKHlbZF0uYnJ1c2ggPSBkM1YzLnN2Zy5icnVzaCgpLnkoeVtkXSkub24oXCJicnVzaHN0YXJ0XCIsIGJydXNoc3RhcnQpLm9uKFwiYnJ1c2hcIiwgYnJ1c2gpKTtcclxuICAgICAgICB9KVxyXG4gICAgICAgIC5zZWxlY3RBbGwoXCJyZWN0XCIpXHJcbiAgICAgICAgLmF0dHIoXCJ4XCIsIC04KVxyXG4gICAgICAgIC5hdHRyKFwid2lkdGhcIiwgMTYpO1xyXG5cclxuXHJcbiAgICBmdW5jdGlvbiBwb3NpdGlvbihkKSB7XHJcbiAgICB2YXIgdiA9IGRyYWdnaW5nW2RdO1xyXG4gICAgcmV0dXJuIHYgPT0gbnVsbCA/IHgoZCkgOiB2O1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIHRyYW5zaXRpb24oZykge1xyXG4gICAgcmV0dXJuIGcudHJhbnNpdGlvbigpLmR1cmF0aW9uKDUwMCk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gUmV0dXJucyB0aGUgcGF0aCBmb3IgYSBnaXZlbiBkYXRhIHBvaW50LlxyXG4gICAgZnVuY3Rpb24gcGF0aChkKSB7XHJcbiAgICByZXR1cm4gbGluZShkaW1lbnNpb25zLm1hcChmdW5jdGlvbihwKSB7IHJldHVybiBbcG9zaXRpb24ocCksIHlbcF0oZFtwXSldOyB9KSk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gYnJ1c2hzdGFydCgpIHtcclxuICAgIGQzVjMuZXZlbnQuc291cmNlRXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gSGFuZGxlcyBhIGJydXNoIGV2ZW50LCB0b2dnbGluZyB0aGUgZGlzcGxheSBvZiBmb3JlZ3JvdW5kIGxpbmVzLlxyXG4gICAgZnVuY3Rpb24gYnJ1c2goKSB7XHJcbiAgICB2YXIgYWN0aXZlcyA9IGRpbWVuc2lvbnMuZmlsdGVyKGZ1bmN0aW9uKHApIHsgcmV0dXJuICF5W3BdLmJydXNoLmVtcHR5KCk7IH0pLFxyXG4gICAgICAgIGV4dGVudHMgPSBhY3RpdmVzLm1hcChmdW5jdGlvbihwKSB7IHJldHVybiB5W3BdLmJydXNoLmV4dGVudCgpOyB9KTtcclxuICAgIGZvcmVncm91bmQuc3R5bGUoXCJkaXNwbGF5XCIsIGZ1bmN0aW9uKGQpIHtcclxuICAgICAgICByZXR1cm4gYWN0aXZlcy5ldmVyeShmdW5jdGlvbihwLCBpKSB7XHJcbiAgICAgICAgcmV0dXJuIGV4dGVudHNbaV1bMF0gPD0gZFtwXSAmJiBkW3BdIDw9IGV4dGVudHNbaV1bMV07XHJcbiAgICAgICAgfSkgPyBudWxsIDogXCJub25lXCI7XHJcbiAgICB9KTtcclxuICAgIH1cclxuXHJcbn0iLCJmdW5jdGlvbiByZW5kZXJDbHVzdGVyQW5hbHlzaXMocmVzcCkge1xyXG4gIGQzLnNlbGVjdChcIi5jaGFydDEyXCIpLnJlbW92ZSgpO1xyXG4gIHZhciBkb2N1bWVudF90b3BpYyA9IHJlc3BbXCJkb2N1bWVudF90b3BpY1wiXVswXTtcclxuICB2YXIgdG9waWNfdmVjdG9ycyA9IHJlc3BbXCJ0b3BpY192ZWN0b3JzXCJdO1xyXG4gIHZhciBiYiA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNjbHVzdGVyJylcclxuICAgIC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKSxcclxuICAgIHdpZHRoID0gNDAwO1xyXG4gIHZhciBoZWlnaHQgPSA0MDA7XHJcbiAgdmFyIG1hcmdpbiA9IDgwO1xyXG4gIHZhciBkYXRhID0gW107XHJcblxyXG4gIE9iamVjdC5rZXlzKHRvcGljX3ZlY3RvcnMpLmZvckVhY2goZnVuY3Rpb24oa2V5KSB7XHJcbiAgICB2YXIgdmFsdWUgPSB0b3BpY192ZWN0b3JzW2tleV07XHJcbiAgICBkYXRhLnB1c2goe1xyXG4gICAgICB4OiB2YWx1ZVswXSxcclxuICAgICAgeTogdmFsdWVbMV0sXHJcbiAgICAgIGM6IDEsXHJcbiAgICAgIHNpemU6IGRvY3VtZW50X3RvcGljW2tleV0sXHJcbiAgICAgIGtleToga2V5XHJcbiAgICB9KTtcclxuICB9KTtcclxuICB2YXIgbGFiZWxYID0gJ1gnO1xyXG4gIHZhciBsYWJlbFkgPSAnWSc7XHJcblxyXG4gIHZhciBzdmcgPSBkMy5zZWxlY3QoJyNjbHVzdGVyJylcclxuICAgIC5hcHBlbmQoJ3N2ZycpXHJcbiAgICAuYXR0cignY2xhc3MnLCAnY2hhcnQxMicpXHJcbiAgICAuYXR0cignaWQnLCdjbHVzdGVyX2lkJylcclxuICAgIC5hdHRyKFwid2lkdGhcIiwgd2lkdGggKyBtYXJnaW4gKyBtYXJnaW4pXHJcbiAgICAuYXR0cihcImhlaWdodFwiLCBoZWlnaHQgKyBtYXJnaW4gKyBtYXJnaW4pXHJcbiAgICAuYXBwZW5kKFwiZ1wiKVxyXG4gICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoXCIgKyBtYXJnaW4gKyBcIixcIiArIG1hcmdpbiArIFwiKVwiKTtcclxuXHJcbiAgdmFyIHggPSBkMy5zY2FsZUxpbmVhcigpXHJcbiAgICAuZG9tYWluKFtkMy5taW4oZGF0YSwgZnVuY3Rpb24gKGQpIHtcclxuICAgICAgcmV0dXJuIGQueDtcclxuICAgIH0pLCBkMy5tYXgoZGF0YSwgZnVuY3Rpb24gKGQpIHtcclxuICAgICAgcmV0dXJuIGQueDtcclxuICAgIH0pXSlcclxuICAgIC5yYW5nZShbMCwgd2lkdGhdKTtcclxuXHJcbiAgdmFyIHkgPSBkMy5zY2FsZUxpbmVhcigpXHJcbiAgICAuZG9tYWluKFtkMy5taW4oZGF0YSwgZnVuY3Rpb24gKGQpIHtcclxuICAgICAgcmV0dXJuIGQueTtcclxuICAgIH0pLCBkMy5tYXgoZGF0YSwgZnVuY3Rpb24gKGQpIHtcclxuICAgICAgcmV0dXJuIGQueTtcclxuICAgIH0pXSlcclxuICAgIC5yYW5nZShbaGVpZ2h0LCAwXSk7XHJcblxyXG4gIHZhciBzY2FsZSA9IGQzLnNjYWxlU3FydCgpXHJcbiAgICAuZG9tYWluKFtkMy5taW4oZGF0YSwgZnVuY3Rpb24gKGQpIHtcclxuICAgICAgcmV0dXJuIGQuc2l6ZTtcclxuICAgIH0pLCBkMy5tYXgoZGF0YSwgZnVuY3Rpb24gKGQpIHtcclxuICAgICAgcmV0dXJuIGQuc2l6ZTtcclxuICAgIH0pXSlcclxuICAgIC5yYW5nZShbMTAsIDIwXSk7XHJcblxyXG4gIHZhciBvcGFjaXR5ID0gZDMuc2NhbGVTcXJ0KClcclxuICAgIC5kb21haW4oW2QzLm1pbihkYXRhLCBmdW5jdGlvbiAoZCkge1xyXG4gICAgICByZXR1cm4gZC5zaXplO1xyXG4gICAgfSksIGQzLm1heChkYXRhLCBmdW5jdGlvbiAoZCkge1xyXG4gICAgICByZXR1cm4gZC5zaXplO1xyXG4gICAgfSldKVxyXG4gICAgLnJhbmdlKFsxLCAuNV0pO1xyXG5cclxuXHJcbiAgdmFyIHhBeGlzID0gZDMuYXhpc0JvdHRvbSgpLnNjYWxlKHgpO1xyXG4gIHZhciB5QXhpcyA9IGQzLmF4aXNMZWZ0KCkuc2NhbGUoeSk7XHJcblxyXG5cclxuICBzdmcuYXBwZW5kKFwiZ1wiKVxyXG4gICAgLmF0dHIoXCJjbGFzc1wiLCBcInkgYXhpc1wiKVxyXG4gICAgLmNhbGwoeUF4aXMpXHJcbiAgICAuYXBwZW5kKFwidGV4dFwiKVxyXG4gICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJyb3RhdGUoLTkwKVwiKVxyXG4gICAgLmF0dHIoXCJ4XCIsIDIwKVxyXG4gICAgLmF0dHIoXCJ5XCIsIC1tYXJnaW4pXHJcbiAgICAuYXR0cihcImR5XCIsIFwiLjcxZW1cIilcclxuICAgIC5zdHlsZShcInRleHQtYW5jaG9yXCIsIFwiZW5kXCIpXHJcbiAgICAudGV4dChsYWJlbFkpO1xyXG4gIC8vIHggYXhpcyBhbmQgbGFiZWxcclxuICBzdmcuYXBwZW5kKFwiZ1wiKVxyXG4gICAgLmF0dHIoXCJjbGFzc1wiLCBcInggYXhpc1wiKVxyXG4gICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoMCxcIiArIGhlaWdodCArIFwiKVwiKVxyXG4gICAgLmNhbGwoeEF4aXMpXHJcbiAgICAuYXBwZW5kKFwidGV4dFwiKVxyXG4gICAgLmF0dHIoXCJ4XCIsIHdpZHRoICsgMjApXHJcbiAgICAuYXR0cihcInlcIiwgbWFyZ2luIC0gMTApXHJcbiAgICAuYXR0cihcImR5XCIsIFwiLjcxZW1cIilcclxuICAgIC5zdHlsZShcInRleHQtYW5jaG9yXCIsIFwiZW5kXCIpXHJcbiAgICAudGV4dChsYWJlbFgpO1xyXG5cclxuICBzdmcuc2VsZWN0QWxsKFwiY2lyY2xlXCIpXHJcbiAgICAuZGF0YShkYXRhKVxyXG4gICAgLmVudGVyKClcclxuICAgIC5hcHBlbmQoXCJnXCIpXHJcbiAgICAuaW5zZXJ0KFwiY2lyY2xlXCIpXHJcbiAgICAuYXR0cihcImN4XCIsIHdpZHRoIC8gMilcclxuICAgIC5hdHRyKFwiY3lcIiwgaGVpZ2h0IC8gMilcclxuICAgIC5hdHRyKFwiclwiLCBmdW5jdGlvbiAoZCkge1xyXG4gICAgICByZXR1cm4gc2NhbGUoZC5zaXplKTtcclxuICAgIH0pXHJcbiAgICAuYXR0cihcImlkXCIsZnVuY3Rpb24oZCkge1xyXG4gICAgICByZXR1cm4gZC5rZXlcclxuICAgIH0pXHJcbiAgICAuc3R5bGUoXCJmaWxsXCIsIGZ1bmN0aW9uIChkKSB7XHJcbiAgICAgIHJldHVybiBcIiNEMEUzRjBcIjtcclxuICAgIH0pXHJcbiAgICAub24oJ21vdXNlb3ZlcicsIGZ1bmN0aW9uIChkLCBpKSB7XHJcbiAgICAgIHJlbmRlckJhckdyYXBoKGRbXCJrZXlcIl0sIHJlc3ApO1xyXG4gICAgICBmYWRlKGRbXCJrZXlcIl0sIDEpO1xyXG4gICAgfSlcclxuICAgIC5vbignbW91c2VvdXQnLCBmdW5jdGlvbiAoZCwgaSkge1xyXG4gICAgICBmYWRlT3V0KCk7XHJcbiAgICB9KVxyXG4gICAgLnRyYW5zaXRpb24oKVxyXG4gICAgLmRlbGF5KGZ1bmN0aW9uIChkLCBpKSB7XHJcbiAgICAgIHJldHVybiB4KGQueCkgLSB5KGQueSk7XHJcbiAgICB9KVxyXG4gICAgLmR1cmF0aW9uKDUwMClcclxuICAgIC5hdHRyKFwiY3hcIiwgZnVuY3Rpb24gKGQpIHtcclxuICAgICAgcmV0dXJuIHgoZC54KTtcclxuICAgIH0pXHJcbiAgICAuYXR0cihcImN5XCIsIGZ1bmN0aW9uIChkKSB7XHJcbiAgICAgIHJldHVybiB5KGQueSk7XHJcbiAgICB9KTtcclxuXHJcbiAgICAgIC8vIHRleHQgbGFiZWwgZm9yIHRoZSB4IGF4aXNcclxuICBzdmcuYXBwZW5kKFwidGV4dFwiKVxyXG4gICAgLmF0dHIoXCJjbGFzc1wiLCBcInggbGFiZWxcIilcclxuICAgIC5hdHRyKFwidGV4dC1hbmNob3JcIiwgXCJlbmRcIilcclxuICAgIC5hdHRyKFwieFwiLCB3aWR0aClcclxuICAgIC5hdHRyKFwieVwiLCBoZWlnaHQgKzQwKVxyXG4gICAgLnRleHQoXCJQQzFcIik7XHJcblxyXG5cclxuICBzdmcuYXBwZW5kKFwidGV4dFwiKVxyXG4gICAgLmF0dHIoXCJjbGFzc1wiLCBcInkgbGFiZWxcIilcclxuICAgIC5hdHRyKFwidGV4dC1hbmNob3JcIiwgXCJlbmRcIilcclxuICAgIC5hdHRyKFwieVwiLCAtNTApXHJcbiAgICAuYXR0cihcImR5XCIsIFwiLjc1ZW1cIilcclxuICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIFwicm90YXRlKC05MClcIilcclxuICAgIC50ZXh0KFwiUEMyXCIpO1xyXG5cclxuXHJcbiAgZnVuY3Rpb24gZmFkZShrZXksIG9wYWNpdHkpIHtcclxuICAgIHN2Zy5zZWxlY3RBbGwoXCJjaXJjbGVcIilcclxuICAgICAgLmZpbHRlcihmdW5jdGlvbiAoZCkge1xyXG4gICAgICAgIFxyXG4gICAgICAgIHJldHVybiBkLmtleSA9PSBrZXk7XHJcbiAgICAgIH0pLlxyXG4gICAgICBzdHlsZShcImZpbGxcIiwgXCIjQzg0MjNFXCIpXHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiBmYWRlT3V0KCkge1xyXG4gICAgc3ZnLnNlbGVjdEFsbChcImNpcmNsZVwiKVxyXG4gICAgICAudHJhbnNpdGlvbigpXHJcbiAgICAgIC5zdHlsZShcImZpbGxcIixcIiNEMEUzRjBcIik7XHJcbiAgfVxyXG59IiwiZnVuY3Rpb24gcmVuZGVyQmFyR3JhcGgodG9waWNfbnVtYmVyLCByZXNwKSB7XHJcbiAgZDMuc2VsZWN0KFwiI3N0YWNrLWJhclwiKS5yZW1vdmUoKTtcclxuICBkMy5zZWxlY3QoXCIjbGVnZW5kc3ZnXCIpLnJlbW92ZSgpO1xyXG4gIHZhciBmaW5hbF9kYXRhID0gW107XHJcbiAgdmFyIGRhdGFWYWwgPXJlc3BbXCJ0b3BpY193b3JkXCJdW3RvcGljX251bWJlcl07XHJcbiAgZm9yICh2YXIga2V5IGluIGRhdGFWYWwpIHtcclxuICAgIGlmIChkYXRhVmFsLmhhc093blByb3BlcnR5KGtleSkpIHtcclxuICAgICAgICB2YXIgdGVtcCA9e307XHJcbiAgICAgICAgdGVtcC5TdGF0ZSA9IGtleTtcclxuICAgICAgICB0ZW1wLnRvcGljX2ZyZXF1ZW5jeSA9IE1hdGguYWJzKGRhdGFWYWxba2V5XSk7XHJcbiAgICAgICAgdGVtcC5vdmVyYWxsID0gTWF0aC5hYnMocmVzcFtcIm92ZXJhbGxfd29yZFwiXVtrZXldKTtcclxuICAgICAgICB0ZW1wLnRvdGFsID0gdGVtcC50b3BpY19mcmVxdWVuY3kgKyB0ZW1wLm92ZXJhbGw7XHJcbiAgICAgICAgZmluYWxfZGF0YS5wdXNoKHRlbXApO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKGtleSArIFwiLT5cIiArIHJlc3BbXCJvdmVyYWxsX3dvcmRcIl1ba2V5XSk7XHJcbiAgICB9XHJcbiAgICBcclxuICB9XHJcbiAgXHJcbiAgdmFyIGJiID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI3N0YWNrZWQtYmFyJylcclxuICAgIC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKSxcclxuICAgIHdpZHRoID0gNDAwO1xyXG5cclxuICB2YXIgZGF0YSA9IGZpbmFsX2RhdGE7XHJcbiAgdmFyIGhlaWdodCA9IGRhdGEubGVuZ3RoICogMjUgKzEwMDtcclxuICB2YXIgc3ZnID0gZDMuc2VsZWN0KFwiI3N0YWNrZWQtYmFyXCIpLmFwcGVuZChcInN2Z1wiKS5hdHRyKFwid2lkdGhcIiwgd2lkdGgpLmF0dHIoXCJoZWlnaHRcIiwgaGVpZ2h0KS5hdHRyKFwiaWRcIixcInN0YWNrLWJhclwiKSxcclxuICAgIG1hcmdpbiA9IHtcclxuICAgICAgdG9wOiAyMCxcclxuICAgICAgcmlnaHQ6IDAsXHJcbiAgICAgIGJvdHRvbTogNTAsXHJcbiAgICAgIGxlZnQ6IDgwXHJcbiAgICB9LFxyXG4gICAgd2lkdGggPSArc3ZnLmF0dHIoXCJ3aWR0aFwiKSAtIG1hcmdpbi5sZWZ0IC0gbWFyZ2luLnJpZ2h0LFxyXG4gICAgaGVpZ2h0ID0gK3N2Zy5hdHRyKFwiaGVpZ2h0XCIpIC0gbWFyZ2luLnRvcCAtIG1hcmdpbi5ib3R0b20sXHJcbiAgICBnID0gc3ZnLmFwcGVuZChcImdcIikuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZShcIiArIG1hcmdpbi5sZWZ0ICsgXCIsXCIgKyBtYXJnaW4udG9wICsgXCIpXCIpO1xyXG4gIHZhciB5ID0gZDMuc2NhbGVCYW5kKCkgLy8geCA9IGQzLnNjYWxlQmFuZCgpICBcclxuICAgIC5yYW5nZVJvdW5kKFswLCBoZWlnaHRdKSAvLyAucmFuZ2VSb3VuZChbMCwgd2lkdGhdKVxyXG4gICAgLnBhZGRpbmdJbm5lcigwLjI1KS5hbGlnbigwLjEpO1xyXG4gIHZhciB4ID0gZDMuc2NhbGVMaW5lYXIoKSAvLyB5ID0gZDMuc2NhbGVMaW5lYXIoKVxyXG4gICAgLnJhbmdlUm91bmQoWzAsIHdpZHRoXSk7IC8vIC5yYW5nZVJvdW5kKFtoZWlnaHQsIDBdKTtcclxuXHJcbiAgdmFyIHogPSBkMy5zY2FsZU9yZGluYWwoKS5yYW5nZShbXCIjQzg0MjNFXCIsIFwiI0ExQzdFMFwiXSk7XHJcbiAgdmFyIGtleXMgPSBbXCJ0b3BpY19mcmVxdWVuY3lcIiwgXCJvdmVyYWxsXCJdO1xyXG4gIGRhdGEuc29ydChmdW5jdGlvbiAoYSwgYikge1xyXG4gICAgcmV0dXJuIGIudG90YWwgLSBhLnRvdGFsO1xyXG4gIH0pO1xyXG4gIHkuZG9tYWluKGRhdGEubWFwKGZ1bmN0aW9uIChkKSB7XHJcbiAgICByZXR1cm4gZC5TdGF0ZTtcclxuICB9KSk7IC8vIHguZG9tYWluLi4uXHJcblxyXG4gIHguZG9tYWluKFswLCBkMy5tYXgoZGF0YSwgZnVuY3Rpb24gKGQpIHtcclxuICAgIHJldHVybiBkLnRvdGFsO1xyXG4gIH0pXSkubmljZSgpOyAvLyB5LmRvbWFpbi4uLlxyXG5cclxuICB6LmRvbWFpbihrZXlzKTtcclxuICBnLmFwcGVuZChcImdcIilcclxuICAgIC5zZWxlY3RBbGwoXCJnXCIpXHJcbiAgICAuZGF0YShkMy5zdGFjaygpLmtleXMoa2V5cykoZGF0YSkpXHJcbiAgICAuZW50ZXIoKS5hcHBlbmQoXCJnXCIpXHJcbiAgICAgIC5hdHRyKFwiZmlsbFwiLCBmdW5jdGlvbihkKSB7IHJldHVybiB6KGQua2V5KTsgfSlcclxuICAgIC5zZWxlY3RBbGwoXCJyZWN0XCIpXHJcbiAgICAuZGF0YShmdW5jdGlvbihkKSB7IHJldHVybiBkOyB9KVxyXG4gICAgLmVudGVyKCkuYXBwZW5kKFwicmVjdFwiKVxyXG4gICAgICAuYXR0cihcInlcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4geShkLmRhdGEuU3RhdGUpOyB9KSAgICAgLy8uYXR0cihcInhcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4geChkLmRhdGEuU3RhdGUpOyB9KVxyXG4gICAgICAuYXR0cihcInhcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4geChkWzBdKTsgfSkgICAgICAgICAvLy5hdHRyKFwieVwiLCBmdW5jdGlvbihkKSB7IHJldHVybiB5KGRbMV0pOyB9KSBcclxuICAgICAgLmF0dHIoXCJ3aWR0aFwiLCBmdW5jdGlvbihkKSB7XHJcbiAgICAgICAgXHJcbiAgICAgICByZXR1cm4geChkWzFdKSAtIHgoZFswXSk7IFxyXG4gICAgfSkgLy8uYXR0cihcImhlaWdodFwiLCBmdW5jdGlvbihkKSB7IHJldHVybiB5KGRbMF0pIC0geShkWzFdKTsgfSlcclxuICAgICAgLmF0dHIoXCJoZWlnaHRcIiwgeS5iYW5kd2lkdGgoKSk7ICAgICAgICAgICAgICAgLy8uYXR0cihcIndpZHRoXCIsIHguYmFuZHdpZHRoKCkpOyAgXHJcblxyXG4gIGcuYXBwZW5kKFwiZ1wiKVxyXG4gICAgICAuYXR0cihcImNsYXNzXCIsIFwiYXhpc1wiKVxyXG4gICAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZSgwLDApXCIpICAgICAgICAgICAgLy8gIC5hdHRyKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKDAsXCIgKyBoZWlnaHQgKyBcIilcIilcclxuICAgICAgLmNhbGwoZDMuYXhpc0xlZnQoeSkpOyAgICAgICAgICAgICAgICAgIC8vICAgLmNhbGwoZDMuYXhpc0JvdHRvbSh4KSk7XHJcblxyXG4gIGcuYXBwZW5kKFwiZ1wiKVxyXG4gICAgICAuYXR0cihcImNsYXNzXCIsIFwiYXhpc1wiKVxyXG4gICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoMCxcIitoZWlnaHQrXCIpXCIpICAgICAgIC8vIE5ldyBsaW5lXHJcbiAgICAgIC5jYWxsKGQzLmF4aXNCb3R0b20oeCkudGlja3MobnVsbCwgXCJzXCIpKSAgICAgICAgICAvLyAgLmNhbGwoZDMuYXhpc0xlZnQoeSkudGlja3MobnVsbCwgXCJzXCIpKVxyXG4gICAgLmFwcGVuZChcInRleHRcIilcclxuICAgICAgLmF0dHIoXCJ5XCIsIDIpICAgICAgICAgICAgICAgICAgICAgICAvLyAgICAgLmF0dHIoXCJ5XCIsIDIpXHJcbiAgICAgIC5hdHRyKFwieFwiLCB4KHgudGlja3MoKS5wb3AoKSkgKyAwLjUpICAgICAgICAgICAgLy8gICAgIC5hdHRyKFwieVwiLCB5KHkudGlja3MoKS5wb3AoKSkgKyAwLjUpXHJcbiAgICAgIC5hdHRyKFwiZHlcIiwgXCI0ZW1cIikgICAgICAgICAgICAgICAgICAgLy8gICAgIC5hdHRyKFwiZHlcIiwgXCIwLjMyZW1cIilcclxuICAgICAgLmF0dHIoXCJmaWxsXCIsIFwiIzAwMFwiKVxyXG4gICAgICAuYXR0cihcInRleHQtYW5jaG9yXCIsIFwic3RhcnRcIilcclxuICAgICAgLnRleHQoXCJQcm9iYWJpbGl0eS9Db3NpbmUgU2ltaWxhcml0eVwiKVxyXG4gICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoXCIrICgtd2lkdGgpICtcIiwtMTApXCIpOyAgICAvLyBOZXdsaW5lXHJcblxyXG4gIHZhciBsZWdlbmQgPSBnLmFwcGVuZChcImdcIilcclxuICAgICAgLmF0dHIoXCJmb250LWZhbWlseVwiLCBcInNhbnMtc2VyaWZcIilcclxuICAgICAgLmF0dHIoXCJmb250LXNpemVcIiwgMTApXHJcbiAgICAgIC5hdHRyKFwidGV4dC1hbmNob3JcIiwgXCJlbmRcIilcclxuICAgIC5zZWxlY3RBbGwoXCJnXCIpXHJcbiAgICAuZGF0YShrZXlzLnNsaWNlKCkucmV2ZXJzZSgpKVxyXG4gICAgLmVudGVyKCkuYXBwZW5kKFwiZ1wiKVxyXG4gICAgLy8uYXR0cihcInRyYW5zZm9ybVwiLCBmdW5jdGlvbihkLCBpKSB7IHJldHVybiBcInRyYW5zbGF0ZSgwLFwiICsgaSAqIDIwICsgXCIpXCI7IH0pO1xyXG4gICAuYXR0cihcInRyYW5zZm9ybVwiLCBmdW5jdGlvbihkLCBpKSB7IHJldHVybiBcInRyYW5zbGF0ZSgtNTAsXCIgKyAoMzAwICsgaSAqIDIwKSArIFwiKVwiOyB9KTtcclxuICBcclxuXHJcbiAgdmFyIGtleXMxID0gW1wiT3ZlcmFsbCBUZXJtIEZyZXF1ZW5jeS9PdmVyYWxsIFJlbGV2YW5jZVwiLCBcIkVzdGltYXRlZCBUZXJtIGZyZXF1ZW5jeSB3aXRoaW4gdGhlIHNlbGVjdGVkIHRvcGljXCJdO1xyXG4gIHZhciBzdmcxID0gZDMuc2VsZWN0KFwiI2xlZ2VuZFRcIikuYXBwZW5kKFwic3ZnXCIpLmF0dHIoXCJ3aWR0aFwiLCA1MDApLmF0dHIoXCJoZWlnaHRcIiwgaGVpZ2h0KS5hdHRyKFwiaWRcIixcImxlZ2VuZHN2Z1wiKVxyXG52YXIgbGVnZW5kID0gc3ZnMS5hcHBlbmQoXCJnXCIpLmF0dHIoXCJmb250LWZhbWlseVwiLCBcInNhbnMtc2VyaWZcIikuYXR0cihcImZvbnQtc2l6ZVwiLCAxMCkuYXR0cihcInRleHQtYW5jaG9yXCIsIFwiZW5kXCIpLnNlbGVjdEFsbChcImdcIikuZGF0YShrZXlzMS5zbGljZSgpLnJldmVyc2UoKSkuZW50ZXIoKS5hcHBlbmQoXCJnXCIpIC8vLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgZnVuY3Rpb24oZCwgaSkgeyByZXR1cm4gXCJ0cmFuc2xhdGUoMCxcIiArIGkgKiAyMCArIFwiKVwiOyB9KTtcclxuICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIGZ1bmN0aW9uIChkLCBpKSB7XHJcbiAgICAgIHJldHVybiBcInRyYW5zbGF0ZSgtNTAsXCIgKyAoMCArIGkgKiAyMCkgKyBcIilcIjtcclxuICAgIH0pO1xyXG4gIGxlZ2VuZC5hcHBlbmQoXCJyZWN0XCIpLmF0dHIoXCJ4XCIsIHdpZHRoKVxyXG4gIC5hdHRyKFwid2lkdGhcIiwgZnVuY3Rpb24gKGQsIGkpe1xyXG4gICAgICBpZihpPT0wKXtcclxuICAgICAgICByZXR1cm4gNjA7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIDE2MDtcclxuICB9KS5hdHRyKFwiaGVpZ2h0XCIsIDE5KS5hdHRyKFwiZmlsbFwiLCB6KTtcclxuXHJcbiAgbGVnZW5kLmFwcGVuZChcInRleHRcIikuYXR0cihcInhcIiwgd2lkdGggLSAxMCkuYXR0cihcInlcIiwgMTgpLmF0dHIoXCJkeVwiLCBcIjAuMGVtXCIpLnRleHQoZnVuY3Rpb24gKGQpIHtcclxuICAgIHJldHVybiBkO1xyXG4gIH0pO1xyXG4gIFxyXG59IiwiZnVuY3Rpb24gZ2VuZXJhdGVUb3BpY1ZlY3RvcnMoKXtcclxuICAgIHdpbmRvdy50b3BpY1ZlY3RvcnMgPSB7fTtcclxuICAgIGlmKHdpbmRvdy50b3BpY193b3JkX3Byb2JhYmlsaXR5X2luX3RvcGljKXtcclxuICAgICAgICBmb3IodmFyIHggaW4gd2luZG93LnRvcGljX3dvcmRfcHJvYmFiaWxpdHlfaW5fdG9waWMpe1xyXG4gICAgICAgICAgICB2YXIgdmVjdG9yID0gW107XHJcbiAgICAgICAgICAgIGZvcih2YXIgeSBpbiB3aW5kb3cudG9waWNfd29yZF9wcm9iYWJpbGl0eV9pbl90b3BpY1t4XSl7XHJcbiAgICAgICAgICAgICAgICB2ZWN0b3IucHVzaCh3aW5kb3cudG9waWNfd29yZF9wcm9iYWJpbGl0eV9pbl90b3BpY1t4XVt5XSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgd2luZG93LnRvcGljVmVjdG9yc1t4XSA9IHZlY3RvcjtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdlbmVyYXRlUGFyYWxsZWxDb29yZGluYXRlRGF0YShyZXNwb25zZSwgdG9waWNfdGhyZXNob2xkLCB3b3JkX3RocmVzaG9sZCl7XHJcbiAgICBsZXQgdmlzRGF0YSA9IFtdO1xyXG4gICAgZm9yICh2YXIgZG9jS2V5IGluIHJlc3BvbnNlW1wiZG9jdW1lbnRfdG9waWNcIl0pe1xyXG4gICAgICAgIGZvcih2YXIgdG9waWMgaW4gcmVzcG9uc2VbXCJkb2N1bWVudF90b3BpY1wiXVtkb2NLZXldKXtcclxuICAgICAgICAgICAgbGV0IHRvcGljU2NvcmUgPSByZXNwb25zZVtcImRvY3VtZW50X3RvcGljXCJdW2RvY0tleV1bdG9waWNdO1xyXG4gICAgICAgICAgICBpZiAodG9waWNTY29yZSA+IHRvcGljX3RocmVzaG9sZCl7XHJcblxyXG4gICAgICAgICAgICAgICAgZm9yKHZhciB3b3JkIGluIHJlc3BvbnNlW1widG9waWNfd29yZFwiXVt0b3BpY10pe1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCB3b3JkU2NvcmUgPSByZXNwb25zZVtcInRvcGljX3dvcmRcIl1bdG9waWNdW3dvcmRdO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICh3b3JkU2NvcmUgPiB3b3JkX3RocmVzaG9sZCl7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZpc0RhdGEucHVzaCh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIm5hbWVcIjogZG9jS2V5LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJkb2N1bWVudFwiOiAgZG9jS2V5LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJ0b3BpY1wiOiB0b3BpYyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwid29yZFwiOiByZXNwb25zZVtcIm92ZXJhbGxfd29yZFwiXVt3b3JkXVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIHZpc0RhdGE7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdlbmVyYXRlUGFyYWxsZWxDb29yZGluYXRlRGF0YUhDKHJlc3BvbnNlLCB0b3BpY190aHJlc2hvbGQsIHdvcmRfdGhyZXNob2xkKXtcclxuICAgIGxldCB2aXNEYXRhID0gW107XHJcbiAgICBmb3IgKHZhciBkb2NLZXkgaW4gcmVzcG9uc2VbXCJkb2N1bWVudF90b3BpY1wiXSl7XHJcbiAgICAgICAgZm9yKHZhciB0b3BpYyBpbiByZXNwb25zZVtcImRvY3VtZW50X3RvcGljXCJdW2RvY0tleV0pe1xyXG4gICAgICAgICAgICBsZXQgdG9waWNTY29yZSA9IHJlc3BvbnNlW1wiZG9jdW1lbnRfdG9waWNcIl1bZG9jS2V5XVt0b3BpY107XHJcbiAgICAgICAgICAgIGlmICh0b3BpY1Njb3JlID4gdG9waWNfdGhyZXNob2xkKXtcclxuXHJcbiAgICAgICAgICAgICAgICBmb3IodmFyIHdvcmQgaW4gcmVzcG9uc2VbXCJ0b3BpY193b3JkXCJdW3RvcGljXSl7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IHdvcmRTY29yZSA9IHJlc3BvbnNlW1widG9waWNfd29yZFwiXVt0b3BpY11bd29yZF07XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHdvcmRTY29yZSA+IHdvcmRfdGhyZXNob2xkKXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmlzRGF0YS5wdXNoKFtwYXJzZUludChkb2NLZXkpLCBwYXJzZUludCh0b3BpYyksIHJlc3BvbnNlW1wid29yZHNcIl0uaW5kZXhPZih3b3JkKV0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdmlzRGF0YTtcclxufVxyXG5cclxuXHJcbiIsIndpbmRvdy52dWVBcHAgPSBuZXcgVnVlKHtcclxuICAgIGVsOiAnI3Z1ZS1hcHAnLFxyXG4gICAgZGF0YToge1xyXG4gICAgICAgIG1lc3NhZ2U6ICdIZWxsbyB1c2VyIScsXHJcbiAgICAgICAgbm9uZVNlbGVjdGVkOiB0cnVlLFxyXG4gICAgICAgIHNlbGVjdGVkUGFnZTogNSxcclxuICAgICAgICBwbGF5ZXJEZXRhaWw6IHtcclxuICAgICAgICAgICAgbmFtZTogXCI8UGxheWVyIE5hbWU+XCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIG92ZXJ2aWV3RmlsdGVyczoge30sXHJcbiAgICAgICAgbmV3RG9jczogW10sXHJcbiAgICAgICAgc2VsZWN0ZWRNYXA6IDEsXHJcbiAgICAgICAgc3VjY2VzczogZmFsc2UsXHJcbiAgICAgICAgbG9hZGluZzogZmFsc2UsXHJcbiAgICAgICAgZmFpbHVyZTogZmFsc2UsXHJcbiAgICAgICAgbmV3RG9jOiAnJyxcclxuICAgICAgICBuZXdEb2NzUHJvY2Nlc3NlZDogJycsXHJcbiAgICAgICAgc2hvd1Byb2Nlc3NlZDogZmFsc2UsXHJcbiAgICAgICAgc2V0dGluZ3M6IHtcclxuICAgICAgICAgICAgc2VsZWN0ZWRNZXRob2Q6IFwiTERBXCIsXHJcbiAgICAgICAgICAgIHNlbGVjdGVkRGF0YXNldDogMCxcclxuICAgICAgICAgICAgc3RhcnQxOiAwLCAgICAgIC8vSGFwcHlEQlxyXG4gICAgICAgICAgICBlbmQxOiAxMCwgICAgICAgIC8vSGFwcHlEQlxyXG4gICAgICAgICAgICBzdGFydDI6IDAsICAgICAgLy9NZWRpdW1cclxuICAgICAgICAgICAgZW5kMjogNSwgICAgICAgIC8vTWVkaXVtXHJcbiAgICAgICAgICAgIGxkYVRvcGljVGhyZXNob2xkOiAwLFxyXG4gICAgICAgICAgICB3b3JkMlZlY1RocmVzaG9sZDogMFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgcGFyYW1zOiB7XHJcbiAgICAgICAgICAgIHRvcGljVGhyZXNob2xkOiAwLjAyLFxyXG4gICAgICAgICAgICB3b3JkVGhyZXNob2xkOiAwLjAyLFxyXG4gICAgICAgICAgICB3b3JkT3ZlcmFsbFRocmVzaG9sZDogMCxcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG4gICAgbWV0aG9kczoge1xyXG4gICAgICAgIHNlbGVjdFBhZ2U6IGZ1bmN0aW9uKHgpe1xyXG4gICAgICAgICAgICB0aGlzLnNlbGVjdGVkUGFnZSA9IHg7XHJcbiAgICAgICAgICAgIGlmICh4ID09IDEpe1xyXG4gICAgICAgICAgICAgICAgaW5pdFBhZ2UxKHdpbmRvdy5nbG9iYWxfZGF0YSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKHggPT0gMil7XHJcbiAgICAgICAgICAgICAgICBpbml0UGFnZTIod2luZG93Lmdsb2JhbF9kYXRhKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoeCA9PSAzKXtcclxuICAgICAgICAgICAgICAgIGluaXRQYWdlMyh3aW5kb3cuZ2xvYmFsX2RhdGEpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICh4ID09IDQpe1xyXG4gICAgICAgICAgICAgICAgaW5pdFBhZ2U0KHdpbmRvdy5nbG9iYWxfZGF0YSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIGFkZE5ld0RvYzogZnVuY3Rpb24oKXtcclxuICAgICAgICAgICAgaWYgKHRoaXMubmV3RG9jLnRyaW0oKS5zcGxpdChcIiBcIikubGVuZ3RoIDwgMyl7XHJcbiAgICAgICAgICAgICAgICBhbGVydChcIlBsZWFzZSBhZGQgYXQgbGVhc3QgMyB3b3Jkc1wiKTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLm5ld0RvY3MucHVzaCh0aGlzLm5ld0RvYyk7XHJcbiAgICAgICAgICAgIHRoaXMubmV3RG9jID0gJyc7XHJcbiAgICAgICAgICAgIHRoaXMuc2hvd1Byb2Nlc3NlZCA9IGZhbHNlO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgcHJvY2Vzc0RvY3M6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xyXG4gICAgICAgICAgICBnZXRUb2tlbml6ZWREb2NzKHRoaXMubmV3RG9jcywgZnVuY3Rpb24ocmVzcCl7XHJcbiAgICAgICAgICAgICAgICBzZWxmLm5ld0RvY3NQcm9jY2Vzc2VkID0gcmVzcDtcclxuICAgICAgICAgICAgICAgIHNlbGYuc2hvd1Byb2Nlc3NlZCA9IHRydWU7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgc2F2ZUNoYW5nZXM6IGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICAgIHZhciBzZWxmID0gdGhpcztcclxuICAgICAgICAgICAgc2VsZi5zdWNjZXNzID0gZmFsc2U7XHJcbiAgICAgICAgICAgIHNlbGYuZmFpbHVyZSA9IGZhbHNlO1xyXG4gICAgICAgICAgICBpZiAodGhpcy5zZXR0aW5ncy5zZWxlY3RlZERhdGFzZXQgPT0gMCl7XHJcbiAgICAgICAgICAgICAgICBpZih0aGlzLnNldHRpbmdzLmVuZDEgLSB0aGlzLnNldHRpbmdzLnN0YXJ0MSA8IDEwKXtcclxuICAgICAgICAgICAgICAgICAgICBhbGVydChcIlRoZXJlIG5lZWRzIHRvIGJlIGF0bGVhc3QgNSBkb2N1bWVudHMoJiA8PSA1MCkgZm9yIEhhcHB5IERCLiBBbmQgc3RhcnQgaW5kZXggY2FuIG5vdCBiZSBncmVhdGVyIHRoYW4gZW5kLlwiKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYodGhpcy5zZXR0aW5ncy5lbmQxIC0gdGhpcy5zZXR0aW5ncy5zdGFydDEgPiA1MCl7XHJcbiAgICAgICAgICAgICAgICAgICAgYWxlcnQoXCJUaGVyZSBuZWVkcyB0byBiZSBsZXNzIHRoYW4gNTAgZG9jdW1lbnRzIGZvciBIYXBweURCLlwiKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodGhpcy5zZXR0aW5ncy5zZWxlY3RlZERhdGFzZXQgPT0gMSl7XHJcbiAgICAgICAgICAgICAgICBpZih0aGlzLnNldHRpbmdzLmVuZDIgLSB0aGlzLnNldHRpbmdzLnN0YXJ0MiA8IDUpe1xyXG4gICAgICAgICAgICAgICAgICAgIGFsZXJ0KFwiVGhlcmUgbmVlZHMgdG8gYmUgYXRsZWFzdCA1IGRvY3VtZW50cygmIDw9IDMwKSBmb3IgTWVkaXVtIEFydGljbGVzLiBBbmQgc3RhcnQgaW5kZXggY2FuIG5vdCBiZSBncmVhdGVyIHRoYW4gZW5kLlwiKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYodGhpcy5zZXR0aW5ncy5lbmQyIC0gdGhpcy5zZXR0aW5ncy5zdGFydDIgPiAzMCl7XHJcbiAgICAgICAgICAgICAgICAgICAgYWxlcnQoXCJUaGVyZSBuZWVkcyB0byBiZSBsZXNzIHRoYW4gMzAgZG9jdW1lbnRzIGZvciBNZWRpdW0gQXJ0aWNsZXMuXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSBlbHNlIGlmICh0aGlzLnNldHRpbmdzLnNlbGVjdGVkRGF0YXNldCA9PSAyKXtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIXRoaXMuc2hvd1Byb2Nlc3NlZCl7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFsZXJ0KFwiUGxlYXNlIHByb2Nlc3MgYWxsIGRvY3VtZW50cyBmaXJzdFwiKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB3aW5kb3cuZG9jdW1lbnRzID0gdGhpcy5uZXdEb2NzUHJvY2Nlc3NlZDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBzZWxmLmxvYWRpbmcgPSB0cnVlO1xyXG5cclxuICAgICAgICAgICAgZ2V0QW5hbHlzaXModGhpcy5zZXR0aW5ncy5zZWxlY3RlZE1ldGhvZCwgZnVuY3Rpb24ocmVzcCl7XHJcbiAgICAgICAgICAgICAgICBzZWxmLnN1Y2Nlc3MgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgc2VsZi5sb2FkaW5nID0gZmFsc2U7XHJcbiAgICAgICAgICAgIH0sIGZ1bmN0aW9uIChlcnJvclN0YXR1cykge1xyXG4gICAgICAgICAgICAgICAgc2VsZi5sb2FkaW5nID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICBzZWxmLmZhaWx1cmUgPSB0cnVlO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG4gICAgbW91bnRlZDogZnVuY3Rpb24oKXtcclxuICAgICAgICBjb25zb2xlLmxvZyhcIk1vdW50ZWRcIik7XHJcbiAgICAgICAgbG9hZEQzKCk7XHJcbiAgICAgICAgbG9hZEpxdWVyeSgpO1xyXG4gICAgfVxyXG59KTsiLCJmdW5jdGlvbiBsb2FkV29yZENsb3VkKHJlc3Ape1xyXG4gICAgbGV0IGRhdGEgPSBbXTtcclxuICAgIGZvcih2YXIgd29yZCBpbiByZXNwW1wib3ZlcmFsbF93b3JkXCJdKXtcclxuICAgICAgICBsZXQgd2VpZ2h0ID0gcmVzcFtcIm92ZXJhbGxfd29yZFwiXVt3b3JkXTtcclxuICAgICAgICAgZGF0YS5wdXNoKHtcclxuICAgICAgICAgICAgbmFtZTogd29yZCxcclxuICAgICAgICAgICAgd2VpZ2h0OiB3ZWlnaHRcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuICAgIGNyZWF0ZVdvcmRDbG91ZChcIm92ZXJhbGwtd2NcIiwgZGF0YSwgXCJBbGwgRG9jdW1lbnRzXCIpO1xyXG5cclxuICAgIGZvcih2YXIgdG9waWMgaW4gcmVzcFtcInRvcGljX3dvcmRcIl0pe1xyXG4gICAgICAgIGxldCBkYXRhID0gW107XHJcbiAgICAgICAgZm9yKHZhciB3b3JkIGluIHJlc3BbXCJ0b3BpY193b3JkXCJdW3RvcGljXSl7XHJcbiAgICAgICAgICAgIGxldCB3ZWlnaHQgPSByZXNwW1widG9waWNfd29yZFwiXVt0b3BpY11bd29yZF07XHJcbiAgICAgICAgICAgIGRhdGEucHVzaCh7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiB3b3JkLFxyXG4gICAgICAgICAgICAgICAgd2VpZ2h0OiB3ZWlnaHRcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgICQoXCIjdG9waWMtd2NzXCIpLmFwcGVuZCgnPGRpdiBjbGFzcz1cImNvbC1zbS02XCI+PGRpdiBzdHlsZT1cIm91dGxpbmU6IHNvbGlkIDFweDtcIiBpZD1cInRvcGljJyt0b3BpYysnXCIgc3R5bGU9XCJoZWlnaHQ6IDMwMHB4O1wiPjwvZGl2PjwvZGl2PicpO1xyXG4gICAgICAgIGNyZWF0ZVdvcmRDbG91ZChcInRvcGljXCIrdG9waWMsIGRhdGEsIFwiVG9waWMgXCIrdG9waWMpO1xyXG4gICAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBjcmVhdGVXb3JkQ2xvdWQoaWQsIGRhdGEsIHRpdGxlKXtcclxuICAgIEhpZ2hjaGFydHMuY2hhcnQoaWQsIHtcclxuICAgICAgICBzZXJpZXM6IFt7XHJcbiAgICAgICAgICAgIHR5cGU6ICd3b3JkY2xvdWQnLFxyXG4gICAgICAgICAgICBkYXRhOiBkYXRhLFxyXG4gICAgICAgICAgICByb3RhdGlvbjoge1xyXG4gICAgICAgICAgICAgICAgZnJvbTogMCxcclxuICAgICAgICAgICAgICAgIHRvOiAwLFxyXG4gICAgICAgICAgICAgICAgb3JpZW50YXRpb25zOiA1XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIG5hbWU6ICdTY29yZSdcclxuICAgICAgICB9XSxcclxuICAgICAgICB0aXRsZToge1xyXG4gICAgICAgICAgICB0ZXh0OiB0aXRsZVxyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59Il19
