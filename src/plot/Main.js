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
 * 
 * y = fct(x, p)
 * the function may return a vector (y)
 * 
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