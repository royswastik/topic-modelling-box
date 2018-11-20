"use strict";

function loadPieData(filteredCollection) {
  var pieData = filteredCollectionToPieData(filteredCollection);
  ["pie1", "pie2"].map(function (x) {
    if (!window[x + "vis"]) {
      window[x + "vis"] = loadPie("#chart-detail #" + x, pieData[x]);
    } else {
      window[x + "vis"](pieData[x]);
    }
  });
}

function filteredCollectionToPieData(filteredCollection) {
  var result = {
    pie1: [],
    pie2: [],
    pie3: []
  };

  var destinations = _.countBy(filteredCollection.features, function (x) {
    return x.properties.destination_state ? x.properties.destination_state.state : "NSA";
  });

  delete destinations["NSA"];

  var originCities = _.countBy(filteredCollection.features, function (x) {
    return x.properties.origin_city;
  });

  var index = 0;

  for (var dest in destinations) {
    index++;
    result.pie1.push({
      label: dest,
      value: destinations[dest],
      i: index
    });
  }

  index = 0;

  for (var city in originCities) {
    index++;
    result.pie2.push({
      label: city,
      value: originCities[city],
      i: index
    });
  }

  return result;
}

;

function loadPie(htmlid, datas) {
  function updateData(data) {
    var portion = canvas.select(".slices").selectAll("path.slice").data(donut(data), key);
    portion.enter().insert("path").style("fill", function (d) {
      return colorValues(d.data.label);
    }).attr("class", "slice").on("mouseover", function (d) {
      console.log(d);
      $(htmlid + " svg .labels text").css("opacity", 0);
      $(htmlid + " svg .labels .text-label" + d.data.i).css("opacity", 1);
      $(htmlid + " svg .lines polyline").css("opacity", 0);
      $(htmlid + " svg .lines .polyline" + d.data.i + "").css("opacity", 1);
    }).on("mouseout", function (d) {
      $(htmlid + " svg .labels text").css("opacity", 1);
      $(htmlid + " svg .lines polyline").css("opacity", 1);
    });
    portion.transition().duration(1000).attrTween("d", function (d) {
      this._current = this._current || d;
      var interpolate = d3.interpolate(this._current, d);
      this._current = interpolate(0);
      return function (t) {
        return donutArc(interpolate(t));
      };
    });
    portion.exit().remove();

    (function () {
      var textLines = canvas.select(".lines").selectAll("polyline").data(donut(data), key);
      textLines.enter().append("polyline");
      textLines.transition().duration(1000).attrTween("points", function (d) {
        this._current = this._current || d;
        var polationFunction = d3.interpolate(this._current, d);
        this._current = polationFunction(0);
        return function (t) {
          var d2 = polationFunction(t);
          var pos = donutBorder.centroid(d2);
          pos[0] = radius * 0.95 * (arcBend(d2) < Math.PI ? 1 : -1);
          return [donutArc.centroid(d2), donutBorder.centroid(d2), pos];
        };
      }).attr("class", function (d) {
        return "polyline" + d.data.i;
      });
      textLines.exit().remove();
    })();

    var arcBend = function arcBend(d) {
      return d.startAngle + (d.endAngle - d.startAngle) / 2;
    };

    (function () {
      var labelText = canvas.select(".labels").selectAll("text").data(donut(data), key);
      labelText.enter().append("text").attr("dy", ".55em").text(function (d) {
        return d.data.label;
      });
      labelText.transition().duration(800).attrTween("transform", function (d) {
        this._current = this._current || d;
        var polationFunction = d3.interpolate(this._current, d);
        this._current = polationFunction(0);
        return function (t) {
          var d2 = polationFunction(t);
          var centroidPosition = donutBorder.centroid(d2);
          centroidPosition[0] = radius * (arcBend(d2) < Math.PI ? 1 : -1);
          return "translate(" + centroidPosition + ")";
        };
      }).attr("class", function (d) {
        return "text-label" + d.data.i;
      }).styleTween("text-anchor", function (d) {
        this._current = this._current || d;
        var polationFunction = d3.interpolate(this._current, d);
        this._current = polationFunction(0);
        return function (t) {
          var d2 = polationFunction(t);
          return arcBend(d2) < Math.PI ? "start" : "end";
        };
      });
      labelText.exit().remove();
    })();
  }

  ;
  var canvas = d3.select(htmlid).append("svg").append("g");
  var width = 250,
      height = 400,
      radius = Math.min(width, height) / 2;
  canvas.append("g").attr("class", "slices");
  canvas.append("g").attr("class", "lines");
  canvas.append("g").attr("class", "labels");
  var donutBorder = d3.svg.arc().innerRadius(radius).outerRadius(radius);
  var donutArc = d3.svg.arc().outerRadius(radius * 0.8).innerRadius(radius * 0.3);
  var donut = d3.layout.pie().sort(null).value(function (d) {
    return d.value;
  });
  var colorValues = d3.scale.ordinal().range(["#3F5360", "#D57373", "#BCCB59", "#C6C6C6", "#FE4E00", "#E9190F", "#E67F0D", "#A0CED9", "#ADF7B6", "#FFC09F", "#FFEE93"]);
  canvas.attr("transform", "translate(" + 240 + "," + height / 2 + ")");

  var key = function key(d) {
    return d.data.label;
  };

  function getData() {
    return datas;
  }

  updateData(getData());
  return updateData;
}
"use strict";

window.data = null;
window.maxOriginCount = 0;
window.minOriginCount = 10000;

function loadD3() {
  d3.csv("data/airports.csv", function (error, airports) {
    window.airportsMap = {};
    var count = 0;
    airports.map(function (x) {
      count++;
      window.airportsMap[x.IATA_CODE] = x;
      window.airportsMap[x.IATA_CODE]["id"] = count;
    });
    d3.csv("data/flights1.csv", function (error, flights) {
      console.log(flights);
      window.flights = flights;
      d3.csv("data/states.csv", function (error, states) {
        console.log(states);
        window.stateMap = {};
        states.map(function (x) {
          window.stateMap[x.Abbreviation] = {
            state: x.State,
            origin: 0,
            dest: 0
          };
          window.stateMap[x.State] = x.Abbreviation;
        });
        populateStatePopulation();
        getGeoJsonCollection(); //Get Max, Min Per Capita Flight Availibity

        var maxVal = 0;
        var minVal = 1000;
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
          for (var _iterator = statesData.features[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var stateFeature = _step.value;
            var stateName = stateFeature.properties.name;
            var state1 = stateMap[stateMap[stateName]];
            var originCount = state1 ? state1.origin : 0;
            var popDensity = stateFeature.properties.density;
            var value = originCount / popDensity;
            maxVal = Math.max(maxVal, value);
            minVal = Math.min(minVal, value);
          }
        } catch (err) {
          _didIteratorError = true;
          _iteratorError = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion && _iterator.return != null) {
              _iterator.return();
            }
          } finally {
            if (_didIteratorError) {
              throw _iteratorError;
            }
          }
        }

        window.maxPerCapita = maxVal;
        window.minPerCapita = minVal;
        initMap();
        initMap2("mapid2");
        initMap2("mapid3", true);
      });
    });
  });
}

function populateStatePopulation() {
  var _iteratorNormalCompletion2 = true;
  var _didIteratorError2 = false;
  var _iteratorError2 = undefined;

  try {
    for (var _iterator2 = flights[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
      var flight = _step2.value;
      var stateItem = stateMap[airportsMap[flight["ORIGIN_AIRPORT"]]["STATE"]];

      if (stateItem) {
        stateItem.origin += 1;
        window.maxOriginCount = Math.max(maxOriginCount, stateItem.origin);
        window.minOriginCount = Math.min(minOriginCount, stateItem.origin);
      }

      var destItem = stateMap[airportsMap[flight["DESTINATION_AIRPORT"]]["STATE"]];
      if (destItem) destItem.dest += 1;
    }
  } catch (err) {
    _didIteratorError2 = true;
    _iteratorError2 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion2 && _iterator2.return != null) {
        _iterator2.return();
      }
    } finally {
      if (_didIteratorError2) {
        throw _iteratorError2;
      }
    }
  }

  console.log(stateMap);
}

function getGeoJsonCollection() {
  window.geoJsonFeatureCollection = {
    type: 'FeatureCollection',
    features: []
  };
  flights.map(function (flight) {
    var origin = airportsMap[flight["ORIGIN_AIRPORT"]];
    var dest = airportsMap[flight["DESTINATION_AIRPORT"]];

    if (!parseFloat(origin["LONGITUDE"]) || !parseFloat(origin["LATITUDE"]) || !parseFloat(dest["LONGITUDE"]) || !parseFloat(dest["LATITUDE"])) {
      return;
    }

    geoJsonFeatureCollection.features.push({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [parseFloat(origin["LONGITUDE"]), parseFloat(origin["LATITUDE"])]
      },
      properties: {
        "origin_id": origin["id"],
        "origin_city": origin["CITY"],
        "origin_state": stateMap[origin["STATE"]],
        "origin_country": origin["COUNTRY"],
        "origin_lon": parseFloat(origin["LONGITUDE"]),
        "origin_lat": parseFloat(origin["LATITUDE"]),
        "destination_id": dest["id"],
        "destination_city": dest["CITY"],
        "destination_state": stateMap[dest["STATE"]],
        "destination_country": dest["COUNTRY"],
        "destination_lon": parseFloat(dest["LONGITUDE"]),
        "destination_lat": parseFloat(dest["LATITUDE"])
      }
    });
  });
}
"use strict";

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

var mapboxAccessToken = "pk.eyJ1Ijoic3dhc3Rpa3JveSIsImEiOiJjam4yYjhrc2g0dTVkM3BxY3U3bWIyOWZnIn0.h0LB5qI_hPO2mrFG_8zG3A"; // var MB_ATTR = 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
// 			'<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
// 			'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>';

