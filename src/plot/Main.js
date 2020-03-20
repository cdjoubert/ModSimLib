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





return root;
}) ($GL || {}); // Fin de la "Immediately-Invoked Function Expression" (IIFE)
