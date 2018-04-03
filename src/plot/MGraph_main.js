/*
 * MGraph
 * 
 * Simulate models of electric machines - plots
 * 
 * The MIT License (MIT)
 * 
 * Copyright (c) 2017 Charles JOUBERT
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 * 
 */

/*
 * This library make heavy use of JQuery/Flot (http://www.flotcharts.org/)
 */

$GL={};

(function(root) {  // Fonction anonyme qui initialise $GL
// "Immediately-Invoked Function Expression" (IIFE)


function getOpts(opt_array, name, default_value) {
    /*
     * Get element of opt_array whose name is "name"
     * If opt_array is undefined, or does not contain "name"
     * default_value is used instead
     */
    if (opt_array === undefined || opt_array[name] === undefined)
        return default_value;
    else
        return opt_array[name];
}

function copyObjectFields(src, dst, fieldNamesArray) {
        var obj = {};

        if (fieldNamesArray === null)
            return obj;

        for (var i = 0; i < fieldNamesArray.length; i++) {
            if (src[fieldNamesArray[i]] === undefined) {
                continue;
            }
            dst[fieldNamesArray[i]] = src[fieldNamesArray[i]];
        }
}

$GL={
    copyObjectFields:copyObjectFields,
    getOpts: getOpts,
};

// Graph of sinusoidal functions
$GL.SinGraph = function(placeholder, config){
    this.placeholder = placeholder;
    this.plot=null;
    this.N = getOpts(config, "npoints", 20); // Nombre de points
    this.scope = getOpts(config, "scope", false); // apparence "oscilloscope"
    this.nperiods = getOpts(config, "nperiods", 1); // nombre de periodes representees
    this.tmin = getOpts(config, "tmin", -5); // temps minimal
    this.tmax = getOpts(config, "tmax", 20); // temps max
    this.max = getOpts(config, "max", 20); // Valeur max
    this.options={
    grid: {
      borderWidth: 1,
      minBorderMargin: 20,
      labelMargin: 10,
      backgroundColor: {
        colors: ["#fff", "#e4f4f4"],
      },
      margin: {
        top: 8,
        bottom: 20,
        left: 20
      },
      markings: [ { xaxis: { from: -5, to: 20 }, yaxis: { from: 0, to: 0 }, color: "#000" },
                       { xaxis: { from: 0, to: 0 }, yaxis: { from: -20, to: 20 }, color: "#000" }]
    },
    xaxis: {
      ticks: [-5, 0, 5, 10, 15, 20],
      axisLabel : 'temps (ms)',
      //color:'grey',
    },
    yaxis: {
      min: -this.max,
      max: +this.max,
      //color:'grey',
    },
    legend: {
      show: true
    }
    };
    if (this.scope) {
        this.tmin = -10;
        this.tmax = +10;
        this.options.grid.backgroundColor.colors = ["#fff", "#fff"];
        this.options.grid.markings = [ { xaxis: { from: -10, to: +10 }, yaxis: { from: 0, to: 0 }, color: "#000" },
                       { xaxis: { from: 0, to: 0 }, yaxis: { from: -5, to: 5 }, color: "#000" }];
        this.options.xaxis= {
            ticks: [-10,-8,-6,-4,-2,0,2,4,6,8,10],
            axisLabel : null,
            color:"#aaa",
        };
        this.options.yaxis= {
            ticks: [-5,-4,-3,-2,-1,0,1,2,3,4,5],
            axisLabel : null,
            color:"#aaa",
        };
    }
}

$GL.SinGraph.prototype = {
    draw:function(tableau) {
        if (!this.initialized) {
            this.initialized=true;
            var series=this._create_series(tableau);
            this.plot = $.plot(this.placeholder, series, this.options);
        } else {
            var series=this._create_series(tableau);
            this.plot.setData(series);
            this.plot.draw();
        }   
    },
    _create_sin: function(amplitude,phase) {
        var res=[];
        
        for (var i = 0; i <= this.N; ++i) {
            var tmin=this.tmin;
            var tmax=this.tmax;
            var t=tmin+1.0*(tmax-tmin)*i/this.N;
            var angle=t*2*Math.PI*50/1000;
            var y=amplitude*Math.sin(angle+(Math.PI/180)*phase);
            res.push([t,y])
        }
        var series = [{
            color:"#ff0000",
            data: res,
            lines: {
                fill: false
            }
        }];
        return res;
    },
    _create_series: function(tableau) {
        series=[];
        for (var i =0 ; i<tableau.length ; i++) {
            var serie={
                color:getOpts(tableau[i], "color", "black"),
                data: this._create_sin(tableau[i].amplitude/(1.0*getOpts(tableau[i], "scale", 1.0)),
                                       tableau[i].phase),
                lines: {
                    fill: false
                }
            };
            series.push(serie);
        }
        return series;
    },
    show_series: function(series_num, state) {
        var Data = this.plot.getData();
        Data[series_num].lines.show = state;
        this.plot.setData(Data);
        this.plot.draw();
    }
}

// Updating graph
// See also : https://github.com/flot/flot/tree/master/examples/realtime
$GL.DefGraph = function(placeholder, config, plots){
    this.initialized = false;
    this.placeholder = placeholder;
    this.plot=null;
    this.duration = $ML.getOpts(config, "duration", 1);
    this.yaxes = $ML.getOpts(config, "yaxes", [{}]);
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
      axisLabel : 'temps (s)',
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

$GL.DefGraph.prototype = {
    _init: function() {
        this.nplots = this.plots.length;
        this.series = [];
        var series = [];
        for (var i = 0 ; i < this.nplots ; i++) {
            var elem = {
                lines: {fill:false},
                data: [],
            };
            $GL.copyObjectFields(this.plots[i], elem, ["color", "label", "yaxis"]);
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

// Caracteristiques
$GL.CarGraph = function (placeholder, config, plots){
    this.initialized = false;
    this.placeholder = placeholder;
    this.plot=null;
    this.duration = $GL.getOpts(config, "duration", 1);
    this.xaxis = $GL.getOpts(config, "xaxis", {});
    this.yaxis = $GL.getOpts(config, "yaxis", {});
    this.legend = $GL.getOpts(config, "legend", {});
    this.xmin = $GL.getOpts(config, "xmin", null);  // definit une serie de points suivant les abscisses : valeur min
    this.xmax = $GL.getOpts(config, "xmax", null);  // valeur max
    this.xnum = $GL.getOpts(config, "xnum", null);  // nombre de points
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

$GL.CarGraph.prototype = {
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