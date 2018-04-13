

var $GL = (function(root) {


/*
 * 
 * 
 * 
 */

root.CharacGraph = function (placeholder, config, plots){
    this.initialized = false;
    this.placeholder = placeholder;
    this.plot=null;
    this.duration = root.getOpts(config, "duration", 1);
    this.xaxis = root.getOpts(config, "xaxis", {});
    this.yaxis = root.getOpts(config, "yaxis", {});
    this.legend = root.getOpts(config, "legend", {});
    this.xmin = root.getOpts(config, "xmin", null);  // definit une serie de points suivant les abscisses : valeur min
    this.xmax = root.getOpts(config, "xmax", null);  // valeur max
    this.xnum = root.getOpts(config, "xnum", null);  // nombre de points
    this.plots = plots;
    this.series = [];
    this.plot_options={
    grid: {
      borderWidth: 1,
      minBorderMargin: 10,
      labelMargin: 5,
      backgroundColor: {
        colors: ["#fff", "#e4f4f4"],
      },
      margin: {
        top: 5,
        bottom: 5,
        left: 5
      },
    },
    xaxis: this.xaxis,
    yaxis: this.yaxis,
    legend: this.legend,
    };
    this._init();
}

root.CharacGraph.prototype = {
    _init: function() {
        this.nplots = this.plots.length;
        this.series = [];
        var series = [];
        for (var i = 0 ; i < this.nplots ; i++) {
            var elem = {
                lines: {fill:false},
                points: {show:false},
                data: [],
            };
            root.copyObjectFields(this.plots[i], elem, ["color", "label", "lines", "points", "data"]);
            this.series.push(elem);
        }
        this.plot = $.plot(this.placeholder, this.series, this.plot_options);
    },
    add_series:function(i, s) {  // add a point series to graph i
        // format : s=[ [x1, y1], [x2, y2],...]
        this.series[i].data=s;
    },
    update:function() {
        this.plot.setData(this.series);
        this.plot.setupGrid();
        this.plot.draw();
    }
}
    
 
return root;
}) ($GL || {});