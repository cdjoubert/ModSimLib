/****************************************************************************
 *                   On/Off Switch
 ****************************************************************************/

var $ML = (function(root) {

root.ImageSwitch = function (config) {
    /*
     * Charge un bouton On/Off
     * 
     * config: options de configuration:
     * - img_false : image affichée pour l'état "false" (off)
     * - img_true : image affichée pour l'état "true" (on)
     * - value : valeur initiale
     * - callback : si présent, fonction appelée avec comme argument : (valeur, objet ImageSwitch)
     * - x : position en abscisse
     * - y : position en ordonnee
     * 
     * PROPRIETES:
     * value : valeur (true/false)
     * 
     * FONCTIONS MEMBRES:
     * 
     * 
     */
    this._register(config, "ImageSwitch", [], ["value"]);
}

root.ImageSwitch.prototype = root._block_xtend({
    _init: function (config) {
        this.img=[];
        this.img[0] = root.getOpts(config, "img_false", null);
        this.img[1] = root.getOpts(config, "img_true", null);
        this.value = root.getOpts(config, "value", false);
        this.group = new Konva.Group();
        this.callback = root.getOpts(config, "callback", null);
        this.sw_groups = [];  // switch groups the switch is belonging to
        var img_opt = {x:0, y:0};
        var self = this;
        var il_config = {
            visible_only: (this.value) ? 1 : 0,
            callback: function(IL) {
                for (var i = 0 ; i<2 ; i++) {
                    //console.log("cb: ", i);
                    var  shape = IL.getKImage(i);
                    shape.on("click", function (evt) {self._do_switch(evt);});
                    shape.setName(sprintf("%d",i));
                }
            },
            layer:this.group,   // TODO: pas très satisfaisant !! Mettre à 0 puis tout placer ds un groupe
        };
        this.loader = new root.ImageLoader(this.img, img_opt, il_config);
    },
    _setval: function (val) { // Force the value of the switch
        // For use by sw groups to avoid infinite recursion
        //console.log("Val: ", val)
        if (val) {
            this.loader.show_only(1);
            this.value = true;
        } else {
            //console.log("ZERO");
            this.loader.show_only(0);
            this.value = false;
        }
        this.layer.draw();
    },
    setval: function (val, excl_group) { 
        this._setval(val);
        for (var i = 0; i < this.sw_groups.length ; i++) {
            if (typeof excl_group == "undefined" || excl_group != this.sw_groups[i]) {
                this.sw_groups[i].signal(this); // signals a change for current switch
            }
        }
    },
    _do_switch: function (evt) {
        var target = evt.target;
        //console.log("sw: ", target.name(), "Name: ", this.name);
        this.setval(target.name() == "0");
        if (this.callback) {
            this.callback(this.value, this);
        }
    },
    getval: function () {
        return this.value;
    },
});


root.SwitchGroup = function (config, sw_list) {
    /*
     * Group switches for synchronous operation
     * 
     * A switch can be part of one or several groups.
     * 
     * config: config options:
     * - exclusive (boolean): 
     *   * true  (default) : at most ONE switch in the group can be "on" at a time
     *   * false : all the swithches in the group have the same state
     * 
     * PROPERTIES:
     * value : valeur (true/false)
     * 
     * MEMBER FUNCTIONS:
     * - add(sw) : adds swith sw to the group
     * 
     */
    this.exclusive = root.getOpts(config, "exclusive", true);
    this.sw_list = [];
    if (typeof sw_list == "undefined") {
        sw_list = [];
    }
    for (var i = 0 ; i < sw_list.length ; i++) {
        this.add(sw_list[i]);
    }
}

root.SwitchGroup.prototype={
    add: function (sw) {
        sw.sw_groups.push(this);  // let the switch know it is belonging to this present group
        this.sw_list.push(sw);
    },
    signal: function (sw) { // switch sw signals its states has just changed
        var sw_state = sw.getval();
        for (var i = 0 ; i < this.sw_list.length ; i++) {
            if (this.sw_list[i] != sw) {
                if (this.exclusive) {
                    //console.log("exclusive i: ", i, "state: ", !sw_state);
                    this.sw_list[i].setval(false, this);
                } else {
                    this.sw_list[i].setval(sw_state, this);
                }
            }
        }
    },
}


return root;
}) ($ML || {});
