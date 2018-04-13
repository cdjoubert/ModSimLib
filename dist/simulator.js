/*
 * ModSimLib
 * 
 * Simulate models of electric machines
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
 * Simulation for ModSimLib / MGraph
 * Solve Ordinary Differential Equations (ODE)
 * 
 */


/* function Simulator(config, callback)
 * 
 * Continuous and discrete state simulator (ODE)
 * callback est une fonction qui est appelé par le simulateur avec les paramètres suivants :
 *  callback(t, dt, args, X, sim)
 *     t:    temps
 *     dt:   intervalle de temps précédent
 *     args: arguments (facultatifs) qui peuvent être définis lors de l'instanciation de Simulator
 *     X:    vecteur d'état. Les cont_states premiers éléments correspondent aux états continus. 
 *             le restant correspond aux états discrets
 *     sim:  simulator object
 * 
 * Options (dans config) :
 * delta_t: intervalle de temps entre chaque appel de la simulation (en ms)
 * speed_factor: multiplicateur qui donne le temps réel, à partir de delta_t
 * args: arguments supplémentaires fournis lors de l'appel à la fonction de callback
 * X0: vecteur d'état initial
 * cont_states: nombre d'états continus. Ils sont tous regroupés en début du vecteur X.
 *              défaut : la taille de X0 (autrement dit : pas d'état discrets)
 * output_cb: si présent : specifie une fonction qui est appelee APRES le calcul de
 *            l'etat suivant. Elle peut servir soit à générer une sortie, soit à modifier
 *            le vecteur d'état (par exemple pour induire une saturation)
 *            Memes conventions d'appel que callback
 * 
 * MEMBERS:
 * t: current time
 * X: current state vector
 * prev_X: previous state vector (WARNING possibly not awlways available) TODO: test timing impact
 * delta_t: time interval (s)
 * 
 * MEMBER FUNCTIONS:
 *  
 * start() : démarre la simulation
 * stop()  : stoppe la simulation
 * set_state(state)  : si state est défini : démarre (state == true) ou arrête (state == false)
 *                     si state est indéfini : toggle (change l'état)
 * force_X(new_X, idx_list) : when called in callback function : will replace (force) the state vector with vector
 *                   optional paramter idx_list is an array of indexes of elements of X to replace. If given,
 *                   new_X and idx_list should have the same length
 * next()  : cacule l'état suivant. Normalement, cette fonction est appelée en interne, mais
 *           si la simulation est stoppée, l'appel à cette fonction permet de faire un pas
 *           (fonctionnement pas à pas).
 */

function Simulator(config, callback) {
    this.delta_t_ms = this.getOpts(config,"delta_t", 100);
    this.speed_factor = this.getOpts(config,"speed_factor", 1.0);
    this.output_cb = this.getOpts(config,"output_cb", null);
    this.delta_t = this.delta_t_ms * 1e-3 * this.speed_factor;
    this.callback = callback;
    this.args = this.getOpts(config, "args", []);
    this.X = this.getOpts(config, "X0", []);  // State vector
    this.prev_X = []; // previous state vector
    this.cont_states = this.getOpts(config, "cont_states", this.X.length);  // Number of continuous states
    this.t = 0;
    this.time_ms = Date.now();
    this.prev_time_ms = Date.now();
    this.interval = null;
    this._replace_vect = false;  // replace state vector with :
    this._next_vect = [];
    this._next_vect_idx = [];
}

Simulator.prototype = {
    getOpts: function(opt_array, name, default_value) {
        /*
        * Get element of opt_array whose name is "name"
        * If opt_array is undefined, or does not contain "name"
        * default_value is used instead
        */
        if (opt_array === undefined || opt_array[name] === undefined)
            return default_value;
        else
            return opt_array[name];
    },
    start: function() {
        if (this.interval === null) {
            var self = this;
            this.interval = window.setInterval(
                function () {self.next.apply(self)},
                //window.tst_func,
                this.delta_t_ms);
        }
    },
    stop: function() {
        window.clearInterval(this.interval);
        this.interval = null;
    },
     set_state: function(state) {
         if (state === undefined) {  // toggle
             if (this.interval === null) {
                 this.start();
             } else {
                 this.stop();
             }
         } else {
             if (state) {
                 this.start();
             } else {
                 this.stop();
             }
         }
     },
    next : function (p) {
        var now_ms = Date.now();
        var dt0 = (now_ms - this.time_ms)/1000;
        var dt1 = (this.time_ms - this.prev_time_ms)/1000;
        this.prev_time_ms = this.time_ms;
        this.time_ms = now_ms;
        dt0 = this.delta_t;
        var new_X = this.callback(this.t, dt0, this.args, this.X, this);
        var i;
        for (i=0 ; i < new_X.length ; i++) { // recopie des états
            this.prev_X[i] = this.X[i];
        }        
        for (i=0 ; i < this.cont_states ; i++) { // Euler sur les états continus
            this.X[i] += dt0 * new_X[i];
        }
        // TODO: implement also an Adams–Bashforth method (or equivalent with variable step size)
        // Ref: https://fr.wikipedia.org/wiki/M%C3%A9thodes_d%27Adams-Bashforth
        // Ref: http://lucan.me.jhu.edu/wiki/index.php/Second-order_variable_time_step_Adams-Bashforth_method
        for (i=this.cont_states ; i < new_X.length ; i++) { // recopie des états discrets
            this.X[i] = new_X[i];
        }
        if (this._replace_vect) {
            var idx;
            this._replace_vect = false;
            if (this._next_vect_idx) {
                for (i=0 ; i<this._next_vect_idx.length ; i++) {
                    idx = this._next_vect_idx[i];
                    this.X[idx] = this._next_vect[idx];
                } 
            } else {
                for (i=0 ; i<this.X.length ; i++) {
                    this.X[i] = this._next_vect[i];
                }
            }
        }
        if (this.output_cb) {
            this.output_cb(this.t, dt0, this.args, this.X, this);
        }
        this.t += dt0;
    },
    force_X: function (new_X, idx_list) {
        this._replace_vect = true;
        this._next_vect = new_X;
        this._next_vect_idx = (typeof idx_list == 'undefined') ? [] : idx_list;
    }
}


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

