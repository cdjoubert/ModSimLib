

var $GL = (function(root) {

// Graph of sinusoidal functions
root.SinGraph = function(placeholder, config){
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

root.SinGraph.prototype = {
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
 
return root;
}) ($GL || {});