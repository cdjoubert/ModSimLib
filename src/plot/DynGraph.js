

var $GL = (function(root) {

/* Dynamic graph
 * Dynamic or Live chart that changes with time
 * 
 */
    
// See also : https://github.com/flot/flot/tree/master/examples/realtime
    
root.DynGraph = function(placeholder, config, plots){
    this.initialized = false;
    this.placeholder = placeholder;
    this.plot=null;
    this.duration = root.getOpts(config, "duration", 1);
    this.yaxes = root.getOpts(config, "yaxes", [{}]);
    this.plots = plots;
    this.series = [];
    this.time = 0;
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
    xaxis: {
      axisLabel : 'time (s)',
      color:'black',
    },
    yaxes:this.yaxes,
    legend: {
      show: true,
      position: "nw",
    },
    };
    this._init();
}

root.DynGraph.prototype = {
    _init: function() {
        this.nplots = this.plots.length;
        this.series = [];
        var series = [];
        for (var i = 0 ; i < this.nplots ; i++) {
            var elem = {
                lines: {fill:false},
                data: [],
            };
            root.copyObjectFields(this.plots[i], elem, ["color", "label", "yaxis"]);
            this.series.push(elem);
        }
        this.plot = $.plot(this.placeholder, this.series, this.plot_options);
    },
    _update_x:function() {
        // var opt = this.plot_options;
        var opt = this.plot.getOptions();
        opt.xaxes[0].min = this.time - this.duration;
        opt.xaxes[0].max = this.time;
        //opt.xaxis.max = this.time;
        //this.plot.setupGrid();
    },
    add:function(delta_t, v) {
        this.time += delta_t;
        for (var i = 0 ; i < this.nplots ; i++) {
            this.series[i].data.push([this.time, v[i]]);
            while (this.series[i].data[0][0] < (this.time - this.duration)) {
                this.series[i].data.shift(); // on élimine les valeurs trop vieilles
            }
        }
        this.plot.setData(this.series);
        this._update_x();
        this.plot.setupGrid();
        this.plot.draw();
    }
}
 
return root;
}) ($GL || {});