

var $GL = (function(root) {


/*
 * 
 * 
 * 
 */

root.CarGraph = function (placeholder, config, plots){
    this.initialized = false;
    this.placeholder = placeholder;
    this.plot=null;
    this.xaxis = $GL.getOpts(config, "xaxis", {});
    this.yaxis = $GL.getOpts(config, "yaxis", {});
    this.legend = $GL.getOpts(config, "legend", {});
    var interactive = $GL.getOpts(config, "interactive", false);  // if can pan
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
    pan:{interactive:interactive},
    };
    this._init();
}

root.CarGraph.prototype = {
    _init: function() {
        this.nplots = this.plots.length;
        this.series = [];
        var series = [];
        for (var i = 0 ; i < this.nplots ; i++) {
            var elem = {
                lines: {fill:false, show:true},
                points: {show:false},
                data: [],
            };
            $GL.copyObjectFields(this.plots[i], elem, ["color", "label", "lines", "points", "data"]);
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

}) (this); // End of the "Immediately-Invoked Function Expression" (IIFE)

    
 
return root;
}) ($GL || {});
