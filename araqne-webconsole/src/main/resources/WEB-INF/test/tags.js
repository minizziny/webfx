angular.module('app', [])
.directive('inputTags', function() {
	return {
		restrict: 'E',
		template: '<div class="input-tags">' +
			'<div class="input-tags-cont" ng-click="focus()">' +
				'<span class="tags" ng-repeat="tag in tags">' +
					'<span contenteditable="true" class="term"></span>' +
					'<a class="tag-text">{{tag}}</a>' +
				'</span>' +
				'<span contenteditable="true" class="term last"></span>' +
			'</div>' +
			'<ul>' +
				'<li ng-repeat="src in sources | filter:filter"><a>{{src}}</a></li>' +
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
				'backspace' 8,
				'space': 32,
				'enter': 18,
				'comma': 188
			};

			scope.filter = function(item) {
				if (!scope.inputText) return true;
				var found = item.toLowerCase().indexOf(scope.inputText.toLowerCase()) != -1;
				return found;
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


			function SuggestionList() {
				this.selectPrev = function() {

				}

				this.selectNext = function() {
					
				}
			}

			var suggestionList = new SuggestionList();

			$tl.on('change', function(e) {
				console.log('onchange', e);
			})
			.on('keydown', function(e) {
				var key = e.keyCode;
				if(key === KEYS.up) {
					suggestionList.selectPrev();
				}
				else if (key === KEYS.down) {
					suggestionList.selectNext();
				}
			});
		}
	}
});

function Controller($scope) {

}
