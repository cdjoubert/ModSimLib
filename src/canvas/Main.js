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
 * This library make heavy use of KonvaJS (konvajs/konva)
 * KonvaJS is based upon kineticJS from Eric Drowell (which is no longer maintained)
 */

/*
 * This library helps to create graphical building blocks to simulate physical systems
 * Some of these blocks are :
 * 
 * - sliders (linear or logarithmic, with value displayed)
 * - arrows to represent phasors
 * - curved arrow (ArcArrows) to indicate angles between arrows
 * - ImageSwith : on/off switch represented with two different images
 * - SpinningImages : make an image spin at a speed depending on a variable. Can also be moved "by hand"
 * - analog and digital meters
 * - "flow" meters : may represent the flow of power with moving arrows
 * - polyline with dots : The moving yellow dots indicate current. The idea comes from : http://www.falstad.com/circuit/
 * 
 * - ImageLoader : to help load images
 * 
 * 
 */



// Ref: https://stackoverflow.com/questions/35087268/javascript-module-pattern-files-concatenation-in-a-one-file-and-using-their-func
var $ML = (function(root) {
// Anonymous function to initialize $ML
// "Immediately-Invoked Function Expression" (IIFE)




root.default_layer = 0;
root.set_default_layer = function (layer) {
    root.default_layer = layer;
}


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

// Clone an object
root.clone = function(obj) {
    if (null == obj || "object" != typeof obj) return obj;
    var copy = obj.constructor();
    for (var attr in obj) {
        if (obj.hasOwnProperty(attr)) copy[attr] = root.
            clone(obj[attr]);
    }
    return copy;
}

// inspect an object (for debugging)
// usage : xinspect(object)
root.xinspect = function(o, maxrecurse, i){
    if(typeof maxrecurse == 'undefined') maxrecurse=3;
    if(typeof i == 'undefined') i=0; // Present level of recursion
    if(i > maxrecurse) return '[MAX RECURSION LEVEL]';
    var spc = Array(i).join("  ");
    var r='';
    for(var p in o){
        var t=typeof o[p];
        r=r+(spc+'"'+p+'" ('+t+') => '+(t=='object' ? 'object:'+xinspect(o[p], maxrecurse, i + 1) : o[p]) +'\n');
    }
    return r;
}


root._block = function(config) {
}
    
root.block_list = [];
root.block_dict = {};

root._block.prototype = {
    _register: function(config, block_class, inputs, outputs) {
        if (config === undefined)
            config = {};
        this.config = config;
        if (inputs === undefined)
            inputs = [];
        if (outputs === undefined)
            outputs = [];
        this.inputs = inputs;
        this.outputs = outputs;
        this.block_class = block_class;
        this.hidden = false;
        this._init(config);
        this._postinit();
        self = this;
        root.block_list.push(self);  // registering current block
        root.block_dict[block_class + "." + self.name] = self;
        return config;
    },
    addToLayer : function (layer) {
        this.layer = layer;
        layer.add(this.group);
    },
    setPosition : function (p) {
        this.group.setPosition(p);
    },
    rotateDeg : function (a) {
        this.group.rotateDeg(a);
    },
    draggable : function (b) {
        this.group.draggable(b);
    },
    visible : function (b) {
        if (b) {
            this.hidden = false;
            this.group.show();
        } else {
            this.hidden = true;
            this.group.hide();
        }
    },
    _postinit: function () {
        if ("x" in this.config && "y" in this.config) {
            this.setPosition({x:this.config.x, y:this.config.y});
        }
        if ("layer" in this.config) {
            if (this.config.layer) {
                this.addToLayer(this.config.layer);
            }
        } else if  (root.default_layer) {
            this.addToLayer(root.default_layer);
        }
        if ("name" in this.config) {
            this.name = this.config.name;
        }
        if ("draggable" in this.config) {
            this.draggable(this.config.draggable);
        }
    },
};

/*
 * Extends an old prototype with a new one.
 * Poor man inheritance
 * 
 */
root._xtend=function(old_proto, new_proto) {
        proto_base = Object.create(old_proto);
        for (var attrname in new_proto) { proto_base[attrname] = new_proto[attrname]; }
        return proto_base;
};

/*
 * Specialized inheritance for the core library
 */
root._block_xtend=function(new_proto) {
        var proto_base = root._xtend(root._block.prototype, new_proto);
        return proto_base;
};

root.iterate_blocks = function (class_re, name_re, func, arg) {
    /*
     * call func(block, arg) for each block that
     * corresponds to class_re and name_re
     * class_re and name_re are strings corresponding to regular expressions
     */
    var re_c = new RegExp(class_re);
    var re_n = new RegExp(name_re);
    var count = root.block_list.length;
    for(var i = 0; i < count; i++) {
        var e = root.block_list[i];
        if (typeof e.block_class == "undefined" || ! re_c.test(e.block_class)) {
            continue;
        }
        if (typeof e.name == "undefined" || ! re_n.test(e.name)) {
            continue;
        }
        func(e, arg);
    }
}

/*
 * Make all blocks draggable / not draggable. Usefull to place the blocks with the mouse
 * 
 */
root.draggable_all = function (state) {
    var count = root.block_list.length;
    for(var i = 0; i < count; i++) {
        var e = root.block_list[i];
        e.draggable(state);
    }
}

/*
 * Helper function to be called when a button is clicked. e.g. :
 *  <button onclick="$ML.toggle_draggable(this)">Drag</button> 
 * 
 */
root.toggle_draggable = function (button) {
    var node = button.childNodes[0];
    if (node.data != "Do NOT drag") {
        node.data = "Do NOT drag";
        root.draggable_all(true);
    } else {
        node.data = "Drag";
        root.draggable_all(false);
    }
}

root.dump_blocks = function () {
    var count = root.block_list.length;
    for(var i = 0; i < count; i++) {
        var e = root.block_list[i];
        var block_class = e.block_class;
        var name = e.name;
        var pos = e.group.getPosition();
        var x = pos.x;
        var y = pos.y;
        console.log("{ block_class:\"" + block_class + "\", name:\"" + name +
            "\", x:" + x +
            ", y:" + y +
            ", }," 
            );
    }
}



return root;
}) ($ML || {}); // Fin de la "Immediately-Invoked Function Expression" (IIFE)
