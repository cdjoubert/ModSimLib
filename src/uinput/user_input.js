
/*
 * Bibliothèque permettant de créer facilement des contrôles utilisater pour 
 * entrer des valeurs
 */


function UserInputs(calculate_function) {
    //message("BBBBBBBBB<br>");
    this.calc=calculate_function;
    var T = this; // pour eviter les melanges avec JQuery
    $("[class^=jqc_]").each(function(index0) {
        var class_name=$(this).attr('class');
        var type=class_name.substring(4);
        var name=$(this).attr('id');
        $('.control', this).data('name', name); // store arbitrary data to any subelement of class "control"
        var opt = T.get_opts(this);
        //var args=get_args(this);
        //message("Type: "+type+"  ARGS:" + args + "<br>");
        switch(type) {
            case "slider":
                var new_opt=T.get_args(this,['min','max','step','value']);
                $.extend(opt, new_opt);
                opt['slide']=T.jqc_change;
                var ctrl=$('.control',this);
                ctrl.slider(opt);
                ctrl.data('get_value_cb',function (obj,ui){return ui.value;});
                ctrl.data('get_value_i',function (){return $("#"+name).find(".control").slider("value");});
                ctrl.data('get_value',function (){return $("#"+name).find(".control").data("value");});
                ctrl.data('calculate',T.calc);
                var val = ctrl.slider("option", "value");
                val=parseFloat(val);
                ctrl.data('value',val);
                $('.value',this).text(sprintf('%+6.1f',val));
                break;
        }
    });
}

UserInputs.prototype = { 
    getValByName : function (name_rq) {
        var result=null;
        $('.control').each(function(index) {
            var name=$(this).data('name');
            //var name='toto';
            //console.log("Got Name: " + name + " name_rq=" + name_rq);
            //var val = $(this).slider("option", "value");
            if (name_rq == name) {
                var get_value=$(this).data('get_value');
                //console.log($("#"+name).find(".control").slider("value") + "  +++++++++++\n");
                result= get_value();
                return false; // on interrompt les iterations
                }
            });
        //console.log("+++++ B ++++++\n");
        return result;
    },
    getCtrlByName : function (name_rq) {
        var result=null;
        $('.control').each(function(index) {
            var name=$(this).data('name');
            //var name='toto';
            //console.log("Got Name: " + name + " name_rq=" + name_rq);
            //var val = $(this).slider("option", "value");
            if (name_rq == name) {
                //console.log($("#"+name).find(".control").slider("value") + "  +++++++++++\n");
                result= $(this);
                return false; // on interrompt les iterations
                }
            });
        //console.log("+++++ B ++++++\n");
        return result;
    },
    jqc_change: function (event,ui) {
        var get_value_cb=$(this).data('get_value_cb');
        var get_value_i=$(this).data('get_value_i');
        var calculate=$(this).data('calculate');
        var objet=$(this)[0];
        var objet_parent=$(this).parent()[0];
        //message('get_value: <pre>'+ xinspect(ui) +"</pre>\n");
        //console.log("OUTER_HTML: "+ui.handle.parent.outerHTML+"\n");
        //console.log('inspect: '+ objet.outerHTML + "\n");
        var val=get_value_cb(this,ui);
        $(this).data('value',val);
        var val2=get_value_i();
        //console.log($(this).data('name') + "/" + val + "/" + val2);
        $(this).parent().find('.value').text(sprintf('%+6.1f',val));
        
        calculate();
    },
    get_opts : function (jq_context){
            var opt={};
            $(jq_context).find('.opts').each(function(index) {
                var pstring=$(this).html();
                var opt2=eval('{'+ pstring +'}');
                $.extend(opt,opt2);
                });
            return opt;
    },
    get_args : function (jq_context,args_name){
        var args=Array();
        $(jq_context).find('.args').each(function(index) {
            var pstring=$(this).html();
            var args2=eval('['+ pstring +']');
            args=args.concat(args2);
            });
        if (typeof args_name == "undefined") {
            return args;
        } else {
            var opts={};
            $(args).each(function(index) {
                opts[args_name[index]] = args [index];
            });
            return opts;
        }
    }
}