var $GL = (function(root) {
// Anonymous function to initialize $GL
// "Immediately-Invoked Function Expression" (IIFE)


root.getOpts = function (opt_array, name, default_value) {
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

root.copyObjectFields = function(src, dst, fieldNamesArray) {
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



/*********************** Series *************************************/

/*
 * Generate series for graphs
 * 
 * Permettre pour une fonction de renvoyer un vecteur, ce qui crée autant de séries de points que
 * d'éléments dans le vecteur.
 * Ajouter :
 *  * lien direct avec graphiques.
 */

root.Series = function (opt) {
    this.opt = opt;
    this.series = null;
    this.def_opt("points", null); // Points can be fixed (vector given)
    this.def_opt("N", 100); // Nb of points
    this.def_opt("min", 0); // Min value for function x
    this.def_opt("max", 100); // Max value for function x
    this.def_opt("fct", function (x, p) {return x;}); // function to be calculated for each point with param p
    this.def_opt("p", null); // default parameters for function call
    this.x1 = null; // previous x and previous difference with fct2
    this.d1 = null;
    this.prefill();
}

root.Series.prototype = {
    def_opt: function (name, default_value) {
        /*
        * Get element of this.opt whose name is "name"
        * If this.opt is undefined, or does not contain "name"
        * default_value is used instead
        */
        
        if (this.opt === undefined || this.opt[name] === undefined)
            this[name] = default_value;
        else
            this[name] = this.opt[name];
    },
    prefill: function () {
        if (this.points == null){ // If we didn't give points in opt
            var i;
            this.points = [];
            this.series = null;
            for (i = 0 ; i < this.N ; i++) {
                var x = this.min + (i / (this.N - 1)) * (this.max - this.min);
                this.points.push(x); // Prefill points
            }
        }
    },
    prefill_series: function (fct, p) {
        this.series = [];
        var y = fct(this.points[0], p);
        var number_of_series = (Array.isArray(y)) ? y.length : 1;
        for (var j = 0 ; j < number_of_series ; j++) {
            this.series[j]=[];
            for (var i = 0 ; i < this.points.length ; i++) {
                this.series[j][i] = [0, 0];
            }
        }
    },
    compute: function (fct, p) { // compute function on series with parameter p
        if (fct == null && p == null){ // if we don't give anything, get the default function and parameters
            fct = this.fct;
            p = this.p;
        } else if (p == null && !(fct && fct.constructor && fct.call && fct.apply)) {
            // ( see: undescore.js / isFunction). If one parameter is given, and it is not a function => parameter
            p =fct;
            fct = this.fct;
        } else if (p == null) { // fct is acually a function, but no paramterer given
            p = this.p;
        } // else : fct AND p are given. Nothing to do
        if (this.series == null) { // If series not initialized yet
            this.prefill_series(fct, p);
        }
        for (var i = 0 ; i < this.points.length ; i++) {
            var x = this.points[i];
            var y = this.fct(x, p);
            if (Array.isArray(y)) {
                for (var j = 0 ; j < y.length ; j++) {
                    this.series[j][i] = [x, y[j]];
                }
            } else {
                this.series[0][i] = [x, y];
            }
        }
    },
    intersect: function (s1, s2) { // detect intersections between series s1 and s2
        var intersections =  new Array();
        var x1, y1, d1, x2, y2, d2; // abscissa and differences
        var x0, y0; // coordinate of intersects
        x1 = this.points[0];
        d1 = this.series[s1][0][1] - this.series[s2][0][1]; // difference between first values
        for (var i = 1 ; i < this.points.length ; i++) {
            d2 = this.series[s1][i][1] -  this.series[s2][i][1];
            x2 = this.points[i];
            if ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) { // crossing detected
                y1 = this.series[s1][i-1][1];
                y2 = this.series[s1][i][1];
                x0 = (d1*x2 - d2*x1) / (d1 - d2);
                y0 = y1 + (x0 - x1) * (y2 - y1) / (x2 - x1);
                intersections.push([x0, y0]);
            }
            x1 = x2;
            d1 = d2;
        }
        return intersections;
    },
}



return root;
}) ($GL || {}); // Fin de la "Immediately-Invoked Function Expression" (IIFE)


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