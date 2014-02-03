angular.module('app', [])
.directive('conn', function() {
	return {
		restrict: 'E',
		link: function(scope, el, attrs) {
			var parent = el.parent();
			var isDragging = false;
			var ce;
			el.on('mousedown.drag', function(ed) {
				ce = parent[0].ce;
				isDragging = true;
				el.addClass('hoverClass');
				var pos_init = [ed.clientX, ed.clientY];

				var svg = d3.select('svg');
				var path = svg.append('path');


				$(document).on('mouseup.drag', function(eu) {
					isDragging = false;
					el.removeClass('hoverClass');
					ce.dispatchEvent('drop', eu, path);
					$(document).off('mouseup.drag').off('mousemove.drag');
				})
				.on('mousemove.drag', function(em) {
					var pos = [em.clientX, em.clientY];
					path.attr('d', function(d) {
							return 'M' + [
								pos_init,
								pos
							].join('L');
						})
						.attr('stroke', '#0099ff')
						.attr('stroke-width', '1')
						.attr('transform', 'translate(-10, -10)');
					
				})
			});

			el.on('mouseover', function(e) {
				el.addClass('hoverClass');
			})
			.on('mouseout', function(e) {
				if(!isDragging) {
					el.removeClass('hoverClass');
				}
			})

		}
	}
});

$(document).on("selectstart", function() { return false; });

function StreamQueryEditorController($scope, $compile, $q) {

	$('#sq-canvas').on('dblclick',function(e) {
		var node = angular.element('<div class="node"><conn>ii</conn> <span>fff</span> <conn>o</conn></div>').offset({ 'left': e.offsetX, 'top': e.offsetY });
		node[0].ce = new CustomEvent(node[0]);
		node[0].ce.on('drop', DropEvent);

		function DropEvent(e, path) {
			console.count('DropEvent')
			if( $(e.target)[0].tagName == 'CONN' ) {
				console.log('can drop!!')
			}
			else {
				console.log('remove')
				path.remove();
			}
		}
		
		$compile(node)($scope);
		node.appendTo('#sq-container');
		
	});
}