

function loadPieData(filteredCollection){
    var pieData = filteredCollectionToPieData(filteredCollection);
    ["pie1", "pie2"].map(x => {
        if (!window[x+"vis"]){
            window[x+"vis"] = loadPie("#chart-detail #"+x, pieData[x]);
        }
        else{
            window[x+"vis"](pieData[x]);
        }
    });
}

function filteredCollectionToPieData(filteredCollection){

    let result = {
        pie1: [],
        pie2: [],
        pie3: []
    };
    let destinations = _.countBy(filteredCollection.features, x => {

        return (x.properties.destination_state) ? x.properties.destination_state.state : "NSA";
    });
    delete destinations["NSA"];
    let originCities = _.countBy(filteredCollection.features, x => {
        return x.properties.origin_city;
    });
    let index = 0;
    for(var dest in destinations){
        index++;
        result.pie1.push( {label: dest, value: destinations[dest], i: index});
    }
    index = 0;
    for(var city in originCities){
        index++;
        result.pie2.push( {label: city, value: originCities[city], i: index});
    }
    return result;
};

function loadPie(htmlid, datas){

    function updateData(data) {

        let portion = canvas.select(".slices").selectAll("path.slice")
            .data(donut(data), key);

        portion.enter()
            .insert("path")
            .style("fill", function(d) { return colorValues(d.data.label); })
            .attr("class", "slice")
            .on("mouseover", function(d){
                console.log(d);
                $(htmlid+" svg .labels text").css("opacity", 0);
                $(htmlid+" svg .labels .text-label"+d.data.i).css("opacity", 1);
                $(htmlid+" svg .lines polyline").css("opacity", 0);
                $(htmlid+" svg .lines .polyline"+d.data.i+"").css("opacity", 1);
            })
            .on("mouseout", function(d){
                $(htmlid+" svg .labels text").css("opacity", 1);
                $(htmlid+" svg .lines polyline").css("opacity", 1);
            });

        portion
            .transition().duration(1000)
            .attrTween("d", function(d) {
                this._current = this._current || d;
                var interpolate = d3.interpolate(this._current, d);
                this._current = interpolate(0);
                return function(t) {
                    return donutArc(interpolate(t));
                };
            });

        portion.exit().remove();


        (function(){
            var textLines = canvas.select(".lines").selectAll("polyline")
                .data(donut(data), key);

            textLines.enter()
                .append("polyline");

            textLines.transition().duration(1000)
                .attrTween("points", function(d){
                    this._current = this._current || d;
                    var polationFunction = d3.interpolate(this._current, d);
                    this._current = polationFunction(0);
                    return t => {
                        var d2 = polationFunction(t);
                        var pos = donutBorder.centroid(d2);
                        pos[0] = radius * 0.95 * (arcBend(d2) < Math.PI ? 1 : -1);
                        return [donutArc.centroid(d2), donutBorder.centroid(d2), pos];
                    };
                })
                .attr("class", function(d){
                    return "polyline"+d.data.i;
                });

            textLines.exit()
                .remove();
        })();

        let arcBend = d => d.startAngle + (d.endAngle - d.startAngle) / 2;

        (function(){
            var labelText = canvas.select(".labels").selectAll("text")
                .data(donut(data), key);

            labelText.enter().append("text").attr("dy", ".55em").text(d => d.data.label);

            labelText.transition().duration(800)
                .attrTween("transform", function(d) {
                    this._current = this._current || d;
                    var polationFunction = d3.interpolate(this._current, d);
                    this._current = polationFunction(0);
                    return t => {
                        var d2 = polationFunction(t);
                        var centroidPosition = donutBorder.centroid(d2);
                        centroidPosition[0] = radius * (arcBend(d2) < Math.PI ? 1 : -1);
                        return "translate("+ centroidPosition +")";
                    };
                })
                .attr("class", d => "text-label" + d.data.i)
                .styleTween("text-anchor", function(d){
                    this._current = this._current || d;
                    var polationFunction = d3.interpolate(this._current, d);
                    this._current = polationFunction(0);
                    return function(t) {
                        var d2 = polationFunction(t);
                        return arcBend(d2) < Math.PI ? "start":"end";
                    };
                });

            labelText.exit()
                .remove();
        })();

    };

    var canvas = d3.select(htmlid)
        .append("svg")
        .append("g");
    var width = 250,
        height = 400,
        radius = Math.min(width, height) / 2;

    canvas.append("g")
        .attr("class", "slices");
    canvas.append("g")
        .attr("class", "lines");
    canvas.append("g")
        .attr("class", "labels");


    var donutBorder = d3.svg.arc().innerRadius(radius).outerRadius(radius);
    var donutArc = d3.svg.arc().outerRadius(radius * 0.8).innerRadius(radius * 0.3);



    var donut = d3.layout.pie().sort(null).value(d => d.value);

    var colorValues = d3.scale.ordinal()
        .range(["#3F5360", "#D57373", "#BCCB59", "#C6C6C6", "#FE4E00", "#E9190F", "#E67F0D", "#A0CED9", "#ADF7B6", "#FFC09F", "#FFEE93"]);

    canvas.attr("transform", "translate(" + 240 + "," + height / 2 + ")");

    var key = d => d.data.label;


    function getData (){
        return datas;
    }



    updateData(getData());
    return updateData;
}
