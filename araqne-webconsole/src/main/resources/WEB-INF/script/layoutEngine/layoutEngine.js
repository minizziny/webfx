Array.prototype.insert = function(item, idx) {
	this.splice(idx, 0, item);
}

Array.prototype.removeAt = function(idx) {
	this.splice(idx, 1);
}

Array.prototype.first = function() {
	return this[0];
}

Array.prototype.last = function() {
	return this.slice(-1)[0];
}

function hasClassIndexOf(s, klass) {
	return ("" + s).split(" ").indexOf(klass) >= 0;
}

console.logdash = function() {}

function findElementsByCoordinate(classArr, e, els) {
	if(els === undefined) els = [];
	
	var found_el = document.elementFromPoint(e.clientX, e.clientY);
	if(found_el == null) return els;
	
	if(els.indexOf(found_el) >= 0) return els;
	
	var gotcha = false;
	
	var original_zidx;
	
	$.each(classArr, function(i, className) {
		if(hasClassIndexOf(found_el.className, className)) {
		//if(found_el.className == className) {
			original_zidx = found_el.style.zIndex;
			found_el.style.zIndex = -original_zidx;
			
			if(classArr.length - 1 === i) {
				els.push(found_el);
			}
			
			gotcha = true;
		}
	});
	
	if(gotcha) {
		findElementsByCoordinate(classArr, e, els);
		found_el.style.zIndex = original_zidx;
	}
	
	return els;
}


var layoutEngine = (function() {
	function namespace(string) {
		var object = this;
		var levels = string.split(".");

		for (var i=0, l = levels.length; i<l; i++) {
			if(typeof object[levels[i]] == "undefined") {
				object[levels[i]] = {};
			}

			object = object[levels[i]];
		}
		return object;
	}

	function extend(inherit, extend, constrction) {
		var parent = extend.create(constrction);
		inherit.prototype = parent;
		return parent;
	}

	function log(str) {
		$("<div>").text(str).prependTo(logger);
	}

	var logger = $("<div>").css("top","0")
		.css("left","0")
		.css("position","fixed")
		.height(200)
		.css("width","100%")
		.css("z-index", "9999")
		.css("background","white")
		.css("border","1px solid red")
		.css("-webkit-overflow-scrolling", "touch")
		.css("overflow", "scroll")
		//.appendTo("body");


	return {
		namespace: namespace,
		extend: extend,
		log: log
	}
}());

(function() {

	var resizable = layoutEngine.namespace("ui.resizable");

	function Resizable(prop) {
		var el = this.el = prop.el;
		var that = this;

		if(!!prop.resizer) {
			if(typeof prop.resizer != 'object' || prop.resizer.constructor != Array) {
				throw new TypeError("resizer cannot init");
			}

			// top, right, bottom, left
			if(prop.resizer[1]) {
				var ree = $("<div>").addClass("k-rs-r").appendTo(el);
				handleResizer(that, ree);
				that.resizerH = ree;
			}

			if(prop.resizer[2]) {
				var ree = $("<div>").addClass("k-rs-b").appendTo(el);
				handleResizerV(that, ree);
				that.resizerV = ree;
			}
		}

		this.is = "resizable";
		
		this.onResize = function(oldval, newval) {
			if(!!prop.onResize) {
				return prop.onResize.apply(this, arguments);
			}
		};

		this.afterResize = function() {
			if(!!prop.afterResize) {
				prop.afterResize.apply(this, arguments);
			}
		};

		this.resize = function(w, h) {
			el = that.el;

			if(w !== undefined) {
				var oldw = el.width();

				if(typeof w == "string") {
					el.css("width", w);
				}
				else {
					if( this.onResize(oldw, w, null, null) ) {
						el.width(w);
					}
				}
			}

			if(h !== undefined) {
				var oldh = el.height();

				if(typeof h == "string") {
					el.css("height", h);
				}
				else {
					if( this.onResize(null, null, oldh, h) ) {
						el.height(h);
					}
				}
			}
		};

		var _super = layoutEngine.extend(Resizable, CustomEvent, this);
	}

	function handleResizerV(sender, el) {
		var originy, originh;

		el.on("mousedown", function(e) {
			$(document).on("selectstart", function() { return false; });
			originy = e.clientY;
			originh = sender.el.height();

			// dock panel
			var parent = sender.el.parent();
			var sy;

			if(sender.el.prev().length > 0) {
				sy = sender.el.offset().top - $(window).scrollTop();
			}
			else {
				sy = parent.offset().top - $(window).scrollTop();
			}
			
			var rows = parent.children(".k-d-row");

			$.each(rows, function(i, el) {
				var px = $(el).height();

				$(el).height(px);
			});
			var maxheight = sender.el.nextAll('.k-d-row:first').height();
			// end

			$(document).on('mousemove.resizeV', function(e) {
				var dy = e.clientY - originy;

				if(-dy > originh - 10) {}
				else if(dy > maxheight - 10) {}
				else {
					sender.resize(undefined, originy + dy - sy);
				}
			});

			$(document).on('mouseup.resizeV', function() {

				// dockpanel
				var parenth = parent.height();
				$.each(rows, function(i, el) {
					var px = $(el).height();
					// var perc = Math.round(px / parenth * 100);
					var perc = (px / parenth * 100);

					$(el).css("height", perc.toString() + "%");

					el.obj.obj.h = perc;
					//console.logdash(el.obj);
					//console.logdash(perc + "%\t" + i + "/" + rows.length);
				});
				// end

				if(e.delegateTarget.releaseCapture) { e.delegateTarget.releaseCapture(); }
				$(document).off('mousemove.resizeV').off('mouseup.resizeV').off("selectstart");;
				sender.afterResize(sender);
			});

			if(e.delegateTarget.setCapture) { e.delegateTarget.setCapture(); }
		});
	}

	function handleResizer(sender, el) {
		var originx, originw;

		el.on("mousedown", function(e) {
			$(document).on("selectstart", function() { return false; });
			originx = e.pageX;
			originw = sender.el.width();

			// dock panel로 옮겨야함
			var parent = sender.el.parent();
			parent.width(parent.width());
			var rows = parent.children(".k-d-col");
			var totalpx = 0;
			$.each(rows, function(i, el) {
				var px = $(el).width();
				totalpx = totalpx + px;
				if(totalpx > parent.width()) {
					$(el).width(px - 2);
				}
				else {
					$(el).width(px);
				}
			});
			var maxwidth = sender.el.nextAll('.k-d-col:first').width();
			// end

			$(document).on('mousemove.resizeH', function(e){
				var dx = e.pageX - originx;
				
				if(-dx > originw - 50) {}
				else if(dx > maxwidth - 50) {}
				else {
					sender.resize(originw + dx);
				}
			});

			$(document).on('mouseup.resizeH', function() {

				// dock panel 로 옮겨야 함
				var parentw = parent.width();
				var totalwper = 0;
				$.each(rows, function(i, el) {
					var px = $(el).width();
					// var perc = Math.round(px / parentw * 100);
					var perc = px / parentw * 100;

					$(el).css("width", perc.toString() + "%");

					el.obj.obj.w = perc;
					//console.logdash(el.obj);
					console.logdash(perc + "%\t" + i + "/" + rows.length)
					totalwper = totalwper + perc;

					if(totalwper < 100 && i == rows.length - 1) {
						console.logdash(totalwper, 'arranged!');
					}
				});
				console.logdash(totalwper)
				parent.css('width', '');
				// end

				if(e.delegateTarget.releaseCapture) { e.delegateTarget.releaseCapture(); }
				$(document).off('mousemove.resizeH').off('mouseup.resizeH').off("selectstart");;
				sender.afterResize(sender);
			});

			if(e.delegateTarget.setCapture) { e.delegateTarget.setCapture(); }
		});
	}

	layoutEngine.ui.resizable = Resizable;

	layoutEngine.ui.resizable.create = function(prop) {
		return new Resizable(prop);
	}

	CustomEvent.create = function(obj) {
		return new CustomEvent(obj);
	}

})();