var mapBoxUrl = 'https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=' + mapboxAccessToken;

function initMap() {
  var geoJsonObj;
  var map = L.map('mapid').setView([37.8, -96], 4);
  var selected = "";
  var flightsLayer = L.tileLayer(mapBoxUrl, {
    id: 'mapbox.light',
    attribution: ""
  }).addTo(map);
  flightsLayer.addTo(map); // control that shows state info on hover

  var infoBox = L.control();

  infoBox.onAdd = function (map) {
    this._div = L.DomUtil.create('div', 'info');
    this.update();
    return this._div;
  };

  infoBox.update = function (props) {
    var flightCount = props ? stateMap[stateMap[props.name]] ? stateMap[stateMap[props.name]].origin : "Not Available" : "Not Available";
    this._div.innerHTML = '<h4>Flights availability</h4>' + (props ? '<b>' + props.name + '</b><br />' + flightCount + ' flights' : 'Click on a US state');
  };

  infoBox.addTo(map);

  function mouseOverEvent(e) {
    var layer = e.target;
    layer.setStyle({
      weight: 1,
      color: '#666',
      dashArray: '',
      fillOpacity: 0.7
    });

    if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
      layer.bringToFront();
    }

    infoBox.update(layer.feature.properties);
  }

  function mouseOutEvent(e) {
    geoJsonObj.resetStyle(e.target);
    infoBox.update();
  }

  function clickState(e) {
    map.removeLayer(oneToManyFlowmapLayer);
    var newSelected = e.target.feature.properties.name;

    if (newSelected == selected) {
      window.vueApp.noneSelected = true;
      window.vueApp.selectedState = "";
      flightsFlow(geoJsonFeatureCollection);
      loadPieData({
        features: []
      });
      selected = "";
    } else {
      window.vueApp.noneSelected = false;
      window.vueApp.selectedState = newSelected;
      var filteredCollection = filterCollection(e);
      flightsFlow(filteredCollection);
      loadPieData(filteredCollection);
      selected = newSelected;
    }
  }

  function applyEventToEachState(feature, layer) {
    layer.on({
      mouseover: mouseOverEvent,
      mouseout: mouseOutEvent,
      click: clickState
    });
  }

  geoJsonObj = L.geoJson(statesData, {
    onEachFeature: applyEventToEachState
  }).addTo(map);
  flightsFlow(geoJsonFeatureCollection);

  function flightsFlow(geoData) {
    window.oneToManyFlowmapLayer = L.canvasFlowmapLayer(geoData, {
      originAndDestinationFieldIds: {
        originUniqueIdField: 'origin_id',
        originGeometry: {
          x: 'origin_lon',
          y: 'origin_lat'
        },
        destinationUniqueIdField: 'destination_id',
        destinationGeometry: {
          x: 'destination_lon',
          y: 'destination_lat'
        }
      },
      pathDisplayMode: 'all',
      animationStarted: true,
      animationEasingFamily: 'Cubic',
      animationEasingType: 'In',
      animationDuration: 2000
    });
    window.oneToManyFlowmapLayer.addTo(map);
  } //End init

}

function filterCollection(e) {
  var stateName = e.target.feature.properties.name;

  var filteredFeatures = _toConsumableArray(geoJsonFeatureCollection.features).filter(function (x) {
    return x.properties.origin_state && x.properties.origin_state.state == stateName;
  });

  var filtered = _objectSpread({}, geoJsonFeatureCollection, {
    features: filteredFeatures
  });

  return filtered;
}

function initMap2(htmlid, perCapita) {
  var geoJsonObject;
  var map = L.map(htmlid).setView([37.8, -96], 4);
  var flightsLayer = L.tileLayer(mapBoxUrl, {
    id: 'mapbox.light',
    attribution: ""
  }).addTo(map);
  flightsLayer.addTo(map);
  var infoBox = L.control();

  infoBox.onAdd = function (map) {
    this._div = L.DomUtil.create('div', 'info');
    this.update();
    return this._div;
  };

  infoBox.update = function (props) {
    var flightCount = props ? stateMap[stateMap[props.name]] ? stateMap[stateMap[props.name]].origin : "Not Available" : "Not Available";
    this._div.innerHTML = '<h4>Flights availability</h4>' + (props ? (perCapita ? '<b>' + props.name + '</b>(Population Density)<br />' + props.density + ' people / mi<sup>2</sup><br />' : '') + '<b>Flights</b><br />' + flightCount + '' : 'Click on a US state');
  };

  infoBox.addTo(map);

  function visualEncoding(properties) {
    var d = properties.density;
    var flightCount = stateMap[stateMap[properties.name]] ? stateMap[stateMap[properties.name]].origin : minOriginCount;
    var d = flightCount;

    if (perCapita) {
      d = flightCount / properties.density;
      d = (d - minPerCapita) / (maxPerCapita - minPerCapita);
    } else {
      d = (d - minOriginCount) / (maxOriginCount - minOriginCount);
    }

    d = d * 100;
    return d > 90 ? '#05446d' : d > 50 ? '#1a5478' : d > 25 ? '#396a89' : d > 15 ? '#4b7793' : d > 8 ? '#6489a1' : d > 3 ? '#7a98ac' : d > 1 ? '#b4c2cc' : '#dadee1';
  }

  function mapStylings(feature) {
    return {
      weight: 1,
      opacity: 1,
      color: 'white',
      dashArray: '3',
      fillOpacity: 0.7,
      fillColor: visualEncoding(feature.properties)
    };
  }

  var mouseOverEVent = function mouseOverEVent(e) {
    var layer = e.target;
    layer.setStyle({
      weight: 1,
      color: '#666',
      dashArray: '',
      fillOpacity: 0.7
    });

    if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
      layer.bringToFront();
    }

    infoBox.update(layer.feature.properties);
  };

  var mouseOutEvent = function mouseOutEvent(e) {
    geoJsonObject.resetStyle(e.target);
    infoBox.update();
  };

  var selected = "";

  var clickEvent = function clickEvent(e) {
    var filteredCollection = filterCollection(e);
    var newSelected = e.target.feature.properties.name;

    if (newSelected == selected) {
      window.vueApp.noneSelected = true;
      window.vueApp.selectedState = "";
      loadPieData({
        features: []
      });
      selected = "";
    } else {
      window.vueApp.noneSelected = false;
      window.vueApp.selectedState = newSelected;
      var filteredCollection = filterCollection(e);
      loadPieData(filteredCollection);
      selected = newSelected;
    }
  };

  var applyEventsToEachState = function applyEventsToEachState(feature, layer) {
    layer.on({
      mouseover: mouseOverEVent,
      mouseout: mouseOutEvent,
      click: clickEvent
    });
  };

  geoJsonObject = L.geoJson(statesData, {
    style: mapStylings,
    onEachFeature: applyEventsToEachState
  }).addTo(map); //End init
}
"use strict";

