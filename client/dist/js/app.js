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
    if (final_dict.hasOwnProperty(key)) {
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
  var dendogramDataSource = "forestSpecies.json";
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
  renderClusterForceLayout(resp);
}

function initPage3(resp) {
  $("#parallel-coordinate-vis").html("");
  $("#pc-container").html("");
  loadParallelCoordinate(resp);
  loadParallelCoordinatesHC(resp);
}

function initPage4() {
  $("#overall-wc").html();
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
      wordThreshold: 0.02
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNsdXN0ZXJfZm9yY2VfbGF5b3V0LmpzIiwiZXZlbnRzLmpzIiwibWFpbi5qcyIsIm5ldHdvcmsuanMiLCJwYXJhbGxlbC1jb29yZGluYXRlLWhjLmpzIiwicGFyYWxsZWwtY29vcmRpbmF0ZS5qcyIsInNjYXR0ZXJfcGxvdF93aXRoX3dlaWdodHMuanMiLCJzdGFja2VkX2Jhcl9ncmFwaC5qcyIsInV0aWwuanMiLCJ2dWVfbW9kZWwuanMiLCJ3b3JkY2xvdWQuanMiXSwibmFtZXMiOlsiQXJyYXkiLCJwcm90b3R5cGUiLCJjb250YWlucyIsInYiLCJpIiwibGVuZ3RoIiwidW5pcXVlIiwiYXJyIiwiaW5jbHVkZXMiLCJwdXNoIiwicmVuZGVyQ2x1c3RlckZvcmNlTGF5b3V0IiwiZGF0YSIsImRhdGFWYWwiLCJmaW5hbF9kaWN0Iiwia2V5IiwiaGFzT3duUHJvcGVydHkiLCJjaGlsZHJlbldvcmRzIiwiY2hpbGRLZXkiLCJ3aW5kb3ciLCJ2dWVBcHAiLCJwYXJhbXMiLCJ3b3JkVGhyZXNob2xkIiwiY2x1c3Rlcl9kYXRhIiwiY291bnQiLCJoYXNoIiwiYXJyYXlfY2hpbGQiLCJjaGlsZHMiLCJjaGlsZF9oYXNoIiwiY2hpbGRyZW4iLCJkMyIsImQzVjMiLCJyZW5kZXJDbHVzdGVyIiwicmFkaXVzIiwiZGVuZG9ncmFtQ29udGFpbmVyIiwiZGVuZG9ncmFtRGF0YVNvdXJjZSIsInJvb3ROb2RlU2l6ZSIsImxldmVsT25lTm9kZVNpemUiLCJsZXZlbFR3b05vZGVTaXplIiwibGV2ZWxUaHJlZU5vZGVTaXplIiwiZHVyYXRpb24iLCJyb290SnNvbkRhdGEiLCJjbHVzdGVyIiwibGF5b3V0Iiwic2l6ZSIsInNlcGFyYXRpb24iLCJhIiwiYiIsInBhcmVudCIsImRlcHRoIiwiZGlhZ29uYWwiLCJzdmciLCJyYWRpYWwiLCJwcm9qZWN0aW9uIiwiZCIsInkiLCJ4IiwiTWF0aCIsIlBJIiwiY29udGFpbmVyRGl2Iiwic2VsZWN0IiwiZG9jdW1lbnQiLCJnZXRFbGVtZW50QnlJZCIsImFwcGVuZCIsImF0dHIiLCJ0ZXh0Iiwib24iLCJjb2xsYXBzZUxldmVscyIsInN2Z1Jvb3QiLCJjYWxsIiwiYmVoYXZpb3IiLCJ6b29tIiwic2NhbGUiLCJzY2FsZUV4dGVudCIsImFuaW1Hcm91cCIsImZvckVhY2giLCJjb2xsYXBzZSIsImNyZWF0ZUNvbGxhcHNpYmxlRGVuZHJvR3JhbSIsInNvdXJjZSIsIm5vZGVzIiwicGF0aGxpbmtzIiwibGlua3MiLCJub2RlIiwic2VsZWN0QWxsIiwiaWQiLCJub2RlRW50ZXIiLCJlbnRlciIsInRvZ2dsZUNoaWxkcmVuIiwiYWxpYXMiLCJuYW1lIiwibm9kZVVwZGF0ZSIsInRyYW5zaXRpb24iLCJzdHlsZSIsImNvbG9yIiwib3JkZXIiLCJub2RlRXhpdCIsImV4aXQiLCJyZW1vdmUiLCJsaW5rIiwidGFyZ2V0IiwiaW5zZXJ0IiwibyIsIngwIiwieTAiLCJjbGlja1R5cGUiLCJfY2hpbGRyZW4iLCJ0eXBlIiwidW5kZWZpbmVkIiwiaGlnaGxpZ2h0Tm9kZVNlbGVjdGlvbnMiLCJoaWdobGlnaHRSb290VG9Ob2RlUGF0aCIsImhpZ2hsaWdodExpbmtDb2xvciIsImRlZmF1bHRMaW5rQ29sb3IiLCJub2RlQ29sb3IiLCJwYXRoTGlua3MiLCJkZCIsImFuY2VzdG9ycyIsIl8iLCJpc1VuZGVmaW5lZCIsIm1hdGNoZWRMaW5rcyIsImZpbHRlciIsImFueSIsInAiLCJlYWNoIiwiYW5pbWF0ZUNoYWlucyIsImNsYXNzZWQiLCJvdmVybGF5Qm94IiwiZ2V0QkJveCIsImV2ZW50IiwidHJhbnNsYXRlIiwiY2hlY2tGb3JUaGlyZExldmVsT3BlbkNoaWxkcmVuIiwidG9nZ2xlQWxsU2Vjb25kTGV2ZWxDaGlsZHJlbiIsInRvZ2dsZVNlY29uZExldmVsQ2hpbGRyZW4iLCJyb290SW5kZXgiLCJyb290TGVuZ3RoIiwiaXNOb2RlT3BlbiIsImNoaWxkSW5kZXgiLCJjaGlsZExlbmd0aCIsInNlY29uZExldmVsQ2hpbGQiLCJsb2FkSnF1ZXJ5IiwiJCIsInJlYWR5IiwiY2xpY2siLCJzaWRlYmFyIiwicmVxdWlyZSIsImNvbmZpZyIsInBhdGhzIiwibG9hZEQzIiwiZDNPbGQiLCJkb2N1bWVudHMiLCJnZXRBbmFseXNpcyIsImdldERvY3MiLCJ0ZXh0cyIsIm1hcCIsInNwbGl0IiwibWV0aG9kIiwic3VjY2VzcyIsImZhaWwiLCJkb2NzIiwiZm5jIiwiZ2V0TERBQ2x1c3RlcnMiLCJnZXRXb3JkMlZlY0NsdXN0ZXJzIiwibG9hZERGdW5jIiwicmVzcCIsImdsb2JhbF9kYXRhIiwiaW5pdFBhZ2UxIiwiaW5pdFBhZ2UyIiwiaW5pdFBhZ2UzIiwiaW5pdFBhZ2U0IiwibG9hZFZpc3VhbGl6YXRpb25zIiwicmVuZGVyQ2x1c3RlckFuYWx5c2lzIiwiaHRtbCIsImxvYWRQYXJhbGxlbENvb3JkaW5hdGUiLCJsb2FkUGFyYWxsZWxDb29yZGluYXRlc0hDIiwibG9hZFdvcmRDbG91ZCIsImdldDJEVmVjdG9ycyIsInZlY3RvcnMiLCJzdWNjZXNzQ2FsbGJhY2siLCJyZXF1ZXN0IiwiYWpheCIsInVybCIsImRvbmUiLCJyZXNwb25zZSIsImpxWEhSIiwidGV4dFN0YXR1cyIsImFsZXJ0IiwiZ2V0VG9rZW5pemVkRG9jcyIsImZhaWx1cmVDYWxsYmFjayIsIkpTT04iLCJzdHJpbmdpZnkiLCJjb250ZW50VHlwZSIsImRhdGFUeXBlIiwic3RhcnQiLCJzZXR0aW5ncyIsInN0YXJ0MiIsImVuZCIsImVuZDIiLCJzZWxlY3RlZCIsInNlbGVjdGVkRGF0YXNldCIsInBhcnNlIiwic3RhcnQxIiwiZW5kMSIsImdlbmVyYXRlUGFyYWxsZWxDb29yZGluYXRlRGF0YUhDIiwidG9waWNUaHJlc2hvbGQiLCJIaWdoY2hhcnRzIiwiY2hhcnQiLCJwYXJhbGxlbENvb3JkaW5hdGVzIiwicGFyYWxsZWxBeGVzIiwibGluZVdpZHRoIiwidGl0bGUiLCJwbG90T3B0aW9ucyIsInNlcmllcyIsImFuaW1hdGlvbiIsIm1hcmtlciIsImVuYWJsZWQiLCJzdGF0ZXMiLCJob3ZlciIsImhhbG8iLCJldmVudHMiLCJtb3VzZU92ZXIiLCJncm91cCIsInRvRnJvbnQiLCJ4QXhpcyIsImNhdGVnb3JpZXMiLCJvZmZzZXQiLCJ5QXhpcyIsIk9iamVjdCIsImtleXMiLCJ2YWx1ZXMiLCJjb2xvcnMiLCJzZXQiLCJzaGFkb3ciLCJtYXJnaW4iLCJ0b3AiLCJyaWdodCIsImJvdHRvbSIsImxlZnQiLCJ3aWR0aCIsImhlaWdodCIsIm9yZGluYWwiLCJyYW5nZVBvaW50cyIsImRyYWdnaW5nIiwibGluZSIsImJhY2tncm91bmQiLCJmb3JlZ3JvdW5kIiwiZGltZW5zaW9ucyIsImNhcnMiLCJnZW5lcmF0ZVBhcmFsbGVsQ29vcmRpbmF0ZURhdGEiLCJheGlzRCIsImF4aXMiLCJvcmllbnQiLCJ0aWNrVmFsdWVzIiwicGFyc2VJbnQiLCJheGlzVCIsImF4aXNXIiwicGFyc2VGbG9hdCIsImRvbWFpbiIsImxpbmVhciIsImV4dGVudCIsInJhbmdlIiwicGF0aCIsImciLCJkcmFnIiwib3JpZ2luIiwibWluIiwibWF4Iiwic29ydCIsInBvc2l0aW9uIiwiZGVsYXkiLCJicnVzaCIsImJydXNoc3RhcnQiLCJzb3VyY2VFdmVudCIsInN0b3BQcm9wYWdhdGlvbiIsImFjdGl2ZXMiLCJlbXB0eSIsImV4dGVudHMiLCJldmVyeSIsImRvY3VtZW50X3RvcGljIiwidG9waWNfdmVjdG9ycyIsImJiIiwicXVlcnlTZWxlY3RvciIsImdldEJvdW5kaW5nQ2xpZW50UmVjdCIsInZhbHVlIiwiYyIsImxhYmVsWCIsImxhYmVsWSIsInNjYWxlTGluZWFyIiwic2NhbGVTcXJ0Iiwib3BhY2l0eSIsImF4aXNCb3R0b20iLCJheGlzTGVmdCIsInJlbmRlckJhckdyYXBoIiwiZmFkZSIsImZhZGVPdXQiLCJ0b3BpY19udW1iZXIiLCJmaW5hbF9kYXRhIiwidGVtcCIsIlN0YXRlIiwidG9waWNfZnJlcXVlbmN5IiwiYWJzIiwib3ZlcmFsbCIsInRvdGFsIiwiY29uc29sZSIsImxvZyIsInNjYWxlQmFuZCIsInJhbmdlUm91bmQiLCJwYWRkaW5nSW5uZXIiLCJhbGlnbiIsInoiLCJzY2FsZU9yZGluYWwiLCJuaWNlIiwic3RhY2siLCJiYW5kd2lkdGgiLCJ0aWNrcyIsInBvcCIsImxlZ2VuZCIsInNsaWNlIiwicmV2ZXJzZSIsImtleXMxIiwic3ZnMSIsImdlbmVyYXRlVG9waWNWZWN0b3JzIiwidG9waWNWZWN0b3JzIiwidG9waWNfd29yZF9wcm9iYWJpbGl0eV9pbl90b3BpYyIsInZlY3RvciIsInRvcGljX3RocmVzaG9sZCIsIndvcmRfdGhyZXNob2xkIiwidmlzRGF0YSIsImRvY0tleSIsInRvcGljIiwidG9waWNTY29yZSIsIndvcmQiLCJ3b3JkU2NvcmUiLCJpbmRleE9mIiwiVnVlIiwiZWwiLCJtZXNzYWdlIiwibm9uZVNlbGVjdGVkIiwic2VsZWN0ZWRQYWdlIiwicGxheWVyRGV0YWlsIiwib3ZlcnZpZXdGaWx0ZXJzIiwibmV3RG9jcyIsInNlbGVjdGVkTWFwIiwibG9hZGluZyIsImZhaWx1cmUiLCJuZXdEb2MiLCJuZXdEb2NzUHJvY2Nlc3NlZCIsInNob3dQcm9jZXNzZWQiLCJzZWxlY3RlZE1ldGhvZCIsImxkYVRvcGljVGhyZXNob2xkIiwid29yZDJWZWNUaHJlc2hvbGQiLCJtZXRob2RzIiwic2VsZWN0UGFnZSIsImFkZE5ld0RvYyIsInRyaW0iLCJwcm9jZXNzRG9jcyIsInNlbGYiLCJzYXZlQ2hhbmdlcyIsImVycm9yU3RhdHVzIiwibW91bnRlZCIsIndlaWdodCIsImNyZWF0ZVdvcmRDbG91ZCIsInJvdGF0aW9uIiwiZnJvbSIsInRvIiwib3JpZW50YXRpb25zIl0sIm1hcHBpbmdzIjoiOzs7O0FBQUFBLEtBQUssQ0FBQ0MsU0FBTixDQUFnQkMsUUFBaEIsR0FBMkIsVUFBU0MsQ0FBVCxFQUFZO0FBQ25DLE9BQUksSUFBSUMsQ0FBQyxHQUFHLENBQVosRUFBZUEsQ0FBQyxHQUFHLEtBQUtDLE1BQXhCLEVBQWdDRCxDQUFDLEVBQWpDLEVBQXFDO0FBQ2pDLFFBQUcsS0FBS0EsQ0FBTCxNQUFZRCxDQUFmLEVB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dUIscUVBQW1Fd1EsS0FBbkUsR0FBeUUsdUNBQWhHO0FBQ0FnQyxJQUFBQSxlQUFlLENBQUMsVUFBUWhDLEtBQVQsRUFBZ0IzVCxLQUFoQixFQUFzQixXQUFTMlQsS0FBL0IsQ0FBZjtBQUNIO0FBQ0o7O0FBRUQsU0FBU2dDLGVBQVQsQ0FBeUJuUixFQUF6QixFQUE2QnhFLElBQTdCLEVBQW1Db00sS0FBbkMsRUFBeUM7QUFDckNMLEVBQUFBLFVBQVUsQ0FBQ0MsS0FBWCxDQUFpQnhILEVBQWpCLEVBQXFCO0FBQ2pCOEgsSUFBQUEsTUFBTSxFQUFFLENBQUM7QUFDTHhHLE1BQUFBLElBQUksRUFBRSxXQUREO0FBRUw5RixNQUFBQSxJQUFJLEVBQUVBLElBRkQ7QUFHTDRWLE1BQUFBLFFBQVEsRUFBRTtBQUNOQyxRQUFBQSxJQUFJLEVBQUUsQ0FEQTtBQUVOQyxRQUFBQSxFQUFFLEVBQUUsQ0FGRTtBQUdOQyxRQUFBQSxZQUFZLEVBQUU7QUFIUixPQUhMO0FBUUxsUixNQUFBQSxJQUFJLEVBQUU7QUFSRCxLQUFELENBRFM7QUFXakJ1SCxJQUFBQSxLQUFLLEVBQUU7QUFDSC9JLE1BQUFBLElBQUksRUFBRStJO0FBREg7QUFYVSxHQUFyQjtBQWVIIiwiZmlsZSI6ImFwcC5qcyIsInNvdXJjZXNDb250ZW50IjpbIkFycmF5LnByb3RvdHlwZS5jb250YWlucyA9IGZ1bmN0aW9uKHYpIHtcclxuICAgIGZvcih2YXIgaSA9IDA7IGkgPCB0aGlzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgaWYodGhpc1tpXSA9PT0gdikgcmV0dXJuIHRydWU7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbn07XHJcblxyXG5BcnJheS5wcm90b3R5cGUudW5pcXVlID0gZnVuY3Rpb24oKSB7XHJcbiAgICB2YXIgYXJyID0gW107XHJcbiAgICBmb3IodmFyIGkgPSAwOyBpIDwgdGhpcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgIGlmKCFhcnIuaW5jbHVkZXModGhpc1tpXSkpIHtcclxuICAgICAgICAgICAgYXJyLnB1c2godGhpc1tpXSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIGFycjsgXHJcbn1cclxuXHJcbmZ1bmN0aW9uIHJlbmRlckNsdXN0ZXJGb3JjZUxheW91dChkYXRhKXtcclxuXHR2YXIgZGF0YVZhbCA9IGRhdGFbXCJ0b3BpY193b3JkXCJdO1xyXG5cdHZhciBmaW5hbF9kaWN0ID0ge307XHJcblx0Zm9yICh2YXIga2V5IGluIGRhdGFWYWwpIHtcclxuXHQgICAgaWYgKGRhdGFWYWwuaGFzT3duUHJvcGVydHkoa2V5KSkge1xyXG5cclxuXHQgICAgXHR2YXIgY2hpbGRyZW5Xb3JkcyA9IGRhdGFWYWxba2V5XTtcclxuXHJcblx0ICAgIFx0Zm9yKHZhciBjaGlsZEtleSBpbiBjaGlsZHJlbldvcmRzKXtcclxuXHJcblx0ICAgIFx0XHRpZiAoY2hpbGRyZW5Xb3Jkcy5oYXNPd25Qcm9wZXJ0eShjaGlsZEtleSkgJiYgY2hpbGRyZW5Xb3Jkc1tjaGlsZEtleV0gPiB3aW5kb3cudnVlQXBwLnBhcmFtcy53b3JkVGhyZXNob2xkKSB7XHJcblxyXG5cdCAgICBcdFx0XHRpZighKGNoaWxkS2V5IGluIGZpbmFsX2RpY3QpKXtcclxuXHQgICAgXHRcdFx0XHRmaW5hbF9kaWN0W2NoaWxkS2V5XSA9IFtdO1xyXG5cdCAgICBcdFx0XHR9XHJcbiAgICBcdFx0XHRcdGZpbmFsX2RpY3RbY2hpbGRLZXldLnB1c2goa2V5KTtcclxuXHQgICAgXHRcdFx0XHJcblx0ICAgIFx0XHR9XHJcblx0ICAgIFx0fSBcclxuXHQgICAgfVxyXG4gIFx0fVxyXG4gIFx0dmFyIGNsdXN0ZXJfZGF0YSA9IHtcclxuICBcdFx0XCJuYW1lXCI6XCJcIixcclxuICBcdFx0XCJjaGlsZHJlblwiOltdXHJcbiAgXHR9XHJcblxyXG4gIFx0dmFyIGNvdW50PTA7XHJcbiAgXHRmb3IodmFyIGtleSBpbiBmaW5hbF9kaWN0KXtcclxuICBcdFx0aWYgKGZpbmFsX2RpY3QuaGFzT3duUHJvcGVydHkoa2V5KSkge1xyXG4gIFx0XHRcdGNvdW50ID0gY291bnQgKyAxO1xyXG4gIFx0XHRcdHZhciBoYXNoID0ge307XHJcbiAgXHRcdFx0aGFzaFtcIm9yZGVyXCJdID0gY291bnQ7XHJcbiAgXHRcdFx0aGFzaFtcImFsaWFzXCJdID0gXCJXaGl0ZS9yZWQvamFjayBwaW5lXCI7XHJcbiAgXHRcdFx0aGFzaFtcImNvbG9yXCJdID0gXCIjQzdFQUZCXCI7XHJcbiAgXHRcdFx0aGFzaFtcIm5hbWVcIl0gPSBrZXk7XHJcblxyXG5cclxuICBcdFx0XHR2YXIgYXJyYXlfY2hpbGQgPSBmaW5hbF9kaWN0W2tleV0udW5pcXVlKCk7XHJcbiAgXHRcdFx0dmFyIGNoaWxkcyA9W107XHJcbiAgXHRcdFx0Zm9yKHZhciBpPTA7IGkgPCBhcnJheV9jaGlsZC5sZW5ndGg7aSsrKXtcclxuICBcdFx0XHRcdHZhciBjaGlsZF9oYXNoID0ge307XHJcbiAgXHRcdFx0XHRjaGlsZF9oYXNoW1wib3JkZXJcIl0gPSBpKzE7XHJcbiAgXHRcdFx0XHRjaGlsZF9oYXNoW1wiYWxpYXNcIl0gPSBpKzEgKyBcIlwiO1xyXG4gIFx0XHRcdFx0Y2hpbGRfaGFzaFtcImNvbG9yXCJdID0gXCIjQzdFQUZCXCI7XHJcbiAgXHRcdFx0XHRjaGlsZF9oYXNoW1wibmFtZVwiXT0gYXJyYXlfY2hpbGRbaV07XHJcbiAgXHRcdFx0XHRjaGlsZHMucHVzaChjaGlsZF9oYXNoKTtcclxuICBcdFx0XHR9XHJcbiAgXHRcdFx0aGFzaFtcImNoaWxkcmVuXCJdID0gY2hpbGRzO1xyXG4gIFx0XHRcdGNsdXN0ZXJfZGF0YS5jaGlsZHJlbi5wdXNoKGhhc2gpO1xyXG4gIFx0XHR9XHJcbiAgXHR9XHJcbiAgXHR2YXIgZDMgPSAgIHdpbmRvdy5kM1YzO1xyXG4gIFx0cmVuZGVyQ2x1c3RlcihjbHVzdGVyX2RhdGEsIGQzKTtcclxufVxyXG5cclxuZnVuY3Rpb24gcmVuZGVyQ2x1c3RlcihjbHVzdGVyX2RhdGEsIGQzKXtcclxuICB2YXIgcmFkaXVzID0gMjAwO1xyXG4gIHZhciBkZW5kb2dyYW1Db250YWluZXIgPSBcInNwZWNpZXNjb2xsYXBzaWJsZVwiO1xyXG4gIHZhciBkZW5kb2dyYW1EYXRhU291cmNlID0gXCJmb3Jlc3RTcGVjaWVzLmpzb25cIjtcclxuXHJcbiAgdmFyIHJvb3ROb2RlU2l6ZSA9IDY7XHJcbiAgdmFyIGxldmVsT25lTm9kZVNpemUgPSAzO1xyXG4gIHZhciBsZXZlbFR3b05vZGVTaXplID0gMztcclxuICB2YXIgbGV2ZWxUaHJlZU5vZGVTaXplID0gMjtcclxuXHJcblxyXG4gIHZhciBpID0gMDtcclxuICB2YXIgZHVyYXRpb24gPSAzMDA7IC8vQ2hhbmdpbmcgdmFsdWUgZG9lc24ndCBzZWVtIGFueSBjaGFuZ2VzIGluIHRoZSBkdXJhdGlvbiA/P1xyXG5cclxuICB2YXIgcm9vdEpzb25EYXRhO1xyXG5cclxuICB2YXIgY2x1c3RlciA9IGQzLmxheW91dC5jbHVzdGVyKClcclxuICAgICAgLnNpemUoWzM2MCxyYWRpdXMgLSAxMjBdKVxyXG4gICAgICAuc2VwYXJhdGlvbihmdW5jdGlvbihhLCBiKSB7XHJcbiAgICAgICAgcmV0dXJuIChhLnBhcmVudCA9PSBiLnBhcmVudCA/IDEgOiAyKSAvIGEuZGVwdGg7XHJcbiAgICAgIH0pO1xyXG5cclxuICB2YXIgZGlhZ29uYWwgPSBkMy5zdmcuZGlhZ29uYWwucmFkaWFsKClcclxuICAgICAgLnByb2plY3Rpb24oZnVuY3Rpb24oZCkgeyByZXR1cm4gW2QueSwgZC54IC8gMTgwICogTWF0aC5QSV07IH0pO1xyXG5cclxuICB2YXIgY29udGFpbmVyRGl2ID0gZDMuc2VsZWN0KGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGRlbmRvZ3JhbUNvbnRhaW5lcikpO1xyXG5cclxuICBjb250YWluZXJEaXYuYXBwZW5kKFwiYnV0dG9uXCIpXHJcbiAgICAgIC5hdHRyKFwiaWRcIixcImNvbGxhcHNlLWJ1dHRvblwiKVxyXG4gICAgICAudGV4dChcIkNvbGxhcHNlIVwiKVxyXG4gICAgICAub24oXCJjbGlja1wiLGNvbGxhcHNlTGV2ZWxzKTtcclxuXHJcbiAgdmFyIHN2Z1Jvb3QgPSBjb250YWluZXJEaXYuYXBwZW5kKFwic3ZnOnN2Z1wiKVxyXG4gICAgICAuYXR0cihcIndpZHRoXCIsIFwiMTAwJVwiKVxyXG4gICAgICAuYXR0cihcImhlaWdodFwiLCBcIjEwMCVcIilcclxuICAgICAgLmF0dHIoXCJ2aWV3Qm94XCIsIFwiLVwiICsgKHJhZGl1cykgKyBcIiAtXCIgKyAocmFkaXVzIC0gNTApICtcIiBcIisgcmFkaXVzKjIgK1wiIFwiKyByYWRpdXMqMilcclxuICAgICAgLmNhbGwoZDMuYmVoYXZpb3Iuem9vbSgpLnNjYWxlKDAuOSkuc2NhbGVFeHRlbnQoWzAuMSwgM10pLm9uKFwiem9vbVwiLCB6b29tKSkub24oXCJkYmxjbGljay56b29tXCIsIG51bGwpXHJcbiAgICAgIC5hcHBlbmQoXCJzdmc6Z1wiKTtcclxuXHJcbiAgLy8gQWRkIHRoZSBjbGlwcGluZyBwYXRoXHJcbiAgc3ZnUm9vdC5hcHBlbmQoXCJzdmc6Y2xpcFBhdGhcIikuYXR0cihcImlkXCIsIFwiY2xpcHBlci1wYXRoXCIpXHJcbiAgICAgIC5hcHBlbmQoXCJzdmc6cmVjdFwiKVxyXG4gICAgICAuYXR0cignaWQnLCAnY2xpcC1yZWN0LWFuaW0nKTtcclxuXHJcbiAgdmFyIGFuaW1Hcm91cCA9IHN2Z1Jvb3QuYXBwZW5kKFwic3ZnOmdcIilcclxuICAgICAgLmF0dHIoXCJjbGlwLXBhdGhcIiwgXCJ1cmwoI2NsaXBwZXItcGF0aClcIik7XHJcblxyXG4gIFx0cm9vdEpzb25EYXRhID0gY2x1c3Rlcl9kYXRhO1xyXG5cclxuICAgIC8vU3RhcnQgd2l0aCBhbGwgY2hpbGRyZW4gY29sbGFwc2VkXHJcbiAgICByb290SnNvbkRhdGEuY2hpbGRyZW4uZm9yRWFjaChjb2xsYXBzZSk7XHJcblxyXG4gICAgLy9Jbml0aWFsaXplIHRoZSBkZW5kcm9ncmFtXHJcbiAgXHRjcmVhdGVDb2xsYXBzaWJsZURlbmRyb0dyYW0ocm9vdEpzb25EYXRhKTtcclxuXHJcblxyXG5cclxuXHJcbiAgZnVuY3Rpb24gY3JlYXRlQ29sbGFwc2libGVEZW5kcm9HcmFtKHNvdXJjZSkge1xyXG5cclxuICAgIC8vIENvbXB1dGUgdGhlIG5ldyB0cmVlIGxheW91dC5cclxuICAgIHZhciBub2RlcyA9IGNsdXN0ZXIubm9kZXMocm9vdEpzb25EYXRhKTtcclxuICAgIHZhciBwYXRobGlua3MgPSBjbHVzdGVyLmxpbmtzKG5vZGVzKTtcclxuXHJcbiAgICAvLyBOb3JtYWxpemUgZm9yIG5vZGVzJyBmaXhlZC1kZXB0aC5cclxuICAgIG5vZGVzLmZvckVhY2goZnVuY3Rpb24oZCkge1xyXG4gICAgICBpZihkLmRlcHRoIDw9Mil7XHJcbiAgICAgICAgZC55ID0gZC5kZXB0aCo3MDtcclxuICAgICAgfWVsc2VcclxuICAgICAge1xyXG4gICAgICAgIGQueSA9IGQuZGVwdGgqMTAwO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBVcGRhdGUgdGhlIG5vZGVz4oCmXHJcbiAgICB2YXIgbm9kZSA9IHN2Z1Jvb3Quc2VsZWN0QWxsKFwiZy5ub2RlXCIpXHJcbiAgICAgICAgLmRhdGEobm9kZXMsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQuaWQgfHwgKGQuaWQgPSArK2kpOyB9KTtcclxuXHJcbiAgICAvLyBFbnRlciBhbnkgbmV3IG5vZGVzIGF0IHRoZSBwYXJlbnQncyBwcmV2aW91cyBwb3NpdGlvbi5cclxuICAgIHZhciBub2RlRW50ZXIgPSBub2RlLmVudGVyKCkuYXBwZW5kKFwiZ1wiKVxyXG4gICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJub2RlXCIpXHJcbiAgICAgICAgLm9uKFwiY2xpY2tcIiwgdG9nZ2xlQ2hpbGRyZW4pO1xyXG5cclxuICAgIG5vZGVFbnRlci5hcHBlbmQoXCJjaXJjbGVcIik7XHJcblxyXG4gICAgbm9kZUVudGVyLmFwcGVuZChcInRleHRcIilcclxuICAgIC5hdHRyKFwieFwiLCAxMClcclxuICAgIC5hdHRyKFwiZHlcIiwgXCIuMzVlbVwiKVxyXG4gICAgLmF0dHIoXCJ0ZXh0LWFuY2hvclwiLCBcInN0YXJ0XCIpXHJcbiAgICAudGV4dChmdW5jdGlvbihkKSB7XHJcbiAgICAgICAgICBpZihkLmRlcHRoID09PSAyKXtcclxuICAgICAgICAgICAgcmV0dXJuIGQuYWxpYXM7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgIHJldHVybiBkLm5hbWU7XHJcbiAgICB9KTtcclxuXHJcblxyXG4gICAgLy8gVHJhbnNpdGlvbiBub2RlcyB0byB0aGVpciBuZXcgcG9zaXRpb24uXHJcbiAgICB2YXIgbm9kZVVwZGF0ZSA9IG5vZGUudHJhbnNpdGlvbigpXHJcbiAgICAgICAgLmR1cmF0aW9uKGR1cmF0aW9uKVxyXG4gICAgICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIFwicm90YXRlKFwiICsgKGQueCAtIDkwKSArIFwiKXRyYW5zbGF0ZShcIiArIGQueSArIFwiKVwiOyB9KVxyXG5cclxuICAgIG5vZGVVcGRhdGUuc2VsZWN0KFwiY2lyY2xlXCIpXHJcbiAgICAgICAgLmF0dHIoXCJyXCIsIGZ1bmN0aW9uKGQpe1xyXG4gICAgICAgICAgICBpZiAoZC5kZXB0aCA9PSAwKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcm9vdE5vZGVTaXplO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICBlbHNlIGlmIChkLmRlcHRoID09PSAxKSB7XHJcbiAgICAgICAgICAgICAgICAgIHJldHVybiBsZXZlbE9uZU5vZGVTaXplO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICBlbHNlIGlmIChkLmRlcHRoID09PSAyKSB7XHJcbiAgICAgICAgICAgICAgICAgIHJldHVybiBsZXZlbFR3b05vZGVTaXplO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgcmV0dXJuIGxldmVsVGhyZWVOb2RlU2l6ZTtcclxuXHJcbiAgICAgICAgfSlcclxuICAgICAgICAuc3R5bGUoXCJmaWxsXCIsIGZ1bmN0aW9uKGQpIHtcclxuICAgICAgICAgICAgICAgaWYoZC5kZXB0aCA9PT0wKXtcclxuICAgICAgICAgICAgICAgIHJldHVybiBcIiM4MDgwODBcIjtcclxuICAgICAgICAgICAgICAgfWVsc2UgaWYoZC5kZXB0aCA9PT0gMSl7XHJcbiAgICAgICAgICAgICAgICBpZihkLm5hbWU9PVwiSGFyZHdvb2RzXCIpIHJldHVybiBcIiM4MTY4NTRcIjtcclxuICAgICAgICAgICAgICAgIHJldHVybiBcIiNDM0I5QTBcIjtcclxuICAgICAgICAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZC5jb2xvcjtcclxuICAgICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLnN0eWxlKFwic3Ryb2tlXCIsZnVuY3Rpb24oZCl7XHJcbiAgICAgICAgICAgICAgaWYoZC5kZXB0aD4xKXtcclxuICAgICAgICAgICAgICAgICAgcmV0dXJuIFwid2hpdGVcIjtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgZWxzZXtcclxuICAgICAgICAgICAgICAgICAgcmV0dXJuIFwibGlnaHRncmF5XCI7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgIG5vZGVVcGRhdGUuc2VsZWN0KFwidGV4dFwiKVxyXG5cclxuICAgICAgICAuYXR0cignaWQnLCBmdW5jdGlvbihkKXtcclxuICAgICAgICAgIHZhciBvcmRlciA9IDA7XHJcbiAgICAgICAgICBpZihkLm9yZGVyKW9yZGVyID0gZC5vcmRlcjtcclxuICAgICAgICAgIHJldHVybiAnVC0nICsgZC5kZXB0aCArIFwiLVwiICsgb3JkZXI7XHJcbiAgICAgICAgfSlcclxuICAgICAgICAuYXR0cihcInRleHQtYW5jaG9yXCIsIGZ1bmN0aW9uIChkKSB7XHJcbiAgICAgICAgICAgIGlmIChkLmRlcHRoID09PSAxKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZC54IDwgMTgwID8gXCJlbmRcIiA6IFwic3RhcnRcIjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gZC54IDwgMTgwID8gXCJzdGFydFwiIDogXCJlbmRcIjtcclxuICAgICAgICB9KVxyXG4gICAgICAgIC5hdHRyKFwiZHlcIiwgZnVuY3Rpb24oZCl7XHJcbiAgICAgICAgICAgIGlmIChkLmRlcHRoID09PSAxKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZC54IDwgMTgwID8gXCIxLjRlbVwiIDogXCItMC4yZW1cIjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gXCIuMzFlbVwiO1xyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLmF0dHIoXCJkeFwiLCBmdW5jdGlvbiAoZCkge1xyXG4gICAgICAgICAgICBpZiAoZC5kZXB0aCA9PT0gMSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIDA7IC8vcmV0dXJuIGQueCA+IDE4MCA/IDIgOiAtMjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gZC54IDwgMTgwID8gMSA6IC0yMDtcclxuICAgICAgICB9KVxyXG4gICAgICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIGZ1bmN0aW9uIChkKSB7XHJcbiAgICAgICAgICAgIGlmIChkLmRlcHRoIDwgMikge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIFwicm90YXRlKFwiICsgKDkwIC0gZC54KSArIFwiKVwiO1xyXG4gICAgICAgICAgICB9ZWxzZSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZC54IDwgMTgwID8gbnVsbCA6IFwicm90YXRlKDE4MClcIjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgIC8vIFRPRE86IGFwcHJvcHJpYXRlIHRyYW5zZm9ybVxyXG4gICAgdmFyIG5vZGVFeGl0ID0gbm9kZS5leGl0KCkudHJhbnNpdGlvbigpXHJcbiAgICAgICAgLmR1cmF0aW9uKGR1cmF0aW9uKVxyXG4gICAgICAgIC5yZW1vdmUoKTtcclxuXHJcbiAgICAvLyBVcGRhdGUgdGhlIGxpbmtz4oCmXHJcbiAgICB2YXIgbGluayA9IHN2Z1Jvb3Quc2VsZWN0QWxsKFwicGF0aC5saW5rXCIpXHJcbiAgICAgICAgLmRhdGEocGF0aGxpbmtzLCBmdW5jdGlvbihkKSB7IHJldHVybiBkLnRhcmdldC5pZDsgfSk7XHJcblxyXG4gICAgLy8gRW50ZXIgYW55IG5ldyBsaW5rcyBhdCB0aGUgcGFyZW50J3MgcHJldmlvdXMgcG9zaXRpb24uXHJcbiAgICBsaW5rLmVudGVyKCkuaW5zZXJ0KFwicGF0aFwiLCBcImdcIilcclxuICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwibGlua1wiKVxyXG4gICAgICAgIC5hdHRyKFwiZFwiLCBmdW5jdGlvbihkKSB7XHJcbiAgICAgICAgICB2YXIgbyA9IHt4OiBzb3VyY2UueDAsIHk6IHNvdXJjZS55MH07XHJcbiAgICAgICAgICByZXR1cm4gZGlhZ29uYWwoe3NvdXJjZTogbywgdGFyZ2V0OiBvfSk7XHJcbiAgICAgICAgfSlcclxuICAgICAgICAuc3R5bGUoXCJmaWxsXCIsZnVuY3Rpb24oZCl7XHJcbiAgICAgICAgICByZXR1cm4gZC5jb2xvcjtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAvLyBUcmFuc2l0aW9uIGxpbmtzIHRvIHRoZWlyIG5ldyBwb3NpdGlvbi5cclxuICAgIGxpbmsudHJhbnNpdGlvbigpXHJcbiAgICAgICAgLmR1cmF0aW9uKGR1cmF0aW9uKVxyXG4gICAgICAgIC5hdHRyKFwiZFwiLCBkaWFnb25hbCk7XHJcblxyXG4gICAgLy8gVHJhbnNpdGlvbiBleGl0aW5nIG5vZGVzIHRvIHRoZSBwYXJlbnQncyBuZXcgcG9zaXRpb24uXHJcbiAgICBsaW5rLmV4aXQoKS50cmFuc2l0aW9uKClcclxuICAgICAgICAuZHVyYXRpb24oZHVyYXRpb24pXHJcbiAgICAgICAgLmF0dHIoXCJkXCIsIGZ1bmN0aW9uKGQpIHtcclxuICAgICAgICAgIHZhciBvID0ge3g6IHNvdXJjZS54LCB5OiBzb3VyY2UueX07XHJcbiAgICAgICAgICByZXR1cm4gZGlhZ29uYWwoe3NvdXJjZTogbywgdGFyZ2V0OiBvfSk7XHJcbiAgICAgICAgfSlcclxuICAgICAgICAucmVtb3ZlKCk7XHJcbiAgfVxyXG5cclxuICAvLyBUb2dnbGUgY2hpbGRyZW4gb24gY2xpY2suXHJcbiAgZnVuY3Rpb24gdG9nZ2xlQ2hpbGRyZW4oZCxjbGlja1R5cGUpIHtcclxuICAgIGlmIChkLmNoaWxkcmVuKSB7XHJcbiAgICAgIGQuX2NoaWxkcmVuID0gZC5jaGlsZHJlbjtcclxuICAgICAgZC5jaGlsZHJlbiA9IG51bGw7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBkLmNoaWxkcmVuID0gZC5fY2hpbGRyZW47XHJcbiAgICAgIGQuX2NoaWxkcmVuID0gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgdHlwZSA9IHR5cGVvZiBjbGlja1R5cGUgPT0gdW5kZWZpbmVkID8gXCJub2RlXCIgOiBjbGlja1R5cGU7XHJcblxyXG4gICAgLy9BY3Rpdml0aWVzIG9uIG5vZGUgY2xpY2tcclxuICAgIGNyZWF0ZUNvbGxhcHNpYmxlRGVuZHJvR3JhbShkKTtcclxuICAgIGhpZ2hsaWdodE5vZGVTZWxlY3Rpb25zKGQpO1xyXG5cclxuICAgIGhpZ2hsaWdodFJvb3RUb05vZGVQYXRoKGQsdHlwZSk7XHJcblxyXG4gIH1cclxuXHJcbiAgLy8gQ29sbGFwc2Ugbm9kZXNcclxuICBmdW5jdGlvbiBjb2xsYXBzZShkKSB7XHJcbiAgICBpZiAoZC5jaGlsZHJlbikge1xyXG4gICAgICAgIGQuX2NoaWxkcmVuID0gZC5jaGlsZHJlbjtcclxuICAgICAgICBkLl9jaGlsZHJlbi5mb3JFYWNoKGNvbGxhcHNlKTtcclxuICAgICAgICBkLmNoaWxkcmVuID0gbnVsbDtcclxuICAgICAgfVxyXG4gIH1cclxuXHJcblxyXG4gIC8vIGhpZ2hsaWdodHMgc3Vibm9kZXMgb2YgYSBub2RlXHJcbiAgZnVuY3Rpb24gaGlnaGxpZ2h0Tm9kZVNlbGVjdGlvbnMoZCkge1xyXG4gICAgICB2YXIgaGlnaGxpZ2h0TGlua0NvbG9yID0gXCJkYXJrc2xhdGVncmF5XCI7Ly9cIiNmMDNiMjBcIjtcclxuICAgICAgdmFyIGRlZmF1bHRMaW5rQ29sb3IgPSBcImxpZ2h0Z3JheVwiO1xyXG5cclxuICAgICAgdmFyIGRlcHRoID0gIGQuZGVwdGg7XHJcbiAgICAgIHZhciBub2RlQ29sb3IgPSBkLmNvbG9yO1xyXG4gICAgICBpZiAoZGVwdGggPT09IDEpIHtcclxuICAgICAgICAgIG5vZGVDb2xvciA9IGhpZ2hsaWdodExpbmtDb2xvcjtcclxuICAgICAgfVxyXG5cclxuICAgICAgdmFyIHBhdGhMaW5rcyA9IHN2Z1Jvb3Quc2VsZWN0QWxsKFwicGF0aC5saW5rXCIpO1xyXG5cclxuICAgICAgcGF0aExpbmtzLnN0eWxlKFwic3Ryb2tlXCIsZnVuY3Rpb24oZGQpIHtcclxuICAgICAgICAgIGlmIChkZC5zb3VyY2UuZGVwdGggPT09IDApIHtcclxuICAgICAgICAgICAgICBpZiAoZC5uYW1lID09PSAnJykge1xyXG4gICAgICAgICAgICAgICAgICByZXR1cm4gaGlnaGxpZ2h0TGlua0NvbG9yO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICByZXR1cm4gZGVmYXVsdExpbmtDb2xvcjtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICBpZiAoZGQuc291cmNlLm5hbWUgPT09IGQubmFtZSkge1xyXG4gICAgICAgICAgICAgIHJldHVybiBub2RlQ29sb3I7XHJcbiAgICAgICAgICB9ZWxzZSB7XHJcbiAgICAgICAgICAgICAgcmV0dXJuIGRlZmF1bHRMaW5rQ29sb3I7XHJcbiAgICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgLy9XYWxraW5nIHBhcmVudHMnIGNoYWluIGZvciByb290IHRvIG5vZGUgdHJhY2tpbmdcclxuICBmdW5jdGlvbiBoaWdobGlnaHRSb290VG9Ob2RlUGF0aChkLGNsaWNrVHlwZSl7XHJcbiAgICB2YXIgYW5jZXN0b3JzID0gW107XHJcbiAgICB2YXIgcGFyZW50ID0gZDtcclxuICAgIHdoaWxlICghXy5pc1VuZGVmaW5lZChwYXJlbnQpKSB7XHJcbiAgICAgICAgYW5jZXN0b3JzLnB1c2gocGFyZW50KTtcclxuICAgICAgICBwYXJlbnQgPSBwYXJlbnQucGFyZW50O1xyXG4gICAgfVxyXG5cclxuICAgIC8vIEdldCB0aGUgbWF0Y2hlZCBsaW5rc1xyXG4gICAgdmFyIG1hdGNoZWRMaW5rcyA9IFtdO1xyXG5cclxuICAgIHN2Z1Jvb3Quc2VsZWN0QWxsKCdwYXRoLmxpbmsnKVxyXG4gICAgICAgIC5maWx0ZXIoZnVuY3Rpb24oZCwgaSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHJldHVybiBfLmFueShhbmNlc3RvcnMsIGZ1bmN0aW9uKHApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBwID09PSBkLnRhcmdldDtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLmVhY2goZnVuY3Rpb24oZClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIG1hdGNoZWRMaW5rcy5wdXNoKGQpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgIGFuaW1hdGVDaGFpbnMobWF0Y2hlZExpbmtzLGNsaWNrVHlwZSk7XHJcblxyXG4gICAgZnVuY3Rpb24gYW5pbWF0ZUNoYWlucyhsaW5rcyxjbGlja1R5cGUpe1xyXG4gICAgICBhbmltR3JvdXAuc2VsZWN0QWxsKFwicGF0aC5zZWxlY3RlZFwiKVxyXG4gICAgICAgICAgLmRhdGEoW10pXHJcbiAgICAgICAgICAuZXhpdCgpLnJlbW92ZSgpO1xyXG5cclxuICAgICAgYW5pbUdyb3VwLnNlbGVjdEFsbChcInBhdGguc2VsZWN0ZWRcIilcclxuICAgICAgICAgIC5kYXRhKGxpbmtzKVxyXG4gICAgICAgICAgLmVudGVyKCkuYXBwZW5kKFwic3ZnOnBhdGhcIilcclxuICAgICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJzZWxlY3RlZFwiKVxyXG4gICAgICAgICAgLmF0dHIoXCJkXCIsIGRpYWdvbmFsKTtcclxuXHJcblxyXG4gICAgICAvL1Jlc2V0IHBhdGggaGlnaGxpZ2h0IGlmIGNvbGxhcHNlIGJ1dHRvbiBjbGlja2VkXHJcbiAgICAgIGlmKGNsaWNrVHlwZSA9PSAnYnV0dG9uJyl7XHJcbiAgICAgICAgYW5pbUdyb3VwLnNlbGVjdEFsbChcInBhdGguc2VsZWN0ZWRcIikuY2xhc3NlZCgncmVzZXQtc2VsZWN0ZWQnLHRydWUpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICB2YXIgb3ZlcmxheUJveCA9IHN2Z1Jvb3Qubm9kZSgpLmdldEJCb3goKTtcclxuXHJcbiAgICAgIHN2Z1Jvb3Quc2VsZWN0KFwiI2NsaXAtcmVjdC1hbmltXCIpXHJcbiAgICAgICAgICAuYXR0cihcInhcIiwgLXJhZGl1cylcclxuICAgICAgICAgIC5hdHRyKFwieVwiLCAtcmFkaXVzKVxyXG4gICAgICAgICAgLmF0dHIoXCJ3aWR0aFwiLDApXHJcbiAgICAgICAgICAuYXR0cihcImhlaWdodFwiLHJhZGl1cyoyKVxyXG4gICAgICAgICAgLnRyYW5zaXRpb24oKS5kdXJhdGlvbihkdXJhdGlvbilcclxuICAgICAgICAgIC5hdHRyKFwid2lkdGhcIiwgcmFkaXVzKjIpO1xyXG4gICAgfVxyXG5cclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIHpvb20oKSB7XHJcbiAgICAgc3ZnUm9vdC5hdHRyKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKFwiICsgZDMuZXZlbnQudHJhbnNsYXRlICsgXCIpc2NhbGUoXCIgKyBkMy5ldmVudC5zY2FsZSArIFwiKVwiKTtcclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIGNvbGxhcHNlTGV2ZWxzKCl7XHJcblxyXG4gICAgaWYoY2hlY2tGb3JUaGlyZExldmVsT3BlbkNoaWxkcmVuKCkpe1xyXG4gICAgICB0b2dnbGVBbGxTZWNvbmRMZXZlbENoaWxkcmVuKCk7XHJcbiAgICB9ZWxzZXtcclxuICAgICB0b2dnbGVTZWNvbmRMZXZlbENoaWxkcmVuKCk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gT3BlbiBmaXJzdCBsZXZlbCBvbmx5IGJ5IGNvbGxhcHNpbmcgc2Vjb25kIGxldmVsXHJcbiAgICBmdW5jdGlvbiB0b2dnbGVTZWNvbmRMZXZlbENoaWxkcmVuKCl7XHJcbiAgICAgIGZvcih2YXIgcm9vdEluZGV4ID0gMCwgcm9vdExlbmd0aCA9IHJvb3RKc29uRGF0YS5jaGlsZHJlbi5sZW5ndGg7IHJvb3RJbmRleDxyb290TGVuZ3RoOyByb290SW5kZXgrKyl7XHJcbiAgICAgICAgICBpZihpc05vZGVPcGVuKHJvb3RKc29uRGF0YS5jaGlsZHJlbltyb290SW5kZXhdKSl7XHJcbiAgICAgICAgICAgICAgIHRvZ2dsZUNoaWxkcmVuKHJvb3RKc29uRGF0YS5jaGlsZHJlbltyb290SW5kZXhdLCdidXR0b24nKTtcclxuICAgICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIE9wZW4gZmlyc3QgbGV2ZWwgb25seSBieSBjb2xsYXBzaW5nIHNlY29uZCBsZXZlbFxyXG4gICAgZnVuY3Rpb24gdG9nZ2xlQWxsU2Vjb25kTGV2ZWxDaGlsZHJlbigpe1xyXG4gICAgICBmb3IodmFyIHJvb3RJbmRleCA9IDAsIHJvb3RMZW5ndGggPSByb290SnNvbkRhdGEuY2hpbGRyZW4ubGVuZ3RoOyByb290SW5kZXg8cm9vdExlbmd0aDsgcm9vdEluZGV4Kyspe1xyXG4gICAgICAgIGlmKGlzTm9kZU9wZW4ocm9vdEpzb25EYXRhLmNoaWxkcmVuW3Jvb3RJbmRleF0pKXtcclxuXHJcbiAgICAgICAgICBmb3IodmFyIGNoaWxkSW5kZXggPSAwLCBjaGlsZExlbmd0aCA9IHJvb3RKc29uRGF0YS5jaGlsZHJlbltyb290SW5kZXhdLmNoaWxkcmVuLmxlbmd0aDsgY2hpbGRJbmRleDxjaGlsZExlbmd0aDsgY2hpbGRJbmRleCsrKXtcclxuICAgICAgICAgICAgdmFyIHNlY29uZExldmVsQ2hpbGQgPSByb290SnNvbkRhdGEuY2hpbGRyZW5bcm9vdEluZGV4XS5jaGlsZHJlbltjaGlsZEluZGV4XTtcclxuICAgICAgICAgICAgaWYoaXNOb2RlT3BlbihzZWNvbmRMZXZlbENoaWxkKSl7XHJcbiAgICAgICAgICAgICAgdG9nZ2xlQ2hpbGRyZW4ocm9vdEpzb25EYXRhLmNoaWxkcmVuW3Jvb3RJbmRleF0uY2hpbGRyZW5bY2hpbGRJbmRleF0sJ2J1dHRvbicpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBDaGVjayBpZiBhbnkgbm9kZXMgb3BlbnMgYXQgc2Vjb25kIGxldmVsXHJcbiAgICBmdW5jdGlvbiBjaGVja0ZvclRoaXJkTGV2ZWxPcGVuQ2hpbGRyZW4oKXtcclxuICAgICAgZm9yKHZhciByb290SW5kZXggPSAwLCByb290TGVuZ3RoID0gcm9vdEpzb25EYXRhLmNoaWxkcmVuLmxlbmd0aDsgcm9vdEluZGV4PHJvb3RMZW5ndGg7IHJvb3RJbmRleCsrKXtcclxuICAgICAgICBpZihpc05vZGVPcGVuKHJvb3RKc29uRGF0YS5jaGlsZHJlbltyb290SW5kZXhdKSl7XHJcblxyXG4gICAgICAgICAgZm9yKHZhciBjaGlsZEluZGV4ID0gMCwgY2hpbGRMZW5ndGggPSByb290SnNvbkRhdGEuY2hpbGRyZW5bcm9vdEluZGV4XS5jaGlsZHJlbi5sZW5ndGg7IGNoaWxkSW5kZXg8Y2hpbGRMZW5ndGg7IGNoaWxkSW5kZXgrKyl7XHJcblxyXG4gICAgICAgICAgICB2YXIgc2Vjb25kTGV2ZWxDaGlsZCA9IHJvb3RKc29uRGF0YS5jaGlsZHJlbltyb290SW5kZXhdLmNoaWxkcmVuW2NoaWxkSW5kZXhdO1xyXG4gICAgICAgICAgICBpZihpc05vZGVPcGVuKHNlY29uZExldmVsQ2hpbGQpKXtcclxuICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGlzTm9kZU9wZW4oZCl7XHJcbiAgICAgIGlmKGQuY2hpbGRyZW4pe3JldHVybiB0cnVlO31cclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcblxyXG5cclxuXHJcbn1cclxuXHJcbiAgIiwiZnVuY3Rpb24gbG9hZEpxdWVyeSgpe1xyXG4gICAgJChkb2N1bWVudCkucmVhZHkoZnVuY3Rpb24oKXtcclxuICAgICAgICAkKFwiI3RvZ2dsZS1zaWRlYmFyXCIpLmNsaWNrKGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICAgICQoJy51aS5zaWRlYmFyJylcclxuICAgICAgICAgICAgICAgIC5zaWRlYmFyKCd0b2dnbGUnKVxyXG4gICAgICAgICAgICA7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgXHJcbiAgICB9KTtcclxufVxyXG4iLCJyZXF1aXJlLmNvbmZpZyh7XHJcbiAgICBwYXRoczoge1xyXG4gICAgICAgIFwiZDNcIjogXCJodHRwczovL2QzanMub3JnL2QzLnYzLm1pblwiXHJcbiAgICB9XHJcbn0pO1xyXG5cclxuZnVuY3Rpb24gbG9hZEQzKCl7XHJcblxyXG4gICAgd2luZG93LmQzT2xkID0gZDM7XHJcbiAgICByZXF1aXJlKFsnZDMnXSwgZnVuY3Rpb24oZDNWMykge1xyXG4gICAgICAgIHdpbmRvdy5kM1YzID0gZDNWMztcclxuICAgICAgICB3aW5kb3cuZDMgPSBkM09sZDtcclxuICAgICAgICAvLyB3aW5kb3cuZG9jdW1lbnRzID0gW1xyXG4gICAgICAgIC8vICAgICAgICAgLy8gICBbXCJpXCIsIFwiYW1cIiwgXCJiYXRtYW5cIiwgXCJvZlwiLCBcIndpbnRlcmZhbGxcIl0sXHJcbiAgICAgICAgLy8gICAgICAgICAvLyAgIFtcInRoZXJlXCIsIFwic2hvdWxkXCIsIFwiYWx3YXlzXCIsIFwiYmVcIiwgXCJhXCIsIFwic3RhcmtcIiwgXCJpblwiLCBcIndpbnRlcmZlbGxcIl0sXHJcbiAgICAgICAgLy8gICAgICAgICAvLyAgIFtcInByb3BoZWN5XCIsIFwic2F5c1wiLCBcInByaW5jZVwiLCBcIndpbGxcIiwgXCJiZVwiICwgXCJyZWJvcm5cIl1cclxuICAgICAgICAvLyAgICAgICAgIC8vIF07XHJcbiAgICAgICAgLy8gICAgIHdpbmRvdy5kb2N1bWVudHMgPSBbWydwcm9qZWN0JywgJ2NsYXNzaWZpY2F0aW9uJywgJ2NvbXBhcmUnLCAnbmV1cmFsJywgJ25ldHMnLCAnU1ZNJywgJ2R1ZScsICdkdWUnXSwgWyd0d28nLCAnbmV3JywgJ3Byb2dyZXNzJywgJ2NoZWNrcycsICdmaW5hbCcsICdwcm9qZWN0JywgICdhc3NpZ25lZCcsICdmb2xsb3dzJ10sIFsncmVwb3J0JywgJ2dyYWRlZCcsICAnY29udHJpYnV0ZScsICdwb2ludHMnLCAgJ3RvdGFsJywgJ3NlbWVzdGVyJywgJ2dyYWRlJ10sIFsncHJvZ3Jlc3MnLCAndXBkYXRlJywgJ2V2YWx1YXRlZCcsICdUQScsICdwZWVycyddLCBbJ2NsYXNzJywgJ21lZXRpbmcnLCAndG9tb3Jyb3cnLCd0ZWFtcycsICd3b3JrJywgJ3Byb2dyZXNzJywgJ3JlcG9ydCcsICdmaW5hbCcsICdwcm9qZWN0J10sIFsgJ3F1aXonLCAgJ3NlY3Rpb25zJywgJ3JlZ3VsYXJpemF0aW9uJywgJ1R1ZXNkYXknXSwgWyAncXVpeicsICdUaHVyc2RheScsICdsb2dpc3RpY3MnLCAnd29yaycsICdvbmxpbmUnLCAnc3R1ZGVudCcsICdwb3N0cG9uZScsICAncXVpeicsICdUdWVzZGF5J10sIFsncXVpeicsICdjb3ZlcicsICdUaHVyc2RheSddLCBbJ3F1aXonLCAnY2hhcCcsICdjaGFwJywgJ2xpbmVhcicsICdyZWdyZXNzaW9uJ11dO1xyXG4gICAgICAgIHdpbmRvdy5kb2N1bWVudHMgPSBbXHJcbiAgICAgICAgICAgIFsnc2VyaW91cycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAndGFsaycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAnZnJpZW5kcycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAnZmxha3knLFxyXG4gICAgICAgICAgICAgICAgICAgICAgJ2xhdGVseScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAndW5kZXJzdG9vZCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAnZ29vZCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAnZXZlbmluZycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAnaGFuZ2luZyddLFxyXG4gICAgICAgICAgICBbJ2dvdCcsICdnaWZ0JywgJ2VsZGVyJywgJ2Jyb3RoZXInLCAncmVhbGx5JywgJ3N1cnByaXNpbmcnXSxcclxuICAgICAgICAgICAgICAgICAgICAgWydjb21wbGV0ZWQnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgJzUnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgJ21pbGVzJyxcclxuICAgICAgICAgICAgICAgICAgICAgICdydW4nLFxyXG4gICAgICAgICAgICAgICAgICAgICAgJ3dpdGhvdXQnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgJ2JyZWFrJyxcclxuICAgICAgICAgICAgICAgICAgICAgICdtYWtlcycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAnZmVlbCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAnc3Ryb25nJ10sXHJcblxyXG4gICAgICAgICAgICBbJ3NvbicsICdwZXJmb3JtZWQnLCAnd2VsbCcsICd0ZXN0JyxcclxuICAgICAgICAgICAgICAgICdwcmVwYXJhdGlvbiddXHJcbiAgICAgICAgICAgIF07XHJcblxyXG4gICAgICAgICAgICAgICAgZ2V0QW5hbHlzaXMoXCJMREFcIik7XHJcbiAgICAgICAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdldERvY3ModGV4dHMpIHtcclxuICByZXR1cm4gd2luZG93LmRvY3VtZW50cyA9IHRleHRzLm1hcCh4ID0+IHguc3BsaXQoKSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdldEFuYWx5c2lzKG1ldGhvZCwgc3VjY2VzcywgZmFpbCkge1xyXG4gIGxldCBkb2NzID0gd2luZG93LmRvY3VtZW50cztcclxuICBsZXQgZm5jID0geCA9PiB4O1xyXG4gIGlmIChtZXRob2QgPT09IFwiTERBXCIpIHtcclxuICAgIGZuYyA9IGdldExEQUNsdXN0ZXJzO1xyXG4gIH0gZWxzZSB7XHJcbiAgICBmbmMgPSBnZXRXb3JkMlZlY0NsdXN0ZXJzO1xyXG4gIH1cclxuICB3aW5kb3cubG9hZERGdW5jID0gIGZuYztcclxuICBmbmMoZG9jcywgcmVzcCA9PiB7XHJcbiAgICAgIHdpbmRvdy5nbG9iYWxfZGF0YSA9IHJlc3A7XHJcbiAgICBpbml0UGFnZTEocmVzcCk7XHJcbiAgICBpbml0UGFnZTIocmVzcCk7XHJcbiAgICBpbml0UGFnZTMocmVzcCk7XHJcbiAgICBpbml0UGFnZTQoKTtcclxuICAgIGlmKHN1Y2Nlc3Mpe1xyXG4gICAgICAgIHN1Y2Nlc3MocmVzcCk7XHJcbiAgICB9XHJcbiAgfSwgZmFpbCk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGxvYWRWaXN1YWxpemF0aW9ucygpIHtcclxufVxyXG5cclxuZnVuY3Rpb24gaW5pdFBhZ2UxKHJlc3ApIHtcclxuICByZW5kZXJDbHVzdGVyQW5hbHlzaXMocmVzcCk7XHJcbn1cclxuXHJcblxyXG5cclxuZnVuY3Rpb24gaW5pdFBhZ2UyKHJlc3ApIHtcclxuICByZW5kZXJDbHVzdGVyRm9yY2VMYXlvdXQocmVzcCk7XHJcblxyXG59XHJcblxyXG5mdW5jdGlvbiBpbml0UGFnZTMocmVzcCl7XHJcbiAgICAkKFwiI3BhcmFsbGVsLWNvb3JkaW5hdGUtdmlzXCIpLmh0bWwoXCJcIik7XHJcbiAgICAkKFwiI3BjLWNvbnRhaW5lclwiKS5odG1sKFwiXCIpO1xyXG4gICAgbG9hZFBhcmFsbGVsQ29vcmRpbmF0ZShyZXNwKTtcclxuICAgIGxvYWRQYXJhbGxlbENvb3JkaW5hdGVzSEMocmVzcCk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGluaXRQYWdlNCgpe1xyXG4gICAgJChcIiNvdmVyYWxsLXdjXCIpLmh0bWwoKTtcclxuICAgIGxvYWRXb3JkQ2xvdWQod2luZG93Lmdsb2JhbF9kYXRhKTtcclxufSIsIi8vdmVjdG9ycyBmb3JtYXQ6IE1hcFtzdHJpbmcodG9waWNfaWQpOiBMaXN0W2Zsb2F0XV1cclxuZnVuY3Rpb24gZ2V0MkRWZWN0b3JzKHZlY3RvcnMsIHN1Y2Nlc3NDYWxsYmFjayl7XHJcbiAgICB2YXIgcmVxdWVzdCA9ICQuYWpheCh7XHJcbiAgICAgICAgdXJsOiBcIi9nZXQyRFZlY3RvcnNcIixcclxuICAgICAgICBtZXRob2Q6IFwiUE9TVFwiLFxyXG4gICAgICAgIGRhdGE6IHZlY3RvcnNcclxuICAgICAgfSk7XHJcbiAgICAgICBcclxuICAgICAgcmVxdWVzdC5kb25lKGZ1bmN0aW9uKCByZXNwb25zZSApIHtcclxuICAgICAgICBzdWNjZXNzQ2FsbGJhY2socmVzcG9uc2UpO1xyXG4gICAgICB9KTtcclxuICAgICAgIFxyXG4gICAgICByZXF1ZXN0LmZhaWwoZnVuY3Rpb24oIGpxWEhSLCB0ZXh0U3RhdHVzICkge1xyXG4gICAgICAgIGFsZXJ0KCBcIlJlcXVlc3QgZmFpbGVkOiBcIiArIHRleHRTdGF0dXMgKTtcclxuICAgICAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdldFRva2VuaXplZERvY3MoZG9jcywgc3VjY2Vzc0NhbGxiYWNrLCBmYWlsdXJlQ2FsbGJhY2spe1xyXG4gICAgdmFyIHJlcXVlc3QgPSAkLmFqYXgoe1xyXG4gICAgICAgIHVybDogXCIvZ2V0RG9jc0Zyb21UZXh0c1wiLFxyXG4gICAgICAgIG1ldGhvZDogXCJQT1NUXCIsXHJcbiAgICAgICAgZGF0YTogSlNPTi5zdHJpbmdpZnkoe2RvY3M6IGRvY3N9KSxcclxuICAgICAgICBjb250ZW50VHlwZTogXCJhcHBsaWNhdGlvbi9qc29uOyBjaGFyc2V0PXV0Zi04XCIsXHJcbiAgICAgICAgZGF0YVR5cGUgICA6IFwianNvblwiXHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgcmVxdWVzdC5kb25lKGZ1bmN0aW9uKCByZXNwb25zZSApIHtcclxuICAgICAgICBzdWNjZXNzQ2FsbGJhY2socmVzcG9uc2UuZG9jcyk7XHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgcmVxdWVzdC5mYWlsKGZ1bmN0aW9uKCBqcVhIUiwgdGV4dFN0YXR1cyApIHtcclxuICAgICAgICBpZihmYWlsdXJlQ2FsbGJhY2spXHJcbiAgICAgICAgICAgIGZhaWx1cmVDYWxsYmFjayh0ZXh0U3RhdHVzKTtcclxuICAgICAgICAgIGVsc2V7XHJcbiAgICAgICAgICAgICAgYWxlcnQoIFwiUmVxdWVzdCBmYWlsZWQ6IFwiICsgdGV4dFN0YXR1cyApO1xyXG4gICAgICAgICAgfVxyXG4gICAgICB9KTtcclxufVxyXG5cclxuLy8gZG9jcyBmb3JtYXQ6IExpc3RbTGlzdFtzdHJpbmcod29yZCldXVxyXG5mdW5jdGlvbiBnZXRXb3JkMlZlY0NsdXN0ZXJzKGRvY3MsIHN1Y2Nlc3NDYWxsYmFjaywgZmFpbHVyZUNhbGxiYWNrKXtcclxuICAgIHZhciByZXF1ZXN0ID0gJC5hamF4KHtcclxuICAgICAgICB1cmw6IFwiL2FwaS9nZXRDbHVzdGVyc1dvcmQyVmVjXCIsXHJcbiAgICAgICAgbWV0aG9kOiBcIlBPU1RcIixcclxuICAgICAgICBkYXRhOiBKU09OLnN0cmluZ2lmeSh7ZG9jczogZG9jcywgc3RhcnQ6IHdpbmRvdy52dWVBcHAuc2V0dGluZ3Muc3RhcnQyLCBlbmQ6IHdpbmRvdy52dWVBcHAuc2V0dGluZ3MuZW5kMiwgc2VsZWN0ZWQ6IHdpbmRvdy52dWVBcHAuc2V0dGluZ3Muc2VsZWN0ZWREYXRhc2V0fSksXHJcbiAgICAgICAgY29udGVudFR5cGU6IFwiYXBwbGljYXRpb24vanNvbjsgY2hhcnNldD11dGYtOFwiLFxyXG4gICAgICAgIGRhdGFUeXBlICAgOiBcImpzb25cIlxyXG4gICAgICB9KTtcclxuICAgICAgIFxyXG4gICAgICByZXF1ZXN0LmRvbmUoZnVuY3Rpb24oIHJlc3BvbnNlICkge1xyXG4gICAgICAgIHN1Y2Nlc3NDYWxsYmFjayhKU09OLnBhcnNlKHJlc3BvbnNlKSk7XHJcbiAgICAgIH0pO1xyXG4gICAgICAgXHJcbiAgICAgIHJlcXVlc3QuZmFpbChmdW5jdGlvbigganFYSFIsIHRleHRTdGF0dXMgKSB7XHJcbiAgICAgICAgICBpZihmYWlsdXJlQ2FsbGJhY2spXHJcbiAgICAgICAgICAgIGZhaWx1cmVDYWxsYmFjayh0ZXh0U3RhdHVzKTtcclxuICAgICAgICAgIGVsc2V7XHJcbiAgICAgICAgICAgICAgYWxlcnQoIFwiUmVxdWVzdCBmYWlsZWQ6IFwiICsgdGV4dFN0YXR1cyApO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdldExEQUNsdXN0ZXJzKGRvY3MsIHN1Y2Nlc3NDYWxsYmFjaywgZmFpbHVyZUNhbGxiYWNrKXtcclxuICAgIHZhciByZXF1ZXN0ID0gJC5hamF4KHtcclxuICAgICAgICB1cmw6IFwiL2FwaS9nZXRMREFEYXRhXCIsXHJcbiAgICAgICAgbWV0aG9kOiBcIlBPU1RcIixcclxuICAgICAgICBkYXRhOiBKU09OLnN0cmluZ2lmeSh7ZG9jczogZG9jcywgc3RhcnQ6IHdpbmRvdy52dWVBcHAuc2V0dGluZ3Muc3RhcnQxLCBlbmQ6IHdpbmRvdy52dWVBcHAuc2V0dGluZ3MuZW5kMSwgc2VsZWN0ZWQ6IHdpbmRvdy52dWVBcHAuc2V0dGluZ3Muc2VsZWN0ZWREYXRhc2V0fSksXHJcbiAgICAgICAgY29udGVudFR5cGU6IFwiYXBwbGljYXRpb24vanNvbjsgY2hhcnNldD11dGYtOFwiLFxyXG4gICAgICAgIGRhdGFUeXBlICAgOiBcImpzb25cIlxyXG4gICAgICB9KTtcclxuICAgICAgIFxyXG4gICAgICByZXF1ZXN0LmRvbmUoZnVuY3Rpb24oIHJlc3BvbnNlICkge1xyXG4gICAgICAgIHN1Y2Nlc3NDYWxsYmFjayhyZXNwb25zZSk7XHJcbiAgICAgIH0pO1xyXG4gICAgICAgXHJcbiAgICAgIHJlcXVlc3QuZmFpbChmdW5jdGlvbigganFYSFIsIHRleHRTdGF0dXMgKSB7XHJcbiAgICAgICAgaWYoZmFpbHVyZUNhbGxiYWNrKVxyXG4gICAgICAgICAgICBmYWlsdXJlQ2FsbGJhY2sodGV4dFN0YXR1cyk7XHJcbiAgICAgICAgICBlbHNle1xyXG4gICAgICAgICAgICAgIGFsZXJ0KCBcIlJlcXVlc3QgZmFpbGVkOiBcIiArIHRleHRTdGF0dXMgKTtcclxuICAgICAgICAgIH1cclxuICAgICAgfSk7XHJcbn1cclxuIiwiZnVuY3Rpb24gbG9hZFBhcmFsbGVsQ29vcmRpbmF0ZXNIQyhyZXNwKXtcclxuXHJcblxyXG4gICAgICAgIGxldCBkYXRhID0gZ2VuZXJhdGVQYXJhbGxlbENvb3JkaW5hdGVEYXRhSEMocmVzcCwgd2luZG93LnZ1ZUFwcC5wYXJhbXMudG9waWNUaHJlc2hvbGQsIHdpbmRvdy52dWVBcHAucGFyYW1zLndvcmRUaHJlc2hvbGQpO1xyXG4gICAgICAgIEhpZ2hjaGFydHMuY2hhcnQoJ3BjLWNvbnRhaW5lcicsIHtcclxuICAgICAgICAgICAgY2hhcnQ6IHtcclxuICAgICAgICAgICAgICAgIHR5cGU6ICdzcGxpbmUnLFxyXG4gICAgICAgICAgICAgICAgcGFyYWxsZWxDb29yZGluYXRlczogdHJ1ZSxcclxuICAgICAgICAgICAgICAgIHBhcmFsbGVsQXhlczoge1xyXG4gICAgICAgICAgICAgICAgICAgIGxpbmVXaWR0aDogMlxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB0aXRsZToge1xyXG4gICAgICAgICAgICAgICAgdGV4dDogJ0RvY3VtZW50IC0gVG9waWMgLSBXb3JkIFJlbGF0aW9uc2hpcCdcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgcGxvdE9wdGlvbnM6IHtcclxuICAgICAgICAgICAgICAgIHNlcmllczoge1xyXG4gICAgICAgICAgICAgICAgICAgIGFuaW1hdGlvbjogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICAgICAgbWFya2VyOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVuYWJsZWQ6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzdGF0ZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhvdmVyOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZW5hYmxlZDogZmFsc2VcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgc3RhdGVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGhvdmVyOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoYWxvOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2l6ZTogMFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICBldmVudHM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbW91c2VPdmVyOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmdyb3VwLnRvRnJvbnQoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgLy8gdG9vbHRpcDoge1xyXG4gICAgICAgICAgICAvLyAgICAgcG9pbnRGb3JtYXQ6ICc8c3BhbiBzdHlsZT1cImNvbG9yOntwb2ludC5jb2xvcn1cIj5cXHUyNUNGPC9zcGFuPicgK1xyXG4gICAgICAgICAgICAvLyAgICAgICAgICd7c2VyaWVzLm5hbWV9OiA8Yj57cG9pbnQuZm9ybWF0dGVkVmFsdWV9PC9iPjxici8+J1xyXG4gICAgICAgICAgICAvLyB9LFxyXG4gICAgICAgICAgICB4QXhpczoge1xyXG4gICAgICAgICAgICAgICAgY2F0ZWdvcmllczogW1xyXG4gICAgICAgICAgICAgICAgICAgICdEb2N1bWVudCcsXHJcbiAgICAgICAgICAgICAgICAgICAgJ1RvcGljJyxcclxuICAgICAgICAgICAgICAgICAgICAnV29yZCdcclxuICAgICAgICAgICAgICAgIF0sXHJcbiAgICAgICAgICAgICAgICBvZmZzZXQ6IDEwXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHlBeGlzOiBbe1xyXG4gICAgICAgICAgICAgICAgY2F0ZWdvcmllczogT2JqZWN0LmtleXMocmVzcFtcImRvY3VtZW50X3RvcGljXCJdKS5tYXAoeD0+IFwiLi4uLi4uLi4uLi4uLi4uLkRvY3VtZW50IFwiK3gpXHJcbiAgICAgICAgICAgIH0sIHtcclxuICAgICAgICAgICAgICAgIGNhdGVnb3JpZXM6IHJlc3BbXCJ0b3BpY3NcIl0ubWFwKHg9PiBcIi4uLi4uLi4uLi4uLi4uLi5Ub3BpYyBcIit4KVxyXG4gICAgICAgICAgICB9LCB7XHJcbiAgICAgICAgICAgICAgICBjYXRlZ29yaWVzOiBPYmplY3QudmFsdWVzKHJlc3BbXCJ3b3Jkc1wiXSkubWFwKHg9PiBcIi4uLi4uLi4uLi4uLi4uLi5cIit4KVxyXG4gICAgICAgICAgICB9XSxcclxuICAgICAgICAgICAgY29sb3JzOiBbJ3JnYmEoMTEsIDIwMCwgMjAwLCAwLjEpJ10sXHJcbiAgICAgICAgICAgIHNlcmllczogZGF0YS5tYXAoZnVuY3Rpb24gKHNldCwgaSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgICAgICBuYW1lOiAnJyxcclxuICAgICAgICAgICAgICAgICAgICBkYXRhOiBzZXQsXHJcbiAgICAgICAgICAgICAgICAgICAgc2hhZG93OiBmYWxzZVxyXG4gICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICB9KTtcclxuXHJcbn1cclxuXHJcblxyXG4iLCJmdW5jdGlvbiBsb2FkUGFyYWxsZWxDb29yZGluYXRlKHJlc3Ape1xyXG4gICAgdmFyIG1hcmdpbiA9IHt0b3A6IDMwLCByaWdodDogMTAsIGJvdHRvbTogMTAsIGxlZnQ6IDEwfSxcclxuICAgICAgICB3aWR0aCA9IDk2MCAtIG1hcmdpbi5sZWZ0IC0gbWFyZ2luLnJpZ2h0LFxyXG4gICAgICAgIGhlaWdodCA9IDUwMCAtIG1hcmdpbi50b3AgLSBtYXJnaW4uYm90dG9tO1xyXG5cclxuICAgIHZhciB4ID0gZDNWMy5zY2FsZS5vcmRpbmFsKCkucmFuZ2VQb2ludHMoWzAsIHdpZHRoXSwgMSksXHJcbiAgICAgICAgeSA9IHt9LFxyXG4gICAgICAgIGRyYWdnaW5nID0ge307XHJcblxyXG4gICAgdmFyIGxpbmUgPSBkM1YzLnN2Zy5saW5lKCksXHJcbiAgICAgICAgYmFja2dyb3VuZCxcclxuICAgICAgICBmb3JlZ3JvdW5kO1xyXG5cclxuICAgIHZhciBzdmcgPSBkM1YzLnNlbGVjdChcIiNwYXJhbGxlbC1jb29yZGluYXRlLXZpc1wiKS5hcHBlbmQoXCJzdmdcIilcclxuICAgICAgICAuYXR0cihcIndpZHRoXCIsIHdpZHRoICsgbWFyZ2luLmxlZnQgKyBtYXJnaW4ucmlnaHQpXHJcbiAgICAgICAgLmF0dHIoXCJoZWlnaHRcIiwgaGVpZ2h0ICsgbWFyZ2luLnRvcCArIG1hcmdpbi5ib3R0b20pXHJcbiAgICAuYXBwZW5kKFwiZ1wiKVxyXG4gICAgICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKFwiICsgbWFyZ2luLmxlZnQgKyBcIixcIiArIG1hcmdpbi50b3AgKyBcIilcIiksIGRpbWVuc2lvbnM7XHJcblxyXG5cclxuICAgIC8vIEV4dHJhY3QgdGhlIGxpc3Qgb2YgZGltZW5zaW9ucyBhbmQgY3JlYXRlIGEgc2NhbGUgZm9yIGVhY2guXHJcbiAgICB2YXIgY2FycyA9IGdlbmVyYXRlUGFyYWxsZWxDb29yZGluYXRlRGF0YShyZXNwLCB3aW5kb3cudnVlQXBwLnBhcmFtcy50b3BpY1RocmVzaG9sZCwgd2luZG93LnZ1ZUFwcC5wYXJhbXMud29yZFRocmVzaG9sZCk7XHJcbiAgICAvLyB2YXIgYXhpc0QgPSBkM1YzLnN2Zy5heGlzKCkub3JpZW50KFwibGVmdFwiKS50aWNrcyhPYmplY3Qua2V5cyhyZXNwW1wiZG9jdW1lbnRfdG9waWNcIl0pLmxlbmd0aCksXHJcbiAgICB2YXIgYXhpc0QgPSBkM1YzLnN2Zy5heGlzKCkub3JpZW50KFwibGVmdFwiKS50aWNrVmFsdWVzKE9iamVjdC5rZXlzKHJlc3BbXCJkb2N1bWVudF90b3BpY1wiXSkubWFwKHggPT4gcGFyc2VJbnQoeCkpKSxcclxuICAgICAgICBheGlzVCA9IGQzVjMuc3ZnLmF4aXMoKS5vcmllbnQoXCJsZWZ0XCIpLnRpY2tWYWx1ZXMocmVzcFtcInRvcGljc1wiXS5tYXAoeCA9PiBwYXJzZUludCh4KSkpLFxyXG4gICAgICAgIGF4aXNXID0gZDNWMy5zdmcuYXhpcygpLm9yaWVudChcImxlZnRcIikudGlja1ZhbHVlcyhPYmplY3QudmFsdWVzKHJlc3BbXCJvdmVyYWxsX3dvcmRcIl0pLm1hcCh4ID0+IHBhcnNlRmxvYXQoeCkpKTtcclxuXHJcbiAgICB4LmRvbWFpbihkaW1lbnNpb25zID0gZDNWMy5rZXlzKGNhcnNbMF0pLmZpbHRlcihmdW5jdGlvbihkKSB7XHJcbiAgICAgICAgcmV0dXJuIGQgIT0gXCJuYW1lXCIgJiYgKHlbZF0gPSBkM1YzLnNjYWxlLmxpbmVhcigpXHJcbiAgICAgICAgICAgIC5kb21haW4oZDNWMy5leHRlbnQoY2FycywgZnVuY3Rpb24ocCkgeyByZXR1cm4gK3BbZF07IH0pKVxyXG4gICAgICAgICAgICAucmFuZ2UoW2hlaWdodCwgMF0pKTtcclxuICAgIH0pKTtcclxuXHJcbiAgICAvLyBBZGQgZ3JleSBiYWNrZ3JvdW5kIGxpbmVzIGZvciBjb250ZXh0LlxyXG4gICAgYmFja2dyb3VuZCA9IHN2Zy5hcHBlbmQoXCJnXCIpXHJcbiAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcImJhY2tncm91bmRcIilcclxuICAgICAgICAuc2VsZWN0QWxsKFwicGF0aFwiKVxyXG4gICAgICAgIC5kYXRhKGNhcnMpXHJcbiAgICAgICAgLmVudGVyKCkuYXBwZW5kKFwicGF0aFwiKVxyXG4gICAgICAgIC5hdHRyKFwiZFwiLCBwYXRoKTtcclxuXHJcbiAgICAvLyBBZGQgYmx1ZSBmb3JlZ3JvdW5kIGxpbmVzIGZvciBmb2N1cy5cclxuICAgIGZvcmVncm91bmQgPSBzdmcuYXBwZW5kKFwiZ1wiKVxyXG4gICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJmb3JlZ3JvdW5kXCIpXHJcbiAgICAgICAgLnNlbGVjdEFsbChcInBhdGhcIilcclxuICAgICAgICAuZGF0YShjYXJzKVxyXG4gICAgICAgIC5lbnRlcigpLmFwcGVuZChcInBhdGhcIilcclxuICAgICAgICAuYXR0cihcImRcIiwgcGF0aCk7XHJcblxyXG4gICAgLy8gQWRkIGEgZ3JvdXAgZWxlbWVudCBmb3IgZWFjaCBkaW1lbnNpb24uXHJcbiAgICB2YXIgZyA9IHN2Zy5zZWxlY3RBbGwoXCIuZGltZW5zaW9uXCIpXHJcbiAgICAgICAgLmRhdGEoZGltZW5zaW9ucylcclxuICAgICAgICAuZW50ZXIoKS5hcHBlbmQoXCJnXCIpXHJcbiAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcImRpbWVuc2lvblwiKVxyXG4gICAgICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIFwidHJhbnNsYXRlKFwiICsgeChkKSArIFwiKVwiOyB9KVxyXG4gICAgICAgIC5jYWxsKGQzVjMuYmVoYXZpb3IuZHJhZygpXHJcbiAgICAgICAgICAgIC5vcmlnaW4oZnVuY3Rpb24oZCkgeyByZXR1cm4ge3g6IHgoZCl9OyB9KVxyXG4gICAgICAgICAgICAub24oXCJkcmFnc3RhcnRcIiwgZnVuY3Rpb24oZCkge1xyXG4gICAgICAgICAgICBkcmFnZ2luZ1tkXSA9IHgoZCk7XHJcbiAgICAgICAgICAgIGJhY2tncm91bmQuYXR0cihcInZpc2liaWxpdHlcIiwgXCJoaWRkZW5cIik7XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIC5vbihcImRyYWdcIiwgZnVuY3Rpb24oZCkge1xyXG4gICAgICAgICAgICBkcmFnZ2luZ1tkXSA9IE1hdGgubWluKHdpZHRoLCBNYXRoLm1heCgwLCBkM1YzLmV2ZW50LngpKTtcclxuICAgICAgICAgICAgZm9yZWdyb3VuZC5hdHRyKFwiZFwiLCBwYXRoKTtcclxuICAgICAgICAgICAgZGltZW5zaW9ucy5zb3J0KGZ1bmN0aW9uKGEsIGIpIHsgcmV0dXJuIHBvc2l0aW9uKGEpIC0gcG9zaXRpb24oYik7IH0pO1xyXG4gICAgICAgICAgICB4LmRvbWFpbihkaW1lbnNpb25zKTtcclxuICAgICAgICAgICAgZy5hdHRyKFwidHJhbnNmb3JtXCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIFwidHJhbnNsYXRlKFwiICsgcG9zaXRpb24oZCkgKyBcIilcIjsgfSlcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgLm9uKFwiZHJhZ2VuZFwiLCBmdW5jdGlvbihkKSB7XHJcbiAgICAgICAgICAgIGRlbGV0ZSBkcmFnZ2luZ1tkXTtcclxuICAgICAgICAgICAgdHJhbnNpdGlvbihkM1YzLnNlbGVjdCh0aGlzKSkuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZShcIiArIHgoZCkgKyBcIilcIik7XHJcbiAgICAgICAgICAgIHRyYW5zaXRpb24oZm9yZWdyb3VuZCkuYXR0cihcImRcIiwgcGF0aCk7XHJcbiAgICAgICAgICAgIGJhY2tncm91bmRcclxuICAgICAgICAgICAgICAgIC5hdHRyKFwiZFwiLCBwYXRoKVxyXG4gICAgICAgICAgICAgICAgLnRyYW5zaXRpb24oKVxyXG4gICAgICAgICAgICAgICAgLmRlbGF5KDUwMClcclxuICAgICAgICAgICAgICAgIC5kdXJhdGlvbigwKVxyXG4gICAgICAgICAgICAgICAgLmF0dHIoXCJ2aXNpYmlsaXR5XCIsIG51bGwpO1xyXG4gICAgICAgICAgICB9KSk7XHJcblxyXG4gICAgLy8gQWRkIGFuIGF4aXMgYW5kIHRpdGxlLlxyXG4gICAgZy5hcHBlbmQoXCJnXCIpXHJcbiAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcImF4aXNcIilcclxuICAgICAgICAuZWFjaChmdW5jdGlvbihkKSB7XHJcbiAgICAgICAgICAgIGxldCBheGlzID0gbnVsbDtcclxuICAgICAgICAgICAgaWYoZCA9PSBcImRvY3VtZW50XCIpe1xyXG4gICAgICAgICAgICAgICAgYXhpcyA9IGF4aXNEO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYoZCA9PSBcInRvcGljXCIpe1xyXG4gICAgICAgICAgICAgICAgYXhpcyA9IGF4aXNUO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgYXhpcyA9IGF4aXNXO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGQzVjMuc2VsZWN0KHRoaXMpLmNhbGwoXHJcbiAgICAgICAgICAgICAgICBheGlzLnNjYWxlKHlbZF0pXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfSlcclxuICAgICAgICAuYXBwZW5kKFwidGV4dFwiKVxyXG4gICAgICAgIC5zdHlsZShcInRleHQtYW5jaG9yXCIsIFwibWlkZGxlXCIpXHJcbiAgICAgICAgLmF0dHIoXCJ5XCIsIC05KVxyXG4gICAgICAgIC50ZXh0KGZ1bmN0aW9uKGQpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGQ7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgLy8gQWRkIGFuZCBzdG9yZSBhIGJydXNoIGZvciBlYWNoIGF4aXMuXHJcbiAgICBnLmFwcGVuZChcImdcIilcclxuICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwiYnJ1c2hcIilcclxuICAgICAgICAuZWFjaChmdW5jdGlvbihkKSB7XHJcbiAgICAgICAgICAgIGQzVjMuc2VsZWN0KHRoaXMpLmNhbGwoeVtkXS5icnVzaCA9IGQzVjMuc3ZnLmJydXNoKCkueSh5W2RdKS5vbihcImJydXNoc3RhcnRcIiwgYnJ1c2hzdGFydCkub24oXCJicnVzaFwiLCBicnVzaCkpO1xyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLnNlbGVjdEFsbChcInJlY3RcIilcclxuICAgICAgICAuYXR0cihcInhcIiwgLTgpXHJcbiAgICAgICAgLmF0dHIoXCJ3aWR0aFwiLCAxNik7XHJcblxyXG5cclxuICAgIGZ1bmN0aW9uIHBvc2l0aW9uKGQpIHtcclxuICAgIHZhciB2ID0gZHJhZ2dpbmdbZF07XHJcbiAgICByZXR1cm4gdiA9PSBudWxsID8geChkKSA6IHY7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gdHJhbnNpdGlvbihnKSB7XHJcbiAgICByZXR1cm4gZy50cmFuc2l0aW9uKCkuZHVyYXRpb24oNTAwKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBSZXR1cm5zIHRoZSBwYXRoIGZvciBhIGdpdmVuIGRhdGEgcG9pbnQuXHJcbiAgICBmdW5jdGlvbiBwYXRoKGQpIHtcclxuICAgIHJldHVybiBsaW5lKGRpbWVuc2lvbnMubWFwKGZ1bmN0aW9uKHApIHsgcmV0dXJuIFtwb3NpdGlvbihwKSwgeVtwXShkW3BdKV07IH0pKTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBicnVzaHN0YXJ0KCkge1xyXG4gICAgZDNWMy5ldmVudC5zb3VyY2VFdmVudC5zdG9wUHJvcGFnYXRpb24oKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBIYW5kbGVzIGEgYnJ1c2ggZXZlbnQsIHRvZ2dsaW5nIHRoZSBkaXNwbGF5IG9mIGZvcmVncm91bmQgbGluZXMuXHJcbiAgICBmdW5jdGlvbiBicnVzaCgpIHtcclxuICAgIHZhciBhY3RpdmVzID0gZGltZW5zaW9ucy5maWx0ZXIoZnVuY3Rpb24ocCkgeyByZXR1cm4gIXlbcF0uYnJ1c2guZW1wdHkoKTsgfSksXHJcbiAgICAgICAgZXh0ZW50cyA9IGFjdGl2ZXMubWFwKGZ1bmN0aW9uKHApIHsgcmV0dXJuIHlbcF0uYnJ1c2guZXh0ZW50KCk7IH0pO1xyXG4gICAgZm9yZWdyb3VuZC5zdHlsZShcImRpc3BsYXlcIiwgZnVuY3Rpb24oZCkge1xyXG4gICAgICAgIHJldHVybiBhY3RpdmVzLmV2ZXJ5KGZ1bmN0aW9uKHAsIGkpIHtcclxuICAgICAgICByZXR1cm4gZXh0ZW50c1tpXVswXSA8PSBkW3BdICYmIGRbcF0gPD0gZXh0ZW50c1tpXVsxXTtcclxuICAgICAgICB9KSA/IG51bGwgOiBcIm5vbmVcIjtcclxuICAgIH0pO1xyXG4gICAgfVxyXG5cclxufSIsImZ1bmN0aW9uIHJlbmRlckNsdXN0ZXJBbmFseXNpcyhyZXNwKSB7XHJcbiAgZDMuc2VsZWN0KFwiLmNoYXJ0MTJcIikucmVtb3ZlKCk7XHJcbiAgdmFyIGRvY3VtZW50X3RvcGljID0gcmVzcFtcImRvY3VtZW50X3RvcGljXCJdWzBdO1xyXG4gIHZhciB0b3BpY192ZWN0b3JzID0gcmVzcFtcInRvcGljX3ZlY3RvcnNcIl07XHJcbiAgdmFyIGJiID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2NsdXN0ZXInKVxyXG4gICAgLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLFxyXG4gICAgd2lkdGggPSA0MDA7XHJcbiAgdmFyIGhlaWdodCA9IDQwMDtcclxuICB2YXIgbWFyZ2luID0gODA7XHJcbiAgdmFyIGRhdGEgPSBbXTtcclxuXHJcbiAgT2JqZWN0LmtleXModG9waWNfdmVjdG9ycykuZm9yRWFjaChmdW5jdGlvbihrZXkpIHtcclxuICAgIHZhciB2YWx1ZSA9IHRvcGljX3ZlY3RvcnNba2V5XTtcclxuICAgIGRhdGEucHVzaCh7XHJcbiAgICAgIHg6IHZhbHVlWzBdLFxyXG4gICAgICB5OiB2YWx1ZVsxXSxcclxuICAgICAgYzogMSxcclxuICAgICAgc2l6ZTogZG9jdW1lbnRfdG9waWNba2V5XSxcclxuICAgICAga2V5OiBrZXlcclxuICAgIH0pO1xyXG4gIH0pO1xyXG4gIHZhciBsYWJlbFggPSAnWCc7XHJcbiAgdmFyIGxhYmVsWSA9ICdZJztcclxuXHJcbiAgdmFyIHN2ZyA9IGQzLnNlbGVjdCgnI2NsdXN0ZXInKVxyXG4gICAgLmFwcGVuZCgnc3ZnJylcclxuICAgIC5hdHRyKCdjbGFzcycsICdjaGFydDEyJylcclxuICAgIC5hdHRyKCdpZCcsJ2NsdXN0ZXJfaWQnKVxyXG4gICAgLmF0dHIoXCJ3aWR0aFwiLCB3aWR0aCArIG1hcmdpbiArIG1hcmdpbilcclxuICAgIC5hdHRyKFwiaGVpZ2h0XCIsIGhlaWdodCArIG1hcmdpbiArIG1hcmdpbilcclxuICAgIC5hcHBlbmQoXCJnXCIpXHJcbiAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZShcIiArIG1hcmdpbiArIFwiLFwiICsgbWFyZ2luICsgXCIpXCIpO1xyXG5cclxuICB2YXIgeCA9IGQzLnNjYWxlTGluZWFyKClcclxuICAgIC5kb21haW4oW2QzLm1pbihkYXRhLCBmdW5jdGlvbiAoZCkge1xyXG4gICAgICByZXR1cm4gZC54O1xyXG4gICAgfSksIGQzLm1heChkYXRhLCBmdW5jdGlvbiAoZCkge1xyXG4gICAgICByZXR1cm4gZC54O1xyXG4gICAgfSldKVxyXG4gICAgLnJhbmdlKFswLCB3aWR0aF0pO1xyXG5cclxuICB2YXIgeSA9IGQzLnNjYWxlTGluZWFyKClcclxuICAgIC5kb21haW4oW2QzLm1pbihkYXRhLCBmdW5jdGlvbiAoZCkge1xyXG4gICAgICByZXR1cm4gZC55O1xyXG4gICAgfSksIGQzLm1heChkYXRhLCBmdW5jdGlvbiAoZCkge1xyXG4gICAgICByZXR1cm4gZC55O1xyXG4gICAgfSldKVxyXG4gICAgLnJhbmdlKFtoZWlnaHQsIDBdKTtcclxuXHJcbiAgdmFyIHNjYWxlID0gZDMuc2NhbGVTcXJ0KClcclxuICAgIC5kb21haW4oW2QzLm1pbihkYXRhLCBmdW5jdGlvbiAoZCkge1xyXG4gICAgICByZXR1cm4gZC5zaXplO1xyXG4gICAgfSksIGQzLm1heChkYXRhLCBmdW5jdGlvbiAoZCkge1xyXG4gICAgICByZXR1cm4gZC5zaXplO1xyXG4gICAgfSldKVxyXG4gICAgLnJhbmdlKFsxMCwgMjBdKTtcclxuXHJcbiAgdmFyIG9wYWNpdHkgPSBkMy5zY2FsZVNxcnQoKVxyXG4gICAgLmRvbWFpbihbZDMubWluKGRhdGEsIGZ1bmN0aW9uIChkKSB7XHJcbiAgICAgIHJldHVybiBkLnNpemU7XHJcbiAgICB9KSwgZDMubWF4KGRhdGEsIGZ1bmN0aW9uIChkKSB7XHJcbiAgICAgIHJldHVybiBkLnNpemU7XHJcbiAgICB9KV0pXHJcbiAgICAucmFuZ2UoWzEsIC41XSk7XHJcblxyXG5cclxuICB2YXIgeEF4aXMgPSBkMy5heGlzQm90dG9tKCkuc2NhbGUoeCk7XHJcbiAgdmFyIHlBeGlzID0gZDMuYXhpc0xlZnQoKS5zY2FsZSh5KTtcclxuXHJcblxyXG4gIHN2Zy5hcHBlbmQoXCJnXCIpXHJcbiAgICAuYXR0cihcImNsYXNzXCIsIFwieSBheGlzXCIpXHJcbiAgICAuY2FsbCh5QXhpcylcclxuICAgIC5hcHBlbmQoXCJ0ZXh0XCIpXHJcbiAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBcInJvdGF0ZSgtOTApXCIpXHJcbiAgICAuYXR0cihcInhcIiwgMjApXHJcbiAgICAuYXR0cihcInlcIiwgLW1hcmdpbilcclxuICAgIC5hdHRyKFwiZHlcIiwgXCIuNzFlbVwiKVxyXG4gICAgLnN0eWxlKFwidGV4dC1hbmNob3JcIiwgXCJlbmRcIilcclxuICAgIC50ZXh0KGxhYmVsWSk7XHJcbiAgLy8geCBheGlzIGFuZCBsYWJlbFxyXG4gIHN2Zy5hcHBlbmQoXCJnXCIpXHJcbiAgICAuYXR0cihcImNsYXNzXCIsIFwieCBheGlzXCIpXHJcbiAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZSgwLFwiICsgaGVpZ2h0ICsgXCIpXCIpXHJcbiAgICAuY2FsbCh4QXhpcylcclxuICAgIC5hcHBlbmQoXCJ0ZXh0XCIpXHJcbiAgICAuYXR0cihcInhcIiwgd2lkdGggKyAyMClcclxuICAgIC5hdHRyKFwieVwiLCBtYXJnaW4gLSAxMClcclxuICAgIC5hdHRyKFwiZHlcIiwgXCIuNzFlbVwiKVxyXG4gICAgLnN0eWxlKFwidGV4dC1hbmNob3JcIiwgXCJlbmRcIilcclxuICAgIC50ZXh0KGxhYmVsWCk7XHJcblxyXG4gIHN2Zy5zZWxlY3RBbGwoXCJjaXJjbGVcIilcclxuICAgIC5kYXRhKGRhdGEpXHJcbiAgICAuZW50ZXIoKVxyXG4gICAgLmFwcGVuZChcImdcIilcclxuICAgIC5pbnNlcnQoXCJjaXJjbGVcIilcclxuICAgIC5hdHRyKFwiY3hcIiwgd2lkdGggLyAyKVxyXG4gICAgLmF0dHIoXCJjeVwiLCBoZWlnaHQgLyAyKVxyXG4gICAgLmF0dHIoXCJyXCIsIGZ1bmN0aW9uIChkKSB7XHJcbiAgICAgIHJldHVybiBzY2FsZShkLnNpemUpO1xyXG4gICAgfSlcclxuICAgIC5hdHRyKFwiaWRcIixmdW5jdGlvbihkKSB7XHJcbiAgICAgIHJldHVybiBkLmtleVxyXG4gICAgfSlcclxuICAgIC5zdHlsZShcImZpbGxcIiwgZnVuY3Rpb24gKGQpIHtcclxuICAgICAgcmV0dXJuIFwiI0QwRTNGMFwiO1xyXG4gICAgfSlcclxuICAgIC5vbignbW91c2VvdmVyJywgZnVuY3Rpb24gKGQsIGkpIHtcclxuICAgICAgcmVuZGVyQmFyR3JhcGgoZFtcImtleVwiXSwgcmVzcCk7XHJcbiAgICAgIGZhZGUoZFtcImtleVwiXSwgMSk7XHJcbiAgICB9KVxyXG4gICAgLm9uKCdtb3VzZW91dCcsIGZ1bmN0aW9uIChkLCBpKSB7XHJcbiAgICAgIGZhZGVPdXQoKTtcclxuICAgIH0pXHJcbiAgICAudHJhbnNpdGlvbigpXHJcbiAgICAuZGVsYXkoZnVuY3Rpb24gKGQsIGkpIHtcclxuICAgICAgcmV0dXJuIHgoZC54KSAtIHkoZC55KTtcclxuICAgIH0pXHJcbiAgICAuZHVyYXRpb24oNTAwKVxyXG4gICAgLmF0dHIoXCJjeFwiLCBmdW5jdGlvbiAoZCkge1xyXG4gICAgICByZXR1cm4geChkLngpO1xyXG4gICAgfSlcclxuICAgIC5hdHRyKFwiY3lcIiwgZnVuY3Rpb24gKGQpIHtcclxuICAgICAgcmV0dXJuIHkoZC55KTtcclxuICAgIH0pO1xyXG5cclxuICAgICAgLy8gdGV4dCBsYWJlbCBmb3IgdGhlIHggYXhpc1xyXG4gIHN2Zy5hcHBlbmQoXCJ0ZXh0XCIpXHJcbiAgICAuYXR0cihcImNsYXNzXCIsIFwieCBsYWJlbFwiKVxyXG4gICAgLmF0dHIoXCJ0ZXh0LWFuY2hvclwiLCBcImVuZFwiKVxyXG4gICAgLmF0dHIoXCJ4XCIsIHdpZHRoKVxyXG4gICAgLmF0dHIoXCJ5XCIsIGhlaWdodCArNDApXHJcbiAgICAudGV4dChcIlBDMVwiKTtcclxuXHJcblxyXG4gIHN2Zy5hcHBlbmQoXCJ0ZXh0XCIpXHJcbiAgICAuYXR0cihcImNsYXNzXCIsIFwieSBsYWJlbFwiKVxyXG4gICAgLmF0dHIoXCJ0ZXh0LWFuY2hvclwiLCBcImVuZFwiKVxyXG4gICAgLmF0dHIoXCJ5XCIsIC01MClcclxuICAgIC5hdHRyKFwiZHlcIiwgXCIuNzVlbVwiKVxyXG4gICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJyb3RhdGUoLTkwKVwiKVxyXG4gICAgLnRleHQoXCJQQzJcIik7XHJcblxyXG5cclxuICBmdW5jdGlvbiBmYWRlKGtleSwgb3BhY2l0eSkge1xyXG4gICAgc3ZnLnNlbGVjdEFsbChcImNpcmNsZVwiKVxyXG4gICAgICAuZmlsdGVyKGZ1bmN0aW9uIChkKSB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgcmV0dXJuIGQua2V5ID09IGtleTtcclxuICAgICAgfSkuXHJcbiAgICAgIHN0eWxlKFwiZmlsbFwiLCBcIiNDODQyM0VcIilcclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIGZhZGVPdXQoKSB7XHJcbiAgICBzdmcuc2VsZWN0QWxsKFwiY2lyY2xlXCIpXHJcbiAgICAgIC50cmFuc2l0aW9uKClcclxuICAgICAgLnN0eWxlKFwiZmlsbFwiLFwiI0QwRTNGMFwiKTtcclxuICB9XHJcbn0iLCJmdW5jdGlvbiByZW5kZXJCYXJHcmFwaCh0b3BpY19udW1iZXIsIHJlc3ApIHtcclxuICBkMy5zZWxlY3QoXCIjc3RhY2stYmFyXCIpLnJlbW92ZSgpO1xyXG4gIGQzLnNlbGVjdChcIiNsZWdlbmRzdmdcIikucmVtb3ZlKCk7XHJcbiAgdmFyIGZpbmFsX2RhdGEgPSBbXTtcclxuICB2YXIgZGF0YVZhbCA9cmVzcFtcInRvcGljX3dvcmRcIl1bdG9waWNfbnVtYmVyXTtcclxuICBmb3IgKHZhciBrZXkgaW4gZGF0YVZhbCkge1xyXG4gICAgaWYgKGRhdGFWYWwuaGFzT3duUHJvcGVydHkoa2V5KSkge1xyXG4gICAgICAgIHZhciB0ZW1wID17fTtcclxuICAgICAgICB0ZW1wLlN0YXRlID0ga2V5O1xyXG4gICAgICAgIHRlbXAudG9waWNfZnJlcXVlbmN5ID0gTWF0aC5hYnMoZGF0YVZhbFtrZXldKTtcclxuICAgICAgICB0ZW1wLm92ZXJhbGwgPSBNYXRoLmFicyhyZXNwW1wib3ZlcmFsbF93b3JkXCJdW2tleV0pO1xyXG4gICAgICAgIHRlbXAudG90YWwgPSB0ZW1wLnRvcGljX2ZyZXF1ZW5jeSArIHRlbXAub3ZlcmFsbDtcclxuICAgICAgICBmaW5hbF9kYXRhLnB1c2godGVtcCk7XHJcbiAgICAgICAgY29uc29sZS5sb2coa2V5ICsgXCItPlwiICsgcmVzcFtcIm92ZXJhbGxfd29yZFwiXVtrZXldKTtcclxuICAgIH1cclxuICAgIFxyXG4gIH1cclxuICBcclxuICB2YXIgYmIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjc3RhY2tlZC1iYXInKVxyXG4gICAgLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLFxyXG4gICAgd2lkdGggPSA0MDA7XHJcblxyXG4gIHZhciBkYXRhID0gZmluYWxfZGF0YTtcclxuICB2YXIgaGVpZ2h0ID0gZGF0YS5sZW5ndGggKiAyNSArMTAwO1xyXG4gIHZhciBzdmcgPSBkMy5zZWxlY3QoXCIjc3RhY2tlZC1iYXJcIikuYXBwZW5kKFwic3ZnXCIpLmF0dHIoXCJ3aWR0aFwiLCB3aWR0aCkuYXR0cihcImhlaWdodFwiLCBoZWlnaHQpLmF0dHIoXCJpZFwiLFwic3RhY2stYmFyXCIpLFxyXG4gICAgbWFyZ2luID0ge1xyXG4gICAgICB0b3A6IDIwLFxyXG4gICAgICByaWdodDogMCxcclxuICAgICAgYm90dG9tOiA1MCxcclxuICAgICAgbGVmdDogODBcclxuICAgIH0sXHJcbiAgICB3aWR0aCA9ICtzdmcuYXR0cihcIndpZHRoXCIpIC0gbWFyZ2luLmxlZnQgLSBtYXJnaW4ucmlnaHQsXHJcbiAgICBoZWlnaHQgPSArc3ZnLmF0dHIoXCJoZWlnaHRcIikgLSBtYXJnaW4udG9wIC0gbWFyZ2luLmJvdHRvbSxcclxuICAgIGcgPSBzdmcuYXBwZW5kKFwiZ1wiKS5hdHRyKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKFwiICsgbWFyZ2luLmxlZnQgKyBcIixcIiArIG1hcmdpbi50b3AgKyBcIilcIik7XHJcbiAgdmFyIHkgPSBkMy5zY2FsZUJhbmQoKSAvLyB4ID0gZDMuc2NhbGVCYW5kKCkgIFxyXG4gICAgLnJhbmdlUm91bmQoWzAsIGhlaWdodF0pIC8vIC5yYW5nZVJvdW5kKFswLCB3aWR0aF0pXHJcbiAgICAucGFkZGluZ0lubmVyKDAuMjUpLmFsaWduKDAuMSk7XHJcbiAgdmFyIHggPSBkMy5zY2FsZUxpbmVhcigpIC8vIHkgPSBkMy5zY2FsZUxpbmVhcigpXHJcbiAgICAucmFuZ2VSb3VuZChbMCwgd2lkdGhdKTsgLy8gLnJhbmdlUm91bmQoW2hlaWdodCwgMF0pO1xyXG5cclxuICB2YXIgeiA9IGQzLnNjYWxlT3JkaW5hbCgpLnJhbmdlKFtcIiNDODQyM0VcIiwgXCIjQTFDN0UwXCJdKTtcclxuICB2YXIga2V5cyA9IFtcInRvcGljX2ZyZXF1ZW5jeVwiLCBcIm92ZXJhbGxcIl07XHJcbiAgZGF0YS5zb3J0KGZ1bmN0aW9uIChhLCBiKSB7XHJcbiAgICByZXR1cm4gYi50b3RhbCAtIGEudG90YWw7XHJcbiAgfSk7XHJcbiAgeS5kb21haW4oZGF0YS5tYXAoZnVuY3Rpb24gKGQpIHtcclxuICAgIHJldHVybiBkLlN0YXRlO1xyXG4gIH0pKTsgLy8geC5kb21haW4uLi5cclxuXHJcbiAgeC5kb21haW4oWzAsIGQzLm1heChkYXRhLCBmdW5jdGlvbiAoZCkge1xyXG4gICAgcmV0dXJuIGQudG90YWw7XHJcbiAgfSldKS5uaWNlKCk7IC8vIHkuZG9tYWluLi4uXHJcblxyXG4gIHouZG9tYWluKGtleXMpO1xyXG4gIGcuYXBwZW5kKFwiZ1wiKVxyXG4gICAgLnNlbGVjdEFsbChcImdcIilcclxuICAgIC5kYXRhKGQzLnN0YWNrKCkua2V5cyhrZXlzKShkYXRhKSlcclxuICAgIC5lbnRlcigpLmFwcGVuZChcImdcIilcclxuICAgICAgLmF0dHIoXCJmaWxsXCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIHooZC5rZXkpOyB9KVxyXG4gICAgLnNlbGVjdEFsbChcInJlY3RcIilcclxuICAgIC5kYXRhKGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQ7IH0pXHJcbiAgICAuZW50ZXIoKS5hcHBlbmQoXCJyZWN0XCIpXHJcbiAgICAgIC5hdHRyKFwieVwiLCBmdW5jdGlvbihkKSB7IHJldHVybiB5KGQuZGF0YS5TdGF0ZSk7IH0pICAgICAvLy5hdHRyKFwieFwiLCBmdW5jdGlvbihkKSB7IHJldHVybiB4KGQuZGF0YS5TdGF0ZSk7IH0pXHJcbiAgICAgIC5hdHRyKFwieFwiLCBmdW5jdGlvbihkKSB7IHJldHVybiB4KGRbMF0pOyB9KSAgICAgICAgIC8vLmF0dHIoXCJ5XCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIHkoZFsxXSk7IH0pIFxyXG4gICAgICAuYXR0cihcIndpZHRoXCIsIGZ1bmN0aW9uKGQpIHtcclxuICAgICAgICBcclxuICAgICAgIHJldHVybiB4KGRbMV0pIC0geChkWzBdKTsgXHJcbiAgICB9KSAvLy5hdHRyKFwiaGVpZ2h0XCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIHkoZFswXSkgLSB5KGRbMV0pOyB9KVxyXG4gICAgICAuYXR0cihcImhlaWdodFwiLCB5LmJhbmR3aWR0aCgpKTsgICAgICAgICAgICAgICAvLy5hdHRyKFwid2lkdGhcIiwgeC5iYW5kd2lkdGgoKSk7ICBcclxuXHJcbiAgZy5hcHBlbmQoXCJnXCIpXHJcbiAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJheGlzXCIpXHJcbiAgICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKDAsMClcIikgICAgICAgICAgICAvLyAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoMCxcIiArIGhlaWdodCArIFwiKVwiKVxyXG4gICAgICAuY2FsbChkMy5heGlzTGVmdCh5KSk7ICAgICAgICAgICAgICAgICAgLy8gICAuY2FsbChkMy5heGlzQm90dG9tKHgpKTtcclxuXHJcbiAgZy5hcHBlbmQoXCJnXCIpXHJcbiAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJheGlzXCIpXHJcbiAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZSgwLFwiK2hlaWdodCtcIilcIikgICAgICAgLy8gTmV3IGxpbmVcclxuICAgICAgLmNhbGwoZDMuYXhpc0JvdHRvbSh4KS50aWNrcyhudWxsLCBcInNcIikpICAgICAgICAgIC8vICAuY2FsbChkMy5heGlzTGVmdCh5KS50aWNrcyhudWxsLCBcInNcIikpXHJcbiAgICAuYXBwZW5kKFwidGV4dFwiKVxyXG4gICAgICAuYXR0cihcInlcIiwgMikgICAgICAgICAgICAgICAgICAgICAgIC8vICAgICAuYXR0cihcInlcIiwgMilcclxuICAgICAgLmF0dHIoXCJ4XCIsIHgoeC50aWNrcygpLnBvcCgpKSArIDAuNSkgICAgICAgICAgICAvLyAgICAgLmF0dHIoXCJ5XCIsIHkoeS50aWNrcygpLnBvcCgpKSArIDAuNSlcclxuICAgICAgLmF0dHIoXCJkeVwiLCBcIjRlbVwiKSAgICAgICAgICAgICAgICAgICAvLyAgICAgLmF0dHIoXCJkeVwiLCBcIjAuMzJlbVwiKVxyXG4gICAgICAuYXR0cihcImZpbGxcIiwgXCIjMDAwXCIpXHJcbiAgICAgIC5hdHRyKFwidGV4dC1hbmNob3JcIiwgXCJzdGFydFwiKVxyXG4gICAgICAudGV4dChcIlByb2JhYmlsaXR5L0Nvc2luZSBTaW1pbGFyaXR5XCIpXHJcbiAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZShcIisgKC13aWR0aCkgK1wiLC0xMClcIik7ICAgIC8vIE5ld2xpbmVcclxuXHJcbiAgdmFyIGxlZ2VuZCA9IGcuYXBwZW5kKFwiZ1wiKVxyXG4gICAgICAuYXR0cihcImZvbnQtZmFtaWx5XCIsIFwic2Fucy1zZXJpZlwiKVxyXG4gICAgICAuYXR0cihcImZvbnQtc2l6ZVwiLCAxMClcclxuICAgICAgLmF0dHIoXCJ0ZXh0LWFuY2hvclwiLCBcImVuZFwiKVxyXG4gICAgLnNlbGVjdEFsbChcImdcIilcclxuICAgIC5kYXRhKGtleXMuc2xpY2UoKS5yZXZlcnNlKCkpXHJcbiAgICAuZW50ZXIoKS5hcHBlbmQoXCJnXCIpXHJcbiAgICAvLy5hdHRyKFwidHJhbnNmb3JtXCIsIGZ1bmN0aW9uKGQsIGkpIHsgcmV0dXJuIFwidHJhbnNsYXRlKDAsXCIgKyBpICogMjAgKyBcIilcIjsgfSk7XHJcbiAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIGZ1bmN0aW9uKGQsIGkpIHsgcmV0dXJuIFwidHJhbnNsYXRlKC01MCxcIiArICgzMDAgKyBpICogMjApICsgXCIpXCI7IH0pO1xyXG4gIFxyXG5cclxuICB2YXIga2V5czEgPSBbXCJPdmVyYWxsIFRlcm0gRnJlcXVlbmN5L092ZXJhbGwgUmVsZXZhbmNlXCIsIFwiRXN0aW1hdGVkIFRlcm0gZnJlcXVlbmN5IHdpdGhpbiB0aGUgc2VsZWN0ZWQgdG9waWNcIl07XHJcbiAgdmFyIHN2ZzEgPSBkMy5zZWxlY3QoXCIjbGVnZW5kVFwiKS5hcHBlbmQoXCJzdmdcIikuYXR0cihcIndpZHRoXCIsIDUwMCkuYXR0cihcImhlaWdodFwiLCBoZWlnaHQpLmF0dHIoXCJpZFwiLFwibGVnZW5kc3ZnXCIpXHJcbnZhciBsZWdlbmQgPSBzdmcxLmFwcGVuZChcImdcIikuYXR0cihcImZvbnQtZmFtaWx5XCIsIFwic2Fucy1zZXJpZlwiKS5hdHRyKFwiZm9udC1zaXplXCIsIDEwKS5hdHRyKFwidGV4dC1hbmNob3JcIiwgXCJlbmRcIikuc2VsZWN0QWxsKFwiZ1wiKS5kYXRhKGtleXMxLnNsaWNlKCkucmV2ZXJzZSgpKS5lbnRlcigpLmFwcGVuZChcImdcIikgLy8uYXR0cihcInRyYW5zZm9ybVwiLCBmdW5jdGlvbihkLCBpKSB7IHJldHVybiBcInRyYW5zbGF0ZSgwLFwiICsgaSAqIDIwICsgXCIpXCI7IH0pO1xyXG4gICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgZnVuY3Rpb24gKGQsIGkpIHtcclxuICAgICAgcmV0dXJuIFwidHJhbnNsYXRlKC01MCxcIiArICgwICsgaSAqIDIwKSArIFwiKVwiO1xyXG4gICAgfSk7XHJcbiAgbGVnZW5kLmFwcGVuZChcInJlY3RcIikuYXR0cihcInhcIiwgd2lkdGgpXHJcbiAgLmF0dHIoXCJ3aWR0aFwiLCBmdW5jdGlvbiAoZCwgaSl7XHJcbiAgICAgIGlmKGk9PTApe1xyXG4gICAgICAgIHJldHVybiA2MDtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gMTYwO1xyXG4gIH0pLmF0dHIoXCJoZWlnaHRcIiwgMTkpLmF0dHIoXCJmaWxsXCIsIHopO1xyXG5cclxuICBsZWdlbmQuYXBwZW5kKFwidGV4dFwiKS5hdHRyKFwieFwiLCB3aWR0aCAtIDEwKS5hdHRyKFwieVwiLCAxOCkuYXR0cihcImR5XCIsIFwiMC4wZW1cIikudGV4dChmdW5jdGlvbiAoZCkge1xyXG4gICAgcmV0dXJuIGQ7XHJcbiAgfSk7XHJcbiAgXHJcbn0iLCJmdW5jdGlvbiBnZW5lcmF0ZVRvcGljVmVjdG9ycygpe1xyXG4gICAgd2luZG93LnRvcGljVmVjdG9ycyA9IHt9O1xyXG4gICAgaWYod2luZG93LnRvcGljX3dvcmRfcHJvYmFiaWxpdHlfaW5fdG9waWMpe1xyXG4gICAgICAgIGZvcih2YXIgeCBpbiB3aW5kb3cudG9waWNfd29yZF9wcm9iYWJpbGl0eV9pbl90b3BpYyl7XHJcbiAgICAgICAgICAgIHZhciB2ZWN0b3IgPSBbXTtcclxuICAgICAgICAgICAgZm9yKHZhciB5IGluIHdpbmRvdy50b3BpY193b3JkX3Byb2JhYmlsaXR5X2luX3RvcGljW3hdKXtcclxuICAgICAgICAgICAgICAgIHZlY3Rvci5wdXNoKHdpbmRvdy50b3BpY193b3JkX3Byb2JhYmlsaXR5X2luX3RvcGljW3hdW3ldKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB3aW5kb3cudG9waWNWZWN0b3JzW3hdID0gdmVjdG9yO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuZnVuY3Rpb24gZ2VuZXJhdGVQYXJhbGxlbENvb3JkaW5hdGVEYXRhKHJlc3BvbnNlLCB0b3BpY190aHJlc2hvbGQsIHdvcmRfdGhyZXNob2xkKXtcclxuICAgIGxldCB2aXNEYXRhID0gW107XHJcbiAgICBmb3IgKHZhciBkb2NLZXkgaW4gcmVzcG9uc2VbXCJkb2N1bWVudF90b3BpY1wiXSl7XHJcbiAgICAgICAgZm9yKHZhciB0b3BpYyBpbiByZXNwb25zZVtcImRvY3VtZW50X3RvcGljXCJdW2RvY0tleV0pe1xyXG4gICAgICAgICAgICBsZXQgdG9waWNTY29yZSA9IHJlc3BvbnNlW1wiZG9jdW1lbnRfdG9waWNcIl1bZG9jS2V5XVt0b3BpY107XHJcbiAgICAgICAgICAgIGlmICh0b3BpY1Njb3JlID4gdG9waWNfdGhyZXNob2xkKXtcclxuXHJcbiAgICAgICAgICAgICAgICBmb3IodmFyIHdvcmQgaW4gcmVzcG9uc2VbXCJ0b3BpY193b3JkXCJdW3RvcGljXSl7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IHdvcmRTY29yZSA9IHJlc3BvbnNlW1widG9waWNfd29yZFwiXVt0b3BpY11bd29yZF07XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHdvcmRTY29yZSA+IHdvcmRfdGhyZXNob2xkKXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmlzRGF0YS5wdXNoKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwibmFtZVwiOiBkb2NLZXksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImRvY3VtZW50XCI6ICBkb2NLZXksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcInRvcGljXCI6IHRvcGljLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJ3b3JkXCI6IHJlc3BvbnNlW1wib3ZlcmFsbF93b3JkXCJdW3dvcmRdXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdmlzRGF0YTtcclxufVxyXG5cclxuZnVuY3Rpb24gZ2VuZXJhdGVQYXJhbGxlbENvb3JkaW5hdGVEYXRhSEMocmVzcG9uc2UsIHRvcGljX3RocmVzaG9sZCwgd29yZF90aHJlc2hvbGQpe1xyXG4gICAgbGV0IHZpc0RhdGEgPSBbXTtcclxuICAgIGZvciAodmFyIGRvY0tleSBpbiByZXNwb25zZVtcImRvY3VtZW50X3RvcGljXCJdKXtcclxuICAgICAgICBmb3IodmFyIHRvcGljIGluIHJlc3BvbnNlW1wiZG9jdW1lbnRfdG9waWNcIl1bZG9jS2V5XSl7XHJcbiAgICAgICAgICAgIGxldCB0b3BpY1Njb3JlID0gcmVzcG9uc2VbXCJkb2N1bWVudF90b3BpY1wiXVtkb2NLZXldW3RvcGljXTtcclxuICAgICAgICAgICAgaWYgKHRvcGljU2NvcmUgPiB0b3BpY190aHJlc2hvbGQpe1xyXG5cclxuICAgICAgICAgICAgICAgIGZvcih2YXIgd29yZCBpbiByZXNwb25zZVtcInRvcGljX3dvcmRcIl1bdG9waWNdKXtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgd29yZFNjb3JlID0gcmVzcG9uc2VbXCJ0b3BpY193b3JkXCJdW3RvcGljXVt3b3JkXTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAod29yZFNjb3JlID4gd29yZF90aHJlc2hvbGQpe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2aXNEYXRhLnB1c2goW3BhcnNlSW50KGRvY0tleSksIHBhcnNlSW50KHRvcGljKSwgcmVzcG9uc2VbXCJ3b3Jkc1wiXS5pbmRleE9mKHdvcmQpXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiB2aXNEYXRhO1xyXG59XHJcblxyXG5cclxuIiwid2luZG93LnZ1ZUFwcCA9IG5ldyBWdWUoe1xyXG4gICAgZWw6ICcjdnVlLWFwcCcsXHJcbiAgICBkYXRhOiB7XHJcbiAgICAgICAgbWVzc2FnZTogJ0hlbGxvIHVzZXIhJyxcclxuICAgICAgICBub25lU2VsZWN0ZWQ6IHRydWUsXHJcbiAgICAgICAgc2VsZWN0ZWRQYWdlOiA1LFxyXG4gICAgICAgIHBsYXllckRldGFpbDoge1xyXG4gICAgICAgICAgICBuYW1lOiBcIjxQbGF5ZXIgTmFtZT5cIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgb3ZlcnZpZXdGaWx0ZXJzOiB7fSxcclxuICAgICAgICBuZXdEb2NzOiBbXSxcclxuICAgICAgICBzZWxlY3RlZE1hcDogMSxcclxuICAgICAgICBzdWNjZXNzOiBmYWxzZSxcclxuICAgICAgICBsb2FkaW5nOiBmYWxzZSxcclxuICAgICAgICBmYWlsdXJlOiBmYWxzZSxcclxuICAgICAgICBuZXdEb2M6ICcnLFxyXG4gICAgICAgIG5ld0RvY3NQcm9jY2Vzc2VkOiAnJyxcclxuICAgICAgICBzaG93UHJvY2Vzc2VkOiBmYWxzZSxcclxuICAgICAgICBzZXR0aW5nczoge1xyXG4gICAgICAgICAgICBzZWxlY3RlZE1ldGhvZDogXCJMREFcIixcclxuICAgICAgICAgICAgc2VsZWN0ZWREYXRhc2V0OiAwLFxyXG4gICAgICAgICAgICBzdGFydDE6IDAsICAgICAgLy9IYXBweURCXHJcbiAgICAgICAgICAgIGVuZDE6IDEwLCAgICAgICAgLy9IYXBweURCXHJcbiAgICAgICAgICAgIHN0YXJ0MjogMCwgICAgICAvL01lZGl1bVxyXG4gICAgICAgICAgICBlbmQyOiA1LCAgICAgICAgLy9NZWRpdW1cclxuICAgICAgICAgICAgbGRhVG9waWNUaHJlc2hvbGQ6IDAsXHJcbiAgICAgICAgICAgIHdvcmQyVmVjVGhyZXNob2xkOiAwXHJcbiAgICAgICAgfSxcclxuICAgICAgICBwYXJhbXM6IHtcclxuICAgICAgICAgICAgdG9waWNUaHJlc2hvbGQ6IDAuMDIsXHJcbiAgICAgICAgICAgIHdvcmRUaHJlc2hvbGQ6IDAuMDJcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG4gICAgbWV0aG9kczoge1xyXG4gICAgICAgIHNlbGVjdFBhZ2U6IGZ1bmN0aW9uKHgpe1xyXG4gICAgICAgICAgICB0aGlzLnNlbGVjdGVkUGFnZSA9IHg7XHJcbiAgICAgICAgICAgIGlmICh4ID09IDEpe1xyXG4gICAgICAgICAgICAgICAgaW5pdFBhZ2UxKHdpbmRvdy5nbG9iYWxfZGF0YSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKHggPT0gMil7XHJcbiAgICAgICAgICAgICAgICBpbml0UGFnZTIod2luZG93Lmdsb2JhbF9kYXRhKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoeCA9PSAzKXtcclxuICAgICAgICAgICAgICAgIGluaXRQYWdlMyh3aW5kb3cuZ2xvYmFsX2RhdGEpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICh4ID09IDQpe1xyXG4gICAgICAgICAgICAgICAgaW5pdFBhZ2U0KHdpbmRvdy5nbG9iYWxfZGF0YSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIGFkZE5ld0RvYzogZnVuY3Rpb24oKXtcclxuICAgICAgICAgICAgaWYgKHRoaXMubmV3RG9jLnRyaW0oKS5zcGxpdChcIiBcIikubGVuZ3RoIDwgMyl7XHJcbiAgICAgICAgICAgICAgICBhbGVydChcIlBsZWFzZSBhZGQgYXQgbGVhc3QgMyB3b3Jkc1wiKTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLm5ld0RvY3MucHVzaCh0aGlzLm5ld0RvYyk7XHJcbiAgICAgICAgICAgIHRoaXMubmV3RG9jID0gJyc7XHJcbiAgICAgICAgICAgIHRoaXMuc2hvd1Byb2Nlc3NlZCA9IGZhbHNlO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgcHJvY2Vzc0RvY3M6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xyXG4gICAgICAgICAgICBnZXRUb2tlbml6ZWREb2NzKHRoaXMubmV3RG9jcywgZnVuY3Rpb24ocmVzcCl7XHJcbiAgICAgICAgICAgICAgICBzZWxmLm5ld0RvY3NQcm9jY2Vzc2VkID0gcmVzcDtcclxuICAgICAgICAgICAgICAgIHNlbGYuc2hvd1Byb2Nlc3NlZCA9IHRydWU7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgc2F2ZUNoYW5nZXM6IGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICAgIHZhciBzZWxmID0gdGhpcztcclxuICAgICAgICAgICAgc2VsZi5zdWNjZXNzID0gZmFsc2U7XHJcbiAgICAgICAgICAgIHNlbGYuZmFpbHVyZSA9IGZhbHNlO1xyXG4gICAgICAgICAgICBpZiAodGhpcy5zZXR0aW5ncy5zZWxlY3RlZERhdGFzZXQgPT0gMCl7XHJcbiAgICAgICAgICAgICAgICBpZih0aGlzLnNldHRpbmdzLmVuZDEgLSB0aGlzLnNldHRpbmdzLnN0YXJ0MSA8IDEwKXtcclxuICAgICAgICAgICAgICAgICAgICBhbGVydChcIlRoZXJlIG5lZWRzIHRvIGJlIGF0bGVhc3QgNSBkb2N1bWVudHMoJiA8PSA1MCkgZm9yIEhhcHB5IERCLiBBbmQgc3RhcnQgaW5kZXggY2FuIG5vdCBiZSBncmVhdGVyIHRoYW4gZW5kLlwiKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYodGhpcy5zZXR0aW5ncy5lbmQxIC0gdGhpcy5zZXR0aW5ncy5zdGFydDEgPiA1MCl7XHJcbiAgICAgICAgICAgICAgICAgICAgYWxlcnQoXCJUaGVyZSBuZWVkcyB0byBiZSBsZXNzIHRoYW4gNTAgZG9jdW1lbnRzIGZvciBIYXBweURCLlwiKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodGhpcy5zZXR0aW5ncy5zZWxlY3RlZERhdGFzZXQgPT0gMSl7XHJcbiAgICAgICAgICAgICAgICBpZih0aGlzLnNldHRpbmdzLmVuZDIgLSB0aGlzLnNldHRpbmdzLnN0YXJ0MiA8IDUpe1xyXG4gICAgICAgICAgICAgICAgICAgIGFsZXJ0KFwiVGhlcmUgbmVlZHMgdG8gYmUgYXRsZWFzdCA1IGRvY3VtZW50cygmIDw9IDMwKSBmb3IgTWVkaXVtIEFydGljbGVzLiBBbmQgc3RhcnQgaW5kZXggY2FuIG5vdCBiZSBncmVhdGVyIHRoYW4gZW5kLlwiKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYodGhpcy5zZXR0aW5ncy5lbmQyIC0gdGhpcy5zZXR0aW5ncy5zdGFydDIgPiAzMCl7XHJcbiAgICAgICAgICAgICAgICAgICAgYWxlcnQoXCJUaGVyZSBuZWVkcyB0byBiZSBsZXNzIHRoYW4gMzAgZG9jdW1lbnRzIGZvciBNZWRpdW0gQXJ0aWNsZXMuXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSBlbHNlIGlmICh0aGlzLnNldHRpbmdzLnNlbGVjdGVkRGF0YXNldCA9PSAyKXtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIXRoaXMuc2hvd1Byb2Nlc3NlZCl7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFsZXJ0KFwiUGxlYXNlIHByb2Nlc3MgYWxsIGRvY3VtZW50cyBmaXJzdFwiKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB3aW5kb3cuZG9jdW1lbnRzID0gdGhpcy5uZXdEb2NzUHJvY2Nlc3NlZDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBzZWxmLmxvYWRpbmcgPSB0cnVlO1xyXG5cclxuICAgICAgICAgICAgZ2V0QW5hbHlzaXModGhpcy5zZXR0aW5ncy5zZWxlY3RlZE1ldGhvZCwgZnVuY3Rpb24ocmVzcCl7XHJcbiAgICAgICAgICAgICAgICBzZWxmLnN1Y2Nlc3MgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgc2VsZi5sb2FkaW5nID0gZmFsc2U7XHJcbiAgICAgICAgICAgIH0sIGZ1bmN0aW9uIChlcnJvclN0YXR1cykge1xyXG4gICAgICAgICAgICAgICAgc2VsZi5sb2FkaW5nID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICBzZWxmLmZhaWx1cmUgPSB0cnVlO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG4gICAgbW91bnRlZDogZnVuY3Rpb24oKXtcclxuICAgICAgICBjb25zb2xlLmxvZyhcIk1vdW50ZWRcIik7XHJcbiAgICAgICAgbG9hZEQzKCk7XHJcbiAgICAgICAgbG9hZEpxdWVyeSgpO1xyXG4gICAgfVxyXG59KTsiLCJmdW5jdGlvbiBsb2FkV29yZENsb3VkKHJlc3Ape1xyXG4gICAgbGV0IGRhdGEgPSBbXTtcclxuICAgIGZvcih2YXIgd29yZCBpbiByZXNwW1wib3ZlcmFsbF93b3JkXCJdKXtcclxuICAgICAgICBsZXQgd2VpZ2h0ID0gcmVzcFtcIm92ZXJhbGxfd29yZFwiXVt3b3JkXTtcclxuICAgICAgICAgZGF0YS5wdXNoKHtcclxuICAgICAgICAgICAgbmFtZTogd29yZCxcclxuICAgICAgICAgICAgd2VpZ2h0OiB3ZWlnaHRcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuICAgIGNyZWF0ZVdvcmRDbG91ZChcIm92ZXJhbGwtd2NcIiwgZGF0YSwgXCJBbGwgRG9jdW1lbnRzXCIpO1xyXG5cclxuICAgIGZvcih2YXIgdG9waWMgaW4gcmVzcFtcInRvcGljX3dvcmRcIl0pe1xyXG4gICAgICAgIGxldCBkYXRhID0gW107XHJcbiAgICAgICAgZm9yKHZhciB3b3JkIGluIHJlc3BbXCJ0b3BpY193b3JkXCJdW3RvcGljXSl7XHJcbiAgICAgICAgICAgIGxldCB3ZWlnaHQgPSByZXNwW1widG9waWNfd29yZFwiXVt0b3BpY11bd29yZF07XHJcbiAgICAgICAgICAgIGRhdGEucHVzaCh7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiB3b3JkLFxyXG4gICAgICAgICAgICAgICAgd2VpZ2h0OiB3ZWlnaHRcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgICQoXCIjdG9waWMtd2NzXCIpLmFwcGVuZCgnPGRpdiBjbGFzcz1cImNvbC1zbS02XCI+PGRpdiBzdHlsZT1cIm91dGxpbmU6IHNvbGlkIDFweDtcIiBpZD1cInRvcGljJyt0b3BpYysnXCIgc3R5bGU9XCJoZWlnaHQ6IDMwMHB4O1wiPjwvZGl2PjwvZGl2PicpO1xyXG4gICAgICAgIGNyZWF0ZVdvcmRDbG91ZChcInRvcGljXCIrdG9waWMsIGRhdGEsIFwiVG9waWMgXCIrdG9waWMpO1xyXG4gICAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBjcmVhdGVXb3JkQ2xvdWQoaWQsIGRhdGEsIHRpdGxlKXtcclxuICAgIEhpZ2hjaGFydHMuY2hhcnQoaWQsIHtcclxuICAgICAgICBzZXJpZXM6IFt7XHJcbiAgICAgICAgICAgIHR5cGU6ICd3b3JkY2xvdWQnLFxyXG4gICAgICAgICAgICBkYXRhOiBkYXRhLFxyXG4gICAgICAgICAgICByb3RhdGlvbjoge1xyXG4gICAgICAgICAgICAgICAgZnJvbTogMCxcclxuICAgICAgICAgICAgICAgIHRvOiAwLFxyXG4gICAgICAgICAgICAgICAgb3JpZW50YXRpb25zOiA1XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIG5hbWU6ICdTY29yZSdcclxuICAgICAgICB9XSxcclxuICAgICAgICB0aXRsZToge1xyXG4gICAgICAgICAgICB0ZXh0OiB0aXRsZVxyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59Il19