(function() {
	var _box = layoutEngine.namespace("ui.layout.box");

	_box.allboxes = [];
	
	function Row(prop, options) {
		var that = this;
		var el = this.el = $("<div>").addClass("k-d-row");
		var obj = this.obj = $.extend({}, prop); // object copy

		el[0].obj = this;
		this.boxes = new ObservableArray([]);

		this.getObject = function() {
			return {
				'cols': (function() {
					return that.boxes.map(function(box) {
						return box.getObject();
					});
				}()),
				'h': this.obj.h
			}
		}

		this.boxes.onItemAdded = function() {
			options.onModify(that);
		} 
		// this.boxes.onItemSet = _box.event.modify;
		this.boxes.onItemRemoved = function() {
			options.onModify(that);
		} 

		this.getMinHeight = function() {
			var settingMinh = 30;
			var checkable = this.boxes.some(function(box) {
				return box.rows.length > 0;
			});

			if(!checkable) {
				return settingMinh;
			}
			else {
				var gminh = settingMinh;
				this.boxes.forEach(function(box, i) {
					var minh = 0;
					box.rows.forEach(function(row, j) {
						if(settingMinh < row.getMinHeight()) {
							minh = minh + row.getMinHeight();
						}
						else {
							minh = minh + settingMinh;
						}
					});
					if(gminh < minh) {
						gminh = minh;
					}
				});
				return gminh;
			}
		}

		this.appendTo = function(box) {
			this.box = box;
			el.appendTo(box.el);
			box.rows.push(that);
		}
		
		this.insertAt = function(box, order) {

			if(this.boxes[order] === undefined) {
				this.boxes[order - 1].el.after(box.el);
				this.boxes.insert(box, order);
				box.row = this;
			}
			else {
				this.boxes[order].el.before(box.el);
				this.boxes.insert(box, order);
				box.row = this;
			}
			
			//calculateWidth(this, true, undefined, box.obj.w);
		}

		this.append = function(box) {
			box.row = this;
			this.boxes.push(box);
			el.append(box.el);
			
			calculateWidth(this, true, undefined, box.obj.w);
		}
		
		function draw() {
			el.css("height", prop.h + "%");
		}

		function calculateWidth(row, isadd, addidx, addboxw) {
			// add box
			if(isadd) {
				var computedboxw;

				if(addidx == undefined) {
					computedboxw = Math.floor(100 / (row.boxes.length));
				}
				else {
					computedboxw = row.boxes[addidx].obj.w
				}

				if(addboxw != undefined) {
					computedboxw = addboxw;
				}

				var totalper = 0;
				for (var i = 0; i < row.boxes.length - 1; i++) {
					var box = row.boxes[i];
					if(addidx == undefined) {
						box.resize(Math.floor((100 - computedboxw) * box.obj.w / 100), false);
					}
					else {
						if(i != addidx) {
							box.resize(Math.floor((100 - computedboxw) * box.obj.w / 100), false);
						}
					}

					totalper = totalper + box.obj.w;
				}

				row.boxes[row.boxes.length - 1].resize(100 - totalper, false);
			}
			// remove box
			else {
				
				var total = 0;
				for (var i = 0; i < row.boxes.length; i++) {
					var box = row.boxes[i];
					
					if(box.obj.w === undefined) {
						box.obj.w = 100;
					}
					
					total = total + box.obj.w;
				}

				var totalper = 0;
				for (var i = 0; i < row.boxes.length; i++) {
					var box = row.boxes[i];

					var neww = Math.floor(100 * box.obj.w / total);
					box.resize(neww, false);

					totalper = totalper + neww;


					if(i + 1 == row.boxes.length) {
						box.resizerH.hide();
					}
					else {
						box.resizerH.show();
					}
				}
				
				var lastbox = row.boxes[row.boxes.length - 1];
				lastbox.resize(lastbox.obj.w + 100 - totalper, false);
			}
		}

		// override
		this.resize = function(h, bubble) {
			if(bubble === undefined) {
				bubble = true;
			}

			_super.resize.call(el, undefined, h + "%");
			
			if(bubble) {
				var nextrow, nextel = el.next();
				var prevrow, prevel = el.prev();

				if(nextel.length > 0) {
					nextrow = nextel[0].obj;
					nextrow.resize(nextrow.obj.h + obj.h - h, false);
				}
				else {
					if(prevel.length > 0) {
						prevrow = el.prev()[0].obj;
						prevrow.resize(prevrow.obj.h + obj.h - h, false);
					}
				}
			}
			
			obj.h = h;
		}

		this.close = function() {
			this.box.deleteRow(this);
		}

		this.deleteBox = function(box) {
			
			var idx = box.row.boxes.indexOf(box);
			
			box.resize(0, false);
			box.el.remove();
			
			box.row.boxes.removeAt(idx);

			var allidx = layoutEngine.ui.layout.box.allboxes.indexOf(box);
			layoutEngine.ui.layout.box.allboxes.removeAt(allidx);
			
			// console.logdash('deleteBox',box)
			if(box.row.boxes.length === 0) {
				box.row.close();
				
			}
			else {
				calculateWidth(box.row, false);

				if(box.row.boxes.length === 1) {
					setTimeout(function() {
						if(box.row.boxes[0].rows.length != 0) {
							unwrapBox(box.row.boxes[0]);
						}
					}, 200)
				}
			}
		}

		function unwrapBox(box) {
			console.logdash('unwrapBox');
			
			var prow = box.row;
			var prowh = box.row.obj.h;
			var urows = box.rows;
			var pbox = box.row.box;

			if(box.obj.w === 100) {
				// row append to parent box
				// get parent row's index
				var prowIndex = pbox.rows.indexOf(prow);

				for (var i = urows.length - 1; i >= 0; i--) {
					urows[i].obj.h = urows[i].obj.h * prowh * 0.01;
					pbox.insert(urows[i], prowIndex);
				};

				box.close();
			}

		}

		draw();

		var _super = layoutEngine.extend(Row, layoutEngine.ui.resizable, {
			"el": el,
			"resizer": [false, false, true, false],
			"onResize": function(oldx, newx, oldy, newy) {
				var nextel = $(el).nextAll('.k-d-row:first');
				var nextrow = nextel[0].obj;
				var originh = nextel.height();
				var dy = newy - oldy;
				// console.logdash(that.getMinHeight(), newy, nextrow.getMinHeight(), originh - dy, originh )
				var can = (that.getMinHeight() < newy) && (nextrow.getMinHeight() < originh - dy);
				if(can) {
					if(nextel.length > 0) {
						nextel.height(originh - dy);
					}
				}
				return can;
			},
			"afterResize": function() {
				return options.onResize(null, that.box)
			}
		});

		this.resizerV = $(el.find('.k-rs-b')[0]);
	}

	function Box(prop, options) {
		var that = this;
		var el = this.el = $("<div>").addClass("k-d-col");
		var obj = this.obj = $.extend({}, prop); // object copy

		this.guid = obj.guid;
		el[0].obj = this;

		this.getObject = function() {
			if(this.rows.length == 0) {
				var o = {
					'guid': this.guid,
					'w': this.obj.w,
				}
				if(this.obj.hasOwnProperty('droppable')) {
					o['droppable'] = this.obj.droppable;
				}
				if(this.obj.hasOwnProperty('dragHandler')) {
					o['dragHandler'] = this.obj.dragHandler;
				}

				return o;
			}
			else {
				var o = {
					'guid': this.guid,
					'rows': (function() {
						return that.rows.map(function(row) {
							return row.getObject();
						});
					}()),
					'w': this.obj.w
				}

				if(this.obj.hasOwnProperty('droppable')) {
					o['droppable'] = this.obj.droppable;
				}
				if(this.obj.hasOwnProperty('dragHandler')) {
					o['dragHandler'] = this.obj.dragHandler;
				}

				return o;
			}
		}

		this.rows = new ObservableArray([]);

		this.rows.onItemAdded = function() {
			options.onModify(that);
		}
		// this.rows.onItemSet = _box.event.modify;
		this.rows.onItemRemoved = function() {
			options.onModify(that);
		}
		
		this.getMinWidth = function() {
			var settingMinw = 150;
			if( this.rows.length == 0) {
				return settingMinw;
			}
			else {
				var gminw = settingMinw;
				this.rows.forEach(function(row) {
					var minw = 0;
					row.boxes.forEach(function(box) {
						if(minw < box.getMinWidth()) {
							minw = box.getMinWidth();
						}
						else {
							minw = minw + settingMinw;
						}
					});
					if(gminw < minw) {
						gminw = minw;
					}
				})
				return gminw;
			}
		}

		this.findBox = function(guid) {
			var found;

			for (var i = 0; i < that.rows.length; i++) {
				if(found != null) {
					break;
				}

				var boxes = that.rows[i].boxes;

				for (var j = 0; j < boxes.length; j++) {
					if(boxes[j].guid == guid) {
						found = boxes[j];
					}
					else {
						found = boxes[j].findBox(guid)
					}

					if(found != null) {
						break;
					}
				};
			};

			return found;
			/*

			return;

			var box, i = 0;
			var allboxes = layoutEngine.ui.layout.box.allboxes;

			while(box == undefined) {
				if(allboxes[i].guid === guid) {
					box = allboxes[i];
				}
				else {
					i++;
				}
			}
			return box;
			*/
		}

		this.appendTo = function(row_or_el, no_root) {
			
			if(row_or_el instanceof jQuery || typeof row_or_el === 'string') {
				var selector = row_or_el;
				$(selector).empty();
				el.appendTo(selector);
				
				// clear all settings
				if(!no_root) {
					console.log('set root');
					layoutEngine.ui.layout.box.root = that;	
					// _box.event.modify(that);
				}
			}
			else {
				var row = row_or_el;
				that.row = row;
				el.appendTo(row.el);
				row.boxes.push(that);
			}

			return el;
		}

		this.prepend = function(row) {
			//that.row = row; // bug fixed! do not change context
			el.prepend(row.el);
			row.box = that;
			row.box.rows.insert(row, 0);
		}
		
		this.insert = function(row, idx) {
			if(idx === 0) {
				this.prepend(row);
			}
			else {
				//that.row = row; // bug fixed! do not change context
				$(this.el.children(".k-d-row")[idx-1]).after(row.el);
				row.box = that;
				row.box.rows.insert(row, idx);
			}
		}

		this.addRow = function(idx) {
			var row = new Row([], options);
			if(idx !== undefined) {
				row.obj.h = Math.floor(100 / (this.rows.length + 1));
				this.insert(row, idx);

				calculateHeight(this.rows, true, idx)
				return row;
			}
			else {
				row.appendTo(this);
				calculateHeight(row.box.rows, true)
				return row;
			}
		}
		
		this.splitInsert = function(box, direction) {
			if(!/(left|right|top|bottom)/.test(direction)) {
				//throw new TypeError("unexpected direction");
				return false;
			}
			box.dispatchEvent('splitInsert');
			
			if(direction === "bottom") {
				
				if(this.row === undefined) {
					console.logdash("bottom case1: add to root");
					
					newrow = this.addRow();
					
					var contents = box.el.find('.contentbox:first').detach();
					box.close();
					var boxn = _box.create(box.obj, false, options);
					
					delete box.obj.w;
					newrow.append(boxn);
					boxn.row = newrow;

					if(this.rows[this.rows.length - 2] != undefined) {
						this.rows[this.rows.length - 2].resizerV.show();
					}

					boxn.resizerH.hide();
					newrow.resizerV.hide();

					boxn.el.find('.contentbox').remove();
					contents.appendTo(boxn.el.find('.mybox'));
					
					delete this.guid;
					delete this.obj.guid;
				}
				else {
					var single_row_box = (this.row.boxes.indexOf(this) === 0 && this.row.boxes.length === 1); // one of many lines
					var multi_line = (this.rows.length !== 0) // absolutely multi line

					box.obj.w = this.obj.w;
					var boxn = _box.create(box.obj, false, options);

					if(multi_line || single_row_box) {

						var original_idx = this.row.box.rows.indexOf(this.row);
						
						if(multi_line) {
							console.logdash("bottom case3: append to last");
							
							box.close();
							var newrow = this.addRow();
							newrow.append(boxn);
							boxn.row = newrow;
						}
						else {
							function case5bottom() {
								console.logdash("bottom case5: insert row");

								var contents = box.el.find('.contentbox:first').detach();
								box.close();
								// console.logdash(box.row.box.rows)
								var newrow = that.row.box.addRow(original_idx + 1);
								newrow.append(boxn);
								boxn.row = newrow;

								boxn.resizerH.hide();
								boxn.el.find('.contentbox').remove();
								contents.appendTo(boxn.el.find('.mybox'));
								that.row.box.rows[original_idx].resizerV.show();
								if(newrow == that.row.box.rows.last()) {
									newrow.resizerV.hide();
								}
							}

							if(box.row == undefined) {
								case5bottom();
							}
							else {
								if(this.row.box === box.row.box) {
									console.logdash("bottom case4: reorder");

									var contents = box.el.find('.contentbox:first').detach();
									
									var newrow = this.row.box.addRow(original_idx + 1);
									newrow.append(boxn);
									boxn.row = newrow;
									boxn.resizerH.hide();

									this.row.box.rows[this.row.box.rows.indexOf(newrow) - 1].resizerV.show();
									boxn.el.find('.contentbox').remove();
									contents.appendTo(boxn.el.find('.mybox'));

									box.close();
								}
								else {
									case5bottom();
								}
							}
						}
					}
					else {
						console.logdash("bottom case2: add to single box");
						
						var contentsTop = box.el.find('.contentbox:first').detach();
						var contentsBottom = this.el.find('.contentbox:first').detach();
						box.close();
						var child = wrapRow(this); // <-- it is child
						// "this" is parent box
						var newrow = this.addRow();
						newrow.append(boxn);
						boxn.row = newrow;

						unmakeDroppable(this);

						child.el.find('.contentbox').remove();
						boxn.el.find('.contentbox').remove();
						contentsBottom.appendTo(child.el.find('.mybox'));
						contentsTop.appendTo(boxn.el.find('.mybox'));

						newrow.resizerV.hide();

						this.rows.forEach(function(row) {
							row.boxes[0].resizerH.hide();
						})
					}
					
					
				}
			}
			else if(direction === "top") {
				
				if(this.row === undefined) {
					console.logdash("top case1: add to root");
					
					newrow = this.addRow(0);
					
					var contents = box.el.find('.contentbox:first').detach();
					box.close();
					var boxn = _box.create(box.obj, false, options);
					
					delete box.obj.w;
					newrow.append(boxn);
					boxn.row = newrow;

					boxn.resizerH.hide();
					boxn.el.find('.contentbox').remove();
					contents.appendTo(boxn.el.find('.mybox'));

					this.el.removeClass('blank');
					// this.droppable.removeClass('max');
					
					delete this.guid;
					delete this.obj.guid;
					delete this.row; // added!!!
				}
				else {
					var single_row_box = (this.row.boxes.indexOf(this) === 0 && this.row.boxes.length === 1); // one of many lines
					var multi_line = (this.rows.length !== 0) // absolutely multi line

					box.obj.w = this.obj.w;
					var boxn = _box.create(box.obj, false, options);

					if(multi_line || single_row_box) {

						var original_idx = this.row.box.rows.indexOf(this.row);
						
						if(multi_line) {
							console.logdash("top case3: append to first");
							
							box.close();
							var newrow = this.addRow(0);
							newrow.append(boxn);
							boxn.row = newrow;
						}
						else {
							function case5top() {
								console.logdash("top case5: insert row");
								
								var contents = box.el.find('.contentbox:first').detach();
								box.close();
								var newrow = that.row.box.addRow(original_idx);
								newrow.append(boxn);
								boxn.row = newrow;
								boxn.el.find('.contentbox').remove();
								contents.appendTo(boxn.el.find('.mybox'));
							}

							if(box.row == undefined) {
								case5top();
							}
							else {
								if(this.row.box === box.row.box) {
									console.logdash("top case4: reorder");
									
									var contents = box.el.find('.contentbox:first').detach();
									var newrow = this.row.box.addRow(original_idx);
									newrow.append(boxn);
									boxn.row = newrow;

									boxn.resizerH.hide();
									boxn.el.find('.contentbox').remove();
									contents.appendTo(boxn.el.find('.mybox'));
									box.close();
								}
								else {
									case5top();
								}	
							}
							
						}
					}
					else {
						console.logdash("top case2: add to single box");
						
						var contentsTop = box.el.find('.contentbox:first').detach();
						var contentsBottom = this.el.find('.contentbox:first').detach();
						box.close();
						var child = wrapRow(this); // <-- it is child
						// "this" is parent box
						var newrow = this.addRow(0);

						newrow.append(boxn);
						boxn.row = newrow;
						
						unmakeDroppable(this);

						child.el.find('.contentbox').remove();
						boxn.el.find('.contentbox').remove();
						contentsBottom.appendTo(child.el.find('.mybox'));
						contentsTop.appendTo(boxn.el.find('.mybox'));

						child.row.resizerV.hide();

						this.rows.forEach(function(row) {
							row.boxes[0].resizerH.hide();
						})
					}
				}
			}
			else if(direction === "left") {
				if(this.row === undefined) {
					console.logdash("left case: root");

					var p = this.el.parent();
					var boxobj = $.extend({}, box.obj); // object copy
					boxobj.w = 50;

					var contents = box.el.find('.contentbox:first').detach();

					var contb = _box.create({
						"rows": [
							{
								"cols": [
									boxobj
								],
								"h": 100
							}
						],
						"w": 100
					}, false, options);

					unmakeDroppable(this);

					this.row = contb.rows[0];
					this.appendTo(this.row);
					this.resize(50, false);

					box.close();
					contb.appendTo(p);

					unwrapRow(this.rows.last());

					var boxn = contb.rows[0].boxes[0];
					boxn.el.find('.contentbox').remove();
					contents.appendTo(boxn.el.find('.mybox'));
					boxn.resizerH.show();
				}
				else {
					console.logdash("left case: basic");
					var original_idx = this.row.boxes.indexOf(this);
					
					var contents = box.el.find('.contentbox:first').detach();
					box.obj.w = this.obj.w / 2;
					var boxn = _box.create(box.obj, false, options)
					
					this.row.insertAt(boxn, original_idx);
					this.row.boxes[original_idx + 1].resize(boxn.obj.w, false);

					boxn.el.find('.contentbox').remove();
					contents.appendTo(boxn.el.find('.mybox'));
					box.close();
				}
			}
			else if(direction === "right") {
				if(this.row === undefined) {
					console.logdash("right case: root");

					var p = this.el.parent();
					var boxobj = $.extend({}, box.obj); // object copy
					boxobj.w = 50;

					var contents = box.el.find('.contentbox:first').detach();

					var contb = _box.create({
						"rows": [
							{
								"cols": [
									boxobj
								],
								"h": 100
							}
						],
						"w": 100
					}, false, options);

					unmakeDroppable(this);

					this.row = contb.rows[0];
					//this.appendTo(this.row);
					this.row.insertAt(this, 0);
					this.resize(50, false);

					box.close();
					contb.appendTo(p);

					unwrapRow(this.rows[0]);

					var boxn = contb.rows[0].boxes.last();
					boxn.el.find('.contentbox').remove();
					contents.appendTo(boxn.el.find('.mybox'));
					contb.rows[0].boxes[0].resizerH.show();
				}
				else {
					console.logdash("right case: basic");
					var original_idx = this.row.boxes.indexOf(this);

					var contents = box.el.find('.contentbox:first').detach();
					box.obj.w = this.obj.w / 2;
					var boxn = _box.create(box.obj, false, options)
					
					this.row.insertAt(boxn, original_idx + 1);

					this.row.boxes[original_idx].resizerH.show();
					if(this.row.boxes.last() == boxn) {
						boxn.resizerH.hide();
					}

					// console.trace();
					this.row.boxes[original_idx].resize(boxn.obj.w, false);
					boxn.el.find('.contentbox').remove();
					contents.appendTo(boxn.el.find('.mybox'));
					box.close();
				}
			}
			
			return true;
		}
		
		function wrapRow(box) {
			// rearrange box compass
			box.dropCompass.removeClass("single");
			// end
			
			var newrow = box.addRow();
			
			var boxobj = $.extend({}, box.obj); // object copy
			delete boxobj.w;
			var boxel = box.el.children(".mybox").remove();
			
			var boxn = _box.create(boxobj, false, options);
			newrow.append(boxn);
			
			delete box.guid;
			delete box.obj.guid;
			//box.row = newrow;
			
			return boxn;
		}

		function traverse(obj) {
			var l = [];
			if(obj.rows == undefined) return;

			for(var i = 0; i < obj.rows.length; i++) {
				// making row
				var objRow = obj.rows[i];
				var row = new Row(objRow, options);
				row.appendTo(that);

				for(var j = 0; j < objRow.cols.length; j++) {
					// making box
					var objBox = objRow.cols[j];
					var box = new Box(objBox, options);
					box.appendTo(row);
				}
			}
		}

		function draw() {

			if(prop.rows == undefined) {
				if(prop.blank) {
					el.addClass('blank');
					el.find('.k-rs-r').hide();
				}
				else {
					el.attr('dock-id', that.guid)
					var closebtn = $("<button>").addClass("btn").addClass("internal-close")
												.text("x")
												.on("click",function() {
													that.close();
												});
					var mybox = $("<div>").addClass("mybox")
							  .append(closebtn)
							  .appendTo(el);
					
					var handler = $("<div>&nbsp;</div>").addClass("handler").appendTo(mybox);

					var contentbox = $('<div>').addClass('contentbox').appendTo(mybox);
					
					if(prop.dragHandler != false) {
						makeDraggable(that);	
					}
					else {
						handler.hide();
						contentbox.css('height', 'calc(100% + 2px)');
					}
					
				}

				if(prop.droppable != false) {
					makeDroppable(that, false);
				}
			}
			else {
				
				setTimeout(function() {
					// console.logdash(that.row, that.guid)
					if(that.row == undefined) {
						if(prop.droppable != false) {
							makeDroppable(that, true);
						}

						that.resizerH.hide();
					}
				}, 250);

				that.rows.forEach(function(row) {
					row.boxes.last().resizerH.hide();
				});
				that.rows.last().resizerV.hide();
			}

			el.css("width", prop.w + "%");
			el.css("height", "100%");
			
			//console.logdash(that.guid); // this shows rendering order
		}


		function calculateHeight(rows, isadd, addidx) {
			// add box
			if(isadd) {

				var addboxw;

				if(addidx == undefined) {
					addboxw = Math.floor(100 / (rows.length));
				}
				else {
					addboxw = rows[addidx].obj.h;
					
				}

				var totalper = 0;
				for (var i = 0; i < rows.length - 1; i++) {
					var box = rows[i];
					if(addidx == undefined) {
						box.resize(Math.floor((100 - addboxw) * box.obj.h / 100), false);
					}
					else {
						if(i != addidx) {
							box.resize(Math.floor((100 - addboxw) * box.obj.h / 100), false);
						}
						else {
							box.resize(addboxw, false);
						}
						//console.logdash(i + " " + box.obj.h);
					}

					totalper = totalper + box.obj.h;
				}

				rows[rows.length - 1].resize(100 - totalper, false);
			}
			// remove box
			else
			{
				var total = 0;
				for (var i = 0; i < rows.length; i++) {
					var box = rows[i];
					total = total + box.obj.h;
				}

				var totalper = 0;
				for (var i = 0; i < rows.length; i++) {
					var box = rows[i];

					var neww = Math.floor(100 * box.obj.h / total);
					box.resize(neww, false);

					totalper = totalper + neww;

					if(i + 1 == rows.length) {
						box.resizerV.hide();
					}
					else {
						box.resizerV.show();
					}
				}

				var lastbox = rows[rows.length - 1];
				lastbox.resize(lastbox.obj.h + 100 - totalper, false);
			}
		}

		// override
		this.resize = function(w, bubble) {
			if(bubble === undefined) {
				bubble = true;
			}

			_super.el = this.el;
			_super.resize.call(this.el, w + "%");

			if(bubble) {
				var nextbox, nextel = el.next();
				var prevbox, prevel = el.prev();

				if(nextel.length > 0) {
					nextbox = nextel[0].obj;
					nextbox.resize(nextbox.obj.w + obj.w - w, false);
				}
				else {
					if(prevel.length > 0) {
						prevbox = el.prev()[0].obj;
						prevbox.resize(prevbox.obj.w + obj.w - w, false);
					}
				}
			}

			obj.w = w;
		}
		
		function checkZ(b) {
			if(!!b.row) {
				if(!!b.row.box) {
					checkZ(b.row.box)
					var pz = parseInt( b.row.box.droppable.css("z-index") ) ;
					//console.logdash("has parent: " + b.row.box.droppable.css("z-index") );
					
					b.droppable.css("z-index", pz + 1);
					b.dropCompass.css("z-index", pz + 101);
				}
			}
		}
		
		function activateDroppable(box) {
			$.each(layoutEngine.ui.layout.box.allboxes, function(i, b) {
				if(!!b.droppable) {
					if(box != b) {
						b.droppable.show();
						
						
						//checkZ(b);
					}
				}
			});
		}
		
		function deactivateDroppable() {
			$.each(layoutEngine.ui.layout.box.allboxes, function(i, box) {
				if(!!box.droppable) {
					box.droppable.hide();
				}
			});
		}
		
		function drop(box, e, targetDockId) {
			
			if(!!layoutEngine.ui.layout.box.target) {
				var t = layoutEngine.ui.layout.box.target;
				var target = t.splitTarget;
				delete t.splitTarget;
				
				t.splitInsert(box, target);
				
				layoutEngine.ui.layout.box.target = null;

			
				if((!!options) && !!options.onAppend) {
					options.onAppend(box, e, targetDockId);
				}
			}
			else {
				box.el.css("position", "")
					  .css("top", "")
					  .css("left", "")
					  .css("z-index", "")
					  .removeClass("ani");
			}
		}
		
		function makeDraggable(box) {
			var dragHandler = box.el.children(".mybox").children(".handler");
			
			dragHandler.on("mousedown", function(ee) {
				$(document).on("selectstart", function() { return false; });
				var initp = {
					x: ee.pageX,
					y: ee.pageY
				};
				var boxp = {
					x: ee.offsetX,
					y: ee.offsetY
				};
				
				var poffset = box.el.offset();
				if(!!box.row) {
					var poffset = box.row.el.offset();	
				}
				
				var isDraggable = false;
				var scaf;
				var detached;
				box.el.addClass("grabbed").addClass("ani");
				
				
				$(document).on("mousemove.activeDroppable", function(e) {
					
					if( Math.abs(initp.x - e.pageX) < 20 && Math.abs(initp.y - e.pageY) < 20 ) return;

					if((!!options) && !!options.onDrag) {
						options.onDrag(box, e, ee);
					}
					
					if(!isDraggable) {
						
						isDraggable = true;
						
						scaf = $("<div>").addClass("k-d-col").css("width", box.obj.w + "%"); //.css("background-color", "rgba(0,0,0,.1)");
						
						box.el.css("position", "absolute").css("z-index", "8000")
							.css("top", (e.pageY - initp.y) + "px").css("left", (e.pageX - boxp.x - poffset.left) + "px");
						box.el.after(scaf);
						box.el.removeClass("ani");
						/*
						var w = box.el.width(), h = box.el.height();
						
						detached = box.el.detach();
						detached.css("position", "absolute")
								//.css("z-index", "8000")
								.width(w)
								.height(h)
								.prependTo("body");
						*/
						
						activateDroppable(box);
					}
					else {
						/*
						detached.css("top", (e.pageY - boxp.y) + "px");
						detached.css("left", (e.pageX - boxp.x) + "px");
						*/
						box.el.css("top", (e.pageY - initp.y) + "px");
						box.el.css("left", (e.pageX - boxp.x - poffset.left) + "px");
						
					}
				}).
				on("mouseup.activeDroppable", function(e) {
					
					$(document).off("mousemove.activeDroppable").off("mouseup.activeDroppable").off("selectstart");
					dragHandler.off("mousemove");

					var targetDockId = $(e.target).parents('dockpanel:first').attr('id');

					box.el.addClass("ani").removeClass("grabbed");
					//detached.addClass("ani").removeClass("grabbed");
					//scaf.parent().append(detached);

					deactivateDroppable();
					
					if(!!scaf) {
						scaf.remove();
					}
					drop(box, e, targetDockId);
					
					if((!!options) && !!options.onDrop) {
						options.onDrop(box, e, targetDockId);
					}

				})
			});

		}

		function unmakeDroppable(box) {
			box.droppable.off('mouseover').off('mousemove').off('mouseout');
			delete box.droppable;
			delete box.dropCompass;
		}
		
		function makeDroppable(box, isContainer) {
			box.droppable = $("<div>").addClass("droppable").appendTo(box.el);
			box.droppable.css("width", "100%")
						.css("height", "100%")
						.css("z-index", "9990")
						.css("top", "0")
						.css("position","absolute")
						
			if(!isContainer) {
				//box.droppable.css("background-color", "rgba(0,0,0,.1)")//.css("opacity", ".1");
			}
			
			
			if(isContainer) {
				$("<div>").addClass("drp-t").appendTo(box.droppable);
				$("<div>").addClass("drp-r").appendTo(box.droppable);
				$("<div>").addClass("drp-b").appendTo(box.droppable);
				$("<div>").addClass("drp-l").appendTo(box.droppable);
			}
			else {
				$("<div>").addClass("drp-t").addClass("single").appendTo(box.droppable);
				$("<div>").addClass("drp-r").addClass("single").appendTo(box.droppable);
				$("<div>").addClass("drp-b").addClass("single").appendTo(box.droppable);
				$("<div>").addClass("drp-l").addClass("single").appendTo(box.droppable);
			}
			
			box.dropCompass = box.droppable.children("div").addClass("drop-compass").css("z-index", "10090").hide();
			
			var pl = $("<div>").addClass("dock-preview")
							.appendTo(box.droppable)
							.hide();
			
			box.dropCompass.on("mouseover", function(e) {
				$(this).addClass("over1");
				
				if(hasClassIndexOf(this.className, "drp-t")) {
					pl.addClass("top").show();
					box.splitTarget = "top";
				}
				else if(hasClassIndexOf(this.className, "drp-r")) {
					pl.addClass("right").show();
					box.splitTarget = "right";
				}
				else if(hasClassIndexOf(this.className, "drp-b")) {
					pl.addClass("bottom").show();
					box.splitTarget = "bottom";
				}
				else if(hasClassIndexOf(this.className, "drp-l")) {
					pl.addClass("left").show();
					box.splitTarget = "left";
				}
				
				layoutEngine.ui.layout.box.target = box;

				$('.droppable').css('cursor', 'pointer');
			})
			.on("mouseout", function() {
				$(this).removeClass("over1");
				delete box.splitTarget;
				layoutEngine.ui.layout.box.target = undefined;
				
				pl.removeClass("top").removeClass("right").removeClass("bottom").removeClass("left").hide();

				$('.droppable').css('cursor', '');
			});
			
			var isEnter = false;
			
			
			box.droppable.on("mouseover", function(e) {
				//box.droppable.css("background-color", "");
				box.dropCompass.show();
				
				isEnter = true;
			})
			.on("mousemove", function(e) {
				if(!isEnter) return;
				
				var all = $(".drop-compass");
				$.each(all, function(i, cont) {
					$(cont).mouseout();
				});
				
				var all_cont = $(".droppable");
				$.each(all_cont, function(i, cont) {
					$(cont).mouseout();
				});
				
				var found_cont = findElementsByCoordinate(["droppable"], e);
				$.each(found_cont, function(i, cont) {
					$(cont).mouseover();
				});
				
				var found = findElementsByCoordinate(["droppable", "drop-compass"], e);
				$.each(found, function(i, cont) {
					$(cont).mouseover();
				});

			})
			.on("mouseout", function() {
				if(!isContainer) {
					//box.droppable.css("background-color", "rgba(0,0,0,.1)")//.css("opacity", ".1");
				}
				box.dropCompass.hide();
				
				isEnter = false;
			});
			
			
			box.droppable.hide();
			
		}
		
		this.close = function() {
			if(this.row == undefined) {
				console.log('close last one box');
				this.el.addClass('blank');
				// this.droppable.addClass('max');
			}
			else {
				this.row.deleteBox(this);
			}
		}

		this.deleteRow = function(row) {
			row.resize(0, false);
			row.el.remove();
			var idx = row.box.rows.indexOf(row);
			row.box.rows.removeAt(idx);

			if(row.box.rows.length === 0) {
				row.box.close();
			}
			else {
				calculateHeight(row.box.rows, false, row.box.row);
				
				if(row.box.rows.length === 1) {
					unwrapRow(row.box.rows[0]);
				}
				
			}
		}

		function unwrapRow(row) {
			if(row == undefined) return;
			console.logdash('unwrapRow');

			var pbox = row.box;
			var pobjw = row.box.obj.w;
			var uboxes = row.boxes;
			var prow = row.box.row;

			if(row.obj.h === 100) {
				// boxes append to parent row 
				// get parent box's index
				if(prow != undefined) {
					var pboxIndex = prow.boxes.indexOf(pbox);
					
					for (var i = uboxes.length - 1; i >= 0; i--) {
						uboxes[i].obj.w = uboxes[i].obj.w * pobjw * 0.01;
						prow.insertAt(uboxes[i], pboxIndex);
					};

					// row unwrap
					row.close();
					pbox.resizerH.show();
				}

			}
		}

		var _super = layoutEngine.extend(Box, layoutEngine.ui.resizable, {
			"el": el,
			"resizer": [false, true, false, false], // top, right, bottom, left
			"onResize": function(oldx, newx, oldy, newy) {
				var nextel = $(el).next();
				var nextbox = nextel[0].obj;
				var originw = nextel.width();
				var dx = newx - oldx;
				// console.logdash(that, nextbox, that.getMinWidth(), nextbox.getMinWidth(), oldx, newx, originw - dx, originw )
				var can = (that.getMinWidth() < newx) && (nextbox.getMinWidth() < originw - dx);
				if(can) {
					if(nextel.length > 0) {
						nextel.width(originw - dx);
					}
				}
				return can;
			},
			"afterResize": function() {
				return options.onResize(that.row)
			}
		});


		// drawing row
		if(!prop.hasOwnProperty('rows') && !prop.hasOwnProperty('guid')) {
			prop.blank = true;
		}
		traverse(prop);

		draw();

		// override resizer
		this.resizerH = $(el.find('.k-rs-r')[0]);

		layoutEngine.ui.layout.box.allboxes.push(this);
	}

	_box.create = function(prop, isreset, options) {
		if(isreset != undefined) {
			if(isreset) {
				layoutEngine.ui.layout.box.allboxes = [];
			}
		}
		return new Box(prop, options);
	}

	layoutEngine.ui.layout.box.create({'w': 100,'guid': 'zz'}); // Box
	layoutEngine.ui.layout.box.create({'w': 100,'guid': 'yy'}); // Box - Resizable

}());


