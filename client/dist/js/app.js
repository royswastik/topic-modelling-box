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
    getAnalysis("word2vec");
  });
}

function getDocs(texts) {
  return window.documents = texts.map(function (x) {
    return x.split();
  });
}

function getAnalysis(method, success) {
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
  });
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

function getTokenizedDocs(docs, successCallback) {
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
    alert("Request failed: " + textStatus);
  });
} // docs format: List[List[string(word)]]


function getWord2VecClusters(docs, successCallback) {
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
    alert("Request failed: " + textStatus);
  });
}

function getLDAClusters(docs, successCallback) {
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
    alert("Request failed: " + textStatus);
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
  var keys1 = ["Overall Term Frequency", "Estimated Term frequency within the selected topic"];
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
      selectedMethod: 'word2Vec',
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
      self.loading = true;

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

      getAnalysis(this.settings.selectedMethod, function (resp) {
        self.success = true;
        self.loading = false;
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNsdXN0ZXJfZm9yY2VfbGF5b3V0LmpzIiwiZXZlbnRzLmpzIiwibWFpbi5qcyIsIm5ldHdvcmsuanMiLCJwYXJhbGxlbC1jb29yZGluYXRlLWhjLmpzIiwicGFyYWxsZWwtY29vcmRpbmF0ZS5qcyIsInNjYXR0ZXJfcGxvdF93aXRoX3dlaWdodHMuanMiLCJzdGFja2VkX2Jhcl9ncmFwaC5qcyIsInV0aWwuanMiLCJ2dWVfbW9kZWwuanMiLCJ3b3JkY2xvdWQuanMiXSwibmFtZXMiOlsiQXJyYXkiLCJwcm90b3R5cGUiLCJjb250YWlucyIsInYiLCJpIiwibGVuZ3RoIiwidW5pcXVlIiwiYXJyIiwiaW5jbHVkZXMiLCJwdXNoIiwicmVuZGVyQ2x1c3RlckZvcmNlTGF5b3V0IiwiZGF0YSIsImRhdGFWYWwiLCJmaW5hbF9kaWN0Iiwia2V5IiwiaGFzT3duUHJvcGVydHkiLCJjaGlsZHJlbldvcmRzIiwiY2hpbGRLZXkiLCJjbHVzdGVyX2RhdGEiLCJjb3VudCIsImhhc2giLCJhcnJheV9jaGlsZCIsImNoaWxkcyIsImNoaWxkX2hhc2giLCJjaGlsZHJlbiIsImQzIiwid2luZG93IiwiZDNWMyIsInJlbmRlckNsdXN0ZXIiLCJyYWRpdXMiLCJkZW5kb2dyYW1Db250YWluZXIiLCJkZW5kb2dyYW1EYXRhU291cmNlIiwicm9vdE5vZGVTaXplIiwibGV2ZWxPbmVOb2RlU2l6ZSIsImxldmVsVHdvTm9kZVNpemUiLCJsZXZlbFRocmVlTm9kZVNpemUiLCJkdXJhdGlvbiIsInJvb3RKc29uRGF0YSIsImNsdXN0ZXIiLCJsYXlvdXQiLCJzaXplIiwic2VwYXJhdGlvbiIsImEiLCJiIiwicGFyZW50IiwiZGVwdGgiLCJkaWFnb25hbCIsInN2ZyIsInJhZGlhbCIsInByb2plY3Rpb24iLCJkIiwieSIsIngiLCJNYXRoIiwiUEkiLCJjb250YWluZXJEaXYiLCJzZWxlY3QiLCJkb2N1bWVudCIsImdldEVsZW1lbnRCeUlkIiwiYXBwZW5kIiwiYXR0ciIsInRleHQiLCJvbiIsImNvbGxhcHNlTGV2ZWxzIiwic3ZnUm9vdCIsImNhbGwiLCJiZWhhdmlvciIsInpvb20iLCJzY2FsZSIsInNjYWxlRXh0ZW50IiwiYW5pbUdyb3VwIiwiZm9yRWFjaCIsImNvbGxhcHNlIiwiY3JlYXRlQ29sbGFwc2libGVEZW5kcm9HcmFtIiwic291cmNlIiwibm9kZXMiLCJwYXRobGlua3MiLCJsaW5rcyIsIm5vZGUiLCJzZWxlY3RBbGwiLCJpZCIsIm5vZGVFbnRlciIsImVudGVyIiwidG9nZ2xlQ2hpbGRyZW4iLCJhbGlhcyIsIm5hbWUiLCJub2RlVXBkYXRlIiwidHJhbnNpdGlvbiIsInN0eWxlIiwiY29sb3IiLCJvcmRlciIsIm5vZGVFeGl0IiwiZXhpdCIsInJlbW92ZSIsImxpbmsiLCJ0YXJnZXQiLCJpbnNlcnQiLCJvIiwieDAiLCJ5MCIsImNsaWNrVHlwZSIsIl9jaGlsZHJlbiIsInR5cGUiLCJ1bmRlZmluZWQiLCJoaWdobGlnaHROb2RlU2VsZWN0aW9ucyIsImhpZ2hsaWdodFJvb3RUb05vZGVQYXRoIiwiaGlnaGxpZ2h0TGlua0NvbG9yIiwiZGVmYXVsdExpbmtDb2xvciIsIm5vZGVDb2xvciIsInBhdGhMaW5rcyIsImRkIiwiYW5jZXN0b3JzIiwiXyIsImlzVW5kZWZpbmVkIiwibWF0Y2hlZExpbmtzIiwiZmlsdGVyIiwiYW55IiwicCIsImVhY2giLCJhbmltYXRlQ2hhaW5zIiwiY2xhc3NlZCIsIm92ZXJsYXlCb3giLCJnZXRCQm94IiwiZXZlbnQiLCJ0cmFuc2xhdGUiLCJjaGVja0ZvclRoaXJkTGV2ZWxPcGVuQ2hpbGRyZW4iLCJ0b2dnbGVBbGxTZWNvbmRMZXZlbENoaWxkcmVuIiwidG9nZ2xlU2Vjb25kTGV2ZWxDaGlsZHJlbiIsInJvb3RJbmRleCIsInJvb3RMZW5ndGgiLCJpc05vZGVPcGVuIiwiY2hpbGRJbmRleCIsImNoaWxkTGVuZ3RoIiwic2Vjb25kTGV2ZWxDaGlsZCIsImxvYWRKcXVlcnkiLCIkIiwicmVhZHkiLCJjbGljayIsInNpZGViYXIiLCJyZXF1aXJlIiwiY29uZmlnIiwicGF0aHMiLCJsb2FkRDMiLCJkM09sZCIsImRvY3VtZW50cyIsImdldEFuYWx5c2lzIiwiZ2V0RG9jcyIsInRleHRzIiwibWFwIiwic3BsaXQiLCJtZXRob2QiLCJzdWNjZXNzIiwiZG9jcyIsImZuYyIsImdldExEQUNsdXN0ZXJzIiwiZ2V0V29yZDJWZWNDbHVzdGVycyIsImxvYWRERnVuYyIsInJlc3AiLCJnbG9iYWxfZGF0YSIsImluaXRQYWdlMSIsImluaXRQYWdlMiIsImluaXRQYWdlMyIsImluaXRQYWdlNCIsImxvYWRWaXN1YWxpemF0aW9ucyIsInJlbmRlckNsdXN0ZXJBbmFseXNpcyIsImh0bWwiLCJsb2FkUGFyYWxsZWxDb29yZGluYXRlIiwibG9hZFBhcmFsbGVsQ29vcmRpbmF0ZXNIQyIsImxvYWRXb3JkQ2xvdWQiLCJnZXQyRFZlY3RvcnMiLCJ2ZWN0b3JzIiwic3VjY2Vzc0NhbGxiYWNrIiwicmVxdWVzdCIsImFqYXgiLCJ1cmwiLCJkb25lIiwicmVzcG9uc2UiLCJmYWlsIiwianFYSFIiLCJ0ZXh0U3RhdHVzIiwiYWxlcnQiLCJnZXRUb2tlbml6ZWREb2NzIiwiSlNPTiIsInN0cmluZ2lmeSIsImNvbnRlbnRUeXBlIiwiZGF0YVR5cGUiLCJzdGFydCIsInZ1ZUFwcCIsInNldHRpbmdzIiwic3RhcnQyIiwiZW5kIiwiZW5kMiIsInNlbGVjdGVkIiwic2VsZWN0ZWREYXRhc2V0IiwicGFyc2UiLCJzdGFydDEiLCJlbmQxIiwiZ2VuZXJhdGVQYXJhbGxlbENvb3JkaW5hdGVEYXRhSEMiLCJIaWdoY2hhcnRzIiwiY2hhcnQiLCJwYXJhbGxlbENvb3JkaW5hdGVzIiwicGFyYWxsZWxBeGVzIiwibGluZVdpZHRoIiwidGl0bGUiLCJwbG90T3B0aW9ucyIsInNlcmllcyIsImFuaW1hdGlvbiIsIm1hcmtlciIsImVuYWJsZWQiLCJzdGF0ZXMiLCJob3ZlciIsImhhbG8iLCJldmVudHMiLCJtb3VzZU92ZXIiLCJncm91cCIsInRvRnJvbnQiLCJ4QXhpcyIsImNhdGVnb3JpZXMiLCJvZmZzZXQiLCJ5QXhpcyIsIk9iamVjdCIsImtleXMiLCJ2YWx1ZXMiLCJjb2xvcnMiLCJzZXQiLCJzaGFkb3ciLCJtYXJnaW4iLCJ0b3AiLCJyaWdodCIsImJvdHRvbSIsImxlZnQiLCJ3aWR0aCIsImhlaWdodCIsIm9yZGluYWwiLCJyYW5nZVBvaW50cyIsImRyYWdnaW5nIiwibGluZSIsImJhY2tncm91bmQiLCJmb3JlZ3JvdW5kIiwiZGltZW5zaW9ucyIsImNhcnMiLCJnZW5lcmF0ZVBhcmFsbGVsQ29vcmRpbmF0ZURhdGEiLCJheGlzRCIsImF4aXMiLCJvcmllbnQiLCJ0aWNrVmFsdWVzIiwicGFyc2VJbnQiLCJheGlzVCIsImF4aXNXIiwicGFyc2VGbG9hdCIsImRvbWFpbiIsImxpbmVhciIsImV4dGVudCIsInJhbmdlIiwicGF0aCIsImciLCJkcmFnIiwib3JpZ2luIiwibWluIiwibWF4Iiwic29ydCIsInBvc2l0aW9uIiwiZGVsYXkiLCJicnVzaCIsImJydXNoc3RhcnQiLCJzb3VyY2VFdmVudCIsInN0b3BQcm9wYWdhdGlvbiIsImFjdGl2ZXMiLCJlbXB0eSIsImV4dGVudHMiLCJldmVyeSIsImRvY3VtZW50X3RvcGljIiwidG9waWNfdmVjdG9ycyIsImJiIiwicXVlcnlTZWxlY3RvciIsImdldEJvdW5kaW5nQ2xpZW50UmVjdCIsInZhbHVlIiwiYyIsImxhYmVsWCIsImxhYmVsWSIsInNjYWxlTGluZWFyIiwic2NhbGVTcXJ0Iiwib3BhY2l0eSIsImF4aXNCb3R0b20iLCJheGlzTGVmdCIsInJlbmRlckJhckdyYXBoIiwiZmFkZSIsImZhZGVPdXQiLCJ0b3BpY19udW1iZXIiLCJmaW5hbF9kYXRhIiwidGVtcCIsIlN0YXRlIiwidG9waWNfZnJlcXVlbmN5IiwiYWJzIiwib3ZlcmFsbCIsInRvdGFsIiwiY29uc29sZSIsImxvZyIsInNjYWxlQmFuZCIsInJhbmdlUm91bmQiLCJwYWRkaW5nSW5uZXIiLCJhbGlnbiIsInoiLCJzY2FsZU9yZGluYWwiLCJuaWNlIiwic3RhY2siLCJiYW5kd2lkdGgiLCJ0aWNrcyIsInBvcCIsImxlZ2VuZCIsInNsaWNlIiwicmV2ZXJzZSIsImtleXMxIiwic3ZnMSIsImdlbmVyYXRlVG9waWNWZWN0b3JzIiwidG9waWNWZWN0b3JzIiwidG9waWNfd29yZF9wcm9iYWJpbGl0eV9pbl90b3BpYyIsInZlY3RvciIsInRvcGljX3RocmVzaG9sZCIsIndvcmRfdGhyZXNob2xkIiwidmlzRGF0YSIsImRvY0tleSIsInRvcGljIiwidG9waWNTY29yZSIsIndvcmQiLCJ3b3JkU2NvcmUiLCJpbmRleE9mIiwiVnVlIiwiZWwiLCJtZXNzYWdlIiwibm9uZVNlbGVjdGVkIiwic2VsZWN0ZWRQYWdlIiwicGxheWVyRGV0YWlsIiwib3ZlcnZpZXdGaWx0ZXJzIiwibmV3RG9jcyIsInNlbGVjdGVkTWFwIiwibG9hZGluZyIsIm5ld0RvYyIsIm5ld0RvY3NQcm9jY2Vzc2VkIiwic2hvd1Byb2Nlc3NlZCIsInNlbGVjdGVkTWV0aG9kIiwibGRhVG9waWNUaHJlc2hvbGQiLCJ3b3JkMlZlY1RocmVzaG9sZCIsIm1ldGhvZHMiLCJzZWxlY3RQYWdlIiwiYWRkTmV3RG9jIiwidHJpbSIsInByb2Nlc3NEb2NzIiwic2VsZiIsInNhdmVDaGFuZ2VzIiwibW91bnRlZCIsIndlaWdodCIsImNyZWF0ZVdvcmRDbG91ZCIsInJvdGF0aW9uIiwiZnJvbSIsInRvIiwib3JpZW50YXRpb25zIl0sIm1hcHBpbmdzIjoiOzs7O0FBQUFBLEtBQUssQ0FBQ0MsU0FBTixDQUFnQkMsUUFBaEIsR0FBMkIsVUFBU0MsQ0FBVCxFQUFZO0FBQ25DLE9BQUksSUFBSUMsQ0FBQyxHQUFHLENBQVosRUFBZUEsQ0FBQyxHQUFHLEtBQUtDLE1BQXhCLEVBQWdDRCxDQUFDLEVBQWpDLEVBQXFDO0FBQ2pDLFFBQUcsS0FBS0EsQ0FBTCxNQUFZRCxDQUFmLEVBQWtCLE9BQU8sSUFBUDtBQUNyQjs7QUFDRCxTQUFPLEtBQVA7QUFDSCxDQUxEOztBQU9BSCxLQUFLLENBQUNDLFNBQU4sQ0FBZ0JLLE1BQWhCLEdB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QUNONEUsUUFBQUEsSUFBSSxFQUFFK08sSUFEQTtBQUVOMkIsUUFBQUEsTUFBTSxFQUFFQTtBQUZGLE9BQVY7QUFJSDs7QUFDRHhOLElBQUFBLENBQUMsQ0FBQyxZQUFELENBQUQsQ0FBZ0I1RSxNQUFoQixDQUF1QixxRUFBbUV1USxLQUFuRSxHQUF5RSx1Q0FBaEc7QUFDQThCLElBQUFBLGVBQWUsQ0FBQyxVQUFROUIsS0FBVCxFQUFnQnZULEtBQWhCLEVBQXNCLFdBQVN1VCxLQUEvQixDQUFmO0FBQ0g7QUFDSjs7QUFFRCxTQUFTOEIsZUFBVCxDQUF5QmhSLEVBQXpCLEVBQTZCckUsSUFBN0IsRUFBbUNnTSxLQUFuQyxFQUF5QztBQUNyQ0wsRUFBQUEsVUFBVSxDQUFDQyxLQUFYLENBQWlCdkgsRUFBakIsRUFBcUI7QUFDakI2SCxJQUFBQSxNQUFNLEVBQUUsQ0FBQztBQUNMdkcsTUFBQUEsSUFBSSxFQUFFLFdBREQ7QUFFTDNGLE1BQUFBLElBQUksRUFBRUEsSUFGRDtBQUdMc1YsTUFBQUEsUUFBUSxFQUFFO0FBQ05DLFFBQUFBLElBQUksRUFBRSxDQURBO0FBRU5DLFFBQUFBLEVBQUUsRUFBRSxDQUZFO0FBR05DLFFBQUFBLFlBQVksRUFBRTtBQUhSLE9BSEw7QUFRTC9RLE1BQUFBLElBQUksRUFBRTtBQVJELEtBQUQsQ0FEUztBQVdqQnNILElBQUFBLEtBQUssRUFBRTtBQUNIOUksTUFBQUEsSUFBSSxFQUFFOEk7QUFESDtBQVhVLEdBQXJCO0FBZUgiLCJmaWxlIjoiYXBwLmpzIiwic291cmNlc0NvbnRlbnQiOlsiQXJyYXkucHJvdG90eXBlLmNvbnRhaW5zID0gZnVuY3Rpb24odikge1xyXG4gICAgZm9yKHZhciBpID0gMDsgaSA8IHRoaXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICBpZih0aGlzW2ldID09PSB2KSByZXR1cm4gdHJ1ZTtcclxuICAgIH1cclxuICAgIHJldHVybiBmYWxzZTtcclxufTtcclxuXHJcbkFycmF5LnByb3RvdHlwZS51bmlxdWUgPSBmdW5jdGlvbigpIHtcclxuICAgIHZhciBhcnIgPSBbXTtcclxuICAgIGZvcih2YXIgaSA9IDA7IGkgPCB0aGlzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgaWYoIWFyci5pbmNsdWRlcyh0aGlzW2ldKSkge1xyXG4gICAgICAgICAgICBhcnIucHVzaCh0aGlzW2ldKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gYXJyOyBcclxufVxyXG5cclxuZnVuY3Rpb24gcmVuZGVyQ2x1c3RlckZvcmNlTGF5b3V0KGRhdGEpe1xyXG5cdHZhciBkYXRhVmFsID0gZGF0YVtcInRvcGljX3dvcmRcIl07XHJcblx0dmFyIGZpbmFsX2RpY3QgPSB7fTtcclxuXHRmb3IgKHZhciBrZXkgaW4gZGF0YVZhbCkge1xyXG5cdCAgICBpZiAoZGF0YVZhbC5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XHJcblxyXG5cdCAgICBcdHZhciBjaGlsZHJlbldvcmRzID0gZGF0YVZhbFtrZXldO1xyXG5cclxuXHQgICAgXHRmb3IodmFyIGNoaWxkS2V5IGluIGNoaWxkcmVuV29yZHMpe1xyXG5cclxuXHQgICAgXHRcdGlmIChjaGlsZHJlbldvcmRzLmhhc093blByb3BlcnR5KGNoaWxkS2V5KSAmJiBjaGlsZHJlbldvcmRzW2NoaWxkS2V5XSA+IDAuMDEpIHtcclxuXHJcblx0ICAgIFx0XHRcdGlmKCEoY2hpbGRLZXkgaW4gZmluYWxfZGljdCkpe1xyXG5cdCAgICBcdFx0XHRcdGZpbmFsX2RpY3RbY2hpbGRLZXldID0gW107XHJcblx0ICAgIFx0XHRcdH1cclxuICAgIFx0XHRcdFx0ZmluYWxfZGljdFtjaGlsZEtleV0ucHVzaChrZXkpO1xyXG5cdCAgICBcdFx0XHRcclxuXHQgICAgXHRcdH1cclxuXHQgICAgXHR9IFxyXG5cdCAgICB9XHJcbiAgXHR9XHJcbiAgXHR2YXIgY2x1c3Rlcl9kYXRhID0ge1xyXG4gIFx0XHRcIm5hbWVcIjpcIlwiLFxyXG4gIFx0XHRcImNoaWxkcmVuXCI6W11cclxuICBcdH1cclxuXHJcbiAgXHR2YXIgY291bnQ9MDtcclxuICBcdGZvcih2YXIga2V5IGluIGZpbmFsX2RpY3Qpe1xyXG4gIFx0XHRpZiAoZmluYWxfZGljdC5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XHJcbiAgXHRcdFx0Y291bnQgPSBjb3VudCArIDE7XHJcbiAgXHRcdFx0dmFyIGhhc2ggPSB7fTtcclxuICBcdFx0XHRoYXNoW1wib3JkZXJcIl0gPSBjb3VudDtcclxuICBcdFx0XHRoYXNoW1wiYWxpYXNcIl0gPSBcIldoaXRlL3JlZC9qYWNrIHBpbmVcIjtcclxuICBcdFx0XHRoYXNoW1wiY29sb3JcIl0gPSBcIiNDN0VBRkJcIjtcclxuICBcdFx0XHRoYXNoW1wibmFtZVwiXSA9IGtleTtcclxuXHJcblxyXG4gIFx0XHRcdHZhciBhcnJheV9jaGlsZCA9IGZpbmFsX2RpY3Rba2V5XS51bmlxdWUoKTtcclxuICBcdFx0XHR2YXIgY2hpbGRzID1bXTtcclxuICBcdFx0XHRmb3IodmFyIGk9MDsgaSA8IGFycmF5X2NoaWxkLmxlbmd0aDtpKyspe1xyXG4gIFx0XHRcdFx0dmFyIGNoaWxkX2hhc2ggPSB7fTtcclxuICBcdFx0XHRcdGNoaWxkX2hhc2hbXCJvcmRlclwiXSA9IGkrMTtcclxuICBcdFx0XHRcdGNoaWxkX2hhc2hbXCJhbGlhc1wiXSA9IGkrMSArIFwiXCI7XHJcbiAgXHRcdFx0XHRjaGlsZF9oYXNoW1wiY29sb3JcIl0gPSBcIiNDN0VBRkJcIjtcclxuICBcdFx0XHRcdGNoaWxkX2hhc2hbXCJuYW1lXCJdPSBhcnJheV9jaGlsZFtpXTtcclxuICBcdFx0XHRcdGNoaWxkcy5wdXNoKGNoaWxkX2hhc2gpO1xyXG4gIFx0XHRcdH1cclxuICBcdFx0XHRoYXNoW1wiY2hpbGRyZW5cIl0gPSBjaGlsZHM7XHJcbiAgXHRcdFx0Y2x1c3Rlcl9kYXRhLmNoaWxkcmVuLnB1c2goaGFzaCk7XHJcbiAgXHRcdH1cclxuICBcdH1cclxuICBcdHZhciBkMyA9ICAgd2luZG93LmQzVjM7XHJcbiAgXHRyZW5kZXJDbHVzdGVyKGNsdXN0ZXJfZGF0YSwgZDMpO1xyXG59XHJcblxyXG5mdW5jdGlvbiByZW5kZXJDbHVzdGVyKGNsdXN0ZXJfZGF0YSwgZDMpe1xyXG4gIHZhciByYWRpdXMgPSAyMDA7XHJcbiAgdmFyIGRlbmRvZ3JhbUNvbnRhaW5lciA9IFwic3BlY2llc2NvbGxhcHNpYmxlXCI7XHJcbiAgdmFyIGRlbmRvZ3JhbURhdGFTb3VyY2UgPSBcImZvcmVzdFNwZWNpZXMuanNvblwiO1xyXG5cclxuICB2YXIgcm9vdE5vZGVTaXplID0gNjtcclxuICB2YXIgbGV2ZWxPbmVOb2RlU2l6ZSA9IDM7XHJcbiAgdmFyIGxldmVsVHdvTm9kZVNpemUgPSAzO1xyXG4gIHZhciBsZXZlbFRocmVlTm9kZVNpemUgPSAyO1xyXG5cclxuXHJcbiAgdmFyIGkgPSAwO1xyXG4gIHZhciBkdXJhdGlvbiA9IDMwMDsgLy9DaGFuZ2luZyB2YWx1ZSBkb2Vzbid0IHNlZW0gYW55IGNoYW5nZXMgaW4gdGhlIGR1cmF0aW9uID8/XHJcblxyXG4gIHZhciByb290SnNvbkRhdGE7XHJcblxyXG4gIHZhciBjbHVzdGVyID0gZDMubGF5b3V0LmNsdXN0ZXIoKVxyXG4gICAgICAuc2l6ZShbMzYwLHJhZGl1cyAtIDEyMF0pXHJcbiAgICAgIC5zZXBhcmF0aW9uKGZ1bmN0aW9uKGEsIGIpIHtcclxuICAgICAgICByZXR1cm4gKGEucGFyZW50ID09IGIucGFyZW50ID8gMSA6IDIpIC8gYS5kZXB0aDtcclxuICAgICAgfSk7XHJcblxyXG4gIHZhciBkaWFnb25hbCA9IGQzLnN2Zy5kaWFnb25hbC5yYWRpYWwoKVxyXG4gICAgICAucHJvamVjdGlvbihmdW5jdGlvbihkKSB7IHJldHVybiBbZC55LCBkLnggLyAxODAgKiBNYXRoLlBJXTsgfSk7XHJcblxyXG4gIHZhciBjb250YWluZXJEaXYgPSBkMy5zZWxlY3QoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoZGVuZG9ncmFtQ29udGFpbmVyKSk7XHJcblxyXG4gIGNvbnRhaW5lckRpdi5hcHBlbmQoXCJidXR0b25cIilcclxuICAgICAgLmF0dHIoXCJpZFwiLFwiY29sbGFwc2UtYnV0dG9uXCIpXHJcbiAgICAgIC50ZXh0KFwiQ29sbGFwc2UhXCIpXHJcbiAgICAgIC5vbihcImNsaWNrXCIsY29sbGFwc2VMZXZlbHMpO1xyXG5cclxuICB2YXIgc3ZnUm9vdCA9IGNvbnRhaW5lckRpdi5hcHBlbmQoXCJzdmc6c3ZnXCIpXHJcbiAgICAgIC5hdHRyKFwid2lkdGhcIiwgXCIxMDAlXCIpXHJcbiAgICAgIC5hdHRyKFwiaGVpZ2h0XCIsIFwiMTAwJVwiKVxyXG4gICAgICAuYXR0cihcInZpZXdCb3hcIiwgXCItXCIgKyAocmFkaXVzKSArIFwiIC1cIiArIChyYWRpdXMgLSA1MCkgK1wiIFwiKyByYWRpdXMqMiArXCIgXCIrIHJhZGl1cyoyKVxyXG4gICAgICAuY2FsbChkMy5iZWhhdmlvci56b29tKCkuc2NhbGUoMC45KS5zY2FsZUV4dGVudChbMC4xLCAzXSkub24oXCJ6b29tXCIsIHpvb20pKS5vbihcImRibGNsaWNrLnpvb21cIiwgbnVsbClcclxuICAgICAgLmFwcGVuZChcInN2ZzpnXCIpO1xyXG5cclxuICAvLyBBZGQgdGhlIGNsaXBwaW5nIHBhdGhcclxuICBzdmdSb290LmFwcGVuZChcInN2ZzpjbGlwUGF0aFwiKS5hdHRyKFwiaWRcIiwgXCJjbGlwcGVyLXBhdGhcIilcclxuICAgICAgLmFwcGVuZChcInN2ZzpyZWN0XCIpXHJcbiAgICAgIC5hdHRyKCdpZCcsICdjbGlwLXJlY3QtYW5pbScpO1xyXG5cclxuICB2YXIgYW5pbUdyb3VwID0gc3ZnUm9vdC5hcHBlbmQoXCJzdmc6Z1wiKVxyXG4gICAgICAuYXR0cihcImNsaXAtcGF0aFwiLCBcInVybCgjY2xpcHBlci1wYXRoKVwiKTtcclxuXHJcbiAgXHRyb290SnNvbkRhdGEgPSBjbHVzdGVyX2RhdGE7XHJcblxyXG4gICAgLy9TdGFydCB3aXRoIGFsbCBjaGlsZHJlbiBjb2xsYXBzZWRcclxuICAgIHJvb3RKc29uRGF0YS5jaGlsZHJlbi5mb3JFYWNoKGNvbGxhcHNlKTtcclxuXHJcbiAgICAvL0luaXRpYWxpemUgdGhlIGRlbmRyb2dyYW1cclxuICBcdGNyZWF0ZUNvbGxhcHNpYmxlRGVuZHJvR3JhbShyb290SnNvbkRhdGEpO1xyXG5cclxuXHJcblxyXG5cclxuICBmdW5jdGlvbiBjcmVhdGVDb2xsYXBzaWJsZURlbmRyb0dyYW0oc291cmNlKSB7XHJcblxyXG4gICAgLy8gQ29tcHV0ZSB0aGUgbmV3IHRyZWUgbGF5b3V0LlxyXG4gICAgdmFyIG5vZGVzID0gY2x1c3Rlci5ub2Rlcyhyb290SnNvbkRhdGEpO1xyXG4gICAgdmFyIHBhdGhsaW5rcyA9IGNsdXN0ZXIubGlua3Mobm9kZXMpO1xyXG5cclxuICAgIC8vIE5vcm1hbGl6ZSBmb3Igbm9kZXMnIGZpeGVkLWRlcHRoLlxyXG4gICAgbm9kZXMuZm9yRWFjaChmdW5jdGlvbihkKSB7XHJcbiAgICAgIGlmKGQuZGVwdGggPD0yKXtcclxuICAgICAgICBkLnkgPSBkLmRlcHRoKjcwO1xyXG4gICAgICB9ZWxzZVxyXG4gICAgICB7XHJcbiAgICAgICAgZC55ID0gZC5kZXB0aCoxMDA7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIC8vIFVwZGF0ZSB0aGUgbm9kZXPigKZcclxuICAgIHZhciBub2RlID0gc3ZnUm9vdC5zZWxlY3RBbGwoXCJnLm5vZGVcIilcclxuICAgICAgICAuZGF0YShub2RlcywgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5pZCB8fCAoZC5pZCA9ICsraSk7IH0pO1xyXG5cclxuICAgIC8vIEVudGVyIGFueSBuZXcgbm9kZXMgYXQgdGhlIHBhcmVudCdzIHByZXZpb3VzIHBvc2l0aW9uLlxyXG4gICAgdmFyIG5vZGVFbnRlciA9IG5vZGUuZW50ZXIoKS5hcHBlbmQoXCJnXCIpXHJcbiAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcIm5vZGVcIilcclxuICAgICAgICAub24oXCJjbGlja1wiLCB0b2dnbGVDaGlsZHJlbik7XHJcblxyXG4gICAgbm9kZUVudGVyLmFwcGVuZChcImNpcmNsZVwiKTtcclxuXHJcbiAgICBub2RlRW50ZXIuYXBwZW5kKFwidGV4dFwiKVxyXG4gICAgLmF0dHIoXCJ4XCIsIDEwKVxyXG4gICAgLmF0dHIoXCJkeVwiLCBcIi4zNWVtXCIpXHJcbiAgICAuYXR0cihcInRleHQtYW5jaG9yXCIsIFwic3RhcnRcIilcclxuICAgIC50ZXh0KGZ1bmN0aW9uKGQpIHtcclxuICAgICAgICAgIGlmKGQuZGVwdGggPT09IDIpe1xyXG4gICAgICAgICAgICByZXR1cm4gZC5hbGlhcztcclxuICAgICAgICAgIH1cclxuICAgICAgICAgcmV0dXJuIGQubmFtZTtcclxuICAgIH0pO1xyXG5cclxuXHJcbiAgICAvLyBUcmFuc2l0aW9uIG5vZGVzIHRvIHRoZWlyIG5ldyBwb3NpdGlvbi5cclxuICAgIHZhciBub2RlVXBkYXRlID0gbm9kZS50cmFuc2l0aW9uKClcclxuICAgICAgICAuZHVyYXRpb24oZHVyYXRpb24pXHJcbiAgICAgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4gXCJyb3RhdGUoXCIgKyAoZC54IC0gOTApICsgXCIpdHJhbnNsYXRlKFwiICsgZC55ICsgXCIpXCI7IH0pXHJcblxyXG4gICAgbm9kZVVwZGF0ZS5zZWxlY3QoXCJjaXJjbGVcIilcclxuICAgICAgICAuYXR0cihcInJcIiwgZnVuY3Rpb24oZCl7XHJcbiAgICAgICAgICAgIGlmIChkLmRlcHRoID09IDApIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiByb290Tm9kZVNpemU7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIGVsc2UgaWYgKGQuZGVwdGggPT09IDEpIHtcclxuICAgICAgICAgICAgICAgICAgcmV0dXJuIGxldmVsT25lTm9kZVNpemU7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIGVsc2UgaWYgKGQuZGVwdGggPT09IDIpIHtcclxuICAgICAgICAgICAgICAgICAgcmV0dXJuIGxldmVsVHdvTm9kZVNpemU7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICByZXR1cm4gbGV2ZWxUaHJlZU5vZGVTaXplO1xyXG5cclxuICAgICAgICB9KVxyXG4gICAgICAgIC5zdHlsZShcImZpbGxcIiwgZnVuY3Rpb24oZCkge1xyXG4gICAgICAgICAgICAgICBpZihkLmRlcHRoID09PTApe1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIFwiIzgwODA4MFwiO1xyXG4gICAgICAgICAgICAgICB9ZWxzZSBpZihkLmRlcHRoID09PSAxKXtcclxuICAgICAgICAgICAgICAgIGlmKGQubmFtZT09XCJIYXJkd29vZHNcIikgcmV0dXJuIFwiIzgxNjg1NFwiO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIFwiI0MzQjlBMFwiO1xyXG4gICAgICAgICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgICAgIHJldHVybiBkLmNvbG9yO1xyXG4gICAgICAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuICAgICAgICAuc3R5bGUoXCJzdHJva2VcIixmdW5jdGlvbihkKXtcclxuICAgICAgICAgICAgICBpZihkLmRlcHRoPjEpe1xyXG4gICAgICAgICAgICAgICAgICByZXR1cm4gXCJ3aGl0ZVwiO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICBlbHNle1xyXG4gICAgICAgICAgICAgICAgICByZXR1cm4gXCJsaWdodGdyYXlcIjtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgbm9kZVVwZGF0ZS5zZWxlY3QoXCJ0ZXh0XCIpXHJcblxyXG4gICAgICAgIC5hdHRyKCdpZCcsIGZ1bmN0aW9uKGQpe1xyXG4gICAgICAgICAgdmFyIG9yZGVyID0gMDtcclxuICAgICAgICAgIGlmKGQub3JkZXIpb3JkZXIgPSBkLm9yZGVyO1xyXG4gICAgICAgICAgcmV0dXJuICdULScgKyBkLmRlcHRoICsgXCItXCIgKyBvcmRlcjtcclxuICAgICAgICB9KVxyXG4gICAgICAgIC5hdHRyKFwidGV4dC1hbmNob3JcIiwgZnVuY3Rpb24gKGQpIHtcclxuICAgICAgICAgICAgaWYgKGQuZGVwdGggPT09IDEpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBkLnggPCAxODAgPyBcImVuZFwiIDogXCJzdGFydFwiO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBkLnggPCAxODAgPyBcInN0YXJ0XCIgOiBcImVuZFwiO1xyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLmF0dHIoXCJkeVwiLCBmdW5jdGlvbihkKXtcclxuICAgICAgICAgICAgaWYgKGQuZGVwdGggPT09IDEpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBkLnggPCAxODAgPyBcIjEuNGVtXCIgOiBcIi0wLjJlbVwiO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBcIi4zMWVtXCI7XHJcbiAgICAgICAgfSlcclxuICAgICAgICAuYXR0cihcImR4XCIsIGZ1bmN0aW9uIChkKSB7XHJcbiAgICAgICAgICAgIGlmIChkLmRlcHRoID09PSAxKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gMDsgLy9yZXR1cm4gZC54ID4gMTgwID8gMiA6IC0yO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBkLnggPCAxODAgPyAxIDogLTIwO1xyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgZnVuY3Rpb24gKGQpIHtcclxuICAgICAgICAgICAgaWYgKGQuZGVwdGggPCAyKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gXCJyb3RhdGUoXCIgKyAoOTAgLSBkLngpICsgXCIpXCI7XHJcbiAgICAgICAgICAgIH1lbHNlIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBkLnggPCAxODAgPyBudWxsIDogXCJyb3RhdGUoMTgwKVwiO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgLy8gVE9ETzogYXBwcm9wcmlhdGUgdHJhbnNmb3JtXHJcbiAgICB2YXIgbm9kZUV4aXQgPSBub2RlLmV4aXQoKS50cmFuc2l0aW9uKClcclxuICAgICAgICAuZHVyYXRpb24oZHVyYXRpb24pXHJcbiAgICAgICAgLnJlbW92ZSgpO1xyXG5cclxuICAgIC8vIFVwZGF0ZSB0aGUgbGlua3PigKZcclxuICAgIHZhciBsaW5rID0gc3ZnUm9vdC5zZWxlY3RBbGwoXCJwYXRoLmxpbmtcIilcclxuICAgICAgICAuZGF0YShwYXRobGlua3MsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQudGFyZ2V0LmlkOyB9KTtcclxuXHJcbiAgICAvLyBFbnRlciBhbnkgbmV3IGxpbmtzIGF0IHRoZSBwYXJlbnQncyBwcmV2aW91cyBwb3NpdGlvbi5cclxuICAgIGxpbmsuZW50ZXIoKS5pbnNlcnQoXCJwYXRoXCIsIFwiZ1wiKVxyXG4gICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJsaW5rXCIpXHJcbiAgICAgICAgLmF0dHIoXCJkXCIsIGZ1bmN0aW9uKGQpIHtcclxuICAgICAgICAgIHZhciBvID0ge3g6IHNvdXJjZS54MCwgeTogc291cmNlLnkwfTtcclxuICAgICAgICAgIHJldHVybiBkaWFnb25hbCh7c291cmNlOiBvLCB0YXJnZXQ6IG99KTtcclxuICAgICAgICB9KVxyXG4gICAgICAgIC5zdHlsZShcImZpbGxcIixmdW5jdGlvbihkKXtcclxuICAgICAgICAgIHJldHVybiBkLmNvbG9yO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgIC8vIFRyYW5zaXRpb24gbGlua3MgdG8gdGhlaXIgbmV3IHBvc2l0aW9uLlxyXG4gICAgbGluay50cmFuc2l0aW9uKClcclxuICAgICAgICAuZHVyYXRpb24oZHVyYXRpb24pXHJcbiAgICAgICAgLmF0dHIoXCJkXCIsIGRpYWdvbmFsKTtcclxuXHJcbiAgICAvLyBUcmFuc2l0aW9uIGV4aXRpbmcgbm9kZXMgdG8gdGhlIHBhcmVudCdzIG5ldyBwb3NpdGlvbi5cclxuICAgIGxpbmsuZXhpdCgpLnRyYW5zaXRpb24oKVxyXG4gICAgICAgIC5kdXJhdGlvbihkdXJhdGlvbilcclxuICAgICAgICAuYXR0cihcImRcIiwgZnVuY3Rpb24oZCkge1xyXG4gICAgICAgICAgdmFyIG8gPSB7eDogc291cmNlLngsIHk6IHNvdXJjZS55fTtcclxuICAgICAgICAgIHJldHVybiBkaWFnb25hbCh7c291cmNlOiBvLCB0YXJnZXQ6IG99KTtcclxuICAgICAgICB9KVxyXG4gICAgICAgIC5yZW1vdmUoKTtcclxuICB9XHJcblxyXG4gIC8vIFRvZ2dsZSBjaGlsZHJlbiBvbiBjbGljay5cclxuICBmdW5jdGlvbiB0b2dnbGVDaGlsZHJlbihkLGNsaWNrVHlwZSkge1xyXG4gICAgaWYgKGQuY2hpbGRyZW4pIHtcclxuICAgICAgZC5fY2hpbGRyZW4gPSBkLmNoaWxkcmVuO1xyXG4gICAgICBkLmNoaWxkcmVuID0gbnVsbDtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGQuY2hpbGRyZW4gPSBkLl9jaGlsZHJlbjtcclxuICAgICAgZC5fY2hpbGRyZW4gPSBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciB0eXBlID0gdHlwZW9mIGNsaWNrVHlwZSA9PSB1bmRlZmluZWQgPyBcIm5vZGVcIiA6IGNsaWNrVHlwZTtcclxuXHJcbiAgICAvL0FjdGl2aXRpZXMgb24gbm9kZSBjbGlja1xyXG4gICAgY3JlYXRlQ29sbGFwc2libGVEZW5kcm9HcmFtKGQpO1xyXG4gICAgaGlnaGxpZ2h0Tm9kZVNlbGVjdGlvbnMoZCk7XHJcblxyXG4gICAgaGlnaGxpZ2h0Um9vdFRvTm9kZVBhdGgoZCx0eXBlKTtcclxuXHJcbiAgfVxyXG5cclxuICAvLyBDb2xsYXBzZSBub2Rlc1xyXG4gIGZ1bmN0aW9uIGNvbGxhcHNlKGQpIHtcclxuICAgIGlmIChkLmNoaWxkcmVuKSB7XHJcbiAgICAgICAgZC5fY2hpbGRyZW4gPSBkLmNoaWxkcmVuO1xyXG4gICAgICAgIGQuX2NoaWxkcmVuLmZvckVhY2goY29sbGFwc2UpO1xyXG4gICAgICAgIGQuY2hpbGRyZW4gPSBudWxsO1xyXG4gICAgICB9XHJcbiAgfVxyXG5cclxuXHJcbiAgLy8gaGlnaGxpZ2h0cyBzdWJub2RlcyBvZiBhIG5vZGVcclxuICBmdW5jdGlvbiBoaWdobGlnaHROb2RlU2VsZWN0aW9ucyhkKSB7XHJcbiAgICAgIHZhciBoaWdobGlnaHRMaW5rQ29sb3IgPSBcImRhcmtzbGF0ZWdyYXlcIjsvL1wiI2YwM2IyMFwiO1xyXG4gICAgICB2YXIgZGVmYXVsdExpbmtDb2xvciA9IFwibGlnaHRncmF5XCI7XHJcblxyXG4gICAgICB2YXIgZGVwdGggPSAgZC5kZXB0aDtcclxuICAgICAgdmFyIG5vZGVDb2xvciA9IGQuY29sb3I7XHJcbiAgICAgIGlmIChkZXB0aCA9PT0gMSkge1xyXG4gICAgICAgICAgbm9kZUNvbG9yID0gaGlnaGxpZ2h0TGlua0NvbG9yO1xyXG4gICAgICB9XHJcblxyXG4gICAgICB2YXIgcGF0aExpbmtzID0gc3ZnUm9vdC5zZWxlY3RBbGwoXCJwYXRoLmxpbmtcIik7XHJcblxyXG4gICAgICBwYXRoTGlua3Muc3R5bGUoXCJzdHJva2VcIixmdW5jdGlvbihkZCkge1xyXG4gICAgICAgICAgaWYgKGRkLnNvdXJjZS5kZXB0aCA9PT0gMCkge1xyXG4gICAgICAgICAgICAgIGlmIChkLm5hbWUgPT09ICcnKSB7XHJcbiAgICAgICAgICAgICAgICAgIHJldHVybiBoaWdobGlnaHRMaW5rQ29sb3I7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIHJldHVybiBkZWZhdWx0TGlua0NvbG9yO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIGlmIChkZC5zb3VyY2UubmFtZSA9PT0gZC5uYW1lKSB7XHJcbiAgICAgICAgICAgICAgcmV0dXJuIG5vZGVDb2xvcjtcclxuICAgICAgICAgIH1lbHNlIHtcclxuICAgICAgICAgICAgICByZXR1cm4gZGVmYXVsdExpbmtDb2xvcjtcclxuICAgICAgICAgIH1cclxuICAgICAgfSk7XHJcbiAgfVxyXG5cclxuICAvL1dhbGtpbmcgcGFyZW50cycgY2hhaW4gZm9yIHJvb3QgdG8gbm9kZSB0cmFja2luZ1xyXG4gIGZ1bmN0aW9uIGhpZ2hsaWdodFJvb3RUb05vZGVQYXRoKGQsY2xpY2tUeXBlKXtcclxuICAgIHZhciBhbmNlc3RvcnMgPSBbXTtcclxuICAgIHZhciBwYXJlbnQgPSBkO1xyXG4gICAgd2hpbGUgKCFfLmlzVW5kZWZpbmVkKHBhcmVudCkpIHtcclxuICAgICAgICBhbmNlc3RvcnMucHVzaChwYXJlbnQpO1xyXG4gICAgICAgIHBhcmVudCA9IHBhcmVudC5wYXJlbnQ7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gR2V0IHRoZSBtYXRjaGVkIGxpbmtzXHJcbiAgICB2YXIgbWF0Y2hlZExpbmtzID0gW107XHJcblxyXG4gICAgc3ZnUm9vdC5zZWxlY3RBbGwoJ3BhdGgubGluaycpXHJcbiAgICAgICAgLmZpbHRlcihmdW5jdGlvbihkLCBpKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcmV0dXJuIF8uYW55KGFuY2VzdG9ycywgZnVuY3Rpb24ocClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHAgPT09IGQudGFyZ2V0O1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgfSlcclxuICAgICAgICAuZWFjaChmdW5jdGlvbihkKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgbWF0Y2hlZExpbmtzLnB1c2goZCk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgYW5pbWF0ZUNoYWlucyhtYXRjaGVkTGlua3MsY2xpY2tUeXBlKTtcclxuXHJcbiAgICBmdW5jdGlvbiBhbmltYXRlQ2hhaW5zKGxpbmtzLGNsaWNrVHlwZSl7XHJcbiAgICAgIGFuaW1Hcm91cC5zZWxlY3RBbGwoXCJwYXRoLnNlbGVjdGVkXCIpXHJcbiAgICAgICAgICAuZGF0YShbXSlcclxuICAgICAgICAgIC5leGl0KCkucmVtb3ZlKCk7XHJcblxyXG4gICAgICBhbmltR3JvdXAuc2VsZWN0QWxsKFwicGF0aC5zZWxlY3RlZFwiKVxyXG4gICAgICAgICAgLmRhdGEobGlua3MpXHJcbiAgICAgICAgICAuZW50ZXIoKS5hcHBlbmQoXCJzdmc6cGF0aFwiKVxyXG4gICAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcInNlbGVjdGVkXCIpXHJcbiAgICAgICAgICAuYXR0cihcImRcIiwgZGlhZ29uYWwpO1xyXG5cclxuXHJcbiAgICAgIC8vUmVzZXQgcGF0aCBoaWdobGlnaHQgaWYgY29sbGFwc2UgYnV0dG9uIGNsaWNrZWRcclxuICAgICAgaWYoY2xpY2tUeXBlID09ICdidXR0b24nKXtcclxuICAgICAgICBhbmltR3JvdXAuc2VsZWN0QWxsKFwicGF0aC5zZWxlY3RlZFwiKS5jbGFzc2VkKCdyZXNldC1zZWxlY3RlZCcsdHJ1ZSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHZhciBvdmVybGF5Qm94ID0gc3ZnUm9vdC5ub2RlKCkuZ2V0QkJveCgpO1xyXG5cclxuICAgICAgc3ZnUm9vdC5zZWxlY3QoXCIjY2xpcC1yZWN0LWFuaW1cIilcclxuICAgICAgICAgIC5hdHRyKFwieFwiLCAtcmFkaXVzKVxyXG4gICAgICAgICAgLmF0dHIoXCJ5XCIsIC1yYWRpdXMpXHJcbiAgICAgICAgICAuYXR0cihcIndpZHRoXCIsMClcclxuICAgICAgICAgIC5hdHRyKFwiaGVpZ2h0XCIscmFkaXVzKjIpXHJcbiAgICAgICAgICAudHJhbnNpdGlvbigpLmR1cmF0aW9uKGR1cmF0aW9uKVxyXG4gICAgICAgICAgLmF0dHIoXCJ3aWR0aFwiLCByYWRpdXMqMik7XHJcbiAgICB9XHJcblxyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gem9vbSgpIHtcclxuICAgICBzdmdSb290LmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoXCIgKyBkMy5ldmVudC50cmFuc2xhdGUgKyBcIilzY2FsZShcIiArIGQzLmV2ZW50LnNjYWxlICsgXCIpXCIpO1xyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gY29sbGFwc2VMZXZlbHMoKXtcclxuXHJcbiAgICBpZihjaGVja0ZvclRoaXJkTGV2ZWxPcGVuQ2hpbGRyZW4oKSl7XHJcbiAgICAgIHRvZ2dsZUFsbFNlY29uZExldmVsQ2hpbGRyZW4oKTtcclxuICAgIH1lbHNle1xyXG4gICAgIHRvZ2dsZVNlY29uZExldmVsQ2hpbGRyZW4oKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBPcGVuIGZpcnN0IGxldmVsIG9ubHkgYnkgY29sbGFwc2luZyBzZWNvbmQgbGV2ZWxcclxuICAgIGZ1bmN0aW9uIHRvZ2dsZVNlY29uZExldmVsQ2hpbGRyZW4oKXtcclxuICAgICAgZm9yKHZhciByb290SW5kZXggPSAwLCByb290TGVuZ3RoID0gcm9vdEpzb25EYXRhLmNoaWxkcmVuLmxlbmd0aDsgcm9vdEluZGV4PHJvb3RMZW5ndGg7IHJvb3RJbmRleCsrKXtcclxuICAgICAgICAgIGlmKGlzTm9kZU9wZW4ocm9vdEpzb25EYXRhLmNoaWxkcmVuW3Jvb3RJbmRleF0pKXtcclxuICAgICAgICAgICAgICAgdG9nZ2xlQ2hpbGRyZW4ocm9vdEpzb25EYXRhLmNoaWxkcmVuW3Jvb3RJbmRleF0sJ2J1dHRvbicpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gT3BlbiBmaXJzdCBsZXZlbCBvbmx5IGJ5IGNvbGxhcHNpbmcgc2Vjb25kIGxldmVsXHJcbiAgICBmdW5jdGlvbiB0b2dnbGVBbGxTZWNvbmRMZXZlbENoaWxkcmVuKCl7XHJcbiAgICAgIGZvcih2YXIgcm9vdEluZGV4ID0gMCwgcm9vdExlbmd0aCA9IHJvb3RKc29uRGF0YS5jaGlsZHJlbi5sZW5ndGg7IHJvb3RJbmRleDxyb290TGVuZ3RoOyByb290SW5kZXgrKyl7XHJcbiAgICAgICAgaWYoaXNOb2RlT3Blbihyb290SnNvbkRhdGEuY2hpbGRyZW5bcm9vdEluZGV4XSkpe1xyXG5cclxuICAgICAgICAgIGZvcih2YXIgY2hpbGRJbmRleCA9IDAsIGNoaWxkTGVuZ3RoID0gcm9vdEpzb25EYXRhLmNoaWxkcmVuW3Jvb3RJbmRleF0uY2hpbGRyZW4ubGVuZ3RoOyBjaGlsZEluZGV4PGNoaWxkTGVuZ3RoOyBjaGlsZEluZGV4Kyspe1xyXG4gICAgICAgICAgICB2YXIgc2Vjb25kTGV2ZWxDaGlsZCA9IHJvb3RKc29uRGF0YS5jaGlsZHJlbltyb290SW5kZXhdLmNoaWxkcmVuW2NoaWxkSW5kZXhdO1xyXG4gICAgICAgICAgICBpZihpc05vZGVPcGVuKHNlY29uZExldmVsQ2hpbGQpKXtcclxuICAgICAgICAgICAgICB0b2dnbGVDaGlsZHJlbihyb290SnNvbkRhdGEuY2hpbGRyZW5bcm9vdEluZGV4XS5jaGlsZHJlbltjaGlsZEluZGV4XSwnYnV0dG9uJyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIENoZWNrIGlmIGFueSBub2RlcyBvcGVucyBhdCBzZWNvbmQgbGV2ZWxcclxuICAgIGZ1bmN0aW9uIGNoZWNrRm9yVGhpcmRMZXZlbE9wZW5DaGlsZHJlbigpe1xyXG4gICAgICBmb3IodmFyIHJvb3RJbmRleCA9IDAsIHJvb3RMZW5ndGggPSByb290SnNvbkRhdGEuY2hpbGRyZW4ubGVuZ3RoOyByb290SW5kZXg8cm9vdExlbmd0aDsgcm9vdEluZGV4Kyspe1xyXG4gICAgICAgIGlmKGlzTm9kZU9wZW4ocm9vdEpzb25EYXRhLmNoaWxkcmVuW3Jvb3RJbmRleF0pKXtcclxuXHJcbiAgICAgICAgICBmb3IodmFyIGNoaWxkSW5kZXggPSAwLCBjaGlsZExlbmd0aCA9IHJvb3RKc29uRGF0YS5jaGlsZHJlbltyb290SW5kZXhdLmNoaWxkcmVuLmxlbmd0aDsgY2hpbGRJbmRleDxjaGlsZExlbmd0aDsgY2hpbGRJbmRleCsrKXtcclxuXHJcbiAgICAgICAgICAgIHZhciBzZWNvbmRMZXZlbENoaWxkID0gcm9vdEpzb25EYXRhLmNoaWxkcmVuW3Jvb3RJbmRleF0uY2hpbGRyZW5bY2hpbGRJbmRleF07XHJcbiAgICAgICAgICAgIGlmKGlzTm9kZU9wZW4oc2Vjb25kTGV2ZWxDaGlsZCkpe1xyXG4gICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gaXNOb2RlT3BlbihkKXtcclxuICAgICAgaWYoZC5jaGlsZHJlbil7cmV0dXJuIHRydWU7fVxyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuXHJcblxyXG5cclxufVxyXG5cclxuICAiLCJmdW5jdGlvbiBsb2FkSnF1ZXJ5KCl7XHJcbiAgICAkKGRvY3VtZW50KS5yZWFkeShmdW5jdGlvbigpe1xyXG4gICAgICAgICQoXCIjdG9nZ2xlLXNpZGViYXJcIikuY2xpY2soZnVuY3Rpb24oKXtcclxuICAgICAgICAgICAgJCgnLnVpLnNpZGViYXInKVxyXG4gICAgICAgICAgICAgICAgLnNpZGViYXIoJ3RvZ2dsZScpXHJcbiAgICAgICAgICAgIDtcclxuICAgICAgICB9KTtcclxuICAgICAgICBcclxuICAgIH0pO1xyXG59XHJcbiIsInJlcXVpcmUuY29uZmlnKHtcclxuICAgIHBhdGhzOiB7XHJcbiAgICAgICAgXCJkM1wiOiBcImh0dHBzOi8vZDNqcy5vcmcvZDMudjMubWluXCJcclxuICAgIH1cclxufSk7XHJcblxyXG5mdW5jdGlvbiBsb2FkRDMoKXtcclxuXHJcbiAgICB3aW5kb3cuZDNPbGQgPSBkMztcclxuICAgIHJlcXVpcmUoWydkMyddLCBmdW5jdGlvbihkM1YzKSB7XHJcbiAgICAgICAgd2luZG93LmQzVjMgPSBkM1YzO1xyXG4gICAgICAgIHdpbmRvdy5kMyA9IGQzT2xkO1xyXG4gICAgICAgIC8vIHdpbmRvdy5kb2N1bWVudHMgPSBbXHJcbiAgICAgICAgLy8gICAgICAgICAvLyAgIFtcImlcIiwgXCJhbVwiLCBcImJhdG1hblwiLCBcIm9mXCIsIFwid2ludGVyZmFsbFwiXSxcclxuICAgICAgICAvLyAgICAgICAgIC8vICAgW1widGhlcmVcIiwgXCJzaG91bGRcIiwgXCJhbHdheXNcIiwgXCJiZVwiLCBcImFcIiwgXCJzdGFya1wiLCBcImluXCIsIFwid2ludGVyZmVsbFwiXSxcclxuICAgICAgICAvLyAgICAgICAgIC8vICAgW1wicHJvcGhlY3lcIiwgXCJzYXlzXCIsIFwicHJpbmNlXCIsIFwid2lsbFwiLCBcImJlXCIgLCBcInJlYm9yblwiXVxyXG4gICAgICAgIC8vICAgICAgICAgLy8gXTtcclxuICAgICAgICAvLyAgICAgd2luZG93LmRvY3VtZW50cyA9IFtbJ3Byb2plY3QnLCAnY2xhc3NpZmljYXRpb24nLCAnY29tcGFyZScsICduZXVyYWwnLCAnbmV0cycsICdTVk0nLCAnZHVlJywgJ2R1ZSddLCBbJ3R3bycsICduZXcnLCAncHJvZ3Jlc3MnLCAnY2hlY2tzJywgJ2ZpbmFsJywgJ3Byb2plY3QnLCAgJ2Fzc2lnbmVkJywgJ2ZvbGxvd3MnXSwgWydyZXBvcnQnLCAnZ3JhZGVkJywgICdjb250cmlidXRlJywgJ3BvaW50cycsICAndG90YWwnLCAnc2VtZXN0ZXInLCAnZ3JhZGUnXSwgWydwcm9ncmVzcycsICd1cGRhdGUnLCAnZXZhbHVhdGVkJywgJ1RBJywgJ3BlZXJzJ10sIFsnY2xhc3MnLCAnbWVldGluZycsICd0b21vcnJvdycsJ3RlYW1zJywgJ3dvcmsnLCAncHJvZ3Jlc3MnLCAncmVwb3J0JywgJ2ZpbmFsJywgJ3Byb2plY3QnXSwgWyAncXVpeicsICAnc2VjdGlvbnMnLCAncmVndWxhcml6YXRpb24nLCAnVHVlc2RheSddLCBbICdxdWl6JywgJ1RodXJzZGF5JywgJ2xvZ2lzdGljcycsICd3b3JrJywgJ29ubGluZScsICdzdHVkZW50JywgJ3Bvc3Rwb25lJywgICdxdWl6JywgJ1R1ZXNkYXknXSwgWydxdWl6JywgJ2NvdmVyJywgJ1RodXJzZGF5J10sIFsncXVpeicsICdjaGFwJywgJ2NoYXAnLCAnbGluZWFyJywgJ3JlZ3Jlc3Npb24nXV07XHJcbiAgICAgICAgd2luZG93LmRvY3VtZW50cyA9IFtcclxuICAgICAgICAgICAgWydzZXJpb3VzJyxcclxuICAgICAgICAgICAgICAgICAgICAgICd0YWxrJyxcclxuICAgICAgICAgICAgICAgICAgICAgICdmcmllbmRzJyxcclxuICAgICAgICAgICAgICAgICAgICAgICdmbGFreScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAnbGF0ZWx5JyxcclxuICAgICAgICAgICAgICAgICAgICAgICd1bmRlcnN0b29kJyxcclxuICAgICAgICAgICAgICAgICAgICAgICdnb29kJyxcclxuICAgICAgICAgICAgICAgICAgICAgICdldmVuaW5nJyxcclxuICAgICAgICAgICAgICAgICAgICAgICdoYW5naW5nJ10sXHJcbiAgICAgICAgICAgIFsnZ290JywgJ2dpZnQnLCAnZWxkZXInLCAnYnJvdGhlcicsICdyZWFsbHknLCAnc3VycHJpc2luZyddLFxyXG4gICAgICAgICAgICAgICAgICAgICBbJ2NvbXBsZXRlZCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAnNScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAnbWlsZXMnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgJ3J1bicsXHJcbiAgICAgICAgICAgICAgICAgICAgICAnd2l0aG91dCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAnYnJlYWsnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgJ21ha2VzJyxcclxuICAgICAgICAgICAgICAgICAgICAgICdmZWVsJyxcclxuICAgICAgICAgICAgICAgICAgICAgICdzdHJvbmcnXSxcclxuXHJcbiAgICAgICAgICAgIFsnc29uJywgJ3BlcmZvcm1lZCcsICd3ZWxsJywgJ3Rlc3QnLFxyXG4gICAgICAgICAgICAgICAgJ3ByZXBhcmF0aW9uJ11cclxuICAgICAgICAgICAgXTtcclxuXHJcbiAgICAgICAgICAgICAgICBnZXRBbmFseXNpcyhcIndvcmQydmVjXCIpO1xyXG4gICAgICAgIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBnZXREb2NzKHRleHRzKSB7XHJcbiAgcmV0dXJuIHdpbmRvdy5kb2N1bWVudHMgPSB0ZXh0cy5tYXAoeCA9PiB4LnNwbGl0KCkpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBnZXRBbmFseXNpcyhtZXRob2QsIHN1Y2Nlc3MpIHtcclxuICBsZXQgZG9jcyA9IHdpbmRvdy5kb2N1bWVudHM7XHJcbiAgbGV0IGZuYyA9IHggPT4geDtcclxuICBpZiAobWV0aG9kID09PSBcIkxEQVwiKSB7XHJcbiAgICBmbmMgPSBnZXRMREFDbHVzdGVycztcclxuICB9IGVsc2Uge1xyXG4gICAgZm5jID0gZ2V0V29yZDJWZWNDbHVzdGVycztcclxuICB9XHJcbiAgd2luZG93LmxvYWRERnVuYyA9ICBmbmM7XHJcbiAgZm5jKGRvY3MsIHJlc3AgPT4ge1xyXG4gICAgICB3aW5kb3cuZ2xvYmFsX2RhdGEgPSByZXNwO1xyXG4gICAgaW5pdFBhZ2UxKHJlc3ApO1xyXG4gICAgaW5pdFBhZ2UyKHJlc3ApO1xyXG4gICAgaW5pdFBhZ2UzKHJlc3ApO1xyXG4gICAgaW5pdFBhZ2U0KCk7XHJcbiAgICBpZihzdWNjZXNzKXtcclxuICAgICAgICBzdWNjZXNzKHJlc3ApO1xyXG4gICAgfVxyXG4gIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBsb2FkVmlzdWFsaXphdGlvbnMoKSB7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGluaXRQYWdlMShyZXNwKSB7XHJcbiAgcmVuZGVyQ2x1c3RlckFuYWx5c2lzKHJlc3ApO1xyXG59XHJcblxyXG5cclxuXHJcbmZ1bmN0aW9uIGluaXRQYWdlMihyZXNwKSB7XHJcbiAgcmVuZGVyQ2x1c3RlckZvcmNlTGF5b3V0KHJlc3ApO1xyXG5cclxufVxyXG5cclxuZnVuY3Rpb24gaW5pdFBhZ2UzKHJlc3Ape1xyXG4gICAgJChcIiNwYXJhbGxlbC1jb29yZGluYXRlLXZpc1wiKS5odG1sKFwiXCIpO1xyXG4gICAgJChcIiNwYy1jb250YWluZXJcIikuaHRtbChcIlwiKTtcclxuICAgIGxvYWRQYXJhbGxlbENvb3JkaW5hdGUocmVzcCk7XHJcbiAgICBsb2FkUGFyYWxsZWxDb29yZGluYXRlc0hDKHJlc3ApO1xyXG59XHJcblxyXG5mdW5jdGlvbiBpbml0UGFnZTQoKXtcclxuICAgICQoXCIjb3ZlcmFsbC13Y1wiKS5odG1sKCk7XHJcbiAgICBsb2FkV29yZENsb3VkKHdpbmRvdy5nbG9iYWxfZGF0YSk7XHJcbn0iLCIvL3ZlY3RvcnMgZm9ybWF0OiBNYXBbc3RyaW5nKHRvcGljX2lkKTogTGlzdFtmbG9hdF1dXHJcbmZ1bmN0aW9uIGdldDJEVmVjdG9ycyh2ZWN0b3JzLCBzdWNjZXNzQ2FsbGJhY2spe1xyXG4gICAgdmFyIHJlcXVlc3QgPSAkLmFqYXgoe1xyXG4gICAgICAgIHVybDogXCIvZ2V0MkRWZWN0b3JzXCIsXHJcbiAgICAgICAgbWV0aG9kOiBcIlBPU1RcIixcclxuICAgICAgICBkYXRhOiB2ZWN0b3JzXHJcbiAgICAgIH0pO1xyXG4gICAgICAgXHJcbiAgICAgIHJlcXVlc3QuZG9uZShmdW5jdGlvbiggcmVzcG9uc2UgKSB7XHJcbiAgICAgICAgc3VjY2Vzc0NhbGxiYWNrKHJlc3BvbnNlKTtcclxuICAgICAgfSk7XHJcbiAgICAgICBcclxuICAgICAgcmVxdWVzdC5mYWlsKGZ1bmN0aW9uKCBqcVhIUiwgdGV4dFN0YXR1cyApIHtcclxuICAgICAgICBhbGVydCggXCJSZXF1ZXN0IGZhaWxlZDogXCIgKyB0ZXh0U3RhdHVzICk7XHJcbiAgICAgIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBnZXRUb2tlbml6ZWREb2NzKGRvY3MsIHN1Y2Nlc3NDYWxsYmFjayl7XHJcbiAgICB2YXIgcmVxdWVzdCA9ICQuYWpheCh7XHJcbiAgICAgICAgdXJsOiBcIi9nZXREb2NzRnJvbVRleHRzXCIsXHJcbiAgICAgICAgbWV0aG9kOiBcIlBPU1RcIixcclxuICAgICAgICBkYXRhOiBKU09OLnN0cmluZ2lmeSh7ZG9jczogZG9jc30pLFxyXG4gICAgICAgIGNvbnRlbnRUeXBlOiBcImFwcGxpY2F0aW9uL2pzb247IGNoYXJzZXQ9dXRmLThcIixcclxuICAgICAgICBkYXRhVHlwZSAgIDogXCJqc29uXCJcclxuICAgICAgfSk7XHJcblxyXG4gICAgICByZXF1ZXN0LmRvbmUoZnVuY3Rpb24oIHJlc3BvbnNlICkge1xyXG4gICAgICAgIHN1Y2Nlc3NDYWxsYmFjayhyZXNwb25zZS5kb2NzKTtcclxuICAgICAgfSk7XHJcblxyXG4gICAgICByZXF1ZXN0LmZhaWwoZnVuY3Rpb24oIGpxWEhSLCB0ZXh0U3RhdHVzICkge1xyXG4gICAgICAgIGFsZXJ0KCBcIlJlcXVlc3QgZmFpbGVkOiBcIiArIHRleHRTdGF0dXMgKTtcclxuICAgICAgfSk7XHJcbn1cclxuXHJcbi8vIGRvY3MgZm9ybWF0OiBMaXN0W0xpc3Rbc3RyaW5nKHdvcmQpXV1cclxuZnVuY3Rpb24gZ2V0V29yZDJWZWNDbHVzdGVycyhkb2NzLCBzdWNjZXNzQ2FsbGJhY2spe1xyXG4gICAgdmFyIHJlcXVlc3QgPSAkLmFqYXgoe1xyXG4gICAgICAgIHVybDogXCIvYXBpL2dldENsdXN0ZXJzV29yZDJWZWNcIixcclxuICAgICAgICBtZXRob2Q6IFwiUE9TVFwiLFxyXG4gICAgICAgIGRhdGE6IEpTT04uc3RyaW5naWZ5KHtkb2NzOiBkb2NzLCBzdGFydDogd2luZG93LnZ1ZUFwcC5zZXR0aW5ncy5zdGFydDIsIGVuZDogd2luZG93LnZ1ZUFwcC5zZXR0aW5ncy5lbmQyLCBzZWxlY3RlZDogd2luZG93LnZ1ZUFwcC5zZXR0aW5ncy5zZWxlY3RlZERhdGFzZXR9KSxcclxuICAgICAgICBjb250ZW50VHlwZTogXCJhcHBsaWNhdGlvbi9qc29uOyBjaGFyc2V0PXV0Zi04XCIsXHJcbiAgICAgICAgZGF0YVR5cGUgICA6IFwianNvblwiXHJcbiAgICAgIH0pO1xyXG4gICAgICAgXHJcbiAgICAgIHJlcXVlc3QuZG9uZShmdW5jdGlvbiggcmVzcG9uc2UgKSB7XHJcbiAgICAgICAgc3VjY2Vzc0NhbGxiYWNrKEpTT04ucGFyc2UocmVzcG9uc2UpKTtcclxuICAgICAgfSk7XHJcbiAgICAgICBcclxuICAgICAgcmVxdWVzdC5mYWlsKGZ1bmN0aW9uKCBqcVhIUiwgdGV4dFN0YXR1cyApIHtcclxuICAgICAgICBhbGVydCggXCJSZXF1ZXN0IGZhaWxlZDogXCIgKyB0ZXh0U3RhdHVzICk7XHJcbiAgICAgIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBnZXRMREFDbHVzdGVycyhkb2NzLCBzdWNjZXNzQ2FsbGJhY2spe1xyXG4gICAgdmFyIHJlcXVlc3QgPSAkLmFqYXgoe1xyXG4gICAgICAgIHVybDogXCIvYXBpL2dldExEQURhdGFcIixcclxuICAgICAgICBtZXRob2Q6IFwiUE9TVFwiLFxyXG4gICAgICAgIGRhdGE6IEpTT04uc3RyaW5naWZ5KHtkb2NzOiBkb2NzLCBzdGFydDogd2luZG93LnZ1ZUFwcC5zZXR0aW5ncy5zdGFydDEsIGVuZDogd2luZG93LnZ1ZUFwcC5zZXR0aW5ncy5lbmQxLCBzZWxlY3RlZDogd2luZG93LnZ1ZUFwcC5zZXR0aW5ncy5zZWxlY3RlZERhdGFzZXR9KSxcclxuICAgICAgICBjb250ZW50VHlwZTogXCJhcHBsaWNhdGlvbi9qc29uOyBjaGFyc2V0PXV0Zi04XCIsXHJcbiAgICAgICAgZGF0YVR5cGUgICA6IFwianNvblwiXHJcbiAgICAgIH0pO1xyXG4gICAgICAgXHJcbiAgICAgIHJlcXVlc3QuZG9uZShmdW5jdGlvbiggcmVzcG9uc2UgKSB7XHJcbiAgICAgICAgc3VjY2Vzc0NhbGxiYWNrKHJlc3BvbnNlKTtcclxuICAgICAgfSk7XHJcbiAgICAgICBcclxuICAgICAgcmVxdWVzdC5mYWlsKGZ1bmN0aW9uKCBqcVhIUiwgdGV4dFN0YXR1cyApIHtcclxuICAgICAgICBhbGVydCggXCJSZXF1ZXN0IGZhaWxlZDogXCIgKyB0ZXh0U3RhdHVzICk7XHJcbiAgICAgIH0pO1xyXG59XHJcbiIsImZ1bmN0aW9uIGxvYWRQYXJhbGxlbENvb3JkaW5hdGVzSEMocmVzcCl7XHJcblxyXG5cclxuICAgICAgICBsZXQgZGF0YSA9IGdlbmVyYXRlUGFyYWxsZWxDb29yZGluYXRlRGF0YUhDKHJlc3AsIDAsIDApO1xyXG4gICAgICAgIEhpZ2hjaGFydHMuY2hhcnQoJ3BjLWNvbnRhaW5lcicsIHtcclxuICAgICAgICAgICAgY2hhcnQ6IHtcclxuICAgICAgICAgICAgICAgIHR5cGU6ICdzcGxpbmUnLFxyXG4gICAgICAgICAgICAgICAgcGFyYWxsZWxDb29yZGluYXRlczogdHJ1ZSxcclxuICAgICAgICAgICAgICAgIHBhcmFsbGVsQXhlczoge1xyXG4gICAgICAgICAgICAgICAgICAgIGxpbmVXaWR0aDogMlxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB0aXRsZToge1xyXG4gICAgICAgICAgICAgICAgdGV4dDogJ0RvY3VtZW50IC0gVG9waWMgLSBXb3JkIFJlbGF0aW9uc2hpcCdcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgcGxvdE9wdGlvbnM6IHtcclxuICAgICAgICAgICAgICAgIHNlcmllczoge1xyXG4gICAgICAgICAgICAgICAgICAgIGFuaW1hdGlvbjogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICAgICAgbWFya2VyOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVuYWJsZWQ6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzdGF0ZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhvdmVyOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZW5hYmxlZDogZmFsc2VcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgc3RhdGVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGhvdmVyOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoYWxvOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2l6ZTogMFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICBldmVudHM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbW91c2VPdmVyOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmdyb3VwLnRvRnJvbnQoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgLy8gdG9vbHRpcDoge1xyXG4gICAgICAgICAgICAvLyAgICAgcG9pbnRGb3JtYXQ6ICc8c3BhbiBzdHlsZT1cImNvbG9yOntwb2ludC5jb2xvcn1cIj5cXHUyNUNGPC9zcGFuPicgK1xyXG4gICAgICAgICAgICAvLyAgICAgICAgICd7c2VyaWVzLm5hbWV9OiA8Yj57cG9pbnQuZm9ybWF0dGVkVmFsdWV9PC9iPjxici8+J1xyXG4gICAgICAgICAgICAvLyB9LFxyXG4gICAgICAgICAgICB4QXhpczoge1xyXG4gICAgICAgICAgICAgICAgY2F0ZWdvcmllczogW1xyXG4gICAgICAgICAgICAgICAgICAgICdEb2N1bWVudCcsXHJcbiAgICAgICAgICAgICAgICAgICAgJ1RvcGljJyxcclxuICAgICAgICAgICAgICAgICAgICAnV29yZCdcclxuICAgICAgICAgICAgICAgIF0sXHJcbiAgICAgICAgICAgICAgICBvZmZzZXQ6IDEwXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHlBeGlzOiBbe1xyXG4gICAgICAgICAgICAgICAgY2F0ZWdvcmllczogT2JqZWN0LmtleXMocmVzcFtcImRvY3VtZW50X3RvcGljXCJdKS5tYXAoeD0+IFwiLi4uLi4uLi4uLi4uLi4uLkRvY3VtZW50IFwiK3gpXHJcbiAgICAgICAgICAgIH0sIHtcclxuICAgICAgICAgICAgICAgIGNhdGVnb3JpZXM6IHJlc3BbXCJ0b3BpY3NcIl0ubWFwKHg9PiBcIi4uLi4uLi4uLi4uLi4uLi5Ub3BpYyBcIit4KVxyXG4gICAgICAgICAgICB9LCB7XHJcbiAgICAgICAgICAgICAgICBjYXRlZ29yaWVzOiBPYmplY3QudmFsdWVzKHJlc3BbXCJ3b3Jkc1wiXSkubWFwKHg9PiBcIi4uLi4uLi4uLi4uLi4uLi5cIit4KVxyXG4gICAgICAgICAgICB9XSxcclxuICAgICAgICAgICAgY29sb3JzOiBbJ3JnYmEoMTEsIDIwMCwgMjAwLCAwLjEpJ10sXHJcbiAgICAgICAgICAgIHNlcmllczogZGF0YS5tYXAoZnVuY3Rpb24gKHNldCwgaSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgICAgICBuYW1lOiAnJyxcclxuICAgICAgICAgICAgICAgICAgICBkYXRhOiBzZXQsXHJcbiAgICAgICAgICAgICAgICAgICAgc2hhZG93OiBmYWxzZVxyXG4gICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICB9KTtcclxuXHJcbn1cclxuXHJcblxyXG4iLCJmdW5jdGlvbiBsb2FkUGFyYWxsZWxDb29yZGluYXRlKHJlc3Ape1xyXG4gICAgdmFyIG1hcmdpbiA9IHt0b3A6IDMwLCByaWdodDogMTAsIGJvdHRvbTogMTAsIGxlZnQ6IDEwfSxcclxuICAgICAgICB3aWR0aCA9IDk2MCAtIG1hcmdpbi5sZWZ0IC0gbWFyZ2luLnJpZ2h0LFxyXG4gICAgICAgIGhlaWdodCA9IDUwMCAtIG1hcmdpbi50b3AgLSBtYXJnaW4uYm90dG9tO1xyXG5cclxuICAgIHZhciB4ID0gZDNWMy5zY2FsZS5vcmRpbmFsKCkucmFuZ2VQb2ludHMoWzAsIHdpZHRoXSwgMSksXHJcbiAgICAgICAgeSA9IHt9LFxyXG4gICAgICAgIGRyYWdnaW5nID0ge307XHJcblxyXG4gICAgdmFyIGxpbmUgPSBkM1YzLnN2Zy5saW5lKCksXHJcbiAgICAgICAgYmFja2dyb3VuZCxcclxuICAgICAgICBmb3JlZ3JvdW5kO1xyXG5cclxuICAgIHZhciBzdmcgPSBkM1YzLnNlbGVjdChcIiNwYXJhbGxlbC1jb29yZGluYXRlLXZpc1wiKS5hcHBlbmQoXCJzdmdcIilcclxuICAgICAgICAuYXR0cihcIndpZHRoXCIsIHdpZHRoICsgbWFyZ2luLmxlZnQgKyBtYXJnaW4ucmlnaHQpXHJcbiAgICAgICAgLmF0dHIoXCJoZWlnaHRcIiwgaGVpZ2h0ICsgbWFyZ2luLnRvcCArIG1hcmdpbi5ib3R0b20pXHJcbiAgICAuYXBwZW5kKFwiZ1wiKVxyXG4gICAgICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKFwiICsgbWFyZ2luLmxlZnQgKyBcIixcIiArIG1hcmdpbi50b3AgKyBcIilcIiksIGRpbWVuc2lvbnM7XHJcblxyXG5cclxuICAgIC8vIEV4dHJhY3QgdGhlIGxpc3Qgb2YgZGltZW5zaW9ucyBhbmQgY3JlYXRlIGEgc2NhbGUgZm9yIGVhY2guXHJcbiAgICB2YXIgY2FycyA9IGdlbmVyYXRlUGFyYWxsZWxDb29yZGluYXRlRGF0YShyZXNwLCAwLCAwKTtcclxuICAgIC8vIHZhciBheGlzRCA9IGQzVjMuc3ZnLmF4aXMoKS5vcmllbnQoXCJsZWZ0XCIpLnRpY2tzKE9iamVjdC5rZXlzKHJlc3BbXCJkb2N1bWVudF90b3BpY1wiXSkubGVuZ3RoKSxcclxuICAgIHZhciBheGlzRCA9IGQzVjMuc3ZnLmF4aXMoKS5vcmllbnQoXCJsZWZ0XCIpLnRpY2tWYWx1ZXMoT2JqZWN0LmtleXMocmVzcFtcImRvY3VtZW50X3RvcGljXCJdKS5tYXAoeCA9PiBwYXJzZUludCh4KSkpLFxyXG4gICAgICAgIGF4aXNUID0gZDNWMy5zdmcuYXhpcygpLm9yaWVudChcImxlZnRcIikudGlja1ZhbHVlcyhyZXNwW1widG9waWNzXCJdLm1hcCh4ID0+IHBhcnNlSW50KHgpKSksXHJcbiAgICAgICAgYXhpc1cgPSBkM1YzLnN2Zy5heGlzKCkub3JpZW50KFwibGVmdFwiKS50aWNrVmFsdWVzKE9iamVjdC52YWx1ZXMocmVzcFtcIm92ZXJhbGxfd29yZFwiXSkubWFwKHggPT4gcGFyc2VGbG9hdCh4KSkpO1xyXG5cclxuICAgIHguZG9tYWluKGRpbWVuc2lvbnMgPSBkM1YzLmtleXMoY2Fyc1swXSkuZmlsdGVyKGZ1bmN0aW9uKGQpIHtcclxuICAgICAgICByZXR1cm4gZCAhPSBcIm5hbWVcIiAmJiAoeVtkXSA9IGQzVjMuc2NhbGUubGluZWFyKClcclxuICAgICAgICAgICAgLmRvbWFpbihkM1YzLmV4dGVudChjYXJzLCBmdW5jdGlvbihwKSB7IHJldHVybiArcFtkXTsgfSkpXHJcbiAgICAgICAgICAgIC5yYW5nZShbaGVpZ2h0LCAwXSkpO1xyXG4gICAgfSkpO1xyXG5cclxuICAgIC8vIEFkZCBncmV5IGJhY2tncm91bmQgbGluZXMgZm9yIGNvbnRleHQuXHJcbiAgICBiYWNrZ3JvdW5kID0gc3ZnLmFwcGVuZChcImdcIilcclxuICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwiYmFja2dyb3VuZFwiKVxyXG4gICAgICAgIC5zZWxlY3RBbGwoXCJwYXRoXCIpXHJcbiAgICAgICAgLmRhdGEoY2FycylcclxuICAgICAgICAuZW50ZXIoKS5hcHBlbmQoXCJwYXRoXCIpXHJcbiAgICAgICAgLmF0dHIoXCJkXCIsIHBhdGgpO1xyXG5cclxuICAgIC8vIEFkZCBibHVlIGZvcmVncm91bmQgbGluZXMgZm9yIGZvY3VzLlxyXG4gICAgZm9yZWdyb3VuZCA9IHN2Zy5hcHBlbmQoXCJnXCIpXHJcbiAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcImZvcmVncm91bmRcIilcclxuICAgICAgICAuc2VsZWN0QWxsKFwicGF0aFwiKVxyXG4gICAgICAgIC5kYXRhKGNhcnMpXHJcbiAgICAgICAgLmVudGVyKCkuYXBwZW5kKFwicGF0aFwiKVxyXG4gICAgICAgIC5hdHRyKFwiZFwiLCBwYXRoKTtcclxuXHJcbiAgICAvLyBBZGQgYSBncm91cCBlbGVtZW50IGZvciBlYWNoIGRpbWVuc2lvbi5cclxuICAgIHZhciBnID0gc3ZnLnNlbGVjdEFsbChcIi5kaW1lbnNpb25cIilcclxuICAgICAgICAuZGF0YShkaW1lbnNpb25zKVxyXG4gICAgICAgIC5lbnRlcigpLmFwcGVuZChcImdcIilcclxuICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwiZGltZW5zaW9uXCIpXHJcbiAgICAgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4gXCJ0cmFuc2xhdGUoXCIgKyB4KGQpICsgXCIpXCI7IH0pXHJcbiAgICAgICAgLmNhbGwoZDNWMy5iZWhhdmlvci5kcmFnKClcclxuICAgICAgICAgICAgLm9yaWdpbihmdW5jdGlvbihkKSB7IHJldHVybiB7eDogeChkKX07IH0pXHJcbiAgICAgICAgICAgIC5vbihcImRyYWdzdGFydFwiLCBmdW5jdGlvbihkKSB7XHJcbiAgICAgICAgICAgIGRyYWdnaW5nW2RdID0geChkKTtcclxuICAgICAgICAgICAgYmFja2dyb3VuZC5hdHRyKFwidmlzaWJpbGl0eVwiLCBcImhpZGRlblwiKTtcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgLm9uKFwiZHJhZ1wiLCBmdW5jdGlvbihkKSB7XHJcbiAgICAgICAgICAgIGRyYWdnaW5nW2RdID0gTWF0aC5taW4od2lkdGgsIE1hdGgubWF4KDAsIGQzVjMuZXZlbnQueCkpO1xyXG4gICAgICAgICAgICBmb3JlZ3JvdW5kLmF0dHIoXCJkXCIsIHBhdGgpO1xyXG4gICAgICAgICAgICBkaW1lbnNpb25zLnNvcnQoZnVuY3Rpb24oYSwgYikgeyByZXR1cm4gcG9zaXRpb24oYSkgLSBwb3NpdGlvbihiKTsgfSk7XHJcbiAgICAgICAgICAgIHguZG9tYWluKGRpbWVuc2lvbnMpO1xyXG4gICAgICAgICAgICBnLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4gXCJ0cmFuc2xhdGUoXCIgKyBwb3NpdGlvbihkKSArIFwiKVwiOyB9KVxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAub24oXCJkcmFnZW5kXCIsIGZ1bmN0aW9uKGQpIHtcclxuICAgICAgICAgICAgZGVsZXRlIGRyYWdnaW5nW2RdO1xyXG4gICAgICAgICAgICB0cmFuc2l0aW9uKGQzVjMuc2VsZWN0KHRoaXMpKS5hdHRyKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKFwiICsgeChkKSArIFwiKVwiKTtcclxuICAgICAgICAgICAgdHJhbnNpdGlvbihmb3JlZ3JvdW5kKS5hdHRyKFwiZFwiLCBwYXRoKTtcclxuICAgICAgICAgICAgYmFja2dyb3VuZFxyXG4gICAgICAgICAgICAgICAgLmF0dHIoXCJkXCIsIHBhdGgpXHJcbiAgICAgICAgICAgICAgICAudHJhbnNpdGlvbigpXHJcbiAgICAgICAgICAgICAgICAuZGVsYXkoNTAwKVxyXG4gICAgICAgICAgICAgICAgLmR1cmF0aW9uKDApXHJcbiAgICAgICAgICAgICAgICAuYXR0cihcInZpc2liaWxpdHlcIiwgbnVsbCk7XHJcbiAgICAgICAgICAgIH0pKTtcclxuXHJcbiAgICAvLyBBZGQgYW4gYXhpcyBhbmQgdGl0bGUuXHJcbiAgICBnLmFwcGVuZChcImdcIilcclxuICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwiYXhpc1wiKVxyXG4gICAgICAgIC5lYWNoKGZ1bmN0aW9uKGQpIHtcclxuICAgICAgICAgICAgbGV0IGF4aXMgPSBudWxsO1xyXG4gICAgICAgICAgICBpZihkID09IFwiZG9jdW1lbnRcIil7XHJcbiAgICAgICAgICAgICAgICBheGlzID0gYXhpc0Q7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZihkID09IFwidG9waWNcIil7XHJcbiAgICAgICAgICAgICAgICBheGlzID0gYXhpc1Q7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBheGlzID0gYXhpc1c7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZDNWMy5zZWxlY3QodGhpcykuY2FsbChcclxuICAgICAgICAgICAgICAgIGF4aXMuc2NhbGUoeVtkXSlcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICB9KVxyXG4gICAgICAgIC5hcHBlbmQoXCJ0ZXh0XCIpXHJcbiAgICAgICAgLnN0eWxlKFwidGV4dC1hbmNob3JcIiwgXCJtaWRkbGVcIilcclxuICAgICAgICAuYXR0cihcInlcIiwgLTkpXHJcbiAgICAgICAgLnRleHQoZnVuY3Rpb24oZCkge1xyXG4gICAgICAgICAgICByZXR1cm4gZDtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAvLyBBZGQgYW5kIHN0b3JlIGEgYnJ1c2ggZm9yIGVhY2ggYXhpcy5cclxuICAgIGcuYXBwZW5kKFwiZ1wiKVxyXG4gICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJicnVzaFwiKVxyXG4gICAgICAgIC5lYWNoKGZ1bmN0aW9uKGQpIHtcclxuICAgICAgICAgICAgZDNWMy5zZWxlY3QodGhpcykuY2FsbCh5W2RdLmJydXNoID0gZDNWMy5zdmcuYnJ1c2goKS55KHlbZF0pLm9uKFwiYnJ1c2hzdGFydFwiLCBicnVzaHN0YXJ0KS5vbihcImJydXNoXCIsIGJydXNoKSk7XHJcbiAgICAgICAgfSlcclxuICAgICAgICAuc2VsZWN0QWxsKFwicmVjdFwiKVxyXG4gICAgICAgIC5hdHRyKFwieFwiLCAtOClcclxuICAgICAgICAuYXR0cihcIndpZHRoXCIsIDE2KTtcclxuXHJcblxyXG4gICAgZnVuY3Rpb24gcG9zaXRpb24oZCkge1xyXG4gICAgdmFyIHYgPSBkcmFnZ2luZ1tkXTtcclxuICAgIHJldHVybiB2ID09IG51bGwgPyB4KGQpIDogdjtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiB0cmFuc2l0aW9uKGcpIHtcclxuICAgIHJldHVybiBnLnRyYW5zaXRpb24oKS5kdXJhdGlvbig1MDApO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIFJldHVybnMgdGhlIHBhdGggZm9yIGEgZ2l2ZW4gZGF0YSBwb2ludC5cclxuICAgIGZ1bmN0aW9uIHBhdGgoZCkge1xyXG4gICAgcmV0dXJuIGxpbmUoZGltZW5zaW9ucy5tYXAoZnVuY3Rpb24ocCkgeyByZXR1cm4gW3Bvc2l0aW9uKHApLCB5W3BdKGRbcF0pXTsgfSkpO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGJydXNoc3RhcnQoKSB7XHJcbiAgICBkM1YzLmV2ZW50LnNvdXJjZUV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIEhhbmRsZXMgYSBicnVzaCBldmVudCwgdG9nZ2xpbmcgdGhlIGRpc3BsYXkgb2YgZm9yZWdyb3VuZCBsaW5lcy5cclxuICAgIGZ1bmN0aW9uIGJydXNoKCkge1xyXG4gICAgdmFyIGFjdGl2ZXMgPSBkaW1lbnNpb25zLmZpbHRlcihmdW5jdGlvbihwKSB7IHJldHVybiAheVtwXS5icnVzaC5lbXB0eSgpOyB9KSxcclxuICAgICAgICBleHRlbnRzID0gYWN0aXZlcy5tYXAoZnVuY3Rpb24ocCkgeyByZXR1cm4geVtwXS5icnVzaC5leHRlbnQoKTsgfSk7XHJcbiAgICBmb3JlZ3JvdW5kLnN0eWxlKFwiZGlzcGxheVwiLCBmdW5jdGlvbihkKSB7XHJcbiAgICAgICAgcmV0dXJuIGFjdGl2ZXMuZXZlcnkoZnVuY3Rpb24ocCwgaSkge1xyXG4gICAgICAgIHJldHVybiBleHRlbnRzW2ldWzBdIDw9IGRbcF0gJiYgZFtwXSA8PSBleHRlbnRzW2ldWzFdO1xyXG4gICAgICAgIH0pID8gbnVsbCA6IFwibm9uZVwiO1xyXG4gICAgfSk7XHJcbiAgICB9XHJcblxyXG59IiwiZnVuY3Rpb24gcmVuZGVyQ2x1c3RlckFuYWx5c2lzKHJlc3ApIHtcclxuICBkMy5zZWxlY3QoXCIuY2hhcnQxMlwiKS5yZW1vdmUoKTtcclxuICB2YXIgZG9jdW1lbnRfdG9waWMgPSByZXNwW1wiZG9jdW1lbnRfdG9waWNcIl1bMF07XHJcbiAgdmFyIHRvcGljX3ZlY3RvcnMgPSByZXNwW1widG9waWNfdmVjdG9yc1wiXTtcclxuICB2YXIgYmIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjY2x1c3RlcicpXHJcbiAgICAuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCksXHJcbiAgICB3aWR0aCA9IDQwMDtcclxuICB2YXIgaGVpZ2h0ID0gNDAwO1xyXG4gIHZhciBtYXJnaW4gPSA4MDtcclxuICB2YXIgZGF0YSA9IFtdO1xyXG5cclxuICBPYmplY3Qua2V5cyh0b3BpY192ZWN0b3JzKS5mb3JFYWNoKGZ1bmN0aW9uKGtleSkge1xyXG4gICAgdmFyIHZhbHVlID0gdG9waWNfdmVjdG9yc1trZXldO1xyXG4gICAgZGF0YS5wdXNoKHtcclxuICAgICAgeDogdmFsdWVbMF0sXHJcbiAgICAgIHk6IHZhbHVlWzFdLFxyXG4gICAgICBjOiAxLFxyXG4gICAgICBzaXplOiBkb2N1bWVudF90b3BpY1trZXldLFxyXG4gICAgICBrZXk6IGtleVxyXG4gICAgfSk7XHJcbiAgfSk7XHJcbiAgdmFyIGxhYmVsWCA9ICdYJztcclxuICB2YXIgbGFiZWxZID0gJ1knO1xyXG5cclxuICB2YXIgc3ZnID0gZDMuc2VsZWN0KCcjY2x1c3RlcicpXHJcbiAgICAuYXBwZW5kKCdzdmcnKVxyXG4gICAgLmF0dHIoJ2NsYXNzJywgJ2NoYXJ0MTInKVxyXG4gICAgLmF0dHIoJ2lkJywnY2x1c3Rlcl9pZCcpXHJcbiAgICAuYXR0cihcIndpZHRoXCIsIHdpZHRoICsgbWFyZ2luICsgbWFyZ2luKVxyXG4gICAgLmF0dHIoXCJoZWlnaHRcIiwgaGVpZ2h0ICsgbWFyZ2luICsgbWFyZ2luKVxyXG4gICAgLmFwcGVuZChcImdcIilcclxuICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKFwiICsgbWFyZ2luICsgXCIsXCIgKyBtYXJnaW4gKyBcIilcIik7XHJcblxyXG4gIHZhciB4ID0gZDMuc2NhbGVMaW5lYXIoKVxyXG4gICAgLmRvbWFpbihbZDMubWluKGRhdGEsIGZ1bmN0aW9uIChkKSB7XHJcbiAgICAgIHJldHVybiBkLng7XHJcbiAgICB9KSwgZDMubWF4KGRhdGEsIGZ1bmN0aW9uIChkKSB7XHJcbiAgICAgIHJldHVybiBkLng7XHJcbiAgICB9KV0pXHJcbiAgICAucmFuZ2UoWzAsIHdpZHRoXSk7XHJcblxyXG4gIHZhciB5ID0gZDMuc2NhbGVMaW5lYXIoKVxyXG4gICAgLmRvbWFpbihbZDMubWluKGRhdGEsIGZ1bmN0aW9uIChkKSB7XHJcbiAgICAgIHJldHVybiBkLnk7XHJcbiAgICB9KSwgZDMubWF4KGRhdGEsIGZ1bmN0aW9uIChkKSB7XHJcbiAgICAgIHJldHVybiBkLnk7XHJcbiAgICB9KV0pXHJcbiAgICAucmFuZ2UoW2hlaWdodCwgMF0pO1xyXG5cclxuICB2YXIgc2NhbGUgPSBkMy5zY2FsZVNxcnQoKVxyXG4gICAgLmRvbWFpbihbZDMubWluKGRhdGEsIGZ1bmN0aW9uIChkKSB7XHJcbiAgICAgIHJldHVybiBkLnNpemU7XHJcbiAgICB9KSwgZDMubWF4KGRhdGEsIGZ1bmN0aW9uIChkKSB7XHJcbiAgICAgIHJldHVybiBkLnNpemU7XHJcbiAgICB9KV0pXHJcbiAgICAucmFuZ2UoWzEwLCAyMF0pO1xyXG5cclxuICB2YXIgb3BhY2l0eSA9IGQzLnNjYWxlU3FydCgpXHJcbiAgICAuZG9tYWluKFtkMy5taW4oZGF0YSwgZnVuY3Rpb24gKGQpIHtcclxuICAgICAgcmV0dXJuIGQuc2l6ZTtcclxuICAgIH0pLCBkMy5tYXgoZGF0YSwgZnVuY3Rpb24gKGQpIHtcclxuICAgICAgcmV0dXJuIGQuc2l6ZTtcclxuICAgIH0pXSlcclxuICAgIC5yYW5nZShbMSwgLjVdKTtcclxuXHJcblxyXG4gIHZhciB4QXhpcyA9IGQzLmF4aXNCb3R0b20oKS5zY2FsZSh4KTtcclxuICB2YXIgeUF4aXMgPSBkMy5heGlzTGVmdCgpLnNjYWxlKHkpO1xyXG5cclxuXHJcbiAgc3ZnLmFwcGVuZChcImdcIilcclxuICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJ5IGF4aXNcIilcclxuICAgIC5jYWxsKHlBeGlzKVxyXG4gICAgLmFwcGVuZChcInRleHRcIilcclxuICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIFwicm90YXRlKC05MClcIilcclxuICAgIC5hdHRyKFwieFwiLCAyMClcclxuICAgIC5hdHRyKFwieVwiLCAtbWFyZ2luKVxyXG4gICAgLmF0dHIoXCJkeVwiLCBcIi43MWVtXCIpXHJcbiAgICAuc3R5bGUoXCJ0ZXh0LWFuY2hvclwiLCBcImVuZFwiKVxyXG4gICAgLnRleHQobGFiZWxZKTtcclxuICAvLyB4IGF4aXMgYW5kIGxhYmVsXHJcbiAgc3ZnLmFwcGVuZChcImdcIilcclxuICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJ4IGF4aXNcIilcclxuICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKDAsXCIgKyBoZWlnaHQgKyBcIilcIilcclxuICAgIC5jYWxsKHhBeGlzKVxyXG4gICAgLmFwcGVuZChcInRleHRcIilcclxuICAgIC5hdHRyKFwieFwiLCB3aWR0aCArIDIwKVxyXG4gICAgLmF0dHIoXCJ5XCIsIG1hcmdpbiAtIDEwKVxyXG4gICAgLmF0dHIoXCJkeVwiLCBcIi43MWVtXCIpXHJcbiAgICAuc3R5bGUoXCJ0ZXh0LWFuY2hvclwiLCBcImVuZFwiKVxyXG4gICAgLnRleHQobGFiZWxYKTtcclxuXHJcbiAgc3ZnLnNlbGVjdEFsbChcImNpcmNsZVwiKVxyXG4gICAgLmRhdGEoZGF0YSlcclxuICAgIC5lbnRlcigpXHJcbiAgICAuYXBwZW5kKFwiZ1wiKVxyXG4gICAgLmluc2VydChcImNpcmNsZVwiKVxyXG4gICAgLmF0dHIoXCJjeFwiLCB3aWR0aCAvIDIpXHJcbiAgICAuYXR0cihcImN5XCIsIGhlaWdodCAvIDIpXHJcbiAgICAuYXR0cihcInJcIiwgZnVuY3Rpb24gKGQpIHtcclxuICAgICAgcmV0dXJuIHNjYWxlKGQuc2l6ZSk7XHJcbiAgICB9KVxyXG4gICAgLmF0dHIoXCJpZFwiLGZ1bmN0aW9uKGQpIHtcclxuICAgICAgcmV0dXJuIGQua2V5XHJcbiAgICB9KVxyXG4gICAgLnN0eWxlKFwiZmlsbFwiLCBmdW5jdGlvbiAoZCkge1xyXG4gICAgICByZXR1cm4gXCIjRDBFM0YwXCI7XHJcbiAgICB9KVxyXG4gICAgLm9uKCdtb3VzZW92ZXInLCBmdW5jdGlvbiAoZCwgaSkge1xyXG4gICAgICByZW5kZXJCYXJHcmFwaChkW1wia2V5XCJdLCByZXNwKTtcclxuICAgICAgZmFkZShkW1wia2V5XCJdLCAxKTtcclxuICAgIH0pXHJcbiAgICAub24oJ21vdXNlb3V0JywgZnVuY3Rpb24gKGQsIGkpIHtcclxuICAgICAgZmFkZU91dCgpO1xyXG4gICAgfSlcclxuICAgIC50cmFuc2l0aW9uKClcclxuICAgIC5kZWxheShmdW5jdGlvbiAoZCwgaSkge1xyXG4gICAgICByZXR1cm4geChkLngpIC0geShkLnkpO1xyXG4gICAgfSlcclxuICAgIC5kdXJhdGlvbig1MDApXHJcbiAgICAuYXR0cihcImN4XCIsIGZ1bmN0aW9uIChkKSB7XHJcbiAgICAgIHJldHVybiB4KGQueCk7XHJcbiAgICB9KVxyXG4gICAgLmF0dHIoXCJjeVwiLCBmdW5jdGlvbiAoZCkge1xyXG4gICAgICByZXR1cm4geShkLnkpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgICAvLyB0ZXh0IGxhYmVsIGZvciB0aGUgeCBheGlzXHJcbiAgc3ZnLmFwcGVuZChcInRleHRcIilcclxuICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJ4IGxhYmVsXCIpXHJcbiAgICAuYXR0cihcInRleHQtYW5jaG9yXCIsIFwiZW5kXCIpXHJcbiAgICAuYXR0cihcInhcIiwgd2lkdGgpXHJcbiAgICAuYXR0cihcInlcIiwgaGVpZ2h0ICs0MClcclxuICAgIC50ZXh0KFwiUEMxXCIpO1xyXG5cclxuXHJcbiAgc3ZnLmFwcGVuZChcInRleHRcIilcclxuICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJ5IGxhYmVsXCIpXHJcbiAgICAuYXR0cihcInRleHQtYW5jaG9yXCIsIFwiZW5kXCIpXHJcbiAgICAuYXR0cihcInlcIiwgLTUwKVxyXG4gICAgLmF0dHIoXCJkeVwiLCBcIi43NWVtXCIpXHJcbiAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBcInJvdGF0ZSgtOTApXCIpXHJcbiAgICAudGV4dChcIlBDMlwiKTtcclxuXHJcblxyXG4gIGZ1bmN0aW9uIGZhZGUoa2V5LCBvcGFjaXR5KSB7XHJcbiAgICBzdmcuc2VsZWN0QWxsKFwiY2lyY2xlXCIpXHJcbiAgICAgIC5maWx0ZXIoZnVuY3Rpb24gKGQpIHtcclxuICAgICAgICBcclxuICAgICAgICByZXR1cm4gZC5rZXkgPT0ga2V5O1xyXG4gICAgICB9KS5cclxuICAgICAgc3R5bGUoXCJmaWxsXCIsIFwiI0M4NDIzRVwiKVxyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gZmFkZU91dCgpIHtcclxuICAgIHN2Zy5zZWxlY3RBbGwoXCJjaXJjbGVcIilcclxuICAgICAgLnRyYW5zaXRpb24oKVxyXG4gICAgICAuc3R5bGUoXCJmaWxsXCIsXCIjRDBFM0YwXCIpO1xyXG4gIH1cclxufSIsImZ1bmN0aW9uIHJlbmRlckJhckdyYXBoKHRvcGljX251bWJlciwgcmVzcCkge1xyXG4gIGQzLnNlbGVjdChcIiNzdGFjay1iYXJcIikucmVtb3ZlKCk7XHJcbiAgZDMuc2VsZWN0KFwiI2xlZ2VuZHN2Z1wiKS5yZW1vdmUoKTtcclxuICB2YXIgZmluYWxfZGF0YSA9IFtdO1xyXG4gIHZhciBkYXRhVmFsID1yZXNwW1widG9waWNfd29yZFwiXVt0b3BpY19udW1iZXJdO1xyXG4gIGZvciAodmFyIGtleSBpbiBkYXRhVmFsKSB7XHJcbiAgICBpZiAoZGF0YVZhbC5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XHJcbiAgICAgICAgdmFyIHRlbXAgPXt9O1xyXG4gICAgICAgIHRlbXAuU3RhdGUgPSBrZXk7XHJcbiAgICAgICAgdGVtcC50b3BpY19mcmVxdWVuY3kgPSBNYXRoLmFicyhkYXRhVmFsW2tleV0pO1xyXG4gICAgICAgIHRlbXAub3ZlcmFsbCA9IE1hdGguYWJzKHJlc3BbXCJvdmVyYWxsX3dvcmRcIl1ba2V5XSk7XHJcbiAgICAgICAgdGVtcC50b3RhbCA9IHRlbXAudG9waWNfZnJlcXVlbmN5ICsgdGVtcC5vdmVyYWxsO1xyXG4gICAgICAgIGZpbmFsX2RhdGEucHVzaCh0ZW1wKTtcclxuICAgICAgICBjb25zb2xlLmxvZyhrZXkgKyBcIi0+XCIgKyByZXNwW1wib3ZlcmFsbF93b3JkXCJdW2tleV0pO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgfVxyXG4gIFxyXG4gIHZhciBiYiA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNzdGFja2VkLWJhcicpXHJcbiAgICAuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCksXHJcbiAgICB3aWR0aCA9IDQwMDtcclxuXHJcbiAgdmFyIGRhdGEgPSBmaW5hbF9kYXRhO1xyXG4gIHZhciBoZWlnaHQgPSBkYXRhLmxlbmd0aCAqIDI1ICsxMDA7XHJcbiAgdmFyIHN2ZyA9IGQzLnNlbGVjdChcIiNzdGFja2VkLWJhclwiKS5hcHBlbmQoXCJzdmdcIikuYXR0cihcIndpZHRoXCIsIHdpZHRoKS5hdHRyKFwiaGVpZ2h0XCIsIGhlaWdodCkuYXR0cihcImlkXCIsXCJzdGFjay1iYXJcIiksXHJcbiAgICBtYXJnaW4gPSB7XHJcbiAgICAgIHRvcDogMjAsXHJcbiAgICAgIHJpZ2h0OiAwLFxyXG4gICAgICBib3R0b206IDUwLFxyXG4gICAgICBsZWZ0OiA4MFxyXG4gICAgfSxcclxuICAgIHdpZHRoID0gK3N2Zy5hdHRyKFwid2lkdGhcIikgLSBtYXJnaW4ubGVmdCAtIG1hcmdpbi5yaWdodCxcclxuICAgIGhlaWdodCA9ICtzdmcuYXR0cihcImhlaWdodFwiKSAtIG1hcmdpbi50b3AgLSBtYXJnaW4uYm90dG9tLFxyXG4gICAgZyA9IHN2Zy5hcHBlbmQoXCJnXCIpLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoXCIgKyBtYXJnaW4ubGVmdCArIFwiLFwiICsgbWFyZ2luLnRvcCArIFwiKVwiKTtcclxuICB2YXIgeSA9IGQzLnNjYWxlQmFuZCgpIC8vIHggPSBkMy5zY2FsZUJhbmQoKSAgXHJcbiAgICAucmFuZ2VSb3VuZChbMCwgaGVpZ2h0XSkgLy8gLnJhbmdlUm91bmQoWzAsIHdpZHRoXSlcclxuICAgIC5wYWRkaW5nSW5uZXIoMC4yNSkuYWxpZ24oMC4xKTtcclxuICB2YXIgeCA9IGQzLnNjYWxlTGluZWFyKCkgLy8geSA9IGQzLnNjYWxlTGluZWFyKClcclxuICAgIC5yYW5nZVJvdW5kKFswLCB3aWR0aF0pOyAvLyAucmFuZ2VSb3VuZChbaGVpZ2h0LCAwXSk7XHJcblxyXG4gIHZhciB6ID0gZDMuc2NhbGVPcmRpbmFsKCkucmFuZ2UoW1wiI0M4NDIzRVwiLCBcIiNBMUM3RTBcIl0pO1xyXG4gIHZhciBrZXlzID0gW1widG9waWNfZnJlcXVlbmN5XCIsIFwib3ZlcmFsbFwiXTtcclxuICBkYXRhLnNvcnQoZnVuY3Rpb24gKGEsIGIpIHtcclxuICAgIHJldHVybiBiLnRvdGFsIC0gYS50b3RhbDtcclxuICB9KTtcclxuICB5LmRvbWFpbihkYXRhLm1hcChmdW5jdGlvbiAoZCkge1xyXG4gICAgcmV0dXJuIGQuU3RhdGU7XHJcbiAgfSkpOyAvLyB4LmRvbWFpbi4uLlxyXG5cclxuICB4LmRvbWFpbihbMCwgZDMubWF4KGRhdGEsIGZ1bmN0aW9uIChkKSB7XHJcbiAgICByZXR1cm4gZC50b3RhbDtcclxuICB9KV0pLm5pY2UoKTsgLy8geS5kb21haW4uLi5cclxuXHJcbiAgei5kb21haW4oa2V5cyk7XHJcbiAgZy5hcHBlbmQoXCJnXCIpXHJcbiAgICAuc2VsZWN0QWxsKFwiZ1wiKVxyXG4gICAgLmRhdGEoZDMuc3RhY2soKS5rZXlzKGtleXMpKGRhdGEpKVxyXG4gICAgLmVudGVyKCkuYXBwZW5kKFwiZ1wiKVxyXG4gICAgICAuYXR0cihcImZpbGxcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4geihkLmtleSk7IH0pXHJcbiAgICAuc2VsZWN0QWxsKFwicmVjdFwiKVxyXG4gICAgLmRhdGEoZnVuY3Rpb24oZCkgeyByZXR1cm4gZDsgfSlcclxuICAgIC5lbnRlcigpLmFwcGVuZChcInJlY3RcIilcclxuICAgICAgLmF0dHIoXCJ5XCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIHkoZC5kYXRhLlN0YXRlKTsgfSkgICAgIC8vLmF0dHIoXCJ4XCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIHgoZC5kYXRhLlN0YXRlKTsgfSlcclxuICAgICAgLmF0dHIoXCJ4XCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIHgoZFswXSk7IH0pICAgICAgICAgLy8uYXR0cihcInlcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4geShkWzFdKTsgfSkgXHJcbiAgICAgIC5hdHRyKFwid2lkdGhcIiwgZnVuY3Rpb24oZCkge1xyXG4gICAgICAgIFxyXG4gICAgICAgcmV0dXJuIHgoZFsxXSkgLSB4KGRbMF0pOyBcclxuICAgIH0pIC8vLmF0dHIoXCJoZWlnaHRcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4geShkWzBdKSAtIHkoZFsxXSk7IH0pXHJcbiAgICAgIC5hdHRyKFwiaGVpZ2h0XCIsIHkuYmFuZHdpZHRoKCkpOyAgICAgICAgICAgICAgIC8vLmF0dHIoXCJ3aWR0aFwiLCB4LmJhbmR3aWR0aCgpKTsgIFxyXG5cclxuICBnLmFwcGVuZChcImdcIilcclxuICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcImF4aXNcIilcclxuICAgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoMCwwKVwiKSAgICAgICAgICAgIC8vICAuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZSgwLFwiICsgaGVpZ2h0ICsgXCIpXCIpXHJcbiAgICAgIC5jYWxsKGQzLmF4aXNMZWZ0KHkpKTsgICAgICAgICAgICAgICAgICAvLyAgIC5jYWxsKGQzLmF4aXNCb3R0b20oeCkpO1xyXG5cclxuICBnLmFwcGVuZChcImdcIilcclxuICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcImF4aXNcIilcclxuICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKDAsXCIraGVpZ2h0K1wiKVwiKSAgICAgICAvLyBOZXcgbGluZVxyXG4gICAgICAuY2FsbChkMy5heGlzQm90dG9tKHgpLnRpY2tzKG51bGwsIFwic1wiKSkgICAgICAgICAgLy8gIC5jYWxsKGQzLmF4aXNMZWZ0KHkpLnRpY2tzKG51bGwsIFwic1wiKSlcclxuICAgIC5hcHBlbmQoXCJ0ZXh0XCIpXHJcbiAgICAgIC5hdHRyKFwieVwiLCAyKSAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgIC5hdHRyKFwieVwiLCAyKVxyXG4gICAgICAuYXR0cihcInhcIiwgeCh4LnRpY2tzKCkucG9wKCkpICsgMC41KSAgICAgICAgICAgIC8vICAgICAuYXR0cihcInlcIiwgeSh5LnRpY2tzKCkucG9wKCkpICsgMC41KVxyXG4gICAgICAuYXR0cihcImR5XCIsIFwiNGVtXCIpICAgICAgICAgICAgICAgICAgIC8vICAgICAuYXR0cihcImR5XCIsIFwiMC4zMmVtXCIpXHJcbiAgICAgIC5hdHRyKFwiZmlsbFwiLCBcIiMwMDBcIilcclxuICAgICAgLmF0dHIoXCJ0ZXh0LWFuY2hvclwiLCBcInN0YXJ0XCIpXHJcbiAgICAgIC50ZXh0KFwiUHJvYmFiaWxpdHkvQ29zaW5lIFNpbWlsYXJpdHlcIilcclxuICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKFwiKyAoLXdpZHRoKSArXCIsLTEwKVwiKTsgICAgLy8gTmV3bGluZVxyXG5cclxuICB2YXIgbGVnZW5kID0gZy5hcHBlbmQoXCJnXCIpXHJcbiAgICAgIC5hdHRyKFwiZm9udC1mYW1pbHlcIiwgXCJzYW5zLXNlcmlmXCIpXHJcbiAgICAgIC5hdHRyKFwiZm9udC1zaXplXCIsIDEwKVxyXG4gICAgICAuYXR0cihcInRleHQtYW5jaG9yXCIsIFwiZW5kXCIpXHJcbiAgICAuc2VsZWN0QWxsKFwiZ1wiKVxyXG4gICAgLmRhdGEoa2V5cy5zbGljZSgpLnJldmVyc2UoKSlcclxuICAgIC5lbnRlcigpLmFwcGVuZChcImdcIilcclxuICAgIC8vLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgZnVuY3Rpb24oZCwgaSkgeyByZXR1cm4gXCJ0cmFuc2xhdGUoMCxcIiArIGkgKiAyMCArIFwiKVwiOyB9KTtcclxuICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgZnVuY3Rpb24oZCwgaSkgeyByZXR1cm4gXCJ0cmFuc2xhdGUoLTUwLFwiICsgKDMwMCArIGkgKiAyMCkgKyBcIilcIjsgfSk7XHJcbiAgXHJcblxyXG4gIHZhciBrZXlzMSA9IFtcIk92ZXJhbGwgVGVybSBGcmVxdWVuY3lcIiwgXCJFc3RpbWF0ZWQgVGVybSBmcmVxdWVuY3kgd2l0aGluIHRoZSBzZWxlY3RlZCB0b3BpY1wiXTsgXHJcbiAgdmFyIHN2ZzEgPSBkMy5zZWxlY3QoXCIjbGVnZW5kVFwiKS5hcHBlbmQoXCJzdmdcIikuYXR0cihcIndpZHRoXCIsIDUwMCkuYXR0cihcImhlaWdodFwiLCBoZWlnaHQpLmF0dHIoXCJpZFwiLFwibGVnZW5kc3ZnXCIpXHJcbnZhciBsZWdlbmQgPSBzdmcxLmFwcGVuZChcImdcIikuYXR0cihcImZvbnQtZmFtaWx5XCIsIFwic2Fucy1zZXJpZlwiKS5hdHRyKFwiZm9udC1zaXplXCIsIDEwKS5hdHRyKFwidGV4dC1hbmNob3JcIiwgXCJlbmRcIikuc2VsZWN0QWxsKFwiZ1wiKS5kYXRhKGtleXMxLnNsaWNlKCkucmV2ZXJzZSgpKS5lbnRlcigpLmFwcGVuZChcImdcIikgLy8uYXR0cihcInRyYW5zZm9ybVwiLCBmdW5jdGlvbihkLCBpKSB7IHJldHVybiBcInRyYW5zbGF0ZSgwLFwiICsgaSAqIDIwICsgXCIpXCI7IH0pO1xyXG4gICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgZnVuY3Rpb24gKGQsIGkpIHtcclxuICAgICAgcmV0dXJuIFwidHJhbnNsYXRlKC01MCxcIiArICgwICsgaSAqIDIwKSArIFwiKVwiO1xyXG4gICAgfSk7XHJcbiAgbGVnZW5kLmFwcGVuZChcInJlY3RcIikuYXR0cihcInhcIiwgd2lkdGgpXHJcbiAgLmF0dHIoXCJ3aWR0aFwiLCBmdW5jdGlvbiAoZCwgaSl7XHJcbiAgICAgIGlmKGk9PTApe1xyXG4gICAgICAgIHJldHVybiA2MDtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gMTYwO1xyXG4gIH0pLmF0dHIoXCJoZWlnaHRcIiwgMTkpLmF0dHIoXCJmaWxsXCIsIHopO1xyXG5cclxuICBsZWdlbmQuYXBwZW5kKFwidGV4dFwiKS5hdHRyKFwieFwiLCB3aWR0aCAtIDEwKS5hdHRyKFwieVwiLCAxOCkuYXR0cihcImR5XCIsIFwiMC4wZW1cIikudGV4dChmdW5jdGlvbiAoZCkge1xyXG4gICAgcmV0dXJuIGQ7XHJcbiAgfSk7XHJcbiAgXHJcbn0iLCJmdW5jdGlvbiBnZW5lcmF0ZVRvcGljVmVjdG9ycygpe1xyXG4gICAgd2luZG93LnRvcGljVmVjdG9ycyA9IHt9O1xyXG4gICAgaWYod2luZG93LnRvcGljX3dvcmRfcHJvYmFiaWxpdHlfaW5fdG9waWMpe1xyXG4gICAgICAgIGZvcih2YXIgeCBpbiB3aW5kb3cudG9waWNfd29yZF9wcm9iYWJpbGl0eV9pbl90b3BpYyl7XHJcbiAgICAgICAgICAgIHZhciB2ZWN0b3IgPSBbXTtcclxuICAgICAgICAgICAgZm9yKHZhciB5IGluIHdpbmRvdy50b3BpY193b3JkX3Byb2JhYmlsaXR5X2luX3RvcGljW3hdKXtcclxuICAgICAgICAgICAgICAgIHZlY3Rvci5wdXNoKHdpbmRvdy50b3BpY193b3JkX3Byb2JhYmlsaXR5X2luX3RvcGljW3hdW3ldKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB3aW5kb3cudG9waWNWZWN0b3JzW3hdID0gdmVjdG9yO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuZnVuY3Rpb24gZ2VuZXJhdGVQYXJhbGxlbENvb3JkaW5hdGVEYXRhKHJlc3BvbnNlLCB0b3BpY190aHJlc2hvbGQsIHdvcmRfdGhyZXNob2xkKXtcclxuICAgIGxldCB2aXNEYXRhID0gW107XHJcbiAgICBmb3IgKHZhciBkb2NLZXkgaW4gcmVzcG9uc2VbXCJkb2N1bWVudF90b3BpY1wiXSl7XHJcbiAgICAgICAgZm9yKHZhciB0b3BpYyBpbiByZXNwb25zZVtcImRvY3VtZW50X3RvcGljXCJdW2RvY0tleV0pe1xyXG4gICAgICAgICAgICBsZXQgdG9waWNTY29yZSA9IHJlc3BvbnNlW1wiZG9jdW1lbnRfdG9waWNcIl1bZG9jS2V5XVt0b3BpY107XHJcbiAgICAgICAgICAgIGlmICh0b3BpY1Njb3JlID4gdG9waWNfdGhyZXNob2xkKXtcclxuXHJcbiAgICAgICAgICAgICAgICBmb3IodmFyIHdvcmQgaW4gcmVzcG9uc2VbXCJ0b3BpY193b3JkXCJdW3RvcGljXSl7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IHdvcmRTY29yZSA9IHJlc3BvbnNlW1widG9waWNfd29yZFwiXVt0b3BpY11bd29yZF07XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHdvcmRTY29yZSA+IHdvcmRfdGhyZXNob2xkKXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmlzRGF0YS5wdXNoKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwibmFtZVwiOiBkb2NLZXksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImRvY3VtZW50XCI6ICBkb2NLZXksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcInRvcGljXCI6IHRvcGljLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJ3b3JkXCI6IHJlc3BvbnNlW1wib3ZlcmFsbF93b3JkXCJdW3dvcmRdXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdmlzRGF0YTtcclxufVxyXG5cclxuZnVuY3Rpb24gZ2VuZXJhdGVQYXJhbGxlbENvb3JkaW5hdGVEYXRhSEMocmVzcG9uc2UsIHRvcGljX3RocmVzaG9sZCwgd29yZF90aHJlc2hvbGQpe1xyXG4gICAgbGV0IHZpc0RhdGEgPSBbXTtcclxuICAgIGZvciAodmFyIGRvY0tleSBpbiByZXNwb25zZVtcImRvY3VtZW50X3RvcGljXCJdKXtcclxuICAgICAgICBmb3IodmFyIHRvcGljIGluIHJlc3BvbnNlW1wiZG9jdW1lbnRfdG9waWNcIl1bZG9jS2V5XSl7XHJcbiAgICAgICAgICAgIGxldCB0b3BpY1Njb3JlID0gcmVzcG9uc2VbXCJkb2N1bWVudF90b3BpY1wiXVtkb2NLZXldW3RvcGljXTtcclxuICAgICAgICAgICAgaWYgKHRvcGljU2NvcmUgPiB0b3BpY190aHJlc2hvbGQpe1xyXG5cclxuICAgICAgICAgICAgICAgIGZvcih2YXIgd29yZCBpbiByZXNwb25zZVtcInRvcGljX3dvcmRcIl1bdG9waWNdKXtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgd29yZFNjb3JlID0gcmVzcG9uc2VbXCJ0b3BpY193b3JkXCJdW3RvcGljXVt3b3JkXTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAod29yZFNjb3JlID4gd29yZF90aHJlc2hvbGQpe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2aXNEYXRhLnB1c2goW3BhcnNlSW50KGRvY0tleSksIHBhcnNlSW50KHRvcGljKSwgcmVzcG9uc2VbXCJ3b3Jkc1wiXS5pbmRleE9mKHdvcmQpXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiB2aXNEYXRhO1xyXG59XHJcblxyXG5cclxuIiwid2luZG93LnZ1ZUFwcCA9IG5ldyBWdWUoe1xyXG4gICAgZWw6ICcjdnVlLWFwcCcsXHJcbiAgICBkYXRhOiB7XHJcbiAgICAgICAgbWVzc2FnZTogJ0hlbGxvIHVzZXIhJyxcclxuICAgICAgICBub25lU2VsZWN0ZWQ6IHRydWUsXHJcbiAgICAgICAgc2VsZWN0ZWRQYWdlOiA1LFxyXG4gICAgICAgIHBsYXllckRldGFpbDoge1xyXG4gICAgICAgICAgICBuYW1lOiBcIjxQbGF5ZXIgTmFtZT5cIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgb3ZlcnZpZXdGaWx0ZXJzOiB7fSxcclxuICAgICAgICBuZXdEb2NzOiBbXSxcclxuICAgICAgICBzZWxlY3RlZE1hcDogMSxcclxuICAgICAgICBzdWNjZXNzOiBmYWxzZSxcclxuICAgICAgICBsb2FkaW5nOiBmYWxzZSxcclxuICAgICAgICBuZXdEb2M6ICcnLFxyXG4gICAgICAgIG5ld0RvY3NQcm9jY2Vzc2VkOiAnJyxcclxuICAgICAgICBzaG93UHJvY2Vzc2VkOiBmYWxzZSxcclxuICAgICAgICBzZXR0aW5nczoge1xyXG4gICAgICAgICAgICBzZWxlY3RlZE1ldGhvZDogJ3dvcmQyVmVjJyxcclxuICAgICAgICAgICAgc2VsZWN0ZWREYXRhc2V0OiAwLFxyXG4gICAgICAgICAgICBzdGFydDE6IDAsICAgICAgLy9IYXBweURCXHJcbiAgICAgICAgICAgIGVuZDE6IDEwLCAgICAgICAgLy9IYXBweURCXHJcbiAgICAgICAgICAgIHN0YXJ0MjogMCwgICAgICAvL01lZGl1bVxyXG4gICAgICAgICAgICBlbmQyOiA1LCAgICAgICAgLy9NZWRpdW1cclxuICAgICAgICAgICAgbGRhVG9waWNUaHJlc2hvbGQ6IDAsXHJcbiAgICAgICAgICAgIHdvcmQyVmVjVGhyZXNob2xkOiAwXHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuICAgIG1ldGhvZHM6IHtcclxuICAgICAgICBzZWxlY3RQYWdlOiBmdW5jdGlvbih4KXtcclxuICAgICAgICAgICAgdGhpcy5zZWxlY3RlZFBhZ2UgPSB4O1xyXG4gICAgICAgICAgICBpZiAoeCA9PSAxKXtcclxuICAgICAgICAgICAgICAgIGluaXRQYWdlMSh3aW5kb3cuZ2xvYmFsX2RhdGEpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICh4ID09IDIpe1xyXG4gICAgICAgICAgICAgICAgaW5pdFBhZ2UyKHdpbmRvdy5nbG9iYWxfZGF0YSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKHggPT0gMyl7XHJcbiAgICAgICAgICAgICAgICBpbml0UGFnZTMod2luZG93Lmdsb2JhbF9kYXRhKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoeCA9PSA0KXtcclxuICAgICAgICAgICAgICAgIGluaXRQYWdlNCh3aW5kb3cuZ2xvYmFsX2RhdGEpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgICBhZGROZXdEb2M6IGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLm5ld0RvYy50cmltKCkuc3BsaXQoXCIgXCIpLmxlbmd0aCA8IDMpe1xyXG4gICAgICAgICAgICAgICAgYWxlcnQoXCJQbGVhc2UgYWRkIGF0IGxlYXN0IDMgd29yZHNcIik7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5uZXdEb2NzLnB1c2godGhpcy5uZXdEb2MpO1xyXG4gICAgICAgICAgICB0aGlzLm5ld0RvYyA9ICcnO1xyXG4gICAgICAgICAgICB0aGlzLnNob3dQcm9jZXNzZWQgPSBmYWxzZTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHByb2Nlc3NEb2NzOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHZhciBzZWxmID0gdGhpcztcclxuICAgICAgICAgICAgZ2V0VG9rZW5pemVkRG9jcyh0aGlzLm5ld0RvY3MsIGZ1bmN0aW9uKHJlc3Ape1xyXG4gICAgICAgICAgICAgICAgc2VsZi5uZXdEb2NzUHJvY2Nlc3NlZCA9IHJlc3A7XHJcbiAgICAgICAgICAgICAgICBzZWxmLnNob3dQcm9jZXNzZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHNhdmVDaGFuZ2VzOiBmdW5jdGlvbigpe1xyXG4gICAgICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcbiAgICAgICAgICAgIHNlbGYuc3VjY2VzcyA9IGZhbHNlO1xyXG4gICAgICAgICAgICBzZWxmLmxvYWRpbmcgPSB0cnVlO1xyXG4gICAgICAgICAgICBpZiAodGhpcy5zZXR0aW5ncy5zZWxlY3RlZERhdGFzZXQgPT0gMCl7XHJcbiAgICAgICAgICAgICAgICBpZih0aGlzLnNldHRpbmdzLmVuZDEgLSB0aGlzLnNldHRpbmdzLnN0YXJ0MSA8IDEwKXtcclxuICAgICAgICAgICAgICAgICAgICBhbGVydChcIlRoZXJlIG5lZWRzIHRvIGJlIGF0bGVhc3QgNSBkb2N1bWVudHMoJiA8PSA1MCkgZm9yIEhhcHB5IERCLiBBbmQgc3RhcnQgaW5kZXggY2FuIG5vdCBiZSBncmVhdGVyIHRoYW4gZW5kLlwiKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYodGhpcy5zZXR0aW5ncy5lbmQxIC0gdGhpcy5zZXR0aW5ncy5zdGFydDEgPiA1MCl7XHJcbiAgICAgICAgICAgICAgICAgICAgYWxlcnQoXCJUaGVyZSBuZWVkcyB0byBiZSBsZXNzIHRoYW4gNTAgZG9jdW1lbnRzIGZvciBIYXBweURCLlwiKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodGhpcy5zZXR0aW5ncy5zZWxlY3RlZERhdGFzZXQgPT0gMSl7XHJcbiAgICAgICAgICAgICAgICBpZih0aGlzLnNldHRpbmdzLmVuZDIgLSB0aGlzLnNldHRpbmdzLnN0YXJ0MiA8IDUpe1xyXG4gICAgICAgICAgICAgICAgICAgIGFsZXJ0KFwiVGhlcmUgbmVlZHMgdG8gYmUgYXRsZWFzdCA1IGRvY3VtZW50cygmIDw9IDMwKSBmb3IgTWVkaXVtIEFydGljbGVzLiBBbmQgc3RhcnQgaW5kZXggY2FuIG5vdCBiZSBncmVhdGVyIHRoYW4gZW5kLlwiKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYodGhpcy5zZXR0aW5ncy5lbmQyIC0gdGhpcy5zZXR0aW5ncy5zdGFydDIgPiAzMCl7XHJcbiAgICAgICAgICAgICAgICAgICAgYWxlcnQoXCJUaGVyZSBuZWVkcyB0byBiZSBsZXNzIHRoYW4gMzAgZG9jdW1lbnRzIGZvciBNZWRpdW0gQXJ0aWNsZXMuXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSBlbHNlIGlmICh0aGlzLnNldHRpbmdzLnNlbGVjdGVkRGF0YXNldCA9PSAyKXtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIXRoaXMuc2hvd1Byb2Nlc3NlZCl7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFsZXJ0KFwiUGxlYXNlIHByb2Nlc3MgYWxsIGRvY3VtZW50cyBmaXJzdFwiKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB3aW5kb3cuZG9jdW1lbnRzID0gdGhpcy5uZXdEb2NzUHJvY2Nlc3NlZDtcclxuICAgICAgICAgICAgfVxyXG5cclxuXHJcbiAgICAgICAgICAgIGdldEFuYWx5c2lzKHRoaXMuc2V0dGluZ3Muc2VsZWN0ZWRNZXRob2QsIGZ1bmN0aW9uKHJlc3Ape1xyXG4gICAgICAgICAgICAgICAgc2VsZi5zdWNjZXNzID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIHNlbGYubG9hZGluZyA9IGZhbHNlO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG4gICAgbW91bnRlZDogZnVuY3Rpb24oKXtcclxuICAgICAgICBjb25zb2xlLmxvZyhcIk1vdW50ZWRcIik7XHJcbiAgICAgICAgbG9hZEQzKCk7XHJcbiAgICAgICAgbG9hZEpxdWVyeSgpO1xyXG4gICAgfVxyXG59KTsiLCJmdW5jdGlvbiBsb2FkV29yZENsb3VkKHJlc3Ape1xyXG4gICAgbGV0IGRhdGEgPSBbXTtcclxuICAgIGZvcih2YXIgd29yZCBpbiByZXNwW1wib3ZlcmFsbF93b3JkXCJdKXtcclxuICAgICAgICBsZXQgd2VpZ2h0ID0gcmVzcFtcIm92ZXJhbGxfd29yZFwiXVt3b3JkXTtcclxuICAgICAgICAgZGF0YS5wdXNoKHtcclxuICAgICAgICAgICAgbmFtZTogd29yZCxcclxuICAgICAgICAgICAgd2VpZ2h0OiB3ZWlnaHRcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuICAgIGNyZWF0ZVdvcmRDbG91ZChcIm92ZXJhbGwtd2NcIiwgZGF0YSwgXCJBbGwgRG9jdW1lbnRzXCIpO1xyXG5cclxuICAgIGZvcih2YXIgdG9waWMgaW4gcmVzcFtcInRvcGljX3dvcmRcIl0pe1xyXG4gICAgICAgIGxldCBkYXRhID0gW107XHJcbiAgICAgICAgZm9yKHZhciB3b3JkIGluIHJlc3BbXCJ0b3BpY193b3JkXCJdW3RvcGljXSl7XHJcbiAgICAgICAgICAgIGxldCB3ZWlnaHQgPSByZXNwW1widG9waWNfd29yZFwiXVt0b3BpY11bd29yZF07XHJcbiAgICAgICAgICAgIGRhdGEucHVzaCh7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiB3b3JkLFxyXG4gICAgICAgICAgICAgICAgd2VpZ2h0OiB3ZWlnaHRcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgICQoXCIjdG9waWMtd2NzXCIpLmFwcGVuZCgnPGRpdiBjbGFzcz1cImNvbC1zbS02XCI+PGRpdiBzdHlsZT1cIm91dGxpbmU6IHNvbGlkIDFweDtcIiBpZD1cInRvcGljJyt0b3BpYysnXCIgc3R5bGU9XCJoZWlnaHQ6IDMwMHB4O1wiPjwvZGl2PjwvZGl2PicpO1xyXG4gICAgICAgIGNyZWF0ZVdvcmRDbG91ZChcInRvcGljXCIrdG9waWMsIGRhdGEsIFwiVG9waWMgXCIrdG9waWMpO1xyXG4gICAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBjcmVhdGVXb3JkQ2xvdWQoaWQsIGRhdGEsIHRpdGxlKXtcclxuICAgIEhpZ2hjaGFydHMuY2hhcnQoaWQsIHtcclxuICAgICAgICBzZXJpZXM6IFt7XHJcbiAgICAgICAgICAgIHR5cGU6ICd3b3JkY2xvdWQnLFxyXG4gICAgICAgICAgICBkYXRhOiBkYXRhLFxyXG4gICAgICAgICAgICByb3RhdGlvbjoge1xyXG4gICAgICAgICAgICAgICAgZnJvbTogMCxcclxuICAgICAgICAgICAgICAgIHRvOiAwLFxyXG4gICAgICAgICAgICAgICAgb3JpZW50YXRpb25zOiA1XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIG5hbWU6ICdTY29yZSdcclxuICAgICAgICB9XSxcclxuICAgICAgICB0aXRsZToge1xyXG4gICAgICAgICAgICB0ZXh0OiB0aXRsZVxyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59Il19
