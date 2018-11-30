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
        if (childrenWords.hasOwnProperty(childKey) && childrenWords[childKey] > 0.01) {
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
  var data = generateParallelCoordinateDataHC(resp, 0, 0);
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

  var cars = generateParallelCoordinateData(resp, 0, 0); // var axisD = d3V3.svg.axis().orient("left").ticks(Object.keys(resp["document_topic"]).length),

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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNsdXN0ZXJfZm9yY2VfbGF5b3V0LmpzIiwiZXZlbnRzLmpzIiwibWFpbi5qcyIsIm5ldHdvcmsuanMiLCJwYXJhbGxlbC1jb29yZGluYXRlLWhjLmpzIiwicGFyYWxsZWwtY29vcmRpbmF0ZS5qcyIsInNjYXR0ZXJfcGxvdF93aXRoX3dlaWdodHMuanMiLCJzdGFja2VkX2Jhcl9ncmFwaC5qcyIsInV0aWwuanMiLCJ2dWVfbW9kZWwuanMiLCJ3b3JkY2xvdWQuanMiXSwibmFtZXMiOlsiQXJyYXkiLCJwcm90b3R5cGUiLCJjb250YWlucyIsInYiLCJpIiwibGVuZ3RoIiwidW5pcXVlIiwiYXJyIiwiaW5jbHVkZXMiLCJwdXNoIiwicmVuZGVyQ2x1c3RlckZvcmNlTGF5b3V0IiwiZGF0YSIsImRhdGFWYWwiLCJmaW5hbF9kaWN0Iiwia2V5IiwiaGFzT3duUHJvcGVydHkiLCJjaGlsZHJlbldvcmRzIiwiY2hpbGRLZXkiLCJjbHVzdGVyX2RhdGEiLCJjb3VudCIsImhhc2giLCJhcnJheV9jaGlsZCIsImNoaWxkcyIsImNoaWxkX2hhc2giLCJjaGlsZHJlbiIsImQzIiwid2luZG93IiwiZDNWMyIsInJlbmRlckNsdXN0ZXIiLCJyYWRpdXMiLCJkZW5kb2dyYW1Db250YWluZXIiLCJkZW5kb2dyYW1EYXRhU291cmNlIiwicm9vdE5vZGVTaXplIiwibGV2ZWxPbmVOb2RlU2l6ZSIsImxldmVsVHdvTm9kZVNpemUiLCJsZXZlbFRocmVlTm9kZVNpemUiLCJkdXJhdGlvbiIsInJvb3RKc29uRGF0YSIsImNsdXN0ZXIiLCJsYXlvdXQiLCJzaXplIiwic2VwYXJhdGlvbiIsImEiLCJiIiwicGFyZW50IiwiZGVwdGgiLCJkaWFnb25hbCIsInN2ZyIsInJhZGlhbCIsInByb2plY3Rpb24iLCJkIiwieSIsIngiLCJNYXRoIiwiUEkiLCJjb250YWluZXJEaXYiLCJzZWxlY3QiLCJkb2N1bWVudCIsImdldEVsZW1lbnRCeUlkIiwiYXBwZW5kIiwiYXR0ciIsInRleHQiLCJvbiIsImNvbGxhcHNlTGV2ZWxzIiwic3ZnUm9vdCIsImNhbGwiLCJiZWhhdmlvciIsInpvb20iLCJzY2FsZSIsInNjYWxlRXh0ZW50IiwiYW5pbUdyb3VwIiwiZm9yRWFjaCIsImNvbGxhcHNlIiwiY3JlYXRlQ29sbGFwc2libGVEZW5kcm9HcmFtIiwic291cmNlIiwibm9kZXMiLCJwYXRobGlua3MiLCJsaW5rcyIsIm5vZGUiLCJzZWxlY3RBbGwiLCJpZCIsIm5vZGVFbnRlciIsImVudGVyIiwidG9nZ2xlQ2hpbGRyZW4iLCJhbGlhcyIsIm5hbWUiLCJub2RlVXBkYXRlIiwidHJhbnNpdGlvbiIsInN0eWxlIiwiY29sb3IiLCJvcmRlciIsIm5vZGVFeGl0IiwiZXhpdCIsInJlbW92ZSIsImxpbmsiLCJ0YXJnZXQiLCJpbnNlcnQiLCJvIiwieDAiLCJ5MCIsImNsaWNrVHlwZSIsIl9jaGlsZHJlbiIsInR5cGUiLCJ1bmRlZmluZWQiLCJoaWdobGlnaHROb2RlU2VsZWN0aW9ucyIsImhpZ2hsaWdodFJvb3RUb05vZGVQYXRoIiwiaGlnaGxpZ2h0TGlua0NvbG9yIiwiZGVmYXVsdExpbmtDb2xvciIsIm5vZGVDb2xvciIsInBhdGhMaW5rcyIsImRkIiwiYW5jZXN0b3JzIiwiXyIsImlzVW5kZWZpbmVkIiwibWF0Y2hlZExpbmtzIiwiZmlsdGVyIiwiYW55IiwicCIsImVhY2giLCJhbmltYXRlQ2hhaW5zIiwiY2xhc3NlZCIsIm92ZXJsYXlCb3giLCJnZXRCQm94IiwiZXZlbnQiLCJ0cmFuc2xhdGUiLCJjaGVja0ZvclRoaXJkTGV2ZWxPcGVuQ2hpbGRyZW4iLCJ0b2dnbGVBbGxTZWNvbmRMZXZlbENoaWxkcmVuIiwidG9nZ2xlU2Vjb25kTGV2ZWxDaGlsZHJlbiIsInJvb3RJbmRleCIsInJvb3RMZW5ndGgiLCJpc05vZGVPcGVuIiwiY2hpbGRJbmRleCIsImNoaWxkTGVuZ3RoIiwic2Vjb25kTGV2ZWxDaGlsZCIsImxvYWRKcXVlcnkiLCIkIiwicmVhZHkiLCJjbGljayIsInNpZGViYXIiLCJyZXF1aXJlIiwiY29uZmlnIiwicGF0aHMiLCJsb2FkRDMiLCJkM09sZCIsImRvY3VtZW50cyIsImdldEFuYWx5c2lzIiwiZ2V0RG9jcyIsInRleHRzIiwibWFwIiwic3BsaXQiLCJtZXRob2QiLCJzdWNjZXNzIiwiZmFpbCIsImRvY3MiLCJmbmMiLCJnZXRMREFDbHVzdGVycyIsImdldFdvcmQyVmVjQ2x1c3RlcnMiLCJsb2FkREZ1bmMiLCJyZXNwIiwiZ2xvYmFsX2RhdGEiLCJpbml0UGFnZTEiLCJpbml0UGFnZTIiLCJpbml0UGFnZTMiLCJpbml0UGFnZTQiLCJsb2FkVmlzdWFsaXphdGlvbnMiLCJyZW5kZXJDbHVzdGVyQW5hbHlzaXMiLCJodG1sIiwibG9hZFBhcmFsbGVsQ29vcmRpbmF0ZSIsImxvYWRQYXJhbGxlbENvb3JkaW5hdGVzSEMiLCJsb2FkV29yZENsb3VkIiwiZ2V0MkRWZWN0b3JzIiwidmVjdG9ycyIsInN1Y2Nlc3NDYWxsYmFjayIsInJlcXVlc3QiLCJhamF4IiwidXJsIiwiZG9uZSIsInJlc3BvbnNlIiwianFYSFIiLCJ0ZXh0U3RhdHVzIiwiYWxlcnQiLCJnZXRUb2tlbml6ZWREb2NzIiwiZmFpbHVyZUNhbGxiYWNrIiwiSlNPTiIsInN0cmluZ2lmeSIsImNvbnRlbnRUeXBlIiwiZGF0YVR5cGUiLCJzdGFydCIsInZ1ZUFwcCIsInNldHRpbmdzIiwic3RhcnQyIiwiZW5kIiwiZW5kMiIsInNlbGVjdGVkIiwic2VsZWN0ZWREYXRhc2V0IiwicGFyc2UiLCJzdGFydDEiLCJlbmQxIiwiZ2VuZXJhdGVQYXJhbGxlbENvb3JkaW5hdGVEYXRhSEMiLCJIaWdoY2hhcnRzIiwiY2hhcnQiLCJwYXJhbGxlbENvb3JkaW5hdGVzIiwicGFyYWxsZWxBeGVzIiwibGluZVdpZHRoIiwidGl0bGUiLCJwbG90T3B0aW9ucyIsInNlcmllcyIsImFuaW1hdGlvbiIsIm1hcmtlciIsImVuYWJsZWQiLCJzdGF0ZXMiLCJob3ZlciIsImhhbG8iLCJldmVudHMiLCJtb3VzZU92ZXIiLCJncm91cCIsInRvRnJvbnQiLCJ4QXhpcyIsImNhdGVnb3JpZXMiLCJvZmZzZXQiLCJ5QXhpcyIsIk9iamVjdCIsImtleXMiLCJ2YWx1ZXMiLCJjb2xvcnMiLCJzZXQiLCJzaGFkb3ciLCJtYXJnaW4iLCJ0b3AiLCJyaWdodCIsImJvdHRvbSIsImxlZnQiLCJ3aWR0aCIsImhlaWdodCIsIm9yZGluYWwiLCJyYW5nZVBvaW50cyIsImRyYWdnaW5nIiwibGluZSIsImJhY2tncm91bmQiLCJmb3JlZ3JvdW5kIiwiZGltZW5zaW9ucyIsImNhcnMiLCJnZW5lcmF0ZVBhcmFsbGVsQ29vcmRpbmF0ZURhdGEiLCJheGlzRCIsImF4aXMiLCJvcmllbnQiLCJ0aWNrVmFsdWVzIiwicGFyc2VJbnQiLCJheGlzVCIsImF4aXNXIiwicGFyc2VGbG9hdCIsImRvbWFpbiIsImxpbmVhciIsImV4dGVudCIsInJhbmdlIiwicGF0aCIsImciLCJkcmFnIiwib3JpZ2luIiwibWluIiwibWF4Iiwic29ydCIsInBvc2l0aW9uIiwiZGVsYXkiLCJicnVzaCIsImJydXNoc3RhcnQiLCJzb3VyY2VFdmVudCIsInN0b3BQcm9wYWdhdGlvbiIsImFjdGl2ZXMiLCJlbXB0eSIsImV4dGVudHMiLCJldmVyeSIsImRvY3VtZW50X3RvcGljIiwidG9waWNfdmVjdG9ycyIsImJiIiwicXVlcnlTZWxlY3RvciIsImdldEJvdW5kaW5nQ2xpZW50UmVjdCIsInZhbHVlIiwiYyIsImxhYmVsWCIsImxhYmVsWSIsInNjYWxlTGluZWFyIiwic2NhbGVTcXJ0Iiwib3BhY2l0eSIsImF4aXNCb3R0b20iLCJheGlzTGVmdCIsInJlbmRlckJhckdyYXBoIiwiZmFkZSIsImZhZGVPdXQiLCJ0b3BpY19udW1iZXIiLCJmaW5hbF9kYXRhIiwidGVtcCIsIlN0YXRlIiwidG9waWNfZnJlcXVlbmN5IiwiYWJzIiwib3ZlcmFsbCIsInRvdGFsIiwiY29uc29sZSIsImxvZyIsInNjYWxlQmFuZCIsInJhbmdlUm91bmQiLCJwYWRkaW5nSW5uZXIiLCJhbGlnbiIsInoiLCJzY2FsZU9yZGluYWwiLCJuaWNlIiwic3RhY2siLCJiYW5kd2lkdGgiLCJ0aWNrcyIsInBvcCIsImxlZ2VuZCIsInNsaWNlIiwicmV2ZXJzZSIsImtleXMxIiwic3ZnMSIsImdlbmVyYXRlVG9waWNWZWN0b3JzIiwidG9waWNWZWN0b3JzIiwidG9waWNfd29yZF9wcm9iYWJpbGl0eV9pbl90b3BpYyIsInZlY3RvciIsInRvcGljX3RocmVzaG9sZCIsIndvcmRfdGhyZXNob2xkIiwidmlzRGF0YSIsImRvY0tleSIsInRvcGljIiwidG9waWNTY29yZSIsIndvcmQiLCJ3b3JkU2NvcmUiLCJpbmRleE9mIiwiVnVlIiwiZWwiLCJtZXNzYWdlIiwibm9uZVNlbGVjdGVkIiwic2VsZWN0ZWRQYWdlIiwicGxheWVyRGV0YWlsIiwib3ZlcnZpZXdGaWx0ZXJzIiwibmV3RG9jcyIsInNlbGVjdGVkTWFwIiwibG9hZGluZyIsIm5ld0RvYyIsIm5ld0RvY3NQcm9jY2Vzc2VkIiwic2hvd1Byb2Nlc3NlZCIsInNlbGVjdGVkTWV0aG9kIiwibGRhVG9waWNUaHJlc2hvbGQiLCJ3b3JkMlZlY1RocmVzaG9sZCIsIm1ldGhvZHMiLCJzZWxlY3RQYWdlIiwiYWRkTmV3RG9jIiwidHJpbSIsInByb2Nlc3NEb2NzIiwic2VsZiIsInNhdmVDaGFuZ2VzIiwiZmFpbHVyZSIsImVycm9yU3RhdHVzIiwibW91bnRlZCIsIndlaWdodCIsImNyZWF0ZVdvcmRDbG91ZCIsInJvdGF0aW9uIiwiZnJvbSIsInRvIiwib3JpZW50YXRpb25zIl0sIm1hcHBpbmdzIjoiOzs7O0FBQUFBLEtBQUssQ0FBQ0MsU0FBTixDQUFnQkMsUUFBaEIsR0FBMkIsVUFBU0MsQ0FBVCxFQUFZO0FBQ25DLE9BQUksSUFBSUMsQ0FBQyxHQUFHLENBQVosRUFBZUEsQ0FBQyxHQUFHLEtBQUtDLE1BQXhCLEVBQWdDRCxDQUFDLEVBQWpDLEVBQXFDO0FBQ2pDLFFBQUcsS0FBS0EsQ0FBTCxNQUFZRCxDQUFmLEVBQWtCLE9BQU8sSUFBUDtBQUNyQjs7QUFDRCxTQUFPLEtBQVA7QUFDSCxDQUxEOztBQU9BSCxLQUFLLENBQUNDLFNBQU4sQ0FBZ0JLLE1BQWhCLEdBQXlCLFlBQVc7QUFDaEMsTUFBSUMsR0FBRyxHQUFHLEVBQVY7O0FBQ0EsT0FBSSxJQUFJSCxDQUFDLEdBQUcsQ0FBWixFQUFlQSxDQUFDLEdBQUcsS0FBS0MsTUFBeEIsRUFBZ0NELENBQUMsRUFBakMsRUFBcUM7QUFDakMsUUFBRyxDQUFDRyxHQUFHLENBQUNDLFFBQUosQ0FBYSxLQUFLSixDQUFMLENBQWIsQ0FBSixFQUEyQjtBQUN2QkcsTUFBQUEsR0FBRyxDQUFDRSxJQUFKLENBQVMsS0FBS0wsQ0FBTCxDQUFUO0FBQ0g7QUFDSjs7QUFDRCxTQUFPRyxHQUFQO0FBQ0gsQ0FSRDs7QUFVQSxTQUFTRyx3QkFBVCxDQUFrQ0MsSUFBbEMsRUFBdUM7QUFDdEMsTUFBSUMsT0FBTyxHQUFHRCxJQUFJLENBQUMsWUFBRCxDQUFsQjtBQUNBLE1BQUlFLFVBQVUsR0FBRyxFQUFqQjs7QUFDQSxPQUFLLElBQUlDLEdBQVQsSUFBZ0JGLE9BQWhCLEVBQXlCO0FBQ3JCLFFBQUlBLE9BQU8sQ0FBQ0csY0FBUixDQUF1QkQsR0FBdkIsQ0FBSixFQUFpQztBQUVoQyxVQUFJRSxhQUFhLEdBQUdKLE9BQU8sQ0FBQ0UsR0FBRCxDQUEzQjs7QUFFQSxXQUFJLElBQUlHLFFBQVIsSUFBb0JELGFBQXBCLEVBQWtDO0FBRWpDLFlBQUlBLGFBQWEsQ0FBQ0QsY0FBZCxDQUE2QkUsUUFBN0IsS0FBMENELGFBQWEsQ0FBQ0MsUUFBRCxDQUFiLEdBQTBCLElBQXhFLEVBQThFO0FBRTdFLGNBQUcsRUFBRUEsUUFBUSxJQUFJSixVQUFkLENBQUgsRUFBNkI7QUFDNUJBLFlBQUFBLFVBQVUsQ0FBQ0ksUUFBRCxDQUFWLEdBQXVCLEVBQXZCO0FBQ0E7O0FBQ0RKLFVBQUFBLFVBQVUsQ0FBQ0ksUUFBRCxDQUFWLENBQXFCUixJQUFyQixDQUEwQkssR0FBMUI7QUFFQTtBQUNEO0FBQ0Q7QUFDRjs7QUFDRCxNQUFJSSxZQUFZLEdBQUc7QUFDbEIsWUFBTyxFQURXO0FBRWxCLGdCQUFXO0FBRk8sR0FBbkI7QUFLQSxNQUFJQyxLQUFLLEdBQUMsQ0FBVjs7QUFDQSxPQUFJLElBQUlMLEdBQVIsSUFBZUQsVUFBZixFQUEwQjtBQUN6QixRQUFJQSxVQUFVLENBQUNFLGNBQVgsQ0FBMEJELEdBQTFCLENBQUosRUFBb0M7QUFDbkNLLE1BQUFBLEtBQUssR0FBR0EsS0FBSyxHQUFHLENBQWhCO0FBQ0EsVUFBSUMsSUFBSSxHQUFHLEVBQVg7QUFDQUEsTUFBQUEsSUFBSSxDQUFDLE9BQUQsQ0FBSixHQUFnQkQsS0FBaEI7QUFDQUMsTUFBQUEsSUFBSSxDQUFDLE9BQUQsQ0FBSixHQUFnQixxQkFBaEI7QUFDQUEsTUFBQUEsSUFBSSxDQUFDLE9BQUQsQ0FBSixHQUFnQixTQUFoQjtBQUNBQSxNQUFBQSxJQUFJLENBQUMsTUFBRCxDQUFKLEdBQWVOLEdBQWY7QUFHQSxVQUFJTyxXQUFXLEdBQUdSLFVBQVUsQ0FBQ0MsR0FBRCxDQUFWLENBQWdCUixNQUFoQixFQUFsQjtBQUNBLFVBQUlnQixNQUFNLEdBQUUsRUFBWjs7QUFDQSxXQUFJLElBQUlsQixDQUFDLEdBQUMsQ0FBVixFQUFhQSxDQUFDLEdBQUdpQixXQUFXLENBQUNoQixNQUE3QixFQUFvQ0QsQ0FBQyxFQUFyQyxFQUF3QztBQUN2QyxZQUFJbUIsVUFBVSxHQUFHLEVBQWpCO0FBQ0FBLFFBQUFBLFVBQVUsQ0FBQyxPQUFELENBQVYsR0FBc0JuQixDQUFDLEdBQUMsQ0FBeEI7QUFDQW1CLFFBQUFBLFVBQVUsQ0FBQyxPQUFELENBQVYsR0FBc0JuQixDQUFDLEdBQUMsQ0FBRixHQUFNLEVBQTVCO0FBQ0FtQixRQUFBQSxVQUFVLENBQUMsT0FBRCxDQUFWLEdBQXNCLFNBQXRCO0FBQ0FBLFFBQUFBLFVBQVUsQ0FBQyxNQUFELENBQVYsR0FBb0JGLFdBQVcsQ0FBQ2pCLENBQUQsQ0FBL0I7QUFDQWtCLFFBQUFBLE1BQU0sQ0FBQ2IsSUFBUCxDQUFZYyxVQUFaO0FBQ0E7O0FBQ0RILE1BQUFBLElBQUksQ0FBQyxVQUFELENBQUosR0FBbUJFLE1BQW5CO0FBQ0FKLE1BQUFBLFlBQVksQ0FBQ00sUUFBYixDQUFzQmYsSUFBdEIsQ0FBMkJXLElBQTNCO0FBQ0E7QUFDRDs7QUFDRCxNQUFJSyxFQUFFLEdBQUtDLE1BQU0sQ0FBQ0MsSUFBbEI7QUFDQUMsRUFBQUEsYUFBYSxDQUFDVixZQUFELEVBQWVPLEVBQWYsQ0FBYjtBQUNGOztBQUVELFNBQVNHLGFBQVQsQ0FBdUJWLFlBQXZCLEVBQXFDTyxFQUFyQyxFQUF3QztBQUN0QyxNQUFJSSxNQUFNLEdBQUcsR0FBYjtBQUNBLE1BQUlDLGtCQUFrQixHQUFHLG9CQUF6QjtBQUNBLE1BQUlDLG1CQUFtQixHQUFHLG9CQUExQjtBQUVBLE1BQUlDLFlBQVksR0FBRyxDQUFuQjtBQUNBLE1BQUlDLGdCQUFnQixHQUFHLENBQXZCO0FBQ0EsTUFBSUMsZ0JBQWdCLEdBQUcsQ0FBdkI7QUFDQSxNQUFJQyxrQkFBa0IsR0FBRyxDQUF6QjtBQUdBLE1BQUkvQixDQUFDLEdBQUcsQ0FBUjtBQUNBLE1BQUlnQyxRQUFRLEdBQUcsR0FBZixDQVpzQyxDQVlsQjs7QUFFcEIsTUFBSUMsWUFBSjtBQUVBLE1BQUlDLE9BQU8sR0FBR2IsRUFBRSxDQUFDYyxNQUFILENBQVVELE9BQVYsR0FDVEUsSUFEUyxDQUNKLENBQUMsR0FBRCxFQUFLWCxNQUFNLEdBQUcsR0FBZCxDQURJLEVBRVRZLFVBRlMsQ0FFRSxVQUFTQyxDQUFULEVBQVlDLENBQVosRUFBZTtBQUN6QixXQUFPLENBQUNELENBQUMsQ0FBQ0UsTUFBRixJQUFZRCxDQUFDLENBQUNDLE1BQWQsR0FBdUIsQ0FBdkIsR0FBMkIsQ0FBNUIsSUFBaUNGLENBQUMsQ0FBQ0csS0FBMUM7QUFDRCxHQUpTLENBQWQ7QUFNQSxNQUFJQyxRQUFRLEdBQUdyQixFQUFFLENBQUNzQixHQUFILENBQU9ELFFBQVAsQ0FBZ0JFLE1BQWhCLEdBQ1ZDLFVBRFUsQ0FDQyxVQUFTQyxDQUFULEVBQVk7QUFBRSxXQUFPLENBQUNBLENBQUMsQ0FBQ0MsQ0FBSCxFQUFNRCxDQUFDLENBQUNFLENBQUYsR0FBTSxHQUFOLEdBQVlDLElBQUksQ0FBQ0MsRUFBdkIsQ0FBUDtBQUFvQyxHQURuRCxDQUFmO0FBR0EsTUFBSUMsWUFBWSxHQUFHOUIsRUFBRSxDQUFDK0IsTUFBSCxDQUFVQyxRQUFRLENBQUNDLGNBQVQsQ0FBd0I1QixrQkFBeEIsQ0FBVixDQUFuQjtBQUVBeUIsRUFBQUEsWUFBWSxDQUFDSSxNQUFiLENBQW9CLFFBQXBCLEVBQ0tDLElBREwsQ0FDVSxJQURWLEVBQ2UsaUJBRGYsRUFFS0MsSUFGTCxDQUVVLFdBRlYsRUFHS0MsRUFITCxDQUdRLE9BSFIsRUFHZ0JDLGNBSGhCO0FBS0EsTUFBSUMsT0FBTyxHQUFHVCxZQUFZLENBQUNJLE1BQWIsQ0FBb0IsU0FBcEIsRUFDVEMsSUFEUyxDQUNKLE9BREksRUFDSyxNQURMLEVBRVRBLElBRlMsQ0FFSixRQUZJLEVBRU0sTUFGTixFQUdUQSxJQUhTLENBR0osU0FISSxFQUdPLE1BQU8vQixNQUFQLEdBQWlCLElBQWpCLElBQXlCQSxNQUFNLEdBQUcsRUFBbEMsSUFBdUMsR0FBdkMsR0FBNENBLE1BQU0sR0FBQyxDQUFuRCxHQUFzRCxHQUF0RCxHQUEyREEsTUFBTSxHQUFDLENBSHpFLEVBSVRvQyxJQUpTLENBSUp4QyxFQUFFLENBQUN5QyxRQUFILENBQVlDLElBQVosR0FBbUJDLEtBQW5CLENBQXlCLEdBQXpCLEVBQThCQyxXQUE5QixDQUEwQyxDQUFDLEdBQUQsRUFBTSxDQUFOLENBQTFDLEVBQW9EUCxFQUFwRCxDQUF1RCxNQUF2RCxFQUErREssSUFBL0QsQ0FKSSxFQUlrRUwsRUFKbEUsQ0FJcUUsZUFKckUsRUFJc0YsSUFKdEYsRUFLVEgsTUFMUyxDQUtGLE9BTEUsQ0FBZCxDQWhDc0MsQ0F1Q3RDOztBQUNBSyxFQUFBQSxPQUFPLENBQUNMLE1BQVIsQ0FBZSxjQUFmLEVBQStCQyxJQUEvQixDQUFvQyxJQUFwQyxFQUEwQyxjQUExQyxFQUNLRCxNQURMLENBQ1ksVUFEWixFQUVLQyxJQUZMLENBRVUsSUFGVixFQUVnQixnQkFGaEI7QUFJQSxNQUFJVSxTQUFTLEdBQUdOLE9BQU8sQ0FBQ0wsTUFBUixDQUFlLE9BQWYsRUFDWEMsSUFEVyxDQUNOLFdBRE0sRUFDTyxvQkFEUCxDQUFoQjtBQUdDdkIsRUFBQUEsWUFBWSxHQUFHbkIsWUFBZixDQS9DcUMsQ0FpRHBDOztBQUNBbUIsRUFBQUEsWUFBWSxDQUFDYixRQUFiLENBQXNCK0MsT0FBdEIsQ0FBOEJDLFFBQTlCLEVBbERvQyxDQW9EcEM7O0FBQ0RDLEVBQUFBLDJCQUEyQixDQUFDcEMsWUFBRCxDQUEzQjs7QUFLRCxXQUFTb0MsMkJBQVQsQ0FBcUNDLE1BQXJDLEVBQTZDO0FBRTNDO0FBQ0EsUUFBSUMsS0FBSyxHQUFHckMsT0FBTyxDQUFDcUMsS0FBUixDQUFjdEMsWUFBZCxDQUFaO0FBQ0EsUUFBSXVDLFNBQVMsR0FBR3RDLE9BQU8sQ0FBQ3VDLEtBQVIsQ0FBY0YsS0FBZCxDQUFoQixDQUoyQyxDQU0zQzs7QUFDQUEsSUFBQUEsS0FBSyxDQUFDSixPQUFOLENBQWMsVUFBU3JCLENBQVQsRUFBWTtBQUN4QixVQUFHQSxDQUFDLENBQUNMLEtBQUYsSUFBVSxDQUFiLEVBQWU7QUFDYkssUUFBQUEsQ0FBQyxDQUFDQyxDQUFGLEdBQU1ELENBQUMsQ0FBQ0wsS0FBRixHQUFRLEVBQWQ7QUFDRCxPQUZELE1BR0E7QUFDRUssUUFBQUEsQ0FBQyxDQUFDQyxDQUFGLEdBQU1ELENBQUMsQ0FBQ0wsS0FBRixHQUFRLEdBQWQ7QUFDRDtBQUNGLEtBUEQsRUFQMkMsQ0FnQjNDOztBQUNBLFFBQUlpQyxJQUFJLEdBQUdkLE9BQU8sQ0FBQ2UsU0FBUixDQUFrQixRQUFsQixFQUNOcEUsSUFETSxDQUNEZ0UsS0FEQyxFQUNNLFVBQVN6QixDQUFULEVBQVk7QUFBRSxhQUFPQSxDQUFDLENBQUM4QixFQUFGLEtBQVM5QixDQUFDLENBQUM4QixFQUFGLEdBQU8sRUFBRTVFLENBQWxCLENBQVA7QUFBOEIsS0FEbEQsQ0FBWCxDQWpCMkMsQ0FvQjNDOztBQUNBLFFBQUk2RSxTQUFTLEdBQUdILElBQUksQ0FBQ0ksS0FBTCxHQUFhdkIsTUFBYixDQUFvQixHQUFwQixFQUNYQyxJQURXLENBQ04sT0FETSxFQUNHLE1BREgsRUFFWEUsRUFGVyxDQUVSLE9BRlEsRUFFQ3FCLGNBRkQsQ0FBaEI7QUFJQUYsSUFBQUEsU0FBUyxDQUFDdEIsTUFBVixDQUFpQixRQUFqQjtBQUVBc0IsSUFBQUEsU0FBUyxDQUFDdEIsTUFBVixDQUFpQixNQUFqQixFQUNDQyxJQURELENBQ00sR0FETixFQUNXLEVBRFgsRUFFQ0EsSUFGRCxDQUVNLElBRk4sRUFFWSxPQUZaLEVBR0NBLElBSEQsQ0FHTSxhQUhOLEVBR3FCLE9BSHJCLEVBSUNDLElBSkQsQ0FJTSxVQUFTWCxDQUFULEVBQVk7QUFDWixVQUFHQSxDQUFDLENBQUNMLEtBQUYsS0FBWSxDQUFmLEVBQWlCO0FBQ2YsZUFBT0ssQ0FBQyxDQUFDa0MsS0FBVDtBQUNEOztBQUNGLGFBQU9sQyxDQUFDLENBQUNtQyxJQUFUO0FBQ0osS0FURCxFQTNCMkMsQ0F1QzNDOztBQUNBLFFBQUlDLFVBQVUsR0FBR1IsSUFBSSxDQUFDUyxVQUFMLEdBQ1puRCxRQURZLENBQ0hBLFFBREcsRUFFWndCLElBRlksQ0FFUCxXQUZPLEVBRU0sVUFBU1YsQ0FBVCxFQUFZO0FBQUUsYUFBTyxhQUFhQSxDQUFDLENBQUNFLENBQUYsR0FBTSxFQUFuQixJQUF5QixhQUF6QixHQUF5Q0YsQ0FBQyxDQUFDQyxDQUEzQyxHQUErQyxHQUF0RDtBQUE0RCxLQUZoRixDQUFqQjtBQUlBbUMsSUFBQUEsVUFBVSxDQUFDOUIsTUFBWCxDQUFrQixRQUFsQixFQUNLSSxJQURMLENBQ1UsR0FEVixFQUNlLFVBQVNWLENBQVQsRUFBVztBQUNsQixVQUFJQSxDQUFDLENBQUNMLEtBQUYsSUFBVyxDQUFmLEVBQWtCO0FBQ2QsZUFBT2IsWUFBUDtBQUNELE9BRkgsTUFHTyxJQUFJa0IsQ0FBQyxDQUFDTCxLQUFGLEtBQVksQ0FBaEIsRUFBbUI7QUFDcEIsZUFBT1osZ0JBQVA7QUFDSCxPQUZJLE1BR0EsSUFBSWlCLENBQUMsQ0FBQ0wsS0FBRixLQUFZLENBQWhCLEVBQW1CO0FBQ3BCLGVBQU9YLGdCQUFQO0FBQ0g7O0FBQ0csYUFBT0Msa0JBQVA7QUFFVCxLQWJMLEVBY0txRCxLQWRMLENBY1csTUFkWCxFQWNtQixVQUFTdEMsQ0FBVCxFQUFZO0FBQ3BCLFVBQUdBLENBQUMsQ0FBQ0wsS0FBRixLQUFXLENBQWQsRUFBZ0I7QUFDZixlQUFPLFNBQVA7QUFDQSxPQUZELE1BRU0sSUFBR0ssQ0FBQyxDQUFDTCxLQUFGLEtBQVksQ0FBZixFQUFpQjtBQUN0QixZQUFHSyxDQUFDLENBQUNtQyxJQUFGLElBQVEsV0FBWCxFQUF3QixPQUFPLFNBQVA7QUFDeEIsZUFBTyxTQUFQO0FBQ0EsT0FISyxNQUdEO0FBQ0osZUFBT25DLENBQUMsQ0FBQ3VDLEtBQVQ7QUFDQTtBQUNQLEtBdkJMLEVBd0JLRCxLQXhCTCxDQXdCVyxRQXhCWCxFQXdCb0IsVUFBU3RDLENBQVQsRUFBVztBQUNyQixVQUFHQSxDQUFDLENBQUNMLEtBQUYsR0FBUSxDQUFYLEVBQWE7QUFDVCxlQUFPLE9BQVA7QUFDSCxPQUZELE1BR0k7QUFDQSxlQUFPLFdBQVA7QUFDSDtBQUNOLEtBL0JMO0FBaUNBeUMsSUFBQUEsVUFBVSxDQUFDOUIsTUFBWCxDQUFrQixNQUFsQixFQUVLSSxJQUZMLENBRVUsSUFGVixFQUVnQixVQUFTVixDQUFULEVBQVc7QUFDckIsVUFBSXdDLEtBQUssR0FBRyxDQUFaO0FBQ0EsVUFBR3hDLENBQUMsQ0FBQ3dDLEtBQUwsRUFBV0EsS0FBSyxHQUFHeEMsQ0FBQyxDQUFDd0MsS0FBVjtBQUNYLGFBQU8sT0FBT3hDLENBQUMsQ0FBQ0wsS0FBVCxHQUFpQixHQUFqQixHQUF1QjZDLEtBQTlCO0FBQ0QsS0FOTCxFQU9LOUIsSUFQTCxDQU9VLGFBUFYsRUFPeUIsVUFBVVYsQ0FBVixFQUFhO0FBQzlCLFVBQUlBLENBQUMsQ0FBQ0wsS0FBRixLQUFZLENBQWhCLEVBQW1CO0FBQ2YsZUFBT0ssQ0FBQyxDQUFDRSxDQUFGLEdBQU0sR0FBTixHQUFZLEtBQVosR0FBb0IsT0FBM0I7QUFDSDs7QUFDRCxhQUFPRixDQUFDLENBQUNFLENBQUYsR0FBTSxHQUFOLEdBQVksT0FBWixHQUFzQixLQUE3QjtBQUNILEtBWkwsRUFhS1EsSUFiTCxDQWFVLElBYlYsRUFhZ0IsVUFBU1YsQ0FBVCxFQUFXO0FBQ25CLFVBQUlBLENBQUMsQ0FBQ0wsS0FBRixLQUFZLENBQWhCLEVBQW1CO0FBQ2YsZUFBT0ssQ0FBQyxDQUFDRSxDQUFGLEdBQU0sR0FBTixHQUFZLE9BQVosR0FBc0IsUUFBN0I7QUFDSDs7QUFDRCxhQUFPLE9BQVA7QUFDSCxLQWxCTCxFQW1CS1EsSUFuQkwsQ0FtQlUsSUFuQlYsRUFtQmdCLFVBQVVWLENBQVYsRUFBYTtBQUNyQixVQUFJQSxDQUFDLENBQUNMLEtBQUYsS0FBWSxDQUFoQixFQUFtQjtBQUNmLGVBQU8sQ0FBUCxDQURlLENBQ0w7QUFDYjs7QUFDRCxhQUFPSyxDQUFDLENBQUNFLENBQUYsR0FBTSxHQUFOLEdBQVksQ0FBWixHQUFnQixDQUFDLEVBQXhCO0FBQ0gsS0F4QkwsRUF5QktRLElBekJMLENBeUJVLFdBekJWLEVBeUJ1QixVQUFVVixDQUFWLEVBQWE7QUFDNUIsVUFBSUEsQ0FBQyxDQUFDTCxLQUFGLEdBQVUsQ0FBZCxFQUFpQjtBQUNiLGVBQU8sYUFBYSxLQUFLSyxDQUFDLENBQUNFLENBQXBCLElBQXlCLEdBQWhDO0FBQ0gsT0FGRCxNQUVNO0FBQ0YsZUFBT0YsQ0FBQyxDQUFDRSxDQUFGLEdBQU0sR0FBTixHQUFZLElBQVosR0FBbUIsYUFBMUI7QUFDSDtBQUNKLEtBL0JMLEVBN0UyQyxDQThHM0M7O0FBQ0EsUUFBSXVDLFFBQVEsR0FBR2IsSUFBSSxDQUFDYyxJQUFMLEdBQVlMLFVBQVosR0FDVm5ELFFBRFUsQ0FDREEsUUFEQyxFQUVWeUQsTUFGVSxFQUFmLENBL0cyQyxDQW1IM0M7O0FBQ0EsUUFBSUMsSUFBSSxHQUFHOUIsT0FBTyxDQUFDZSxTQUFSLENBQWtCLFdBQWxCLEVBQ05wRSxJQURNLENBQ0RpRSxTQURDLEVBQ1UsVUFBUzFCLENBQVQsRUFBWTtBQUFFLGFBQU9BLENBQUMsQ0FBQzZDLE1BQUYsQ0FBU2YsRUFBaEI7QUFBcUIsS0FEN0MsQ0FBWCxDQXBIMkMsQ0F1SDNDOztBQUNBYyxJQUFBQSxJQUFJLENBQUNaLEtBQUwsR0FBYWMsTUFBYixDQUFvQixNQUFwQixFQUE0QixHQUE1QixFQUNLcEMsSUFETCxDQUNVLE9BRFYsRUFDbUIsTUFEbkIsRUFFS0EsSUFGTCxDQUVVLEdBRlYsRUFFZSxVQUFTVixDQUFULEVBQVk7QUFDckIsVUFBSStDLENBQUMsR0FBRztBQUFDN0MsUUFBQUEsQ0FBQyxFQUFFc0IsTUFBTSxDQUFDd0IsRUFBWDtBQUFlL0MsUUFBQUEsQ0FBQyxFQUFFdUIsTUFBTSxDQUFDeUI7QUFBekIsT0FBUjtBQUNBLGFBQU9yRCxRQUFRLENBQUM7QUFBQzRCLFFBQUFBLE1BQU0sRUFBRXVCLENBQVQ7QUFBWUYsUUFBQUEsTUFBTSxFQUFFRTtBQUFwQixPQUFELENBQWY7QUFDRCxLQUxMLEVBTUtULEtBTkwsQ0FNVyxNQU5YLEVBTWtCLFVBQVN0QyxDQUFULEVBQVc7QUFDdkIsYUFBT0EsQ0FBQyxDQUFDdUMsS0FBVDtBQUNELEtBUkwsRUF4SDJDLENBa0kzQzs7QUFDQUssSUFBQUEsSUFBSSxDQUFDUCxVQUFMLEdBQ0tuRCxRQURMLENBQ2NBLFFBRGQsRUFFS3dCLElBRkwsQ0FFVSxHQUZWLEVBRWVkLFFBRmYsRUFuSTJDLENBdUkzQzs7QUFDQWdELElBQUFBLElBQUksQ0FBQ0YsSUFBTCxHQUFZTCxVQUFaLEdBQ0tuRCxRQURMLENBQ2NBLFFBRGQsRUFFS3dCLElBRkwsQ0FFVSxHQUZWLEVBRWUsVUFBU1YsQ0FBVCxFQUFZO0FBQ3JCLFVBQUkrQyxDQUFDLEdBQUc7QUFBQzdDLFFBQUFBLENBQUMsRUFBRXNCLE1BQU0sQ0FBQ3RCLENBQVg7QUFBY0QsUUFBQUEsQ0FBQyxFQUFFdUIsTUFBTSxDQUFDdkI7QUFBeEIsT0FBUjtBQUNBLGFBQU9MLFFBQVEsQ0FBQztBQUFDNEIsUUFBQUEsTUFBTSxFQUFFdUIsQ0FBVDtBQUFZRixRQUFBQSxNQUFNLEVBQUVFO0FBQXBCLE9BQUQsQ0FBZjtBQUNELEtBTEwsRUFNS0osTUFOTDtBQU9ELEdBek1xQyxDQTJNdEM7OztBQUNBLFdBQVNWLGNBQVQsQ0FBd0JqQyxDQUF4QixFQUEwQmtELFNBQTFCLEVBQXFDO0FBQ25DLFFBQUlsRCxDQUFDLENBQUMxQixRQUFOLEVBQWdCO0FBQ2QwQixNQUFBQSxDQUFDLENBQUNtRCxTQUFGLEdBQWNuRCxDQUFDLENBQUMxQixRQUFoQjtBQUNBMEIsTUFBQUEsQ0FBQyxDQUFDMUIsUUFBRixHQUFhLElBQWI7QUFDRCxLQUhELE1BR087QUFDTDBCLE1BQUFBLENBQUMsQ0FBQzFCLFFBQUYsR0FBYTBCLENBQUMsQ0FBQ21ELFNBQWY7QUFDQW5ELE1BQUFBLENBQUMsQ0FBQ21ELFNBQUYsR0FBYyxJQUFkO0FBQ0Q7O0FBRUQsUUFBSUMsSUFBSSxHQUFHLFFBQU9GLFNBQVAsS0FBb0JHLFNBQXBCLEdBQWdDLE1BQWhDLEdBQXlDSCxTQUFwRCxDQVRtQyxDQVduQzs7QUFDQTNCLElBQUFBLDJCQUEyQixDQUFDdkIsQ0FBRCxDQUEzQjtBQUNBc0QsSUFBQUEsdUJBQXVCLENBQUN0RCxDQUFELENBQXZCO0FBRUF1RCxJQUFBQSx1QkFBdUIsQ0FBQ3ZELENBQUQsRUFBR29ELElBQUgsQ0FBdkI7QUFFRCxHQTdOcUMsQ0ErTnRDOzs7QUFDQSxXQUFTOUIsUUFBVCxDQUFrQnRCLENBQWxCLEVBQXFCO0FBQ25CLFFBQUlBLENBQUMsQ0FBQzFCLFFBQU4sRUFBZ0I7QUFDWjBCLE1BQUFBLENBQUMsQ0FBQ21ELFNBQUYsR0FBY25ELENBQUMsQ0FBQzFCLFFBQWhCOztBQUNBMEIsTUFBQUEsQ0FBQyxDQUFDbUQsU0FBRixDQUFZOUIsT0FBWixDQUFvQkMsUUFBcEI7O0FBQ0F0QixNQUFBQSxDQUFDLENBQUMxQixRQUFGLEdBQWEsSUFBYjtBQUNEO0FBQ0osR0F0T3FDLENBeU90Qzs7O0FBQ0EsV0FBU2dGLHVCQUFULENBQWlDdEQsQ0FBakMsRUFBb0M7QUFDaEMsUUFBSXdELGtCQUFrQixHQUFHLGVBQXpCLENBRGdDLENBQ1M7O0FBQ3pDLFFBQUlDLGdCQUFnQixHQUFHLFdBQXZCO0FBRUEsUUFBSTlELEtBQUssR0FBSUssQ0FBQyxDQUFDTCxLQUFmO0FBQ0EsUUFBSStELFNBQVMsR0FBRzFELENBQUMsQ0FBQ3VDLEtBQWxCOztBQUNBLFFBQUk1QyxLQUFLLEtBQUssQ0FBZCxFQUFpQjtBQUNiK0QsTUFBQUEsU0FBUyxHQUFHRixrQkFBWjtBQUNIOztBQUVELFFBQUlHLFNBQVMsR0FBRzdDLE9BQU8sQ0FBQ2UsU0FBUixDQUFrQixXQUFsQixDQUFoQjtBQUVBOEIsSUFBQUEsU0FBUyxDQUFDckIsS0FBVixDQUFnQixRQUFoQixFQUF5QixVQUFTc0IsRUFBVCxFQUFhO0FBQ2xDLFVBQUlBLEVBQUUsQ0FBQ3BDLE1BQUgsQ0FBVTdCLEtBQVYsS0FBb0IsQ0FBeEIsRUFBMkI7QUFDdkIsWUFBSUssQ0FBQyxDQUFDbUMsSUFBRixLQUFXLEVBQWYsRUFBbUI7QUFDZixpQkFBT3FCLGtCQUFQO0FBQ0g7O0FBQ0QsZUFBT0MsZ0JBQVA7QUFDSDs7QUFFRCxVQUFJRyxFQUFFLENBQUNwQyxNQUFILENBQVVXLElBQVYsS0FBbUJuQyxDQUFDLENBQUNtQyxJQUF6QixFQUErQjtBQUMzQixlQUFPdUIsU0FBUDtBQUNILE9BRkQsTUFFTTtBQUNGLGVBQU9ELGdCQUFQO0FBQ0g7QUFDSixLQWJEO0FBY0gsR0FwUXFDLENBc1F0Qzs7O0FBQ0EsV0FBU0YsdUJBQVQsQ0FBaUN2RCxDQUFqQyxFQUFtQ2tELFNBQW5DLEVBQTZDO0FBQzNDLFFBQUlXLFNBQVMsR0FBRyxFQUFoQjtBQUNBLFFBQUluRSxNQUFNLEdBQUdNLENBQWI7O0FBQ0EsV0FBTyxDQUFDOEQsQ0FBQyxDQUFDQyxXQUFGLENBQWNyRSxNQUFkLENBQVIsRUFBK0I7QUFDM0JtRSxNQUFBQSxTQUFTLENBQUN0RyxJQUFWLENBQWVtQyxNQUFmO0FBQ0FBLE1BQUFBLE1BQU0sR0FBR0EsTUFBTSxDQUFDQSxNQUFoQjtBQUNILEtBTjBDLENBUTNDOzs7QUFDQSxRQUFJc0UsWUFBWSxHQUFHLEVBQW5CO0FBRUFsRCxJQUFBQSxPQUFPLENBQUNlLFNBQVIsQ0FBa0IsV0FBbEIsRUFDS29DLE1BREwsQ0FDWSxVQUFTakUsQ0FBVCxFQUFZOUMsQ0FBWixFQUNSO0FBQ0ksYUFBTzRHLENBQUMsQ0FBQ0ksR0FBRixDQUFNTCxTQUFOLEVBQWlCLFVBQVNNLENBQVQsRUFDeEI7QUFDSSxlQUFPQSxDQUFDLEtBQUtuRSxDQUFDLENBQUM2QyxNQUFmO0FBQ0gsT0FITSxDQUFQO0FBS0gsS0FSTCxFQVNLdUIsSUFUTCxDQVNVLFVBQVNwRSxDQUFULEVBQ047QUFDSWdFLE1BQUFBLFlBQVksQ0FBQ3pHLElBQWIsQ0FBa0J5QyxDQUFsQjtBQUNILEtBWkw7QUFjQXFFLElBQUFBLGFBQWEsQ0FBQ0wsWUFBRCxFQUFjZCxTQUFkLENBQWI7O0FBRUEsYUFBU21CLGFBQVQsQ0FBdUIxQyxLQUF2QixFQUE2QnVCLFNBQTdCLEVBQXVDO0FBQ3JDOUIsTUFBQUEsU0FBUyxDQUFDUyxTQUFWLENBQW9CLGVBQXBCLEVBQ0twRSxJQURMLENBQ1UsRUFEVixFQUVLaUYsSUFGTCxHQUVZQyxNQUZaO0FBSUF2QixNQUFBQSxTQUFTLENBQUNTLFNBQVYsQ0FBb0IsZUFBcEIsRUFDS3BFLElBREwsQ0FDVWtFLEtBRFYsRUFFS0ssS0FGTCxHQUVhdkIsTUFGYixDQUVvQixVQUZwQixFQUdLQyxJQUhMLENBR1UsT0FIVixFQUdtQixVQUhuQixFQUlLQSxJQUpMLENBSVUsR0FKVixFQUllZCxRQUpmLEVBTHFDLENBWXJDOztBQUNBLFVBQUdzRCxTQUFTLElBQUksUUFBaEIsRUFBeUI7QUFDdkI5QixRQUFBQSxTQUFTLENBQUNTLFNBQVYsQ0FBb0IsZUFBcEIsRUFBcUN5QyxPQUFyQyxDQUE2QyxnQkFBN0MsRUFBOEQsSUFBOUQ7QUFDRDs7QUFFRCxVQUFJQyxVQUFVLEdBQUd6RCxPQUFPLENBQUNjLElBQVIsR0FBZTRDLE9BQWYsRUFBakI7QUFFQTFELE1BQUFBLE9BQU8sQ0FBQ1IsTUFBUixDQUFlLGlCQUFmLEVBQ0tJLElBREwsQ0FDVSxHQURWLEVBQ2UsQ0FBQy9CLE1BRGhCLEVBRUsrQixJQUZMLENBRVUsR0FGVixFQUVlLENBQUMvQixNQUZoQixFQUdLK0IsSUFITCxDQUdVLE9BSFYsRUFHa0IsQ0FIbEIsRUFJS0EsSUFKTCxDQUlVLFFBSlYsRUFJbUIvQixNQUFNLEdBQUMsQ0FKMUIsRUFLSzBELFVBTEwsR0FLa0JuRCxRQUxsQixDQUsyQkEsUUFMM0IsRUFNS3dCLElBTkwsQ0FNVSxPQU5WLEVBTW1CL0IsTUFBTSxHQUFDLENBTjFCO0FBT0Q7QUFFRjs7QUFFRCxXQUFTc0MsSUFBVCxHQUFnQjtBQUNiSCxJQUFBQSxPQUFPLENBQUNKLElBQVIsQ0FBYSxXQUFiLEVBQTBCLGVBQWVuQyxFQUFFLENBQUNrRyxLQUFILENBQVNDLFNBQXhCLEdBQW9DLFNBQXBDLEdBQWdEbkcsRUFBRSxDQUFDa0csS0FBSCxDQUFTdkQsS0FBekQsR0FBaUUsR0FBM0Y7QUFDRjs7QUFFRCxXQUFTTCxjQUFULEdBQXlCO0FBRXZCLFFBQUc4RCw4QkFBOEIsRUFBakMsRUFBb0M7QUFDbENDLE1BQUFBLDRCQUE0QjtBQUM3QixLQUZELE1BRUs7QUFDSkMsTUFBQUEseUJBQXlCO0FBQ3pCLEtBTnNCLENBUXZCOzs7QUFDQSxhQUFTQSx5QkFBVCxHQUFvQztBQUNsQyxXQUFJLElBQUlDLFNBQVMsR0FBRyxDQUFoQixFQUFtQkMsVUFBVSxHQUFHNUYsWUFBWSxDQUFDYixRQUFiLENBQXNCbkIsTUFBMUQsRUFBa0UySCxTQUFTLEdBQUNDLFVBQTVFLEVBQXdGRCxTQUFTLEVBQWpHLEVBQW9HO0FBQ2hHLFlBQUdFLFVBQVUsQ0FBQzdGLFlBQVksQ0FBQ2IsUUFBYixDQUFzQndHLFNBQXRCLENBQUQsQ0FBYixFQUFnRDtBQUMzQzdDLFVBQUFBLGNBQWMsQ0FBQzlDLFlBQVksQ0FBQ2IsUUFBYixDQUFzQndHLFNBQXRCLENBQUQsRUFBa0MsUUFBbEMsQ0FBZDtBQUNKO0FBQ0o7QUFDRixLQWZzQixDQWlCdkI7OztBQUNBLGFBQVNGLDRCQUFULEdBQXVDO0FBQ3JDLFdBQUksSUFBSUUsU0FBUyxHQUFHLENBQWhCLEVBQW1CQyxVQUFVLEdBQUc1RixZQUFZLENBQUNiLFFBQWIsQ0FBc0JuQixNQUExRCxFQUFrRTJILFNBQVMsR0FBQ0MsVUFBNUUsRUFBd0ZELFNBQVMsRUFBakcsRUFBb0c7QUFDbEcsWUFBR0UsVUFBVSxDQUFDN0YsWUFBWSxDQUFDYixRQUFiLENBQXNCd0csU0FBdEIsQ0FBRCxDQUFiLEVBQWdEO0FBRTlDLGVBQUksSUFBSUcsVUFBVSxHQUFHLENBQWpCLEVBQW9CQyxXQUFXLEdBQUcvRixZQUFZLENBQUNiLFFBQWIsQ0FBc0J3RyxTQUF0QixFQUFpQ3hHLFFBQWpDLENBQTBDbkIsTUFBaEYsRUFBd0Y4SCxVQUFVLEdBQUNDLFdBQW5HLEVBQWdIRCxVQUFVLEVBQTFILEVBQTZIO0FBQzNILGdCQUFJRSxnQkFBZ0IsR0FBR2hHLFlBQVksQ0FBQ2IsUUFBYixDQUFzQndHLFNBQXRCLEVBQWlDeEcsUUFBakMsQ0FBMEMyRyxVQUExQyxDQUF2Qjs7QUFDQSxnQkFBR0QsVUFBVSxDQUFDRyxnQkFBRCxDQUFiLEVBQWdDO0FBQzlCbEQsY0FBQUEsY0FBYyxDQUFDOUMsWUFBWSxDQUFDYixRQUFiLENBQXNCd0csU0FBdEIsRUFBaUN4RyxRQUFqQyxDQUEwQzJHLFVBQTFDLENBQUQsRUFBdUQsUUFBdkQsQ0FBZDtBQUNEO0FBQ0Y7QUFFRjtBQUVGO0FBQ0YsS0FoQ3NCLENBa0N2Qjs7O0FBQ0EsYUFBU04sOEJBQVQsR0FBeUM7QUFDdkMsV0FBSSxJQUFJRyxTQUFTLEdBQUcsQ0FBaEIsRUFBbUJDLFVBQVUsR0FBRzVGLFlBQVksQ0FBQ2IsUUFBYixDQUFzQm5CLE1BQTFELEVBQWtFMkgsU0FBUyxHQUFDQyxVQUE1RSxFQUF3RkQsU0FBUyxFQUFqRyxFQUFvRztBQUNsRyxZQUFHRSxVQUFVLENBQUM3RixZQUFZLENBQUNiLFFBQWIsQ0FBc0J3RyxTQUF0QixDQUFELENBQWIsRUFBZ0Q7QUFFOUMsZUFBSSxJQUFJRyxVQUFVLEdBQUcsQ0FBakIsRUFBb0JDLFdBQVcsR0FBRy9GLFlBQVksQ0FBQ2IsUUFBYixDQUFzQndHLFNBQXRCLEVBQWlDeEcsUUFBakMsQ0FBMENuQixNQUFoRixFQUF3RjhILFVBQVUsR0FBQ0MsV0FBbkcsRUFBZ0hELFVBQVUsRUFBMUgsRUFBNkg7QUFFM0gsZ0JBQUlFLGdCQUFnQixHQUFHaEcsWUFBWSxDQUFDYixRQUFiLENBQXNCd0csU0FBdEIsRUFBaUN4RyxRQUFqQyxDQUEwQzJHLFVBQTFDLENBQXZCOztBQUNBLGdCQUFHRCxVQUFVLENBQUNHLGdCQUFELENBQWIsRUFBZ0M7QUFDOUIscUJBQU8sSUFBUDtBQUNEO0FBQ0Y7QUFDRjtBQUNGO0FBQ0Y7O0FBRUQsYUFBU0gsVUFBVCxDQUFvQmhGLENBQXBCLEVBQXNCO0FBQ3BCLFVBQUdBLENBQUMsQ0FBQzFCLFFBQUwsRUFBYztBQUFDLGVBQU8sSUFBUDtBQUFhOztBQUM1QixhQUFPLEtBQVA7QUFDRDtBQUNGO0FBS0Y7OztBQ3ZjRCxTQUFTOEcsVUFBVCxHQUFxQjtBQUNqQkMsRUFBQUEsQ0FBQyxDQUFDOUUsUUFBRCxDQUFELENBQVkrRSxLQUFaLENBQWtCLFlBQVU7QUFDeEJELElBQUFBLENBQUMsQ0FBQyxpQkFBRCxDQUFELENBQXFCRSxLQUFyQixDQUEyQixZQUFVO0FBQ2pDRixNQUFBQSxDQUFDLENBQUMsYUFBRCxDQUFELENBQ0tHLE9BREwsQ0FDYSxRQURiO0FBR0gsS0FKRDtBQU1ILEdBUEQ7QUFRSDs7O0FDVERDLE9BQU8sQ0FBQ0MsTUFBUixDQUFlO0FBQ1hDLEVBQUFBLEtBQUssRUFBRTtBQUNILFVBQU07QUFESDtBQURJLENBQWY7O0FBTUEsU0FBU0MsTUFBVCxHQUFpQjtBQUVicEgsRUFBQUEsTUFBTSxDQUFDcUgsS0FBUCxHQUFldEgsRUFBZjs7QUFDQWtILEVBQUFBLE9BQU8sQ0FBQyxDQUFDLElBQUQsQ0FBRCxFQUFTLFVBQVNoSCxJQUFULEVBQWU7QUFDM0JELElBQUFBLE1BQU0sQ0FBQ0MsSUFBUCxHQUFjQSxJQUFkO0FBQ0FELElBQUFBLE1BQU0sQ0FBQ0QsRUFBUCxHQUFZc0gsS0FBWixDQUYyQixDQUczQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBQ0FySCxJQUFBQSxNQUFNLENBQUNzSCxTQUFQLEdBQW1CLENBQ2YsQ0FBQyxTQUFELEVBQ1UsTUFEVixFQUVVLFNBRlYsRUFHVSxPQUhWLEVBSVUsUUFKVixFQUtVLFlBTFYsRUFNVSxNQU5WLEVBT1UsU0FQVixFQVFVLFNBUlYsQ0FEZSxFQVVmLENBQUMsS0FBRCxFQUFRLE1BQVIsRUFBZ0IsT0FBaEIsRUFBeUIsU0FBekIsRUFBb0MsUUFBcEMsRUFBOEMsWUFBOUMsQ0FWZSxFQVdOLENBQUMsV0FBRCxFQUNDLEdBREQsRUFFQyxPQUZELEVBR0MsS0FIRCxFQUlDLFNBSkQsRUFLQyxPQUxELEVBTUMsT0FORCxFQU9DLE1BUEQsRUFRQyxRQVJELENBWE0sRUFxQmYsQ0FBQyxLQUFELEVBQVEsV0FBUixFQUFxQixNQUFyQixFQUE2QixNQUE3QixFQUNJLGFBREosQ0FyQmUsQ0FBbkI7QUF5QlFDLElBQUFBLFdBQVcsQ0FBQyxLQUFELENBQVg7QUFDUCxHQW5DRSxDQUFQO0FBb0NIOztBQUVELFNBQVNDLE9BQVQsQ0FBaUJDLEtBQWpCLEVBQXdCO0FBQ3RCLFNBQU96SCxNQUFNLENBQUNzSCxTQUFQLEdBQW1CRyxLQUFLLENBQUNDLEdBQU4sQ0FBVSxVQUFBaEcsQ0FBQztBQUFBLFdBQUlBLENBQUMsQ0FBQ2lHLEtBQUYsRUFBSjtBQUFBLEdBQVgsQ0FBMUI7QUFDRDs7QUFFRCxTQUFTSixXQUFULENBQXFCSyxNQUFyQixFQUE2QkMsT0FBN0IsRUFBc0NDLElBQXRDLEVBQTRDO0FBQzFDLE1BQUlDLElBQUksR0FBRy9ILE1BQU0sQ0FBQ3NILFNBQWxCOztBQUNBLE1BQUlVLEdBQUcsR0FBRyxhQUFBdEcsQ0FBQztBQUFBLFdBQUlBLENBQUo7QUFBQSxHQUFYOztBQUNBLE1BQUlrRyxNQUFNLEtBQUssS0FBZixFQUFzQjtBQUNwQkksSUFBQUEsR0FBRyxHQUFHQyxjQUFOO0FBQ0QsR0FGRCxNQUVPO0FBQ0xELElBQUFBLEdBQUcsR0FBR0UsbUJBQU47QUFDRDs7QUFDRGxJLEVBQUFBLE1BQU0sQ0FBQ21JLFNBQVAsR0FBb0JILEdBQXBCO0FBQ0FBLEVBQUFBLEdBQUcsQ0FBQ0QsSUFBRCxFQUFPLFVBQUFLLElBQUksRUFBSTtBQUNkcEksSUFBQUEsTUFBTSxDQUFDcUksV0FBUCxHQUFxQkQsSUFBckI7QUFDRkUsSUFBQUEsU0FBUyxDQUFDRixJQUFELENBQVQ7QUFDQUcsSUFBQUEsU0FBUyxDQUFDSCxJQUFELENBQVQ7QUFDQUksSUFBQUEsU0FBUyxDQUFDSixJQUFELENBQVQ7QUFDQUssSUFBQUEsU0FBUzs7QUFDVCxRQUFHWixPQUFILEVBQVc7QUFDUEEsTUFBQUEsT0FBTyxDQUFDTyxJQUFELENBQVA7QUFDSDtBQUNGLEdBVEUsRUFTQU4sSUFUQSxDQUFIO0FBVUQ7O0FBRUQsU0FBU1ksa0JBQVQsR0FBOEIsQ0FDN0I7O0FBRUQsU0FBU0osU0FBVCxDQUFtQkYsSUFBbkIsRUFBeUI7QUFDdkJPLEVBQUFBLHFCQUFxQixDQUFDUCxJQUFELENBQXJCO0FBQ0Q7O0FBSUQsU0FBU0csU0FBVCxDQUFtQkgsSUFBbkIsRUFBeUI7QUFDdkJwSixFQUFBQSx3QkFBd0IsQ0FBQ29KLElBQUQsQ0FBeEI7QUFFRDs7QUFFRCxTQUFTSSxTQUFULENBQW1CSixJQUFuQixFQUF3QjtBQUNwQnZCLEVBQUFBLENBQUMsQ0FBQywwQkFBRCxDQUFELENBQThCK0IsSUFBOUIsQ0FBbUMsRUFBbkM7QUFDQS9CLEVBQUFBLENBQUMsQ0FBQyxlQUFELENBQUQsQ0FBbUIrQixJQUFuQixDQUF3QixFQUF4QjtBQUNBQyxFQUFBQSxzQkFBc0IsQ0FBQ1QsSUFBRCxDQUF0QjtBQUNBVSxFQUFBQSx5QkFBeUIsQ0FBQ1YsSUFBRCxDQUF6QjtBQUNIOztBQUVELFNBQVNLLFNBQVQsR0FBb0I7QUFDaEI1QixFQUFBQSxDQUFDLENBQUMsYUFBRCxDQUFELENBQWlCK0IsSUFBakI7QUFDQUcsRUFBQUEsYUFBYSxDQUFDL0ksTUFBTSxDQUFDcUksV0FBUixDQUFiO0FBQ0g7OztBQ2hHRDtBQUNBLFNBQVNXLFlBQVQsQ0FBc0JDLE9BQXRCLEVBQStCQyxlQUEvQixFQUErQztBQUMzQyxNQUFJQyxPQUFPLEdBQUd0QyxDQUFDLENBQUN1QyxJQUFGLENBQU87QUFDakJDLElBQUFBLEdBQUcsRUFBRSxlQURZO0FBRWpCekIsSUFBQUEsTUFBTSxFQUFFLE1BRlM7QUFHakIzSSxJQUFBQSxJQUFJLEVBQUVnSztBQUhXLEdBQVAsQ0FBZDtBQU1FRSxFQUFBQSxPQUFPLENBQUNHLElBQVIsQ0FBYSxVQUFVQyxRQUFWLEVBQXFCO0FBQ2hDTCxJQUFBQSxlQUFlLENBQUNLLFFBQUQsQ0FBZjtBQUNELEdBRkQ7QUFJQUosRUFBQUEsT0FBTyxDQUFDckIsSUFBUixDQUFhLFVBQVUwQixLQUFWLEVBQWlCQyxVQUFqQixFQUE4QjtBQUN6Q0MsSUFBQUEsS0FBSyxDQUFFLHFCQUFxQkQsVUFBdkIsQ0FBTDtBQUNELEdBRkQ7QUFHTDs7QUFFRCxTQUFTRSxnQkFBVCxDQUEwQjVCLElBQTFCLEVBQWdDbUIsZUFBaEMsRUFBaURVLGVBQWpELEVBQWlFO0FBQzdELE1BQUlULE9BQU8sR0FBR3RDLENBQUMsQ0FBQ3VDLElBQUYsQ0FBTztBQUNqQkMsSUFBQUEsR0FBRyxFQUFFLG1CQURZO0FBRWpCekIsSUFBQUEsTUFBTSxFQUFFLE1BRlM7QUFHakIzSSxJQUFBQSxJQUFJLEVBQUU0SyxJQUFJLENBQUNDLFNBQUwsQ0FBZTtBQUFDL0IsTUFBQUEsSUFBSSxFQUFFQTtBQUFQLEtBQWYsQ0FIVztBQUlqQmdDLElBQUFBLFdBQVcsRUFBRSxpQ0FKSTtBQUtqQkMsSUFBQUEsUUFBUSxFQUFLO0FBTEksR0FBUCxDQUFkO0FBUUViLEVBQUFBLE9BQU8sQ0FBQ0csSUFBUixDQUFhLFVBQVVDLFFBQVYsRUFBcUI7QUFDaENMLElBQUFBLGVBQWUsQ0FBQ0ssUUFBUSxDQUFDeEIsSUFBVixDQUFmO0FBQ0QsR0FGRDtBQUlBb0IsRUFBQUEsT0FBTyxDQUFDckIsSUFBUixDQUFhLFVBQVUwQixLQUFWLEVBQWlCQyxVQUFqQixFQUE4QjtBQUN6QyxRQUFHRyxlQUFILEVBQ0lBLGVBQWUsQ0FBQ0gsVUFBRCxDQUFmLENBREosS0FFTTtBQUNBQyxNQUFBQSxLQUFLLENBQUUscUJBQXFCRCxVQUF2QixDQUFMO0FBQ0g7QUFDSixHQU5EO0FBT0wsQyxDQUVEOzs7QUFDQSxTQUFTdkIsbUJBQVQsQ0FBNkJILElBQTdCLEVBQW1DbUIsZUFBbkMsRUFBb0RVLGVBQXBELEVBQW9FO0FBQ2hFLE1BQUlULE9BQU8sR0FBR3RDLENBQUMsQ0FBQ3VDLElBQUYsQ0FBTztBQUNqQkMsSUFBQUEsR0FBRyxFQUFFLDBCQURZO0FBRWpCekIsSUFBQUEsTUFBTSxFQUFFLE1BRlM7QUFHakIzSSxJQUFBQSxJQUFJLEVBQUU0SyxJQUFJLENBQUNDLFNBQUwsQ0FBZTtBQUFDL0IsTUFBQUEsSUFBSSxFQUFFQSxJQUFQO0FBQWFrQyxNQUFBQSxLQUFLLEVBQUVqSyxNQUFNLENBQUNrSyxNQUFQLENBQWNDLFFBQWQsQ0FBdUJDLE1BQTNDO0FBQW1EQyxNQUFBQSxHQUFHLEVBQUVySyxNQUFNLENBQUNrSyxNQUFQLENBQWNDLFFBQWQsQ0FBdUJHLElBQS9FO0FBQXFGQyxNQUFBQSxRQUFRLEVBQUV2SyxNQUFNLENBQUNrSyxNQUFQLENBQWNDLFFBQWQsQ0FBdUJLO0FBQXRILEtBQWYsQ0FIVztBQUlqQlQsSUFBQUEsV0FBVyxFQUFFLGlDQUpJO0FBS2pCQyxJQUFBQSxRQUFRLEVBQUs7QUFMSSxHQUFQLENBQWQ7QUFRRWIsRUFBQUEsT0FBTyxDQUFDRyxJQUFSLENBQWEsVUFBVUMsUUFBVixFQUFxQjtBQUNoQ0wsSUFBQUEsZUFBZSxDQUFDVyxJQUFJLENBQUNZLEtBQUwsQ0FBV2xCLFFBQVgsQ0FBRCxDQUFmO0FBQ0QsR0FGRDtBQUlBSixFQUFBQSxPQUFPLENBQUNyQixJQUFSLENBQWEsVUFBVTBCLEtBQVYsRUFBaUJDLFVBQWpCLEVBQThCO0FBQ3ZDLFFBQUdHLGVBQUgsRUFDRUEsZUFBZSxDQUFDSCxVQUFELENBQWYsQ0FERixLQUVJO0FBQ0FDLE1BQUFBLEtBQUssQ0FBRSxxQkFBcUJELFVBQXZCLENBQUw7QUFDSDtBQUVKLEdBUEQ7QUFRTDs7QUFFRCxTQUFTeEIsY0FBVCxDQUF3QkYsSUFBeEIsRUFBOEJtQixlQUE5QixFQUErQ1UsZUFBL0MsRUFBK0Q7QUFDM0QsTUFBSVQsT0FBTyxHQUFHdEMsQ0FBQyxDQUFDdUMsSUFBRixDQUFPO0FBQ2pCQyxJQUFBQSxHQUFHLEVBQUUsaUJBRFk7QUFFakJ6QixJQUFBQSxNQUFNLEVBQUUsTUFGUztBQUdqQjNJLElBQUFBLElBQUksRUFBRTRLLElBQUksQ0FBQ0MsU0FBTCxDQUFlO0FBQUMvQixNQUFBQSxJQUFJLEVBQUVBLElBQVA7QUFBYWtDLE1BQUFBLEtBQUssRUFBRWpLLE1BQU0sQ0FBQ2tLLE1BQVAsQ0FBY0MsUUFBZCxDQUF1Qk8sTUFBM0M7QUFBbURMLE1BQUFBLEdBQUcsRUFBRXJLLE1BQU0sQ0FBQ2tLLE1BQVAsQ0FBY0MsUUFBZCxDQUF1QlEsSUFBL0U7QUFBcUZKLE1BQUFBLFFBQVEsRUFBRXZLLE1BQU0sQ0FBQ2tLLE1BQVAsQ0FBY0MsUUFBZCxDQUF1Qks7QUFBdEgsS0FBZixDQUhXO0FBSWpCVCxJQUFBQSxXQUFXLEVBQUUsaUNBSkk7QUFLakJDLElBQUFBLFFBQVEsRUFBSztBQUxJLEdBQVAsQ0FBZDtBQVFFYixFQUFBQSxPQUFPLENBQUNHLElBQVIsQ0FBYSxVQUFVQyxRQUFWLEVBQXFCO0FBQ2hDTCxJQUFBQSxlQUFlLENBQUNLLFFBQUQsQ0FBZjtBQUNELEdBRkQ7QUFJQUosRUFBQUEsT0FBTyxDQUFDckIsSUFBUixDQUFhLFVBQVUwQixLQUFWLEVBQWlCQyxVQUFqQixFQUE4QjtBQUN6QyxRQUFHRyxlQUFILEVBQ0lBLGVBQWUsQ0FBQ0gsVUFBRCxDQUFmLENBREosS0FFTTtBQUNBQyxNQUFBQSxLQUFLLENBQUUscUJBQXFCRCxVQUF2QixDQUFMO0FBQ0g7QUFDSixHQU5EO0FBT0w7OztBQ25GRCxTQUFTWCx5QkFBVCxDQUFtQ1YsSUFBbkMsRUFBd0M7QUFHaEMsTUFBSW5KLElBQUksR0FBRzJMLGdDQUFnQyxDQUFDeEMsSUFBRCxFQUFPLENBQVAsRUFBVSxDQUFWLENBQTNDO0FBQ0F5QyxFQUFBQSxVQUFVLENBQUNDLEtBQVgsQ0FBaUIsY0FBakIsRUFBaUM7QUFDN0JBLElBQUFBLEtBQUssRUFBRTtBQUNIbEcsTUFBQUEsSUFBSSxFQUFFLFFBREg7QUFFSG1HLE1BQUFBLG1CQUFtQixFQUFFLElBRmxCO0FBR0hDLE1BQUFBLFlBQVksRUFBRTtBQUNWQyxRQUFBQSxTQUFTLEVBQUU7QUFERDtBQUhYLEtBRHNCO0FBUTdCQyxJQUFBQSxLQUFLLEVBQUU7QUFDSC9JLE1BQUFBLElBQUksRUFBRTtBQURILEtBUnNCO0FBVzdCZ0osSUFBQUEsV0FBVyxFQUFFO0FBQ1RDLE1BQUFBLE1BQU0sRUFBRTtBQUNKQyxRQUFBQSxTQUFTLEVBQUUsS0FEUDtBQUVKQyxRQUFBQSxNQUFNLEVBQUU7QUFDSkMsVUFBQUEsT0FBTyxFQUFFLEtBREw7QUFFSkMsVUFBQUEsTUFBTSxFQUFFO0FBQ0pDLFlBQUFBLEtBQUssRUFBRTtBQUNIRixjQUFBQSxPQUFPLEVBQUU7QUFETjtBQURIO0FBRkosU0FGSjtBQVVKQyxRQUFBQSxNQUFNLEVBQUU7QUFDSkMsVUFBQUEsS0FBSyxFQUFFO0FBQ0hDLFlBQUFBLElBQUksRUFBRTtBQUNGNUssY0FBQUEsSUFBSSxFQUFFO0FBREo7QUFESDtBQURILFNBVko7QUFpQko2SyxRQUFBQSxNQUFNLEVBQUU7QUFDSkMsVUFBQUEsU0FBUyxFQUFFLHFCQUFZO0FBQ25CLGlCQUFLQyxLQUFMLENBQVdDLE9BQVg7QUFDSDtBQUhHO0FBakJKO0FBREMsS0FYZ0I7QUFvQzdCO0FBQ0E7QUFDQTtBQUNBO0FBQ0FDLElBQUFBLEtBQUssRUFBRTtBQUNIQyxNQUFBQSxVQUFVLEVBQUUsQ0FDUixVQURRLEVBRVIsT0FGUSxFQUdSLE1BSFEsQ0FEVDtBQU1IQyxNQUFBQSxNQUFNLEVBQUU7QUFOTCxLQXhDc0I7QUFnRDdCQyxJQUFBQSxLQUFLLEVBQUUsQ0FBQztBQUNKRixNQUFBQSxVQUFVLEVBQUVHLE1BQU0sQ0FBQ0MsSUFBUCxDQUFZaEUsSUFBSSxDQUFDLGdCQUFELENBQWhCLEVBQW9DVixHQUFwQyxDQUF3QyxVQUFBaEcsQ0FBQztBQUFBLGVBQUcsOEJBQTRCQSxDQUEvQjtBQUFBLE9BQXpDO0FBRFIsS0FBRCxFQUVKO0FBQ0NzSyxNQUFBQSxVQUFVLEVBQUU1RCxJQUFJLENBQUMsUUFBRCxDQUFKLENBQWVWLEdBQWYsQ0FBbUIsVUFBQWhHLENBQUM7QUFBQSxlQUFHLDJCQUF5QkEsQ0FBNUI7QUFBQSxPQUFwQjtBQURiLEtBRkksRUFJSjtBQUNDc0ssTUFBQUEsVUFBVSxFQUFFRyxNQUFNLENBQUNFLE1BQVAsQ0FBY2pFLElBQUksQ0FBQyxPQUFELENBQWxCLEVBQTZCVixHQUE3QixDQUFpQyxVQUFBaEcsQ0FBQztBQUFBLGVBQUcscUJBQW1CQSxDQUF0QjtBQUFBLE9BQWxDO0FBRGIsS0FKSSxDQWhEc0I7QUF1RDdCNEssSUFBQUEsTUFBTSxFQUFFLENBQUMseUJBQUQsQ0F2RHFCO0FBd0Q3QmxCLElBQUFBLE1BQU0sRUFBRW5NLElBQUksQ0FBQ3lJLEdBQUwsQ0FBUyxVQUFVNkUsR0FBVixFQUFlN04sQ0FBZixFQUFrQjtBQUMvQixhQUFPO0FBQ0hpRixRQUFBQSxJQUFJLEVBQUUsRUFESDtBQUVIMUUsUUFBQUEsSUFBSSxFQUFFc04sR0FGSDtBQUdIQyxRQUFBQSxNQUFNLEVBQUU7QUFITCxPQUFQO0FBS0gsS0FOTztBQXhEcUIsR0FBakM7QUFpRVA7OztBQ3JFRCxTQUFTM0Qsc0JBQVQsQ0FBZ0NULElBQWhDLEVBQXFDO0FBQ2pDLE1BQUlxRSxNQUFNLEdBQUc7QUFBQ0MsSUFBQUEsR0FBRyxFQUFFLEVBQU47QUFBVUMsSUFBQUEsS0FBSyxFQUFFLEVBQWpCO0FBQXFCQyxJQUFBQSxNQUFNLEVBQUUsRUFBN0I7QUFBaUNDLElBQUFBLElBQUksRUFBRTtBQUF2QyxHQUFiO0FBQUEsTUFDSUMsS0FBSyxHQUFHLE1BQU1MLE1BQU0sQ0FBQ0ksSUFBYixHQUFvQkosTUFBTSxDQUFDRSxLQUR2QztBQUFBLE1BRUlJLE1BQU0sR0FBRyxNQUFNTixNQUFNLENBQUNDLEdBQWIsR0FBbUJELE1BQU0sQ0FBQ0csTUFGdkM7QUFJQSxNQUFJbEwsQ0FBQyxHQUFHekIsSUFBSSxDQUFDeUMsS0FBTCxDQUFXc0ssT0FBWCxHQUFxQkMsV0FBckIsQ0FBaUMsQ0FBQyxDQUFELEVBQUlILEtBQUosQ0FBakMsRUFBNkMsQ0FBN0MsQ0FBUjtBQUFBLE1BQ0lyTCxDQUFDLEdBQUcsRUFEUjtBQUFBLE1BRUl5TCxRQUFRLEdBQUcsRUFGZjtBQUlBLE1BQUlDLElBQUksR0FBR2xOLElBQUksQ0FBQ29CLEdBQUwsQ0FBUzhMLElBQVQsRUFBWDtBQUFBLE1BQ0lDLFVBREo7QUFBQSxNQUVJQyxVQUZKO0FBSUEsTUFBSWhNLEdBQUcsR0FBR3BCLElBQUksQ0FBQzZCLE1BQUwsQ0FBWSwwQkFBWixFQUF3Q0csTUFBeEMsQ0FBK0MsS0FBL0MsRUFDTEMsSUFESyxDQUNBLE9BREEsRUFDUzRLLEtBQUssR0FBR0wsTUFBTSxDQUFDSSxJQUFmLEdBQXNCSixNQUFNLENBQUNFLEtBRHRDLEVBRUx6SyxJQUZLLENBRUEsUUFGQSxFQUVVNkssTUFBTSxHQUFHTixNQUFNLENBQUNDLEdBQWhCLEdBQXNCRCxNQUFNLENBQUNHLE1BRnZDLEVBR1QzSyxNQUhTLENBR0YsR0FIRSxFQUlMQyxJQUpLLENBSUEsV0FKQSxFQUlhLGVBQWV1SyxNQUFNLENBQUNJLElBQXRCLEdBQTZCLEdBQTdCLEdBQW1DSixNQUFNLENBQUNDLEdBQTFDLEdBQWdELEdBSjdELENBQVY7QUFBQSxNQUk2RVksVUFKN0UsQ0FiaUMsQ0FvQmpDOztBQUNBLE1BQUlDLElBQUksR0FBR0MsOEJBQThCLENBQUNwRixJQUFELEVBQU8sQ0FBUCxFQUFVLENBQVYsQ0FBekMsQ0FyQmlDLENBc0JqQzs7QUFDQSxNQUFJcUYsS0FBSyxHQUFHeE4sSUFBSSxDQUFDb0IsR0FBTCxDQUFTcU0sSUFBVCxHQUFnQkMsTUFBaEIsQ0FBdUIsTUFBdkIsRUFBK0JDLFVBQS9CLENBQTBDekIsTUFBTSxDQUFDQyxJQUFQLENBQVloRSxJQUFJLENBQUMsZ0JBQUQsQ0FBaEIsRUFBb0NWLEdBQXBDLENBQXdDLFVBQUFoRyxDQUFDO0FBQUEsV0FBSW1NLFFBQVEsQ0FBQ25NLENBQUQsQ0FBWjtBQUFBLEdBQXpDLENBQTFDLENBQVo7QUFBQSxNQUNJb00sS0FBSyxHQUFHN04sSUFBSSxDQUFDb0IsR0FBTCxDQUFTcU0sSUFBVCxHQUFnQkMsTUFBaEIsQ0FBdUIsTUFBdkIsRUFBK0JDLFVBQS9CLENBQTBDeEYsSUFBSSxDQUFDLFFBQUQsQ0FBSixDQUFlVixHQUFmLENBQW1CLFVBQUFoRyxDQUFDO0FBQUEsV0FBSW1NLFFBQVEsQ0FBQ25NLENBQUQsQ0FBWjtBQUFBLEdBQXBCLENBQTFDLENBRFo7QUFBQSxNQUVJcU0sS0FBSyxHQUFHOU4sSUFBSSxDQUFDb0IsR0FBTCxDQUFTcU0sSUFBVCxHQUFnQkMsTUFBaEIsQ0FBdUIsTUFBdkIsRUFBK0JDLFVBQS9CLENBQTBDekIsTUFBTSxDQUFDRSxNQUFQLENBQWNqRSxJQUFJLENBQUMsY0FBRCxDQUFsQixFQUFvQ1YsR0FBcEMsQ0FBd0MsVUFBQWhHLENBQUM7QUFBQSxXQUFJc00sVUFBVSxDQUFDdE0sQ0FBRCxDQUFkO0FBQUEsR0FBekMsQ0FBMUMsQ0FGWjtBQUlBQSxFQUFBQSxDQUFDLENBQUN1TSxNQUFGLENBQVNYLFVBQVUsR0FBR3JOLElBQUksQ0FBQ21NLElBQUwsQ0FBVW1CLElBQUksQ0FBQyxDQUFELENBQWQsRUFBbUI5SCxNQUFuQixDQUEwQixVQUFTakUsQ0FBVCxFQUFZO0FBQ3hELFdBQU9BLENBQUMsSUFBSSxNQUFMLEtBQWdCQyxDQUFDLENBQUNELENBQUQsQ0FBRCxHQUFPdkIsSUFBSSxDQUFDeUMsS0FBTCxDQUFXd0wsTUFBWCxHQUN6QkQsTUFEeUIsQ0FDbEJoTyxJQUFJLENBQUNrTyxNQUFMLENBQVlaLElBQVosRUFBa0IsVUFBUzVILENBQVQsRUFBWTtBQUFFLGFBQU8sQ0FBQ0EsQ0FBQyxDQUFDbkUsQ0FBRCxDQUFUO0FBQWUsS0FBL0MsQ0FEa0IsRUFFekI0TSxLQUZ5QixDQUVuQixDQUFDckIsTUFBRCxFQUFTLENBQVQsQ0FGbUIsQ0FBdkIsQ0FBUDtBQUdILEdBSnFCLENBQXRCLEVBM0JpQyxDQWlDakM7O0FBQ0FLLEVBQUFBLFVBQVUsR0FBRy9MLEdBQUcsQ0FBQ1ksTUFBSixDQUFXLEdBQVgsRUFDUkMsSUFEUSxDQUNILE9BREcsRUFDTSxZQUROLEVBRVJtQixTQUZRLENBRUUsTUFGRixFQUdScEUsSUFIUSxDQUdIc08sSUFIRyxFQUlSL0osS0FKUSxHQUlBdkIsTUFKQSxDQUlPLE1BSlAsRUFLUkMsSUFMUSxDQUtILEdBTEcsRUFLRW1NLElBTEYsQ0FBYixDQWxDaUMsQ0F5Q2pDOztBQUNBaEIsRUFBQUEsVUFBVSxHQUFHaE0sR0FBRyxDQUFDWSxNQUFKLENBQVcsR0FBWCxFQUNSQyxJQURRLENBQ0gsT0FERyxFQUNNLFlBRE4sRUFFUm1CLFNBRlEsQ0FFRSxNQUZGLEVBR1JwRSxJQUhRLENBR0hzTyxJQUhHLEVBSVIvSixLQUpRLEdBSUF2QixNQUpBLENBSU8sTUFKUCxFQUtSQyxJQUxRLENBS0gsR0FMRyxFQUtFbU0sSUFMRixDQUFiLENBMUNpQyxDQWlEakM7O0FBQ0EsTUFBSUMsQ0FBQyxHQUFHak4sR0FBRyxDQUFDZ0MsU0FBSixDQUFjLFlBQWQsRUFDSHBFLElBREcsQ0FDRXFPLFVBREYsRUFFSDlKLEtBRkcsR0FFS3ZCLE1BRkwsQ0FFWSxHQUZaLEVBR0hDLElBSEcsQ0FHRSxPQUhGLEVBR1csV0FIWCxFQUlIQSxJQUpHLENBSUUsV0FKRixFQUllLFVBQVNWLENBQVQsRUFBWTtBQUFFLFdBQU8sZUFBZUUsQ0FBQyxDQUFDRixDQUFELENBQWhCLEdBQXNCLEdBQTdCO0FBQW1DLEdBSmhFLEVBS0hlLElBTEcsQ0FLRXRDLElBQUksQ0FBQ3VDLFFBQUwsQ0FBYytMLElBQWQsR0FDREMsTUFEQyxDQUNNLFVBQVNoTixDQUFULEVBQVk7QUFBRSxXQUFPO0FBQUNFLE1BQUFBLENBQUMsRUFBRUEsQ0FBQyxDQUFDRixDQUFEO0FBQUwsS0FBUDtBQUFtQixHQUR2QyxFQUVEWSxFQUZDLENBRUUsV0FGRixFQUVlLFVBQVNaLENBQVQsRUFBWTtBQUM3QjBMLElBQUFBLFFBQVEsQ0FBQzFMLENBQUQsQ0FBUixHQUFjRSxDQUFDLENBQUNGLENBQUQsQ0FBZjtBQUNBNEwsSUFBQUEsVUFBVSxDQUFDbEwsSUFBWCxDQUFnQixZQUFoQixFQUE4QixRQUE5QjtBQUNDLEdBTEMsRUFNREUsRUFOQyxDQU1FLE1BTkYsRUFNVSxVQUFTWixDQUFULEVBQVk7QUFDeEIwTCxJQUFBQSxRQUFRLENBQUMxTCxDQUFELENBQVIsR0FBY0csSUFBSSxDQUFDOE0sR0FBTCxDQUFTM0IsS0FBVCxFQUFnQm5MLElBQUksQ0FBQytNLEdBQUwsQ0FBUyxDQUFULEVBQVl6TyxJQUFJLENBQUNnRyxLQUFMLENBQVd2RSxDQUF2QixDQUFoQixDQUFkO0FBQ0EyTCxJQUFBQSxVQUFVLENBQUNuTCxJQUFYLENBQWdCLEdBQWhCLEVBQXFCbU0sSUFBckI7QUFDQWYsSUFBQUEsVUFBVSxDQUFDcUIsSUFBWCxDQUFnQixVQUFTM04sQ0FBVCxFQUFZQyxDQUFaLEVBQWU7QUFBRSxhQUFPMk4sUUFBUSxDQUFDNU4sQ0FBRCxDQUFSLEdBQWM0TixRQUFRLENBQUMzTixDQUFELENBQTdCO0FBQW1DLEtBQXBFO0FBQ0FTLElBQUFBLENBQUMsQ0FBQ3VNLE1BQUYsQ0FBU1gsVUFBVDtBQUNBZ0IsSUFBQUEsQ0FBQyxDQUFDcE0sSUFBRixDQUFPLFdBQVAsRUFBb0IsVUFBU1YsQ0FBVCxFQUFZO0FBQUUsYUFBTyxlQUFlb04sUUFBUSxDQUFDcE4sQ0FBRCxDQUF2QixHQUE2QixHQUFwQztBQUEwQyxLQUE1RTtBQUNDLEdBWkMsRUFhRFksRUFiQyxDQWFFLFNBYkYsRUFhYSxVQUFTWixDQUFULEVBQVk7QUFDM0IsV0FBTzBMLFFBQVEsQ0FBQzFMLENBQUQsQ0FBZjtBQUNBcUMsSUFBQUEsVUFBVSxDQUFDNUQsSUFBSSxDQUFDNkIsTUFBTCxDQUFZLElBQVosQ0FBRCxDQUFWLENBQThCSSxJQUE5QixDQUFtQyxXQUFuQyxFQUFnRCxlQUFlUixDQUFDLENBQUNGLENBQUQsQ0FBaEIsR0FBc0IsR0FBdEU7QUFDQXFDLElBQUFBLFVBQVUsQ0FBQ3dKLFVBQUQsQ0FBVixDQUF1Qm5MLElBQXZCLENBQTRCLEdBQTVCLEVBQWlDbU0sSUFBakM7QUFDQWpCLElBQUFBLFVBQVUsQ0FDTGxMLElBREwsQ0FDVSxHQURWLEVBQ2VtTSxJQURmLEVBRUt4SyxVQUZMLEdBR0tnTCxLQUhMLENBR1csR0FIWCxFQUlLbk8sUUFKTCxDQUljLENBSmQsRUFLS3dCLElBTEwsQ0FLVSxZQUxWLEVBS3dCLElBTHhCO0FBTUMsR0F2QkMsQ0FMRixDQUFSLENBbERpQyxDQWdGakM7O0FBQ0FvTSxFQUFBQSxDQUFDLENBQUNyTSxNQUFGLENBQVMsR0FBVCxFQUNLQyxJQURMLENBQ1UsT0FEVixFQUNtQixNQURuQixFQUVLMEQsSUFGTCxDQUVVLFVBQVNwRSxDQUFULEVBQVk7QUFDZCxRQUFJa00sSUFBSSxHQUFHLElBQVg7O0FBQ0EsUUFBR2xNLENBQUMsSUFBSSxVQUFSLEVBQW1CO0FBQ2ZrTSxNQUFBQSxJQUFJLEdBQUdELEtBQVA7QUFDSCxLQUZELE1BRU8sSUFBR2pNLENBQUMsSUFBSSxPQUFSLEVBQWdCO0FBQ25Ca00sTUFBQUEsSUFBSSxHQUFHSSxLQUFQO0FBQ0gsS0FGTSxNQUVBO0FBQ0hKLE1BQUFBLElBQUksR0FBR0ssS0FBUDtBQUNIOztBQUNEOU4sSUFBQUEsSUFBSSxDQUFDNkIsTUFBTCxDQUFZLElBQVosRUFBa0JTLElBQWxCLENBQ0ltTCxJQUFJLENBQUNoTCxLQUFMLENBQVdqQixDQUFDLENBQUNELENBQUQsQ0FBWixDQURKO0FBR0gsR0FkTCxFQWVLUyxNQWZMLENBZVksTUFmWixFQWdCSzZCLEtBaEJMLENBZ0JXLGFBaEJYLEVBZ0IwQixRQWhCMUIsRUFpQks1QixJQWpCTCxDQWlCVSxHQWpCVixFQWlCZSxDQUFDLENBakJoQixFQWtCS0MsSUFsQkwsQ0FrQlUsVUFBU1gsQ0FBVCxFQUFZO0FBQ2QsV0FBT0EsQ0FBUDtBQUNILEdBcEJMLEVBakZpQyxDQXVHakM7O0FBQ0E4TSxFQUFBQSxDQUFDLENBQUNyTSxNQUFGLENBQVMsR0FBVCxFQUNLQyxJQURMLENBQ1UsT0FEVixFQUNtQixPQURuQixFQUVLMEQsSUFGTCxDQUVVLFVBQVNwRSxDQUFULEVBQVk7QUFDZHZCLElBQUFBLElBQUksQ0FBQzZCLE1BQUwsQ0FBWSxJQUFaLEVBQWtCUyxJQUFsQixDQUF1QmQsQ0FBQyxDQUFDRCxDQUFELENBQUQsQ0FBS3NOLEtBQUwsR0FBYTdPLElBQUksQ0FBQ29CLEdBQUwsQ0FBU3lOLEtBQVQsR0FBaUJyTixDQUFqQixDQUFtQkEsQ0FBQyxDQUFDRCxDQUFELENBQXBCLEVBQXlCWSxFQUF6QixDQUE0QixZQUE1QixFQUEwQzJNLFVBQTFDLEVBQXNEM00sRUFBdEQsQ0FBeUQsT0FBekQsRUFBa0UwTSxLQUFsRSxDQUFwQztBQUNILEdBSkwsRUFLS3pMLFNBTEwsQ0FLZSxNQUxmLEVBTUtuQixJQU5MLENBTVUsR0FOVixFQU1lLENBQUMsQ0FOaEIsRUFPS0EsSUFQTCxDQU9VLE9BUFYsRUFPbUIsRUFQbkI7O0FBVUEsV0FBUzBNLFFBQVQsQ0FBa0JwTixDQUFsQixFQUFxQjtBQUNyQixRQUFJL0MsQ0FBQyxHQUFHeU8sUUFBUSxDQUFDMUwsQ0FBRCxDQUFoQjtBQUNBLFdBQU8vQyxDQUFDLElBQUksSUFBTCxHQUFZaUQsQ0FBQyxDQUFDRixDQUFELENBQWIsR0FBbUIvQyxDQUExQjtBQUNDOztBQUVELFdBQVNvRixVQUFULENBQW9CeUssQ0FBcEIsRUFBdUI7QUFDdkIsV0FBT0EsQ0FBQyxDQUFDekssVUFBRixHQUFlbkQsUUFBZixDQUF3QixHQUF4QixDQUFQO0FBQ0MsR0F6SGdDLENBMkhqQzs7O0FBQ0EsV0FBUzJOLElBQVQsQ0FBYzdNLENBQWQsRUFBaUI7QUFDakIsV0FBTzJMLElBQUksQ0FBQ0csVUFBVSxDQUFDNUYsR0FBWCxDQUFlLFVBQVMvQixDQUFULEVBQVk7QUFBRSxhQUFPLENBQUNpSixRQUFRLENBQUNqSixDQUFELENBQVQsRUFBY2xFLENBQUMsQ0FBQ2tFLENBQUQsQ0FBRCxDQUFLbkUsQ0FBQyxDQUFDbUUsQ0FBRCxDQUFOLENBQWQsQ0FBUDtBQUFtQyxLQUFoRSxDQUFELENBQVg7QUFDQzs7QUFFRCxXQUFTb0osVUFBVCxHQUFzQjtBQUN0QjlPLElBQUFBLElBQUksQ0FBQ2dHLEtBQUwsQ0FBVytJLFdBQVgsQ0FBdUJDLGVBQXZCO0FBQ0MsR0FsSWdDLENBb0lqQzs7O0FBQ0EsV0FBU0gsS0FBVCxHQUFpQjtBQUNqQixRQUFJSSxPQUFPLEdBQUc1QixVQUFVLENBQUM3SCxNQUFYLENBQWtCLFVBQVNFLENBQVQsRUFBWTtBQUFFLGFBQU8sQ0FBQ2xFLENBQUMsQ0FBQ2tFLENBQUQsQ0FBRCxDQUFLbUosS0FBTCxDQUFXSyxLQUFYLEVBQVI7QUFBNkIsS0FBN0QsQ0FBZDtBQUFBLFFBQ0lDLE9BQU8sR0FBR0YsT0FBTyxDQUFDeEgsR0FBUixDQUFZLFVBQVMvQixDQUFULEVBQVk7QUFBRSxhQUFPbEUsQ0FBQyxDQUFDa0UsQ0FBRCxDQUFELENBQUttSixLQUFMLENBQVdYLE1BQVgsRUFBUDtBQUE2QixLQUF2RCxDQURkO0FBRUFkLElBQUFBLFVBQVUsQ0FBQ3ZKLEtBQVgsQ0FBaUIsU0FBakIsRUFBNEIsVUFBU3RDLENBQVQsRUFBWTtBQUNwQyxhQUFPME4sT0FBTyxDQUFDRyxLQUFSLENBQWMsVUFBUzFKLENBQVQsRUFBWWpILENBQVosRUFBZTtBQUNwQyxlQUFPMFEsT0FBTyxDQUFDMVEsQ0FBRCxDQUFQLENBQVcsQ0FBWCxLQUFpQjhDLENBQUMsQ0FBQ21FLENBQUQsQ0FBbEIsSUFBeUJuRSxDQUFDLENBQUNtRSxDQUFELENBQUQsSUFBUXlKLE9BQU8sQ0FBQzFRLENBQUQsQ0FBUCxDQUFXLENBQVgsQ0FBeEM7QUFDQyxPQUZNLElBRUYsSUFGRSxHQUVLLE1BRlo7QUFHSCxLQUpEO0FBS0M7QUFFSjs7O0FDL0lELFNBQVNpSyxxQkFBVCxDQUErQlAsSUFBL0IsRUFBcUM7QUFDbkNySSxFQUFBQSxFQUFFLENBQUMrQixNQUFILENBQVUsVUFBVixFQUFzQnFDLE1BQXRCO0FBQ0EsTUFBSW1MLGNBQWMsR0FBR2xILElBQUksQ0FBQyxnQkFBRCxDQUFKLENBQXVCLENBQXZCLENBQXJCO0FBQ0EsTUFBSW1ILGFBQWEsR0FBR25ILElBQUksQ0FBQyxlQUFELENBQXhCO0FBQ0EsTUFBSW9ILEVBQUUsR0FBR3pOLFFBQVEsQ0FBQzBOLGFBQVQsQ0FBdUIsVUFBdkIsRUFDTkMscUJBRE0sRUFBVDtBQUFBLE1BRUU1QyxLQUFLLEdBQUcsR0FGVjtBQUdBLE1BQUlDLE1BQU0sR0FBRyxHQUFiO0FBQ0EsTUFBSU4sTUFBTSxHQUFHLEVBQWI7QUFDQSxNQUFJeE4sSUFBSSxHQUFHLEVBQVg7QUFFQWtOLEVBQUFBLE1BQU0sQ0FBQ0MsSUFBUCxDQUFZbUQsYUFBWixFQUEyQjFNLE9BQTNCLENBQW1DLFVBQVN6RCxHQUFULEVBQWM7QUFDL0MsUUFBSXVRLEtBQUssR0FBR0osYUFBYSxDQUFDblEsR0FBRCxDQUF6QjtBQUNBSCxJQUFBQSxJQUFJLENBQUNGLElBQUwsQ0FBVTtBQUNSMkMsTUFBQUEsQ0FBQyxFQUFFaU8sS0FBSyxDQUFDLENBQUQsQ0FEQTtBQUVSbE8sTUFBQUEsQ0FBQyxFQUFFa08sS0FBSyxDQUFDLENBQUQsQ0FGQTtBQUdSQyxNQUFBQSxDQUFDLEVBQUUsQ0FISztBQUlSOU8sTUFBQUEsSUFBSSxFQUFFd08sY0FBYyxDQUFDbFEsR0FBRCxDQUpaO0FBS1JBLE1BQUFBLEdBQUcsRUFBRUE7QUFMRyxLQUFWO0FBT0QsR0FURDtBQVVBLE1BQUl5USxNQUFNLEdBQUcsR0FBYjtBQUNBLE1BQUlDLE1BQU0sR0FBRyxHQUFiO0FBRUEsTUFBSXpPLEdBQUcsR0FBR3RCLEVBQUUsQ0FBQytCLE1BQUgsQ0FBVSxVQUFWLEVBQ1BHLE1BRE8sQ0FDQSxLQURBLEVBRVBDLElBRk8sQ0FFRixPQUZFLEVBRU8sU0FGUCxFQUdQQSxJQUhPLENBR0YsSUFIRSxFQUdHLFlBSEgsRUFJUEEsSUFKTyxDQUlGLE9BSkUsRUFJTzRLLEtBQUssR0FBR0wsTUFBUixHQUFpQkEsTUFKeEIsRUFLUHZLLElBTE8sQ0FLRixRQUxFLEVBS1E2SyxNQUFNLEdBQUdOLE1BQVQsR0FBa0JBLE1BTDFCLEVBTVB4SyxNQU5PLENBTUEsR0FOQSxFQU9QQyxJQVBPLENBT0YsV0FQRSxFQU9XLGVBQWV1SyxNQUFmLEdBQXdCLEdBQXhCLEdBQThCQSxNQUE5QixHQUF1QyxHQVBsRCxDQUFWO0FBU0EsTUFBSS9LLENBQUMsR0FBRzNCLEVBQUUsQ0FBQ2dRLFdBQUgsR0FDTDlCLE1BREssQ0FDRSxDQUFDbE8sRUFBRSxDQUFDME8sR0FBSCxDQUFPeFAsSUFBUCxFQUFhLFVBQVV1QyxDQUFWLEVBQWE7QUFDakMsV0FBT0EsQ0FBQyxDQUFDRSxDQUFUO0FBQ0QsR0FGUSxDQUFELEVBRUozQixFQUFFLENBQUMyTyxHQUFILENBQU96UCxJQUFQLEVBQWEsVUFBVXVDLENBQVYsRUFBYTtBQUM1QixXQUFPQSxDQUFDLENBQUNFLENBQVQ7QUFDRCxHQUZHLENBRkksQ0FERixFQU1MME0sS0FOSyxDQU1DLENBQUMsQ0FBRCxFQUFJdEIsS0FBSixDQU5ELENBQVI7QUFRQSxNQUFJckwsQ0FBQyxHQUFHMUIsRUFBRSxDQUFDZ1EsV0FBSCxHQUNMOUIsTUFESyxDQUNFLENBQUNsTyxFQUFFLENBQUMwTyxHQUFILENBQU94UCxJQUFQLEVBQWEsVUFBVXVDLENBQVYsRUFBYTtBQUNqQyxXQUFPQSxDQUFDLENBQUNDLENBQVQ7QUFDRCxHQUZRLENBQUQsRUFFSjFCLEVBQUUsQ0FBQzJPLEdBQUgsQ0FBT3pQLElBQVAsRUFBYSxVQUFVdUMsQ0FBVixFQUFhO0FBQzVCLFdBQU9BLENBQUMsQ0FBQ0MsQ0FBVDtBQUNELEdBRkcsQ0FGSSxDQURGLEVBTUwyTSxLQU5LLENBTUMsQ0FBQ3JCLE1BQUQsRUFBUyxDQUFULENBTkQsQ0FBUjtBQVFBLE1BQUlySyxLQUFLLEdBQUczQyxFQUFFLENBQUNpUSxTQUFILEdBQ1QvQixNQURTLENBQ0YsQ0FBQ2xPLEVBQUUsQ0FBQzBPLEdBQUgsQ0FBT3hQLElBQVAsRUFBYSxVQUFVdUMsQ0FBVixFQUFhO0FBQ2pDLFdBQU9BLENBQUMsQ0FBQ1YsSUFBVDtBQUNELEdBRlEsQ0FBRCxFQUVKZixFQUFFLENBQUMyTyxHQUFILENBQU96UCxJQUFQLEVBQWEsVUFBVXVDLENBQVYsRUFBYTtBQUM1QixXQUFPQSxDQUFDLENBQUNWLElBQVQ7QUFDRCxHQUZHLENBRkksQ0FERSxFQU1Uc04sS0FOUyxDQU1ILENBQUMsRUFBRCxFQUFLLEVBQUwsQ0FORyxDQUFaO0FBUUEsTUFBSTZCLE9BQU8sR0FBR2xRLEVBQUUsQ0FBQ2lRLFNBQUgsR0FDWC9CLE1BRFcsQ0FDSixDQUFDbE8sRUFBRSxDQUFDME8sR0FBSCxDQUFPeFAsSUFBUCxFQUFhLFVBQVV1QyxDQUFWLEVBQWE7QUFDakMsV0FBT0EsQ0FBQyxDQUFDVixJQUFUO0FBQ0QsR0FGUSxDQUFELEVBRUpmLEVBQUUsQ0FBQzJPLEdBQUgsQ0FBT3pQLElBQVAsRUFBYSxVQUFVdUMsQ0FBVixFQUFhO0FBQzVCLFdBQU9BLENBQUMsQ0FBQ1YsSUFBVDtBQUNELEdBRkcsQ0FGSSxDQURJLEVBTVhzTixLQU5XLENBTUwsQ0FBQyxDQUFELEVBQUksRUFBSixDQU5LLENBQWQ7QUFTQSxNQUFJckMsS0FBSyxHQUFHaE0sRUFBRSxDQUFDbVEsVUFBSCxHQUFnQnhOLEtBQWhCLENBQXNCaEIsQ0FBdEIsQ0FBWjtBQUNBLE1BQUl3SyxLQUFLLEdBQUduTSxFQUFFLENBQUNvUSxRQUFILEdBQWN6TixLQUFkLENBQW9CakIsQ0FBcEIsQ0FBWjtBQUdBSixFQUFBQSxHQUFHLENBQUNZLE1BQUosQ0FBVyxHQUFYLEVBQ0dDLElBREgsQ0FDUSxPQURSLEVBQ2lCLFFBRGpCLEVBRUdLLElBRkgsQ0FFUTJKLEtBRlIsRUFHR2pLLE1BSEgsQ0FHVSxNQUhWLEVBSUdDLElBSkgsQ0FJUSxXQUpSLEVBSXFCLGFBSnJCLEVBS0dBLElBTEgsQ0FLUSxHQUxSLEVBS2EsRUFMYixFQU1HQSxJQU5ILENBTVEsR0FOUixFQU1hLENBQUN1SyxNQU5kLEVBT0d2SyxJQVBILENBT1EsSUFQUixFQU9jLE9BUGQsRUFRRzRCLEtBUkgsQ0FRUyxhQVJULEVBUXdCLEtBUnhCLEVBU0czQixJQVRILENBU1EyTixNQVRSLEVBdEVtQyxDQWdGbkM7O0FBQ0F6TyxFQUFBQSxHQUFHLENBQUNZLE1BQUosQ0FBVyxHQUFYLEVBQ0dDLElBREgsQ0FDUSxPQURSLEVBQ2lCLFFBRGpCLEVBRUdBLElBRkgsQ0FFUSxXQUZSLEVBRXFCLGlCQUFpQjZLLE1BQWpCLEdBQTBCLEdBRi9DLEVBR0d4SyxJQUhILENBR1F3SixLQUhSLEVBSUc5SixNQUpILENBSVUsTUFKVixFQUtHQyxJQUxILENBS1EsR0FMUixFQUthNEssS0FBSyxHQUFHLEVBTHJCLEVBTUc1SyxJQU5ILENBTVEsR0FOUixFQU1hdUssTUFBTSxHQUFHLEVBTnRCLEVBT0d2SyxJQVBILENBT1EsSUFQUixFQU9jLE9BUGQsRUFRRzRCLEtBUkgsQ0FRUyxhQVJULEVBUXdCLEtBUnhCLEVBU0czQixJQVRILENBU1EwTixNQVRSO0FBV0F4TyxFQUFBQSxHQUFHLENBQUNnQyxTQUFKLENBQWMsUUFBZCxFQUNHcEUsSUFESCxDQUNRQSxJQURSLEVBRUd1RSxLQUZILEdBR0d2QixNQUhILENBR1UsR0FIVixFQUlHcUMsTUFKSCxDQUlVLFFBSlYsRUFLR3BDLElBTEgsQ0FLUSxJQUxSLEVBS2M0SyxLQUFLLEdBQUcsQ0FMdEIsRUFNRzVLLElBTkgsQ0FNUSxJQU5SLEVBTWM2SyxNQUFNLEdBQUcsQ0FOdkIsRUFPRzdLLElBUEgsQ0FPUSxHQVBSLEVBT2EsVUFBVVYsQ0FBVixFQUFhO0FBQ3RCLFdBQU9rQixLQUFLLENBQUNsQixDQUFDLENBQUNWLElBQUgsQ0FBWjtBQUNELEdBVEgsRUFVR29CLElBVkgsQ0FVUSxJQVZSLEVBVWEsVUFBU1YsQ0FBVCxFQUFZO0FBQ3JCLFdBQU9BLENBQUMsQ0FBQ3BDLEdBQVQ7QUFDRCxHQVpILEVBYUcwRSxLQWJILENBYVMsTUFiVCxFQWFpQixVQUFVdEMsQ0FBVixFQUFhO0FBQzFCLFdBQU8sU0FBUDtBQUNELEdBZkgsRUFnQkdZLEVBaEJILENBZ0JNLFdBaEJOLEVBZ0JtQixVQUFVWixDQUFWLEVBQWE5QyxDQUFiLEVBQWdCO0FBQy9CMFIsSUFBQUEsY0FBYyxDQUFDNU8sQ0FBQyxDQUFDLEtBQUQsQ0FBRixFQUFXNEcsSUFBWCxDQUFkO0FBQ0FpSSxJQUFBQSxJQUFJLENBQUM3TyxDQUFDLENBQUMsS0FBRCxDQUFGLEVBQVcsQ0FBWCxDQUFKO0FBQ0QsR0FuQkgsRUFvQkdZLEVBcEJILENBb0JNLFVBcEJOLEVBb0JrQixVQUFVWixDQUFWLEVBQWE5QyxDQUFiLEVBQWdCO0FBQzlCNFIsSUFBQUEsT0FBTztBQUNSLEdBdEJILEVBdUJHek0sVUF2QkgsR0F3QkdnTCxLQXhCSCxDQXdCUyxVQUFVck4sQ0FBVixFQUFhOUMsQ0FBYixFQUFnQjtBQUNyQixXQUFPZ0QsQ0FBQyxDQUFDRixDQUFDLENBQUNFLENBQUgsQ0FBRCxHQUFTRCxDQUFDLENBQUNELENBQUMsQ0FBQ0MsQ0FBSCxDQUFqQjtBQUNELEdBMUJILEVBMkJHZixRQTNCSCxDQTJCWSxHQTNCWixFQTRCR3dCLElBNUJILENBNEJRLElBNUJSLEVBNEJjLFVBQVVWLENBQVYsRUFBYTtBQUN2QixXQUFPRSxDQUFDLENBQUNGLENBQUMsQ0FBQ0UsQ0FBSCxDQUFSO0FBQ0QsR0E5QkgsRUErQkdRLElBL0JILENBK0JRLElBL0JSLEVBK0JjLFVBQVVWLENBQVYsRUFBYTtBQUN2QixXQUFPQyxDQUFDLENBQUNELENBQUMsQ0FBQ0MsQ0FBSCxDQUFSO0FBQ0QsR0FqQ0gsRUE1Rm1DLENBK0gvQjs7QUFDSkosRUFBQUEsR0FBRyxDQUFDWSxNQUFKLENBQVcsTUFBWCxFQUNHQyxJQURILENBQ1EsT0FEUixFQUNpQixTQURqQixFQUVHQSxJQUZILENBRVEsYUFGUixFQUV1QixLQUZ2QixFQUdHQSxJQUhILENBR1EsR0FIUixFQUdhNEssS0FIYixFQUlHNUssSUFKSCxDQUlRLEdBSlIsRUFJYTZLLE1BQU0sR0FBRSxFQUpyQixFQUtHNUssSUFMSCxDQUtRLEtBTFI7QUFRQWQsRUFBQUEsR0FBRyxDQUFDWSxNQUFKLENBQVcsTUFBWCxFQUNHQyxJQURILENBQ1EsT0FEUixFQUNpQixTQURqQixFQUVHQSxJQUZILENBRVEsYUFGUixFQUV1QixLQUZ2QixFQUdHQSxJQUhILENBR1EsR0FIUixFQUdhLENBQUMsRUFIZCxFQUlHQSxJQUpILENBSVEsSUFKUixFQUljLE9BSmQsRUFLR0EsSUFMSCxDQUtRLFdBTFIsRUFLcUIsYUFMckIsRUFNR0MsSUFOSCxDQU1RLEtBTlI7O0FBU0EsV0FBU2tPLElBQVQsQ0FBY2pSLEdBQWQsRUFBbUI2USxPQUFuQixFQUE0QjtBQUMxQjVPLElBQUFBLEdBQUcsQ0FBQ2dDLFNBQUosQ0FBYyxRQUFkLEVBQ0dvQyxNQURILENBQ1UsVUFBVWpFLENBQVYsRUFBYTtBQUVuQixhQUFPQSxDQUFDLENBQUNwQyxHQUFGLElBQVNBLEdBQWhCO0FBQ0QsS0FKSCxFQUtFMEUsS0FMRixDQUtRLE1BTFIsRUFLZ0IsU0FMaEI7QUFNRDs7QUFFRCxXQUFTd00sT0FBVCxHQUFtQjtBQUNqQmpQLElBQUFBLEdBQUcsQ0FBQ2dDLFNBQUosQ0FBYyxRQUFkLEVBQ0dRLFVBREgsR0FFR0MsS0FGSCxDQUVTLE1BRlQsRUFFZ0IsU0FGaEI7QUFHRDtBQUNGOzs7QUMvSkQsU0FBU3NNLGNBQVQsQ0FBd0JHLFlBQXhCLEVBQXNDbkksSUFBdEMsRUFBNEM7QUFDMUNySSxFQUFBQSxFQUFFLENBQUMrQixNQUFILENBQVUsWUFBVixFQUF3QnFDLE1BQXhCO0FBQ0FwRSxFQUFBQSxFQUFFLENBQUMrQixNQUFILENBQVUsWUFBVixFQUF3QnFDLE1BQXhCO0FBQ0EsTUFBSXFNLFVBQVUsR0FBRyxFQUFqQjtBQUNBLE1BQUl0UixPQUFPLEdBQUVrSixJQUFJLENBQUMsWUFBRCxDQUFKLENBQW1CbUksWUFBbkIsQ0FBYjs7QUFDQSxPQUFLLElBQUluUixHQUFULElBQWdCRixPQUFoQixFQUF5QjtBQUN2QixRQUFJQSxPQUFPLENBQUNHLGNBQVIsQ0FBdUJELEdBQXZCLENBQUosRUFBaUM7QUFDN0IsVUFBSXFSLElBQUksR0FBRSxFQUFWO0FBQ0FBLE1BQUFBLElBQUksQ0FBQ0MsS0FBTCxHQUFhdFIsR0FBYjtBQUNBcVIsTUFBQUEsSUFBSSxDQUFDRSxlQUFMLEdBQXVCaFAsSUFBSSxDQUFDaVAsR0FBTCxDQUFTMVIsT0FBTyxDQUFDRSxHQUFELENBQWhCLENBQXZCO0FBQ0FxUixNQUFBQSxJQUFJLENBQUNJLE9BQUwsR0FBZWxQLElBQUksQ0FBQ2lQLEdBQUwsQ0FBU3hJLElBQUksQ0FBQyxjQUFELENBQUosQ0FBcUJoSixHQUFyQixDQUFULENBQWY7QUFDQXFSLE1BQUFBLElBQUksQ0FBQ0ssS0FBTCxHQUFhTCxJQUFJLENBQUNFLGVBQUwsR0FBdUJGLElBQUksQ0FBQ0ksT0FBekM7QUFDQUwsTUFBQUEsVUFBVSxDQUFDelIsSUFBWCxDQUFnQjBSLElBQWhCO0FBQ0FNLE1BQUFBLE9BQU8sQ0FBQ0MsR0FBUixDQUFZNVIsR0FBRyxHQUFHLElBQU4sR0FBYWdKLElBQUksQ0FBQyxjQUFELENBQUosQ0FBcUJoSixHQUFyQixDQUF6QjtBQUNIO0FBRUY7O0FBRUQsTUFBSW9RLEVBQUUsR0FBR3pOLFFBQVEsQ0FBQzBOLGFBQVQsQ0FBdUIsY0FBdkIsRUFDTkMscUJBRE0sRUFBVDtBQUFBLE1BRUU1QyxLQUFLLEdBQUcsR0FGVjtBQUlBLE1BQUk3TixJQUFJLEdBQUd1UixVQUFYO0FBQ0EsTUFBSXpELE1BQU0sR0FBRzlOLElBQUksQ0FBQ04sTUFBTCxHQUFjLEVBQWQsR0FBa0IsR0FBL0I7QUFDQSxNQUFJMEMsR0FBRyxHQUFHdEIsRUFBRSxDQUFDK0IsTUFBSCxDQUFVLGNBQVYsRUFBMEJHLE1BQTFCLENBQWlDLEtBQWpDLEVBQXdDQyxJQUF4QyxDQUE2QyxPQUE3QyxFQUFzRDRLLEtBQXRELEVBQTZENUssSUFBN0QsQ0FBa0UsUUFBbEUsRUFBNEU2SyxNQUE1RSxFQUFvRjdLLElBQXBGLENBQXlGLElBQXpGLEVBQThGLFdBQTlGLENBQVY7QUFBQSxNQUNFdUssTUFBTSxHQUFHO0FBQ1BDLElBQUFBLEdBQUcsRUFBRSxFQURFO0FBRVBDLElBQUFBLEtBQUssRUFBRSxDQUZBO0FBR1BDLElBQUFBLE1BQU0sRUFBRSxFQUhEO0FBSVBDLElBQUFBLElBQUksRUFBRTtBQUpDLEdBRFg7QUFBQSxNQU9FQyxLQUFLLEdBQUcsQ0FBQ3pMLEdBQUcsQ0FBQ2EsSUFBSixDQUFTLE9BQVQsQ0FBRCxHQUFxQnVLLE1BQU0sQ0FBQ0ksSUFBNUIsR0FBbUNKLE1BQU0sQ0FBQ0UsS0FQcEQ7QUFBQSxNQVFFSSxNQUFNLEdBQUcsQ0FBQzFMLEdBQUcsQ0FBQ2EsSUFBSixDQUFTLFFBQVQsQ0FBRCxHQUFzQnVLLE1BQU0sQ0FBQ0MsR0FBN0IsR0FBbUNELE1BQU0sQ0FBQ0csTUFSckQ7QUFBQSxNQVNFMEIsQ0FBQyxHQUFHak4sR0FBRyxDQUFDWSxNQUFKLENBQVcsR0FBWCxFQUFnQkMsSUFBaEIsQ0FBcUIsV0FBckIsRUFBa0MsZUFBZXVLLE1BQU0sQ0FBQ0ksSUFBdEIsR0FBNkIsR0FBN0IsR0FBbUNKLE1BQU0sQ0FBQ0MsR0FBMUMsR0FBZ0QsR0FBbEYsQ0FUTjtBQVVBLE1BQUlqTCxDQUFDLEdBQUcxQixFQUFFLENBQUNrUixTQUFILEdBQWU7QUFBZixHQUNMQyxVQURLLENBQ00sQ0FBQyxDQUFELEVBQUluRSxNQUFKLENBRE4sRUFDbUI7QUFEbkIsR0FFTG9FLFlBRkssQ0FFUSxJQUZSLEVBRWNDLEtBRmQsQ0FFb0IsR0FGcEIsQ0FBUjtBQUdBLE1BQUkxUCxDQUFDLEdBQUczQixFQUFFLENBQUNnUSxXQUFILEdBQWlCO0FBQWpCLEdBQ0xtQixVQURLLENBQ00sQ0FBQyxDQUFELEVBQUlwRSxLQUFKLENBRE4sQ0FBUixDQXJDMEMsQ0FzQ2Y7O0FBRTNCLE1BQUl1RSxDQUFDLEdBQUd0UixFQUFFLENBQUN1UixZQUFILEdBQWtCbEQsS0FBbEIsQ0FBd0IsQ0FBQyxTQUFELEVBQVksU0FBWixDQUF4QixDQUFSO0FBQ0EsTUFBSWhDLElBQUksR0FBRyxDQUFDLGlCQUFELEVBQW9CLFNBQXBCLENBQVg7QUFDQW5OLEVBQUFBLElBQUksQ0FBQzBQLElBQUwsQ0FBVSxVQUFVM04sQ0FBVixFQUFhQyxDQUFiLEVBQWdCO0FBQ3hCLFdBQU9BLENBQUMsQ0FBQzZQLEtBQUYsR0FBVTlQLENBQUMsQ0FBQzhQLEtBQW5CO0FBQ0QsR0FGRDtBQUdBclAsRUFBQUEsQ0FBQyxDQUFDd00sTUFBRixDQUFTaFAsSUFBSSxDQUFDeUksR0FBTCxDQUFTLFVBQVVsRyxDQUFWLEVBQWE7QUFDN0IsV0FBT0EsQ0FBQyxDQUFDa1AsS0FBVDtBQUNELEdBRlEsQ0FBVCxFQTdDMEMsQ0ErQ3JDOztBQUVMaFAsRUFBQUEsQ0FBQyxDQUFDdU0sTUFBRixDQUFTLENBQUMsQ0FBRCxFQUFJbE8sRUFBRSxDQUFDMk8sR0FBSCxDQUFPelAsSUFBUCxFQUFhLFVBQVV1QyxDQUFWLEVBQWE7QUFDckMsV0FBT0EsQ0FBQyxDQUFDc1AsS0FBVDtBQUNELEdBRlksQ0FBSixDQUFULEVBRUtTLElBRkwsR0FqRDBDLENBbUQ3Qjs7QUFFYkYsRUFBQUEsQ0FBQyxDQUFDcEQsTUFBRixDQUFTN0IsSUFBVDtBQUNBa0MsRUFBQUEsQ0FBQyxDQUFDck0sTUFBRixDQUFTLEdBQVQsRUFDR29CLFNBREgsQ0FDYSxHQURiLEVBRUdwRSxJQUZILENBRVFjLEVBQUUsQ0FBQ3lSLEtBQUgsR0FBV3BGLElBQVgsQ0FBZ0JBLElBQWhCLEVBQXNCbk4sSUFBdEIsQ0FGUixFQUdHdUUsS0FISCxHQUdXdkIsTUFIWCxDQUdrQixHQUhsQixFQUlLQyxJQUpMLENBSVUsTUFKVixFQUlrQixVQUFTVixDQUFULEVBQVk7QUFBRSxXQUFPNlAsQ0FBQyxDQUFDN1AsQ0FBQyxDQUFDcEMsR0FBSCxDQUFSO0FBQWtCLEdBSmxELEVBS0dpRSxTQUxILENBS2EsTUFMYixFQU1HcEUsSUFOSCxDQU1RLFVBQVN1QyxDQUFULEVBQVk7QUFBRSxXQUFPQSxDQUFQO0FBQVcsR0FOakMsRUFPR2dDLEtBUEgsR0FPV3ZCLE1BUFgsQ0FPa0IsTUFQbEIsRUFRS0MsSUFSTCxDQVFVLEdBUlYsRUFRZSxVQUFTVixDQUFULEVBQVk7QUFBRSxXQUFPQyxDQUFDLENBQUNELENBQUMsQ0FBQ3ZDLElBQUYsQ0FBT3lSLEtBQVIsQ0FBUjtBQUF5QixHQVJ0RCxFQVE0RDtBQVI1RCxHQVNLeE8sSUFUTCxDQVNVLEdBVFYsRUFTZSxVQUFTVixDQUFULEVBQVk7QUFBRSxXQUFPRSxDQUFDLENBQUNGLENBQUMsQ0FBQyxDQUFELENBQUYsQ0FBUjtBQUFpQixHQVQ5QyxFQVN3RDtBQVR4RCxHQVVLVSxJQVZMLENBVVUsT0FWVixFQVVtQixVQUFTVixDQUFULEVBQVk7QUFFMUIsV0FBT0UsQ0FBQyxDQUFDRixDQUFDLENBQUMsQ0FBRCxDQUFGLENBQUQsR0FBVUUsQ0FBQyxDQUFDRixDQUFDLENBQUMsQ0FBRCxDQUFGLENBQWxCO0FBQ0YsR0FiSCxFQWFLO0FBYkwsR0FjS1UsSUFkTCxDQWNVLFFBZFYsRUFjb0JULENBQUMsQ0FBQ2dRLFNBQUYsRUFkcEIsRUF0RDBDLENBb0VROztBQUVsRG5ELEVBQUFBLENBQUMsQ0FBQ3JNLE1BQUYsQ0FBUyxHQUFULEVBQ0tDLElBREwsQ0FDVSxPQURWLEVBQ21CLE1BRG5CLEVBRUtBLElBRkwsQ0FFVSxXQUZWLEVBRXVCLGdCQUZ2QixFQUVvRDtBQUZwRCxHQUdLSyxJQUhMLENBR1V4QyxFQUFFLENBQUNvUSxRQUFILENBQVkxTyxDQUFaLENBSFYsRUF0RTBDLENBeUVFOztBQUU1QzZNLEVBQUFBLENBQUMsQ0FBQ3JNLE1BQUYsQ0FBUyxHQUFULEVBQ0tDLElBREwsQ0FDVSxPQURWLEVBQ21CLE1BRG5CLEVBRUdBLElBRkgsQ0FFUSxXQUZSLEVBRXFCLGlCQUFlNkssTUFBZixHQUFzQixHQUYzQyxFQUVzRDtBQUZ0RCxHQUdLeEssSUFITCxDQUdVeEMsRUFBRSxDQUFDbVEsVUFBSCxDQUFjeE8sQ0FBZCxFQUFpQmdRLEtBQWpCLENBQXVCLElBQXZCLEVBQTZCLEdBQTdCLENBSFYsRUFHc0Q7QUFIdEQsR0FJR3pQLE1BSkgsQ0FJVSxNQUpWLEVBS0tDLElBTEwsQ0FLVSxHQUxWLEVBS2UsQ0FMZixFQUt3QztBQUx4QyxHQU1LQSxJQU5MLENBTVUsR0FOVixFQU1lUixDQUFDLENBQUNBLENBQUMsQ0FBQ2dRLEtBQUYsR0FBVUMsR0FBVixFQUFELENBQUQsR0FBcUIsR0FOcEMsRUFNb0Q7QUFOcEQsR0FPS3pQLElBUEwsQ0FPVSxJQVBWLEVBT2dCLEtBUGhCLEVBT3lDO0FBUHpDLEdBUUtBLElBUkwsQ0FRVSxNQVJWLEVBUWtCLE1BUmxCLEVBU0tBLElBVEwsQ0FTVSxhQVRWLEVBU3lCLE9BVHpCLEVBVUtDLElBVkwsQ0FVVSwrQkFWVixFQVdHRCxJQVhILENBV1EsV0FYUixFQVdxQixlQUFlLENBQUM0SyxLQUFoQixHQUF3QixPQVg3QyxFQTNFMEMsQ0FzRmdCOztBQUUxRCxNQUFJOEUsTUFBTSxHQUFHdEQsQ0FBQyxDQUFDck0sTUFBRixDQUFTLEdBQVQsRUFDUkMsSUFEUSxDQUNILGFBREcsRUFDWSxZQURaLEVBRVJBLElBRlEsQ0FFSCxXQUZHLEVBRVUsRUFGVixFQUdSQSxJQUhRLENBR0gsYUFIRyxFQUdZLEtBSFosRUFJVm1CLFNBSlUsQ0FJQSxHQUpBLEVBS1ZwRSxJQUxVLENBS0xtTixJQUFJLENBQUN5RixLQUFMLEdBQWFDLE9BQWIsRUFMSyxFQU1WdE8sS0FOVSxHQU1GdkIsTUFORSxDQU1LLEdBTkwsRUFPWDtBQVBXLEdBUVhDLElBUlcsQ0FRTixXQVJNLEVBUU8sVUFBU1YsQ0FBVCxFQUFZOUMsQ0FBWixFQUFlO0FBQUUsV0FBTyxvQkFBb0IsTUFBTUEsQ0FBQyxHQUFHLEVBQTlCLElBQW9DLEdBQTNDO0FBQWlELEdBUnpFLENBQWI7QUFXQSxNQUFJcVQsS0FBSyxHQUFHLENBQUMsMENBQUQsRUFBNkMsb0RBQTdDLENBQVo7QUFDQSxNQUFJQyxJQUFJLEdBQUdqUyxFQUFFLENBQUMrQixNQUFILENBQVUsVUFBVixFQUFzQkcsTUFBdEIsQ0FBNkIsS0FBN0IsRUFBb0NDLElBQXBDLENBQXlDLE9BQXpDLEVBQWtELEdBQWxELEVBQXVEQSxJQUF2RCxDQUE0RCxRQUE1RCxFQUFzRTZLLE1BQXRFLEVBQThFN0ssSUFBOUUsQ0FBbUYsSUFBbkYsRUFBd0YsV0FBeEYsQ0FBWDtBQUNGLE1BQUkwUCxNQUFNLEdBQUdJLElBQUksQ0FBQy9QLE1BQUwsQ0FBWSxHQUFaLEVBQWlCQyxJQUFqQixDQUFzQixhQUF0QixFQUFxQyxZQUFyQyxFQUFtREEsSUFBbkQsQ0FBd0QsV0FBeEQsRUFBcUUsRUFBckUsRUFBeUVBLElBQXpFLENBQThFLGFBQTlFLEVBQTZGLEtBQTdGLEVBQW9HbUIsU0FBcEcsQ0FBOEcsR0FBOUcsRUFBbUhwRSxJQUFuSCxDQUF3SDhTLEtBQUssQ0FBQ0YsS0FBTixHQUFjQyxPQUFkLEVBQXhILEVBQWlKdE8sS0FBakosR0FBeUp2QixNQUF6SixDQUFnSyxHQUFoSyxFQUFxSztBQUFySyxHQUNSQyxJQURRLENBQ0gsV0FERyxFQUNVLFVBQVVWLENBQVYsRUFBYTlDLENBQWIsRUFBZ0I7QUFDakMsV0FBTyxvQkFBb0IsSUFBSUEsQ0FBQyxHQUFHLEVBQTVCLElBQWtDLEdBQXpDO0FBQ0QsR0FIUSxDQUFiO0FBSUVrVCxFQUFBQSxNQUFNLENBQUMzUCxNQUFQLENBQWMsTUFBZCxFQUFzQkMsSUFBdEIsQ0FBMkIsR0FBM0IsRUFBZ0M0SyxLQUFoQyxFQUNDNUssSUFERCxDQUNNLE9BRE4sRUFDZSxVQUFVVixDQUFWLEVBQWE5QyxDQUFiLEVBQWU7QUFDMUIsUUFBR0EsQ0FBQyxJQUFFLENBQU4sRUFBUTtBQUNOLGFBQU8sRUFBUDtBQUNEOztBQUNELFdBQU8sR0FBUDtBQUNILEdBTkQsRUFNR3dELElBTkgsQ0FNUSxRQU5SLEVBTWtCLEVBTmxCLEVBTXNCQSxJQU50QixDQU0yQixNQU4zQixFQU1tQ21QLENBTm5DO0FBUUFPLEVBQUFBLE1BQU0sQ0FBQzNQLE1BQVAsQ0FBYyxNQUFkLEVBQXNCQyxJQUF0QixDQUEyQixHQUEzQixFQUFnQzRLLEtBQUssR0FBRyxFQUF4QyxFQUE0QzVLLElBQTVDLENBQWlELEdBQWpELEVBQXNELEVBQXRELEVBQTBEQSxJQUExRCxDQUErRCxJQUEvRCxFQUFxRSxPQUFyRSxFQUE4RUMsSUFBOUUsQ0FBbUYsVUFBVVgsQ0FBVixFQUFhO0FBQzlGLFdBQU9BLENBQVA7QUFDRCxHQUZEO0FBSUQ7OztBQ3JIRCxTQUFTeVEsb0JBQVQsR0FBK0I7QUFDM0JqUyxFQUFBQSxNQUFNLENBQUNrUyxZQUFQLEdBQXNCLEVBQXRCOztBQUNBLE1BQUdsUyxNQUFNLENBQUNtUywrQkFBVixFQUEwQztBQUN0QyxTQUFJLElBQUl6USxDQUFSLElBQWExQixNQUFNLENBQUNtUywrQkFBcEIsRUFBb0Q7QUFDaEQsVUFBSUMsTUFBTSxHQUFHLEVBQWI7O0FBQ0EsV0FBSSxJQUFJM1EsQ0FBUixJQUFhekIsTUFBTSxDQUFDbVMsK0JBQVAsQ0FBdUN6USxDQUF2QyxDQUFiLEVBQXVEO0FBQ25EMFEsUUFBQUEsTUFBTSxDQUFDclQsSUFBUCxDQUFZaUIsTUFBTSxDQUFDbVMsK0JBQVAsQ0FBdUN6USxDQUF2QyxFQUEwQ0QsQ0FBMUMsQ0FBWjtBQUNIOztBQUNEekIsTUFBQUEsTUFBTSxDQUFDa1MsWUFBUCxDQUFvQnhRLENBQXBCLElBQXlCMFEsTUFBekI7QUFDSDtBQUNKO0FBQ0o7O0FBRUQsU0FBUzVFLDhCQUFULENBQXdDakUsUUFBeEMsRUFBa0Q4SSxlQUFsRCxFQUFtRUMsY0FBbkUsRUFBa0Y7QUFDOUUsTUFBSUMsT0FBTyxHQUFHLEVBQWQ7O0FBQ0EsT0FBSyxJQUFJQyxNQUFULElBQW1CakosUUFBUSxDQUFDLGdCQUFELENBQTNCLEVBQThDO0FBQzFDLFNBQUksSUFBSWtKLEtBQVIsSUFBaUJsSixRQUFRLENBQUMsZ0JBQUQsQ0FBUixDQUEyQmlKLE1BQTNCLENBQWpCLEVBQW9EO0FBQ2hELFVBQUlFLFVBQVUsR0FBR25KLFFBQVEsQ0FBQyxnQkFBRCxDQUFSLENBQTJCaUosTUFBM0IsRUFBbUNDLEtBQW5DLENBQWpCOztBQUNBLFVBQUlDLFVBQVUsR0FBR0wsZUFBakIsRUFBaUM7QUFFN0IsYUFBSSxJQUFJTSxJQUFSLElBQWdCcEosUUFBUSxDQUFDLFlBQUQsQ0FBUixDQUF1QmtKLEtBQXZCLENBQWhCLEVBQThDO0FBQzFDLGNBQUlHLFNBQVMsR0FBR3JKLFFBQVEsQ0FBQyxZQUFELENBQVIsQ0FBdUJrSixLQUF2QixFQUE4QkUsSUFBOUIsQ0FBaEI7O0FBQ0EsY0FBSUMsU0FBUyxHQUFHTixjQUFoQixFQUErQjtBQUMzQkMsWUFBQUEsT0FBTyxDQUFDeFQsSUFBUixDQUFhO0FBQ1Qsc0JBQVF5VCxNQURDO0FBRVQsMEJBQWFBLE1BRko7QUFHVCx1QkFBU0MsS0FIQTtBQUlULHNCQUFRbEosUUFBUSxDQUFDLGNBQUQsQ0FBUixDQUF5Qm9KLElBQXpCO0FBSkMsYUFBYjtBQU1IO0FBQ0o7QUFFSjtBQUNKO0FBQ0o7O0FBQ0QsU0FBT0osT0FBUDtBQUNIOztBQUVELFNBQVMzSCxnQ0FBVCxDQUEwQ3JCLFFBQTFDLEVBQW9EOEksZUFBcEQsRUFBcUVDLGNBQXJFLEVBQW9GO0FBQ2hGLE1BQUlDLE9BQU8sR0FBRyxFQUFkOztBQUNBLE9BQUssSUFBSUMsTUFBVCxJQUFtQmpKLFFBQVEsQ0FBQyxnQkFBRCxDQUEzQixFQUE4QztBQUMxQyxTQUFJLElBQUlrSixLQUFSLElBQWlCbEosUUFBUSxDQUFDLGdCQUFELENBQVIsQ0FBMkJpSixNQUEzQixDQUFqQixFQUFvRDtBQUNoRCxVQUFJRSxVQUFVLEdBQUduSixRQUFRLENBQUMsZ0JBQUQsQ0FBUixDQUEyQmlKLE1BQTNCLEVBQW1DQyxLQUFuQyxDQUFqQjs7QUFDQSxVQUFJQyxVQUFVLEdBQUdMLGVBQWpCLEVBQWlDO0FBRTdCLGFBQUksSUFBSU0sSUFBUixJQUFnQnBKLFFBQVEsQ0FBQyxZQUFELENBQVIsQ0FBdUJrSixLQUF2QixDQUFoQixFQUE4QztBQUMxQyxjQUFJRyxTQUFTLEdBQUdySixRQUFRLENBQUMsWUFBRCxDQUFSLENBQXVCa0osS0FBdkIsRUFBOEJFLElBQTlCLENBQWhCOztBQUNBLGNBQUlDLFNBQVMsR0FBR04sY0FBaEIsRUFBK0I7QUFDM0JDLFlBQUFBLE9BQU8sQ0FBQ3hULElBQVIsQ0FBYSxDQUFDOE8sUUFBUSxDQUFDMkUsTUFBRCxDQUFULEVBQW1CM0UsUUFBUSxDQUFDNEUsS0FBRCxDQUEzQixFQUFvQ2xKLFFBQVEsQ0FBQyxPQUFELENBQVIsQ0FBa0JzSixPQUFsQixDQUEwQkYsSUFBMUIsQ0FBcEMsQ0FBYjtBQUNIO0FBQ0o7QUFFSjtBQUNKO0FBQ0o7O0FBQ0QsU0FBT0osT0FBUDtBQUNIOzs7QUN4RER2UyxNQUFNLENBQUNrSyxNQUFQLEdBQWdCLElBQUk0SSxHQUFKLENBQVE7QUFDcEJDLEVBQUFBLEVBQUUsRUFBRSxVQURnQjtBQUVwQjlULEVBQUFBLElBQUksRUFBRTtBQUNGK1QsSUFBQUEsT0FBTyxFQUFFLGFBRFA7QUFFRkMsSUFBQUEsWUFBWSxFQUFFLElBRlo7QUFHRkMsSUFBQUEsWUFBWSxFQUFFLENBSFo7QUFJRkMsSUFBQUEsWUFBWSxFQUFFO0FBQ1Z4UCxNQUFBQSxJQUFJLEVBQUU7QUFESSxLQUpaO0FBT0Z5UCxJQUFBQSxlQUFlLEVBQUUsRUFQZjtBQVFGQyxJQUFBQSxPQUFPLEVBQUUsRUFSUDtBQVNGQyxJQUFBQSxXQUFXLEVBQUUsQ0FUWDtBQVVGekwsSUFBQUEsT0FBTyxFQUFFLEtBVlA7QUFXRjBMLElBQUFBLE9BQU8sRUFBRSxLQVhQO0FBWUZDLElBQUFBLE1BQU0sRUFBRSxFQVpOO0FBYUZDLElBQUFBLGlCQUFpQixFQUFFLEVBYmpCO0FBY0ZDLElBQUFBLGFBQWEsRUFBRSxLQWRiO0FBZUZ2SixJQUFBQSxRQUFRLEVBQUU7QUFDTndKLE1BQUFBLGNBQWMsRUFBRSxLQURWO0FBRU5uSixNQUFBQSxlQUFlLEVBQUUsQ0FGWDtBQUdORSxNQUFBQSxNQUFNLEVBQUUsQ0FIRjtBQUdVO0FBQ2hCQyxNQUFBQSxJQUFJLEVBQUUsRUFKQTtBQUlXO0FBQ2pCUCxNQUFBQSxNQUFNLEVBQUUsQ0FMRjtBQUtVO0FBQ2hCRSxNQUFBQSxJQUFJLEVBQUUsQ0FOQTtBQU1VO0FBQ2hCc0osTUFBQUEsaUJBQWlCLEVBQUUsQ0FQYjtBQVFOQyxNQUFBQSxpQkFBaUIsRUFBRTtBQVJiO0FBZlIsR0FGYztBQTRCcEJDLEVBQUFBLE9BQU8sRUFBRTtBQUNMQyxJQUFBQSxVQUFVLEVBQUUsb0JBQVNyUyxDQUFULEVBQVc7QUFDbkIsV0FBS3dSLFlBQUwsR0FBb0J4UixDQUFwQjs7QUFDQSxVQUFJQSxDQUFDLElBQUksQ0FBVCxFQUFXO0FBQ1A0RyxRQUFBQSxTQUFTLENBQUN0SSxNQUFNLENBQUNxSSxXQUFSLENBQVQ7QUFDSDs7QUFDRCxVQUFJM0csQ0FBQyxJQUFJLENBQVQsRUFBVztBQUNQNkcsUUFBQUEsU0FBUyxDQUFDdkksTUFBTSxDQUFDcUksV0FBUixDQUFUO0FBQ0g7O0FBQ0QsVUFBSTNHLENBQUMsSUFBSSxDQUFULEVBQVc7QUFDUDhHLFFBQUFBLFNBQVMsQ0FBQ3hJLE1BQU0sQ0FBQ3FJLFdBQVIsQ0FBVDtBQUNIOztBQUNELFVBQUkzRyxDQUFDLElBQUksQ0FBVCxFQUFXO0FBQ1ArRyxRQUFBQSxTQUFTLENBQUN6SSxNQUFNLENBQUNxSSxXQUFSLENBQVQ7QUFDSDtBQUNKLEtBZkk7QUFnQkwyTCxJQUFBQSxTQUFTLEVBQUUscUJBQVU7QUFDakIsVUFBSSxLQUFLUixNQUFMLENBQVlTLElBQVosR0FBbUJ0TSxLQUFuQixDQUF5QixHQUF6QixFQUE4QmhKLE1BQTlCLEdBQXVDLENBQTNDLEVBQTZDO0FBQ3pDK0ssUUFBQUEsS0FBSyxDQUFDLDZCQUFELENBQUw7QUFDQTtBQUNIOztBQUNELFdBQUsySixPQUFMLENBQWF0VSxJQUFiLENBQWtCLEtBQUt5VSxNQUF2QjtBQUNBLFdBQUtBLE1BQUwsR0FBYyxFQUFkO0FBQ0EsV0FBS0UsYUFBTCxHQUFxQixLQUFyQjtBQUNILEtBeEJJO0FBeUJMUSxJQUFBQSxXQUFXLEVBQUUsdUJBQVk7QUFDckIsVUFBSUMsSUFBSSxHQUFHLElBQVg7QUFDQXhLLE1BQUFBLGdCQUFnQixDQUFDLEtBQUswSixPQUFOLEVBQWUsVUFBU2pMLElBQVQsRUFBYztBQUN6QytMLFFBQUFBLElBQUksQ0FBQ1YsaUJBQUwsR0FBeUJyTCxJQUF6QjtBQUNBK0wsUUFBQUEsSUFBSSxDQUFDVCxhQUFMLEdBQXFCLElBQXJCO0FBQ0gsT0FIZSxDQUFoQjtBQUlILEtBL0JJO0FBZ0NMVSxJQUFBQSxXQUFXLEVBQUUsdUJBQVU7QUFDbkIsVUFBSUQsSUFBSSxHQUFHLElBQVg7QUFDQUEsTUFBQUEsSUFBSSxDQUFDdE0sT0FBTCxHQUFlLEtBQWY7QUFDQXNNLE1BQUFBLElBQUksQ0FBQ0UsT0FBTCxHQUFlLEtBQWY7O0FBQ0EsVUFBSSxLQUFLbEssUUFBTCxDQUFjSyxlQUFkLElBQWlDLENBQXJDLEVBQXVDO0FBQ25DLFlBQUcsS0FBS0wsUUFBTCxDQUFjUSxJQUFkLEdBQXFCLEtBQUtSLFFBQUwsQ0FBY08sTUFBbkMsR0FBNEMsRUFBL0MsRUFBa0Q7QUFDOUNoQixVQUFBQSxLQUFLLENBQUMsMkdBQUQsQ0FBTDtBQUNBO0FBQ0gsU0FIRCxNQUdPLElBQUcsS0FBS1MsUUFBTCxDQUFjUSxJQUFkLEdBQXFCLEtBQUtSLFFBQUwsQ0FBY08sTUFBbkMsR0FBNEMsRUFBL0MsRUFBa0Q7QUFDckRoQixVQUFBQSxLQUFLLENBQUMsdURBQUQsQ0FBTDtBQUNBO0FBQ0g7QUFDSixPQVJELE1BUU8sSUFBSSxLQUFLUyxRQUFMLENBQWNLLGVBQWQsSUFBaUMsQ0FBckMsRUFBdUM7QUFDMUMsWUFBRyxLQUFLTCxRQUFMLENBQWNHLElBQWQsR0FBcUIsS0FBS0gsUUFBTCxDQUFjQyxNQUFuQyxHQUE0QyxDQUEvQyxFQUFpRDtBQUM3Q1YsVUFBQUEsS0FBSyxDQUFDLGtIQUFELENBQUw7QUFDQTtBQUNILFNBSEQsTUFHTyxJQUFHLEtBQUtTLFFBQUwsQ0FBY0csSUFBZCxHQUFxQixLQUFLSCxRQUFMLENBQWNDLE1BQW5DLEdBQTRDLEVBQS9DLEVBQWtEO0FBQ3JEVixVQUFBQSxLQUFLLENBQUMsK0RBQUQsQ0FBTDtBQUNBO0FBQ0g7QUFDSixPQVJNLE1BUUEsSUFBSSxLQUFLUyxRQUFMLENBQWNLLGVBQWQsSUFBaUMsQ0FBckMsRUFBdUM7QUFDdEMsWUFBSSxDQUFDLEtBQUtrSixhQUFWLEVBQXdCO0FBQ3BCaEssVUFBQUEsS0FBSyxDQUFDLG9DQUFELENBQUw7QUFDQTtBQUNIOztBQUNEMUosUUFBQUEsTUFBTSxDQUFDc0gsU0FBUCxHQUFtQixLQUFLbU0saUJBQXhCO0FBQ1A7O0FBQ0RVLE1BQUFBLElBQUksQ0FBQ1osT0FBTCxHQUFlLElBQWY7QUFFQWhNLE1BQUFBLFdBQVcsQ0FBQyxLQUFLNEMsUUFBTCxDQUFjd0osY0FBZixFQUErQixVQUFTdkwsSUFBVCxFQUFjO0FBQ3BEK0wsUUFBQUEsSUFBSSxDQUFDdE0sT0FBTCxHQUFlLElBQWY7QUFDQXNNLFFBQUFBLElBQUksQ0FBQ1osT0FBTCxHQUFlLEtBQWY7QUFDSCxPQUhVLEVBR1IsVUFBVWUsV0FBVixFQUF1QjtBQUN0QkgsUUFBQUEsSUFBSSxDQUFDWixPQUFMLEdBQWUsS0FBZjtBQUNBWSxRQUFBQSxJQUFJLENBQUNFLE9BQUwsR0FBZSxJQUFmO0FBQ0gsT0FOVSxDQUFYO0FBT0g7QUFwRUksR0E1Qlc7QUFrR3BCRSxFQUFBQSxPQUFPLEVBQUUsbUJBQVU7QUFDZnhELElBQUFBLE9BQU8sQ0FBQ0MsR0FBUixDQUFZLFNBQVo7QUFDQTVKLElBQUFBLE1BQU07QUFDTlIsSUFBQUEsVUFBVTtBQUNiO0FBdEdtQixDQUFSLENBQWhCOzs7QUNBQSxTQUFTbUMsYUFBVCxDQUF1QlgsSUFBdkIsRUFBNEI7QUFDeEIsTUFBSW5KLElBQUksR0FBRyxFQUFYOztBQUNBLE9BQUksSUFBSTBULElBQVIsSUFBZ0J2SyxJQUFJLENBQUMsY0FBRCxDQUFwQixFQUFxQztBQUNqQyxRQUFJb00sTUFBTSxHQUFHcE0sSUFBSSxDQUFDLGNBQUQsQ0FBSixDQUFxQnVLLElBQXJCLENBQWI7QUFDQzFULElBQUFBLElBQUksQ0FBQ0YsSUFBTCxDQUFVO0FBQ1A0RSxNQUFBQSxJQUFJLEVBQUVnUCxJQURDO0FBRVA2QixNQUFBQSxNQUFNLEVBQUVBO0FBRkQsS0FBVjtBQUlKOztBQUNEQyxFQUFBQSxlQUFlLENBQUMsWUFBRCxFQUFleFYsSUFBZixFQUFxQixlQUFyQixDQUFmOztBQUVBLE9BQUksSUFBSXdULEtBQVIsSUFBaUJySyxJQUFJLENBQUMsWUFBRCxDQUFyQixFQUFvQztBQUNoQyxRQUFJbkosS0FBSSxHQUFHLEVBQVg7O0FBQ0EsU0FBSSxJQUFJMFQsSUFBUixJQUFnQnZLLElBQUksQ0FBQyxZQUFELENBQUosQ0FBbUJxSyxLQUFuQixDQUFoQixFQUEwQztBQUN0QyxVQUFJK0IsT0FBTSxHQUFHcE0sSUFBSSxDQUFDLFlBQUQsQ0FBSixDQUFtQnFLLEtBQW5CLEVBQTBCRSxJQUExQixDQUFiOztBQUNBMVQsTUFBQUEsS0FBSSxDQUFDRixJQUFMLENBQVU7QUFDTjRFLFFBQUFBLElBQUksRUFBRWdQLElBREE7QUFFTjZCLFFBQUFBLE1BQU0sRUFBRUE7QUFGRixPQUFWO0FBSUg7O0FBQ0QzTixJQUFBQSxDQUFDLENBQUMsWUFBRCxDQUFELENBQWdCNUUsTUFBaEIsQ0FBdUIscUVBQW1Fd1EsS0FBbkUsR0FBeUUsdUNBQWhHO0FBQ0FnQyxJQUFBQSxlQUFlLENBQUMsVUFBUWhDLEtBQVQsRUFBZ0J4VCxLQUFoQixFQUFzQixXQUFTd1QsS0FBL0IsQ0FBZjtBQUNIO0FBQ0o7O0FBRUQsU0FBU2dDLGVBQVQsQ0FBeUJuUixFQUF6QixFQUE2QnJFLElBQTdCLEVBQW1DaU0sS0FBbkMsRUFBeUM7QUFDckNMLEVBQUFBLFVBQVUsQ0FBQ0MsS0FBWCxDQUFpQnhILEVBQWpCLEVBQXFCO0FBQ2pCOEgsSUFBQUEsTUFBTSxFQUFFLENBQUM7QUFDTHhHLE1BQUFBLElBQUksRUFBRSxXQUREO0FBRUwzRixNQUFBQSxJQUFJLEVBQUVBLElBRkQ7QUFHTHlWLE1BQUFBLFFBQVEsRUFBRTtBQUNOQyxRQUFBQSxJQUFJLEVBQUUsQ0FEQTtBQUVOQyxRQUFBQSxFQUFFLEVBQUUsQ0FGRTtBQUdOQyxRQUFBQSxZQUFZLEVBQUU7QUFIUixPQUhMO0FBUUxsUixNQUFBQSxJQUFJLEVBQUU7QUFSRCxLQUFELENBRFM7QUFXakJ1SCxJQUFBQSxLQUFLLEVBQUU7QUFDSC9JLE1BQUFBLElBQUksRUFBRStJO0FBREg7QUFYVSxHQUFyQjtBQWVIIiwiZmlsZSI6ImFwcC5qcyIsInNvdXJjZXNDb250ZW50IjpbIkFycmF5LnByb3RvdHlwZS5jb250YWlucyA9IGZ1bmN0aW9uKHYpIHtcclxuICAgIGZvcih2YXIgaSA9IDA7IGkgPCB0aGlzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgaWYodGhpc1tpXSA9PT0gdikgcmV0dXJuIHRydWU7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbn07XHJcblxyXG5BcnJheS5wcm90b3R5cGUudW5pcXVlID0gZnVuY3Rpb24oKSB7XHJcbiAgICB2YXIgYXJyID0gW107XHJcbiAgICBmb3IodmFyIGkgPSAwOyBpIDwgdGhpcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgIGlmKCFhcnIuaW5jbHVkZXModGhpc1tpXSkpIHtcclxuICAgICAgICAgICAgYXJyLnB1c2godGhpc1tpXSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIGFycjsgXHJcbn1cclxuXHJcbmZ1bmN0aW9uIHJlbmRlckNsdXN0ZXJGb3JjZUxheW91dChkYXRhKXtcclxuXHR2YXIgZGF0YVZhbCA9IGRhdGFbXCJ0b3BpY193b3JkXCJdO1xyXG5cdHZhciBmaW5hbF9kaWN0ID0ge307XHJcblx0Zm9yICh2YXIga2V5IGluIGRhdGFWYWwpIHtcclxuXHQgICAgaWYgKGRhdGFWYWwuaGFzT3duUHJvcGVydHkoa2V5KSkge1xyXG5cclxuXHQgICAgXHR2YXIgY2hpbGRyZW5Xb3JkcyA9IGRhdGFWYWxba2V5XTtcclxuXHJcblx0ICAgIFx0Zm9yKHZhciBjaGlsZEtleSBpbiBjaGlsZHJlbldvcmRzKXtcclxuXHJcblx0ICAgIFx0XHRpZiAoY2hpbGRyZW5Xb3Jkcy5oYXNPd25Qcm9wZXJ0eShjaGlsZEtleSkgJiYgY2hpbGRyZW5Xb3Jkc1tjaGlsZEtleV0gPiAwLjAxKSB7XHJcblxyXG5cdCAgICBcdFx0XHRpZighKGNoaWxkS2V5IGluIGZpbmFsX2RpY3QpKXtcclxuXHQgICAgXHRcdFx0XHRmaW5hbF9kaWN0W2NoaWxkS2V5XSA9IFtdO1xyXG5cdCAgICBcdFx0XHR9XHJcbiAgICBcdFx0XHRcdGZpbmFsX2RpY3RbY2hpbGRLZXldLnB1c2goa2V5KTtcclxuXHQgICAgXHRcdFx0XHJcblx0ICAgIFx0XHR9XHJcblx0ICAgIFx0fSBcclxuXHQgICAgfVxyXG4gIFx0fVxyXG4gIFx0dmFyIGNsdXN0ZXJfZGF0YSA9IHtcclxuICBcdFx0XCJuYW1lXCI6XCJcIixcclxuICBcdFx0XCJjaGlsZHJlblwiOltdXHJcbiAgXHR9XHJcblxyXG4gIFx0dmFyIGNvdW50PTA7XHJcbiAgXHRmb3IodmFyIGtleSBpbiBmaW5hbF9kaWN0KXtcclxuICBcdFx0aWYgKGZpbmFsX2RpY3QuaGFzT3duUHJvcGVydHkoa2V5KSkge1xyXG4gIFx0XHRcdGNvdW50ID0gY291bnQgKyAxO1xyXG4gIFx0XHRcdHZhciBoYXNoID0ge307XHJcbiAgXHRcdFx0aGFzaFtcIm9yZGVyXCJdID0gY291bnQ7XHJcbiAgXHRcdFx0aGFzaFtcImFsaWFzXCJdID0gXCJXaGl0ZS9yZWQvamFjayBwaW5lXCI7XHJcbiAgXHRcdFx0aGFzaFtcImNvbG9yXCJdID0gXCIjQzdFQUZCXCI7XHJcbiAgXHRcdFx0aGFzaFtcIm5hbWVcIl0gPSBrZXk7XHJcblxyXG5cclxuICBcdFx0XHR2YXIgYXJyYXlfY2hpbGQgPSBmaW5hbF9kaWN0W2tleV0udW5pcXVlKCk7XHJcbiAgXHRcdFx0dmFyIGNoaWxkcyA9W107XHJcbiAgXHRcdFx0Zm9yKHZhciBpPTA7IGkgPCBhcnJheV9jaGlsZC5sZW5ndGg7aSsrKXtcclxuICBcdFx0XHRcdHZhciBjaGlsZF9oYXNoID0ge307XHJcbiAgXHRcdFx0XHRjaGlsZF9oYXNoW1wib3JkZXJcIl0gPSBpKzE7XHJcbiAgXHRcdFx0XHRjaGlsZF9oYXNoW1wiYWxpYXNcIl0gPSBpKzEgKyBcIlwiO1xyXG4gIFx0XHRcdFx0Y2hpbGRfaGFzaFtcImNvbG9yXCJdID0gXCIjQzdFQUZCXCI7XHJcbiAgXHRcdFx0XHRjaGlsZF9oYXNoW1wibmFtZVwiXT0gYXJyYXlfY2hpbGRbaV07XHJcbiAgXHRcdFx0XHRjaGlsZHMucHVzaChjaGlsZF9oYXNoKTtcclxuICBcdFx0XHR9XHJcbiAgXHRcdFx0aGFzaFtcImNoaWxkcmVuXCJdID0gY2hpbGRzO1xyXG4gIFx0XHRcdGNsdXN0ZXJfZGF0YS5jaGlsZHJlbi5wdXNoKGhhc2gpO1xyXG4gIFx0XHR9XHJcbiAgXHR9XHJcbiAgXHR2YXIgZDMgPSAgIHdpbmRvdy5kM1YzO1xyXG4gIFx0cmVuZGVyQ2x1c3RlcihjbHVzdGVyX2RhdGEsIGQzKTtcclxufVxyXG5cclxuZnVuY3Rpb24gcmVuZGVyQ2x1c3RlcihjbHVzdGVyX2RhdGEsIGQzKXtcclxuICB2YXIgcmFkaXVzID0gMjAwO1xyXG4gIHZhciBkZW5kb2dyYW1Db250YWluZXIgPSBcInNwZWNpZXNjb2xsYXBzaWJsZVwiO1xyXG4gIHZhciBkZW5kb2dyYW1EYXRhU291cmNlID0gXCJmb3Jlc3RTcGVjaWVzLmpzb25cIjtcclxuXHJcbiAgdmFyIHJvb3ROb2RlU2l6ZSA9IDY7XHJcbiAgdmFyIGxldmVsT25lTm9kZVNpemUgPSAzO1xyXG4gIHZhciBsZXZlbFR3b05vZGVTaXplID0gMztcclxuICB2YXIgbGV2ZWxUaHJlZU5vZGVTaXplID0gMjtcclxuXHJcblxyXG4gIHZhciBpID0gMDtcclxuICB2YXIgZHVyYXRpb24gPSAzMDA7IC8vQ2hhbmdpbmcgdmFsdWUgZG9lc24ndCBzZWVtIGFueSBjaGFuZ2VzIGluIHRoZSBkdXJhdGlvbiA/P1xyXG5cclxuICB2YXIgcm9vdEpzb25EYXRhO1xyXG5cclxuICB2YXIgY2x1c3RlciA9IGQzLmxheW91dC5jbHVzdGVyKClcclxuICAgICAgLnNpemUoWzM2MCxyYWRpdXMgLSAxMjBdKVxyXG4gICAgICAuc2VwYXJhdGlvbihmdW5jdGlvbihhLCBiKSB7XHJcbiAgICAgICAgcmV0dXJuIChhLnBhcmVudCA9PSBiLnBhcmVudCA/IDEgOiAyKSAvIGEuZGVwdGg7XHJcbiAgICAgIH0pO1xyXG5cclxuICB2YXIgZGlhZ29uYWwgPSBkMy5zdmcuZGlhZ29uYWwucmFkaWFsKClcclxuICAgICAgLnByb2plY3Rpb24oZnVuY3Rpb24oZCkgeyByZXR1cm4gW2QueSwgZC54IC8gMTgwICogTWF0aC5QSV07IH0pO1xyXG5cclxuICB2YXIgY29udGFpbmVyRGl2ID0gZDMuc2VsZWN0KGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGRlbmRvZ3JhbUNvbnRhaW5lcikpO1xyXG5cclxuICBjb250YWluZXJEaXYuYXBwZW5kKFwiYnV0dG9uXCIpXHJcbiAgICAgIC5hdHRyKFwiaWRcIixcImNvbGxhcHNlLWJ1dHRvblwiKVxyXG4gICAgICAudGV4dChcIkNvbGxhcHNlIVwiKVxyXG4gICAgICAub24oXCJjbGlja1wiLGNvbGxhcHNlTGV2ZWxzKTtcclxuXHJcbiAgdmFyIHN2Z1Jvb3QgPSBjb250YWluZXJEaXYuYXBwZW5kKFwic3ZnOnN2Z1wiKVxyXG4gICAgICAuYXR0cihcIndpZHRoXCIsIFwiMTAwJVwiKVxyXG4gICAgICAuYXR0cihcImhlaWdodFwiLCBcIjEwMCVcIilcclxuICAgICAgLmF0dHIoXCJ2aWV3Qm94XCIsIFwiLVwiICsgKHJhZGl1cykgKyBcIiAtXCIgKyAocmFkaXVzIC0gNTApICtcIiBcIisgcmFkaXVzKjIgK1wiIFwiKyByYWRpdXMqMilcclxuICAgICAgLmNhbGwoZDMuYmVoYXZpb3Iuem9vbSgpLnNjYWxlKDAuOSkuc2NhbGVFeHRlbnQoWzAuMSwgM10pLm9uKFwiem9vbVwiLCB6b29tKSkub24oXCJkYmxjbGljay56b29tXCIsIG51bGwpXHJcbiAgICAgIC5hcHBlbmQoXCJzdmc6Z1wiKTtcclxuXHJcbiAgLy8gQWRkIHRoZSBjbGlwcGluZyBwYXRoXHJcbiAgc3ZnUm9vdC5hcHBlbmQoXCJzdmc6Y2xpcFBhdGhcIikuYXR0cihcImlkXCIsIFwiY2xpcHBlci1wYXRoXCIpXHJcbiAgICAgIC5hcHBlbmQoXCJzdmc6cmVjdFwiKVxyXG4gICAgICAuYXR0cignaWQnLCAnY2xpcC1yZWN0LWFuaW0nKTtcclxuXHJcbiAgdmFyIGFuaW1Hcm91cCA9IHN2Z1Jvb3QuYXBwZW5kKFwic3ZnOmdcIilcclxuICAgICAgLmF0dHIoXCJjbGlwLXBhdGhcIiwgXCJ1cmwoI2NsaXBwZXItcGF0aClcIik7XHJcblxyXG4gIFx0cm9vdEpzb25EYXRhID0gY2x1c3Rlcl9kYXRhO1xyXG5cclxuICAgIC8vU3RhcnQgd2l0aCBhbGwgY2hpbGRyZW4gY29sbGFwc2VkXHJcbiAgICByb290SnNvbkRhdGEuY2hpbGRyZW4uZm9yRWFjaChjb2xsYXBzZSk7XHJcblxyXG4gICAgLy9Jbml0aWFsaXplIHRoZSBkZW5kcm9ncmFtXHJcbiAgXHRjcmVhdGVDb2xsYXBzaWJsZURlbmRyb0dyYW0ocm9vdEpzb25EYXRhKTtcclxuXHJcblxyXG5cclxuXHJcbiAgZnVuY3Rpb24gY3JlYXRlQ29sbGFwc2libGVEZW5kcm9HcmFtKHNvdXJjZSkge1xyXG5cclxuICAgIC8vIENvbXB1dGUgdGhlIG5ldyB0cmVlIGxheW91dC5cclxuICAgIHZhciBub2RlcyA9IGNsdXN0ZXIubm9kZXMocm9vdEpzb25EYXRhKTtcclxuICAgIHZhciBwYXRobGlua3MgPSBjbHVzdGVyLmxpbmtzKG5vZGVzKTtcclxuXHJcbiAgICAvLyBOb3JtYWxpemUgZm9yIG5vZGVzJyBmaXhlZC1kZXB0aC5cclxuICAgIG5vZGVzLmZvckVhY2goZnVuY3Rpb24oZCkge1xyXG4gICAgICBpZihkLmRlcHRoIDw9Mil7XHJcbiAgICAgICAgZC55ID0gZC5kZXB0aCo3MDtcclxuICAgICAgfWVsc2VcclxuICAgICAge1xyXG4gICAgICAgIGQueSA9IGQuZGVwdGgqMTAwO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBVcGRhdGUgdGhlIG5vZGVz4oCmXHJcbiAgICB2YXIgbm9kZSA9IHN2Z1Jvb3Quc2VsZWN0QWxsKFwiZy5ub2RlXCIpXHJcbiAgICAgICAgLmRhdGEobm9kZXMsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQuaWQgfHwgKGQuaWQgPSArK2kpOyB9KTtcclxuXHJcbiAgICAvLyBFbnRlciBhbnkgbmV3IG5vZGVzIGF0IHRoZSBwYXJlbnQncyBwcmV2aW91cyBwb3NpdGlvbi5cclxuICAgIHZhciBub2RlRW50ZXIgPSBub2RlLmVudGVyKCkuYXBwZW5kKFwiZ1wiKVxyXG4gICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJub2RlXCIpXHJcbiAgICAgICAgLm9uKFwiY2xpY2tcIiwgdG9nZ2xlQ2hpbGRyZW4pO1xyXG5cclxuICAgIG5vZGVFbnRlci5hcHBlbmQoXCJjaXJjbGVcIik7XHJcblxyXG4gICAgbm9kZUVudGVyLmFwcGVuZChcInRleHRcIilcclxuICAgIC5hdHRyKFwieFwiLCAxMClcclxuICAgIC5hdHRyKFwiZHlcIiwgXCIuMzVlbVwiKVxyXG4gICAgLmF0dHIoXCJ0ZXh0LWFuY2hvclwiLCBcInN0YXJ0XCIpXHJcbiAgICAudGV4dChmdW5jdGlvbihkKSB7XHJcbiAgICAgICAgICBpZihkLmRlcHRoID09PSAyKXtcclxuICAgICAgICAgICAgcmV0dXJuIGQuYWxpYXM7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgIHJldHVybiBkLm5hbWU7XHJcbiAgICB9KTtcclxuXHJcblxyXG4gICAgLy8gVHJhbnNpdGlvbiBub2RlcyB0byB0aGVpciBuZXcgcG9zaXRpb24uXHJcbiAgICB2YXIgbm9kZVVwZGF0ZSA9IG5vZGUudHJhbnNpdGlvbigpXHJcbiAgICAgICAgLmR1cmF0aW9uKGR1cmF0aW9uKVxyXG4gICAgICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIFwicm90YXRlKFwiICsgKGQueCAtIDkwKSArIFwiKXRyYW5zbGF0ZShcIiArIGQueSArIFwiKVwiOyB9KVxyXG5cclxuICAgIG5vZGVVcGRhdGUuc2VsZWN0KFwiY2lyY2xlXCIpXHJcbiAgICAgICAgLmF0dHIoXCJyXCIsIGZ1bmN0aW9uKGQpe1xyXG4gICAgICAgICAgICBpZiAoZC5kZXB0aCA9PSAwKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcm9vdE5vZGVTaXplO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICBlbHNlIGlmIChkLmRlcHRoID09PSAxKSB7XHJcbiAgICAgICAgICAgICAgICAgIHJldHVybiBsZXZlbE9uZU5vZGVTaXplO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICBlbHNlIGlmIChkLmRlcHRoID09PSAyKSB7XHJcbiAgICAgICAgICAgICAgICAgIHJldHVybiBsZXZlbFR3b05vZGVTaXplO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgcmV0dXJuIGxldmVsVGhyZWVOb2RlU2l6ZTtcclxuXHJcbiAgICAgICAgfSlcclxuICAgICAgICAuc3R5bGUoXCJmaWxsXCIsIGZ1bmN0aW9uKGQpIHtcclxuICAgICAgICAgICAgICAgaWYoZC5kZXB0aCA9PT0wKXtcclxuICAgICAgICAgICAgICAgIHJldHVybiBcIiM4MDgwODBcIjtcclxuICAgICAgICAgICAgICAgfWVsc2UgaWYoZC5kZXB0aCA9PT0gMSl7XHJcbiAgICAgICAgICAgICAgICBpZihkLm5hbWU9PVwiSGFyZHdvb2RzXCIpIHJldHVybiBcIiM4MTY4NTRcIjtcclxuICAgICAgICAgICAgICAgIHJldHVybiBcIiNDM0I5QTBcIjtcclxuICAgICAgICAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZC5jb2xvcjtcclxuICAgICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLnN0eWxlKFwic3Ryb2tlXCIsZnVuY3Rpb24oZCl7XHJcbiAgICAgICAgICAgICAgaWYoZC5kZXB0aD4xKXtcclxuICAgICAgICAgICAgICAgICAgcmV0dXJuIFwid2hpdGVcIjtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgZWxzZXtcclxuICAgICAgICAgICAgICAgICAgcmV0dXJuIFwibGlnaHRncmF5XCI7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgIG5vZGVVcGRhdGUuc2VsZWN0KFwidGV4dFwiKVxyXG5cclxuICAgICAgICAuYXR0cignaWQnLCBmdW5jdGlvbihkKXtcclxuICAgICAgICAgIHZhciBvcmRlciA9IDA7XHJcbiAgICAgICAgICBpZihkLm9yZGVyKW9yZGVyID0gZC5vcmRlcjtcclxuICAgICAgICAgIHJldHVybiAnVC0nICsgZC5kZXB0aCArIFwiLVwiICsgb3JkZXI7XHJcbiAgICAgICAgfSlcclxuICAgICAgICAuYXR0cihcInRleHQtYW5jaG9yXCIsIGZ1bmN0aW9uIChkKSB7XHJcbiAgICAgICAgICAgIGlmIChkLmRlcHRoID09PSAxKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZC54IDwgMTgwID8gXCJlbmRcIiA6IFwic3RhcnRcIjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gZC54IDwgMTgwID8gXCJzdGFydFwiIDogXCJlbmRcIjtcclxuICAgICAgICB9KVxyXG4gICAgICAgIC5hdHRyKFwiZHlcIiwgZnVuY3Rpb24oZCl7XHJcbiAgICAgICAgICAgIGlmIChkLmRlcHRoID09PSAxKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZC54IDwgMTgwID8gXCIxLjRlbVwiIDogXCItMC4yZW1cIjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gXCIuMzFlbVwiO1xyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLmF0dHIoXCJkeFwiLCBmdW5jdGlvbiAoZCkge1xyXG4gICAgICAgICAgICBpZiAoZC5kZXB0aCA9PT0gMSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIDA7IC8vcmV0dXJuIGQueCA+IDE4MCA/IDIgOiAtMjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gZC54IDwgMTgwID8gMSA6IC0yMDtcclxuICAgICAgICB9KVxyXG4gICAgICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIGZ1bmN0aW9uIChkKSB7XHJcbiAgICAgICAgICAgIGlmIChkLmRlcHRoIDwgMikge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIFwicm90YXRlKFwiICsgKDkwIC0gZC54KSArIFwiKVwiO1xyXG4gICAgICAgICAgICB9ZWxzZSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZC54IDwgMTgwID8gbnVsbCA6IFwicm90YXRlKDE4MClcIjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgIC8vIFRPRE86IGFwcHJvcHJpYXRlIHRyYW5zZm9ybVxyXG4gICAgdmFyIG5vZGVFeGl0ID0gbm9kZS5leGl0KCkudHJhbnNpdGlvbigpXHJcbiAgICAgICAgLmR1cmF0aW9uKGR1cmF0aW9uKVxyXG4gICAgICAgIC5yZW1vdmUoKTtcclxuXHJcbiAgICAvLyBVcGRhdGUgdGhlIGxpbmtz4oCmXHJcbiAgICB2YXIgbGluayA9IHN2Z1Jvb3Quc2VsZWN0QWxsKFwicGF0aC5saW5rXCIpXHJcbiAgICAgICAgLmRhdGEocGF0aGxpbmtzLCBmdW5jdGlvbihkKSB7IHJldHVybiBkLnRhcmdldC5pZDsgfSk7XHJcblxyXG4gICAgLy8gRW50ZXIgYW55IG5ldyBsaW5rcyBhdCB0aGUgcGFyZW50J3MgcHJldmlvdXMgcG9zaXRpb24uXHJcbiAgICBsaW5rLmVudGVyKCkuaW5zZXJ0KFwicGF0aFwiLCBcImdcIilcclxuICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwibGlua1wiKVxyXG4gICAgICAgIC5hdHRyKFwiZFwiLCBmdW5jdGlvbihkKSB7XHJcbiAgICAgICAgICB2YXIgbyA9IHt4OiBzb3VyY2UueDAsIHk6IHNvdXJjZS55MH07XHJcbiAgICAgICAgICByZXR1cm4gZGlhZ29uYWwoe3NvdXJjZTogbywgdGFyZ2V0OiBvfSk7XHJcbiAgICAgICAgfSlcclxuICAgICAgICAuc3R5bGUoXCJmaWxsXCIsZnVuY3Rpb24oZCl7XHJcbiAgICAgICAgICByZXR1cm4gZC5jb2xvcjtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAvLyBUcmFuc2l0aW9uIGxpbmtzIHRvIHRoZWlyIG5ldyBwb3NpdGlvbi5cclxuICAgIGxpbmsudHJhbnNpdGlvbigpXHJcbiAgICAgICAgLmR1cmF0aW9uKGR1cmF0aW9uKVxyXG4gICAgICAgIC5hdHRyKFwiZFwiLCBkaWFnb25hbCk7XHJcblxyXG4gICAgLy8gVHJhbnNpdGlvbiBleGl0aW5nIG5vZGVzIHRvIHRoZSBwYXJlbnQncyBuZXcgcG9zaXRpb24uXHJcbiAgICBsaW5rLmV4aXQoKS50cmFuc2l0aW9uKClcclxuICAgICAgICAuZHVyYXRpb24oZHVyYXRpb24pXHJcbiAgICAgICAgLmF0dHIoXCJkXCIsIGZ1bmN0aW9uKGQpIHtcclxuICAgICAgICAgIHZhciBvID0ge3g6IHNvdXJjZS54LCB5OiBzb3VyY2UueX07XHJcbiAgICAgICAgICByZXR1cm4gZGlhZ29uYWwoe3NvdXJjZTogbywgdGFyZ2V0OiBvfSk7XHJcbiAgICAgICAgfSlcclxuICAgICAgICAucmVtb3ZlKCk7XHJcbiAgfVxyXG5cclxuICAvLyBUb2dnbGUgY2hpbGRyZW4gb24gY2xpY2suXHJcbiAgZnVuY3Rpb24gdG9nZ2xlQ2hpbGRyZW4oZCxjbGlja1R5cGUpIHtcclxuICAgIGlmIChkLmNoaWxkcmVuKSB7XHJcbiAgICAgIGQuX2NoaWxkcmVuID0gZC5jaGlsZHJlbjtcclxuICAgICAgZC5jaGlsZHJlbiA9IG51bGw7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBkLmNoaWxkcmVuID0gZC5fY2hpbGRyZW47XHJcbiAgICAgIGQuX2NoaWxkcmVuID0gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgdHlwZSA9IHR5cGVvZiBjbGlja1R5cGUgPT0gdW5kZWZpbmVkID8gXCJub2RlXCIgOiBjbGlja1R5cGU7XHJcblxyXG4gICAgLy9BY3Rpdml0aWVzIG9uIG5vZGUgY2xpY2tcclxuICAgIGNyZWF0ZUNvbGxhcHNpYmxlRGVuZHJvR3JhbShkKTtcclxuICAgIGhpZ2hsaWdodE5vZGVTZWxlY3Rpb25zKGQpO1xyXG5cclxuICAgIGhpZ2hsaWdodFJvb3RUb05vZGVQYXRoKGQsdHlwZSk7XHJcblxyXG4gIH1cclxuXHJcbiAgLy8gQ29sbGFwc2Ugbm9kZXNcclxuICBmdW5jdGlvbiBjb2xsYXBzZShkKSB7XHJcbiAgICBpZiAoZC5jaGlsZHJlbikge1xyXG4gICAgICAgIGQuX2NoaWxkcmVuID0gZC5jaGlsZHJlbjtcclxuICAgICAgICBkLl9jaGlsZHJlbi5mb3JFYWNoKGNvbGxhcHNlKTtcclxuICAgICAgICBkLmNoaWxkcmVuID0gbnVsbDtcclxuICAgICAgfVxyXG4gIH1cclxuXHJcblxyXG4gIC8vIGhpZ2hsaWdodHMgc3Vibm9kZXMgb2YgYSBub2RlXHJcbiAgZnVuY3Rpb24gaGlnaGxpZ2h0Tm9kZVNlbGVjdGlvbnMoZCkge1xyXG4gICAgICB2YXIgaGlnaGxpZ2h0TGlua0NvbG9yID0gXCJkYXJrc2xhdGVncmF5XCI7Ly9cIiNmMDNiMjBcIjtcclxuICAgICAgdmFyIGRlZmF1bHRMaW5rQ29sb3IgPSBcImxpZ2h0Z3JheVwiO1xyXG5cclxuICAgICAgdmFyIGRlcHRoID0gIGQuZGVwdGg7XHJcbiAgICAgIHZhciBub2RlQ29sb3IgPSBkLmNvbG9yO1xyXG4gICAgICBpZiAoZGVwdGggPT09IDEpIHtcclxuICAgICAgICAgIG5vZGVDb2xvciA9IGhpZ2hsaWdodExpbmtDb2xvcjtcclxuICAgICAgfVxyXG5cclxuICAgICAgdmFyIHBhdGhMaW5rcyA9IHN2Z1Jvb3Quc2VsZWN0QWxsKFwicGF0aC5saW5rXCIpO1xyXG5cclxuICAgICAgcGF0aExpbmtzLnN0eWxlKFwic3Ryb2tlXCIsZnVuY3Rpb24oZGQpIHtcclxuICAgICAgICAgIGlmIChkZC5zb3VyY2UuZGVwdGggPT09IDApIHtcclxuICAgICAgICAgICAgICBpZiAoZC5uYW1lID09PSAnJykge1xyXG4gICAgICAgICAgICAgICAgICByZXR1cm4gaGlnaGxpZ2h0TGlua0NvbG9yO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICByZXR1cm4gZGVmYXVsdExpbmtDb2xvcjtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICBpZiAoZGQuc291cmNlLm5hbWUgPT09IGQubmFtZSkge1xyXG4gICAgICAgICAgICAgIHJldHVybiBub2RlQ29sb3I7XHJcbiAgICAgICAgICB9ZWxzZSB7XHJcbiAgICAgICAgICAgICAgcmV0dXJuIGRlZmF1bHRMaW5rQ29sb3I7XHJcbiAgICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgLy9XYWxraW5nIHBhcmVudHMnIGNoYWluIGZvciByb290IHRvIG5vZGUgdHJhY2tpbmdcclxuICBmdW5jdGlvbiBoaWdobGlnaHRSb290VG9Ob2RlUGF0aChkLGNsaWNrVHlwZSl7XHJcbiAgICB2YXIgYW5jZXN0b3JzID0gW107XHJcbiAgICB2YXIgcGFyZW50ID0gZDtcclxuICAgIHdoaWxlICghXy5pc1VuZGVmaW5lZChwYXJlbnQpKSB7XHJcbiAgICAgICAgYW5jZXN0b3JzLnB1c2gocGFyZW50KTtcclxuICAgICAgICBwYXJlbnQgPSBwYXJlbnQucGFyZW50O1xyXG4gICAgfVxyXG5cclxuICAgIC8vIEdldCB0aGUgbWF0Y2hlZCBsaW5rc1xyXG4gICAgdmFyIG1hdGNoZWRMaW5rcyA9IFtdO1xyXG5cclxuICAgIHN2Z1Jvb3Quc2VsZWN0QWxsKCdwYXRoLmxpbmsnKVxyXG4gICAgICAgIC5maWx0ZXIoZnVuY3Rpb24oZCwgaSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHJldHVybiBfLmFueShhbmNlc3RvcnMsIGZ1bmN0aW9uKHApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBwID09PSBkLnRhcmdldDtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLmVhY2goZnVuY3Rpb24oZClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIG1hdGNoZWRMaW5rcy5wdXNoKGQpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgIGFuaW1hdGVDaGFpbnMobWF0Y2hlZExpbmtzLGNsaWNrVHlwZSk7XHJcblxyXG4gICAgZnVuY3Rpb24gYW5pbWF0ZUNoYWlucyhsaW5rcyxjbGlja1R5cGUpe1xyXG4gICAgICBhbmltR3JvdXAuc2VsZWN0QWxsKFwicGF0aC5zZWxlY3RlZFwiKVxyXG4gICAgICAgICAgLmRhdGEoW10pXHJcbiAgICAgICAgICAuZXhpdCgpLnJlbW92ZSgpO1xyXG5cclxuICAgICAgYW5pbUdyb3VwLnNlbGVjdEFsbChcInBhdGguc2VsZWN0ZWRcIilcclxuICAgICAgICAgIC5kYXRhKGxpbmtzKVxyXG4gICAgICAgICAgLmVudGVyKCkuYXBwZW5kKFwic3ZnOnBhdGhcIilcclxuICAgICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJzZWxlY3RlZFwiKVxyXG4gICAgICAgICAgLmF0dHIoXCJkXCIsIGRpYWdvbmFsKTtcclxuXHJcblxyXG4gICAgICAvL1Jlc2V0IHBhdGggaGlnaGxpZ2h0IGlmIGNvbGxhcHNlIGJ1dHRvbiBjbGlja2VkXHJcbiAgICAgIGlmKGNsaWNrVHlwZSA9PSAnYnV0dG9uJyl7XHJcbiAgICAgICAgYW5pbUdyb3VwLnNlbGVjdEFsbChcInBhdGguc2VsZWN0ZWRcIikuY2xhc3NlZCgncmVzZXQtc2VsZWN0ZWQnLHRydWUpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICB2YXIgb3ZlcmxheUJveCA9IHN2Z1Jvb3Qubm9kZSgpLmdldEJCb3goKTtcclxuXHJcbiAgICAgIHN2Z1Jvb3Quc2VsZWN0KFwiI2NsaXAtcmVjdC1hbmltXCIpXHJcbiAgICAgICAgICAuYXR0cihcInhcIiwgLXJhZGl1cylcclxuICAgICAgICAgIC5hdHRyKFwieVwiLCAtcmFkaXVzKVxyXG4gICAgICAgICAgLmF0dHIoXCJ3aWR0aFwiLDApXHJcbiAgICAgICAgICAuYXR0cihcImhlaWdodFwiLHJhZGl1cyoyKVxyXG4gICAgICAgICAgLnRyYW5zaXRpb24oKS5kdXJhdGlvbihkdXJhdGlvbilcclxuICAgICAgICAgIC5hdHRyKFwid2lkdGhcIiwgcmFkaXVzKjIpO1xyXG4gICAgfVxyXG5cclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIHpvb20oKSB7XHJcbiAgICAgc3ZnUm9vdC5hdHRyKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKFwiICsgZDMuZXZlbnQudHJhbnNsYXRlICsgXCIpc2NhbGUoXCIgKyBkMy5ldmVudC5zY2FsZSArIFwiKVwiKTtcclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIGNvbGxhcHNlTGV2ZWxzKCl7XHJcblxyXG4gICAgaWYoY2hlY2tGb3JUaGlyZExldmVsT3BlbkNoaWxkcmVuKCkpe1xyXG4gICAgICB0b2dnbGVBbGxTZWNvbmRMZXZlbENoaWxkcmVuKCk7XHJcbiAgICB9ZWxzZXtcclxuICAgICB0b2dnbGVTZWNvbmRMZXZlbENoaWxkcmVuKCk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gT3BlbiBmaXJzdCBsZXZlbCBvbmx5IGJ5IGNvbGxhcHNpbmcgc2Vjb25kIGxldmVsXHJcbiAgICBmdW5jdGlvbiB0b2dnbGVTZWNvbmRMZXZlbENoaWxkcmVuKCl7XHJcbiAgICAgIGZvcih2YXIgcm9vdEluZGV4ID0gMCwgcm9vdExlbmd0aCA9IHJvb3RKc29uRGF0YS5jaGlsZHJlbi5sZW5ndGg7IHJvb3RJbmRleDxyb290TGVuZ3RoOyByb290SW5kZXgrKyl7XHJcbiAgICAgICAgICBpZihpc05vZGVPcGVuKHJvb3RKc29uRGF0YS5jaGlsZHJlbltyb290SW5kZXhdKSl7XHJcbiAgICAgICAgICAgICAgIHRvZ2dsZUNoaWxkcmVuKHJvb3RKc29uRGF0YS5jaGlsZHJlbltyb290SW5kZXhdLCdidXR0b24nKTtcclxuICAgICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIE9wZW4gZmlyc3QgbGV2ZWwgb25seSBieSBjb2xsYXBzaW5nIHNlY29uZCBsZXZlbFxyXG4gICAgZnVuY3Rpb24gdG9nZ2xlQWxsU2Vjb25kTGV2ZWxDaGlsZHJlbigpe1xyXG4gICAgICBmb3IodmFyIHJvb3RJbmRleCA9IDAsIHJvb3RMZW5ndGggPSByb290SnNvbkRhdGEuY2hpbGRyZW4ubGVuZ3RoOyByb290SW5kZXg8cm9vdExlbmd0aDsgcm9vdEluZGV4Kyspe1xyXG4gICAgICAgIGlmKGlzTm9kZU9wZW4ocm9vdEpzb25EYXRhLmNoaWxkcmVuW3Jvb3RJbmRleF0pKXtcclxuXHJcbiAgICAgICAgICBmb3IodmFyIGNoaWxkSW5kZXggPSAwLCBjaGlsZExlbmd0aCA9IHJvb3RKc29uRGF0YS5jaGlsZHJlbltyb290SW5kZXhdLmNoaWxkcmVuLmxlbmd0aDsgY2hpbGRJbmRleDxjaGlsZExlbmd0aDsgY2hpbGRJbmRleCsrKXtcclxuICAgICAgICAgICAgdmFyIHNlY29uZExldmVsQ2hpbGQgPSByb290SnNvbkRhdGEuY2hpbGRyZW5bcm9vdEluZGV4XS5jaGlsZHJlbltjaGlsZEluZGV4XTtcclxuICAgICAgICAgICAgaWYoaXNOb2RlT3BlbihzZWNvbmRMZXZlbENoaWxkKSl7XHJcbiAgICAgICAgICAgICAgdG9nZ2xlQ2hpbGRyZW4ocm9vdEpzb25EYXRhLmNoaWxkcmVuW3Jvb3RJbmRleF0uY2hpbGRyZW5bY2hpbGRJbmRleF0sJ2J1dHRvbicpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBDaGVjayBpZiBhbnkgbm9kZXMgb3BlbnMgYXQgc2Vjb25kIGxldmVsXHJcbiAgICBmdW5jdGlvbiBjaGVja0ZvclRoaXJkTGV2ZWxPcGVuQ2hpbGRyZW4oKXtcclxuICAgICAgZm9yKHZhciByb290SW5kZXggPSAwLCByb290TGVuZ3RoID0gcm9vdEpzb25EYXRhLmNoaWxkcmVuLmxlbmd0aDsgcm9vdEluZGV4PHJvb3RMZW5ndGg7IHJvb3RJbmRleCsrKXtcclxuICAgICAgICBpZihpc05vZGVPcGVuKHJvb3RKc29uRGF0YS5jaGlsZHJlbltyb290SW5kZXhdKSl7XHJcblxyXG4gICAgICAgICAgZm9yKHZhciBjaGlsZEluZGV4ID0gMCwgY2hpbGRMZW5ndGggPSByb290SnNvbkRhdGEuY2hpbGRyZW5bcm9vdEluZGV4XS5jaGlsZHJlbi5sZW5ndGg7IGNoaWxkSW5kZXg8Y2hpbGRMZW5ndGg7IGNoaWxkSW5kZXgrKyl7XHJcblxyXG4gICAgICAgICAgICB2YXIgc2Vjb25kTGV2ZWxDaGlsZCA9IHJvb3RKc29uRGF0YS5jaGlsZHJlbltyb290SW5kZXhdLmNoaWxkcmVuW2NoaWxkSW5kZXhdO1xyXG4gICAgICAgICAgICBpZihpc05vZGVPcGVuKHNlY29uZExldmVsQ2hpbGQpKXtcclxuICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGlzTm9kZU9wZW4oZCl7XHJcbiAgICAgIGlmKGQuY2hpbGRyZW4pe3JldHVybiB0cnVlO31cclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcblxyXG5cclxuXHJcbn1cclxuXHJcbiAgIiwiZnVuY3Rpb24gbG9hZEpxdWVyeSgpe1xyXG4gICAgJChkb2N1bWVudCkucmVhZHkoZnVuY3Rpb24oKXtcclxuICAgICAgICAkKFwiI3RvZ2dsZS1zaWRlYmFyXCIpLmNsaWNrKGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICAgICQoJy51aS5zaWRlYmFyJylcclxuICAgICAgICAgICAgICAgIC5zaWRlYmFyKCd0b2dnbGUnKVxyXG4gICAgICAgICAgICA7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgXHJcbiAgICB9KTtcclxufVxyXG4iLCJyZXF1aXJlLmNvbmZpZyh7XHJcbiAgICBwYXRoczoge1xyXG4gICAgICAgIFwiZDNcIjogXCJodHRwczovL2QzanMub3JnL2QzLnYzLm1pblwiXHJcbiAgICB9XHJcbn0pO1xyXG5cclxuZnVuY3Rpb24gbG9hZEQzKCl7XHJcblxyXG4gICAgd2luZG93LmQzT2xkID0gZDM7XHJcbiAgICByZXF1aXJlKFsnZDMnXSwgZnVuY3Rpb24oZDNWMykge1xyXG4gICAgICAgIHdpbmRvdy5kM1YzID0gZDNWMztcclxuICAgICAgICB3aW5kb3cuZDMgPSBkM09sZDtcclxuICAgICAgICAvLyB3aW5kb3cuZG9jdW1lbnRzID0gW1xyXG4gICAgICAgIC8vICAgICAgICAgLy8gICBbXCJpXCIsIFwiYW1cIiwgXCJiYXRtYW5cIiwgXCJvZlwiLCBcIndpbnRlcmZhbGxcIl0sXHJcbiAgICAgICAgLy8gICAgICAgICAvLyAgIFtcInRoZXJlXCIsIFwic2hvdWxkXCIsIFwiYWx3YXlzXCIsIFwiYmVcIiwgXCJhXCIsIFwic3RhcmtcIiwgXCJpblwiLCBcIndpbnRlcmZlbGxcIl0sXHJcbiAgICAgICAgLy8gICAgICAgICAvLyAgIFtcInByb3BoZWN5XCIsIFwic2F5c1wiLCBcInByaW5jZVwiLCBcIndpbGxcIiwgXCJiZVwiICwgXCJyZWJvcm5cIl1cclxuICAgICAgICAvLyAgICAgICAgIC8vIF07XHJcbiAgICAgICAgLy8gICAgIHdpbmRvdy5kb2N1bWVudHMgPSBbWydwcm9qZWN0JywgJ2NsYXNzaWZpY2F0aW9uJywgJ2NvbXBhcmUnLCAnbmV1cmFsJywgJ25ldHMnLCAnU1ZNJywgJ2R1ZScsICdkdWUnXSwgWyd0d28nLCAnbmV3JywgJ3Byb2dyZXNzJywgJ2NoZWNrcycsICdmaW5hbCcsICdwcm9qZWN0JywgICdhc3NpZ25lZCcsICdmb2xsb3dzJ10sIFsncmVwb3J0JywgJ2dyYWRlZCcsICAnY29udHJpYnV0ZScsICdwb2ludHMnLCAgJ3RvdGFsJywgJ3NlbWVzdGVyJywgJ2dyYWRlJ10sIFsncHJvZ3Jlc3MnLCAndXBkYXRlJywgJ2V2YWx1YXRlZCcsICdUQScsICdwZWVycyddLCBbJ2NsYXNzJywgJ21lZXRpbmcnLCAndG9tb3Jyb3cnLCd0ZWFtcycsICd3b3JrJywgJ3Byb2dyZXNzJywgJ3JlcG9ydCcsICdmaW5hbCcsICdwcm9qZWN0J10sIFsgJ3F1aXonLCAgJ3NlY3Rpb25zJywgJ3JlZ3VsYXJpemF0aW9uJywgJ1R1ZXNkYXknXSwgWyAncXVpeicsICdUaHVyc2RheScsICdsb2dpc3RpY3MnLCAnd29yaycsICdvbmxpbmUnLCAnc3R1ZGVudCcsICdwb3N0cG9uZScsICAncXVpeicsICdUdWVzZGF5J10sIFsncXVpeicsICdjb3ZlcicsICdUaHVyc2RheSddLCBbJ3F1aXonLCAnY2hhcCcsICdjaGFwJywgJ2xpbmVhcicsICdyZWdyZXNzaW9uJ11dO1xyXG4gICAgICAgIHdpbmRvdy5kb2N1bWVudHMgPSBbXHJcbiAgICAgICAgICAgIFsnc2VyaW91cycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAndGFsaycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAnZnJpZW5kcycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAnZmxha3knLFxyXG4gICAgICAgICAgICAgICAgICAgICAgJ2xhdGVseScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAndW5kZXJzdG9vZCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAnZ29vZCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAnZXZlbmluZycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAnaGFuZ2luZyddLFxyXG4gICAgICAgICAgICBbJ2dvdCcsICdnaWZ0JywgJ2VsZGVyJywgJ2Jyb3RoZXInLCAncmVhbGx5JywgJ3N1cnByaXNpbmcnXSxcclxuICAgICAgICAgICAgICAgICAgICAgWydjb21wbGV0ZWQnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgJzUnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgJ21pbGVzJyxcclxuICAgICAgICAgICAgICAgICAgICAgICdydW4nLFxyXG4gICAgICAgICAgICAgICAgICAgICAgJ3dpdGhvdXQnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgJ2JyZWFrJyxcclxuICAgICAgICAgICAgICAgICAgICAgICdtYWtlcycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAnZmVlbCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAnc3Ryb25nJ10sXHJcblxyXG4gICAgICAgICAgICBbJ3NvbicsICdwZXJmb3JtZWQnLCAnd2VsbCcsICd0ZXN0JyxcclxuICAgICAgICAgICAgICAgICdwcmVwYXJhdGlvbiddXHJcbiAgICAgICAgICAgIF07XHJcblxyXG4gICAgICAgICAgICAgICAgZ2V0QW5hbHlzaXMoXCJMREFcIik7XHJcbiAgICAgICAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdldERvY3ModGV4dHMpIHtcclxuICByZXR1cm4gd2luZG93LmRvY3VtZW50cyA9IHRleHRzLm1hcCh4ID0+IHguc3BsaXQoKSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdldEFuYWx5c2lzKG1ldGhvZCwgc3VjY2VzcywgZmFpbCkge1xyXG4gIGxldCBkb2NzID0gd2luZG93LmRvY3VtZW50cztcclxuICBsZXQgZm5jID0geCA9PiB4O1xyXG4gIGlmIChtZXRob2QgPT09IFwiTERBXCIpIHtcclxuICAgIGZuYyA9IGdldExEQUNsdXN0ZXJzO1xyXG4gIH0gZWxzZSB7XHJcbiAgICBmbmMgPSBnZXRXb3JkMlZlY0NsdXN0ZXJzO1xyXG4gIH1cclxuICB3aW5kb3cubG9hZERGdW5jID0gIGZuYztcclxuICBmbmMoZG9jcywgcmVzcCA9PiB7XHJcbiAgICAgIHdpbmRvdy5nbG9iYWxfZGF0YSA9IHJlc3A7XHJcbiAgICBpbml0UGFnZTEocmVzcCk7XHJcbiAgICBpbml0UGFnZTIocmVzcCk7XHJcbiAgICBpbml0UGFnZTMocmVzcCk7XHJcbiAgICBpbml0UGFnZTQoKTtcclxuICAgIGlmKHN1Y2Nlc3Mpe1xyXG4gICAgICAgIHN1Y2Nlc3MocmVzcCk7XHJcbiAgICB9XHJcbiAgfSwgZmFpbCk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGxvYWRWaXN1YWxpemF0aW9ucygpIHtcclxufVxyXG5cclxuZnVuY3Rpb24gaW5pdFBhZ2UxKHJlc3ApIHtcclxuICByZW5kZXJDbHVzdGVyQW5hbHlzaXMocmVzcCk7XHJcbn1cclxuXHJcblxyXG5cclxuZnVuY3Rpb24gaW5pdFBhZ2UyKHJlc3ApIHtcclxuICByZW5kZXJDbHVzdGVyRm9yY2VMYXlvdXQocmVzcCk7XHJcblxyXG59XHJcblxyXG5mdW5jdGlvbiBpbml0UGFnZTMocmVzcCl7XHJcbiAgICAkKFwiI3BhcmFsbGVsLWNvb3JkaW5hdGUtdmlzXCIpLmh0bWwoXCJcIik7XHJcbiAgICAkKFwiI3BjLWNvbnRhaW5lclwiKS5odG1sKFwiXCIpO1xyXG4gICAgbG9hZFBhcmFsbGVsQ29vcmRpbmF0ZShyZXNwKTtcclxuICAgIGxvYWRQYXJhbGxlbENvb3JkaW5hdGVzSEMocmVzcCk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGluaXRQYWdlNCgpe1xyXG4gICAgJChcIiNvdmVyYWxsLXdjXCIpLmh0bWwoKTtcclxuICAgIGxvYWRXb3JkQ2xvdWQod2luZG93Lmdsb2JhbF9kYXRhKTtcclxufSIsIi8vdmVjdG9ycyBmb3JtYXQ6IE1hcFtzdHJpbmcodG9waWNfaWQpOiBMaXN0W2Zsb2F0XV1cclxuZnVuY3Rpb24gZ2V0MkRWZWN0b3JzKHZlY3RvcnMsIHN1Y2Nlc3NDYWxsYmFjayl7XHJcbiAgICB2YXIgcmVxdWVzdCA9ICQuYWpheCh7XHJcbiAgICAgICAgdXJsOiBcIi9nZXQyRFZlY3RvcnNcIixcclxuICAgICAgICBtZXRob2Q6IFwiUE9TVFwiLFxyXG4gICAgICAgIGRhdGE6IHZlY3RvcnNcclxuICAgICAgfSk7XHJcbiAgICAgICBcclxuICAgICAgcmVxdWVzdC5kb25lKGZ1bmN0aW9uKCByZXNwb25zZSApIHtcclxuICAgICAgICBzdWNjZXNzQ2FsbGJhY2socmVzcG9uc2UpO1xyXG4gICAgICB9KTtcclxuICAgICAgIFxyXG4gICAgICByZXF1ZXN0LmZhaWwoZnVuY3Rpb24oIGpxWEhSLCB0ZXh0U3RhdHVzICkge1xyXG4gICAgICAgIGFsZXJ0KCBcIlJlcXVlc3QgZmFpbGVkOiBcIiArIHRleHRTdGF0dXMgKTtcclxuICAgICAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdldFRva2VuaXplZERvY3MoZG9jcywgc3VjY2Vzc0NhbGxiYWNrLCBmYWlsdXJlQ2FsbGJhY2spe1xyXG4gICAgdmFyIHJlcXVlc3QgPSAkLmFqYXgoe1xyXG4gICAgICAgIHVybDogXCIvZ2V0RG9jc0Zyb21UZXh0c1wiLFxyXG4gICAgICAgIG1ldGhvZDogXCJQT1NUXCIsXHJcbiAgICAgICAgZGF0YTogSlNPTi5zdHJpbmdpZnkoe2RvY3M6IGRvY3N9KSxcclxuICAgICAgICBjb250ZW50VHlwZTogXCJhcHBsaWNhdGlvbi9qc29uOyBjaGFyc2V0PXV0Zi04XCIsXHJcbiAgICAgICAgZGF0YVR5cGUgICA6IFwianNvblwiXHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgcmVxdWVzdC5kb25lKGZ1bmN0aW9uKCByZXNwb25zZSApIHtcclxuICAgICAgICBzdWNjZXNzQ2FsbGJhY2socmVzcG9uc2UuZG9jcyk7XHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgcmVxdWVzdC5mYWlsKGZ1bmN0aW9uKCBqcVhIUiwgdGV4dFN0YXR1cyApIHtcclxuICAgICAgICBpZihmYWlsdXJlQ2FsbGJhY2spXHJcbiAgICAgICAgICAgIGZhaWx1cmVDYWxsYmFjayh0ZXh0U3RhdHVzKTtcclxuICAgICAgICAgIGVsc2V7XHJcbiAgICAgICAgICAgICAgYWxlcnQoIFwiUmVxdWVzdCBmYWlsZWQ6IFwiICsgdGV4dFN0YXR1cyApO1xyXG4gICAgICAgICAgfVxyXG4gICAgICB9KTtcclxufVxyXG5cclxuLy8gZG9jcyBmb3JtYXQ6IExpc3RbTGlzdFtzdHJpbmcod29yZCldXVxyXG5mdW5jdGlvbiBnZXRXb3JkMlZlY0NsdXN0ZXJzKGRvY3MsIHN1Y2Nlc3NDYWxsYmFjaywgZmFpbHVyZUNhbGxiYWNrKXtcclxuICAgIHZhciByZXF1ZXN0ID0gJC5hamF4KHtcclxuICAgICAgICB1cmw6IFwiL2FwaS9nZXRDbHVzdGVyc1dvcmQyVmVjXCIsXHJcbiAgICAgICAgbWV0aG9kOiBcIlBPU1RcIixcclxuICAgICAgICBkYXRhOiBKU09OLnN0cmluZ2lmeSh7ZG9jczogZG9jcywgc3RhcnQ6IHdpbmRvdy52dWVBcHAuc2V0dGluZ3Muc3RhcnQyLCBlbmQ6IHdpbmRvdy52dWVBcHAuc2V0dGluZ3MuZW5kMiwgc2VsZWN0ZWQ6IHdpbmRvdy52dWVBcHAuc2V0dGluZ3Muc2VsZWN0ZWREYXRhc2V0fSksXHJcbiAgICAgICAgY29udGVudFR5cGU6IFwiYXBwbGljYXRpb24vanNvbjsgY2hhcnNldD11dGYtOFwiLFxyXG4gICAgICAgIGRhdGFUeXBlICAgOiBcImpzb25cIlxyXG4gICAgICB9KTtcclxuICAgICAgIFxyXG4gICAgICByZXF1ZXN0LmRvbmUoZnVuY3Rpb24oIHJlc3BvbnNlICkge1xyXG4gICAgICAgIHN1Y2Nlc3NDYWxsYmFjayhKU09OLnBhcnNlKHJlc3BvbnNlKSk7XHJcbiAgICAgIH0pO1xyXG4gICAgICAgXHJcbiAgICAgIHJlcXVlc3QuZmFpbChmdW5jdGlvbigganFYSFIsIHRleHRTdGF0dXMgKSB7XHJcbiAgICAgICAgICBpZihmYWlsdXJlQ2FsbGJhY2spXHJcbiAgICAgICAgICAgIGZhaWx1cmVDYWxsYmFjayh0ZXh0U3RhdHVzKTtcclxuICAgICAgICAgIGVsc2V7XHJcbiAgICAgICAgICAgICAgYWxlcnQoIFwiUmVxdWVzdCBmYWlsZWQ6IFwiICsgdGV4dFN0YXR1cyApO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdldExEQUNsdXN0ZXJzKGRvY3MsIHN1Y2Nlc3NDYWxsYmFjaywgZmFpbHVyZUNhbGxiYWNrKXtcclxuICAgIHZhciByZXF1ZXN0ID0gJC5hamF4KHtcclxuICAgICAgICB1cmw6IFwiL2FwaS9nZXRMREFEYXRhXCIsXHJcbiAgICAgICAgbWV0aG9kOiBcIlBPU1RcIixcclxuICAgICAgICBkYXRhOiBKU09OLnN0cmluZ2lmeSh7ZG9jczogZG9jcywgc3RhcnQ6IHdpbmRvdy52dWVBcHAuc2V0dGluZ3Muc3RhcnQxLCBlbmQ6IHdpbmRvdy52dWVBcHAuc2V0dGluZ3MuZW5kMSwgc2VsZWN0ZWQ6IHdpbmRvdy52dWVBcHAuc2V0dGluZ3Muc2VsZWN0ZWREYXRhc2V0fSksXHJcbiAgICAgICAgY29udGVudFR5cGU6IFwiYXBwbGljYXRpb24vanNvbjsgY2hhcnNldD11dGYtOFwiLFxyXG4gICAgICAgIGRhdGFUeXBlICAgOiBcImpzb25cIlxyXG4gICAgICB9KTtcclxuICAgICAgIFxyXG4gICAgICByZXF1ZXN0LmRvbmUoZnVuY3Rpb24oIHJlc3BvbnNlICkge1xyXG4gICAgICAgIHN1Y2Nlc3NDYWxsYmFjayhyZXNwb25zZSk7XHJcbiAgICAgIH0pO1xyXG4gICAgICAgXHJcbiAgICAgIHJlcXVlc3QuZmFpbChmdW5jdGlvbigganFYSFIsIHRleHRTdGF0dXMgKSB7XHJcbiAgICAgICAgaWYoZmFpbHVyZUNhbGxiYWNrKVxyXG4gICAgICAgICAgICBmYWlsdXJlQ2FsbGJhY2sodGV4dFN0YXR1cyk7XHJcbiAgICAgICAgICBlbHNle1xyXG4gICAgICAgICAgICAgIGFsZXJ0KCBcIlJlcXVlc3QgZmFpbGVkOiBcIiArIHRleHRTdGF0dXMgKTtcclxuICAgICAgICAgIH1cclxuICAgICAgfSk7XHJcbn1cclxuIiwiZnVuY3Rpb24gbG9hZFBhcmFsbGVsQ29vcmRpbmF0ZXNIQyhyZXNwKXtcclxuXHJcblxyXG4gICAgICAgIGxldCBkYXRhID0gZ2VuZXJhdGVQYXJhbGxlbENvb3JkaW5hdGVEYXRhSEMocmVzcCwgMCwgMCk7XHJcbiAgICAgICAgSGlnaGNoYXJ0cy5jaGFydCgncGMtY29udGFpbmVyJywge1xyXG4gICAgICAgICAgICBjaGFydDoge1xyXG4gICAgICAgICAgICAgICAgdHlwZTogJ3NwbGluZScsXHJcbiAgICAgICAgICAgICAgICBwYXJhbGxlbENvb3JkaW5hdGVzOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgcGFyYWxsZWxBeGVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGluZVdpZHRoOiAyXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHRpdGxlOiB7XHJcbiAgICAgICAgICAgICAgICB0ZXh0OiAnRG9jdW1lbnQgLSBUb3BpYyAtIFdvcmQgUmVsYXRpb25zaGlwJ1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBwbG90T3B0aW9uczoge1xyXG4gICAgICAgICAgICAgICAgc2VyaWVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgYW5pbWF0aW9uOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgICAgICBtYXJrZXI6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZW5hYmxlZDogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXRlczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaG92ZXI6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbmFibGVkOiBmYWxzZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICBzdGF0ZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaG92ZXI6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhhbG86IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaXplOiAwXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIGV2ZW50czoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBtb3VzZU92ZXI6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZ3JvdXAudG9Gcm9udCgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAvLyB0b29sdGlwOiB7XHJcbiAgICAgICAgICAgIC8vICAgICBwb2ludEZvcm1hdDogJzxzcGFuIHN0eWxlPVwiY29sb3I6e3BvaW50LmNvbG9yfVwiPlxcdTI1Q0Y8L3NwYW4+JyArXHJcbiAgICAgICAgICAgIC8vICAgICAgICAgJ3tzZXJpZXMubmFtZX06IDxiPntwb2ludC5mb3JtYXR0ZWRWYWx1ZX08L2I+PGJyLz4nXHJcbiAgICAgICAgICAgIC8vIH0sXHJcbiAgICAgICAgICAgIHhBeGlzOiB7XHJcbiAgICAgICAgICAgICAgICBjYXRlZ29yaWVzOiBbXHJcbiAgICAgICAgICAgICAgICAgICAgJ0RvY3VtZW50JyxcclxuICAgICAgICAgICAgICAgICAgICAnVG9waWMnLFxyXG4gICAgICAgICAgICAgICAgICAgICdXb3JkJ1xyXG4gICAgICAgICAgICAgICAgXSxcclxuICAgICAgICAgICAgICAgIG9mZnNldDogMTBcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgeUF4aXM6IFt7XHJcbiAgICAgICAgICAgICAgICBjYXRlZ29yaWVzOiBPYmplY3Qua2V5cyhyZXNwW1wiZG9jdW1lbnRfdG9waWNcIl0pLm1hcCh4PT4gXCIuLi4uLi4uLi4uLi4uLi4uRG9jdW1lbnQgXCIreClcclxuICAgICAgICAgICAgfSwge1xyXG4gICAgICAgICAgICAgICAgY2F0ZWdvcmllczogcmVzcFtcInRvcGljc1wiXS5tYXAoeD0+IFwiLi4uLi4uLi4uLi4uLi4uLlRvcGljIFwiK3gpXHJcbiAgICAgICAgICAgIH0sIHtcclxuICAgICAgICAgICAgICAgIGNhdGVnb3JpZXM6IE9iamVjdC52YWx1ZXMocmVzcFtcIndvcmRzXCJdKS5tYXAoeD0+IFwiLi4uLi4uLi4uLi4uLi4uLlwiK3gpXHJcbiAgICAgICAgICAgIH1dLFxyXG4gICAgICAgICAgICBjb2xvcnM6IFsncmdiYSgxMSwgMjAwLCAyMDAsIDAuMSknXSxcclxuICAgICAgICAgICAgc2VyaWVzOiBkYXRhLm1hcChmdW5jdGlvbiAoc2V0LCBpKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAgICAgICAgIG5hbWU6ICcnLFxyXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IHNldCxcclxuICAgICAgICAgICAgICAgICAgICBzaGFkb3c6IGZhbHNlXHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgIH0pO1xyXG5cclxufVxyXG5cclxuXHJcbiIsImZ1bmN0aW9uIGxvYWRQYXJhbGxlbENvb3JkaW5hdGUocmVzcCl7XHJcbiAgICB2YXIgbWFyZ2luID0ge3RvcDogMzAsIHJpZ2h0OiAxMCwgYm90dG9tOiAxMCwgbGVmdDogMTB9LFxyXG4gICAgICAgIHdpZHRoID0gOTYwIC0gbWFyZ2luLmxlZnQgLSBtYXJnaW4ucmlnaHQsXHJcbiAgICAgICAgaGVpZ2h0ID0gNTAwIC0gbWFyZ2luLnRvcCAtIG1hcmdpbi5ib3R0b207XHJcblxyXG4gICAgdmFyIHggPSBkM1YzLnNjYWxlLm9yZGluYWwoKS5yYW5nZVBvaW50cyhbMCwgd2lkdGhdLCAxKSxcclxuICAgICAgICB5ID0ge30sXHJcbiAgICAgICAgZHJhZ2dpbmcgPSB7fTtcclxuXHJcbiAgICB2YXIgbGluZSA9IGQzVjMuc3ZnLmxpbmUoKSxcclxuICAgICAgICBiYWNrZ3JvdW5kLFxyXG4gICAgICAgIGZvcmVncm91bmQ7XHJcblxyXG4gICAgdmFyIHN2ZyA9IGQzVjMuc2VsZWN0KFwiI3BhcmFsbGVsLWNvb3JkaW5hdGUtdmlzXCIpLmFwcGVuZChcInN2Z1wiKVxyXG4gICAgICAgIC5hdHRyKFwid2lkdGhcIiwgd2lkdGggKyBtYXJnaW4ubGVmdCArIG1hcmdpbi5yaWdodClcclxuICAgICAgICAuYXR0cihcImhlaWdodFwiLCBoZWlnaHQgKyBtYXJnaW4udG9wICsgbWFyZ2luLmJvdHRvbSlcclxuICAgIC5hcHBlbmQoXCJnXCIpXHJcbiAgICAgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoXCIgKyBtYXJnaW4ubGVmdCArIFwiLFwiICsgbWFyZ2luLnRvcCArIFwiKVwiKSwgZGltZW5zaW9ucztcclxuXHJcblxyXG4gICAgLy8gRXh0cmFjdCB0aGUgbGlzdCBvZiBkaW1lbnNpb25zIGFuZCBjcmVhdGUgYSBzY2FsZSBmb3IgZWFjaC5cclxuICAgIHZhciBjYXJzID0gZ2VuZXJhdGVQYXJhbGxlbENvb3JkaW5hdGVEYXRhKHJlc3AsIDAsIDApO1xyXG4gICAgLy8gdmFyIGF4aXNEID0gZDNWMy5zdmcuYXhpcygpLm9yaWVudChcImxlZnRcIikudGlja3MoT2JqZWN0LmtleXMocmVzcFtcImRvY3VtZW50X3RvcGljXCJdKS5sZW5ndGgpLFxyXG4gICAgdmFyIGF4aXNEID0gZDNWMy5zdmcuYXhpcygpLm9yaWVudChcImxlZnRcIikudGlja1ZhbHVlcyhPYmplY3Qua2V5cyhyZXNwW1wiZG9jdW1lbnRfdG9waWNcIl0pLm1hcCh4ID0+IHBhcnNlSW50KHgpKSksXHJcbiAgICAgICAgYXhpc1QgPSBkM1YzLnN2Zy5heGlzKCkub3JpZW50KFwibGVmdFwiKS50aWNrVmFsdWVzKHJlc3BbXCJ0b3BpY3NcIl0ubWFwKHggPT4gcGFyc2VJbnQoeCkpKSxcclxuICAgICAgICBheGlzVyA9IGQzVjMuc3ZnLmF4aXMoKS5vcmllbnQoXCJsZWZ0XCIpLnRpY2tWYWx1ZXMoT2JqZWN0LnZhbHVlcyhyZXNwW1wib3ZlcmFsbF93b3JkXCJdKS5tYXAoeCA9PiBwYXJzZUZsb2F0KHgpKSk7XHJcblxyXG4gICAgeC5kb21haW4oZGltZW5zaW9ucyA9IGQzVjMua2V5cyhjYXJzWzBdKS5maWx0ZXIoZnVuY3Rpb24oZCkge1xyXG4gICAgICAgIHJldHVybiBkICE9IFwibmFtZVwiICYmICh5W2RdID0gZDNWMy5zY2FsZS5saW5lYXIoKVxyXG4gICAgICAgICAgICAuZG9tYWluKGQzVjMuZXh0ZW50KGNhcnMsIGZ1bmN0aW9uKHApIHsgcmV0dXJuICtwW2RdOyB9KSlcclxuICAgICAgICAgICAgLnJhbmdlKFtoZWlnaHQsIDBdKSk7XHJcbiAgICB9KSk7XHJcblxyXG4gICAgLy8gQWRkIGdyZXkgYmFja2dyb3VuZCBsaW5lcyBmb3IgY29udGV4dC5cclxuICAgIGJhY2tncm91bmQgPSBzdmcuYXBwZW5kKFwiZ1wiKVxyXG4gICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJiYWNrZ3JvdW5kXCIpXHJcbiAgICAgICAgLnNlbGVjdEFsbChcInBhdGhcIilcclxuICAgICAgICAuZGF0YShjYXJzKVxyXG4gICAgICAgIC5lbnRlcigpLmFwcGVuZChcInBhdGhcIilcclxuICAgICAgICAuYXR0cihcImRcIiwgcGF0aCk7XHJcblxyXG4gICAgLy8gQWRkIGJsdWUgZm9yZWdyb3VuZCBsaW5lcyBmb3IgZm9jdXMuXHJcbiAgICBmb3JlZ3JvdW5kID0gc3ZnLmFwcGVuZChcImdcIilcclxuICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwiZm9yZWdyb3VuZFwiKVxyXG4gICAgICAgIC5zZWxlY3RBbGwoXCJwYXRoXCIpXHJcbiAgICAgICAgLmRhdGEoY2FycylcclxuICAgICAgICAuZW50ZXIoKS5hcHBlbmQoXCJwYXRoXCIpXHJcbiAgICAgICAgLmF0dHIoXCJkXCIsIHBhdGgpO1xyXG5cclxuICAgIC8vIEFkZCBhIGdyb3VwIGVsZW1lbnQgZm9yIGVhY2ggZGltZW5zaW9uLlxyXG4gICAgdmFyIGcgPSBzdmcuc2VsZWN0QWxsKFwiLmRpbWVuc2lvblwiKVxyXG4gICAgICAgIC5kYXRhKGRpbWVuc2lvbnMpXHJcbiAgICAgICAgLmVudGVyKCkuYXBwZW5kKFwiZ1wiKVxyXG4gICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJkaW1lbnNpb25cIilcclxuICAgICAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBmdW5jdGlvbihkKSB7IHJldHVybiBcInRyYW5zbGF0ZShcIiArIHgoZCkgKyBcIilcIjsgfSlcclxuICAgICAgICAuY2FsbChkM1YzLmJlaGF2aW9yLmRyYWcoKVxyXG4gICAgICAgICAgICAub3JpZ2luKGZ1bmN0aW9uKGQpIHsgcmV0dXJuIHt4OiB4KGQpfTsgfSlcclxuICAgICAgICAgICAgLm9uKFwiZHJhZ3N0YXJ0XCIsIGZ1bmN0aW9uKGQpIHtcclxuICAgICAgICAgICAgZHJhZ2dpbmdbZF0gPSB4KGQpO1xyXG4gICAgICAgICAgICBiYWNrZ3JvdW5kLmF0dHIoXCJ2aXNpYmlsaXR5XCIsIFwiaGlkZGVuXCIpO1xyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAub24oXCJkcmFnXCIsIGZ1bmN0aW9uKGQpIHtcclxuICAgICAgICAgICAgZHJhZ2dpbmdbZF0gPSBNYXRoLm1pbih3aWR0aCwgTWF0aC5tYXgoMCwgZDNWMy5ldmVudC54KSk7XHJcbiAgICAgICAgICAgIGZvcmVncm91bmQuYXR0cihcImRcIiwgcGF0aCk7XHJcbiAgICAgICAgICAgIGRpbWVuc2lvbnMuc29ydChmdW5jdGlvbihhLCBiKSB7IHJldHVybiBwb3NpdGlvbihhKSAtIHBvc2l0aW9uKGIpOyB9KTtcclxuICAgICAgICAgICAgeC5kb21haW4oZGltZW5zaW9ucyk7XHJcbiAgICAgICAgICAgIGcuYXR0cihcInRyYW5zZm9ybVwiLCBmdW5jdGlvbihkKSB7IHJldHVybiBcInRyYW5zbGF0ZShcIiArIHBvc2l0aW9uKGQpICsgXCIpXCI7IH0pXHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIC5vbihcImRyYWdlbmRcIiwgZnVuY3Rpb24oZCkge1xyXG4gICAgICAgICAgICBkZWxldGUgZHJhZ2dpbmdbZF07XHJcbiAgICAgICAgICAgIHRyYW5zaXRpb24oZDNWMy5zZWxlY3QodGhpcykpLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoXCIgKyB4KGQpICsgXCIpXCIpO1xyXG4gICAgICAgICAgICB0cmFuc2l0aW9uKGZvcmVncm91bmQpLmF0dHIoXCJkXCIsIHBhdGgpO1xyXG4gICAgICAgICAgICBiYWNrZ3JvdW5kXHJcbiAgICAgICAgICAgICAgICAuYXR0cihcImRcIiwgcGF0aClcclxuICAgICAgICAgICAgICAgIC50cmFuc2l0aW9uKClcclxuICAgICAgICAgICAgICAgIC5kZWxheSg1MDApXHJcbiAgICAgICAgICAgICAgICAuZHVyYXRpb24oMClcclxuICAgICAgICAgICAgICAgIC5hdHRyKFwidmlzaWJpbGl0eVwiLCBudWxsKTtcclxuICAgICAgICAgICAgfSkpO1xyXG5cclxuICAgIC8vIEFkZCBhbiBheGlzIGFuZCB0aXRsZS5cclxuICAgIGcuYXBwZW5kKFwiZ1wiKVxyXG4gICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJheGlzXCIpXHJcbiAgICAgICAgLmVhY2goZnVuY3Rpb24oZCkge1xyXG4gICAgICAgICAgICBsZXQgYXhpcyA9IG51bGw7XHJcbiAgICAgICAgICAgIGlmKGQgPT0gXCJkb2N1bWVudFwiKXtcclxuICAgICAgICAgICAgICAgIGF4aXMgPSBheGlzRDtcclxuICAgICAgICAgICAgfSBlbHNlIGlmKGQgPT0gXCJ0b3BpY1wiKXtcclxuICAgICAgICAgICAgICAgIGF4aXMgPSBheGlzVDtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGF4aXMgPSBheGlzVztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBkM1YzLnNlbGVjdCh0aGlzKS5jYWxsKFxyXG4gICAgICAgICAgICAgICAgYXhpcy5zY2FsZSh5W2RdKVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLmFwcGVuZChcInRleHRcIilcclxuICAgICAgICAuc3R5bGUoXCJ0ZXh0LWFuY2hvclwiLCBcIm1pZGRsZVwiKVxyXG4gICAgICAgIC5hdHRyKFwieVwiLCAtOSlcclxuICAgICAgICAudGV4dChmdW5jdGlvbihkKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBkO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgIC8vIEFkZCBhbmQgc3RvcmUgYSBicnVzaCBmb3IgZWFjaCBheGlzLlxyXG4gICAgZy5hcHBlbmQoXCJnXCIpXHJcbiAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcImJydXNoXCIpXHJcbiAgICAgICAgLmVhY2goZnVuY3Rpb24oZCkge1xyXG4gICAgICAgICAgICBkM1YzLnNlbGVjdCh0aGlzKS5jYWxsKHlbZF0uYnJ1c2ggPSBkM1YzLnN2Zy5icnVzaCgpLnkoeVtkXSkub24oXCJicnVzaHN0YXJ0XCIsIGJydXNoc3RhcnQpLm9uKFwiYnJ1c2hcIiwgYnJ1c2gpKTtcclxuICAgICAgICB9KVxyXG4gICAgICAgIC5zZWxlY3RBbGwoXCJyZWN0XCIpXHJcbiAgICAgICAgLmF0dHIoXCJ4XCIsIC04KVxyXG4gICAgICAgIC5hdHRyKFwid2lkdGhcIiwgMTYpO1xyXG5cclxuXHJcbiAgICBmdW5jdGlvbiBwb3NpdGlvbihkKSB7XHJcbiAgICB2YXIgdiA9IGRyYWdnaW5nW2RdO1xyXG4gICAgcmV0dXJuIHYgPT0gbnVsbCA/IHgoZCkgOiB2O1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIHRyYW5zaXRpb24oZykge1xyXG4gICAgcmV0dXJuIGcudHJhbnNpdGlvbigpLmR1cmF0aW9uKDUwMCk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gUmV0dXJucyB0aGUgcGF0aCBmb3IgYSBnaXZlbiBkYXRhIHBvaW50LlxyXG4gICAgZnVuY3Rpb24gcGF0aChkKSB7XHJcbiAgICByZXR1cm4gbGluZShkaW1lbnNpb25zLm1hcChmdW5jdGlvbihwKSB7IHJldHVybiBbcG9zaXRpb24ocCksIHlbcF0oZFtwXSldOyB9KSk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gYnJ1c2hzdGFydCgpIHtcclxuICAgIGQzVjMuZXZlbnQuc291cmNlRXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gSGFuZGxlcyBhIGJydXNoIGV2ZW50LCB0b2dnbGluZyB0aGUgZGlzcGxheSBvZiBmb3JlZ3JvdW5kIGxpbmVzLlxyXG4gICAgZnVuY3Rpb24gYnJ1c2goKSB7XHJcbiAgICB2YXIgYWN0aXZlcyA9IGRpbWVuc2lvbnMuZmlsdGVyKGZ1bmN0aW9uKHApIHsgcmV0dXJuICF5W3BdLmJydXNoLmVtcHR5KCk7IH0pLFxyXG4gICAgICAgIGV4dGVudHMgPSBhY3RpdmVzLm1hcChmdW5jdGlvbihwKSB7IHJldHVybiB5W3BdLmJydXNoLmV4dGVudCgpOyB9KTtcclxuICAgIGZvcmVncm91bmQuc3R5bGUoXCJkaXNwbGF5XCIsIGZ1bmN0aW9uKGQpIHtcclxuICAgICAgICByZXR1cm4gYWN0aXZlcy5ldmVyeShmdW5jdGlvbihwLCBpKSB7XHJcbiAgICAgICAgcmV0dXJuIGV4dGVudHNbaV1bMF0gPD0gZFtwXSAmJiBkW3BdIDw9IGV4dGVudHNbaV1bMV07XHJcbiAgICAgICAgfSkgPyBudWxsIDogXCJub25lXCI7XHJcbiAgICB9KTtcclxuICAgIH1cclxuXHJcbn0iLCJmdW5jdGlvbiByZW5kZXJDbHVzdGVyQW5hbHlzaXMocmVzcCkge1xyXG4gIGQzLnNlbGVjdChcIi5jaGFydDEyXCIpLnJlbW92ZSgpO1xyXG4gIHZhciBkb2N1bWVudF90b3BpYyA9IHJlc3BbXCJkb2N1bWVudF90b3BpY1wiXVswXTtcclxuICB2YXIgdG9waWNfdmVjdG9ycyA9IHJlc3BbXCJ0b3BpY192ZWN0b3JzXCJdO1xyXG4gIHZhciBiYiA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNjbHVzdGVyJylcclxuICAgIC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKSxcclxuICAgIHdpZHRoID0gNDAwO1xyXG4gIHZhciBoZWlnaHQgPSA0MDA7XHJcbiAgdmFyIG1hcmdpbiA9IDgwO1xyXG4gIHZhciBkYXRhID0gW107XHJcblxyXG4gIE9iamVjdC5rZXlzKHRvcGljX3ZlY3RvcnMpLmZvckVhY2goZnVuY3Rpb24oa2V5KSB7XHJcbiAgICB2YXIgdmFsdWUgPSB0b3BpY192ZWN0b3JzW2tleV07XHJcbiAgICBkYXRhLnB1c2goe1xyXG4gICAgICB4OiB2YWx1ZVswXSxcclxuICAgICAgeTogdmFsdWVbMV0sXHJcbiAgICAgIGM6IDEsXHJcbiAgICAgIHNpemU6IGRvY3VtZW50X3RvcGljW2tleV0sXHJcbiAgICAgIGtleToga2V5XHJcbiAgICB9KTtcclxuICB9KTtcclxuICB2YXIgbGFiZWxYID0gJ1gnO1xyXG4gIHZhciBsYWJlbFkgPSAnWSc7XHJcblxyXG4gIHZhciBzdmcgPSBkMy5zZWxlY3QoJyNjbHVzdGVyJylcclxuICAgIC5hcHBlbmQoJ3N2ZycpXHJcbiAgICAuYXR0cignY2xhc3MnLCAnY2hhcnQxMicpXHJcbiAgICAuYXR0cignaWQnLCdjbHVzdGVyX2lkJylcclxuICAgIC5hdHRyKFwid2lkdGhcIiwgd2lkdGggKyBtYXJnaW4gKyBtYXJnaW4pXHJcbiAgICAuYXR0cihcImhlaWdodFwiLCBoZWlnaHQgKyBtYXJnaW4gKyBtYXJnaW4pXHJcbiAgICAuYXBwZW5kKFwiZ1wiKVxyXG4gICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoXCIgKyBtYXJnaW4gKyBcIixcIiArIG1hcmdpbiArIFwiKVwiKTtcclxuXHJcbiAgdmFyIHggPSBkMy5zY2FsZUxpbmVhcigpXHJcbiAgICAuZG9tYWluKFtkMy5taW4oZGF0YSwgZnVuY3Rpb24gKGQpIHtcclxuICAgICAgcmV0dXJuIGQueDtcclxuICAgIH0pLCBkMy5tYXgoZGF0YSwgZnVuY3Rpb24gKGQpIHtcclxuICAgICAgcmV0dXJuIGQueDtcclxuICAgIH0pXSlcclxuICAgIC5yYW5nZShbMCwgd2lkdGhdKTtcclxuXHJcbiAgdmFyIHkgPSBkMy5zY2FsZUxpbmVhcigpXHJcbiAgICAuZG9tYWluKFtkMy5taW4oZGF0YSwgZnVuY3Rpb24gKGQpIHtcclxuICAgICAgcmV0dXJuIGQueTtcclxuICAgIH0pLCBkMy5tYXgoZGF0YSwgZnVuY3Rpb24gKGQpIHtcclxuICAgICAgcmV0dXJuIGQueTtcclxuICAgIH0pXSlcclxuICAgIC5yYW5nZShbaGVpZ2h0LCAwXSk7XHJcblxyXG4gIHZhciBzY2FsZSA9IGQzLnNjYWxlU3FydCgpXHJcbiAgICAuZG9tYWluKFtkMy5taW4oZGF0YSwgZnVuY3Rpb24gKGQpIHtcclxuICAgICAgcmV0dXJuIGQuc2l6ZTtcclxuICAgIH0pLCBkMy5tYXgoZGF0YSwgZnVuY3Rpb24gKGQpIHtcclxuICAgICAgcmV0dXJuIGQuc2l6ZTtcclxuICAgIH0pXSlcclxuICAgIC5yYW5nZShbMTAsIDIwXSk7XHJcblxyXG4gIHZhciBvcGFjaXR5ID0gZDMuc2NhbGVTcXJ0KClcclxuICAgIC5kb21haW4oW2QzLm1pbihkYXRhLCBmdW5jdGlvbiAoZCkge1xyXG4gICAgICByZXR1cm4gZC5zaXplO1xyXG4gICAgfSksIGQzLm1heChkYXRhLCBmdW5jdGlvbiAoZCkge1xyXG4gICAgICByZXR1cm4gZC5zaXplO1xyXG4gICAgfSldKVxyXG4gICAgLnJhbmdlKFsxLCAuNV0pO1xyXG5cclxuXHJcbiAgdmFyIHhBeGlzID0gZDMuYXhpc0JvdHRvbSgpLnNjYWxlKHgpO1xyXG4gIHZhciB5QXhpcyA9IGQzLmF4aXNMZWZ0KCkuc2NhbGUoeSk7XHJcblxyXG5cclxuICBzdmcuYXBwZW5kKFwiZ1wiKVxyXG4gICAgLmF0dHIoXCJjbGFzc1wiLCBcInkgYXhpc1wiKVxyXG4gICAgLmNhbGwoeUF4aXMpXHJcbiAgICAuYXBwZW5kKFwidGV4dFwiKVxyXG4gICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJyb3RhdGUoLTkwKVwiKVxyXG4gICAgLmF0dHIoXCJ4XCIsIDIwKVxyXG4gICAgLmF0dHIoXCJ5XCIsIC1tYXJnaW4pXHJcbiAgICAuYXR0cihcImR5XCIsIFwiLjcxZW1cIilcclxuICAgIC5zdHlsZShcInRleHQtYW5jaG9yXCIsIFwiZW5kXCIpXHJcbiAgICAudGV4dChsYWJlbFkpO1xyXG4gIC8vIHggYXhpcyBhbmQgbGFiZWxcclxuICBzdmcuYXBwZW5kKFwiZ1wiKVxyXG4gICAgLmF0dHIoXCJjbGFzc1wiLCBcInggYXhpc1wiKVxyXG4gICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoMCxcIiArIGhlaWdodCArIFwiKVwiKVxyXG4gICAgLmNhbGwoeEF4aXMpXHJcbiAgICAuYXBwZW5kKFwidGV4dFwiKVxyXG4gICAgLmF0dHIoXCJ4XCIsIHdpZHRoICsgMjApXHJcbiAgICAuYXR0cihcInlcIiwgbWFyZ2luIC0gMTApXHJcbiAgICAuYXR0cihcImR5XCIsIFwiLjcxZW1cIilcclxuICAgIC5zdHlsZShcInRleHQtYW5jaG9yXCIsIFwiZW5kXCIpXHJcbiAgICAudGV4dChsYWJlbFgpO1xyXG5cclxuICBzdmcuc2VsZWN0QWxsKFwiY2lyY2xlXCIpXHJcbiAgICAuZGF0YShkYXRhKVxyXG4gICAgLmVudGVyKClcclxuICAgIC5hcHBlbmQoXCJnXCIpXHJcbiAgICAuaW5zZXJ0KFwiY2lyY2xlXCIpXHJcbiAgICAuYXR0cihcImN4XCIsIHdpZHRoIC8gMilcclxuICAgIC5hdHRyKFwiY3lcIiwgaGVpZ2h0IC8gMilcclxuICAgIC5hdHRyKFwiclwiLCBmdW5jdGlvbiAoZCkge1xyXG4gICAgICByZXR1cm4gc2NhbGUoZC5zaXplKTtcclxuICAgIH0pXHJcbiAgICAuYXR0cihcImlkXCIsZnVuY3Rpb24oZCkge1xyXG4gICAgICByZXR1cm4gZC5rZXlcclxuICAgIH0pXHJcbiAgICAuc3R5bGUoXCJmaWxsXCIsIGZ1bmN0aW9uIChkKSB7XHJcbiAgICAgIHJldHVybiBcIiNEMEUzRjBcIjtcclxuICAgIH0pXHJcbiAgICAub24oJ21vdXNlb3ZlcicsIGZ1bmN0aW9uIChkLCBpKSB7XHJcbiAgICAgIHJlbmRlckJhckdyYXBoKGRbXCJrZXlcIl0sIHJlc3ApO1xyXG4gICAgICBmYWRlKGRbXCJrZXlcIl0sIDEpO1xyXG4gICAgfSlcclxuICAgIC5vbignbW91c2VvdXQnLCBmdW5jdGlvbiAoZCwgaSkge1xyXG4gICAgICBmYWRlT3V0KCk7XHJcbiAgICB9KVxyXG4gICAgLnRyYW5zaXRpb24oKVxyXG4gICAgLmRlbGF5KGZ1bmN0aW9uIChkLCBpKSB7XHJcbiAgICAgIHJldHVybiB4KGQueCkgLSB5KGQueSk7XHJcbiAgICB9KVxyXG4gICAgLmR1cmF0aW9uKDUwMClcclxuICAgIC5hdHRyKFwiY3hcIiwgZnVuY3Rpb24gKGQpIHtcclxuICAgICAgcmV0dXJuIHgoZC54KTtcclxuICAgIH0pXHJcbiAgICAuYXR0cihcImN5XCIsIGZ1bmN0aW9uIChkKSB7XHJcbiAgICAgIHJldHVybiB5KGQueSk7XHJcbiAgICB9KTtcclxuXHJcbiAgICAgIC8vIHRleHQgbGFiZWwgZm9yIHRoZSB4IGF4aXNcclxuICBzdmcuYXBwZW5kKFwidGV4dFwiKVxyXG4gICAgLmF0dHIoXCJjbGFzc1wiLCBcInggbGFiZWxcIilcclxuICAgIC5hdHRyKFwidGV4dC1hbmNob3JcIiwgXCJlbmRcIilcclxuICAgIC5hdHRyKFwieFwiLCB3aWR0aClcclxuICAgIC5hdHRyKFwieVwiLCBoZWlnaHQgKzQwKVxyXG4gICAgLnRleHQoXCJQQzFcIik7XHJcblxyXG5cclxuICBzdmcuYXBwZW5kKFwidGV4dFwiKVxyXG4gICAgLmF0dHIoXCJjbGFzc1wiLCBcInkgbGFiZWxcIilcclxuICAgIC5hdHRyKFwidGV4dC1hbmNob3JcIiwgXCJlbmRcIilcclxuICAgIC5hdHRyKFwieVwiLCAtNTApXHJcbiAgICAuYXR0cihcImR5XCIsIFwiLjc1ZW1cIilcclxuICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIFwicm90YXRlKC05MClcIilcclxuICAgIC50ZXh0KFwiUEMyXCIpO1xyXG5cclxuXHJcbiAgZnVuY3Rpb24gZmFkZShrZXksIG9wYWNpdHkpIHtcclxuICAgIHN2Zy5zZWxlY3RBbGwoXCJjaXJjbGVcIilcclxuICAgICAgLmZpbHRlcihmdW5jdGlvbiAoZCkge1xyXG4gICAgICAgIFxyXG4gICAgICAgIHJldHVybiBkLmtleSA9PSBrZXk7XHJcbiAgICAgIH0pLlxyXG4gICAgICBzdHlsZShcImZpbGxcIiwgXCIjQzg0MjNFXCIpXHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiBmYWRlT3V0KCkge1xyXG4gICAgc3ZnLnNlbGVjdEFsbChcImNpcmNsZVwiKVxyXG4gICAgICAudHJhbnNpdGlvbigpXHJcbiAgICAgIC5zdHlsZShcImZpbGxcIixcIiNEMEUzRjBcIik7XHJcbiAgfVxyXG59IiwiZnVuY3Rpb24gcmVuZGVyQmFyR3JhcGgodG9waWNfbnVtYmVyLCByZXNwKSB7XHJcbiAgZDMuc2VsZWN0KFwiI3N0YWNrLWJhclwiKS5yZW1vdmUoKTtcclxuICBkMy5zZWxlY3QoXCIjbGVnZW5kc3ZnXCIpLnJlbW92ZSgpO1xyXG4gIHZhciBmaW5hbF9kYXRhID0gW107XHJcbiAgdmFyIGRhdGFWYWwgPXJlc3BbXCJ0b3BpY193b3JkXCJdW3RvcGljX251bWJlcl07XHJcbiAgZm9yICh2YXIga2V5IGluIGRhdGFWYWwpIHtcclxuICAgIGlmIChkYXRhVmFsLmhhc093blByb3BlcnR5KGtleSkpIHtcclxuICAgICAgICB2YXIgdGVtcCA9e307XHJcbiAgICAgICAgdGVtcC5TdGF0ZSA9IGtleTtcclxuICAgICAgICB0ZW1wLnRvcGljX2ZyZXF1ZW5jeSA9IE1hdGguYWJzKGRhdGFWYWxba2V5XSk7XHJcbiAgICAgICAgdGVtcC5vdmVyYWxsID0gTWF0aC5hYnMocmVzcFtcIm92ZXJhbGxfd29yZFwiXVtrZXldKTtcclxuICAgICAgICB0ZW1wLnRvdGFsID0gdGVtcC50b3BpY19mcmVxdWVuY3kgKyB0ZW1wLm92ZXJhbGw7XHJcbiAgICAgICAgZmluYWxfZGF0YS5wdXNoKHRlbXApO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKGtleSArIFwiLT5cIiArIHJlc3BbXCJvdmVyYWxsX3dvcmRcIl1ba2V5XSk7XHJcbiAgICB9XHJcbiAgICBcclxuICB9XHJcbiAgXHJcbiAgdmFyIGJiID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI3N0YWNrZWQtYmFyJylcclxuICAgIC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKSxcclxuICAgIHdpZHRoID0gNDAwO1xyXG5cclxuICB2YXIgZGF0YSA9IGZpbmFsX2RhdGE7XHJcbiAgdmFyIGhlaWdodCA9IGRhdGEubGVuZ3RoICogMjUgKzEwMDtcclxuICB2YXIgc3ZnID0gZDMuc2VsZWN0KFwiI3N0YWNrZWQtYmFyXCIpLmFwcGVuZChcInN2Z1wiKS5hdHRyKFwid2lkdGhcIiwgd2lkdGgpLmF0dHIoXCJoZWlnaHRcIiwgaGVpZ2h0KS5hdHRyKFwiaWRcIixcInN0YWNrLWJhclwiKSxcclxuICAgIG1hcmdpbiA9IHtcclxuICAgICAgdG9wOiAyMCxcclxuICAgICAgcmlnaHQ6IDAsXHJcbiAgICAgIGJvdHRvbTogNTAsXHJcbiAgICAgIGxlZnQ6IDgwXHJcbiAgICB9LFxyXG4gICAgd2lkdGggPSArc3ZnLmF0dHIoXCJ3aWR0aFwiKSAtIG1hcmdpbi5sZWZ0IC0gbWFyZ2luLnJpZ2h0LFxyXG4gICAgaGVpZ2h0ID0gK3N2Zy5hdHRyKFwiaGVpZ2h0XCIpIC0gbWFyZ2luLnRvcCAtIG1hcmdpbi5ib3R0b20sXHJcbiAgICBnID0gc3ZnLmFwcGVuZChcImdcIikuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZShcIiArIG1hcmdpbi5sZWZ0ICsgXCIsXCIgKyBtYXJnaW4udG9wICsgXCIpXCIpO1xyXG4gIHZhciB5ID0gZDMuc2NhbGVCYW5kKCkgLy8geCA9IGQzLnNjYWxlQmFuZCgpICBcclxuICAgIC5yYW5nZVJvdW5kKFswLCBoZWlnaHRdKSAvLyAucmFuZ2VSb3VuZChbMCwgd2lkdGhdKVxyXG4gICAgLnBhZGRpbmdJbm5lcigwLjI1KS5hbGlnbigwLjEpO1xyXG4gIHZhciB4ID0gZDMuc2NhbGVMaW5lYXIoKSAvLyB5ID0gZDMuc2NhbGVMaW5lYXIoKVxyXG4gICAgLnJhbmdlUm91bmQoWzAsIHdpZHRoXSk7IC8vIC5yYW5nZVJvdW5kKFtoZWlnaHQsIDBdKTtcclxuXHJcbiAgdmFyIHogPSBkMy5zY2FsZU9yZGluYWwoKS5yYW5nZShbXCIjQzg0MjNFXCIsIFwiI0ExQzdFMFwiXSk7XHJcbiAgdmFyIGtleXMgPSBbXCJ0b3BpY19mcmVxdWVuY3lcIiwgXCJvdmVyYWxsXCJdO1xyXG4gIGRhdGEuc29ydChmdW5jdGlvbiAoYSwgYikge1xyXG4gICAgcmV0dXJuIGIudG90YWwgLSBhLnRvdGFsO1xyXG4gIH0pO1xyXG4gIHkuZG9tYWluKGRhdGEubWFwKGZ1bmN0aW9uIChkKSB7XHJcbiAgICByZXR1cm4gZC5TdGF0ZTtcclxuICB9KSk7IC8vIHguZG9tYWluLi4uXHJcblxyXG4gIHguZG9tYWluKFswLCBkMy5tYXgoZGF0YSwgZnVuY3Rpb24gKGQpIHtcclxuICAgIHJldHVybiBkLnRvdGFsO1xyXG4gIH0pXSkubmljZSgpOyAvLyB5LmRvbWFpbi4uLlxyXG5cclxuICB6LmRvbWFpbihrZXlzKTtcclxuICBnLmFwcGVuZChcImdcIilcclxuICAgIC5zZWxlY3RBbGwoXCJnXCIpXHJcbiAgICAuZGF0YShkMy5zdGFjaygpLmtleXMoa2V5cykoZGF0YSkpXHJcbiAgICAuZW50ZXIoKS5hcHBlbmQoXCJnXCIpXHJcbiAgICAgIC5hdHRyKFwiZmlsbFwiLCBmdW5jdGlvbihkKSB7IHJldHVybiB6KGQua2V5KTsgfSlcclxuICAgIC5zZWxlY3RBbGwoXCJyZWN0XCIpXHJcbiAgICAuZGF0YShmdW5jdGlvbihkKSB7IHJldHVybiBkOyB9KVxyXG4gICAgLmVudGVyKCkuYXBwZW5kKFwicmVjdFwiKVxyXG4gICAgICAuYXR0cihcInlcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4geShkLmRhdGEuU3RhdGUpOyB9KSAgICAgLy8uYXR0cihcInhcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4geChkLmRhdGEuU3RhdGUpOyB9KVxyXG4gICAgICAuYXR0cihcInhcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4geChkWzBdKTsgfSkgICAgICAgICAvLy5hdHRyKFwieVwiLCBmdW5jdGlvbihkKSB7IHJldHVybiB5KGRbMV0pOyB9KSBcclxuICAgICAgLmF0dHIoXCJ3aWR0aFwiLCBmdW5jdGlvbihkKSB7XHJcbiAgICAgICAgXHJcbiAgICAgICByZXR1cm4geChkWzFdKSAtIHgoZFswXSk7IFxyXG4gICAgfSkgLy8uYXR0cihcImhlaWdodFwiLCBmdW5jdGlvbihkKSB7IHJldHVybiB5KGRbMF0pIC0geShkWzFdKTsgfSlcclxuICAgICAgLmF0dHIoXCJoZWlnaHRcIiwgeS5iYW5kd2lkdGgoKSk7ICAgICAgICAgICAgICAgLy8uYXR0cihcIndpZHRoXCIsIHguYmFuZHdpZHRoKCkpOyAgXHJcblxyXG4gIGcuYXBwZW5kKFwiZ1wiKVxyXG4gICAgICAuYXR0cihcImNsYXNzXCIsIFwiYXhpc1wiKVxyXG4gICAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZSgwLDApXCIpICAgICAgICAgICAgLy8gIC5hdHRyKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKDAsXCIgKyBoZWlnaHQgKyBcIilcIilcclxuICAgICAgLmNhbGwoZDMuYXhpc0xlZnQoeSkpOyAgICAgICAgICAgICAgICAgIC8vICAgLmNhbGwoZDMuYXhpc0JvdHRvbSh4KSk7XHJcblxyXG4gIGcuYXBwZW5kKFwiZ1wiKVxyXG4gICAgICAuYXR0cihcImNsYXNzXCIsIFwiYXhpc1wiKVxyXG4gICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoMCxcIitoZWlnaHQrXCIpXCIpICAgICAgIC8vIE5ldyBsaW5lXHJcbiAgICAgIC5jYWxsKGQzLmF4aXNCb3R0b20oeCkudGlja3MobnVsbCwgXCJzXCIpKSAgICAgICAgICAvLyAgLmNhbGwoZDMuYXhpc0xlZnQoeSkudGlja3MobnVsbCwgXCJzXCIpKVxyXG4gICAgLmFwcGVuZChcInRleHRcIilcclxuICAgICAgLmF0dHIoXCJ5XCIsIDIpICAgICAgICAgICAgICAgICAgICAgICAvLyAgICAgLmF0dHIoXCJ5XCIsIDIpXHJcbiAgICAgIC5hdHRyKFwieFwiLCB4KHgudGlja3MoKS5wb3AoKSkgKyAwLjUpICAgICAgICAgICAgLy8gICAgIC5hdHRyKFwieVwiLCB5KHkudGlja3MoKS5wb3AoKSkgKyAwLjUpXHJcbiAgICAgIC5hdHRyKFwiZHlcIiwgXCI0ZW1cIikgICAgICAgICAgICAgICAgICAgLy8gICAgIC5hdHRyKFwiZHlcIiwgXCIwLjMyZW1cIilcclxuICAgICAgLmF0dHIoXCJmaWxsXCIsIFwiIzAwMFwiKVxyXG4gICAgICAuYXR0cihcInRleHQtYW5jaG9yXCIsIFwic3RhcnRcIilcclxuICAgICAgLnRleHQoXCJQcm9iYWJpbGl0eS9Db3NpbmUgU2ltaWxhcml0eVwiKVxyXG4gICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoXCIrICgtd2lkdGgpICtcIiwtMTApXCIpOyAgICAvLyBOZXdsaW5lXHJcblxyXG4gIHZhciBsZWdlbmQgPSBnLmFwcGVuZChcImdcIilcclxuICAgICAgLmF0dHIoXCJmb250LWZhbWlseVwiLCBcInNhbnMtc2VyaWZcIilcclxuICAgICAgLmF0dHIoXCJmb250LXNpemVcIiwgMTApXHJcbiAgICAgIC5hdHRyKFwidGV4dC1hbmNob3JcIiwgXCJlbmRcIilcclxuICAgIC5zZWxlY3RBbGwoXCJnXCIpXHJcbiAgICAuZGF0YShrZXlzLnNsaWNlKCkucmV2ZXJzZSgpKVxyXG4gICAgLmVudGVyKCkuYXBwZW5kKFwiZ1wiKVxyXG4gICAgLy8uYXR0cihcInRyYW5zZm9ybVwiLCBmdW5jdGlvbihkLCBpKSB7IHJldHVybiBcInRyYW5zbGF0ZSgwLFwiICsgaSAqIDIwICsgXCIpXCI7IH0pO1xyXG4gICAuYXR0cihcInRyYW5zZm9ybVwiLCBmdW5jdGlvbihkLCBpKSB7IHJldHVybiBcInRyYW5zbGF0ZSgtNTAsXCIgKyAoMzAwICsgaSAqIDIwKSArIFwiKVwiOyB9KTtcclxuICBcclxuXHJcbiAgdmFyIGtleXMxID0gW1wiT3ZlcmFsbCBUZXJtIEZyZXF1ZW5jeS9PdmVyYWxsIFJlbGV2YW5jZVwiLCBcIkVzdGltYXRlZCBUZXJtIGZyZXF1ZW5jeSB3aXRoaW4gdGhlIHNlbGVjdGVkIHRvcGljXCJdO1xyXG4gIHZhciBzdmcxID0gZDMuc2VsZWN0KFwiI2xlZ2VuZFRcIikuYXBwZW5kKFwic3ZnXCIpLmF0dHIoXCJ3aWR0aFwiLCA1MDApLmF0dHIoXCJoZWlnaHRcIiwgaGVpZ2h0KS5hdHRyKFwiaWRcIixcImxlZ2VuZHN2Z1wiKVxyXG52YXIgbGVnZW5kID0gc3ZnMS5hcHBlbmQoXCJnXCIpLmF0dHIoXCJmb250LWZhbWlseVwiLCBcInNhbnMtc2VyaWZcIikuYXR0cihcImZvbnQtc2l6ZVwiLCAxMCkuYXR0cihcInRleHQtYW5jaG9yXCIsIFwiZW5kXCIpLnNlbGVjdEFsbChcImdcIikuZGF0YShrZXlzMS5zbGljZSgpLnJldmVyc2UoKSkuZW50ZXIoKS5hcHBlbmQoXCJnXCIpIC8vLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgZnVuY3Rpb24oZCwgaSkgeyByZXR1cm4gXCJ0cmFuc2xhdGUoMCxcIiArIGkgKiAyMCArIFwiKVwiOyB9KTtcclxuICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIGZ1bmN0aW9uIChkLCBpKSB7XHJcbiAgICAgIHJldHVybiBcInRyYW5zbGF0ZSgtNTAsXCIgKyAoMCArIGkgKiAyMCkgKyBcIilcIjtcclxuICAgIH0pO1xyXG4gIGxlZ2VuZC5hcHBlbmQoXCJyZWN0XCIpLmF0dHIoXCJ4XCIsIHdpZHRoKVxyXG4gIC5hdHRyKFwid2lkdGhcIiwgZnVuY3Rpb24gKGQsIGkpe1xyXG4gICAgICBpZihpPT0wKXtcclxuICAgICAgICByZXR1cm4gNjA7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIDE2MDtcclxuICB9KS5hdHRyKFwiaGVpZ2h0XCIsIDE5KS5hdHRyKFwiZmlsbFwiLCB6KTtcclxuXHJcbiAgbGVnZW5kLmFwcGVuZChcInRleHRcIikuYXR0cihcInhcIiwgd2lkdGggLSAxMCkuYXR0cihcInlcIiwgMTgpLmF0dHIoXCJkeVwiLCBcIjAuMGVtXCIpLnRleHQoZnVuY3Rpb24gKGQpIHtcclxuICAgIHJldHVybiBkO1xyXG4gIH0pO1xyXG4gIFxyXG59IiwiZnVuY3Rpb24gZ2VuZXJhdGVUb3BpY1ZlY3RvcnMoKXtcclxuICAgIHdpbmRvdy50b3BpY1ZlY3RvcnMgPSB7fTtcclxuICAgIGlmKHdpbmRvdy50b3BpY193b3JkX3Byb2JhYmlsaXR5X2luX3RvcGljKXtcclxuICAgICAgICBmb3IodmFyIHggaW4gd2luZG93LnRvcGljX3dvcmRfcHJvYmFiaWxpdHlfaW5fdG9waWMpe1xyXG4gICAgICAgICAgICB2YXIgdmVjdG9yID0gW107XHJcbiAgICAgICAgICAgIGZvcih2YXIgeSBpbiB3aW5kb3cudG9waWNfd29yZF9wcm9iYWJpbGl0eV9pbl90b3BpY1t4XSl7XHJcbiAgICAgICAgICAgICAgICB2ZWN0b3IucHVzaCh3aW5kb3cudG9waWNfd29yZF9wcm9iYWJpbGl0eV9pbl90b3BpY1t4XVt5XSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgd2luZG93LnRvcGljVmVjdG9yc1t4XSA9IHZlY3RvcjtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdlbmVyYXRlUGFyYWxsZWxDb29yZGluYXRlRGF0YShyZXNwb25zZSwgdG9waWNfdGhyZXNob2xkLCB3b3JkX3RocmVzaG9sZCl7XHJcbiAgICBsZXQgdmlzRGF0YSA9IFtdO1xyXG4gICAgZm9yICh2YXIgZG9jS2V5IGluIHJlc3BvbnNlW1wiZG9jdW1lbnRfdG9waWNcIl0pe1xyXG4gICAgICAgIGZvcih2YXIgdG9waWMgaW4gcmVzcG9uc2VbXCJkb2N1bWVudF90b3BpY1wiXVtkb2NLZXldKXtcclxuICAgICAgICAgICAgbGV0IHRvcGljU2NvcmUgPSByZXNwb25zZVtcImRvY3VtZW50X3RvcGljXCJdW2RvY0tleV1bdG9waWNdO1xyXG4gICAgICAgICAgICBpZiAodG9waWNTY29yZSA+IHRvcGljX3RocmVzaG9sZCl7XHJcblxyXG4gICAgICAgICAgICAgICAgZm9yKHZhciB3b3JkIGluIHJlc3BvbnNlW1widG9waWNfd29yZFwiXVt0b3BpY10pe1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCB3b3JkU2NvcmUgPSByZXNwb25zZVtcInRvcGljX3dvcmRcIl1bdG9waWNdW3dvcmRdO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICh3b3JkU2NvcmUgPiB3b3JkX3RocmVzaG9sZCl7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZpc0RhdGEucHVzaCh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIm5hbWVcIjogZG9jS2V5LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJkb2N1bWVudFwiOiAgZG9jS2V5LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJ0b3BpY1wiOiB0b3BpYyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwid29yZFwiOiByZXNwb25zZVtcIm92ZXJhbGxfd29yZFwiXVt3b3JkXVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIHZpc0RhdGE7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdlbmVyYXRlUGFyYWxsZWxDb29yZGluYXRlRGF0YUhDKHJlc3BvbnNlLCB0b3BpY190aHJlc2hvbGQsIHdvcmRfdGhyZXNob2xkKXtcclxuICAgIGxldCB2aXNEYXRhID0gW107XHJcbiAgICBmb3IgKHZhciBkb2NLZXkgaW4gcmVzcG9uc2VbXCJkb2N1bWVudF90b3BpY1wiXSl7XHJcbiAgICAgICAgZm9yKHZhciB0b3BpYyBpbiByZXNwb25zZVtcImRvY3VtZW50X3RvcGljXCJdW2RvY0tleV0pe1xyXG4gICAgICAgICAgICBsZXQgdG9waWNTY29yZSA9IHJlc3BvbnNlW1wiZG9jdW1lbnRfdG9waWNcIl1bZG9jS2V5XVt0b3BpY107XHJcbiAgICAgICAgICAgIGlmICh0b3BpY1Njb3JlID4gdG9waWNfdGhyZXNob2xkKXtcclxuXHJcbiAgICAgICAgICAgICAgICBmb3IodmFyIHdvcmQgaW4gcmVzcG9uc2VbXCJ0b3BpY193b3JkXCJdW3RvcGljXSl7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IHdvcmRTY29yZSA9IHJlc3BvbnNlW1widG9waWNfd29yZFwiXVt0b3BpY11bd29yZF07XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHdvcmRTY29yZSA+IHdvcmRfdGhyZXNob2xkKXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmlzRGF0YS5wdXNoKFtwYXJzZUludChkb2NLZXkpLCBwYXJzZUludCh0b3BpYyksIHJlc3BvbnNlW1wid29yZHNcIl0uaW5kZXhPZih3b3JkKV0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdmlzRGF0YTtcclxufVxyXG5cclxuXHJcbiIsIndpbmRvdy52dWVBcHAgPSBuZXcgVnVlKHtcclxuICAgIGVsOiAnI3Z1ZS1hcHAnLFxyXG4gICAgZGF0YToge1xyXG4gICAgICAgIG1lc3NhZ2U6ICdIZWxsbyB1c2VyIScsXHJcbiAgICAgICAgbm9uZVNlbGVjdGVkOiB0cnVlLFxyXG4gICAgICAgIHNlbGVjdGVkUGFnZTogNSxcclxuICAgICAgICBwbGF5ZXJEZXRhaWw6IHtcclxuICAgICAgICAgICAgbmFtZTogXCI8UGxheWVyIE5hbWU+XCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIG92ZXJ2aWV3RmlsdGVyczoge30sXHJcbiAgICAgICAgbmV3RG9jczogW10sXHJcbiAgICAgICAgc2VsZWN0ZWRNYXA6IDEsXHJcbiAgICAgICAgc3VjY2VzczogZmFsc2UsXHJcbiAgICAgICAgbG9hZGluZzogZmFsc2UsXHJcbiAgICAgICAgbmV3RG9jOiAnJyxcclxuICAgICAgICBuZXdEb2NzUHJvY2Nlc3NlZDogJycsXHJcbiAgICAgICAgc2hvd1Byb2Nlc3NlZDogZmFsc2UsXHJcbiAgICAgICAgc2V0dGluZ3M6IHtcclxuICAgICAgICAgICAgc2VsZWN0ZWRNZXRob2Q6IFwiTERBXCIsXHJcbiAgICAgICAgICAgIHNlbGVjdGVkRGF0YXNldDogMCxcclxuICAgICAgICAgICAgc3RhcnQxOiAwLCAgICAgIC8vSGFwcHlEQlxyXG4gICAgICAgICAgICBlbmQxOiAxMCwgICAgICAgIC8vSGFwcHlEQlxyXG4gICAgICAgICAgICBzdGFydDI6IDAsICAgICAgLy9NZWRpdW1cclxuICAgICAgICAgICAgZW5kMjogNSwgICAgICAgIC8vTWVkaXVtXHJcbiAgICAgICAgICAgIGxkYVRvcGljVGhyZXNob2xkOiAwLFxyXG4gICAgICAgICAgICB3b3JkMlZlY1RocmVzaG9sZDogMFxyXG4gICAgICAgIH1cclxuICAgIH0sXHJcbiAgICBtZXRob2RzOiB7XHJcbiAgICAgICAgc2VsZWN0UGFnZTogZnVuY3Rpb24oeCl7XHJcbiAgICAgICAgICAgIHRoaXMuc2VsZWN0ZWRQYWdlID0geDtcclxuICAgICAgICAgICAgaWYgKHggPT0gMSl7XHJcbiAgICAgICAgICAgICAgICBpbml0UGFnZTEod2luZG93Lmdsb2JhbF9kYXRhKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoeCA9PSAyKXtcclxuICAgICAgICAgICAgICAgIGluaXRQYWdlMih3aW5kb3cuZ2xvYmFsX2RhdGEpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICh4ID09IDMpe1xyXG4gICAgICAgICAgICAgICAgaW5pdFBhZ2UzKHdpbmRvdy5nbG9iYWxfZGF0YSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKHggPT0gNCl7XHJcbiAgICAgICAgICAgICAgICBpbml0UGFnZTQod2luZG93Lmdsb2JhbF9kYXRhKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgYWRkTmV3RG9jOiBmdW5jdGlvbigpe1xyXG4gICAgICAgICAgICBpZiAodGhpcy5uZXdEb2MudHJpbSgpLnNwbGl0KFwiIFwiKS5sZW5ndGggPCAzKXtcclxuICAgICAgICAgICAgICAgIGFsZXJ0KFwiUGxlYXNlIGFkZCBhdCBsZWFzdCAzIHdvcmRzXCIpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMubmV3RG9jcy5wdXNoKHRoaXMubmV3RG9jKTtcclxuICAgICAgICAgICAgdGhpcy5uZXdEb2MgPSAnJztcclxuICAgICAgICAgICAgdGhpcy5zaG93UHJvY2Vzc2VkID0gZmFsc2U7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBwcm9jZXNzRG9jczogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcbiAgICAgICAgICAgIGdldFRva2VuaXplZERvY3ModGhpcy5uZXdEb2NzLCBmdW5jdGlvbihyZXNwKXtcclxuICAgICAgICAgICAgICAgIHNlbGYubmV3RG9jc1Byb2NjZXNzZWQgPSByZXNwO1xyXG4gICAgICAgICAgICAgICAgc2VsZi5zaG93UHJvY2Vzc2VkID0gdHJ1ZTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBzYXZlQ2hhbmdlczogZnVuY3Rpb24oKXtcclxuICAgICAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xyXG4gICAgICAgICAgICBzZWxmLnN1Y2Nlc3MgPSBmYWxzZTtcclxuICAgICAgICAgICAgc2VsZi5mYWlsdXJlID0gZmFsc2U7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLnNldHRpbmdzLnNlbGVjdGVkRGF0YXNldCA9PSAwKXtcclxuICAgICAgICAgICAgICAgIGlmKHRoaXMuc2V0dGluZ3MuZW5kMSAtIHRoaXMuc2V0dGluZ3Muc3RhcnQxIDwgMTApe1xyXG4gICAgICAgICAgICAgICAgICAgIGFsZXJ0KFwiVGhlcmUgbmVlZHMgdG8gYmUgYXRsZWFzdCA1IGRvY3VtZW50cygmIDw9IDUwKSBmb3IgSGFwcHkgREIuIEFuZCBzdGFydCBpbmRleCBjYW4gbm90IGJlIGdyZWF0ZXIgdGhhbiBlbmQuXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZih0aGlzLnNldHRpbmdzLmVuZDEgLSB0aGlzLnNldHRpbmdzLnN0YXJ0MSA+IDUwKXtcclxuICAgICAgICAgICAgICAgICAgICBhbGVydChcIlRoZXJlIG5lZWRzIHRvIGJlIGxlc3MgdGhhbiA1MCBkb2N1bWVudHMgZm9yIEhhcHB5REIuXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSBlbHNlIGlmICh0aGlzLnNldHRpbmdzLnNlbGVjdGVkRGF0YXNldCA9PSAxKXtcclxuICAgICAgICAgICAgICAgIGlmKHRoaXMuc2V0dGluZ3MuZW5kMiAtIHRoaXMuc2V0dGluZ3Muc3RhcnQyIDwgNSl7XHJcbiAgICAgICAgICAgICAgICAgICAgYWxlcnQoXCJUaGVyZSBuZWVkcyB0byBiZSBhdGxlYXN0IDUgZG9jdW1lbnRzKCYgPD0gMzApIGZvciBNZWRpdW0gQXJ0aWNsZXMuIEFuZCBzdGFydCBpbmRleCBjYW4gbm90IGJlIGdyZWF0ZXIgdGhhbiBlbmQuXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZih0aGlzLnNldHRpbmdzLmVuZDIgLSB0aGlzLnNldHRpbmdzLnN0YXJ0MiA+IDMwKXtcclxuICAgICAgICAgICAgICAgICAgICBhbGVydChcIlRoZXJlIG5lZWRzIHRvIGJlIGxlc3MgdGhhbiAzMCBkb2N1bWVudHMgZm9yIE1lZGl1bSBBcnRpY2xlcy5cIik7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKHRoaXMuc2V0dGluZ3Muc2VsZWN0ZWREYXRhc2V0ID09IDIpe1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghdGhpcy5zaG93UHJvY2Vzc2VkKXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYWxlcnQoXCJQbGVhc2UgcHJvY2VzcyBhbGwgZG9jdW1lbnRzIGZpcnN0XCIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIHdpbmRvdy5kb2N1bWVudHMgPSB0aGlzLm5ld0RvY3NQcm9jY2Vzc2VkO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHNlbGYubG9hZGluZyA9IHRydWU7XHJcblxyXG4gICAgICAgICAgICBnZXRBbmFseXNpcyh0aGlzLnNldHRpbmdzLnNlbGVjdGVkTWV0aG9kLCBmdW5jdGlvbihyZXNwKXtcclxuICAgICAgICAgICAgICAgIHNlbGYuc3VjY2VzcyA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICBzZWxmLmxvYWRpbmcgPSBmYWxzZTtcclxuICAgICAgICAgICAgfSwgZnVuY3Rpb24gKGVycm9yU3RhdHVzKSB7XHJcbiAgICAgICAgICAgICAgICBzZWxmLmxvYWRpbmcgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgIHNlbGYuZmFpbHVyZSA9IHRydWU7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcbiAgICBtb3VudGVkOiBmdW5jdGlvbigpe1xyXG4gICAgICAgIGNvbnNvbGUubG9nKFwiTW91bnRlZFwiKTtcclxuICAgICAgICBsb2FkRDMoKTtcclxuICAgICAgICBsb2FkSnF1ZXJ5KCk7XHJcbiAgICB9XHJcbn0pOyIsImZ1bmN0aW9uIGxvYWRXb3JkQ2xvdWQocmVzcCl7XHJcbiAgICBsZXQgZGF0YSA9IFtdO1xyXG4gICAgZm9yKHZhciB3b3JkIGluIHJlc3BbXCJvdmVyYWxsX3dvcmRcIl0pe1xyXG4gICAgICAgIGxldCB3ZWlnaHQgPSByZXNwW1wib3ZlcmFsbF93b3JkXCJdW3dvcmRdO1xyXG4gICAgICAgICBkYXRhLnB1c2goe1xyXG4gICAgICAgICAgICBuYW1lOiB3b3JkLFxyXG4gICAgICAgICAgICB3ZWlnaHQ6IHdlaWdodFxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG4gICAgY3JlYXRlV29yZENsb3VkKFwib3ZlcmFsbC13Y1wiLCBkYXRhLCBcIkFsbCBEb2N1bWVudHNcIik7XHJcblxyXG4gICAgZm9yKHZhciB0b3BpYyBpbiByZXNwW1widG9waWNfd29yZFwiXSl7XHJcbiAgICAgICAgbGV0IGRhdGEgPSBbXTtcclxuICAgICAgICBmb3IodmFyIHdvcmQgaW4gcmVzcFtcInRvcGljX3dvcmRcIl1bdG9waWNdKXtcclxuICAgICAgICAgICAgbGV0IHdlaWdodCA9IHJlc3BbXCJ0b3BpY193b3JkXCJdW3RvcGljXVt3b3JkXTtcclxuICAgICAgICAgICAgZGF0YS5wdXNoKHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IHdvcmQsXHJcbiAgICAgICAgICAgICAgICB3ZWlnaHQ6IHdlaWdodFxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgJChcIiN0b3BpYy13Y3NcIikuYXBwZW5kKCc8ZGl2IGNsYXNzPVwiY29sLXNtLTZcIj48ZGl2IHN0eWxlPVwib3V0bGluZTogc29saWQgMXB4O1wiIGlkPVwidG9waWMnK3RvcGljKydcIiBzdHlsZT1cImhlaWdodDogMzAwcHg7XCI+PC9kaXY+PC9kaXY+Jyk7XHJcbiAgICAgICAgY3JlYXRlV29yZENsb3VkKFwidG9waWNcIit0b3BpYywgZGF0YSwgXCJUb3BpYyBcIit0b3BpYyk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGNyZWF0ZVdvcmRDbG91ZChpZCwgZGF0YSwgdGl0bGUpe1xyXG4gICAgSGlnaGNoYXJ0cy5jaGFydChpZCwge1xyXG4gICAgICAgIHNlcmllczogW3tcclxuICAgICAgICAgICAgdHlwZTogJ3dvcmRjbG91ZCcsXHJcbiAgICAgICAgICAgIGRhdGE6IGRhdGEsXHJcbiAgICAgICAgICAgIHJvdGF0aW9uOiB7XHJcbiAgICAgICAgICAgICAgICBmcm9tOiAwLFxyXG4gICAgICAgICAgICAgICAgdG86IDAsXHJcbiAgICAgICAgICAgICAgICBvcmllbnRhdGlvbnM6IDVcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgbmFtZTogJ1Njb3JlJ1xyXG4gICAgICAgIH1dLFxyXG4gICAgICAgIHRpdGxlOiB7XHJcbiAgICAgICAgICAgIHRleHQ6IHRpdGxlXHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn0iXX0=
