function ObservableArray(items) {
	var _self = this,
		_array = [];

	_self.onItemAdded = null;
	_self.onItemSet = null;
	_self.onItemRemoved = null;

	function defineIndexProperty(index) {
		if (!(index in _self)) {
			Object.defineProperty(_self, index, {
				configurable: true,
				enumerable: true,
				get: function () {
					return _array[index];
				},
				set: function (v) {
					_array[index] = v;
					if (typeof _self.onItemSet === "function") {
						_self.onItemSet(index, v);
					}
				}
			});
		}
	}

	_self.push = function () {
		var index;
		for (var i = 0, ln = arguments.length; i < ln; i++) {
			index = _array.length;
			_array.push(arguments[i]);
			defineIndexProperty(index);
			if (typeof _self.onItemAdded === "function") {
				_self.onItemAdded(index, arguments[i]);
			}
		}
		return _array.length;
	};

	_self.pop = function () {
		if (~_array.length) {
			var index = _array.length - 1,
				item = _array.pop();
			delete _self[index];
			if (typeof _self.onItemRemoved === "function") {
				_self.onItemRemoved(index, item);
			}
			return item;
		}
	};

	_self.unshift = function () {
		for (var i = 0, ln = arguments.length; i < ln; i++) {
			_array.splice(i, 0, arguments[i]);
			defineIndexProperty(_array.length - 1);
			if (typeof _self.onItemAdded === "function") {
				_self.onItemAdded(i, arguments[i]);
			}
		}
		return _array.length;
	};

	_self.shift = function () {
		if (~_array.length) {
			var item = _array.shift();
			_array.length === 0 && delete _self[index];
			if (typeof _self.onItemRemoved === "function") {
				_self.onItemRemoved(0, item);
			}
			return item;
		}
	};

	_self.splice = function (index, howMany /*, element1, element2, ... */ ) {
		var removed = [],
			item,
			pos;

		index = !~index ? _array.length - index : index;

		howMany = (howMany == null ? _array.length - index : howMany) || 0;

		while (howMany--) {
			item = _array.splice(index, 1)[0];
			removed.push(item);
			delete _self[_array.length];
			if (typeof _self.onItemRemoved === "function") {
				_self.onItemRemoved(index + removed.length - 1, item);
			}
		}

		for (var i = 2, ln = arguments.length; i < ln; i++) {
			_array.splice(index, 0, arguments[i]);
			defineIndexProperty(_array.length - 1);
			if (typeof _self.onItemAdded === "function") {
				_self.onItemAdded(index, arguments[i]);
			}
			index++;
		}

		return removed;
	};

	Object.defineProperty(_self, "length", {
		configurable: false,
		enumerable: true,
		get: function () {
			return _array.length;
		},
		set: function (value) {
			var n = Number(value);
			if (n % 1 === 0 && n >= 0) {
				if (n < _array.length) {
					_self.splice(n);
				} else if (n > _array.length) {
					_self.push.apply(_self, new Array(n - _array.length));
				}
			} else {
				throw new RangeError("Invalid array length");
			}
			return value;
		}
	});

	Object.getOwnPropertyNames(Array.prototype).forEach(function (name) {
		if (!(name in _self)) {
			Object.defineProperty(_self, name, {
				configurable: false,
				enumerable: true,
				writeable: false,
				value: Array.prototype[name]
			});
		}
	});

	if (items instanceof Array) {
		_self.push.apply(_self, items);
	}
}
