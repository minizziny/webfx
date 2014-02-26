angular.module('app', [])
.directive('inputTags', function() {
	return {
		restrict: 'E',
		template: '<div class="input-tags">' +
			'<div class="input-tags-cont" ng-click="focus()">' +
				'<span class="tags" ng-repeat="tag in tags" ng-click="stopPropagation($event)">' +
					'<span contenteditable="true" class="term"></span>' +
					'<a class="tag-text">{{tag}}</a>' +
				'</span>' +
				'<span contenteditable="true" class="term last"></span>' +
			'</div>' +
			'<ul>' +
				'<li ng-repeat="src in sources | filter:filter" ng-class="{\'active\': src == selected}"><a>{{src}}</a></li>' +
			'</ul>' +
			'{{inputText}}' +
		'</div>',
		replace: true,
		link: function(scope, el, attrs) {
			scope.tags = ['hello', 'world', 'my'];
			scope.sources = ['gotoweb', 'xeraph', 'lsehoon', '8con', 'stania', 'ssmim101'];
			scope.inputText = '';
			var $tl = el.find('.term.last');
			var KEYS = {
				'left': 37,
				'right': 39,
				'up': 38,
				'down': 40,
				'backspace': 8,
				'space': 32,
				'enter': 18,
				'comma': 188
			};

			scope.stopPropagation = function(e) {
				e.stopPropagation();
			}

			scope.filter = function(item) {
				if (!scope.inputText) return true;
				return item.toLowerCase().indexOf(scope.inputText.toLowerCase()) != -1;
			}

			scope.focus = function() {
				$tl.focus();
			}

			$tl.on('focus', function() {
				$tl.data('before', $tl.text());
				return $tl;
			}).on('blur keyup paste input', function() {
				var txt = $tl.text();
				if ($tl.data('before') !== txt) {
					$tl.data('before', txt);
					$tl.trigger('change');

					scope.inputText = txt;
					scope.$apply();
				}
				return $tl;
			});


			scope.selected;

			function SuggestionList(source, filterFn) {
				var selected, idx = 0;
				
				this.selectPrev = function() {
					var src = source.filter(filterFn);
					if(!selected || src[--idx] === undefined) {
						selected = src[src.length - 1];
						idx = src.length - 1;
					}
					else {
						selected = src[idx];
					}
					return selected;
				}

				this.selectNext = function() {
					var src = source.filter(filterFn);
					if(!selected || src[++idx] === undefined) {
						idx = 0;
						selected = src[0];
					}
					else {
						selected = src[idx];
					}
					return selected;
				}

				this.unselect = function() {
					selected = undefined;
					idx = 0;
					return selected;
				}

			}

			var suggestionList = new SuggestionList(scope.sources, scope.filter);

			$tl.on('change', function(e) {
				console.log('onchange', e);
				scope.selected = suggestionList.unselect();
				scope.$apply();
			})
			.on('keydown', function(e) {
				console.log('keydown')
				var key = e.keyCode;
				if(key === KEYS.up) {
					scope.selected = suggestionList.selectPrev();
					e.preventDefault();
				}
				else if (key === KEYS.down) {
					scope.selected = suggestionList.selectNext();
				}
				console.log(scope.selected)

				scope.$apply();
			});
		}
	}
});

function Controller($scope) {

}
