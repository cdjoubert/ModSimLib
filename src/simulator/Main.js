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