(function() {
	function AutoLayout(widgets) {
		var layout = { 'rows':[], 'w':100 };
		var h = 100 / Math.ceil(widgets.length / 4);
		if(h < 25) h = 25;

		function makeColLayout4(k) {
			if(k % 4 == 0) {
				layout.rows.push({ 'cols': [], 'h': h });
			}
			
			layout.rows[Math.floor(k/4)].cols.push({
				'w': 25,
				'guid': widgets[k].guid
			});
		}

		for (var i = 0; i < widgets.length; i++) {
			
			if( widgets.length < 4 ) {
				// 1, 2, 3, 4
				if(i == 0) {
					layout.rows.push({ 'cols': [], 'h': 100 });
				}

				layout.rows.last().cols.push({
					'w': 100/widgets.length,
					'guid': widgets[i].guid
				});
			}
			else if( widgets.length % 4 == 1 && i >= widgets.length - 5) {
				// [ | | ]
				// [ | ] 5, 9, 13, 17...
				var divider = (widgets.length - i) > 2 ? 3 : 2;
				if((widgets.length - i == 5) || (widgets.length - i == 2)) {
					layout.rows.push({ 'cols': [], 'h': h });
				}

				layout.rows.last().cols.push({
					'w': 100/divider,
					'guid': widgets[i].guid
				});
			}
			else if( widgets.length % 4 == 3 && i >= widgets.length - 3) {
				// [ | | ] 7, 11, 15, 19...
				if(widgets.length - i == 3) {
					layout.rows.push({ 'cols': [], 'h': h });
				}

				layout.rows.last().cols.push({
					'w': 100/3,
					'guid': widgets[i].guid
				});
			}
			else if( widgets.length % 4 == 2 && i >= widgets.length - 2) {
				// [ | ] 6, 10, 14, 18...
				if(widgets.length - i == 2) {
					layout.rows.push({ 'cols': [], 'h': h });
				}

				layout.rows.last().cols.push({
					'w': 100/2,
					'guid': widgets[i].guid
				});
			}
			else {
				makeColLayout4(i);
			}
		}

		if(widgets.length == 0) {
			delete layout.rows;
		}

		return layout;
	}

	var layout = layoutEngine.namespace("ui.layout");
	layout.autoLayout = AutoLayout;
}());