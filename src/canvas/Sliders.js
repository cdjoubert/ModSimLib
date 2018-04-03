
/****************************************************************************
 *                   Sliders
 ****************************************************************************/

var $ML = (function(root) {

root.Slider = function (config) {
    /*
     * Crée un slider
     * Options (dans config) :
     * min: valeur mini
     * max: valeur maxi
     * n: nombre de positions
     * value: valeur initiale
     * format: si présent : la valeur est affichée avec le format (façon printf)
     * log: si présent et à true : échelle logarithmique
     * color: couleur du curseur (et du texte si présent)
     * width:
     * height: dimensions du slider
     * 
     * MEMBRES:
     * value: valeur courante du slider
     * 
     * FONCTIONS MEMBRES:
     * setval(v): force la valeur du slider
     * getval() : renvoie la valeur courante
     * addToLayer(layer): ajoute l'instrument à la couche "layer"
     * setPosition(p): change la position à p
     * rotateDeg(a): tourne l'ensemble de a degres
     * draggable(b): si b==true : rend "draggable"
     * 
     */
    this._register(config, "Slider", [], ["value"]);
};

root.Slider.prototype = root._block_xtend({
    _init: function (config) {
        this.group = new Konva.Group();
        this.min = root.getOpts(config, "min", 0);
        this.max = root.getOpts(config, "max", 100);
        this.n   = root.getOpts(config, "n", 11);
        this.log  = root.getOpts(config, "log", false);
        this.color = root.getOpts(config, "color", "#808080");
        this.width = root.getOpts(config, "width", 100);
        this.height = root.getOpts(config, "height", 15);
        this.slow_callback = root.getOpts(config, "slow_callback", null);
        this.fast_callback = root.getOpts(config, "fast_callback", null);
        this.bw = 2 * this.height; // button width
        this.dx = (this.width - this.bw) / (1.0*(this.n-1));  // pixel step for cursor
        var self = this;
        if (!this.log){  // if it is a linear scale :
            this._index2val = function (i) {
                return self.min + (i / (self.n-1)) * (self.max - self.min);
            };
            this._val2index = function (v) {
                return Math.round((self.n - 1) * (v - self.min) / (self.max - self.min));
            };
        } else {  // for logarithmic scale
            this._index2val = function (i) {
                return self.min * Math.pow(self.max/self.min, i/(self.n-1));
            };
            this._val2index = function (v) {
                return Math.round((self.n - 1) * Math.log(v / self.min) / Math.log(self.max / self.min));
            };
        }
        this.base = new Konva.Rect({
                x: 0,
                y: 0,
                width: this.width,
                height: this.height,
                fill: "#F0F0F0",
                stroke: 'black'
            });
        this.cursor = new Konva.Rect({
                x: 0,
                y: 0,
                width: this.bw,
                height: this.height,
                cornerRadius: this.height/2,
                fill: this.color,
                stroke: 'black',
                draggable: true,
                dragBoundFunc: function(pos) {
                    var p = self._get_relative_cursor_position(pos);
                    var pos_index = Math.round(p.x / (1.0*self.dx));
                    if (pos_index >= self.n)
                        pos_index = self.n - 1;
                    if (pos_index < 0)
                        pos_index = 0;
                    //console.log("pos_index: ", pos_index, self.n);
                    self.value = self._index2val(pos_index);
                    //console.log("**Value   : ",self.value, pos_index);
                    var x = self.dx * pos_index;
                    if (self.text) {
                        self.text.setText(sprintf(self.format, parseFloat(self.value)));
                    }
                    if (self.fast_callback) {  // appelé a chaque mouvement du curseur
                        self.fast_callback(self.value, self);
                    }
                    //console.log("x: " + x + "x0: " + x0 + "y0: " + y0);
                    return self._set_relative_cursor_position({x:x, y:0});
                }
        });
        if (this.slow_callback) {  // appelé seulement au relachement du curseur
            this.cursor.on("dragend", function(evt) {
                self.slow_callback(self.value, self);
            });
        }   
        this.group.add(this.base);
        this.group.add(this.cursor);
        // Set initial value and put cursor at the good position
        // at this time, there is no rotation, so call this._setval
        // instead of this.setval
        if ("value" in config) {
            var _posx = this._setval(config["value"]);
        } else {
            var _posx = this._setval(this.min);
        }
        this.cursor.setPosition({x:_posx, y:0});
        if ("format" in config) {   // On va rajouter l'affichage de la valeur
            this.format = config.format;
            this.text = new Konva.Text({
                    x: 0,
                    y: -this.height,
                    text: sprintf(this.format, parseFloat(this.value)),
                    fontSize: 14,
                    fontFamily: 'Monospace',
                    fill: this.color,
                    align: 'left'
            });
            this.group.add(this.text);
            this.text.setY(-this.text.getTextHeight());
        }
    },
    _get_relative_cursor_position: function(p) {
        // Transforms coordinates in p to be relative to group position
        // Could be changed for vertical slider
        if (typeof p === "undefined") {
            p = this.cursor.getAbsolutePosition();
        }
        var pg = this.group.getAbsolutePosition();
        //console.log("_get_relative_cursor_position: ", pg, p);
        var pr = {x:(p.x-pg.x), y:(p.y-pg.y)};
        return pr;
    },
    _set_relative_cursor_position: function(p) {
        // Transforms coordinates in p to be absolute
        // Could be changed for vertical slider
        var pg = this.group.getAbsolutePosition();
        var pr = {x:(p.x+pg.x), y:(p.y+pg.y)};
        //console.log("_set_relative_cursor_position", p, pg, pr);
        return pr;
    },
    _setval: function (v) { // Internal function. Used alone before any rotation
        if (v < this.min) v=this.min;
        if (v > this.max) v=this.max;
        this.value = v;
        var x = this._val2index(v) * this.dx;
        return x;
    },
    setval: function (v) { // Set value
        var x = this._setval(v);
        var p = this._set_relative_cursor_position({x:x, y:0});
        //console.log("setval: ", v, this._val2index(v), x);
        this.cursor.setAbsolutePosition(p);
    },
    getval: function () {
        return this.value;
    },
});


root.VSlider = function(config) {
    this._register(config, "VSlider", [], ["value"]);
};


root.VSlider.prototype = root._xtend(root.Slider.prototype, {
    _init: function (config) {
        root.Slider.prototype._init.call(this, config);
        this.group.rotate(-90);
    },
    _get_relative_cursor_position: function(p) {
        // Transforms coordinates in p to be relative to group position
        if (typeof p === "undefined") {
            p = this.cursor.getPosition();
        }
        var pg = this.group.getPosition();
        var pr = {x:-(p.y-pg.y), y:(p.x-pg.x)};
        return pr;
    },
    _set_relative_cursor_position: function(p) {
        // Transforms coordinates in p to be absolute
        var pg = this.group.getPosition();
        var pr = {x:(p.y+pg.x), y:(-p.x+pg.y)};
        //console.log("_set_relative_cursor_position", p, pg, pr);
        return pr;
    },
});


return root;
}) ($ML || {}); // Fin de la "Immediately-Invoked Function Expression" (IIFE)