window.vueApp = new Vue({
  el: '#vue-app',
  data: {
    message: 'Hello user!',
    noneSelected: true,
    selectedState: "",
    playerDetail: {
      name: "<Player Name>"
    },
    overviewFilters: {},
    selectedMap: 1
  },
  mounted: function mounted() {
    loadD3();
  }
});
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImRldGFpbF92aWV3LmpzIiwibWFpbi5qcyIsIm1hcF92aWV3LmpzIiwidnVlX21vZGVsLmpzIl0sIm5hbWVzIjpbImxvYWRQaWVEYXRhIiwiZmlsdGVyZWRDb2xsZWN0aW9uIiwicGllRGF0YSIsImZpbHRlcmVkQ29sbGVjdGlvblRvUGllRGF0YSIsIm1hcCIsIngiLCJ3aW5kb3ciLCJsb2FkUGllIiwicmVzdWx0IiwicGllMSIsInBpZTIiLCJwaWUzIiwiZGVzdGluYXRpb25zIiwiXyIsImNvdW50QnkiLCJmZWF0dXJlcyIsInByb3BlcnRpZXMiLCJkZXN0aW5hdGlvbl9zdGF0ZSIsInN0YXRlIiwib3JpZ2luQ2l0aWVzIiwib3JpZ2luX2NpdHkiLCJpbmRleCIsImRlc3QiLCJwdXNoIiwibGFiZWwiLCJ2YWx1ZSIsImkiLCJjaXR5IiwiaHRtbGlkIiwiZGF0YXMiLCJ1cGRhdGVEYXRhIiwiZGF0YSIsInBvcnRpb24iLCJjYW52YXMiLCJzZWxlY3QiLCJzZWxlY3RBbGwiLCJkb251dCIsImtleSIsImVudGVyIiwiaW5zZXJ0Iiwic3R5bGUiLCJkIiwiY29sb3JWYWx1ZXMiLCJhdHRyIiwib24iLCJjb25zb2xlIiwibG9nIiwiJCIsImNzcyIsInRyYW5zaXRpb24iLCJkdXJhdGlvbiIsImF0dHJUd2VlbiIsIl9jdXJyZW50IiwiaW50ZXJwb2xhdGUiLCJkMyIsInQiLCJkb251dEFyYyIsImV4aXQiLCJyZW1vdmUiLCJ0ZXh0TGluZXMiLCJhcHBlbmQiLCJwb2xhdGlvbkZ1bmN0aW9uIiwiZDIiLCJwb3MiLCJkb251dEJvcmRlciIsImNlbnRyb2lkIiwicmFkaXVzIiwiYXJjQmVuZCIsIk1hdGgiLCJQSSIsInN0YXJ0QW5nbGUiLCJlbmRBbmdsZSIsImxhYmVsVGV4dCIsInRleHQiLCJjZW50cm9pZFBvc2l0aW9uIiwic3R5bGVUd2VlbiIsIndpZHRoIiwiaGVpZ2h0IiwibWluIiwic3ZnIiwiYXJjIiwiaW5uZXJSYWRpdXMiLCJvdXRlclJhZGl1cyIsImxheW91dCIsInBpZSIsInNvcnQiLCJzY2FsZSIsIm9yZGluYWwiLCJyYW5nZSIsImdldERhdGEiLCJtYXhPcmlnaW5Db3VudCIsIm1pbk9yaWdpbkNvdW50IiwibG9hZEQzIiwiY3N2IiwiZXJyb3IiLCJhaXJwb3J0cyIsImFpcnBvcnRzTWFwIiwiY291bnQiLCJJQVRBX0NPREUiLCJmbGlnaHRzIiwic3RhdGVzIiwic3RhdGVNYXAiLCJBYmJyZXZpYXRpb24iLCJTdGF0ZSIsIm9yaWdpbiIsInBvcHVsYXRlU3RhdGVQb3B1bGF0aW9uIiwiZ2V0R2VvSnNvbkNvbGxlY3Rpb24iLCJtYXhWYWwiLCJtaW5WYWwiLCJzdGF0ZXNEYXRhIiwic3RhdGVGZWF0dXJlIiwic3RhdGVOYW1lIiwibmFtZSIsInN0YXRlMSIsIm9yaWdpbkNvdW50IiwicG9wRGVuc2l0eSIsImRlbnNpdHkiLCJtYXgiLCJtYXhQZXJDYXBpdGEiLCJtaW5QZXJDYXBpdGEiLCJpbml0TWFwIiwiaW5pdE1hcDIiLCJmbGlnaHQiLCJzdGF0ZUl0ZW0iLCJkZXN0SXRlbSIsImdlb0pzb25GZWF0dXJlQ29sbGVjdGlvbiIsInR5cGUiLCJwYXJzZUZsb2F0IiwiZ2VvbWV0cnkiLCJjb29yZGluYXRlcyIsIm1hcGJveEFjY2Vzc1Rva2VuIiwibWFwQm94VXJsIiwiZ2VvSnNvbk9iaiIsIkwiLCJzZXRWaWV3Iiwic2VsZWN0ZWQiLCJmbGlnaHRzTGF5ZXIiLCJ0aWxlTGF5ZXIiLCJpZCIsImF0dHJpYnV0aW9uIiwiYWRkVG8iLCJpbmZvQm94IiwiY29udHJvbCIsIm9uQWRkIiwiX2RpdiIsIkRvbVV0aWwiLCJjcmVhdGUiLCJ1cGRhdGUiLCJwcm9wcyIsImZsaWdodENvdW50IiwiaW5uZXJIVE1MIiwibW91c2VPdmVyRXZlbnQiLCJlIiwibGF5ZXIiLCJ0YXJnZXQiLCJzZXRTdHlsZSIsIndlaWdodCIsImNvbG9yIiwiZGFzaEFycmF5IiwiZmlsbE9wYWNpdHkiLCJCcm93c2VyIiwiaWUiLCJvcGVyYSIsImVkZ2UiLCJicmluZ1RvRnJvbnQiLCJmZWF0dXJlIiwibW91c2VPdXRFdmVudCIsInJlc2V0U3R5bGUiLCJjbGlja1N0YXRlIiwicmVtb3ZlTGF5ZXIiLCJvbmVUb01hbnlGbG93bWFwTGF5ZXIiLCJuZXdTZWxlY3RlZCIsInZ1ZUFwcCIsIm5vbmVTZWxlY3RlZCIsInNlbGVjdGVkU3RhdGUiLCJmbGlnaHRzRmxvdyIsImZpbHRlckNvbGxlY3Rpb24iLCJhcHBseUV2ZW50VG9FYWNoU3RhdGUiLCJtb3VzZW92ZXIiLCJtb3VzZW91dCIsImNsaWNrIiwiZ2VvSnNvbiIsIm9uRWFjaEZlYXR1cmUiLCJnZW9EYXRhIiwiY2FudmFzRmxvd21hcExheWVyIiwib3JpZ2luQW5kRGVzdGluYXRpb25GaWVsZElkcyIsIm9yaWdpblVuaXF1ZUlkRmllbGQiLCJvcmlnaW5HZW9tZXRyeSIsInkiLCJkZXN0aW5hdGlvblVuaXF1ZUlkRmllbGQiLCJkZXN0aW5hdGlvbkdlb21ldHJ5IiwicGF0aERpc3BsYXlNb2RlIiwiYW5pbWF0aW9uU3RhcnRlZCIsImFuaW1hdGlvbkVhc2luZ0ZhbWlseSIsImFuaW1hdGlvbkVhc2luZ1R5cGUiLCJhbmltYXRpb25EdXJhdGlvbiIsImZpbHRlcmVkRmVhdHVyZXMiLCJmaWx0ZXIiLCJvcmlnaW5fc3RhdGUiLCJmaWx0ZXJlZCIsInBlckNhcGl0YSIsImdlb0pzb25PYmplY3QiLCJ2aXN1YWxFbmNvZGluZyIsIm1hcFN0eWxpbmdzIiwib3BhY2l0eSIsImZpbGxDb2xvciIsIm1vdXNlT3ZlckVWZW50IiwiY2xpY2tFdmVudCIsImFwcGx5RXZlbnRzVG9FYWNoU3RhdGUiLCJWdWUiLCJlbCIsIm1lc3NhZ2UiLCJwbGF5ZXJEZXRhaWwiLCJvdmVydmlld0ZpbHRlcnMiLCJzZWxlY3RlZE1hcCIsIm1vdW50ZWQiXSwibWFwcGluZ3MiOiI7O0FBRUEsU0FBU0EsV0FBVCxDQUFxQkMsa0JBQXJCLEVBQXdDO0FBQ3BDLE1BQUlDLE9BQU8sR0FBR0MsMkJBQTJCLENBQUNGLGtCQUFELENBQXpDO0FBQ0EsR0FBQyxNQUFELEVBQVMs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QUFRRkMsSUFBQUEsV0FBVyxFQUFFO0FBUlgsR0FGYztBQVlwQkMsRUFBQUEsT0FBTyxFQUFFLG1CQUFVO0FBQ2YzSCxJQUFBQSxNQUFNO0FBQ1Q7QUFkbUIsQ0FBUixDQUFoQiIsImZpbGUiOiJhcHAuanMiLCJzb3VyY2VzQ29udGVudCI6WyJcclxuXHJcbmZ1bmN0aW9uIGxvYWRQaWVEYXRhKGZpbHRlcmVkQ29sbGVjdGlvbil7XHJcbiAgICB2YXIgcGllRGF0YSA9IGZpbHRlcmVkQ29sbGVjdGlvblRvUGllRGF0YShmaWx0ZXJlZENvbGxlY3Rpb24pO1xyXG4gICAgW1wicGllMVwiLCBcInBpZTJcIl0ubWFwKHggPT4ge1xyXG4gICAgICAgIGlmICghd2luZG93W3grXCJ2aXNcIl0pe1xyXG4gICAgICAgICAgICB3aW5kb3dbeCtcInZpc1wiXSA9IGxvYWRQaWUoXCIjY2hhcnQtZGV0YWlsICNcIit4LCBwaWVEYXRhW3hdKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZXtcclxuICAgICAgICAgICAgd2luZG93W3grXCJ2aXNcIl0ocGllRGF0YVt4XSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGZpbHRlcmVkQ29sbGVjdGlvblRvUGllRGF0YShmaWx0ZXJlZENvbGxlY3Rpb24pe1xyXG5cclxuICAgIGxldCByZXN1bHQgPSB7XHJcbiAgICAgICAgcGllMTogW10sXHJcbiAgICAgICAgcGllMjogW10sXHJcbiAgICAgICAgcGllMzogW11cclxuICAgIH07XHJcbiAgICBsZXQgZGVzdGluYXRpb25zID0gXy5jb3VudEJ5KGZpbHRlcmVkQ29sbGVjdGlvbi5mZWF0dXJlcywgeCA9PiB7XHJcblxyXG4gICAgICAgIHJldHVybiAoeC5wcm9wZXJ0aWVzLmRlc3RpbmF0aW9uX3N0YXRlKSA/IHgucHJvcGVydGllcy5kZXN0aW5hdGlvbl9zdGF0ZS5zdGF0ZSA6IFwiTlNBXCI7XHJcbiAgICB9KTtcclxuICAgIGRlbGV0ZSBkZXN0aW5hdGlvbnNbXCJOU0FcIl07XHJcbiAgICBsZXQgb3JpZ2luQ2l0aWVzID0gXy5jb3VudEJ5KGZpbHRlcmVkQ29sbGVjdGlvbi5mZWF0dXJlcywgeCA9PiB7XHJcbiAgICAgICAgcmV0dXJuIHgucHJvcGVydGllcy5vcmlnaW5fY2l0eTtcclxuICAgIH0pO1xyXG4gICAgbGV0IGluZGV4ID0gMDtcclxuICAgIGZvcih2YXIgZGVzdCBpbiBkZXN0aW5hdGlvbnMpe1xyXG4gICAgICAgIGluZGV4Kys7XHJcbiAgICAgICAgcmVzdWx0LnBpZTEucHVzaCgge2xhYmVsOiBkZXN0LCB2YWx1ZTogZGVzdGluYXRpb25zW2Rlc3RdLCBpOiBpbmRleH0pO1xyXG4gICAgfVxyXG4gICAgaW5kZXggPSAwO1xyXG4gICAgZm9yKHZhciBjaXR5IGluIG9yaWdpbkNpdGllcyl7XHJcbiAgICAgICAgaW5kZXgrKztcclxuICAgICAgICByZXN1bHQucGllMi5wdXNoKCB7bGFiZWw6IGNpdHksIHZhbHVlOiBvcmlnaW5DaXRpZXNbY2l0eV0sIGk6IGluZGV4fSk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gcmVzdWx0O1xyXG59O1xyXG5cclxuZnVuY3Rpb24gbG9hZFBpZShodG1saWQsIGRhdGFzKXtcclxuXHJcbiAgICBmdW5jdGlvbiB1cGRhdGVEYXRhKGRhdGEpIHtcclxuXHJcbiAgICAgICAgbGV0IHBvcnRpb24gPSBjYW52YXMuc2VsZWN0KFwiLnNsaWNlc1wiKS5zZWxlY3RBbGwoXCJwYXRoLnNsaWNlXCIpXHJcbiAgICAgICAgICAgIC5kYXRhKGRvbnV0KGRhdGEpLCBrZXkpO1xyXG5cclxuICAgICAgICBwb3J0aW9uLmVudGVyKClcclxuICAgICAgICAgICAgLmluc2VydChcInBhdGhcIilcclxuICAgICAgICAgICAgLnN0eWxlKFwiZmlsbFwiLCBmdW5jdGlvbihkKSB7IHJldHVybiBjb2xvclZhbHVlcyhkLmRhdGEubGFiZWwpOyB9KVxyXG4gICAgICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwic2xpY2VcIilcclxuICAgICAgICAgICAgLm9uKFwibW91c2VvdmVyXCIsIGZ1bmN0aW9uKGQpe1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coZCk7XHJcbiAgICAgICAgICAgICAgICAkKGh0bWxpZCtcIiBzdmcgLmxhYmVscyB0ZXh0XCIpLmNzcyhcIm9wYWNpdHlcIiwgMCk7XHJcbiAgICAgICAgICAgICAgICAkKGh0bWxpZCtcIiBzdmcgLmxhYmVscyAudGV4dC1sYWJlbFwiK2QuZGF0YS5pKS5jc3MoXCJvcGFjaXR5XCIsIDEpO1xyXG4gICAgICAgICAgICAgICAgJChodG1saWQrXCIgc3ZnIC5saW5lcyBwb2x5bGluZVwiKS5jc3MoXCJvcGFjaXR5XCIsIDApO1xyXG4gICAgICAgICAgICAgICAgJChodG1saWQrXCIgc3ZnIC5saW5lcyAucG9seWxpbmVcIitkLmRhdGEuaStcIlwiKS5jc3MoXCJvcGFjaXR5XCIsIDEpO1xyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAub24oXCJtb3VzZW91dFwiLCBmdW5jdGlvbihkKXtcclxuICAgICAgICAgICAgICAgICQoaHRtbGlkK1wiIHN2ZyAubGFiZWxzIHRleHRcIikuY3NzKFwib3BhY2l0eVwiLCAxKTtcclxuICAgICAgICAgICAgICAgICQoaHRtbGlkK1wiIHN2ZyAubGluZXMgcG9seWxpbmVcIikuY3NzKFwib3BhY2l0eVwiLCAxKTtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHBvcnRpb25cclxuICAgICAgICAgICAgLnRyYW5zaXRpb24oKS5kdXJhdGlvbigxMDAwKVxyXG4gICAgICAgICAgICAuYXR0clR3ZWVuKFwiZFwiLCBmdW5jdGlvbihkKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9jdXJyZW50ID0gdGhpcy5fY3VycmVudCB8fCBkO1xyXG4gICAgICAgICAgICAgICAgdmFyIGludGVycG9sYXRlID0gZDMuaW50ZXJwb2xhdGUodGhpcy5fY3VycmVudCwgZCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9jdXJyZW50ID0gaW50ZXJwb2xhdGUoMCk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24odCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBkb251dEFyYyhpbnRlcnBvbGF0ZSh0KSk7XHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgcG9ydGlvbi5leGl0KCkucmVtb3ZlKCk7XHJcblxyXG5cclxuICAgICAgICAoZnVuY3Rpb24oKXtcclxuICAgICAgICAgICAgdmFyIHRleHRMaW5lcyA9IGNhbnZhcy5zZWxlY3QoXCIubGluZXNcIikuc2VsZWN0QWxsKFwicG9seWxpbmVcIilcclxuICAgICAgICAgICAgICAgIC5kYXRhKGRvbnV0KGRhdGEpLCBrZXkpO1xyXG5cclxuICAgICAgICAgICAgdGV4dExpbmVzLmVudGVyKClcclxuICAgICAgICAgICAgICAgIC5hcHBlbmQoXCJwb2x5bGluZVwiKTtcclxuXHJcbiAgICAgICAgICAgIHRleHRMaW5lcy50cmFuc2l0aW9uKCkuZHVyYXRpb24oMTAwMClcclxuICAgICAgICAgICAgICAgIC5hdHRyVHdlZW4oXCJwb2ludHNcIiwgZnVuY3Rpb24oZCl7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fY3VycmVudCA9IHRoaXMuX2N1cnJlbnQgfHwgZDtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgcG9sYXRpb25GdW5jdGlvbiA9IGQzLmludGVycG9sYXRlKHRoaXMuX2N1cnJlbnQsIGQpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2N1cnJlbnQgPSBwb2xhdGlvbkZ1bmN0aW9uKDApO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0ID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGQyID0gcG9sYXRpb25GdW5jdGlvbih0KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHBvcyA9IGRvbnV0Qm9yZGVyLmNlbnRyb2lkKGQyKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcG9zWzBdID0gcmFkaXVzICogMC45NSAqIChhcmNCZW5kKGQyKSA8IE1hdGguUEkgPyAxIDogLTEpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gW2RvbnV0QXJjLmNlbnRyb2lkKGQyKSwgZG9udXRCb3JkZXIuY2VudHJvaWQoZDIpLCBwb3NdO1xyXG4gICAgICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBmdW5jdGlvbihkKXtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gXCJwb2x5bGluZVwiK2QuZGF0YS5pO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICB0ZXh0TGluZXMuZXhpdCgpXHJcbiAgICAgICAgICAgICAgICAucmVtb3ZlKCk7XHJcbiAgICAgICAgfSkoKTtcclxuXHJcbiAgICAgICAgbGV0IGFyY0JlbmQgPSBkID0+IGQuc3RhcnRBbmdsZSArIChkLmVuZEFuZ2xlIC0gZC5zdGFydEFuZ2xlKSAvIDI7XHJcblxyXG4gICAgICAgIChmdW5jdGlvbigpe1xyXG4gICAgICAgICAgICB2YXIgbGFiZWxUZXh0ID0gY2FudmFzLnNlbGVjdChcIi5sYWJlbHNcIikuc2VsZWN0QWxsKFwidGV4dFwiKVxyXG4gICAgICAgICAgICAgICAgLmRhdGEoZG9udXQoZGF0YSksIGtleSk7XHJcblxyXG4gICAgICAgICAgICBsYWJlbFRleHQuZW50ZXIoKS5hcHBlbmQoXCJ0ZXh0XCIpLmF0dHIoXCJkeVwiLCBcIi41NWVtXCIpLnRleHQoZCA9PiBkLmRhdGEubGFiZWwpO1xyXG5cclxuICAgICAgICAgICAgbGFiZWxUZXh0LnRyYW5zaXRpb24oKS5kdXJhdGlvbig4MDApXHJcbiAgICAgICAgICAgICAgICAuYXR0clR3ZWVuKFwidHJhbnNmb3JtXCIsIGZ1bmN0aW9uKGQpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9jdXJyZW50ID0gdGhpcy5fY3VycmVudCB8fCBkO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBwb2xhdGlvbkZ1bmN0aW9uID0gZDMuaW50ZXJwb2xhdGUodGhpcy5fY3VycmVudCwgZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fY3VycmVudCA9IHBvbGF0aW9uRnVuY3Rpb24oMCk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHQgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgZDIgPSBwb2xhdGlvbkZ1bmN0aW9uKHQpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgY2VudHJvaWRQb3NpdGlvbiA9IGRvbnV0Qm9yZGVyLmNlbnRyb2lkKGQyKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2VudHJvaWRQb3NpdGlvblswXSA9IHJhZGl1cyAqIChhcmNCZW5kKGQyKSA8IE1hdGguUEkgPyAxIDogLTEpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gXCJ0cmFuc2xhdGUoXCIrIGNlbnRyb2lkUG9zaXRpb24gK1wiKVwiO1xyXG4gICAgICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBkID0+IFwidGV4dC1sYWJlbFwiICsgZC5kYXRhLmkpXHJcbiAgICAgICAgICAgICAgICAuc3R5bGVUd2VlbihcInRleHQtYW5jaG9yXCIsIGZ1bmN0aW9uKGQpe1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2N1cnJlbnQgPSB0aGlzLl9jdXJyZW50IHx8IGQ7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHBvbGF0aW9uRnVuY3Rpb24gPSBkMy5pbnRlcnBvbGF0ZSh0aGlzLl9jdXJyZW50LCBkKTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9jdXJyZW50ID0gcG9sYXRpb25GdW5jdGlvbigwKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24odCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgZDIgPSBwb2xhdGlvbkZ1bmN0aW9uKHQpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gYXJjQmVuZChkMikgPCBNYXRoLlBJID8gXCJzdGFydFwiOlwiZW5kXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgbGFiZWxUZXh0LmV4aXQoKVxyXG4gICAgICAgICAgICAgICAgLnJlbW92ZSgpO1xyXG4gICAgICAgIH0pKCk7XHJcblxyXG4gICAgfTtcclxuXHJcbiAgICB2YXIgY2FudmFzID0gZDMuc2VsZWN0KGh0bWxpZClcclxuICAgICAgICAuYXBwZW5kKFwic3ZnXCIpXHJcbiAgICAgICAgLmFwcGVuZChcImdcIik7XHJcbiAgICB2YXIgd2lkdGggPSAyNTAsXHJcbiAgICAgICAgaGVpZ2h0ID0gNDAwLFxyXG4gICAgICAgIHJhZGl1cyA9IE1hdGgubWluKHdpZHRoLCBoZWlnaHQpIC8gMjtcclxuXHJcbiAgICBjYW52YXMuYXBwZW5kKFwiZ1wiKVxyXG4gICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJzbGljZXNcIik7XHJcbiAgICBjYW52YXMuYXBwZW5kKFwiZ1wiKVxyXG4gICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJsaW5lc1wiKTtcclxuICAgIGNhbnZhcy5hcHBlbmQoXCJnXCIpXHJcbiAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcImxhYmVsc1wiKTtcclxuXHJcblxyXG4gICAgdmFyIGRvbnV0Qm9yZGVyID0gZDMuc3ZnLmFyYygpLmlubmVyUmFkaXVzKHJhZGl1cykub3V0ZXJSYWRpdXMocmFkaXVzKTtcclxuICAgIHZhciBkb251dEFyYyA9IGQzLnN2Zy5hcmMoKS5vdXRlclJhZGl1cyhyYWRpdXMgKiAwLjgpLmlubmVyUmFkaXVzKHJhZGl1cyAqIDAuMyk7XHJcblxyXG5cclxuXHJcbiAgICB2YXIgZG9udXQgPSBkMy5sYXlvdXQucGllKCkuc29ydChudWxsKS52YWx1ZShkID0+IGQudmFsdWUpO1xyXG5cclxuICAgIHZhciBjb2xvclZhbHVlcyA9IGQzLnNjYWxlLm9yZGluYWwoKVxyXG4gICAgICAgIC5yYW5nZShbXCIjM0Y1MzYwXCIsIFwiI0Q1NzM3M1wiLCBcIiNCQ0NCNTlcIiwgXCIjQzZDNkM2XCIsIFwiI0ZFNEUwMFwiLCBcIiNFOTE5MEZcIiwgXCIjRTY3RjBEXCIsIFwiI0EwQ0VEOVwiLCBcIiNBREY3QjZcIiwgXCIjRkZDMDlGXCIsIFwiI0ZGRUU5M1wiXSk7XHJcblxyXG4gICAgY2FudmFzLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoXCIgKyAyNDAgKyBcIixcIiArIGhlaWdodCAvIDIgKyBcIilcIik7XHJcblxyXG4gICAgdmFyIGtleSA9IGQgPT4gZC5kYXRhLmxhYmVsO1xyXG5cclxuXHJcbiAgICBmdW5jdGlvbiBnZXREYXRhICgpe1xyXG4gICAgICAgIHJldHVybiBkYXRhcztcclxuICAgIH1cclxuXHJcblxyXG5cclxuICAgIHVwZGF0ZURhdGEoZ2V0RGF0YSgpKTtcclxuICAgIHJldHVybiB1cGRhdGVEYXRhO1xyXG59XHJcbiIsIndpbmRvdy5kYXRhID0gbnVsbDtcclxud2luZG93Lm1heE9yaWdpbkNvdW50ID0gMDtcclxud2luZG93Lm1pbk9yaWdpbkNvdW50ID0gMTAwMDA7XHJcbmZ1bmN0aW9uIGxvYWREMygpe1xyXG4gICAgZDMuY3N2KFwiZGF0YS9haXJwb3J0cy5jc3ZcIiwgZnVuY3Rpb24oZXJyb3IsIGFpcnBvcnRzKSB7XHJcbiAgICAgICAgd2luZG93LmFpcnBvcnRzTWFwID0ge307XHJcbiAgICAgICAgdmFyIGNvdW50ID0gMDtcclxuICAgICAgICBhaXJwb3J0cy5tYXAoeCA9PiB7XHJcbiAgICAgICAgICAgIGNvdW50Kys7XHJcbiAgICAgICAgICAgIHdpbmRvdy5haXJwb3J0c01hcFt4LklBVEFfQ09ERV0gPSB4O1xyXG4gICAgICAgICAgICB3aW5kb3cuYWlycG9ydHNNYXBbeC5JQVRBX0NPREVdW1wiaWRcIl0gPSBjb3VudDtcclxuICAgICAgICB9KTtcclxuICAgICAgICBkMy5jc3YoXCJkYXRhL2ZsaWdodHMxLmNzdlwiLCBmdW5jdGlvbihlcnJvciwgZmxpZ2h0cykge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhmbGlnaHRzKTtcclxuICAgICAgICAgICAgd2luZG93LmZsaWdodHMgPSBmbGlnaHRzO1xyXG4gICAgICAgICAgICBkMy5jc3YoXCJkYXRhL3N0YXRlcy5jc3ZcIiwgZnVuY3Rpb24oZXJyb3IsIHN0YXRlcykge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coc3RhdGVzKTtcclxuICAgICAgICAgICAgICAgIHdpbmRvdy5zdGF0ZU1hcCA9IHt9O1xyXG4gICAgICAgICAgICAgICAgc3RhdGVzLm1hcCh4ID0+IHtcclxuICAgICAgICAgICAgICAgICAgICB3aW5kb3cuc3RhdGVNYXBbeC5BYmJyZXZpYXRpb25dID0ge3N0YXRlOnguU3RhdGUsIG9yaWdpbjogMCwgZGVzdDogMH07XHJcbiAgICAgICAgICAgICAgICAgICAgd2luZG93LnN0YXRlTWFwW3guU3RhdGVdID0geC5BYmJyZXZpYXRpb247XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIHBvcHVsYXRlU3RhdGVQb3B1bGF0aW9uKCk7XHJcbiAgICAgICAgICAgICAgICBnZXRHZW9Kc29uQ29sbGVjdGlvbigpO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vR2V0IE1heCwgTWluIFBlciBDYXBpdGEgRmxpZ2h0IEF2YWlsaWJpdHlcclxuICAgICAgICAgICAgICAgIHZhciBtYXhWYWwgPSAwO1xyXG4gICAgICAgICAgICAgICAgdmFyIG1pblZhbCA9IDEwMDA7XHJcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBzdGF0ZUZlYXR1cmUgb2Ygc3RhdGVzRGF0YS5mZWF0dXJlcyl7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHN0YXRlTmFtZSA9IHN0YXRlRmVhdHVyZS5wcm9wZXJ0aWVzLm5hbWU7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHN0YXRlMT0gc3RhdGVNYXBbc3RhdGVNYXBbc3RhdGVOYW1lXV07XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIG9yaWdpbkNvdW50ID0gKHN0YXRlMSk/c3RhdGUxLm9yaWdpbjowO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBwb3BEZW5zaXR5ID0gc3RhdGVGZWF0dXJlLnByb3BlcnRpZXMuZGVuc2l0eTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgdmFsdWUgPSBvcmlnaW5Db3VudC9wb3BEZW5zaXR5O1xyXG4gICAgICAgICAgICAgICAgICAgIG1heFZhbCA9IE1hdGgubWF4KG1heFZhbCwgdmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgICAgIG1pblZhbCA9IE1hdGgubWluKG1pblZhbCwgdmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgd2luZG93Lm1heFBlckNhcGl0YSA9IG1heFZhbDtcclxuICAgICAgICAgICAgICAgIHdpbmRvdy5taW5QZXJDYXBpdGEgPSBtaW5WYWw7XHJcblxyXG5cclxuICAgICAgICAgICAgICAgIGluaXRNYXAoKTtcclxuICAgICAgICAgICAgICAgIGluaXRNYXAyKFwibWFwaWQyXCIpO1xyXG4gICAgICAgICAgICAgICAgaW5pdE1hcDIoXCJtYXBpZDNcIiwgdHJ1ZSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfSk7XHJcbn1cclxuXHJcblxyXG5cclxuZnVuY3Rpb24gcG9wdWxhdGVTdGF0ZVBvcHVsYXRpb24oKXtcclxuICAgIGZvcih2YXIgZmxpZ2h0IG9mIGZsaWdodHMpe1xyXG4gICAgICAgIHZhciBzdGF0ZUl0ZW0gPSBzdGF0ZU1hcFthaXJwb3J0c01hcFtmbGlnaHRbXCJPUklHSU5fQUlSUE9SVFwiXV1bXCJTVEFURVwiXV07XHJcbiAgICAgICAgaWYgKHN0YXRlSXRlbSl7XHJcbiAgICAgICAgICAgIHN0YXRlSXRlbS5vcmlnaW4gKz0gMTtcclxuICAgICAgICAgICAgd2luZG93Lm1heE9yaWdpbkNvdW50ID0gTWF0aC5tYXgobWF4T3JpZ2luQ291bnQsIHN0YXRlSXRlbS5vcmlnaW4pO1xyXG4gICAgICAgICAgICB3aW5kb3cubWluT3JpZ2luQ291bnQgPSBNYXRoLm1pbihtaW5PcmlnaW5Db3VudCwgc3RhdGVJdGVtLm9yaWdpbik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIHZhciBkZXN0SXRlbSA9IHN0YXRlTWFwW2FpcnBvcnRzTWFwW2ZsaWdodFtcIkRFU1RJTkFUSU9OX0FJUlBPUlRcIl1dW1wiU1RBVEVcIl1dO1xyXG4gICAgICAgIGlmIChkZXN0SXRlbSlcclxuICAgICAgICBkZXN0SXRlbS5kZXN0ICs9IDE7XHJcbiAgICB9XHJcbiAgICBjb25zb2xlLmxvZyhzdGF0ZU1hcCk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdldEdlb0pzb25Db2xsZWN0aW9uKCl7XHJcbiAgICB3aW5kb3cuZ2VvSnNvbkZlYXR1cmVDb2xsZWN0aW9uID0ge1xyXG4gICAgICAgIHR5cGU6ICdGZWF0dXJlQ29sbGVjdGlvbicsXHJcbiAgICAgICAgZmVhdHVyZXM6IFtdXHJcbiAgICB9O1xyXG4gICAgZmxpZ2h0cy5tYXAoZnVuY3Rpb24oZmxpZ2h0KSB7XHJcbiAgICAgICAgdmFyIG9yaWdpbiA9IGFpcnBvcnRzTWFwW2ZsaWdodFtcIk9SSUdJTl9BSVJQT1JUXCJdXTtcclxuICAgICAgICB2YXIgZGVzdCA9IGFpcnBvcnRzTWFwW2ZsaWdodFtcIkRFU1RJTkFUSU9OX0FJUlBPUlRcIl1dO1xyXG4gICAgICAgIGlmICghcGFyc2VGbG9hdChvcmlnaW5bXCJMT05HSVRVREVcIl0pIHx8ICFwYXJzZUZsb2F0KG9yaWdpbltcIkxBVElUVURFXCJdKVxyXG4gICAgICAgIHx8ICFwYXJzZUZsb2F0KGRlc3RbXCJMT05HSVRVREVcIl0pIHx8ICFwYXJzZUZsb2F0KGRlc3RbXCJMQVRJVFVERVwiXSkpe1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgZ2VvSnNvbkZlYXR1cmVDb2xsZWN0aW9uLmZlYXR1cmVzLnB1c2goIHtcclxuICAgICAgICB0eXBlOiAnRmVhdHVyZScsXHJcbiAgICAgICAgZ2VvbWV0cnk6IHtcclxuICAgICAgICAgIHR5cGU6ICdQb2ludCcsXHJcbiAgICAgICAgICBjb29yZGluYXRlczogW3BhcnNlRmxvYXQob3JpZ2luW1wiTE9OR0lUVURFXCJdKSxwYXJzZUZsb2F0KG9yaWdpbltcIkxBVElUVURFXCJdKV1cclxuICAgICAgICB9LFxyXG4gICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgXCJvcmlnaW5faWRcIjogb3JpZ2luW1wiaWRcIl0sXHJcbiAgICAgICAgICAgIFwib3JpZ2luX2NpdHlcIjogb3JpZ2luW1wiQ0lUWVwiXSxcclxuICAgICAgICAgICAgXCJvcmlnaW5fc3RhdGVcIjogc3RhdGVNYXBbb3JpZ2luW1wiU1RBVEVcIl1dLFxyXG4gICAgICAgICAgICBcIm9yaWdpbl9jb3VudHJ5XCI6IG9yaWdpbltcIkNPVU5UUllcIl0sXHJcbiAgICAgICAgICAgIFwib3JpZ2luX2xvblwiOiBwYXJzZUZsb2F0KG9yaWdpbltcIkxPTkdJVFVERVwiXSksXHJcbiAgICAgICAgICAgIFwib3JpZ2luX2xhdFwiOiBwYXJzZUZsb2F0KG9yaWdpbltcIkxBVElUVURFXCJdKSxcclxuICAgICAgICAgICAgXCJkZXN0aW5hdGlvbl9pZFwiOiBkZXN0W1wiaWRcIl0sXHJcbiAgICAgICAgICAgIFwiZGVzdGluYXRpb25fY2l0eVwiOiBkZXN0W1wiQ0lUWVwiXSxcclxuICAgICAgICAgICAgXCJkZXN0aW5hdGlvbl9zdGF0ZVwiOiBzdGF0ZU1hcFtkZXN0W1wiU1RBVEVcIl1dLFxyXG4gICAgICAgICAgICBcImRlc3RpbmF0aW9uX2NvdW50cnlcIjogZGVzdFtcIkNPVU5UUllcIl0sXHJcbiAgICAgICAgICAgIFwiZGVzdGluYXRpb25fbG9uXCI6IHBhcnNlRmxvYXQoZGVzdFtcIkxPTkdJVFVERVwiXSksXHJcbiAgICAgICAgICAgIFwiZGVzdGluYXRpb25fbGF0XCI6IHBhcnNlRmxvYXQoZGVzdFtcIkxBVElUVURFXCJdKVxyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcbiAgICB9KVxyXG59IiwidmFyIG1hcGJveEFjY2Vzc1Rva2VuID0gXCJway5leUoxSWpvaWMzZGhjM1JwYTNKdmVTSXNJbUVpT2lKamFtNHlZamhyYzJnMGRUVmtNM0J4WTNVM2JXSXlPV1puSW4wLmgwTEI1cUlfaFBPMm1yRkdfOHpHM0FcIjtcclxuLy8gdmFyIE1CX0FUVFIgPSAnTWFwIGRhdGEgJmNvcHk7IDxhIGhyZWY9XCJodHRwczovL3d3dy5vcGVuc3RyZWV0bWFwLm9yZy9cIj5PcGVuU3RyZWV0TWFwPC9hPiBjb250cmlidXRvcnMsICcgK1xyXG4vLyBcdFx0XHQnPGEgaHJlZj1cImh0dHBzOi8vY3JlYXRpdmVjb21tb25zLm9yZy9saWNlbnNlcy9ieS1zYS8yLjAvXCI+Q0MtQlktU0E8L2E+LCAnICtcclxuLy8gXHRcdFx0J0ltYWdlcnkgwqkgPGEgaHJlZj1cImh0dHBzOi8vd3d3Lm1hcGJveC5jb20vXCI+TWFwYm94PC9hPic7XHJcbnZhciBtYXBCb3hVcmwgPSAnaHR0cHM6Ly9hcGkudGlsZXMubWFwYm94LmNvbS92NC97aWR9L3t6fS97eH0ve3l9LnBuZz9hY2Nlc3NfdG9rZW49JyArIG1hcGJveEFjY2Vzc1Rva2VuO1xyXG5cclxuZnVuY3Rpb24gaW5pdE1hcCgpe1xyXG5cclxuXHJcblxyXG4gICAgdmFyIGdlb0pzb25PYmo7XHJcblxyXG4gICAgdmFyIG1hcCA9IEwubWFwKCdtYXBpZCcpLnNldFZpZXcoWzM3LjgsIC05Nl0sIDQpO1xyXG4gICAgdmFyIHNlbGVjdGVkID0gXCJcIjtcclxuXHJcblxyXG4gICAgdmFyIGZsaWdodHNMYXllcj0gTC50aWxlTGF5ZXIobWFwQm94VXJsLCB7XHJcbiAgICAgICAgaWQ6ICdtYXBib3gubGlnaHQnLFxyXG4gICAgICAgIGF0dHJpYnV0aW9uOiBcIlwiXHJcbiAgICB9KS5hZGRUbyhtYXApO1xyXG4gICAgZmxpZ2h0c0xheWVyLmFkZFRvKG1hcCk7XHJcblxyXG5cclxuXHJcbiAgICAvLyBjb250cm9sIHRoYXQgc2hvd3Mgc3RhdGUgaW5mbyBvbiBob3ZlclxyXG4gICAgdmFyIGluZm9Cb3ggPSBMLmNvbnRyb2woKTtcclxuXHJcbiAgICBpbmZvQm94Lm9uQWRkID0gZnVuY3Rpb24gKG1hcCkge1xyXG4gICAgICAgIHRoaXMuX2RpdiA9IEwuRG9tVXRpbC5jcmVhdGUoJ2RpdicsICdpbmZvJyk7XHJcbiAgICAgICAgdGhpcy51cGRhdGUoKTtcclxuICAgICAgICByZXR1cm4gdGhpcy5fZGl2O1xyXG4gICAgfTtcclxuXHJcbiAgICBpbmZvQm94LnVwZGF0ZSA9IGZ1bmN0aW9uIChwcm9wcykge1xyXG4gICAgICAgIHZhciBmbGlnaHRDb3VudCA9IChwcm9wcyk/KHN0YXRlTWFwW3N0YXRlTWFwW3Byb3BzLm5hbWVdXSk/c3RhdGVNYXBbc3RhdGVNYXBbcHJvcHMubmFtZV1dLm9yaWdpbjpcIk5vdCBBdmFpbGFibGVcIjpcIk5vdCBBdmFpbGFibGVcIjtcclxuICAgICAgICBcclxuICAgICAgICB0aGlzLl9kaXYuaW5uZXJIVE1MID0gJzxoND5GbGlnaHRzIGF2YWlsYWJpbGl0eTwvaDQ+JyArICAocHJvcHMgP1xyXG4gICAgICAgICAgICAnPGI+JyArIHByb3BzLm5hbWUgKyAnPC9iPjxiciAvPicgKyBmbGlnaHRDb3VudCArICcgZmxpZ2h0cydcclxuICAgICAgICAgICAgOiAnQ2xpY2sgb24gYSBVUyBzdGF0ZScpO1xyXG4gICAgfTtcclxuXHJcbiAgICBpbmZvQm94LmFkZFRvKG1hcCk7XHJcblxyXG4gICAgZnVuY3Rpb24gbW91c2VPdmVyRXZlbnQoZSkge1xyXG4gICAgICAgIHZhciBsYXllciA9IGUudGFyZ2V0O1xyXG5cclxuICAgICAgICBsYXllci5zZXRTdHlsZSh7XHJcbiAgICAgICAgICAgIHdlaWdodDogMSxcclxuICAgICAgICAgICAgY29sb3I6ICcjNjY2JyxcclxuICAgICAgICAgICAgZGFzaEFycmF5OiAnJyxcclxuICAgICAgICAgICAgZmlsbE9wYWNpdHk6IDAuN1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBpZiAoIUwuQnJvd3Nlci5pZSAmJiAhTC5Ccm93c2VyLm9wZXJhICYmICFMLkJyb3dzZXIuZWRnZSkge1xyXG4gICAgICAgICAgICBsYXllci5icmluZ1RvRnJvbnQoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGluZm9Cb3gudXBkYXRlKGxheWVyLmZlYXR1cmUucHJvcGVydGllcyk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gbW91c2VPdXRFdmVudChlKSB7XHJcbiAgICAgICAgZ2VvSnNvbk9iai5yZXNldFN0eWxlKGUudGFyZ2V0KTtcclxuICAgICAgICBpbmZvQm94LnVwZGF0ZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGNsaWNrU3RhdGUoZSkge1xyXG4gICAgICAgIG1hcC5yZW1vdmVMYXllcihvbmVUb01hbnlGbG93bWFwTGF5ZXIpO1xyXG4gICAgICAgIHZhciBuZXdTZWxlY3RlZCA9IGUudGFyZ2V0LmZlYXR1cmUucHJvcGVydGllcy5uYW1lO1xyXG4gICAgICAgIGlmKG5ld1NlbGVjdGVkID09IHNlbGVjdGVkKXtcclxuICAgICAgICAgICAgd2luZG93LnZ1ZUFwcC5ub25lU2VsZWN0ZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICB3aW5kb3cudnVlQXBwLnNlbGVjdGVkU3RhdGUgPSBcIlwiO1xyXG4gICAgICAgICAgICBmbGlnaHRzRmxvdyhnZW9Kc29uRmVhdHVyZUNvbGxlY3Rpb24pO1xyXG4gICAgICAgICAgICBsb2FkUGllRGF0YSh7ZmVhdHVyZXM6IFtdfSk7XHJcbiAgICAgICAgICAgIHNlbGVjdGVkID0gXCJcIjtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZXtcclxuICAgICAgICAgICAgd2luZG93LnZ1ZUFwcC5ub25lU2VsZWN0ZWQgPSBmYWxzZTtcclxuICAgICAgICAgICAgd2luZG93LnZ1ZUFwcC5zZWxlY3RlZFN0YXRlID0gbmV3U2VsZWN0ZWQ7XHJcbiAgICAgICAgICAgIHZhciBmaWx0ZXJlZENvbGxlY3Rpb24gPSBmaWx0ZXJDb2xsZWN0aW9uKGUpO1xyXG4gICAgICAgICAgICBmbGlnaHRzRmxvdyhmaWx0ZXJlZENvbGxlY3Rpb24pO1xyXG4gICAgICAgICAgICBsb2FkUGllRGF0YShmaWx0ZXJlZENvbGxlY3Rpb24pO1xyXG4gICAgICAgICAgICBzZWxlY3RlZCA9IG5ld1NlbGVjdGVkO1xyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICBcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBhcHBseUV2ZW50VG9FYWNoU3RhdGUoZmVhdHVyZSwgbGF5ZXIpIHtcclxuICAgICAgICBsYXllci5vbih7XHJcbiAgICAgICAgICAgIG1vdXNlb3ZlcjogbW91c2VPdmVyRXZlbnQsXHJcbiAgICAgICAgICAgIG1vdXNlb3V0OiBtb3VzZU91dEV2ZW50LFxyXG4gICAgICAgICAgICBjbGljazogY2xpY2tTdGF0ZVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGdlb0pzb25PYmogPSBMLmdlb0pzb24oc3RhdGVzRGF0YSwge1xyXG4gICAgICAgIG9uRWFjaEZlYXR1cmU6IGFwcGx5RXZlbnRUb0VhY2hTdGF0ZVxyXG4gICAgfSkuYWRkVG8obWFwKTtcclxuXHJcblxyXG4gICAgZmxpZ2h0c0Zsb3coZ2VvSnNvbkZlYXR1cmVDb2xsZWN0aW9uKTtcclxuICAgIGZ1bmN0aW9uIGZsaWdodHNGbG93KGdlb0RhdGEpe1xyXG4gICAgd2luZG93Lm9uZVRvTWFueUZsb3dtYXBMYXllciA9IEwuY2FudmFzRmxvd21hcExheWVyKGdlb0RhdGEsIHtcclxuICAgICAgICAgICAgb3JpZ2luQW5kRGVzdGluYXRpb25GaWVsZElkczoge1xyXG4gICAgICAgICAgICBvcmlnaW5VbmlxdWVJZEZpZWxkOiAnb3JpZ2luX2lkJyxcclxuICAgICAgICAgICAgb3JpZ2luR2VvbWV0cnk6IHtcclxuICAgICAgICAgICAgICAgIHg6ICdvcmlnaW5fbG9uJyxcclxuICAgICAgICAgICAgICAgIHk6ICdvcmlnaW5fbGF0J1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBkZXN0aW5hdGlvblVuaXF1ZUlkRmllbGQ6ICdkZXN0aW5hdGlvbl9pZCcsXHJcbiAgICAgICAgICAgIGRlc3RpbmF0aW9uR2VvbWV0cnk6IHtcclxuICAgICAgICAgICAgICAgIHg6ICdkZXN0aW5hdGlvbl9sb24nLFxyXG4gICAgICAgICAgICAgICAgeTogJ2Rlc3RpbmF0aW9uX2xhdCdcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBwYXRoRGlzcGxheU1vZGU6ICdhbGwnLFxyXG4gICAgICAgICAgICBhbmltYXRpb25TdGFydGVkOiB0cnVlLFxyXG4gICAgICAgICAgICBhbmltYXRpb25FYXNpbmdGYW1pbHk6ICdDdWJpYycsXHJcbiAgICAgICAgICAgIGFuaW1hdGlvbkVhc2luZ1R5cGU6ICdJbicsXHJcbiAgICAgICAgICAgIGFuaW1hdGlvbkR1cmF0aW9uOiAyMDAwXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgd2luZG93Lm9uZVRvTWFueUZsb3dtYXBMYXllci5hZGRUbyhtYXApO1xyXG4gICAgfVxyXG4gIC8vRW5kIGluaXRcclxufVxyXG5cclxuZnVuY3Rpb24gZmlsdGVyQ29sbGVjdGlvbihlKXtcclxuICAgIHZhciBzdGF0ZU5hbWUgPSBlLnRhcmdldC5mZWF0dXJlLnByb3BlcnRpZXMubmFtZTtcclxuICAgIHZhciBmaWx0ZXJlZEZlYXR1cmVzID0gWy4uLmdlb0pzb25GZWF0dXJlQ29sbGVjdGlvbi5mZWF0dXJlc10uZmlsdGVyKHg9PiB7XHJcbiAgICAgICAgcmV0dXJuICh4LnByb3BlcnRpZXMub3JpZ2luX3N0YXRlICYmIHgucHJvcGVydGllcy5vcmlnaW5fc3RhdGUuc3RhdGUgPT0gc3RhdGVOYW1lKTtcclxuICAgIH0pO1xyXG4gICAgbGV0IGZpbHRlcmVkID0ge1xyXG4gICAgICAgIC4uLmdlb0pzb25GZWF0dXJlQ29sbGVjdGlvbixcclxuICAgICAgICBmZWF0dXJlczogZmlsdGVyZWRGZWF0dXJlc1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGZpbHRlcmVkO1xyXG59XHJcblxyXG5cclxuXHJcbmZ1bmN0aW9uIGluaXRNYXAyKGh0bWxpZCwgcGVyQ2FwaXRhKXtcclxuICAgIHZhciBnZW9Kc29uT2JqZWN0O1xyXG4gICAgdmFyIG1hcCA9IEwubWFwKGh0bWxpZCkuc2V0VmlldyhbMzcuOCwgLTk2XSwgNCk7XHJcbiAgICB2YXIgZmxpZ2h0c0xheWVyPSBMLnRpbGVMYXllcihtYXBCb3hVcmwsIHtcclxuICAgICAgICBpZDogJ21hcGJveC5saWdodCcsXHJcbiAgICAgICAgYXR0cmlidXRpb246IFwiXCJcclxuICAgIH0pLmFkZFRvKG1hcCk7XHJcbiAgICBmbGlnaHRzTGF5ZXIuYWRkVG8obWFwKTtcclxuICAgIHZhciBpbmZvQm94ID0gTC5jb250cm9sKCk7XHJcblxyXG4gICAgaW5mb0JveC5vbkFkZCA9IGZ1bmN0aW9uIChtYXApIHtcclxuICAgICAgICB0aGlzLl9kaXYgPSBMLkRvbVV0aWwuY3JlYXRlKCdkaXYnLCAnaW5mbycpO1xyXG4gICAgICAgIHRoaXMudXBkYXRlKCk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2RpdjtcclxuICAgIH07XHJcblxyXG4gICAgaW5mb0JveC51cGRhdGUgPSBmdW5jdGlvbiAocHJvcHMpIHtcclxuICAgICAgICB2YXIgZmxpZ2h0Q291bnQgPSAocHJvcHMpPyhzdGF0ZU1hcFtzdGF0ZU1hcFtwcm9wcy5uYW1lXV0pP3N0YXRlTWFwW3N0YXRlTWFwW3Byb3BzLm5hbWVdXS5vcmlnaW46XCJOb3QgQXZhaWxhYmxlXCI6XCJOb3QgQXZhaWxhYmxlXCI7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdGhpcy5fZGl2LmlubmVySFRNTCA9ICc8aDQ+RmxpZ2h0cyBhdmFpbGFiaWxpdHk8L2g0PicgKyAgKHByb3BzID9cclxuICAgICAgICAgICAgKChwZXJDYXBpdGEpPygnPGI+JyArIHByb3BzLm5hbWUgKyAnPC9iPihQb3B1bGF0aW9uIERlbnNpdHkpPGJyIC8+JyArIHByb3BzLmRlbnNpdHkgKyAnIHBlb3BsZSAvIG1pPHN1cD4yPC9zdXA+PGJyIC8+Jyk6JycpXHJcbiAgICAgICAgICAgICsnPGI+RmxpZ2h0czwvYj48YnIgLz4nICsgZmxpZ2h0Q291bnQgKyAnJ1xyXG4gICAgICAgICAgICA6ICdDbGljayBvbiBhIFVTIHN0YXRlJyk7XHJcbiAgICB9O1xyXG5cclxuICAgIGluZm9Cb3guYWRkVG8obWFwKTtcclxuXHJcblxyXG4gICAgZnVuY3Rpb24gdmlzdWFsRW5jb2RpbmcocHJvcGVydGllcykge1xyXG4gICAgICAgIHZhciBkID0gcHJvcGVydGllcy5kZW5zaXR5O1xyXG4gICAgICAgIHZhciBmbGlnaHRDb3VudCA9IChzdGF0ZU1hcFtzdGF0ZU1hcFtwcm9wZXJ0aWVzLm5hbWVdXSk/c3RhdGVNYXBbc3RhdGVNYXBbcHJvcGVydGllcy5uYW1lXV0ub3JpZ2luOm1pbk9yaWdpbkNvdW50O1xyXG4gICAgICAgIHZhciBkID0gZmxpZ2h0Q291bnQ7XHJcbiAgICAgICAgaWYocGVyQ2FwaXRhKXtcclxuICAgICAgICAgICAgZCA9IGZsaWdodENvdW50L3Byb3BlcnRpZXMuZGVuc2l0eTtcclxuICAgICAgICAgICAgZCA9IChkLW1pblBlckNhcGl0YSkvKG1heFBlckNhcGl0YSAtIG1pblBlckNhcGl0YSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2V7XHJcbiAgICAgICAgICAgIGQgPSAoZC1taW5PcmlnaW5Db3VudCkvKG1heE9yaWdpbkNvdW50IC0gbWluT3JpZ2luQ291bnQpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBkID0gZCAqIDEwMDtcclxuICAgICAgICByZXR1cm4gZCA+IDkwID8gJyMwNTQ0NmQnIDpcclxuICAgICAgICAgICAgICAgIGQgPiA1MCAgPyAnIzFhNTQ3OCcgOlxyXG4gICAgICAgICAgICAgICAgZCA+IDI1ICA/ICcjMzk2YTg5JyA6XHJcbiAgICAgICAgICAgICAgICBkID4gMTUgID8gJyM0Yjc3OTMnIDpcclxuICAgICAgICAgICAgICAgIGQgPiA4ICAgPyAnIzY0ODlhMScgOlxyXG4gICAgICAgICAgICAgICAgZCA+IDMgICA/ICcjN2E5OGFjJyA6XHJcbiAgICAgICAgICAgICAgICBkID4gMSAgID8gJyNiNGMyY2MnIDpcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICcjZGFkZWUxJztcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBtYXBTdHlsaW5ncyhmZWF0dXJlKSB7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgd2VpZ2h0OiAxLFxyXG4gICAgICAgICAgICBvcGFjaXR5OiAxLFxyXG4gICAgICAgICAgICBjb2xvcjogJ3doaXRlJyxcclxuICAgICAgICAgICAgZGFzaEFycmF5OiAnMycsXHJcbiAgICAgICAgICAgIGZpbGxPcGFjaXR5OiAwLjcsXHJcbiAgICAgICAgICAgIGZpbGxDb2xvcjogdmlzdWFsRW5jb2RpbmcoZmVhdHVyZS5wcm9wZXJ0aWVzKVxyXG4gICAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgbGV0IG1vdXNlT3ZlckVWZW50ID0gZnVuY3Rpb24oZSkge1xyXG4gICAgICAgIHZhciBsYXllciA9IGUudGFyZ2V0O1xyXG5cclxuICAgICAgICBsYXllci5zZXRTdHlsZSh7XHJcbiAgICAgICAgICAgIHdlaWdodDogMSxcclxuICAgICAgICAgICAgY29sb3I6ICcjNjY2JyxcclxuICAgICAgICAgICAgZGFzaEFycmF5OiAnJyxcclxuICAgICAgICAgICAgZmlsbE9wYWNpdHk6IDAuN1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBpZiAoIUwuQnJvd3Nlci5pZSAmJiAhTC5Ccm93c2VyLm9wZXJhICYmICFMLkJyb3dzZXIuZWRnZSkge1xyXG4gICAgICAgICAgICBsYXllci5icmluZ1RvRnJvbnQoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGluZm9Cb3gudXBkYXRlKGxheWVyLmZlYXR1cmUucHJvcGVydGllcyk7XHJcbiAgICB9XHJcblxyXG5cclxuICAgIGxldCBtb3VzZU91dEV2ZW50ID0gZnVuY3Rpb24oZSkge1xyXG4gICAgICAgIGdlb0pzb25PYmplY3QucmVzZXRTdHlsZShlLnRhcmdldCk7XHJcbiAgICAgICAgaW5mb0JveC51cGRhdGUoKTtcclxuICAgIH07XHJcbiAgICB2YXIgc2VsZWN0ZWQgPSBcIlwiO1xyXG4gICAgbGV0IGNsaWNrRXZlbnQgPSBmdW5jdGlvbihlKSB7XHJcbiAgICAgICAgdmFyIGZpbHRlcmVkQ29sbGVjdGlvbiA9IGZpbHRlckNvbGxlY3Rpb24oZSk7XHJcbiAgICAgICAgdmFyIG5ld1NlbGVjdGVkID0gZS50YXJnZXQuZmVhdHVyZS5wcm9wZXJ0aWVzLm5hbWU7XHJcbiAgICAgICAgaWYobmV3U2VsZWN0ZWQgPT0gc2VsZWN0ZWQpe1xyXG4gICAgICAgICAgICB3aW5kb3cudnVlQXBwLm5vbmVTZWxlY3RlZCA9IHRydWU7XHJcbiAgICAgICAgICAgIHdpbmRvdy52dWVBcHAuc2VsZWN0ZWRTdGF0ZSA9IFwiXCI7XHJcbiAgICAgICAgICAgIGxvYWRQaWVEYXRhKHtmZWF0dXJlczogW119KTtcclxuICAgICAgICAgICAgc2VsZWN0ZWQgPSBcIlwiO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNle1xyXG4gICAgICAgICAgICB3aW5kb3cudnVlQXBwLm5vbmVTZWxlY3RlZCA9IGZhbHNlO1xyXG4gICAgICAgICAgICB3aW5kb3cudnVlQXBwLnNlbGVjdGVkU3RhdGUgPSBuZXdTZWxlY3RlZDtcclxuICAgICAgICAgICAgdmFyIGZpbHRlcmVkQ29sbGVjdGlvbiA9IGZpbHRlckNvbGxlY3Rpb24oZSk7XHJcbiAgICAgICAgICAgIGxvYWRQaWVEYXRhKGZpbHRlcmVkQ29sbGVjdGlvbik7XHJcbiAgICAgICAgICAgIHNlbGVjdGVkID0gbmV3U2VsZWN0ZWQ7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgfTtcclxuICAgXHJcblxyXG4gICAgbGV0IGFwcGx5RXZlbnRzVG9FYWNoU3RhdGUgPSBmdW5jdGlvbiAoZmVhdHVyZSwgbGF5ZXIpIHtcclxuICAgICAgICBsYXllci5vbih7XHJcbiAgICAgICAgICAgIG1vdXNlb3ZlcjogbW91c2VPdmVyRVZlbnQsXHJcbiAgICAgICAgICAgIG1vdXNlb3V0OiBtb3VzZU91dEV2ZW50LFxyXG4gICAgICAgICAgICBjbGljazogY2xpY2tFdmVudFxyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICBnZW9Kc29uT2JqZWN0ID0gTC5nZW9Kc29uKHN0YXRlc0RhdGEsIHtcclxuICAgICAgICBzdHlsZTogbWFwU3R5bGluZ3MsXHJcbiAgICAgICAgb25FYWNoRmVhdHVyZTogYXBwbHlFdmVudHNUb0VhY2hTdGF0ZVxyXG4gICAgfSkuYWRkVG8obWFwKTtcclxuICAvL0VuZCBpbml0XHJcbn0iLCJ3aW5kb3cudnVlQXBwID0gbmV3IFZ1ZSh7XHJcbiAgICBlbDogJyN2dWUtYXBwJyxcclxuICAgIGRhdGE6IHtcclxuICAgICAgICBtZXNzYWdlOiAnSGVsbG8gdXNlciEnLFxyXG4gICAgICAgIG5vbmVTZWxlY3RlZDogdHJ1ZSxcclxuICAgICAgICBzZWxlY3RlZFN0YXRlOiBcIlwiLFxyXG4gICAgICAgIHBsYXllckRldGFpbDoge1xyXG4gICAgICAgICAgICBuYW1lOiBcIjxQbGF5ZXIgTmFtZT5cIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgb3ZlcnZpZXdGaWx0ZXJzOiB7fSxcclxuICAgICAgICBzZWxlY3RlZE1hcDogMVxyXG4gICAgfSxcclxuICAgIG1vdW50ZWQ6IGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgbG9hZEQzKCk7XHJcbiAgICB9XHJcbn0pOyJdfQ==
