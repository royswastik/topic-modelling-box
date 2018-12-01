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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNsdXN0ZXJfZm9yY2VfbGF5b3V0LmpzIiwiZXZlbnRzLmpzIiwibWFpbi5qcyIsIm5ldHdvcmsuanMiLCJwYXJhbGxlbC1jb29yZGluYXRlLWhjLmpzIiwicGFyYWxsZWwtY29vcmRpbmF0ZS5qcyIsInNjYXR0ZXJfcGxvdF93aXRoX3dlaWdodHMuanMiLCJzdGFja2VkX2Jhcl9ncmFwaC5qcyIsInV0aWwuanMiLCJ2dWVfbW9kZWwuanMiLCJ3b3JkY2xvdWQuanMiXSwibmFtZXMiOlsiQXJyYXkiLCJwcm90b3R5cGUiLCJjb250YWlucyIsInYiLCJpIiwibGVuZ3RoIiwidW5pcXVlIiwiYXJyIiwiaW5jbHVkZXMiLCJwdXNoIiwicmVuZGVyQ2x1c3RlckZvcmNlTGF5b3V0IiwiZGF0YSIsImRhdGFWYWwiLCJmaW5hbF9kaWN0Iiwia2V5IiwiaGFzT3duUHJvcGVydHkiLCJjaGlsZHJlbldvcmRzIiwiY2hpbGRLZXkiLCJjbHVzdGVyX2RhdGEiLCJjb3VudCIsImhhc2giLCJhcnJheV9jaGlsZCIsImNoaWxkcyIsImNoaWxkX2hhc2giLCJjaGlsZHJlbiIsImQzIiwid2luZG93IiwiZDNWMyIsInJlbmRlckNsdXN0ZXIiLCJyYWRpdXMiLCJkZW5kb2dyYW1Db250YWluZXIiLCJkZW5kb2dyYW1EYXRhU291cmNlIiwicm9vdE5vZGVTaXplIiwibGV2ZWxPbmVOb2RlU2l6ZSIsImxldmVsVHdvTm9kZVNpemUiLCJsZXZlbFRocmVlTm9kZVNpemUiLCJkdXJhdGlvbiIsInJvb3RKc29uRGF0YSIsImNsdXN0ZXIiLCJsYXlvdXQiLCJzaXplIiwic2VwYXJhdGlvbiIsImEiLCJiIiwicGFyZW50IiwiZGVwdGgiLCJkaWFnb25hbCIsInN2ZyIsInJhZGlhbCIsInByb2plY3Rpb24iLCJkIiwieSIsIngiLCJNYXRoIiwiUEkiLCJjb250YWluZXJEaXYiLCJzZWxlY3QiLCJkb2N1bWVudCIsImdldEVsZW1lbnRCeUlkIiwiYXBwZW5kIiwiYXR0ciIsInRleHQiLCJvbiIsImNvbGxhcHNlTGV2ZWxzIiwic3ZnUm9vdCIsImNhbGwiLCJiZWhhdmlvciIsInpvb20iLCJzY2FsZSIsInNjYWxlRXh0ZW50IiwiYW5pbUdyb3VwIiwiZm9yRWFjaCIsImNvbGxhcHNlIiwiY3JlYXRlQ29sbGFwc2libGVEZW5kcm9HcmFtIiwic291cmNlIiwibm9kZXMiLCJwYXRobGlua3MiLCJsaW5rcyIsIm5vZGUiLCJzZWxlY3RBbGwiLCJpZCIsIm5vZGVFbnRlciIsImVudGVyIiwidG9nZ2xlQ2hpbGRyZW4iLCJhbGlhcyIsIm5hbWUiLCJub2RlVXBkYXRlIiwidHJhbnNpdGlvbiIsInN0eWxlIiwiY29sb3IiLCJvcmRlciIsIm5vZGVFeGl0IiwiZXhpdCIsInJlbW92ZSIsImxpbmsiLCJ0YXJnZXQiLCJpbnNlcnQiLCJvIiwieDAiLCJ5MCIsImNsaWNrVHlwZSIsIl9jaGlsZHJlbiIsInR5cGUiLCJ1bmRlZmluZWQiLCJoaWdobGlnaHROb2RlU2VsZWN0aW9ucyIsImhpZ2hsaWdodFJvb3RUb05vZGVQYXRoIiwiaGlnaGxpZ2h0TGlua0NvbG9yIiwiZGVmYXVsdExpbmtDb2xvciIsIm5vZGVDb2xvciIsInBhdGhMaW5rcyIsImRkIiwiYW5jZXN0b3JzIiwiXyIsImlzVW5kZWZpbmVkIiwibWF0Y2hlZExpbmtzIiwiZmlsdGVyIiwiYW55IiwicCIsImVhY2giLCJhbmltYXRlQ2hhaW5zIiwiY2xhc3NlZCIsIm92ZXJsYXlCb3giLCJnZXRCQm94IiwiZXZlbnQiLCJ0cmFuc2xhdGUiLCJjaGVja0ZvclRoaXJkTGV2ZWxPcGVuQ2hpbGRyZW4iLCJ0b2dnbGVBbGxTZWNvbmRMZXZlbENoaWxkcmVuIiwidG9nZ2xlU2Vjb25kTGV2ZWxDaGlsZHJlbiIsInJvb3RJbmRleCIsInJvb3RMZW5ndGgiLCJpc05vZGVPcGVuIiwiY2hpbGRJbmRleCIsImNoaWxkTGVuZ3RoIiwic2Vjb25kTGV2ZWxDaGlsZCIsImxvYWRKcXVlcnkiLCIkIiwicmVhZHkiLCJjbGljayIsInNpZGViYXIiLCJyZXF1aXJlIiwiY29uZmlnIiwicGF0aHMiLCJsb2FkRDMiLCJkM09sZCIsImRvY3VtZW50cyIsImdldEFuYWx5c2lzIiwiZ2V0RG9jcyIsInRleHRzIiwibWFwIiwic3BsaXQiLCJtZXRob2QiLCJzdWNjZXNzIiwiZmFpbCIsImRvY3MiLCJmbmMiLCJnZXRMREFDbHVzdGVycyIsImdldFdvcmQyVmVjQ2x1c3RlcnMiLCJsb2FkREZ1bmMiLCJyZXNwIiwiZ2xvYmFsX2RhdGEiLCJpbml0UGFnZTEiLCJpbml0UGFnZTIiLCJpbml0UGFnZTMiLCJpbml0UGFnZTQiLCJsb2FkVmlzdWFsaXphdGlvbnMiLCJyZW5kZXJDbHVzdGVyQW5hbHlzaXMiLCJodG1sIiwibG9hZFBhcmFsbGVsQ29vcmRpbmF0ZSIsImxvYWRQYXJhbGxlbENvb3JkaW5hdGVzSEMiLCJsb2FkV29yZENsb3VkIiwiZ2V0MkRWZWN0b3JzIiwidmVjdG9ycyIsInN1Y2Nlc3NDYWxsYmFjayIsInJlcXVlc3QiLCJhamF4IiwidXJsIiwiZG9uZSIsInJlc3BvbnNlIiwianFYSFIiLCJ0ZXh0U3RhdHVzIiwiYWxlcnQiLCJnZXRUb2tlbml6ZWREb2NzIiwiZmFpbHVyZUNhbGxiYWNrIiwiSlNPTiIsInN0cmluZ2lmeSIsImNvbnRlbnRUeXBlIiwiZGF0YVR5cGUiLCJzdGFydCIsInZ1ZUFwcCIsInNldHRpbmdzIiwic3RhcnQyIiwiZW5kIiwiZW5kMiIsInNlbGVjdGVkIiwic2VsZWN0ZWREYXRhc2V0IiwicGFyc2UiLCJzdGFydDEiLCJlbmQxIiwiZ2VuZXJhdGVQYXJhbGxlbENvb3JkaW5hdGVEYXRhSEMiLCJIaWdoY2hhcnRzIiwiY2hhcnQiLCJwYXJhbGxlbENvb3JkaW5hdGVzIiwicGFyYWxsZWxBeGVzIiwibGluZVdpZHRoIiwidGl0bGUiLCJwbG90T3B0aW9ucyIsInNlcmllcyIsImFuaW1hdGlvbiIsIm1hcmtlciIsImVuYWJsZWQiLCJzdGF0ZXMiLCJob3ZlciIsImhhbG8iLCJldmVudHMiLCJtb3VzZU92ZXIiLCJncm91cCIsInRvRnJvbnQiLCJ4QXhpcyIsImNhdGVnb3JpZXMiLCJvZmZzZXQiLCJ5QXhpcyIsIk9iamVjdCIsImtleXMiLCJ2YWx1ZXMiLCJjb2xvcnMiLCJzZXQiLCJzaGFkb3ciLCJtYXJnaW4iLCJ0b3AiLCJyaWdodCIsImJvdHRvbSIsImxlZnQiLCJ3aWR0aCIsImhlaWdodCIsIm9yZGluYWwiLCJyYW5nZVBvaW50cyIsImRyYWdnaW5nIiwibGluZSIsImJhY2tncm91bmQiLCJmb3JlZ3JvdW5kIiwiZGltZW5zaW9ucyIsImNhcnMiLCJnZW5lcmF0ZVBhcmFsbGVsQ29vcmRpbmF0ZURhdGEiLCJheGlzRCIsImF4aXMiLCJvcmllbnQiLCJ0aWNrVmFsdWVzIiwicGFyc2VJbnQiLCJheGlzVCIsImF4aXNXIiwicGFyc2VGbG9hdCIsImRvbWFpbiIsImxpbmVhciIsImV4dGVudCIsInJhbmdlIiwicGF0aCIsImciLCJkcmFnIiwib3JpZ2luIiwibWluIiwibWF4Iiwic29ydCIsInBvc2l0aW9uIiwiZGVsYXkiLCJicnVzaCIsImJydXNoc3RhcnQiLCJzb3VyY2VFdmVudCIsInN0b3BQcm9wYWdhdGlvbiIsImFjdGl2ZXMiLCJlbXB0eSIsImV4dGVudHMiLCJldmVyeSIsImRvY3VtZW50X3RvcGljIiwidG9waWNfdmVjdG9ycyIsImJiIiwicXVlcnlTZWxlY3RvciIsImdldEJvdW5kaW5nQ2xpZW50UmVjdCIsInZhbHVlIiwiYyIsImxhYmVsWCIsImxhYmVsWSIsInNjYWxlTGluZWFyIiwic2NhbGVTcXJ0Iiwib3BhY2l0eSIsImF4aXNCb3R0b20iLCJheGlzTGVmdCIsInJlbmRlckJhckdyYXBoIiwiZmFkZSIsImZhZGVPdXQiLCJ0b3BpY19udW1iZXIiLCJmaW5hbF9kYXRhIiwidGVtcCIsIlN0YXRlIiwidG9waWNfZnJlcXVlbmN5IiwiYWJzIiwib3ZlcmFsbCIsInRvdGFsIiwiY29uc29sZSIsImxvZyIsInNjYWxlQmFuZCIsInJhbmdlUm91bmQiLCJwYWRkaW5nSW5uZXIiLCJhbGlnbiIsInoiLCJzY2FsZU9yZGluYWwiLCJuaWNlIiwic3RhY2siLCJiYW5kd2lkdGgiLCJ0aWNrcyIsInBvcCIsImxlZ2VuZCIsInNsaWNlIiwicmV2ZXJzZSIsImtleXMxIiwic3ZnMSIsImdlbmVyYXRlVG9waWNWZWN0b3JzIiwidG9waWNWZWN0b3JzIiwidG9waWNfd29yZF9wcm9iYWJpbGl0eV9pbl90b3BpYyIsInZlY3RvciIsInRvcGljX3RocmVzaG9sZCIsIndvcmRfdGhyZXNob2xkIiwidmlzRGF0YSIsImRvY0tleSIsInRvcGljIiwidG9waWNTY29yZSIsIndvcmQiLCJ3b3JkU2NvcmUiLCJpbmRleE9mIiwiVnVlIiwiZWwiLCJtZXNzYWdlIiwibm9uZVNlbGVjdGVkIiwic2VsZWN0ZWRQYWdlIiwicGxheWVyRGV0YWlsIiwib3ZlcnZpZXdGaWx0ZXJzIiwibmV3RG9jcyIsInNlbGVjdGVkTWFwIiwibG9hZGluZyIsImZhaWx1cmUiLCJuZXdEb2MiLCJuZXdEb2NzUHJvY2Nlc3NlZCIsInNob3dQcm9jZXNzZWQiLCJzZWxlY3RlZE1ldGhvZCIsImxkYVRvcGljVGhyZXNob2xkIiwid29yZDJWZWNUaHJlc2hvbGQiLCJtZXRob2RzIiwic2VsZWN0UGFnZSIsImFkZE5ld0RvYyIsInRyaW0iLCJwcm9jZXNzRG9jcyIsInNlbGYiLCJzYXZlQ2hhbmdlcyIsImVycm9yU3RhdHVzIiwibW91bnRlZCIsIndlaWdodCIsImNyZWF0ZVdvcmRDbG91ZCIsInJvdGF0aW9uIiwiZnJvbSIsInRvIiwib3JpZW50YXRpb25zIl0sIm1hcHBpbmdzIjoiOzs7O0FBQUFBLEtBQUssQ0FBQ0MsU0FBTixDQUFnQkMsUUFBaEIsR0FBMkIsVUFBU0MsQ0FBVCxFQUFZO0FBQ25DLE9BQUksSUFBSUMsQ0FBQyxHQUFHLENBQVosRUFBZUEsQ0FBQyxHQUFHLEtBQUtDLE1BQXhCLEVBQWdDRCxDQUFDLEVBQWpDLEVBQXFDO0FBQ2pDLFFBQUcsS0FBS0EsQ0FBTCxNQUFZRCxDQUFmLEVBQWtCLE9BQU8sSUFBUDtBQUNyQjs7QUFDRCxTQUFPLEtBQVA7QUFDSCxD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QUdMeVYsTUFBQUEsUUFBUSxFQUFFO0FBQ05DLFFBQUFBLElBQUksRUFBRSxDQURBO0FBRU5DLFFBQUFBLEVBQUUsRUFBRSxDQUZFO0FBR05DLFFBQUFBLFlBQVksRUFBRTtBQUhSLE9BSEw7QUFRTGxSLE1BQUFBLElBQUksRUFBRTtBQVJELEtBQUQsQ0FEUztBQVdqQnVILElBQUFBLEtBQUssRUFBRTtBQUNIL0ksTUFBQUEsSUFBSSxFQUFFK0k7QUFESDtBQVhVLEdBQXJCO0FBZUgiLCJmaWxlIjoiYXBwLmpzIiwic291cmNlc0NvbnRlbnQiOlsiQXJyYXkucHJvdG90eXBlLmNvbnRhaW5zID0gZnVuY3Rpb24odikge1xyXG4gICAgZm9yKHZhciBpID0gMDsgaSA8IHRoaXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICBpZih0aGlzW2ldID09PSB2KSByZXR1cm4gdHJ1ZTtcclxuICAgIH1cclxuICAgIHJldHVybiBmYWxzZTtcclxufTtcclxuXHJcbkFycmF5LnByb3RvdHlwZS51bmlxdWUgPSBmdW5jdGlvbigpIHtcclxuICAgIHZhciBhcnIgPSBbXTtcclxuICAgIGZvcih2YXIgaSA9IDA7IGkgPCB0aGlzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgaWYoIWFyci5pbmNsdWRlcyh0aGlzW2ldKSkge1xyXG4gICAgICAgICAgICBhcnIucHVzaCh0aGlzW2ldKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gYXJyOyBcclxufVxyXG5cclxuZnVuY3Rpb24gcmVuZGVyQ2x1c3RlckZvcmNlTGF5b3V0KGRhdGEpe1xyXG5cdHZhciBkYXRhVmFsID0gZGF0YVtcInRvcGljX3dvcmRcIl07XHJcblx0dmFyIGZpbmFsX2RpY3QgPSB7fTtcclxuXHRmb3IgKHZhciBrZXkgaW4gZGF0YVZhbCkge1xyXG5cdCAgICBpZiAoZGF0YVZhbC5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XHJcblxyXG5cdCAgICBcdHZhciBjaGlsZHJlbldvcmRzID0gZGF0YVZhbFtrZXldO1xyXG5cclxuXHQgICAgXHRmb3IodmFyIGNoaWxkS2V5IGluIGNoaWxkcmVuV29yZHMpe1xyXG5cclxuXHQgICAgXHRcdGlmIChjaGlsZHJlbldvcmRzLmhhc093blByb3BlcnR5KGNoaWxkS2V5KSAmJiBjaGlsZHJlbldvcmRzW2NoaWxkS2V5XSA+IDAuMDEpIHtcclxuXHJcblx0ICAgIFx0XHRcdGlmKCEoY2hpbGRLZXkgaW4gZmluYWxfZGljdCkpe1xyXG5cdCAgICBcdFx0XHRcdGZpbmFsX2RpY3RbY2hpbGRLZXldID0gW107XHJcblx0ICAgIFx0XHRcdH1cclxuICAgIFx0XHRcdFx0ZmluYWxfZGljdFtjaGlsZEtleV0ucHVzaChrZXkpO1xyXG5cdCAgICBcdFx0XHRcclxuXHQgICAgXHRcdH1cclxuXHQgICAgXHR9IFxyXG5cdCAgICB9XHJcbiAgXHR9XHJcbiAgXHR2YXIgY2x1c3Rlcl9kYXRhID0ge1xyXG4gIFx0XHRcIm5hbWVcIjpcIlwiLFxyXG4gIFx0XHRcImNoaWxkcmVuXCI6W11cclxuICBcdH1cclxuXHJcbiAgXHR2YXIgY291bnQ9MDtcclxuICBcdGZvcih2YXIga2V5IGluIGZpbmFsX2RpY3Qpe1xyXG4gIFx0XHRpZiAoZmluYWxfZGljdC5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XHJcbiAgXHRcdFx0Y291bnQgPSBjb3VudCArIDE7XHJcbiAgXHRcdFx0dmFyIGhhc2ggPSB7fTtcclxuICBcdFx0XHRoYXNoW1wib3JkZXJcIl0gPSBjb3VudDtcclxuICBcdFx0XHRoYXNoW1wiYWxpYXNcIl0gPSBcIldoaXRlL3JlZC9qYWNrIHBpbmVcIjtcclxuICBcdFx0XHRoYXNoW1wiY29sb3JcIl0gPSBcIiNDN0VBRkJcIjtcclxuICBcdFx0XHRoYXNoW1wibmFtZVwiXSA9IGtleTtcclxuXHJcblxyXG4gIFx0XHRcdHZhciBhcnJheV9jaGlsZCA9IGZpbmFsX2RpY3Rba2V5XS51bmlxdWUoKTtcclxuICBcdFx0XHR2YXIgY2hpbGRzID1bXTtcclxuICBcdFx0XHRmb3IodmFyIGk9MDsgaSA8IGFycmF5X2NoaWxkLmxlbmd0aDtpKyspe1xyXG4gIFx0XHRcdFx0dmFyIGNoaWxkX2hhc2ggPSB7fTtcclxuICBcdFx0XHRcdGNoaWxkX2hhc2hbXCJvcmRlclwiXSA9IGkrMTtcclxuICBcdFx0XHRcdGNoaWxkX2hhc2hbXCJhbGlhc1wiXSA9IGkrMSArIFwiXCI7XHJcbiAgXHRcdFx0XHRjaGlsZF9oYXNoW1wiY29sb3JcIl0gPSBcIiNDN0VBRkJcIjtcclxuICBcdFx0XHRcdGNoaWxkX2hhc2hbXCJuYW1lXCJdPSBhcnJheV9jaGlsZFtpXTtcclxuICBcdFx0XHRcdGNoaWxkcy5wdXNoKGNoaWxkX2hhc2gpO1xyXG4gIFx0XHRcdH1cclxuICBcdFx0XHRoYXNoW1wiY2hpbGRyZW5cIl0gPSBjaGlsZHM7XHJcbiAgXHRcdFx0Y2x1c3Rlcl9kYXRhLmNoaWxkcmVuLnB1c2goaGFzaCk7XHJcbiAgXHRcdH1cclxuICBcdH1cclxuICBcdHZhciBkMyA9ICAgd2luZG93LmQzVjM7XHJcbiAgXHRyZW5kZXJDbHVzdGVyKGNsdXN0ZXJfZGF0YSwgZDMpO1xyXG59XHJcblxyXG5mdW5jdGlvbiByZW5kZXJDbHVzdGVyKGNsdXN0ZXJfZGF0YSwgZDMpe1xyXG4gIHZhciByYWRpdXMgPSAyMDA7XHJcbiAgdmFyIGRlbmRvZ3JhbUNvbnRhaW5lciA9IFwic3BlY2llc2NvbGxhcHNpYmxlXCI7XHJcbiAgdmFyIGRlbmRvZ3JhbURhdGFTb3VyY2UgPSBcImZvcmVzdFNwZWNpZXMuanNvblwiO1xyXG5cclxuICB2YXIgcm9vdE5vZGVTaXplID0gNjtcclxuICB2YXIgbGV2ZWxPbmVOb2RlU2l6ZSA9IDM7XHJcbiAgdmFyIGxldmVsVHdvTm9kZVNpemUgPSAzO1xyXG4gIHZhciBsZXZlbFRocmVlTm9kZVNpemUgPSAyO1xyXG5cclxuXHJcbiAgdmFyIGkgPSAwO1xyXG4gIHZhciBkdXJhdGlvbiA9IDMwMDsgLy9DaGFuZ2luZyB2YWx1ZSBkb2Vzbid0IHNlZW0gYW55IGNoYW5nZXMgaW4gdGhlIGR1cmF0aW9uID8/XHJcblxyXG4gIHZhciByb290SnNvbkRhdGE7XHJcblxyXG4gIHZhciBjbHVzdGVyID0gZDMubGF5b3V0LmNsdXN0ZXIoKVxyXG4gICAgICAuc2l6ZShbMzYwLHJhZGl1cyAtIDEyMF0pXHJcbiAgICAgIC5zZXBhcmF0aW9uKGZ1bmN0aW9uKGEsIGIpIHtcclxuICAgICAgICByZXR1cm4gKGEucGFyZW50ID09IGIucGFyZW50ID8gMSA6IDIpIC8gYS5kZXB0aDtcclxuICAgICAgfSk7XHJcblxyXG4gIHZhciBkaWFnb25hbCA9IGQzLnN2Zy5kaWFnb25hbC5yYWRpYWwoKVxyXG4gICAgICAucHJvamVjdGlvbihmdW5jdGlvbihkKSB7IHJldHVybiBbZC55LCBkLnggLyAxODAgKiBNYXRoLlBJXTsgfSk7XHJcblxyXG4gIHZhciBjb250YWluZXJEaXYgPSBkMy5zZWxlY3QoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoZGVuZG9ncmFtQ29udGFpbmVyKSk7XHJcblxyXG4gIGNvbnRhaW5lckRpdi5hcHBlbmQoXCJidXR0b25cIilcclxuICAgICAgLmF0dHIoXCJpZFwiLFwiY29sbGFwc2UtYnV0dG9uXCIpXHJcbiAgICAgIC50ZXh0KFwiQ29sbGFwc2UhXCIpXHJcbiAgICAgIC5vbihcImNsaWNrXCIsY29sbGFwc2VMZXZlbHMpO1xyXG5cclxuICB2YXIgc3ZnUm9vdCA9IGNvbnRhaW5lckRpdi5hcHBlbmQoXCJzdmc6c3ZnXCIpXHJcbiAgICAgIC5hdHRyKFwid2lkdGhcIiwgXCIxMDAlXCIpXHJcbiAgICAgIC5hdHRyKFwiaGVpZ2h0XCIsIFwiMTAwJVwiKVxyXG4gICAgICAuYXR0cihcInZpZXdCb3hcIiwgXCItXCIgKyAocmFkaXVzKSArIFwiIC1cIiArIChyYWRpdXMgLSA1MCkgK1wiIFwiKyByYWRpdXMqMiArXCIgXCIrIHJhZGl1cyoyKVxyXG4gICAgICAuY2FsbChkMy5iZWhhdmlvci56b29tKCkuc2NhbGUoMC45KS5zY2FsZUV4dGVudChbMC4xLCAzXSkub24oXCJ6b29tXCIsIHpvb20pKS5vbihcImRibGNsaWNrLnpvb21cIiwgbnVsbClcclxuICAgICAgLmFwcGVuZChcInN2ZzpnXCIpO1xyXG5cclxuICAvLyBBZGQgdGhlIGNsaXBwaW5nIHBhdGhcclxuICBzdmdSb290LmFwcGVuZChcInN2ZzpjbGlwUGF0aFwiKS5hdHRyKFwiaWRcIiwgXCJjbGlwcGVyLXBhdGhcIilcclxuICAgICAgLmFwcGVuZChcInN2ZzpyZWN0XCIpXHJcbiAgICAgIC5hdHRyKCdpZCcsICdjbGlwLXJlY3QtYW5pbScpO1xyXG5cclxuICB2YXIgYW5pbUdyb3VwID0gc3ZnUm9vdC5hcHBlbmQoXCJzdmc6Z1wiKVxyXG4gICAgICAuYXR0cihcImNsaXAtcGF0aFwiLCBcInVybCgjY2xpcHBlci1wYXRoKVwiKTtcclxuXHJcbiAgXHRyb290SnNvbkRhdGEgPSBjbHVzdGVyX2RhdGE7XHJcblxyXG4gICAgLy9TdGFydCB3aXRoIGFsbCBjaGlsZHJlbiBjb2xsYXBzZWRcclxuICAgIHJvb3RKc29uRGF0YS5jaGlsZHJlbi5mb3JFYWNoKGNvbGxhcHNlKTtcclxuXHJcbiAgICAvL0luaXRpYWxpemUgdGhlIGRlbmRyb2dyYW1cclxuICBcdGNyZWF0ZUNvbGxhcHNpYmxlRGVuZHJvR3JhbShyb290SnNvbkRhdGEpO1xyXG5cclxuXHJcblxyXG5cclxuICBmdW5jdGlvbiBjcmVhdGVDb2xsYXBzaWJsZURlbmRyb0dyYW0oc291cmNlKSB7XHJcblxyXG4gICAgLy8gQ29tcHV0ZSB0aGUgbmV3IHRyZWUgbGF5b3V0LlxyXG4gICAgdmFyIG5vZGVzID0gY2x1c3Rlci5ub2Rlcyhyb290SnNvbkRhdGEpO1xyXG4gICAgdmFyIHBhdGhsaW5rcyA9IGNsdXN0ZXIubGlua3Mobm9kZXMpO1xyXG5cclxuICAgIC8vIE5vcm1hbGl6ZSBmb3Igbm9kZXMnIGZpeGVkLWRlcHRoLlxyXG4gICAgbm9kZXMuZm9yRWFjaChmdW5jdGlvbihkKSB7XHJcbiAgICAgIGlmKGQuZGVwdGggPD0yKXtcclxuICAgICAgICBkLnkgPSBkLmRlcHRoKjcwO1xyXG4gICAgICB9ZWxzZVxyXG4gICAgICB7XHJcbiAgICAgICAgZC55ID0gZC5kZXB0aCoxMDA7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIC8vIFVwZGF0ZSB0aGUgbm9kZXPigKZcclxuICAgIHZhciBub2RlID0gc3ZnUm9vdC5zZWxlY3RBbGwoXCJnLm5vZGVcIilcclxuICAgICAgICAuZGF0YShub2RlcywgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5pZCB8fCAoZC5pZCA9ICsraSk7IH0pO1xyXG5cclxuICAgIC8vIEVudGVyIGFueSBuZXcgbm9kZXMgYXQgdGhlIHBhcmVudCdzIHByZXZpb3VzIHBvc2l0aW9uLlxyXG4gICAgdmFyIG5vZGVFbnRlciA9IG5vZGUuZW50ZXIoKS5hcHBlbmQoXCJnXCIpXHJcbiAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcIm5vZGVcIilcclxuICAgICAgICAub24oXCJjbGlja1wiLCB0b2dnbGVDaGlsZHJlbik7XHJcblxyXG4gICAgbm9kZUVudGVyLmFwcGVuZChcImNpcmNsZVwiKTtcclxuXHJcbiAgICBub2RlRW50ZXIuYXBwZW5kKFwidGV4dFwiKVxyXG4gICAgLmF0dHIoXCJ4XCIsIDEwKVxyXG4gICAgLmF0dHIoXCJkeVwiLCBcIi4zNWVtXCIpXHJcbiAgICAuYXR0cihcInRleHQtYW5jaG9yXCIsIFwic3RhcnRcIilcclxuICAgIC50ZXh0KGZ1bmN0aW9uKGQpIHtcclxuICAgICAgICAgIGlmKGQuZGVwdGggPT09IDIpe1xyXG4gICAgICAgICAgICByZXR1cm4gZC5hbGlhcztcclxuICAgICAgICAgIH1cclxuICAgICAgICAgcmV0dXJuIGQubmFtZTtcclxuICAgIH0pO1xyXG5cclxuXHJcbiAgICAvLyBUcmFuc2l0aW9uIG5vZGVzIHRvIHRoZWlyIG5ldyBwb3NpdGlvbi5cclxuICAgIHZhciBub2RlVXBkYXRlID0gbm9kZS50cmFuc2l0aW9uKClcclxuICAgICAgICAuZHVyYXRpb24oZHVyYXRpb24pXHJcbiAgICAgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4gXCJyb3RhdGUoXCIgKyAoZC54IC0gOTApICsgXCIpdHJhbnNsYXRlKFwiICsgZC55ICsgXCIpXCI7IH0pXHJcblxyXG4gICAgbm9kZVVwZGF0ZS5zZWxlY3QoXCJjaXJjbGVcIilcclxuICAgICAgICAuYXR0cihcInJcIiwgZnVuY3Rpb24oZCl7XHJcbiAgICAgICAgICAgIGlmIChkLmRlcHRoID09IDApIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiByb290Tm9kZVNpemU7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIGVsc2UgaWYgKGQuZGVwdGggPT09IDEpIHtcclxuICAgICAgICAgICAgICAgICAgcmV0dXJuIGxldmVsT25lTm9kZVNpemU7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIGVsc2UgaWYgKGQuZGVwdGggPT09IDIpIHtcclxuICAgICAgICAgICAgICAgICAgcmV0dXJuIGxldmVsVHdvTm9kZVNpemU7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICByZXR1cm4gbGV2ZWxUaHJlZU5vZGVTaXplO1xyXG5cclxuICAgICAgICB9KVxyXG4gICAgICAgIC5zdHlsZShcImZpbGxcIiwgZnVuY3Rpb24oZCkge1xyXG4gICAgICAgICAgICAgICBpZihkLmRlcHRoID09PTApe1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIFwiIzgwODA4MFwiO1xyXG4gICAgICAgICAgICAgICB9ZWxzZSBpZihkLmRlcHRoID09PSAxKXtcclxuICAgICAgICAgICAgICAgIGlmKGQubmFtZT09XCJIYXJkd29vZHNcIikgcmV0dXJuIFwiIzgxNjg1NFwiO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIFwiI0MzQjlBMFwiO1xyXG4gICAgICAgICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgICAgIHJldHVybiBkLmNvbG9yO1xyXG4gICAgICAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuICAgICAgICAuc3R5bGUoXCJzdHJva2VcIixmdW5jdGlvbihkKXtcclxuICAgICAgICAgICAgICBpZihkLmRlcHRoPjEpe1xyXG4gICAgICAgICAgICAgICAgICByZXR1cm4gXCJ3aGl0ZVwiO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICBlbHNle1xyXG4gICAgICAgICAgICAgICAgICByZXR1cm4gXCJsaWdodGdyYXlcIjtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgbm9kZVVwZGF0ZS5zZWxlY3QoXCJ0ZXh0XCIpXHJcblxyXG4gICAgICAgIC5hdHRyKCdpZCcsIGZ1bmN0aW9uKGQpe1xyXG4gICAgICAgICAgdmFyIG9yZGVyID0gMDtcclxuICAgICAgICAgIGlmKGQub3JkZXIpb3JkZXIgPSBkLm9yZGVyO1xyXG4gICAgICAgICAgcmV0dXJuICdULScgKyBkLmRlcHRoICsgXCItXCIgKyBvcmRlcjtcclxuICAgICAgICB9KVxyXG4gICAgICAgIC5hdHRyKFwidGV4dC1hbmNob3JcIiwgZnVuY3Rpb24gKGQpIHtcclxuICAgICAgICAgICAgaWYgKGQuZGVwdGggPT09IDEpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBkLnggPCAxODAgPyBcImVuZFwiIDogXCJzdGFydFwiO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBkLnggPCAxODAgPyBcInN0YXJ0XCIgOiBcImVuZFwiO1xyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLmF0dHIoXCJkeVwiLCBmdW5jdGlvbihkKXtcclxuICAgICAgICAgICAgaWYgKGQuZGVwdGggPT09IDEpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBkLnggPCAxODAgPyBcIjEuNGVtXCIgOiBcIi0wLjJlbVwiO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBcIi4zMWVtXCI7XHJcbiAgICAgICAgfSlcclxuICAgICAgICAuYXR0cihcImR4XCIsIGZ1bmN0aW9uIChkKSB7XHJcbiAgICAgICAgICAgIGlmIChkLmRlcHRoID09PSAxKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gMDsgLy9yZXR1cm4gZC54ID4gMTgwID8gMiA6IC0yO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBkLnggPCAxODAgPyAxIDogLTIwO1xyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgZnVuY3Rpb24gKGQpIHtcclxuICAgICAgICAgICAgaWYgKGQuZGVwdGggPCAyKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gXCJyb3RhdGUoXCIgKyAoOTAgLSBkLngpICsgXCIpXCI7XHJcbiAgICAgICAgICAgIH1lbHNlIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBkLnggPCAxODAgPyBudWxsIDogXCJyb3RhdGUoMTgwKVwiO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgLy8gVE9ETzogYXBwcm9wcmlhdGUgdHJhbnNmb3JtXHJcbiAgICB2YXIgbm9kZUV4aXQgPSBub2RlLmV4aXQoKS50cmFuc2l0aW9uKClcclxuICAgICAgICAuZHVyYXRpb24oZHVyYXRpb24pXHJcbiAgICAgICAgLnJlbW92ZSgpO1xyXG5cclxuICAgIC8vIFVwZGF0ZSB0aGUgbGlua3PigKZcclxuICAgIHZhciBsaW5rID0gc3ZnUm9vdC5zZWxlY3RBbGwoXCJwYXRoLmxpbmtcIilcclxuICAgICAgICAuZGF0YShwYXRobGlua3MsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQudGFyZ2V0LmlkOyB9KTtcclxuXHJcbiAgICAvLyBFbnRlciBhbnkgbmV3IGxpbmtzIGF0IHRoZSBwYXJlbnQncyBwcmV2aW91cyBwb3NpdGlvbi5cclxuICAgIGxpbmsuZW50ZXIoKS5pbnNlcnQoXCJwYXRoXCIsIFwiZ1wiKVxyXG4gICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJsaW5rXCIpXHJcbiAgICAgICAgLmF0dHIoXCJkXCIsIGZ1bmN0aW9uKGQpIHtcclxuICAgICAgICAgIHZhciBvID0ge3g6IHNvdXJjZS54MCwgeTogc291cmNlLnkwfTtcclxuICAgICAgICAgIHJldHVybiBkaWFnb25hbCh7c291cmNlOiBvLCB0YXJnZXQ6IG99KTtcclxuICAgICAgICB9KVxyXG4gICAgICAgIC5zdHlsZShcImZpbGxcIixmdW5jdGlvbihkKXtcclxuICAgICAgICAgIHJldHVybiBkLmNvbG9yO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgIC8vIFRyYW5zaXRpb24gbGlua3MgdG8gdGhlaXIgbmV3IHBvc2l0aW9uLlxyXG4gICAgbGluay50cmFuc2l0aW9uKClcclxuICAgICAgICAuZHVyYXRpb24oZHVyYXRpb24pXHJcbiAgICAgICAgLmF0dHIoXCJkXCIsIGRpYWdvbmFsKTtcclxuXHJcbiAgICAvLyBUcmFuc2l0aW9uIGV4aXRpbmcgbm9kZXMgdG8gdGhlIHBhcmVudCdzIG5ldyBwb3NpdGlvbi5cclxuICAgIGxpbmsuZXhpdCgpLnRyYW5zaXRpb24oKVxyXG4gICAgICAgIC5kdXJhdGlvbihkdXJhdGlvbilcclxuICAgICAgICAuYXR0cihcImRcIiwgZnVuY3Rpb24oZCkge1xyXG4gICAgICAgICAgdmFyIG8gPSB7eDogc291cmNlLngsIHk6IHNvdXJjZS55fTtcclxuICAgICAgICAgIHJldHVybiBkaWFnb25hbCh7c291cmNlOiBvLCB0YXJnZXQ6IG99KTtcclxuICAgICAgICB9KVxyXG4gICAgICAgIC5yZW1vdmUoKTtcclxuICB9XHJcblxyXG4gIC8vIFRvZ2dsZSBjaGlsZHJlbiBvbiBjbGljay5cclxuICBmdW5jdGlvbiB0b2dnbGVDaGlsZHJlbihkLGNsaWNrVHlwZSkge1xyXG4gICAgaWYgKGQuY2hpbGRyZW4pIHtcclxuICAgICAgZC5fY2hpbGRyZW4gPSBkLmNoaWxkcmVuO1xyXG4gICAgICBkLmNoaWxkcmVuID0gbnVsbDtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGQuY2hpbGRyZW4gPSBkLl9jaGlsZHJlbjtcclxuICAgICAgZC5fY2hpbGRyZW4gPSBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciB0eXBlID0gdHlwZW9mIGNsaWNrVHlwZSA9PSB1bmRlZmluZWQgPyBcIm5vZGVcIiA6IGNsaWNrVHlwZTtcclxuXHJcbiAgICAvL0FjdGl2aXRpZXMgb24gbm9kZSBjbGlja1xyXG4gICAgY3JlYXRlQ29sbGFwc2libGVEZW5kcm9HcmFtKGQpO1xyXG4gICAgaGlnaGxpZ2h0Tm9kZVNlbGVjdGlvbnMoZCk7XHJcblxyXG4gICAgaGlnaGxpZ2h0Um9vdFRvTm9kZVBhdGgoZCx0eXBlKTtcclxuXHJcbiAgfVxyXG5cclxuICAvLyBDb2xsYXBzZSBub2Rlc1xyXG4gIGZ1bmN0aW9uIGNvbGxhcHNlKGQpIHtcclxuICAgIGlmIChkLmNoaWxkcmVuKSB7XHJcbiAgICAgICAgZC5fY2hpbGRyZW4gPSBkLmNoaWxkcmVuO1xyXG4gICAgICAgIGQuX2NoaWxkcmVuLmZvckVhY2goY29sbGFwc2UpO1xyXG4gICAgICAgIGQuY2hpbGRyZW4gPSBudWxsO1xyXG4gICAgICB9XHJcbiAgfVxyXG5cclxuXHJcbiAgLy8gaGlnaGxpZ2h0cyBzdWJub2RlcyBvZiBhIG5vZGVcclxuICBmdW5jdGlvbiBoaWdobGlnaHROb2RlU2VsZWN0aW9ucyhkKSB7XHJcbiAgICAgIHZhciBoaWdobGlnaHRMaW5rQ29sb3IgPSBcImRhcmtzbGF0ZWdyYXlcIjsvL1wiI2YwM2IyMFwiO1xyXG4gICAgICB2YXIgZGVmYXVsdExpbmtDb2xvciA9IFwibGlnaHRncmF5XCI7XHJcblxyXG4gICAgICB2YXIgZGVwdGggPSAgZC5kZXB0aDtcclxuICAgICAgdmFyIG5vZGVDb2xvciA9IGQuY29sb3I7XHJcbiAgICAgIGlmIChkZXB0aCA9PT0gMSkge1xyXG4gICAgICAgICAgbm9kZUNvbG9yID0gaGlnaGxpZ2h0TGlua0NvbG9yO1xyXG4gICAgICB9XHJcblxyXG4gICAgICB2YXIgcGF0aExpbmtzID0gc3ZnUm9vdC5zZWxlY3RBbGwoXCJwYXRoLmxpbmtcIik7XHJcblxyXG4gICAgICBwYXRoTGlua3Muc3R5bGUoXCJzdHJva2VcIixmdW5jdGlvbihkZCkge1xyXG4gICAgICAgICAgaWYgKGRkLnNvdXJjZS5kZXB0aCA9PT0gMCkge1xyXG4gICAgICAgICAgICAgIGlmIChkLm5hbWUgPT09ICcnKSB7XHJcbiAgICAgICAgICAgICAgICAgIHJldHVybiBoaWdobGlnaHRMaW5rQ29sb3I7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIHJldHVybiBkZWZhdWx0TGlua0NvbG9yO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIGlmIChkZC5zb3VyY2UubmFtZSA9PT0gZC5uYW1lKSB7XHJcbiAgICAgICAgICAgICAgcmV0dXJuIG5vZGVDb2xvcjtcclxuICAgICAgICAgIH1lbHNlIHtcclxuICAgICAgICAgICAgICByZXR1cm4gZGVmYXVsdExpbmtDb2xvcjtcclxuICAgICAgICAgIH1cclxuICAgICAgfSk7XHJcbiAgfVxyXG5cclxuICAvL1dhbGtpbmcgcGFyZW50cycgY2hhaW4gZm9yIHJvb3QgdG8gbm9kZSB0cmFja2luZ1xyXG4gIGZ1bmN0aW9uIGhpZ2hsaWdodFJvb3RUb05vZGVQYXRoKGQsY2xpY2tUeXBlKXtcclxuICAgIHZhciBhbmNlc3RvcnMgPSBbXTtcclxuICAgIHZhciBwYXJlbnQgPSBkO1xyXG4gICAgd2hpbGUgKCFfLmlzVW5kZWZpbmVkKHBhcmVudCkpIHtcclxuICAgICAgICBhbmNlc3RvcnMucHVzaChwYXJlbnQpO1xyXG4gICAgICAgIHBhcmVudCA9IHBhcmVudC5wYXJlbnQ7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gR2V0IHRoZSBtYXRjaGVkIGxpbmtzXHJcbiAgICB2YXIgbWF0Y2hlZExpbmtzID0gW107XHJcblxyXG4gICAgc3ZnUm9vdC5zZWxlY3RBbGwoJ3BhdGgubGluaycpXHJcbiAgICAgICAgLmZpbHRlcihmdW5jdGlvbihkLCBpKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcmV0dXJuIF8uYW55KGFuY2VzdG9ycywgZnVuY3Rpb24ocClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHAgPT09IGQudGFyZ2V0O1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgfSlcclxuICAgICAgICAuZWFjaChmdW5jdGlvbihkKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgbWF0Y2hlZExpbmtzLnB1c2goZCk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgYW5pbWF0ZUNoYWlucyhtYXRjaGVkTGlua3MsY2xpY2tUeXBlKTtcclxuXHJcbiAgICBmdW5jdGlvbiBhbmltYXRlQ2hhaW5zKGxpbmtzLGNsaWNrVHlwZSl7XHJcbiAgICAgIGFuaW1Hcm91cC5zZWxlY3RBbGwoXCJwYXRoLnNlbGVjdGVkXCIpXHJcbiAgICAgICAgICAuZGF0YShbXSlcclxuICAgICAgICAgIC5leGl0KCkucmVtb3ZlKCk7XHJcblxyXG4gICAgICBhbmltR3JvdXAuc2VsZWN0QWxsKFwicGF0aC5zZWxlY3RlZFwiKVxyXG4gICAgICAgICAgLmRhdGEobGlua3MpXHJcbiAgICAgICAgICAuZW50ZXIoKS5hcHBlbmQoXCJzdmc6cGF0aFwiKVxyXG4gICAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcInNlbGVjdGVkXCIpXHJcbiAgICAgICAgICAuYXR0cihcImRcIiwgZGlhZ29uYWwpO1xyXG5cclxuXHJcbiAgICAgIC8vUmVzZXQgcGF0aCBoaWdobGlnaHQgaWYgY29sbGFwc2UgYnV0dG9uIGNsaWNrZWRcclxuICAgICAgaWYoY2xpY2tUeXBlID09ICdidXR0b24nKXtcclxuICAgICAgICBhbmltR3JvdXAuc2VsZWN0QWxsKFwicGF0aC5zZWxlY3RlZFwiKS5jbGFzc2VkKCdyZXNldC1zZWxlY3RlZCcsdHJ1ZSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHZhciBvdmVybGF5Qm94ID0gc3ZnUm9vdC5ub2RlKCkuZ2V0QkJveCgpO1xyXG5cclxuICAgICAgc3ZnUm9vdC5zZWxlY3QoXCIjY2xpcC1yZWN0LWFuaW1cIilcclxuICAgICAgICAgIC5hdHRyKFwieFwiLCAtcmFkaXVzKVxyXG4gICAgICAgICAgLmF0dHIoXCJ5XCIsIC1yYWRpdXMpXHJcbiAgICAgICAgICAuYXR0cihcIndpZHRoXCIsMClcclxuICAgICAgICAgIC5hdHRyKFwiaGVpZ2h0XCIscmFkaXVzKjIpXHJcbiAgICAgICAgICAudHJhbnNpdGlvbigpLmR1cmF0aW9uKGR1cmF0aW9uKVxyXG4gICAgICAgICAgLmF0dHIoXCJ3aWR0aFwiLCByYWRpdXMqMik7XHJcbiAgICB9XHJcblxyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gem9vbSgpIHtcclxuICAgICBzdmdSb290LmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoXCIgKyBkMy5ldmVudC50cmFuc2xhdGUgKyBcIilzY2FsZShcIiArIGQzLmV2ZW50LnNjYWxlICsgXCIpXCIpO1xyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gY29sbGFwc2VMZXZlbHMoKXtcclxuXHJcbiAgICBpZihjaGVja0ZvclRoaXJkTGV2ZWxPcGVuQ2hpbGRyZW4oKSl7XHJcbiAgICAgIHRvZ2dsZUFsbFNlY29uZExldmVsQ2hpbGRyZW4oKTtcclxuICAgIH1lbHNle1xyXG4gICAgIHRvZ2dsZVNlY29uZExldmVsQ2hpbGRyZW4oKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBPcGVuIGZpcnN0IGxldmVsIG9ubHkgYnkgY29sbGFwc2luZyBzZWNvbmQgbGV2ZWxcclxuICAgIGZ1bmN0aW9uIHRvZ2dsZVNlY29uZExldmVsQ2hpbGRyZW4oKXtcclxuICAgICAgZm9yKHZhciByb290SW5kZXggPSAwLCByb290TGVuZ3RoID0gcm9vdEpzb25EYXRhLmNoaWxkcmVuLmxlbmd0aDsgcm9vdEluZGV4PHJvb3RMZW5ndGg7IHJvb3RJbmRleCsrKXtcclxuICAgICAgICAgIGlmKGlzTm9kZU9wZW4ocm9vdEpzb25EYXRhLmNoaWxkcmVuW3Jvb3RJbmRleF0pKXtcclxuICAgICAgICAgICAgICAgdG9nZ2xlQ2hpbGRyZW4ocm9vdEpzb25EYXRhLmNoaWxkcmVuW3Jvb3RJbmRleF0sJ2J1dHRvbicpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gT3BlbiBmaXJzdCBsZXZlbCBvbmx5IGJ5IGNvbGxhcHNpbmcgc2Vjb25kIGxldmVsXHJcbiAgICBmdW5jdGlvbiB0b2dnbGVBbGxTZWNvbmRMZXZlbENoaWxkcmVuKCl7XHJcbiAgICAgIGZvcih2YXIgcm9vdEluZGV4ID0gMCwgcm9vdExlbmd0aCA9IHJvb3RKc29uRGF0YS5jaGlsZHJlbi5sZW5ndGg7IHJvb3RJbmRleDxyb290TGVuZ3RoOyByb290SW5kZXgrKyl7XHJcbiAgICAgICAgaWYoaXNOb2RlT3Blbihyb290SnNvbkRhdGEuY2hpbGRyZW5bcm9vdEluZGV4XSkpe1xyXG5cclxuICAgICAgICAgIGZvcih2YXIgY2hpbGRJbmRleCA9IDAsIGNoaWxkTGVuZ3RoID0gcm9vdEpzb25EYXRhLmNoaWxkcmVuW3Jvb3RJbmRleF0uY2hpbGRyZW4ubGVuZ3RoOyBjaGlsZEluZGV4PGNoaWxkTGVuZ3RoOyBjaGlsZEluZGV4Kyspe1xyXG4gICAgICAgICAgICB2YXIgc2Vjb25kTGV2ZWxDaGlsZCA9IHJvb3RKc29uRGF0YS5jaGlsZHJlbltyb290SW5kZXhdLmNoaWxkcmVuW2NoaWxkSW5kZXhdO1xyXG4gICAgICAgICAgICBpZihpc05vZGVPcGVuKHNlY29uZExldmVsQ2hpbGQpKXtcclxuICAgICAgICAgICAgICB0b2dnbGVDaGlsZHJlbihyb290SnNvbkRhdGEuY2hpbGRyZW5bcm9vdEluZGV4XS5jaGlsZHJlbltjaGlsZEluZGV4XSwnYnV0dG9uJyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIENoZWNrIGlmIGFueSBub2RlcyBvcGVucyBhdCBzZWNvbmQgbGV2ZWxcclxuICAgIGZ1bmN0aW9uIGNoZWNrRm9yVGhpcmRMZXZlbE9wZW5DaGlsZHJlbigpe1xyXG4gICAgICBmb3IodmFyIHJvb3RJbmRleCA9IDAsIHJvb3RMZW5ndGggPSByb290SnNvbkRhdGEuY2hpbGRyZW4ubGVuZ3RoOyByb290SW5kZXg8cm9vdExlbmd0aDsgcm9vdEluZGV4Kyspe1xyXG4gICAgICAgIGlmKGlzTm9kZU9wZW4ocm9vdEpzb25EYXRhLmNoaWxkcmVuW3Jvb3RJbmRleF0pKXtcclxuXHJcbiAgICAgICAgICBmb3IodmFyIGNoaWxkSW5kZXggPSAwLCBjaGlsZExlbmd0aCA9IHJvb3RKc29uRGF0YS5jaGlsZHJlbltyb290SW5kZXhdLmNoaWxkcmVuLmxlbmd0aDsgY2hpbGRJbmRleDxjaGlsZExlbmd0aDsgY2hpbGRJbmRleCsrKXtcclxuXHJcbiAgICAgICAgICAgIHZhciBzZWNvbmRMZXZlbENoaWxkID0gcm9vdEpzb25EYXRhLmNoaWxkcmVuW3Jvb3RJbmRleF0uY2hpbGRyZW5bY2hpbGRJbmRleF07XHJcbiAgICAgICAgICAgIGlmKGlzTm9kZU9wZW4oc2Vjb25kTGV2ZWxDaGlsZCkpe1xyXG4gICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gaXNOb2RlT3BlbihkKXtcclxuICAgICAgaWYoZC5jaGlsZHJlbil7cmV0dXJuIHRydWU7fVxyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuXHJcblxyXG5cclxufVxyXG5cclxuICAiLCJmdW5jdGlvbiBsb2FkSnF1ZXJ5KCl7XHJcbiAgICAkKGRvY3VtZW50KS5yZWFkeShmdW5jdGlvbigpe1xyXG4gICAgICAgICQoXCIjdG9nZ2xlLXNpZGViYXJcIikuY2xpY2soZnVuY3Rpb24oKXtcclxuICAgICAgICAgICAgJCgnLnVpLnNpZGViYXInKVxyXG4gICAgICAgICAgICAgICAgLnNpZGViYXIoJ3RvZ2dsZScpXHJcbiAgICAgICAgICAgIDtcclxuICAgICAgICB9KTtcclxuICAgICAgICBcclxuICAgIH0pO1xyXG59XHJcbiIsInJlcXVpcmUuY29uZmlnKHtcclxuICAgIHBhdGhzOiB7XHJcbiAgICAgICAgXCJkM1wiOiBcImh0dHBzOi8vZDNqcy5vcmcvZDMudjMubWluXCJcclxuICAgIH1cclxufSk7XHJcblxyXG5mdW5jdGlvbiBsb2FkRDMoKXtcclxuXHJcbiAgICB3aW5kb3cuZDNPbGQgPSBkMztcclxuICAgIHJlcXVpcmUoWydkMyddLCBmdW5jdGlvbihkM1YzKSB7XHJcbiAgICAgICAgd2luZG93LmQzVjMgPSBkM1YzO1xyXG4gICAgICAgIHdpbmRvdy5kMyA9IGQzT2xkO1xyXG4gICAgICAgIC8vIHdpbmRvdy5kb2N1bWVudHMgPSBbXHJcbiAgICAgICAgLy8gICAgICAgICAvLyAgIFtcImlcIiwgXCJhbVwiLCBcImJhdG1hblwiLCBcIm9mXCIsIFwid2ludGVyZmFsbFwiXSxcclxuICAgICAgICAvLyAgICAgICAgIC8vICAgW1widGhlcmVcIiwgXCJzaG91bGRcIiwgXCJhbHdheXNcIiwgXCJiZVwiLCBcImFcIiwgXCJzdGFya1wiLCBcImluXCIsIFwid2ludGVyZmVsbFwiXSxcclxuICAgICAgICAvLyAgICAgICAgIC8vICAgW1wicHJvcGhlY3lcIiwgXCJzYXlzXCIsIFwicHJpbmNlXCIsIFwid2lsbFwiLCBcImJlXCIgLCBcInJlYm9yblwiXVxyXG4gICAgICAgIC8vICAgICAgICAgLy8gXTtcclxuICAgICAgICAvLyAgICAgd2luZG93LmRvY3VtZW50cyA9IFtbJ3Byb2plY3QnLCAnY2xhc3NpZmljYXRpb24nLCAnY29tcGFyZScsICduZXVyYWwnLCAnbmV0cycsICdTVk0nLCAnZHVlJywgJ2R1ZSddLCBbJ3R3bycsICduZXcnLCAncHJvZ3Jlc3MnLCAnY2hlY2tzJywgJ2ZpbmFsJywgJ3Byb2plY3QnLCAgJ2Fzc2lnbmVkJywgJ2ZvbGxvd3MnXSwgWydyZXBvcnQnLCAnZ3JhZGVkJywgICdjb250cmlidXRlJywgJ3BvaW50cycsICAndG90YWwnLCAnc2VtZXN0ZXInLCAnZ3JhZGUnXSwgWydwcm9ncmVzcycsICd1cGRhdGUnLCAnZXZhbHVhdGVkJywgJ1RBJywgJ3BlZXJzJ10sIFsnY2xhc3MnLCAnbWVldGluZycsICd0b21vcnJvdycsJ3RlYW1zJywgJ3dvcmsnLCAncHJvZ3Jlc3MnLCAncmVwb3J0JywgJ2ZpbmFsJywgJ3Byb2plY3QnXSwgWyAncXVpeicsICAnc2VjdGlvbnMnLCAncmVndWxhcml6YXRpb24nLCAnVHVlc2RheSddLCBbICdxdWl6JywgJ1RodXJzZGF5JywgJ2xvZ2lzdGljcycsICd3b3JrJywgJ29ubGluZScsICdzdHVkZW50JywgJ3Bvc3Rwb25lJywgICdxdWl6JywgJ1R1ZXNkYXknXSwgWydxdWl6JywgJ2NvdmVyJywgJ1RodXJzZGF5J10sIFsncXVpeicsICdjaGFwJywgJ2NoYXAnLCAnbGluZWFyJywgJ3JlZ3Jlc3Npb24nXV07XHJcbiAgICAgICAgd2luZG93LmRvY3VtZW50cyA9IFtcclxuICAgICAgICAgICAgWydzZXJpb3VzJyxcclxuICAgICAgICAgICAgICAgICAgICAgICd0YWxrJyxcclxuICAgICAgICAgICAgICAgICAgICAgICdmcmllbmRzJyxcclxuICAgICAgICAgICAgICAgICAgICAgICdmbGFreScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAnbGF0ZWx5JyxcclxuICAgICAgICAgICAgICAgICAgICAgICd1bmRlcnN0b29kJyxcclxuICAgICAgICAgICAgICAgICAgICAgICdnb29kJyxcclxuICAgICAgICAgICAgICAgICAgICAgICdldmVuaW5nJyxcclxuICAgICAgICAgICAgICAgICAgICAgICdoYW5naW5nJ10sXHJcbiAgICAgICAgICAgIFsnZ290JywgJ2dpZnQnLCAnZWxkZXInLCAnYnJvdGhlcicsICdyZWFsbHknLCAnc3VycHJpc2luZyddLFxyXG4gICAgICAgICAgICAgICAgICAgICBbJ2NvbXBsZXRlZCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAnNScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAnbWlsZXMnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgJ3J1bicsXHJcbiAgICAgICAgICAgICAgICAgICAgICAnd2l0aG91dCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAnYnJlYWsnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgJ21ha2VzJyxcclxuICAgICAgICAgICAgICAgICAgICAgICdmZWVsJyxcclxuICAgICAgICAgICAgICAgICAgICAgICdzdHJvbmcnXSxcclxuXHJcbiAgICAgICAgICAgIFsnc29uJywgJ3BlcmZvcm1lZCcsICd3ZWxsJywgJ3Rlc3QnLFxyXG4gICAgICAgICAgICAgICAgJ3ByZXBhcmF0aW9uJ11cclxuICAgICAgICAgICAgXTtcclxuXHJcbiAgICAgICAgICAgICAgICBnZXRBbmFseXNpcyhcIkxEQVwiKTtcclxuICAgICAgICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0RG9jcyh0ZXh0cykge1xyXG4gIHJldHVybiB3aW5kb3cuZG9jdW1lbnRzID0gdGV4dHMubWFwKHggPT4geC5zcGxpdCgpKTtcclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0QW5hbHlzaXMobWV0aG9kLCBzdWNjZXNzLCBmYWlsKSB7XHJcbiAgbGV0IGRvY3MgPSB3aW5kb3cuZG9jdW1lbnRzO1xyXG4gIGxldCBmbmMgPSB4ID0+IHg7XHJcbiAgaWYgKG1ldGhvZCA9PT0gXCJMREFcIikge1xyXG4gICAgZm5jID0gZ2V0TERBQ2x1c3RlcnM7XHJcbiAgfSBlbHNlIHtcclxuICAgIGZuYyA9IGdldFdvcmQyVmVjQ2x1c3RlcnM7XHJcbiAgfVxyXG4gIHdpbmRvdy5sb2FkREZ1bmMgPSAgZm5jO1xyXG4gIGZuYyhkb2NzLCByZXNwID0+IHtcclxuICAgICAgd2luZG93Lmdsb2JhbF9kYXRhID0gcmVzcDtcclxuICAgIGluaXRQYWdlMShyZXNwKTtcclxuICAgIGluaXRQYWdlMihyZXNwKTtcclxuICAgIGluaXRQYWdlMyhyZXNwKTtcclxuICAgIGluaXRQYWdlNCgpO1xyXG4gICAgaWYoc3VjY2Vzcyl7XHJcbiAgICAgICAgc3VjY2VzcyhyZXNwKTtcclxuICAgIH1cclxuICB9LCBmYWlsKTtcclxufVxyXG5cclxuZnVuY3Rpb24gbG9hZFZpc3VhbGl6YXRpb25zKCkge1xyXG59XHJcblxyXG5mdW5jdGlvbiBpbml0UGFnZTEocmVzcCkge1xyXG4gIHJlbmRlckNsdXN0ZXJBbmFseXNpcyhyZXNwKTtcclxufVxyXG5cclxuXHJcblxyXG5mdW5jdGlvbiBpbml0UGFnZTIocmVzcCkge1xyXG4gIHJlbmRlckNsdXN0ZXJGb3JjZUxheW91dChyZXNwKTtcclxuXHJcbn1cclxuXHJcbmZ1bmN0aW9uIGluaXRQYWdlMyhyZXNwKXtcclxuICAgICQoXCIjcGFyYWxsZWwtY29vcmRpbmF0ZS12aXNcIikuaHRtbChcIlwiKTtcclxuICAgICQoXCIjcGMtY29udGFpbmVyXCIpLmh0bWwoXCJcIik7XHJcbiAgICBsb2FkUGFyYWxsZWxDb29yZGluYXRlKHJlc3ApO1xyXG4gICAgbG9hZFBhcmFsbGVsQ29vcmRpbmF0ZXNIQyhyZXNwKTtcclxufVxyXG5cclxuZnVuY3Rpb24gaW5pdFBhZ2U0KCl7XHJcbiAgICAkKFwiI292ZXJhbGwtd2NcIikuaHRtbCgpO1xyXG4gICAgbG9hZFdvcmRDbG91ZCh3aW5kb3cuZ2xvYmFsX2RhdGEpO1xyXG59IiwiLy92ZWN0b3JzIGZvcm1hdDogTWFwW3N0cmluZyh0b3BpY19pZCk6IExpc3RbZmxvYXRdXVxyXG5mdW5jdGlvbiBnZXQyRFZlY3RvcnModmVjdG9ycywgc3VjY2Vzc0NhbGxiYWNrKXtcclxuICAgIHZhciByZXF1ZXN0ID0gJC5hamF4KHtcclxuICAgICAgICB1cmw6IFwiL2dldDJEVmVjdG9yc1wiLFxyXG4gICAgICAgIG1ldGhvZDogXCJQT1NUXCIsXHJcbiAgICAgICAgZGF0YTogdmVjdG9yc1xyXG4gICAgICB9KTtcclxuICAgICAgIFxyXG4gICAgICByZXF1ZXN0LmRvbmUoZnVuY3Rpb24oIHJlc3BvbnNlICkge1xyXG4gICAgICAgIHN1Y2Nlc3NDYWxsYmFjayhyZXNwb25zZSk7XHJcbiAgICAgIH0pO1xyXG4gICAgICAgXHJcbiAgICAgIHJlcXVlc3QuZmFpbChmdW5jdGlvbigganFYSFIsIHRleHRTdGF0dXMgKSB7XHJcbiAgICAgICAgYWxlcnQoIFwiUmVxdWVzdCBmYWlsZWQ6IFwiICsgdGV4dFN0YXR1cyApO1xyXG4gICAgICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0VG9rZW5pemVkRG9jcyhkb2NzLCBzdWNjZXNzQ2FsbGJhY2ssIGZhaWx1cmVDYWxsYmFjayl7XHJcbiAgICB2YXIgcmVxdWVzdCA9ICQuYWpheCh7XHJcbiAgICAgICAgdXJsOiBcIi9nZXREb2NzRnJvbVRleHRzXCIsXHJcbiAgICAgICAgbWV0aG9kOiBcIlBPU1RcIixcclxuICAgICAgICBkYXRhOiBKU09OLnN0cmluZ2lmeSh7ZG9jczogZG9jc30pLFxyXG4gICAgICAgIGNvbnRlbnRUeXBlOiBcImFwcGxpY2F0aW9uL2pzb247IGNoYXJzZXQ9dXRmLThcIixcclxuICAgICAgICBkYXRhVHlwZSAgIDogXCJqc29uXCJcclxuICAgICAgfSk7XHJcblxyXG4gICAgICByZXF1ZXN0LmRvbmUoZnVuY3Rpb24oIHJlc3BvbnNlICkge1xyXG4gICAgICAgIHN1Y2Nlc3NDYWxsYmFjayhyZXNwb25zZS5kb2NzKTtcclxuICAgICAgfSk7XHJcblxyXG4gICAgICByZXF1ZXN0LmZhaWwoZnVuY3Rpb24oIGpxWEhSLCB0ZXh0U3RhdHVzICkge1xyXG4gICAgICAgIGlmKGZhaWx1cmVDYWxsYmFjaylcclxuICAgICAgICAgICAgZmFpbHVyZUNhbGxiYWNrKHRleHRTdGF0dXMpO1xyXG4gICAgICAgICAgZWxzZXtcclxuICAgICAgICAgICAgICBhbGVydCggXCJSZXF1ZXN0IGZhaWxlZDogXCIgKyB0ZXh0U3RhdHVzICk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG59XHJcblxyXG4vLyBkb2NzIGZvcm1hdDogTGlzdFtMaXN0W3N0cmluZyh3b3JkKV1dXHJcbmZ1bmN0aW9uIGdldFdvcmQyVmVjQ2x1c3RlcnMoZG9jcywgc3VjY2Vzc0NhbGxiYWNrLCBmYWlsdXJlQ2FsbGJhY2spe1xyXG4gICAgdmFyIHJlcXVlc3QgPSAkLmFqYXgoe1xyXG4gICAgICAgIHVybDogXCIvYXBpL2dldENsdXN0ZXJzV29yZDJWZWNcIixcclxuICAgICAgICBtZXRob2Q6IFwiUE9TVFwiLFxyXG4gICAgICAgIGRhdGE6IEpTT04uc3RyaW5naWZ5KHtkb2NzOiBkb2NzLCBzdGFydDogd2luZG93LnZ1ZUFwcC5zZXR0aW5ncy5zdGFydDIsIGVuZDogd2luZG93LnZ1ZUFwcC5zZXR0aW5ncy5lbmQyLCBzZWxlY3RlZDogd2luZG93LnZ1ZUFwcC5zZXR0aW5ncy5zZWxlY3RlZERhdGFzZXR9KSxcclxuICAgICAgICBjb250ZW50VHlwZTogXCJhcHBsaWNhdGlvbi9qc29uOyBjaGFyc2V0PXV0Zi04XCIsXHJcbiAgICAgICAgZGF0YVR5cGUgICA6IFwianNvblwiXHJcbiAgICAgIH0pO1xyXG4gICAgICAgXHJcbiAgICAgIHJlcXVlc3QuZG9uZShmdW5jdGlvbiggcmVzcG9uc2UgKSB7XHJcbiAgICAgICAgc3VjY2Vzc0NhbGxiYWNrKEpTT04ucGFyc2UocmVzcG9uc2UpKTtcclxuICAgICAgfSk7XHJcbiAgICAgICBcclxuICAgICAgcmVxdWVzdC5mYWlsKGZ1bmN0aW9uKCBqcVhIUiwgdGV4dFN0YXR1cyApIHtcclxuICAgICAgICAgIGlmKGZhaWx1cmVDYWxsYmFjaylcclxuICAgICAgICAgICAgZmFpbHVyZUNhbGxiYWNrKHRleHRTdGF0dXMpO1xyXG4gICAgICAgICAgZWxzZXtcclxuICAgICAgICAgICAgICBhbGVydCggXCJSZXF1ZXN0IGZhaWxlZDogXCIgKyB0ZXh0U3RhdHVzICk7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0TERBQ2x1c3RlcnMoZG9jcywgc3VjY2Vzc0NhbGxiYWNrLCBmYWlsdXJlQ2FsbGJhY2spe1xyXG4gICAgdmFyIHJlcXVlc3QgPSAkLmFqYXgoe1xyXG4gICAgICAgIHVybDogXCIvYXBpL2dldExEQURhdGFcIixcclxuICAgICAgICBtZXRob2Q6IFwiUE9TVFwiLFxyXG4gICAgICAgIGRhdGE6IEpTT04uc3RyaW5naWZ5KHtkb2NzOiBkb2NzLCBzdGFydDogd2luZG93LnZ1ZUFwcC5zZXR0aW5ncy5zdGFydDEsIGVuZDogd2luZG93LnZ1ZUFwcC5zZXR0aW5ncy5lbmQxLCBzZWxlY3RlZDogd2luZG93LnZ1ZUFwcC5zZXR0aW5ncy5zZWxlY3RlZERhdGFzZXR9KSxcclxuICAgICAgICBjb250ZW50VHlwZTogXCJhcHBsaWNhdGlvbi9qc29uOyBjaGFyc2V0PXV0Zi04XCIsXHJcbiAgICAgICAgZGF0YVR5cGUgICA6IFwianNvblwiXHJcbiAgICAgIH0pO1xyXG4gICAgICAgXHJcbiAgICAgIHJlcXVlc3QuZG9uZShmdW5jdGlvbiggcmVzcG9uc2UgKSB7XHJcbiAgICAgICAgc3VjY2Vzc0NhbGxiYWNrKHJlc3BvbnNlKTtcclxuICAgICAgfSk7XHJcbiAgICAgICBcclxuICAgICAgcmVxdWVzdC5mYWlsKGZ1bmN0aW9uKCBqcVhIUiwgdGV4dFN0YXR1cyApIHtcclxuICAgICAgICBpZihmYWlsdXJlQ2FsbGJhY2spXHJcbiAgICAgICAgICAgIGZhaWx1cmVDYWxsYmFjayh0ZXh0U3RhdHVzKTtcclxuICAgICAgICAgIGVsc2V7XHJcbiAgICAgICAgICAgICAgYWxlcnQoIFwiUmVxdWVzdCBmYWlsZWQ6IFwiICsgdGV4dFN0YXR1cyApO1xyXG4gICAgICAgICAgfVxyXG4gICAgICB9KTtcclxufVxyXG4iLCJmdW5jdGlvbiBsb2FkUGFyYWxsZWxDb29yZGluYXRlc0hDKHJlc3Ape1xyXG5cclxuXHJcbiAgICAgICAgbGV0IGRhdGEgPSBnZW5lcmF0ZVBhcmFsbGVsQ29vcmRpbmF0ZURhdGFIQyhyZXNwLCAwLCAwKTtcclxuICAgICAgICBIaWdoY2hhcnRzLmNoYXJ0KCdwYy1jb250YWluZXInLCB7XHJcbiAgICAgICAgICAgIGNoYXJ0OiB7XHJcbiAgICAgICAgICAgICAgICB0eXBlOiAnc3BsaW5lJyxcclxuICAgICAgICAgICAgICAgIHBhcmFsbGVsQ29vcmRpbmF0ZXM6IHRydWUsXHJcbiAgICAgICAgICAgICAgICBwYXJhbGxlbEF4ZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICBsaW5lV2lkdGg6IDJcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgdGl0bGU6IHtcclxuICAgICAgICAgICAgICAgIHRleHQ6ICdEb2N1bWVudCAtIFRvcGljIC0gV29yZCBSZWxhdGlvbnNoaXAnXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHBsb3RPcHRpb25zOiB7XHJcbiAgICAgICAgICAgICAgICBzZXJpZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICBhbmltYXRpb246IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgICAgIG1hcmtlcjoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbmFibGVkOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3RhdGVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBob3Zlcjoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVuYWJsZWQ6IGZhbHNlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHN0YXRlczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBob3Zlcjoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaGFsbzoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNpemU6IDBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgZXZlbnRzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1vdXNlT3ZlcjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5ncm91cC50b0Zyb250KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIC8vIHRvb2x0aXA6IHtcclxuICAgICAgICAgICAgLy8gICAgIHBvaW50Rm9ybWF0OiAnPHNwYW4gc3R5bGU9XCJjb2xvcjp7cG9pbnQuY29sb3J9XCI+XFx1MjVDRjwvc3Bhbj4nICtcclxuICAgICAgICAgICAgLy8gICAgICAgICAne3Nlcmllcy5uYW1lfTogPGI+e3BvaW50LmZvcm1hdHRlZFZhbHVlfTwvYj48YnIvPidcclxuICAgICAgICAgICAgLy8gfSxcclxuICAgICAgICAgICAgeEF4aXM6IHtcclxuICAgICAgICAgICAgICAgIGNhdGVnb3JpZXM6IFtcclxuICAgICAgICAgICAgICAgICAgICAnRG9jdW1lbnQnLFxyXG4gICAgICAgICAgICAgICAgICAgICdUb3BpYycsXHJcbiAgICAgICAgICAgICAgICAgICAgJ1dvcmQnXHJcbiAgICAgICAgICAgICAgICBdLFxyXG4gICAgICAgICAgICAgICAgb2Zmc2V0OiAxMFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB5QXhpczogW3tcclxuICAgICAgICAgICAgICAgIGNhdGVnb3JpZXM6IE9iamVjdC5rZXlzKHJlc3BbXCJkb2N1bWVudF90b3BpY1wiXSkubWFwKHg9PiBcIi4uLi4uLi4uLi4uLi4uLi5Eb2N1bWVudCBcIit4KVxyXG4gICAgICAgICAgICB9LCB7XHJcbiAgICAgICAgICAgICAgICBjYXRlZ29yaWVzOiByZXNwW1widG9waWNzXCJdLm1hcCh4PT4gXCIuLi4uLi4uLi4uLi4uLi4uVG9waWMgXCIreClcclxuICAgICAgICAgICAgfSwge1xyXG4gICAgICAgICAgICAgICAgY2F0ZWdvcmllczogT2JqZWN0LnZhbHVlcyhyZXNwW1wid29yZHNcIl0pLm1hcCh4PT4gXCIuLi4uLi4uLi4uLi4uLi4uXCIreClcclxuICAgICAgICAgICAgfV0sXHJcbiAgICAgICAgICAgIGNvbG9yczogWydyZ2JhKDExLCAyMDAsIDIwMCwgMC4xKSddLFxyXG4gICAgICAgICAgICBzZXJpZXM6IGRhdGEubWFwKGZ1bmN0aW9uIChzZXQsIGkpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogJycsXHJcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogc2V0LFxyXG4gICAgICAgICAgICAgICAgICAgIHNoYWRvdzogZmFsc2VcclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgfSk7XHJcblxyXG59XHJcblxyXG5cclxuIiwiZnVuY3Rpb24gbG9hZFBhcmFsbGVsQ29vcmRpbmF0ZShyZXNwKXtcclxuICAgIHZhciBtYXJnaW4gPSB7dG9wOiAzMCwgcmlnaHQ6IDEwLCBib3R0b206IDEwLCBsZWZ0OiAxMH0sXHJcbiAgICAgICAgd2lkdGggPSA5NjAgLSBtYXJnaW4ubGVmdCAtIG1hcmdpbi5yaWdodCxcclxuICAgICAgICBoZWlnaHQgPSA1MDAgLSBtYXJnaW4udG9wIC0gbWFyZ2luLmJvdHRvbTtcclxuXHJcbiAgICB2YXIgeCA9IGQzVjMuc2NhbGUub3JkaW5hbCgpLnJhbmdlUG9pbnRzKFswLCB3aWR0aF0sIDEpLFxyXG4gICAgICAgIHkgPSB7fSxcclxuICAgICAgICBkcmFnZ2luZyA9IHt9O1xyXG5cclxuICAgIHZhciBsaW5lID0gZDNWMy5zdmcubGluZSgpLFxyXG4gICAgICAgIGJhY2tncm91bmQsXHJcbiAgICAgICAgZm9yZWdyb3VuZDtcclxuXHJcbiAgICB2YXIgc3ZnID0gZDNWMy5zZWxlY3QoXCIjcGFyYWxsZWwtY29vcmRpbmF0ZS12aXNcIikuYXBwZW5kKFwic3ZnXCIpXHJcbiAgICAgICAgLmF0dHIoXCJ3aWR0aFwiLCB3aWR0aCArIG1hcmdpbi5sZWZ0ICsgbWFyZ2luLnJpZ2h0KVxyXG4gICAgICAgIC5hdHRyKFwiaGVpZ2h0XCIsIGhlaWdodCArIG1hcmdpbi50b3AgKyBtYXJnaW4uYm90dG9tKVxyXG4gICAgLmFwcGVuZChcImdcIilcclxuICAgICAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZShcIiArIG1hcmdpbi5sZWZ0ICsgXCIsXCIgKyBtYXJnaW4udG9wICsgXCIpXCIpLCBkaW1lbnNpb25zO1xyXG5cclxuXHJcbiAgICAvLyBFeHRyYWN0IHRoZSBsaXN0IG9mIGRpbWVuc2lvbnMgYW5kIGNyZWF0ZSBhIHNjYWxlIGZvciBlYWNoLlxyXG4gICAgdmFyIGNhcnMgPSBnZW5lcmF0ZVBhcmFsbGVsQ29vcmRpbmF0ZURhdGEocmVzcCwgMCwgMCk7XHJcbiAgICAvLyB2YXIgYXhpc0QgPSBkM1YzLnN2Zy5heGlzKCkub3JpZW50KFwibGVmdFwiKS50aWNrcyhPYmplY3Qua2V5cyhyZXNwW1wiZG9jdW1lbnRfdG9waWNcIl0pLmxlbmd0aCksXHJcbiAgICB2YXIgYXhpc0QgPSBkM1YzLnN2Zy5heGlzKCkub3JpZW50KFwibGVmdFwiKS50aWNrVmFsdWVzKE9iamVjdC5rZXlzKHJlc3BbXCJkb2N1bWVudF90b3BpY1wiXSkubWFwKHggPT4gcGFyc2VJbnQoeCkpKSxcclxuICAgICAgICBheGlzVCA9IGQzVjMuc3ZnLmF4aXMoKS5vcmllbnQoXCJsZWZ0XCIpLnRpY2tWYWx1ZXMocmVzcFtcInRvcGljc1wiXS5tYXAoeCA9PiBwYXJzZUludCh4KSkpLFxyXG4gICAgICAgIGF4aXNXID0gZDNWMy5zdmcuYXhpcygpLm9yaWVudChcImxlZnRcIikudGlja1ZhbHVlcyhPYmplY3QudmFsdWVzKHJlc3BbXCJvdmVyYWxsX3dvcmRcIl0pLm1hcCh4ID0+IHBhcnNlRmxvYXQoeCkpKTtcclxuXHJcbiAgICB4LmRvbWFpbihkaW1lbnNpb25zID0gZDNWMy5rZXlzKGNhcnNbMF0pLmZpbHRlcihmdW5jdGlvbihkKSB7XHJcbiAgICAgICAgcmV0dXJuIGQgIT0gXCJuYW1lXCIgJiYgKHlbZF0gPSBkM1YzLnNjYWxlLmxpbmVhcigpXHJcbiAgICAgICAgICAgIC5kb21haW4oZDNWMy5leHRlbnQoY2FycywgZnVuY3Rpb24ocCkgeyByZXR1cm4gK3BbZF07IH0pKVxyXG4gICAgICAgICAgICAucmFuZ2UoW2hlaWdodCwgMF0pKTtcclxuICAgIH0pKTtcclxuXHJcbiAgICAvLyBBZGQgZ3JleSBiYWNrZ3JvdW5kIGxpbmVzIGZvciBjb250ZXh0LlxyXG4gICAgYmFja2dyb3VuZCA9IHN2Zy5hcHBlbmQoXCJnXCIpXHJcbiAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcImJhY2tncm91bmRcIilcclxuICAgICAgICAuc2VsZWN0QWxsKFwicGF0aFwiKVxyXG4gICAgICAgIC5kYXRhKGNhcnMpXHJcbiAgICAgICAgLmVudGVyKCkuYXBwZW5kKFwicGF0aFwiKVxyXG4gICAgICAgIC5hdHRyKFwiZFwiLCBwYXRoKTtcclxuXHJcbiAgICAvLyBBZGQgYmx1ZSBmb3JlZ3JvdW5kIGxpbmVzIGZvciBmb2N1cy5cclxuICAgIGZvcmVncm91bmQgPSBzdmcuYXBwZW5kKFwiZ1wiKVxyXG4gICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJmb3JlZ3JvdW5kXCIpXHJcbiAgICAgICAgLnNlbGVjdEFsbChcInBhdGhcIilcclxuICAgICAgICAuZGF0YShjYXJzKVxyXG4gICAgICAgIC5lbnRlcigpLmFwcGVuZChcInBhdGhcIilcclxuICAgICAgICAuYXR0cihcImRcIiwgcGF0aCk7XHJcblxyXG4gICAgLy8gQWRkIGEgZ3JvdXAgZWxlbWVudCBmb3IgZWFjaCBkaW1lbnNpb24uXHJcbiAgICB2YXIgZyA9IHN2Zy5zZWxlY3RBbGwoXCIuZGltZW5zaW9uXCIpXHJcbiAgICAgICAgLmRhdGEoZGltZW5zaW9ucylcclxuICAgICAgICAuZW50ZXIoKS5hcHBlbmQoXCJnXCIpXHJcbiAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcImRpbWVuc2lvblwiKVxyXG4gICAgICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIFwidHJhbnNsYXRlKFwiICsgeChkKSArIFwiKVwiOyB9KVxyXG4gICAgICAgIC5jYWxsKGQzVjMuYmVoYXZpb3IuZHJhZygpXHJcbiAgICAgICAgICAgIC5vcmlnaW4oZnVuY3Rpb24oZCkgeyByZXR1cm4ge3g6IHgoZCl9OyB9KVxyXG4gICAgICAgICAgICAub24oXCJkcmFnc3RhcnRcIiwgZnVuY3Rpb24oZCkge1xyXG4gICAgICAgICAgICBkcmFnZ2luZ1tkXSA9IHgoZCk7XHJcbiAgICAgICAgICAgIGJhY2tncm91bmQuYXR0cihcInZpc2liaWxpdHlcIiwgXCJoaWRkZW5cIik7XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIC5vbihcImRyYWdcIiwgZnVuY3Rpb24oZCkge1xyXG4gICAgICAgICAgICBkcmFnZ2luZ1tkXSA9IE1hdGgubWluKHdpZHRoLCBNYXRoLm1heCgwLCBkM1YzLmV2ZW50LngpKTtcclxuICAgICAgICAgICAgZm9yZWdyb3VuZC5hdHRyKFwiZFwiLCBwYXRoKTtcclxuICAgICAgICAgICAgZGltZW5zaW9ucy5zb3J0KGZ1bmN0aW9uKGEsIGIpIHsgcmV0dXJuIHBvc2l0aW9uKGEpIC0gcG9zaXRpb24oYik7IH0pO1xyXG4gICAgICAgICAgICB4LmRvbWFpbihkaW1lbnNpb25zKTtcclxuICAgICAgICAgICAgZy5hdHRyKFwidHJhbnNmb3JtXCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIFwidHJhbnNsYXRlKFwiICsgcG9zaXRpb24oZCkgKyBcIilcIjsgfSlcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgLm9uKFwiZHJhZ2VuZFwiLCBmdW5jdGlvbihkKSB7XHJcbiAgICAgICAgICAgIGRlbGV0ZSBkcmFnZ2luZ1tkXTtcclxuICAgICAgICAgICAgdHJhbnNpdGlvbihkM1YzLnNlbGVjdCh0aGlzKSkuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZShcIiArIHgoZCkgKyBcIilcIik7XHJcbiAgICAgICAgICAgIHRyYW5zaXRpb24oZm9yZWdyb3VuZCkuYXR0cihcImRcIiwgcGF0aCk7XHJcbiAgICAgICAgICAgIGJhY2tncm91bmRcclxuICAgICAgICAgICAgICAgIC5hdHRyKFwiZFwiLCBwYXRoKVxyXG4gICAgICAgICAgICAgICAgLnRyYW5zaXRpb24oKVxyXG4gICAgICAgICAgICAgICAgLmRlbGF5KDUwMClcclxuICAgICAgICAgICAgICAgIC5kdXJhdGlvbigwKVxyXG4gICAgICAgICAgICAgICAgLmF0dHIoXCJ2aXNpYmlsaXR5XCIsIG51bGwpO1xyXG4gICAgICAgICAgICB9KSk7XHJcblxyXG4gICAgLy8gQWRkIGFuIGF4aXMgYW5kIHRpdGxlLlxyXG4gICAgZy5hcHBlbmQoXCJnXCIpXHJcbiAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcImF4aXNcIilcclxuICAgICAgICAuZWFjaChmdW5jdGlvbihkKSB7XHJcbiAgICAgICAgICAgIGxldCBheGlzID0gbnVsbDtcclxuICAgICAgICAgICAgaWYoZCA9PSBcImRvY3VtZW50XCIpe1xyXG4gICAgICAgICAgICAgICAgYXhpcyA9IGF4aXNEO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYoZCA9PSBcInRvcGljXCIpe1xyXG4gICAgICAgICAgICAgICAgYXhpcyA9IGF4aXNUO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgYXhpcyA9IGF4aXNXO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGQzVjMuc2VsZWN0KHRoaXMpLmNhbGwoXHJcbiAgICAgICAgICAgICAgICBheGlzLnNjYWxlKHlbZF0pXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfSlcclxuICAgICAgICAuYXBwZW5kKFwidGV4dFwiKVxyXG4gICAgICAgIC5zdHlsZShcInRleHQtYW5jaG9yXCIsIFwibWlkZGxlXCIpXHJcbiAgICAgICAgLmF0dHIoXCJ5XCIsIC05KVxyXG4gICAgICAgIC50ZXh0KGZ1bmN0aW9uKGQpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGQ7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgLy8gQWRkIGFuZCBzdG9yZSBhIGJydXNoIGZvciBlYWNoIGF4aXMuXHJcbiAgICBnLmFwcGVuZChcImdcIilcclxuICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwiYnJ1c2hcIilcclxuICAgICAgICAuZWFjaChmdW5jdGlvbihkKSB7XHJcbiAgICAgICAgICAgIGQzVjMuc2VsZWN0KHRoaXMpLmNhbGwoeVtkXS5icnVzaCA9IGQzVjMuc3ZnLmJydXNoKCkueSh5W2RdKS5vbihcImJydXNoc3RhcnRcIiwgYnJ1c2hzdGFydCkub24oXCJicnVzaFwiLCBicnVzaCkpO1xyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLnNlbGVjdEFsbChcInJlY3RcIilcclxuICAgICAgICAuYXR0cihcInhcIiwgLTgpXHJcbiAgICAgICAgLmF0dHIoXCJ3aWR0aFwiLCAxNik7XHJcblxyXG5cclxuICAgIGZ1bmN0aW9uIHBvc2l0aW9uKGQpIHtcclxuICAgIHZhciB2ID0gZHJhZ2dpbmdbZF07XHJcbiAgICByZXR1cm4gdiA9PSBudWxsID8geChkKSA6IHY7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gdHJhbnNpdGlvbihnKSB7XHJcbiAgICByZXR1cm4gZy50cmFuc2l0aW9uKCkuZHVyYXRpb24oNTAwKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBSZXR1cm5zIHRoZSBwYXRoIGZvciBhIGdpdmVuIGRhdGEgcG9pbnQuXHJcbiAgICBmdW5jdGlvbiBwYXRoKGQpIHtcclxuICAgIHJldHVybiBsaW5lKGRpbWVuc2lvbnMubWFwKGZ1bmN0aW9uKHApIHsgcmV0dXJuIFtwb3NpdGlvbihwKSwgeVtwXShkW3BdKV07IH0pKTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBicnVzaHN0YXJ0KCkge1xyXG4gICAgZDNWMy5ldmVudC5zb3VyY2VFdmVudC5zdG9wUHJvcGFnYXRpb24oKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBIYW5kbGVzIGEgYnJ1c2ggZXZlbnQsIHRvZ2dsaW5nIHRoZSBkaXNwbGF5IG9mIGZvcmVncm91bmQgbGluZXMuXHJcbiAgICBmdW5jdGlvbiBicnVzaCgpIHtcclxuICAgIHZhciBhY3RpdmVzID0gZGltZW5zaW9ucy5maWx0ZXIoZnVuY3Rpb24ocCkgeyByZXR1cm4gIXlbcF0uYnJ1c2guZW1wdHkoKTsgfSksXHJcbiAgICAgICAgZXh0ZW50cyA9IGFjdGl2ZXMubWFwKGZ1bmN0aW9uKHApIHsgcmV0dXJuIHlbcF0uYnJ1c2guZXh0ZW50KCk7IH0pO1xyXG4gICAgZm9yZWdyb3VuZC5zdHlsZShcImRpc3BsYXlcIiwgZnVuY3Rpb24oZCkge1xyXG4gICAgICAgIHJldHVybiBhY3RpdmVzLmV2ZXJ5KGZ1bmN0aW9uKHAsIGkpIHtcclxuICAgICAgICByZXR1cm4gZXh0ZW50c1tpXVswXSA8PSBkW3BdICYmIGRbcF0gPD0gZXh0ZW50c1tpXVsxXTtcclxuICAgICAgICB9KSA/IG51bGwgOiBcIm5vbmVcIjtcclxuICAgIH0pO1xyXG4gICAgfVxyXG5cclxufSIsImZ1bmN0aW9uIHJlbmRlckNsdXN0ZXJBbmFseXNpcyhyZXNwKSB7XHJcbiAgZDMuc2VsZWN0KFwiLmNoYXJ0MTJcIikucmVtb3ZlKCk7XHJcbiAgdmFyIGRvY3VtZW50X3RvcGljID0gcmVzcFtcImRvY3VtZW50X3RvcGljXCJdWzBdO1xyXG4gIHZhciB0b3BpY192ZWN0b3JzID0gcmVzcFtcInRvcGljX3ZlY3RvcnNcIl07XHJcbiAgdmFyIGJiID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2NsdXN0ZXInKVxyXG4gICAgLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLFxyXG4gICAgd2lkdGggPSA0MDA7XHJcbiAgdmFyIGhlaWdodCA9IDQwMDtcclxuICB2YXIgbWFyZ2luID0gODA7XHJcbiAgdmFyIGRhdGEgPSBbXTtcclxuXHJcbiAgT2JqZWN0LmtleXModG9waWNfdmVjdG9ycykuZm9yRWFjaChmdW5jdGlvbihrZXkpIHtcclxuICAgIHZhciB2YWx1ZSA9IHRvcGljX3ZlY3RvcnNba2V5XTtcclxuICAgIGRhdGEucHVzaCh7XHJcbiAgICAgIHg6IHZhbHVlWzBdLFxyXG4gICAgICB5OiB2YWx1ZVsxXSxcclxuICAgICAgYzogMSxcclxuICAgICAgc2l6ZTogZG9jdW1lbnRfdG9waWNba2V5XSxcclxuICAgICAga2V5OiBrZXlcclxuICAgIH0pO1xyXG4gIH0pO1xyXG4gIHZhciBsYWJlbFggPSAnWCc7XHJcbiAgdmFyIGxhYmVsWSA9ICdZJztcclxuXHJcbiAgdmFyIHN2ZyA9IGQzLnNlbGVjdCgnI2NsdXN0ZXInKVxyXG4gICAgLmFwcGVuZCgnc3ZnJylcclxuICAgIC5hdHRyKCdjbGFzcycsICdjaGFydDEyJylcclxuICAgIC5hdHRyKCdpZCcsJ2NsdXN0ZXJfaWQnKVxyXG4gICAgLmF0dHIoXCJ3aWR0aFwiLCB3aWR0aCArIG1hcmdpbiArIG1hcmdpbilcclxuICAgIC5hdHRyKFwiaGVpZ2h0XCIsIGhlaWdodCArIG1hcmdpbiArIG1hcmdpbilcclxuICAgIC5hcHBlbmQoXCJnXCIpXHJcbiAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZShcIiArIG1hcmdpbiArIFwiLFwiICsgbWFyZ2luICsgXCIpXCIpO1xyXG5cclxuICB2YXIgeCA9IGQzLnNjYWxlTGluZWFyKClcclxuICAgIC5kb21haW4oW2QzLm1pbihkYXRhLCBmdW5jdGlvbiAoZCkge1xyXG4gICAgICByZXR1cm4gZC54O1xyXG4gICAgfSksIGQzLm1heChkYXRhLCBmdW5jdGlvbiAoZCkge1xyXG4gICAgICByZXR1cm4gZC54O1xyXG4gICAgfSldKVxyXG4gICAgLnJhbmdlKFswLCB3aWR0aF0pO1xyXG5cclxuICB2YXIgeSA9IGQzLnNjYWxlTGluZWFyKClcclxuICAgIC5kb21haW4oW2QzLm1pbihkYXRhLCBmdW5jdGlvbiAoZCkge1xyXG4gICAgICByZXR1cm4gZC55O1xyXG4gICAgfSksIGQzLm1heChkYXRhLCBmdW5jdGlvbiAoZCkge1xyXG4gICAgICByZXR1cm4gZC55O1xyXG4gICAgfSldKVxyXG4gICAgLnJhbmdlKFtoZWlnaHQsIDBdKTtcclxuXHJcbiAgdmFyIHNjYWxlID0gZDMuc2NhbGVTcXJ0KClcclxuICAgIC5kb21haW4oW2QzLm1pbihkYXRhLCBmdW5jdGlvbiAoZCkge1xyXG4gICAgICByZXR1cm4gZC5zaXplO1xyXG4gICAgfSksIGQzLm1heChkYXRhLCBmdW5jdGlvbiAoZCkge1xyXG4gICAgICByZXR1cm4gZC5zaXplO1xyXG4gICAgfSldKVxyXG4gICAgLnJhbmdlKFsxMCwgMjBdKTtcclxuXHJcbiAgdmFyIG9wYWNpdHkgPSBkMy5zY2FsZVNxcnQoKVxyXG4gICAgLmRvbWFpbihbZDMubWluKGRhdGEsIGZ1bmN0aW9uIChkKSB7XHJcbiAgICAgIHJldHVybiBkLnNpemU7XHJcbiAgICB9KSwgZDMubWF4KGRhdGEsIGZ1bmN0aW9uIChkKSB7XHJcbiAgICAgIHJldHVybiBkLnNpemU7XHJcbiAgICB9KV0pXHJcbiAgICAucmFuZ2UoWzEsIC41XSk7XHJcblxyXG5cclxuICB2YXIgeEF4aXMgPSBkMy5heGlzQm90dG9tKCkuc2NhbGUoeCk7XHJcbiAgdmFyIHlBeGlzID0gZDMuYXhpc0xlZnQoKS5zY2FsZSh5KTtcclxuXHJcblxyXG4gIHN2Zy5hcHBlbmQoXCJnXCIpXHJcbiAgICAuYXR0cihcImNsYXNzXCIsIFwieSBheGlzXCIpXHJcbiAgICAuY2FsbCh5QXhpcylcclxuICAgIC5hcHBlbmQoXCJ0ZXh0XCIpXHJcbiAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBcInJvdGF0ZSgtOTApXCIpXHJcbiAgICAuYXR0cihcInhcIiwgMjApXHJcbiAgICAuYXR0cihcInlcIiwgLW1hcmdpbilcclxuICAgIC5hdHRyKFwiZHlcIiwgXCIuNzFlbVwiKVxyXG4gICAgLnN0eWxlKFwidGV4dC1hbmNob3JcIiwgXCJlbmRcIilcclxuICAgIC50ZXh0KGxhYmVsWSk7XHJcbiAgLy8geCBheGlzIGFuZCBsYWJlbFxyXG4gIHN2Zy5hcHBlbmQoXCJnXCIpXHJcbiAgICAuYXR0cihcImNsYXNzXCIsIFwieCBheGlzXCIpXHJcbiAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZSgwLFwiICsgaGVpZ2h0ICsgXCIpXCIpXHJcbiAgICAuY2FsbCh4QXhpcylcclxuICAgIC5hcHBlbmQoXCJ0ZXh0XCIpXHJcbiAgICAuYXR0cihcInhcIiwgd2lkdGggKyAyMClcclxuICAgIC5hdHRyKFwieVwiLCBtYXJnaW4gLSAxMClcclxuICAgIC5hdHRyKFwiZHlcIiwgXCIuNzFlbVwiKVxyXG4gICAgLnN0eWxlKFwidGV4dC1hbmNob3JcIiwgXCJlbmRcIilcclxuICAgIC50ZXh0KGxhYmVsWCk7XHJcblxyXG4gIHN2Zy5zZWxlY3RBbGwoXCJjaXJjbGVcIilcclxuICAgIC5kYXRhKGRhdGEpXHJcbiAgICAuZW50ZXIoKVxyXG4gICAgLmFwcGVuZChcImdcIilcclxuICAgIC5pbnNlcnQoXCJjaXJjbGVcIilcclxuICAgIC5hdHRyKFwiY3hcIiwgd2lkdGggLyAyKVxyXG4gICAgLmF0dHIoXCJjeVwiLCBoZWlnaHQgLyAyKVxyXG4gICAgLmF0dHIoXCJyXCIsIGZ1bmN0aW9uIChkKSB7XHJcbiAgICAgIHJldHVybiBzY2FsZShkLnNpemUpO1xyXG4gICAgfSlcclxuICAgIC5hdHRyKFwiaWRcIixmdW5jdGlvbihkKSB7XHJcbiAgICAgIHJldHVybiBkLmtleVxyXG4gICAgfSlcclxuICAgIC5zdHlsZShcImZpbGxcIiwgZnVuY3Rpb24gKGQpIHtcclxuICAgICAgcmV0dXJuIFwiI0QwRTNGMFwiO1xyXG4gICAgfSlcclxuICAgIC5vbignbW91c2VvdmVyJywgZnVuY3Rpb24gKGQsIGkpIHtcclxuICAgICAgcmVuZGVyQmFyR3JhcGgoZFtcImtleVwiXSwgcmVzcCk7XHJcbiAgICAgIGZhZGUoZFtcImtleVwiXSwgMSk7XHJcbiAgICB9KVxyXG4gICAgLm9uKCdtb3VzZW91dCcsIGZ1bmN0aW9uIChkLCBpKSB7XHJcbiAgICAgIGZhZGVPdXQoKTtcclxuICAgIH0pXHJcbiAgICAudHJhbnNpdGlvbigpXHJcbiAgICAuZGVsYXkoZnVuY3Rpb24gKGQsIGkpIHtcclxuICAgICAgcmV0dXJuIHgoZC54KSAtIHkoZC55KTtcclxuICAgIH0pXHJcbiAgICAuZHVyYXRpb24oNTAwKVxyXG4gICAgLmF0dHIoXCJjeFwiLCBmdW5jdGlvbiAoZCkge1xyXG4gICAgICByZXR1cm4geChkLngpO1xyXG4gICAgfSlcclxuICAgIC5hdHRyKFwiY3lcIiwgZnVuY3Rpb24gKGQpIHtcclxuICAgICAgcmV0dXJuIHkoZC55KTtcclxuICAgIH0pO1xyXG5cclxuICAgICAgLy8gdGV4dCBsYWJlbCBmb3IgdGhlIHggYXhpc1xyXG4gIHN2Zy5hcHBlbmQoXCJ0ZXh0XCIpXHJcbiAgICAuYXR0cihcImNsYXNzXCIsIFwieCBsYWJlbFwiKVxyXG4gICAgLmF0dHIoXCJ0ZXh0LWFuY2hvclwiLCBcImVuZFwiKVxyXG4gICAgLmF0dHIoXCJ4XCIsIHdpZHRoKVxyXG4gICAgLmF0dHIoXCJ5XCIsIGhlaWdodCArNDApXHJcbiAgICAudGV4dChcIlBDMVwiKTtcclxuXHJcblxyXG4gIHN2Zy5hcHBlbmQoXCJ0ZXh0XCIpXHJcbiAgICAuYXR0cihcImNsYXNzXCIsIFwieSBsYWJlbFwiKVxyXG4gICAgLmF0dHIoXCJ0ZXh0LWFuY2hvclwiLCBcImVuZFwiKVxyXG4gICAgLmF0dHIoXCJ5XCIsIC01MClcclxuICAgIC5hdHRyKFwiZHlcIiwgXCIuNzVlbVwiKVxyXG4gICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJyb3RhdGUoLTkwKVwiKVxyXG4gICAgLnRleHQoXCJQQzJcIik7XHJcblxyXG5cclxuICBmdW5jdGlvbiBmYWRlKGtleSwgb3BhY2l0eSkge1xyXG4gICAgc3ZnLnNlbGVjdEFsbChcImNpcmNsZVwiKVxyXG4gICAgICAuZmlsdGVyKGZ1bmN0aW9uIChkKSB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgcmV0dXJuIGQua2V5ID09IGtleTtcclxuICAgICAgfSkuXHJcbiAgICAgIHN0eWxlKFwiZmlsbFwiLCBcIiNDODQyM0VcIilcclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIGZhZGVPdXQoKSB7XHJcbiAgICBzdmcuc2VsZWN0QWxsKFwiY2lyY2xlXCIpXHJcbiAgICAgIC50cmFuc2l0aW9uKClcclxuICAgICAgLnN0eWxlKFwiZmlsbFwiLFwiI0QwRTNGMFwiKTtcclxuICB9XHJcbn0iLCJmdW5jdGlvbiByZW5kZXJCYXJHcmFwaCh0b3BpY19udW1iZXIsIHJlc3ApIHtcclxuICBkMy5zZWxlY3QoXCIjc3RhY2stYmFyXCIpLnJlbW92ZSgpO1xyXG4gIGQzLnNlbGVjdChcIiNsZWdlbmRzdmdcIikucmVtb3ZlKCk7XHJcbiAgdmFyIGZpbmFsX2RhdGEgPSBbXTtcclxuICB2YXIgZGF0YVZhbCA9cmVzcFtcInRvcGljX3dvcmRcIl1bdG9waWNfbnVtYmVyXTtcclxuICBmb3IgKHZhciBrZXkgaW4gZGF0YVZhbCkge1xyXG4gICAgaWYgKGRhdGFWYWwuaGFzT3duUHJvcGVydHkoa2V5KSkge1xyXG4gICAgICAgIHZhciB0ZW1wID17fTtcclxuICAgICAgICB0ZW1wLlN0YXRlID0ga2V5O1xyXG4gICAgICAgIHRlbXAudG9waWNfZnJlcXVlbmN5ID0gTWF0aC5hYnMoZGF0YVZhbFtrZXldKTtcclxuICAgICAgICB0ZW1wLm92ZXJhbGwgPSBNYXRoLmFicyhyZXNwW1wib3ZlcmFsbF93b3JkXCJdW2tleV0pO1xyXG4gICAgICAgIHRlbXAudG90YWwgPSB0ZW1wLnRvcGljX2ZyZXF1ZW5jeSArIHRlbXAub3ZlcmFsbDtcclxuICAgICAgICBmaW5hbF9kYXRhLnB1c2godGVtcCk7XHJcbiAgICAgICAgY29uc29sZS5sb2coa2V5ICsgXCItPlwiICsgcmVzcFtcIm92ZXJhbGxfd29yZFwiXVtrZXldKTtcclxuICAgIH1cclxuICAgIFxyXG4gIH1cclxuICBcclxuICB2YXIgYmIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjc3RhY2tlZC1iYXInKVxyXG4gICAgLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLFxyXG4gICAgd2lkdGggPSA0MDA7XHJcblxyXG4gIHZhciBkYXRhID0gZmluYWxfZGF0YTtcclxuICB2YXIgaGVpZ2h0ID0gZGF0YS5sZW5ndGggKiAyNSArMTAwO1xyXG4gIHZhciBzdmcgPSBkMy5zZWxlY3QoXCIjc3RhY2tlZC1iYXJcIikuYXBwZW5kKFwic3ZnXCIpLmF0dHIoXCJ3aWR0aFwiLCB3aWR0aCkuYXR0cihcImhlaWdodFwiLCBoZWlnaHQpLmF0dHIoXCJpZFwiLFwic3RhY2stYmFyXCIpLFxyXG4gICAgbWFyZ2luID0ge1xyXG4gICAgICB0b3A6IDIwLFxyXG4gICAgICByaWdodDogMCxcclxuICAgICAgYm90dG9tOiA1MCxcclxuICAgICAgbGVmdDogODBcclxuICAgIH0sXHJcbiAgICB3aWR0aCA9ICtzdmcuYXR0cihcIndpZHRoXCIpIC0gbWFyZ2luLmxlZnQgLSBtYXJnaW4ucmlnaHQsXHJcbiAgICBoZWlnaHQgPSArc3ZnLmF0dHIoXCJoZWlnaHRcIikgLSBtYXJnaW4udG9wIC0gbWFyZ2luLmJvdHRvbSxcclxuICAgIGcgPSBzdmcuYXBwZW5kKFwiZ1wiKS5hdHRyKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKFwiICsgbWFyZ2luLmxlZnQgKyBcIixcIiArIG1hcmdpbi50b3AgKyBcIilcIik7XHJcbiAgdmFyIHkgPSBkMy5zY2FsZUJhbmQoKSAvLyB4ID0gZDMuc2NhbGVCYW5kKCkgIFxyXG4gICAgLnJhbmdlUm91bmQoWzAsIGhlaWdodF0pIC8vIC5yYW5nZVJvdW5kKFswLCB3aWR0aF0pXHJcbiAgICAucGFkZGluZ0lubmVyKDAuMjUpLmFsaWduKDAuMSk7XHJcbiAgdmFyIHggPSBkMy5zY2FsZUxpbmVhcigpIC8vIHkgPSBkMy5zY2FsZUxpbmVhcigpXHJcbiAgICAucmFuZ2VSb3VuZChbMCwgd2lkdGhdKTsgLy8gLnJhbmdlUm91bmQoW2hlaWdodCwgMF0pO1xyXG5cclxuICB2YXIgeiA9IGQzLnNjYWxlT3JkaW5hbCgpLnJhbmdlKFtcIiNDODQyM0VcIiwgXCIjQTFDN0UwXCJdKTtcclxuICB2YXIga2V5cyA9IFtcInRvcGljX2ZyZXF1ZW5jeVwiLCBcIm92ZXJhbGxcIl07XHJcbiAgZGF0YS5zb3J0KGZ1bmN0aW9uIChhLCBiKSB7XHJcbiAgICByZXR1cm4gYi50b3RhbCAtIGEudG90YWw7XHJcbiAgfSk7XHJcbiAgeS5kb21haW4oZGF0YS5tYXAoZnVuY3Rpb24gKGQpIHtcclxuICAgIHJldHVybiBkLlN0YXRlO1xyXG4gIH0pKTsgLy8geC5kb21haW4uLi5cclxuXHJcbiAgeC5kb21haW4oWzAsIGQzLm1heChkYXRhLCBmdW5jdGlvbiAoZCkge1xyXG4gICAgcmV0dXJuIGQudG90YWw7XHJcbiAgfSldKS5uaWNlKCk7IC8vIHkuZG9tYWluLi4uXHJcblxyXG4gIHouZG9tYWluKGtleXMpO1xyXG4gIGcuYXBwZW5kKFwiZ1wiKVxyXG4gICAgLnNlbGVjdEFsbChcImdcIilcclxuICAgIC5kYXRhKGQzLnN0YWNrKCkua2V5cyhrZXlzKShkYXRhKSlcclxuICAgIC5lbnRlcigpLmFwcGVuZChcImdcIilcclxuICAgICAgLmF0dHIoXCJmaWxsXCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIHooZC5rZXkpOyB9KVxyXG4gICAgLnNlbGVjdEFsbChcInJlY3RcIilcclxuICAgIC5kYXRhKGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQ7IH0pXHJcbiAgICAuZW50ZXIoKS5hcHBlbmQoXCJyZWN0XCIpXHJcbiAgICAgIC5hdHRyKFwieVwiLCBmdW5jdGlvbihkKSB7IHJldHVybiB5KGQuZGF0YS5TdGF0ZSk7IH0pICAgICAvLy5hdHRyKFwieFwiLCBmdW5jdGlvbihkKSB7IHJldHVybiB4KGQuZGF0YS5TdGF0ZSk7IH0pXHJcbiAgICAgIC5hdHRyKFwieFwiLCBmdW5jdGlvbihkKSB7IHJldHVybiB4KGRbMF0pOyB9KSAgICAgICAgIC8vLmF0dHIoXCJ5XCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIHkoZFsxXSk7IH0pIFxyXG4gICAgICAuYXR0cihcIndpZHRoXCIsIGZ1bmN0aW9uKGQpIHtcclxuICAgICAgICBcclxuICAgICAgIHJldHVybiB4KGRbMV0pIC0geChkWzBdKTsgXHJcbiAgICB9KSAvLy5hdHRyKFwiaGVpZ2h0XCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIHkoZFswXSkgLSB5KGRbMV0pOyB9KVxyXG4gICAgICAuYXR0cihcImhlaWdodFwiLCB5LmJhbmR3aWR0aCgpKTsgICAgICAgICAgICAgICAvLy5hdHRyKFwid2lkdGhcIiwgeC5iYW5kd2lkdGgoKSk7ICBcclxuXHJcbiAgZy5hcHBlbmQoXCJnXCIpXHJcbiAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJheGlzXCIpXHJcbiAgICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKDAsMClcIikgICAgICAgICAgICAvLyAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoMCxcIiArIGhlaWdodCArIFwiKVwiKVxyXG4gICAgICAuY2FsbChkMy5heGlzTGVmdCh5KSk7ICAgICAgICAgICAgICAgICAgLy8gICAuY2FsbChkMy5heGlzQm90dG9tKHgpKTtcclxuXHJcbiAgZy5hcHBlbmQoXCJnXCIpXHJcbiAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJheGlzXCIpXHJcbiAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZSgwLFwiK2hlaWdodCtcIilcIikgICAgICAgLy8gTmV3IGxpbmVcclxuICAgICAgLmNhbGwoZDMuYXhpc0JvdHRvbSh4KS50aWNrcyhudWxsLCBcInNcIikpICAgICAgICAgIC8vICAuY2FsbChkMy5heGlzTGVmdCh5KS50aWNrcyhudWxsLCBcInNcIikpXHJcbiAgICAuYXBwZW5kKFwidGV4dFwiKVxyXG4gICAgICAuYXR0cihcInlcIiwgMikgICAgICAgICAgICAgICAgICAgICAgIC8vICAgICAuYXR0cihcInlcIiwgMilcclxuICAgICAgLmF0dHIoXCJ4XCIsIHgoeC50aWNrcygpLnBvcCgpKSArIDAuNSkgICAgICAgICAgICAvLyAgICAgLmF0dHIoXCJ5XCIsIHkoeS50aWNrcygpLnBvcCgpKSArIDAuNSlcclxuICAgICAgLmF0dHIoXCJkeVwiLCBcIjRlbVwiKSAgICAgICAgICAgICAgICAgICAvLyAgICAgLmF0dHIoXCJkeVwiLCBcIjAuMzJlbVwiKVxyXG4gICAgICAuYXR0cihcImZpbGxcIiwgXCIjMDAwXCIpXHJcbiAgICAgIC5hdHRyKFwidGV4dC1hbmNob3JcIiwgXCJzdGFydFwiKVxyXG4gICAgICAudGV4dChcIlByb2JhYmlsaXR5L0Nvc2luZSBTaW1pbGFyaXR5XCIpXHJcbiAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZShcIisgKC13aWR0aCkgK1wiLC0xMClcIik7ICAgIC8vIE5ld2xpbmVcclxuXHJcbiAgdmFyIGxlZ2VuZCA9IGcuYXBwZW5kKFwiZ1wiKVxyXG4gICAgICAuYXR0cihcImZvbnQtZmFtaWx5XCIsIFwic2Fucy1zZXJpZlwiKVxyXG4gICAgICAuYXR0cihcImZvbnQtc2l6ZVwiLCAxMClcclxuICAgICAgLmF0dHIoXCJ0ZXh0LWFuY2hvclwiLCBcImVuZFwiKVxyXG4gICAgLnNlbGVjdEFsbChcImdcIilcclxuICAgIC5kYXRhKGtleXMuc2xpY2UoKS5yZXZlcnNlKCkpXHJcbiAgICAuZW50ZXIoKS5hcHBlbmQoXCJnXCIpXHJcbiAgICAvLy5hdHRyKFwidHJhbnNmb3JtXCIsIGZ1bmN0aW9uKGQsIGkpIHsgcmV0dXJuIFwidHJhbnNsYXRlKDAsXCIgKyBpICogMjAgKyBcIilcIjsgfSk7XHJcbiAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIGZ1bmN0aW9uKGQsIGkpIHsgcmV0dXJuIFwidHJhbnNsYXRlKC01MCxcIiArICgzMDAgKyBpICogMjApICsgXCIpXCI7IH0pO1xyXG4gIFxyXG5cclxuICB2YXIga2V5czEgPSBbXCJPdmVyYWxsIFRlcm0gRnJlcXVlbmN5L092ZXJhbGwgUmVsZXZhbmNlXCIsIFwiRXN0aW1hdGVkIFRlcm0gZnJlcXVlbmN5IHdpdGhpbiB0aGUgc2VsZWN0ZWQgdG9waWNcIl07XHJcbiAgdmFyIHN2ZzEgPSBkMy5zZWxlY3QoXCIjbGVnZW5kVFwiKS5hcHBlbmQoXCJzdmdcIikuYXR0cihcIndpZHRoXCIsIDUwMCkuYXR0cihcImhlaWdodFwiLCBoZWlnaHQpLmF0dHIoXCJpZFwiLFwibGVnZW5kc3ZnXCIpXHJcbnZhciBsZWdlbmQgPSBzdmcxLmFwcGVuZChcImdcIikuYXR0cihcImZvbnQtZmFtaWx5XCIsIFwic2Fucy1zZXJpZlwiKS5hdHRyKFwiZm9udC1zaXplXCIsIDEwKS5hdHRyKFwidGV4dC1hbmNob3JcIiwgXCJlbmRcIikuc2VsZWN0QWxsKFwiZ1wiKS5kYXRhKGtleXMxLnNsaWNlKCkucmV2ZXJzZSgpKS5lbnRlcigpLmFwcGVuZChcImdcIikgLy8uYXR0cihcInRyYW5zZm9ybVwiLCBmdW5jdGlvbihkLCBpKSB7IHJldHVybiBcInRyYW5zbGF0ZSgwLFwiICsgaSAqIDIwICsgXCIpXCI7IH0pO1xyXG4gICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgZnVuY3Rpb24gKGQsIGkpIHtcclxuICAgICAgcmV0dXJuIFwidHJhbnNsYXRlKC01MCxcIiArICgwICsgaSAqIDIwKSArIFwiKVwiO1xyXG4gICAgfSk7XHJcbiAgbGVnZW5kLmFwcGVuZChcInJlY3RcIikuYXR0cihcInhcIiwgd2lkdGgpXHJcbiAgLmF0dHIoXCJ3aWR0aFwiLCBmdW5jdGlvbiAoZCwgaSl7XHJcbiAgICAgIGlmKGk9PTApe1xyXG4gICAgICAgIHJldHVybiA2MDtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gMTYwO1xyXG4gIH0pLmF0dHIoXCJoZWlnaHRcIiwgMTkpLmF0dHIoXCJmaWxsXCIsIHopO1xyXG5cclxuICBsZWdlbmQuYXBwZW5kKFwidGV4dFwiKS5hdHRyKFwieFwiLCB3aWR0aCAtIDEwKS5hdHRyKFwieVwiLCAxOCkuYXR0cihcImR5XCIsIFwiMC4wZW1cIikudGV4dChmdW5jdGlvbiAoZCkge1xyXG4gICAgcmV0dXJuIGQ7XHJcbiAgfSk7XHJcbiAgXHJcbn0iLCJmdW5jdGlvbiBnZW5lcmF0ZVRvcGljVmVjdG9ycygpe1xyXG4gICAgd2luZG93LnRvcGljVmVjdG9ycyA9IHt9O1xyXG4gICAgaWYod2luZG93LnRvcGljX3dvcmRfcHJvYmFiaWxpdHlfaW5fdG9waWMpe1xyXG4gICAgICAgIGZvcih2YXIgeCBpbiB3aW5kb3cudG9waWNfd29yZF9wcm9iYWJpbGl0eV9pbl90b3BpYyl7XHJcbiAgICAgICAgICAgIHZhciB2ZWN0b3IgPSBbXTtcclxuICAgICAgICAgICAgZm9yKHZhciB5IGluIHdpbmRvdy50b3BpY193b3JkX3Byb2JhYmlsaXR5X2luX3RvcGljW3hdKXtcclxuICAgICAgICAgICAgICAgIHZlY3Rvci5wdXNoKHdpbmRvdy50b3BpY193b3JkX3Byb2JhYmlsaXR5X2luX3RvcGljW3hdW3ldKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB3aW5kb3cudG9waWNWZWN0b3JzW3hdID0gdmVjdG9yO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuZnVuY3Rpb24gZ2VuZXJhdGVQYXJhbGxlbENvb3JkaW5hdGVEYXRhKHJlc3BvbnNlLCB0b3BpY190aHJlc2hvbGQsIHdvcmRfdGhyZXNob2xkKXtcclxuICAgIGxldCB2aXNEYXRhID0gW107XHJcbiAgICBmb3IgKHZhciBkb2NLZXkgaW4gcmVzcG9uc2VbXCJkb2N1bWVudF90b3BpY1wiXSl7XHJcbiAgICAgICAgZm9yKHZhciB0b3BpYyBpbiByZXNwb25zZVtcImRvY3VtZW50X3RvcGljXCJdW2RvY0tleV0pe1xyXG4gICAgICAgICAgICBsZXQgdG9waWNTY29yZSA9IHJlc3BvbnNlW1wiZG9jdW1lbnRfdG9waWNcIl1bZG9jS2V5XVt0b3BpY107XHJcbiAgICAgICAgICAgIGlmICh0b3BpY1Njb3JlID4gdG9waWNfdGhyZXNob2xkKXtcclxuXHJcbiAgICAgICAgICAgICAgICBmb3IodmFyIHdvcmQgaW4gcmVzcG9uc2VbXCJ0b3BpY193b3JkXCJdW3RvcGljXSl7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IHdvcmRTY29yZSA9IHJlc3BvbnNlW1widG9waWNfd29yZFwiXVt0b3BpY11bd29yZF07XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHdvcmRTY29yZSA+IHdvcmRfdGhyZXNob2xkKXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmlzRGF0YS5wdXNoKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwibmFtZVwiOiBkb2NLZXksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImRvY3VtZW50XCI6ICBkb2NLZXksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcInRvcGljXCI6IHRvcGljLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJ3b3JkXCI6IHJlc3BvbnNlW1wib3ZlcmFsbF93b3JkXCJdW3dvcmRdXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdmlzRGF0YTtcclxufVxyXG5cclxuZnVuY3Rpb24gZ2VuZXJhdGVQYXJhbGxlbENvb3JkaW5hdGVEYXRhSEMocmVzcG9uc2UsIHRvcGljX3RocmVzaG9sZCwgd29yZF90aHJlc2hvbGQpe1xyXG4gICAgbGV0IHZpc0RhdGEgPSBbXTtcclxuICAgIGZvciAodmFyIGRvY0tleSBpbiByZXNwb25zZVtcImRvY3VtZW50X3RvcGljXCJdKXtcclxuICAgICAgICBmb3IodmFyIHRvcGljIGluIHJlc3BvbnNlW1wiZG9jdW1lbnRfdG9waWNcIl1bZG9jS2V5XSl7XHJcbiAgICAgICAgICAgIGxldCB0b3BpY1Njb3JlID0gcmVzcG9uc2VbXCJkb2N1bWVudF90b3BpY1wiXVtkb2NLZXldW3RvcGljXTtcclxuICAgICAgICAgICAgaWYgKHRvcGljU2NvcmUgPiB0b3BpY190aHJlc2hvbGQpe1xyXG5cclxuICAgICAgICAgICAgICAgIGZvcih2YXIgd29yZCBpbiByZXNwb25zZVtcInRvcGljX3dvcmRcIl1bdG9waWNdKXtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgd29yZFNjb3JlID0gcmVzcG9uc2VbXCJ0b3BpY193b3JkXCJdW3RvcGljXVt3b3JkXTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAod29yZFNjb3JlID4gd29yZF90aHJlc2hvbGQpe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2aXNEYXRhLnB1c2goW3BhcnNlSW50KGRvY0tleSksIHBhcnNlSW50KHRvcGljKSwgcmVzcG9uc2VbXCJ3b3Jkc1wiXS5pbmRleE9mKHdvcmQpXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiB2aXNEYXRhO1xyXG59XHJcblxyXG5cclxuIiwid2luZG93LnZ1ZUFwcCA9IG5ldyBWdWUoe1xyXG4gICAgZWw6ICcjdnVlLWFwcCcsXHJcbiAgICBkYXRhOiB7XHJcbiAgICAgICAgbWVzc2FnZTogJ0hlbGxvIHVzZXIhJyxcclxuICAgICAgICBub25lU2VsZWN0ZWQ6IHRydWUsXHJcbiAgICAgICAgc2VsZWN0ZWRQYWdlOiA1LFxyXG4gICAgICAgIHBsYXllckRldGFpbDoge1xyXG4gICAgICAgICAgICBuYW1lOiBcIjxQbGF5ZXIgTmFtZT5cIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgb3ZlcnZpZXdGaWx0ZXJzOiB7fSxcclxuICAgICAgICBuZXdEb2NzOiBbXSxcclxuICAgICAgICBzZWxlY3RlZE1hcDogMSxcclxuICAgICAgICBzdWNjZXNzOiBmYWxzZSxcclxuICAgICAgICBsb2FkaW5nOiBmYWxzZSxcclxuICAgICAgICBmYWlsdXJlOiBmYWxzZSxcclxuICAgICAgICBuZXdEb2M6ICcnLFxyXG4gICAgICAgIG5ld0RvY3NQcm9jY2Vzc2VkOiAnJyxcclxuICAgICAgICBzaG93UHJvY2Vzc2VkOiBmYWxzZSxcclxuICAgICAgICBzZXR0aW5nczoge1xyXG4gICAgICAgICAgICBzZWxlY3RlZE1ldGhvZDogXCJMREFcIixcclxuICAgICAgICAgICAgc2VsZWN0ZWREYXRhc2V0OiAwLFxyXG4gICAgICAgICAgICBzdGFydDE6IDAsICAgICAgLy9IYXBweURCXHJcbiAgICAgICAgICAgIGVuZDE6IDEwLCAgICAgICAgLy9IYXBweURCXHJcbiAgICAgICAgICAgIHN0YXJ0MjogMCwgICAgICAvL01lZGl1bVxyXG4gICAgICAgICAgICBlbmQyOiA1LCAgICAgICAgLy9NZWRpdW1cclxuICAgICAgICAgICAgbGRhVG9waWNUaHJlc2hvbGQ6IDAsXHJcbiAgICAgICAgICAgIHdvcmQyVmVjVGhyZXNob2xkOiAwXHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuICAgIG1ldGhvZHM6IHtcclxuICAgICAgICBzZWxlY3RQYWdlOiBmdW5jdGlvbih4KXtcclxuICAgICAgICAgICAgdGhpcy5zZWxlY3RlZFBhZ2UgPSB4O1xyXG4gICAgICAgICAgICBpZiAoeCA9PSAxKXtcclxuICAgICAgICAgICAgICAgIGluaXRQYWdlMSh3aW5kb3cuZ2xvYmFsX2RhdGEpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICh4ID09IDIpe1xyXG4gICAgICAgICAgICAgICAgaW5pdFBhZ2UyKHdpbmRvdy5nbG9iYWxfZGF0YSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKHggPT0gMyl7XHJcbiAgICAgICAgICAgICAgICBpbml0UGFnZTMod2luZG93Lmdsb2JhbF9kYXRhKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoeCA9PSA0KXtcclxuICAgICAgICAgICAgICAgIGluaXRQYWdlNCh3aW5kb3cuZ2xvYmFsX2RhdGEpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgICBhZGROZXdEb2M6IGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLm5ld0RvYy50cmltKCkuc3BsaXQoXCIgXCIpLmxlbmd0aCA8IDMpe1xyXG4gICAgICAgICAgICAgICAgYWxlcnQoXCJQbGVhc2UgYWRkIGF0IGxlYXN0IDMgd29yZHNcIik7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5uZXdEb2NzLnB1c2godGhpcy5uZXdEb2MpO1xyXG4gICAgICAgICAgICB0aGlzLm5ld0RvYyA9ICcnO1xyXG4gICAgICAgICAgICB0aGlzLnNob3dQcm9jZXNzZWQgPSBmYWxzZTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHByb2Nlc3NEb2NzOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHZhciBzZWxmID0gdGhpcztcclxuICAgICAgICAgICAgZ2V0VG9rZW5pemVkRG9jcyh0aGlzLm5ld0RvY3MsIGZ1bmN0aW9uKHJlc3Ape1xyXG4gICAgICAgICAgICAgICAgc2VsZi5uZXdEb2NzUHJvY2Nlc3NlZCA9IHJlc3A7XHJcbiAgICAgICAgICAgICAgICBzZWxmLnNob3dQcm9jZXNzZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHNhdmVDaGFuZ2VzOiBmdW5jdGlvbigpe1xyXG4gICAgICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcbiAgICAgICAgICAgIHNlbGYuc3VjY2VzcyA9IGZhbHNlO1xyXG4gICAgICAgICAgICBzZWxmLmZhaWx1cmUgPSBmYWxzZTtcclxuICAgICAgICAgICAgaWYgKHRoaXMuc2V0dGluZ3Muc2VsZWN0ZWREYXRhc2V0ID09IDApe1xyXG4gICAgICAgICAgICAgICAgaWYodGhpcy5zZXR0aW5ncy5lbmQxIC0gdGhpcy5zZXR0aW5ncy5zdGFydDEgPCAxMCl7XHJcbiAgICAgICAgICAgICAgICAgICAgYWxlcnQoXCJUaGVyZSBuZWVkcyB0byBiZSBhdGxlYXN0IDUgZG9jdW1lbnRzKCYgPD0gNTApIGZvciBIYXBweSBEQi4gQW5kIHN0YXJ0IGluZGV4IGNhbiBub3QgYmUgZ3JlYXRlciB0aGFuIGVuZC5cIik7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmKHRoaXMuc2V0dGluZ3MuZW5kMSAtIHRoaXMuc2V0dGluZ3Muc3RhcnQxID4gNTApe1xyXG4gICAgICAgICAgICAgICAgICAgIGFsZXJ0KFwiVGhlcmUgbmVlZHMgdG8gYmUgbGVzcyB0aGFuIDUwIGRvY3VtZW50cyBmb3IgSGFwcHlEQi5cIik7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKHRoaXMuc2V0dGluZ3Muc2VsZWN0ZWREYXRhc2V0ID09IDEpe1xyXG4gICAgICAgICAgICAgICAgaWYodGhpcy5zZXR0aW5ncy5lbmQyIC0gdGhpcy5zZXR0aW5ncy5zdGFydDIgPCA1KXtcclxuICAgICAgICAgICAgICAgICAgICBhbGVydChcIlRoZXJlIG5lZWRzIHRvIGJlIGF0bGVhc3QgNSBkb2N1bWVudHMoJiA8PSAzMCkgZm9yIE1lZGl1bSBBcnRpY2xlcy4gQW5kIHN0YXJ0IGluZGV4IGNhbiBub3QgYmUgZ3JlYXRlciB0aGFuIGVuZC5cIik7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmKHRoaXMuc2V0dGluZ3MuZW5kMiAtIHRoaXMuc2V0dGluZ3Muc3RhcnQyID4gMzApe1xyXG4gICAgICAgICAgICAgICAgICAgIGFsZXJ0KFwiVGhlcmUgbmVlZHMgdG8gYmUgbGVzcyB0aGFuIDMwIGRvY3VtZW50cyBmb3IgTWVkaXVtIEFydGljbGVzLlwiKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodGhpcy5zZXR0aW5ncy5zZWxlY3RlZERhdGFzZXQgPT0gMil7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCF0aGlzLnNob3dQcm9jZXNzZWQpe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBhbGVydChcIlBsZWFzZSBwcm9jZXNzIGFsbCBkb2N1bWVudHMgZmlyc3RcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgd2luZG93LmRvY3VtZW50cyA9IHRoaXMubmV3RG9jc1Byb2NjZXNzZWQ7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgc2VsZi5sb2FkaW5nID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgICAgIGdldEFuYWx5c2lzKHRoaXMuc2V0dGluZ3Muc2VsZWN0ZWRNZXRob2QsIGZ1bmN0aW9uKHJlc3Ape1xyXG4gICAgICAgICAgICAgICAgc2VsZi5zdWNjZXNzID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIHNlbGYubG9hZGluZyA9IGZhbHNlO1xyXG4gICAgICAgICAgICB9LCBmdW5jdGlvbiAoZXJyb3JTdGF0dXMpIHtcclxuICAgICAgICAgICAgICAgIHNlbGYubG9hZGluZyA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgc2VsZi5mYWlsdXJlID0gdHJ1ZTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuICAgIG1vdW50ZWQ6IGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgY29uc29sZS5sb2coXCJNb3VudGVkXCIpO1xyXG4gICAgICAgIGxvYWREMygpO1xyXG4gICAgICAgIGxvYWRKcXVlcnkoKTtcclxuICAgIH1cclxufSk7IiwiZnVuY3Rpb24gbG9hZFdvcmRDbG91ZChyZXNwKXtcclxuICAgIGxldCBkYXRhID0gW107XHJcbiAgICBmb3IodmFyIHdvcmQgaW4gcmVzcFtcIm92ZXJhbGxfd29yZFwiXSl7XHJcbiAgICAgICAgbGV0IHdlaWdodCA9IHJlc3BbXCJvdmVyYWxsX3dvcmRcIl1bd29yZF07XHJcbiAgICAgICAgIGRhdGEucHVzaCh7XHJcbiAgICAgICAgICAgIG5hbWU6IHdvcmQsXHJcbiAgICAgICAgICAgIHdlaWdodDogd2VpZ2h0XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbiAgICBjcmVhdGVXb3JkQ2xvdWQoXCJvdmVyYWxsLXdjXCIsIGRhdGEsIFwiQWxsIERvY3VtZW50c1wiKTtcclxuXHJcbiAgICBmb3IodmFyIHRvcGljIGluIHJlc3BbXCJ0b3BpY193b3JkXCJdKXtcclxuICAgICAgICBsZXQgZGF0YSA9IFtdO1xyXG4gICAgICAgIGZvcih2YXIgd29yZCBpbiByZXNwW1widG9waWNfd29yZFwiXVt0b3BpY10pe1xyXG4gICAgICAgICAgICBsZXQgd2VpZ2h0ID0gcmVzcFtcInRvcGljX3dvcmRcIl1bdG9waWNdW3dvcmRdO1xyXG4gICAgICAgICAgICBkYXRhLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgbmFtZTogd29yZCxcclxuICAgICAgICAgICAgICAgIHdlaWdodDogd2VpZ2h0XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICAkKFwiI3RvcGljLXdjc1wiKS5hcHBlbmQoJzxkaXYgY2xhc3M9XCJjb2wtc20tNlwiPjxkaXYgc3R5bGU9XCJvdXRsaW5lOiBzb2xpZCAxcHg7XCIgaWQ9XCJ0b3BpYycrdG9waWMrJ1wiIHN0eWxlPVwiaGVpZ2h0OiAzMDBweDtcIj48L2Rpdj48L2Rpdj4nKTtcclxuICAgICAgICBjcmVhdGVXb3JkQ2xvdWQoXCJ0b3BpY1wiK3RvcGljLCBkYXRhLCBcIlRvcGljIFwiK3RvcGljKTtcclxuICAgIH1cclxufVxyXG5cclxuZnVuY3Rpb24gY3JlYXRlV29yZENsb3VkKGlkLCBkYXRhLCB0aXRsZSl7XHJcbiAgICBIaWdoY2hhcnRzLmNoYXJ0KGlkLCB7XHJcbiAgICAgICAgc2VyaWVzOiBbe1xyXG4gICAgICAgICAgICB0eXBlOiAnd29yZGNsb3VkJyxcclxuICAgICAgICAgICAgZGF0YTogZGF0YSxcclxuICAgICAgICAgICAgcm90YXRpb246IHtcclxuICAgICAgICAgICAgICAgIGZyb206IDAsXHJcbiAgICAgICAgICAgICAgICB0bzogMCxcclxuICAgICAgICAgICAgICAgIG9yaWVudGF0aW9uczogNVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBuYW1lOiAnU2NvcmUnXHJcbiAgICAgICAgfV0sXHJcbiAgICAgICAgdGl0bGU6IHtcclxuICAgICAgICAgICAgdGV4dDogdGl0bGVcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufSJdfQ==
