/*
 *      \
 *       \
 *        \\
 *         \\
 *          >\/7
 *      _.-(o'  \
 *     (=___._/` \               jQuery unicornslider v1.0.0
 *          )  \ }               @license Open source under the MIT License.
 *         /   / {               Copyright 2016 Nils Kreutzer
 *        /    > {               mail: nilskreutzer@hotmail.com
 *       j    < _ \              web: unicornslider.sagaverse.com
 *   _.-' :      ``.
 *   \ r=._\        `.
 *  <`\\_  \         .`-.
 *   \ r-7  `-. ._  ' .  `\
 *    \`,      `-.`7  7)   )
 *     \/         \|  \'  / }
 *                ||    .'  {{
 *                 \\  (     )}}
 *                  >\  >
 *               ,.-' >.'
 *              <.'_.''
 *               <'
 */
(function ($) {
    // UnicornSlider: Object Instance
    $.unicornslider = function (element, options) {

        var slider = $(element);

        // making variables public
        slider.vars = $.extend({}, $.unicornslider.defaults, options);

        var namespace = slider.vars.namespace;
        var viewport, wrapper, item, nav, navPrev, navNext, prev, next;
        var methods = {};

        // Store a reference to the slider object
        $.data(element, "unicornslider", slider);

        // private slider methods
        methods = {
            init: function () { // init unicornslider
                // private vars
                slider.oldHtml;                                 // Object: Save old html here

                slider.cleanup = false;                         // Boolean: Cleanup state
                slider.animating = false;                       // Boolean: Animation state
                slider.wrapAround = slider.vars.wrapAround;     // Boolean: Wrap around state
                slider.leanWrapper = slider.vars.leanWrapper;   // Boolean: Lean wrapper
                slider.touchEnabled = false;                    // Boolean: Enable touch

                slider.defaultEasing = "swing";                 // String: Fallback jQuery easing function; possible values: "swing" or "linear"
                slider.direction = "next";                      // String: Direction of slider animation; possible values: "next" or "prev"  
                slider.mode = "mobile";                         // String: Display mode; possible values: "mobile", "tablet" or "desktop"
                slider.animationMethod = "js";                  // String: Animation method; possible values: "js" or "css"
                slider.style = slider.vars.style;               // String: Additional class for parent element
                slider.centerActive = "on";                     // String: Select if active element is centered, "off", "mobile", "desktop" or "on"

                slider.scrollItems = slider.vars.scrollItems;   // Integer: Number of items to scroll on button click
                slider.current = slider.vars.startFrom;         // Integer: Active item index; values range from 0 to item.length - 1
                slider.displacement = 0;                        // Integer: Displacement in px
                slider.displacementIndex = 0;                   // Integer: Displacement in number of items
                slider.centerActiveDisplacement = 0;            // Integer: Displacement to keep the active item centered
                slider.centerActiveDisplacementIndex = 0;       // Integer: Displacement index to keep the active item centered
                slider.activeItemWidth = 0;                     // Integer: Width of slider active item
                slider.activeItemHeight = 0;                    // Integer: Height of slider active item
                slider.itemsVisible = slider.vars.visibleItems; // Integer: Items actually displayed on screen
                slider.parentWidth = 0;                         // Integer: Width of slider parent element in px
                slider.viewportHeight = 0;                      // Integer: Height of slider viewport
                slider.viewportWidth = 0;                       // Integer: Width of slider viewport
                slider.wrapperHeight = 0;                       // Integer: Height of slider wrapper element in px
                slider.wrapperWidth = 0;                        // Integer: Width of slider wrapper element in px
                slider.buttonHeight = slider.vars.buttonHeight; // Integer: Height of button element
                slider.buttonWidth = slider.vars.buttonWidth;   // Integer: Width of button element
                slider.mm = {
                    swipeTreshold: 100,
                    allowedTime: 300,
                    dragging: false
                };
                // setup html
                methods.setup();
                // configuration controls
                methods.sanitizeConfiguration();
                // set data attributes
                methods.setDataAttributes();
                // register event handlers   
                methods.registerEventHandlers();
                // calculate dimensions on init
                methods.resize();
                // log: UnicornSlider initialized   
                methods.log("unicornslider initialized");
                // UnicornSlider: init() Callback
                slider.vars.init(slider);
            },
            setDataAttributes: function () {
                item.each(function (index) {
                    $(this).attr("data-index", index);
                });
                slider.attr("data-display", slider.vars.orientation);
            },
            getInactiveItems: function () {
                var inactiveItems = [];
                item.each(function (index) {
                    // update active item height
                    if (index !== slider.current) {
                        inactiveItems.push($(this));
                    }
                });
                return inactiveItems;
            },
            getActiveItem: function () {
                return item.siblings(".active");
            },
            getClones: function () {
                return slider.find("." + namespace + "item.clone");
            },
            createClones: function () {
                if (slider.cleanup === false) { // clones allready exist
                    $(item.get().reverse()).each(function (index) {
                        if (slider.vars.orientation === "vertical") {
                            var cloneDisplacement = parseInt($(this).css("top"), 10); // get displacement top
                            $(this).clone().css("top", cloneDisplacement - slider.wrapperHeight).addClass("clone").prependTo($("." + namespace + "wrapper", slider)); // prepend clone
                        } else {
                            var cloneDisplacement = parseInt($(this).css("left"), 10); // get displacement left
                            $(this).clone().css("left", cloneDisplacement - slider.wrapperWidth).addClass("clone").prependTo($("." + namespace + "wrapper", slider)); // prepend clone
                        }
                    });
                    item.each(function (index) {
                        if (slider.vars.orientation === "vertical") {
                            var cloneDisplacement = parseInt($(this).css("top"), 10); // get displacement top
                            $(this).clone().css("top", cloneDisplacement + slider.wrapperHeight).addClass("clone").appendTo($("." + namespace + "wrapper", slider)); // append clone
                        } else {
                            var cloneDisplacement = parseInt($(this).css("left"), 10); // get displacement left
                            $(this).clone().css("left", cloneDisplacement + slider.wrapperWidth).addClass("clone").appendTo($("." + namespace + "wrapper", slider)); // append clone
                        }
                    });
                    slider.cleanup = true;
                }
            },
            killClones: function () {
                wrapper.find("." + namespace + "item.clone").remove();
            },
            isVisible: function (viewportDimension, itemDimension, itemDisplacement) {
                if (((0 - itemDimension) < itemDisplacement) && (viewportDimension > itemDisplacement)) {
                    return true;
                } else {
                    return false;
                }
            },
            replaceVisibleClones: function () {
                var clones = methods.getClones();
                clones.each(function (index) {
                    var itemIndex = $(this).attr("data-index"); // get index 
                    if (slider.vars.orientation === "vertical") {
                        var top = parseInt($(this).css("top"), 10); // get top value
                        if (methods.isVisible(slider.viewportHeight, slider.items[itemIndex].height, top) === true) { // this clone must be replaced
                            // find item with same index
                            item.siblings("[data-index=" + itemIndex + "]").css("top", top);
                            // kill this clone on the spot
                            $(this).remove();
                        }
                    } else {
                        var left = parseInt($(this).css("left"), 10); // get left value
                        if (methods.isVisible(slider.viewportWidth, slider.items[itemIndex].width, left) === true) { // this clone must be replaced
                            // find item with same index
                            item.siblings("[data-index=" + itemIndex + "]").css("left", left);
                            // kill this clone on the spot
                            $(this).remove();
                        }
                    }
                });
            },
            cleanUp: function () {
                if (slider.cleanup === true) { // clean up once
                    slider.cleanup = false;
                } else {
                    return false;
                }
                // set timeout to be sure animation is complete
                setTimeout(function () {
                    slider.animating = false;
                    slider.removeClass("animating");
                    if (slider.animationMethod === "css") {
                        item.css("-webkit-transition-duration", "").css("-moz-transition-duration", "").css("-o-transition-duration", "").css("transition-duration", "");
                    }
                    // replace visible clones with original version
                    methods.replaceVisibleClones();
                    // kill all clones
                    methods.killClones();
                    if (slider.animationMethod === "css") {
                        wrapper.css("-webkit-transition-duration", "").css("-moz-transition-duration", "").css("-o-transition-duration", "").css("transition-duration", "");
                    }
                    // log: UnicornSlider animation ended  
                    methods.log("unicornslider animation ended");
                    // UnicornSlider: animationEnd() Callback
                    slider.vars.animationEnd(slider);
                }, 100);
            },
            calculateDisplacement: function (delta) {
                if (slider.direction === "next") {
                    slider.displacementIndex = slider.displacementIndex + delta;
                } else {
                    slider.displacementIndex = slider.displacementIndex - delta;
                }
                slider.displacement = 0;
                for (var i = 1; i <= delta; i++) {
                    if (slider.direction === "next") {
                        var index = slider.current + i;
                        if (!slider.items.hasOwnProperty(index)) {
                            index = index - item.length; // wrap around
                        }
                        if (slider.vars.orientation === "vertical") {
                            slider.displacement -= slider.items[index].height;
                        } else {
                            slider.displacement -= slider.items[index].width;
                        }
                    } else {
                        var index = slider.current - i;
                        if (!slider.items.hasOwnProperty(index)) {
                            index = index + item.length; // wrap around
                        }
                        if (slider.vars.orientation === "vertical") {
                            slider.displacement += slider.items[index].height;
                        } else {
                            slider.displacement += slider.items[index].width;
                        }
                    }
                }
                return slider.displacement;
            },
            calculateDelta: function (target) {
                var targetItemIndex = methods.getTarget(target);
                var delta = methods.calculateMinimalDelta(targetItemIndex);
                return delta;
            },
            animateToTarget: function (target) {
                // animate
                if((slider.mm.dragging === true)&&(methods.isInt(target))) { // do not interfere with dragging
                    return true;
                }
                if (slider.animating === true) { // do not interfere with animation!
                    return true;
                }
                slider.animating = true;
                slider.addClass("animating");
                // calculate delta
                var delta = methods.calculateDelta(target);
                // trying to animate to same id -> do nothing
                if (delta === 0) {
                    slider.animating = false;
                    return true;
                }
                if ((slider.centerActive === "on") || (slider.mode === "mobile" && slider.centerActive === "mobile") || (slider.mode === "desktop" && slider.centerActive === "desktop")) { // if centerActive is enabled
                    // clear active item
                    methods.clearActive();
                }
                // log: UnicornSlider animation started   
                methods.log("unicornslider animation started");
                // UnicornSlider: animationStart() Callback
                slider.vars.animationStart(slider);
                if (slider.animationMethod === "css") {
                    // set animation duration
                    item.css("-webkit-transition-duration", (parseInt(slider.vars.speed) / 1000) + "s").css("-moz-transition-duration", (parseInt(slider.vars.speed) / 1000) + "s").css("-o-transition-duration", (parseInt(slider.vars.speed) / 1000) + "s").css("transition-duration", (parseInt(slider.vars.speed) / 1000) + "s");
                }
                // createClones just before animation
                methods.createClones();
                // calculate displacement
                methods.calculateDisplacement(delta);
                // animate items
                if (slider.animationMethod === "css") {
                    // use css transitions
                    var allItems = slider.find("." + namespace + "item"); // items with their clones
                    if (slider.vars.orientation === "vertical") {
                        viewport.css("height", slider.viewportHeight); // set new value for height
                        allItems.each(function (index) {
                            var top = parseInt($(this).css("top"), 10);
                            var newTop = top + slider.displacement;
                            $(this).css("top", newTop); // set new value for top
                            setTimeout(function () {
                                methods.cleanUp();
                            }, slider.vars.speed);
                        });
                    } else {
                        viewport.css("width", slider.viewportWidth); // set new value for height
                        allItems.each(function (index) {
                            var left = parseInt($(this).css("left"), 10);
                            var newLeft = left + slider.displacement;
                            $(this).css("left", newLeft); // set new value for top
                            setTimeout(function () {
                                methods.cleanUp();
                            }, slider.vars.speed);
                        });
                    }
                } else {
                    // use jQuery animations
                    var allItems = slider.find("." + namespace + "item"); // items with their clones
                    if (slider.vars.orientation === "vertical") {
                        viewport.animate({"height": slider.viewportHeight}, slider.vars.speed, slider.vars.easing); // animate the viewport height
                        allItems.each(function (index) {
                            var top = parseInt($(this).css("top"), 10);
                            var newTop = top + slider.displacement;
                            $(this).animate({"top": newTop}, slider.vars.speed, slider.vars.easing, function () {
                                methods.cleanUp();
                            }); // animate the elements and reposition those previously stored
                        });
                    } else {
                        viewport.animate({"width": slider.viewportWidth}, slider.vars.speed, slider.vars.easing); // animate the viewport width
                        allItems.each(function (index) {
                            var left = parseInt($(this).css("left"), 10);
                            var newLeft = left + slider.displacement;
                            $(this).animate({"left": newLeft}, slider.vars.speed, slider.vars.easing, function () {
                                methods.cleanUp();
                            }); // animate the elements and reposition those previously stored
                        });
                    }
                }
                if ((slider.centerActive === "on") || (slider.mode === "mobile" && slider.centerActive === "mobile") || (slider.mode === "desktop" && slider.centerActive === "desktop")) { // if centerActive is enabled
                    // set selected item active
                    methods.setActive(target);
                }
                // manage button visibility
                methods.manageButtonVisibility();
            },
            setActive: function (target) {
                var itemIndex = methods.getTarget(target);
                if (itemIndex >= item.length) {
                    itemIndex = itemIndex - item.length;
                } else if (itemIndex < 0) {
                    itemIndex = itemIndex + item.length;
                }
                // update current
                slider.current = itemIndex;
                // mark active item as active
                item.siblings("." + namespace + "item[data-index=" + itemIndex + "]").addClass("active");
            },
            clearActive: function () {
                item.removeClass("active"); // remove previous active states
            },
            resetItemMeasurements: function () {
                var initial_displacement = 0, x = 0, y = slider.current;
                slider.items = {};
                item.each(function (index) {
                    slider.items[index] = {};
                    slider.items[index].width = $(this).outerWidth(true);
                    slider.items[index].height = $(this).outerHeight(true);
                    slider.items[index].displacement = 0;
                });
                for (x = 0; x < item.length; x++) {
                    if (!slider.items.hasOwnProperty(y)) {
                        if (slider.items.hasOwnProperty(y - item.length)) { // try to wrap around
                            y = y - item.length;
                        }
                    }
                    slider.items[y].displacement = initial_displacement;
                    if (slider.vars.orientation === "vertical") {
                        initial_displacement = initial_displacement + slider.items[y].height; // increment initial_displacement: this creates a basic item order
                    } else {
                        initial_displacement = initial_displacement + slider.items[y].width; // increment initial_displacement: this creates a basic item order
                    }
                    y++;
                }
            },
            getActiveItemMeasurements: function () {
                var x;
                for (x = 0; x < item.length; x++) {
                    if (x === slider.current) {
                        slider.activeItemHeight = slider.items[x].height;
                        slider.activeItemWidth = slider.items[x].width;
                    }
                }
            },
            calculateModuleDimensions: function () {
                var x = 0, y = slider.current;
                // reset wrapper and viewport dimensions
                slider.wrapperHeight = 0;
                slider.wrapperWidth = 0;
                slider.viewportWidth = 0;
                slider.viewportHeight = 0;
                // update parent width
                slider.parentWidth = slider.outerWidth(true) - (2 * slider.buttonWidth);
                slider.itemsVisible = slider.vars.visibleItems; // reset this to initial value 
                // start calculating
                if (slider.vars.orientation === "vertical") { // vertical orientation
                    // set wrapper height and viewport/wrapper width
                    for (x = 0; x < item.length; x++) {
                        // add element height to wrapper height
                        slider.wrapperHeight += slider.items[x].height;
                        // if element is wider then viewport width, element width becomes new viewport width
                        if (slider.items[x].width > slider.viewportWidth) {
                            slider.viewportWidth = slider.items[x].width;
                            slider.wrapperWidth = slider.items[x].width;
                        }
                    }
                    // iterate visible items to calculate viewport height
                    // in vertical mode, slider.vars.visibleItems and the visible items are the same
                    for (x = 0; x < slider.vars.visibleItems; x++) {
                        if (!slider.items.hasOwnProperty(y)) {
                            if (slider.items.hasOwnProperty(y - item.length)) { // try to wrap around
                                y = y - item.length;
                            }
                        }
                        slider.viewportHeight += slider.items[y].height;
                        y++; // increment index
                    }
                } else { // horizontal orientation
                    // set wrapper width and viewport/wrapper height
                    for (x = 0; x < item.length; x++) {
                        // add element width to wrapper width
                        slider.wrapperWidth += slider.items[x].width;
                        // if element is taller than viewport_height, element height becomes new viewport height
                        if (slider.items[x].height > slider.viewportHeight) {
                            slider.viewportHeight = slider.items[x].height;
                            slider.wrapperHeight = slider.items[x].height;
                        }
                    }
                    // iterate visible items to calculate viewport width
                    // in horizontal mode, slider.vars.visibleItems and the visible items can be different, if parent div is too small
                    for (x = 0; x < slider.vars.visibleItems; x++) {
                        if (!slider.items.hasOwnProperty(y)) {
                            if (slider.items.hasOwnProperty(y - item.length)) { // try to wrap around
                                y = y - item.length;
                            }
                        }
                        if (!$.isEmptyObject(slider.items)) {
                            if (slider.parentWidth >= slider.viewportWidth + slider.items[y].width) { // parent div is big enough
                                slider.viewportWidth += slider.items[y].width;
                            } else if (slider.activeItemWidth > slider.parentWidth) { // parent div is so small, that not even one item can be displayed!
                                slider.viewportWidth = slider.activeItemWidth; // set viewport to width of active item
                                slider.itemsVisible = 1;
                                x = slider.vars.visibleItems; // break the for loop
                            } else { // parent div is too small, not all items that should be visible can be displayed!
                                slider.itemsVisible = x;
                                x = slider.vars.visibleItems; // break the for loop
                            }
                        }
                        y++; // increment index
                    }
                    // recheck viewport in horizontal mode to only show an odd number of items
                    if (!methods.isOdd(slider.itemsVisible) && slider.itemsVisible > 1 && slider.centerActive !== "off") { // showing an even number of items greater than 1
                        slider.itemsVisible = slider.itemsVisible - 1; // show one item less
                        slider.viewportWidth = 0; // reset viewport width
                        for (x = 0; x < slider.itemsVisible; x++) {
                            slider.viewportWidth += slider.items[x].width;
                        }
                    }
                    // recheck scrollItems 
                    if (slider.vars.scrollItems > slider.itemsVisible) { // never scroll more items than visible
                        slider.scrollItems = slider.itemsVisible;
                    }
                }
            },
            calculateItemDisplacement: function () {
                var displacedItems, x = 0, y = slider.current;
                // reset displacement values
                slider.centerActiveDisplacementIndex = 0;
                slider.centerActiveDisplacement = 0;
                // center active item displacement
                if (!methods.isOdd(slider.itemsVisible)) { // at this point, itemsVisible is odd
                    return false; // something went horribly wrong...
                }
                displacedItems = (slider.itemsVisible - 1) / 2;
                slider.centerActiveDisplacementIndex = displacedItems;
                if (displacedItems > 0) {
                    for (x = 0; x < displacedItems; x++) {
                        if (!slider.items.hasOwnProperty(y)) {
                            if (slider.items.hasOwnProperty(y + item.length)) { // try to wrap around
                                y = y + item.length;
                            } else {
                                return false; // something went horribly wrong...
                            }
                        }
                        if (slider.vars.orientation === "vertical") { // vertical orientation
                            slider.centerActiveDisplacement += slider.items[y].height;
                        } else { // horizontal orientation
                            slider.centerActiveDisplacement += slider.items[y].width;
                        }
                        y = y - 1;
                    }
                }
                // update values for item displacement
                for (x = 0; x < item.length; x++) {
                    if (slider.vars.orientation === "vertical") { // vertical orientation
                        if (slider.items[x].displacement + slider.centerActiveDisplacement >= slider.wrapperHeight) {
                            slider.items[x].displacement = slider.items[x].displacement + slider.centerActiveDisplacement - slider.wrapperHeight; // wrap around
                        } else if (slider.items[x].displacement + slider.centerActiveDisplacement < 0) {
                            slider.items[x].displacement = slider.items[x].displacement + slider.centerActiveDisplacement + slider.wrapperHeight; // wrap around in other direction
                        } else {
                            slider.items[x].displacement = slider.items[x].displacement + slider.centerActiveDisplacement;
                        }
                    } else { // horizontal orientation
                        if (slider.items[x].displacement + slider.centerActiveDisplacement >= slider.wrapperWidth) {
                            slider.items[x].displacement = slider.items[x].displacement + slider.centerActiveDisplacement - slider.wrapperWidth; // wrap around
                        } else if (slider.items[x].displacement + slider.centerActiveDisplacement < 0) {
                            slider.items[x].displacement = slider.items[x].displacement + slider.centerActiveDisplacement + slider.wrapperWidth; // wrap around in other direction
                        } else {
                            slider.items[x].displacement = slider.items[x].displacement + slider.centerActiveDisplacement;
                        }
                    }
                }
            },
            resize: function () { // UnicornSlider: resize
                // reset item measurements
                methods.resetItemMeasurements();
                // active item dimensions
                methods.getActiveItemMeasurements();
                // calculate module dimensions
                methods.calculateModuleDimensions();
                // calculate item displacement
                methods.calculateItemDisplacement();
                // update display mode
                methods.updateDisplayMode();
                // update css
                methods.updateCss();
                // set active
                methods.setActive(slider.current);
                // manage button visibility
                methods.manageButtonVisibility();
            },
            manageButtonVisibility: function () {
                var distance = (slider.itemsVisible - 1) / 2; // get distance to viewport in number of items
                if (slider.wrapAround === true) { // wrap around true: always show buttons
                    prev.css("display", "block");
                    next.css("display", "block");
                } else { // wrap around false: visibilty of buttons depends
                    if (slider.mode === "desktop") { // all items visible => buttons not visible
                        prev.css("display", "none");
                        next.css("display", "none");
                    } else { // not all items visible => we have to do some calculations
                        // check prev button
                        if (slider.current - distance <= 0) {
                            prev.css("display", "none");
                        } else {
                            prev.css("display", "block");
                        }
                        // check next button
                        if (slider.current + distance >= item.length - 1) {
                            next.css("display", "none");
                        } else {
                            next.css("display", "block");
                        }
                    }
                }
            },
            updateDisplayMode: function () {
                if (slider.vars.orientation === "vertical") {
                    if (slider.viewportHeight === slider.wrapperHeight) {
                        slider.mode = "desktop";
                    } else {
                        slider.mode = "mobile";
                    }
                } else {
                    if (slider.viewportWidth === slider.wrapperWidth) {
                        slider.mode = "desktop";
                    } else {
                        slider.mode = "mobile";
                    }
                }
            },
            keydownHandler: function(event) {
                switch (event.which) {
                    case 37: // left
                    case 38: // up
                        methods.animateToTarget("prev");
                        break;
                    case 39: // right
                    case 40: // down
                        methods.animateToTarget("next");
                        break;
                    default:
                        return; // exit this handler for other keys
                }
            },
            isOdd: function (num) {
                return (num % 2) === 1;
            },
            sanitizeConfiguration: function () {
                // checking easing option
                if (!$.easing.hasOwnProperty(slider.vars.easing)) { // selected easing option not found 
                    slider.vars.easing = slider.defaultEasing;
                }
                // checking visible items
                if (slider.vars.visibleItems > item.length) { // number of visible elements can not be higher than total number of list elements
                    slider.vars.visibleItems = item.length;
                    slider.itemsVisible = item.length;
                }
                if (slider.vars.visibleItems <= 0) { // number of visible items can not be lower then 1
                    slider.vars.visibleItems = 1;
                    slider.itemsVisible = 1;
                }
                // check centerActive
                if (slider.vars.centerActive === "on" || slider.vars.centerActive === "off" || slider.vars.centerActive === "mobile" || slider.vars.centerActive === "desktop") {
                    slider.centerActive = slider.vars.centerActive;
                }
                // restrain visible items to an odd number and center active is somehow enabled
                if (!methods.isOdd(slider.vars.visibleItems) && slider.centerActive !== "off") {
                    slider.vars.visibleItems = slider.vars.visibleItems - 1;
                    slider.itemsVisible = slider.vars.visibleItems;
                }
                // checking start from number
                if (slider.vars.startFrom >= (item.length) || (slider.vars.startFrom < 0)) { // startFrom number can not be higher than total number of list elements
                    slider.vars.startFrom = 0;
                    slider.current = 0;
                }
                // checking animation method
                if (typeof Modernizr !== "undefined") { // Modernizr is used
                    if (Modernizr.csstransitions === true) { // css animations are supported
                        slider.animationMethod = "css"; // use css transitions
                    }
                } else { // use own method of detecting if browser is ready for css transitions
                    if (methods.supportsTransitions()) {
                        slider.animationMethod = "css"; // use css transitions
                    }
                }
                // checking touch support
                if (typeof Modernizr !== "undefined") { // Modernizr is used
                    if (Modernizr.touchevents === true) { // touch events are supported
                        slider.touchEnabled = true; // use touch events
                    }
                } else { // use own method of detecting if browser is ready for touch events
                    if (methods.supportsTouchEvents()) {
                        slider.touchEnabled = true; // use touch events
                    }
                }
                // checking wrap around value
                if ((slider.vars.wrapAround !== true) && (slider.vars.wrapAround !== false)) {
                    slider.wrapAround = true;
                }
                // check animation speed and animation method
                if ((slider.vars.speed !== 0) && (slider.animationMethod === "css")) { // animation speed is not default value and animation method is css
                    viewport.css("-webkit-transition-duration", (parseInt(slider.vars.speed) / 1000) + "s").css("-moz-transition-duration", (parseInt(slider.vars.speed) / 1000) + "s").css("-o-transition-duration", (parseInt(slider.vars.speed) / 1000) + "s").css("transition-duration", (parseInt(slider.vars.speed) / 1000) + "s");
                }
                // check scroll items
                if (slider.scrollItems > slider.itemsVisible) { // never scroll more items than visible
                    slider.scrollItems = slider.itemsVisible;
                }
            },
            unregisterEventHandlers: function () {
                // unregister all eventHandlers
                slider.off("keydown", methods.keydownHandler);
                next.off("click touchend", methods.next);
                prev.off("click touchend", methods.prev);
                item.off("click touchend", methods.activate);
                viewport.off("touchstart", methods.touchStart);
                viewport.off("touchmove", methods.touchMove);
                viewport.off("touchend", methods.touchEnd);
                $(window).off("resize orientationchange focus", methods.resize);
            },
            registerEventHandlers: function () {
                // arrow keys for accessibility
                slider.on("keydown", methods.keydownHandler);
                // next and prev buttons
                next.on("click touchend", methods.next);
                prev.on("click touchend", methods.prev);
                // active item centering
                item.on("click touchstart touchend", methods.activate);
                // touch events
                if (slider.touchEnabled === true) {
                    viewport.on("touchstart", methods.touchStart);
                    viewport.on("touchmove", methods.touchMove);
                    viewport.on("touchend", methods.touchEnd);
                }
                // resize events
                $(window).on("resize orientationchange focus", methods.resize);
            },
            supportsTouchEvents: function() {
                // source: http://stackoverflow.com/questions/4817029/whats-the-best-way-to-detect-a-touch-screen-device-using-javascript/4819886#4819886
                try {
                    document.createEvent("TouchEvent");
                    return true;
                } catch (event) {
                    return false;
                }
            },
            supportsTransitions: function () {
                // source: http://stackoverflow.com/questions/7264899/detect-css-transitions-using-javascript-and-without-modernizr
                var b = document.body || document.documentElement,
                        s = b.style,
                        p = 'transition';
                if (typeof s[p] === 'string') {
                    return true;
                }
                // Tests for vendor specific prop
                var v = ['Moz', 'webkit', 'Webkit', 'Khtml', 'O', 'ms'];
                p = p.charAt(0).toUpperCase() + p.substr(1);
                for (var i = 0; i < v.length; i++) {
                    if (typeof s[v[i] + p] === 'string') {
                        return true;
                    }
                }
                return false;
            },
            updateCss: function () { // update dimensions
                wrapper.css("width", slider.wrapperWidth).css("height", slider.wrapperHeight);
                item.each(function (index) {
                    if (slider.vars.orientation === "vertical") {
                        $(this).css("top", slider.items[index].displacement);
                    } else {
                        $(this).css("left", slider.items[index].displacement);
                    }
                });
                viewport.css("width", slider.viewportWidth).css("height", slider.viewportHeight);
                if (slider.vars.orientation === "vertical") { // vertical orientation
                    slider.css("min-height", slider.viewportHeight).css("width", slider.activeItemWidth);
                } else { // horizontal orientation
                    slider.css("min-width", slider.activeItemWidth + (2 * slider.buttonWidth));
                    if (slider.leanWrapper === true) {
                        slider.css("max-width", slider.viewportWidth + (2 * slider.buttonWidth));
                    }
                }
            },
            log: function (text) { // log 
                if (slider.vars.debug !== true) {
                    return false;
                }
                if (!text) {
                    text = "undefined";
                }
                if (window.console) {
                    if (console.log && typeof console.log === "function") {
                        console.log(text);
                    }
                }
            },
            next: function (event) {
                event.preventDefault();
                slider.vars.button(slider); // button() Callback
                methods.animateToTarget("next");
                methods.log("unicornslider animate to next");
            },
            prev: function (event) {
                event.preventDefault();
                slider.vars.button(slider); // button() Callback
                methods.animateToTarget("prev");
                methods.log("unicornslider animate to prev");
            },
            calculateMinimalDelta: function (target) {
                var delta = Math.abs(slider.current - target);
                if (Math.abs((slider.current + item.length) - target) < delta) {
                    delta = Math.abs((slider.current + item.length) - target);
                } else if (Math.abs(slider.current - (target + item.length)) < delta) {
                    delta = Math.abs(slider.current - (target + item.length));
                }
                return delta;
            },
            getTarget: function (target) {
                if ((target === "next") || (target === "down")) { // get next item
                    slider.direction = "next";
                    if (slider.current + slider.scrollItems <= item.length) {
                        return slider.current + slider.scrollItems; // everything ok, just increment current by number of items to scroll
                    } else {
                        return (slider.current + slider.scrollItems) - item.length; // return difference
                    }
                } else if ((target === "prev") || (target === "up")) { // get previous item
                    slider.direction = "prev";
                    if (slider.current - slider.scrollItems >= 0) {
                        return slider.current - slider.scrollItems; // everything ok, just decrement current
                    } else {
                        return item.length - Math.abs(slider.current - slider.scrollItems); // return difference
                    }
                } else if (methods.isInt(target)) { // animate to target
                    // do some sanitizing stuff  
                    if ((target >= 0) && (target < item.length)) { // is target valid?
                        var delta = methods.calculateMinimalDelta(target);
                        if (((0 > (slider.current - delta)) && (2 * delta < item.length) && (slider.current + delta !== target) && (target > slider.current)) || ((target < slider.current) && (0 <= slider.current - delta) && (slider.current - delta === target))) {
                            slider.direction = "prev";
                        } else {
                            slider.direction = "next";
                        }
                        return target;
                    } else { // target is no valid int, do some calculation to get some sense in that target
                        target = target % (item.length);
                        if (target < 0) {
                            target = item.length - target;
                        }
                        if (target < slider.current) {
                            slider.direction = "prev";
                        } else {
                            slider.direction = "next";
                        }
                        return target;
                    }
                } else { // target is complete bogus, return first item
                    return 0;
                }
            },
            isInt: function (value) {
                return (typeof value === 'number') && (value % 1 === 0);
            },
            touchStart: function (event) {
                /*if (event.originalEvent.touches === undefined) {
                    var touch = event;
                } else {
                    var touch = event.originalEvent.touches[0] || event.originalEvent.changedTouches[0];
                }
                slider.mm.startX = touch.pageX;
                slider.mm.startY = touch.pageY;
                slider.mm.startTime = new Date().getTime();
                slider.mm.dragging = true;
                // create clones
                methods.createClones();
                // disable css animation for wrapper
                if(slider.animationMethod === "css") {
                    wrapper.css("-webkit-transition-duration", "").css("-moz-transition-duration", "").css("-o-transition-duration", "").css("transition-duration", "");
                }
                event.preventDefault();*/
            },
            touchMove: function (event) {
                /*
                if (event.originalEvent.touches === undefined) {
                    var touch = event;
                } else {
                    var touch = event.originalEvent.touches[0] || event.originalEvent.changedTouches[0];
                }
                slider.mm.moveX = touch.pageX;
                slider.mm.moveY = touch.pageY;
                slider.mm.moveTime = new Date().getTime();
                // precalculate displacement
                var calcY = slider.mm.moveY - slider.mm.startY;
                var calcX = slider.mm.moveX - slider.mm.startX;
                // keep in bounding
                if ((calcY > 0) && (calcY > slider.wrapperHeight)) {
                    calcY = slider.wrapperHeight;
                }
                if ((calcY < 0) && (calcY < -slider.wrapperHeight)) {
                    calcY = 0 - slider.wrapperHeight;
                }
                if ((calcX > 0) && (calcX > slider.wrapperWidth)) {
                    calcX = slider.wrapperWidth;
                    console.log("calcX: " + calcX + ", wrapper: " + slider.wrapperWidth);
                }
                if ((calcX < 0) && (calcX < -slider.wrapperWidth)) {
                    calcX = 0 - slider.wrapperWidth;
                    console.log("calcX: " + calcX + ", wrapper: " + slider.wrapperWidth);
                }
                // displace wrapper here
                if (slider.vars.orientation === "vertical") { // displace vertical
                    wrapper.css("margin-top", calcY );
                } else { // displace horizontal
                    wrapper.css("margin-left", calcX );
                }
                event.preventDefault();*/
            },
            touchEnd: function (event) {
                /*slider.mm.dragging = false;
                if (event.originalEvent.touches === undefined) {
                    var touch = event;
                } else {
                    var touch = event.originalEvent.touches[0] || event.originalEvent.changedTouches[0];
                }
                slider.mm.endX = touch.pageX - slider.mm.startX;
                slider.mm.endY = touch.pageY - slider.mm.startY;
                slider.mm.endTime = new Date().getTime() - slider.mm.startTime;
                // enable css animtion of wrapper
                if ((slider.vars.speed !== 0) && (slider.animationMethod === "css") && (slider.touchEnabled === true)) {
                    wrapper.css("-webkit-transition-duration", (parseInt(slider.vars.speed) / 1000) + "s").css("-moz-transition-duration", (parseInt(slider.vars.speed) / 1000) + "s").css("-o-transition-duration", (parseInt(slider.vars.speed) / 1000) + "s").css("transition-duration", (parseInt(slider.vars.speed) / 1000) + "s");
                }
                // animate items
                if (slider.animationMethod === "css") { // use css transitions
                    if (slider.vars.orientation === "vertical") {
                        wrapper.css("margin-top", 0); // set new value for margin-top
                    } else {
                        wrapper.css("margin-left", 0); // set new value for margin-left
                    }
                    setTimeout(function () {
                        methods.cleanUp();
                    }, slider.vars.speed);
                } else { // use jQuery animation
                    if (slider.vars.orientation === "vertical") {
                        wrapper.animate({"margin-top": 0}, slider.vars.speed, slider.vars.easing, function () {
                            methods.cleanUp();
                        }); // animate wrapper
                    } else {
                        wrapper.animate({"margin-left": 0}, slider.vars.speed, slider.vars.easing, function () {
                            methods.cleanUp();
                        }); // animate wrapper
                    }
                }
                
                // calculate threshold to animate to item
                if (slider.vars.orientation === "vertical") {
                    if (slider.mm.endY < -slider.mm.swipeTreshold && slider.mm.endTime < slider.mm.allowedTime) {
                        // can scroll forth on swipe only if startFrom < num_items
                        if (slider.itemsVisible + slider.current < item.length) {
                            methods.next();
                        }
                    }
                    else if (slider.mm.endY > slider.mm.swipeTreshold && slider.mm.endTime < slider.mm.allowedTime) {
                        // can scroll back on swipe only if startFrom > 0
                        if (slider.itemsVisible > 0) {
                            methods.prev();
                        }
                    }
                } else {
                    
                    if (slider.mm.endX < -slider.mm.swipeTreshold && slider.mm.endTime < slider.mm.allowedTime) {
                        // can scroll forth on swipe only if startFrom < num_items
                        if (slider.itemsVisible + slider.current < item.length) {
                            methods.next();
                        }
                    } else if (slider.mm.endX > slider.mm.swipeTreshold && slider.mm.endTime < slider.mm.allowedTime) {
                        // can scroll back on swipe only if startFrom > 0
                        if (slider.current > 0) {
                            methods.prev();
                        }
                    }
                }
                event.preventDefault();*/
            },
            setup: function () {
                // save clone in var
                slider.oldHtml = slider.clone();
                // create the parts of unicornslider
                wrapper = slider.clone().find("ul").addClass(namespace + "wrapper");
                viewport = $("<div></div>").addClass(namespace + "viewport");
                item = wrapper.find("li").addClass(namespace + "item");
                prev = $('<a></a>').addClass(namespace + "prev").attr("href", "#").css("height", slider.buttonHeight).css("width", slider.buttonWidth).html(slider.vars.prevText);
                next = $('<a></a>').addClass(namespace + "next").attr("href", "#").css("height", slider.buttonHeight).css("width", slider.buttonWidth).html(slider.vars.nextText);
                navPrev = $("<li></li>").addClass(namespace + "nav-prev");
                navNext = $("<li></li>").addClass(namespace + "nav-next");
                if (slider.vars.orientation === "vertical") { // vertical orientation
                    prev.css("margin-left", "-" + Math.round(slider.buttonWidth / 2) + "px");
                    next.css("margin-left", "-" + Math.round(slider.buttonWidth / 2) + "px");
                    navPrev.css("height", slider.buttonHeight);
                    navNext.css("height", slider.buttonHeight);
                } else { // horizontal orientation
                    prev.css("margin-top", "-" + Math.round(slider.buttonHeight / 2) + "px");
                    next.css("margin-top", "-" + Math.round(slider.buttonHeight / 2) + "px");
                    navPrev.css("width", slider.buttonWidth);
                    navNext.css("width", slider.buttonWidth);
                }
                nav = $("<ul></ul>").addClass(namespace + "nav").attr("aria-hidden", true).append(navPrev.append(prev)).append(navNext.append(next));
                // put it all together
                viewport.append(wrapper);
                slider.empty().addClass("unicornslider").attr("tabindex", 0).addClass(slider.style).append(viewport).append(nav); // clear out container
            },
            destroy: function () {
                // append old cloned version
                slider.oldHtml.insertAfter(slider);
                // unregisterEventHandlers
                slider.methods.unregisterEventHandlers();
                // remove data
                slider.removeData('unicornslider');
                // remove original version  
                slider.remove();
                // log: SliderMenu destroyed   
                methods.log("UnicornSlider destroyed");
                // SliderMenu: destroyed() Callback
                slider.vars.destroyed(slider);
            },
            activate: function (event) {
                var target = $(event.target).closest("." + namespace + "item[data-index]");
                var targetIndex = parseInt(target.attr("data-index"), 10);
                if (targetIndex === slider.current) { // click on active item -> do nothing
                    return true;
                }
                if ((slider.centerActive === "off") || (slider.mode === "mobile" && slider.centerActive === "desktop") || (slider.mode === "desktop" && slider.centerActive === "mobile")) { // if centerActive is disabled: return
                    return true;
                }
                methods.animateToTarget(targetIndex);
                methods.log("unicornslider animate to " + targetIndex);
            }
        };

        // public methods
        slider.animate = function (target) {
            methods.log("unicornslider animate to " + target);
            methods.animateToTarget(target);
        };
        slider.next = function () {
            methods.log("unicornslider animate to next");
            methods.animateToTarget("next");
        };
        slider.prev = function () {
            methods.log("unicornslider animate to prev");
            methods.animateToTarget("prev");
        };
        slider.resize = function () {
            methods.log("unicornslider resizing");
            methods.resize();
        };
        slider.destroy = function () {
            methods.log("unicornslider destroy");
            methods.destroy();
        };

        // UnicornSlider: Initialize
        methods.init();
    };

    // UnicornSlider: defaults
    $.unicornslider.defaults = {
        debug: false,                   // Boolean: Debug mode
        wrapAround: true,               // Boolean: Show arrows across borders
        leanWrapper: false,             // Boolean: Shrink wrapper to minmal size

        orientation: "horizontal",      // String: Select the animation direction, "horizontal" or "vertical"
        namespace: "unicornslider-",    // String: Prefix string attached to the class of every element generated by the plugin
        easing: "swing",                // String: Determines the easing method used in jQuery transitions. jQuery easing plugin is supported!
        prevText: "prev",               // String: Will be inserted in prev tag
        nextText: "next",               // String: Will be inserted in next tag
        style: "",                      // String: Additional class for style in parent element
        centerActive: "on",             // String: Select if active element is centered, "off", "mobile", "desktop" or "on"

        scrollItems: 1,                 // Integer: Number of items to scroll on button click
        buttonHeight: 50,               // Integer: Height of button element in px
        buttonWidth: 50,                // Integer: Width of button element in px
        visibleItems: 1,                // Integer: The number of items visible 
        speed: 1000,                    // Integer: Animation speed in Milliseconds
        startFrom: 0,                   // Integer: The item active on init
        // Callback API
        init: function () {},           // Function: Callback function that fires on init done
        button: function () {},         // Function: Callback function that fires on button "prev" or "next" before button click is processed
        animationStart: function () {}, // Function: Callback function that fires on animation started
        animationEnd: function () {},   // Function: Callback function that fires on animation ended
        destroyed: function () {}       // Function: Callback function that fires on slider destroyed
    };

    // UnicornSlider: Plugin Function
    $.fn.unicornslider = function (options) {
        if (options === undefined) {
            options = {};
        }
        if (typeof options === "object") {
            return this.each(function () {
                var $this = $(this);
                if ($this.data('unicornslider') === undefined) {
                    new $.unicornslider(this, options);
                }
            });
        } else {
            // Helper strings to quickly perform functions on slider
            var $slider = $(this).data('unicornslider');
            switch (options) {
                case "start":
                    $slider.start();
                    break;
                case "stop":
                    $slider.stop();
                    break;
                case "destroy":
                    $slider.destroy();
                    break;
                case "next":
                case "down":
                    $slider.next();
                    break;
                case "prev":
                case "up":
                    $slider.prev();
                    break;
                default:
                    if (typeof options === "number") {
                        $slider.animate(options); // animate to target index directly
                    }
                    break;
            }
        }
    };
})(jQuery);