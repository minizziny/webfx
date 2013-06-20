angular.module('util', [])
.factory('serviceGuid', function() {
	var s4 = function() {
		return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
	};

	return {
		generateType1: function() {
			return (s4()+s4()+"-"+s4()+"-"+s4()+"-"+s4()+"-"+s4()+s4()+s4());
		},
		generateType2: function() {
			return ('w'+s4()+s4()+s4()+s4());
		},
		generateType3: function() {
			return ('w'+s4());
		}
	}
})
.directive('autosize', function() {
	return {
		restrict: 'A',
		link: function(scope, $self, attrs) {
			var shadow, minHeight, noFlickerPad;
			$self.on('keydown', update).on('keyup', update);

			function update(e) {

				if(shadow == undefined) {
					minHeight    = $self.height();
					noFlickerPad = $self.hasClass('autogrow-short') ? 0 : parseInt($self.css('lineHeight')) || 0;

					shadow = $('<div></div>').css({
						position:    'absolute',
						top:         -10000,
						left:        -10000,
						width:       $self.width(),
						fontSize:    $self.css('fontSize'),
						fontFamily:  $self.css('fontFamily'),
						fontWeight:  $self.css('fontWeight'),
						lineHeight:  $self.css('lineHeight'),
						resize:      'none',
						'word-wrap': 'break-word'
					}).appendTo(document.body);
				}

				var times = function(string, number)
				{
					for (var i=0, r=''; i<number; i++) r += string;
						return r;
				};

				var val = $self[0].value.replace(/</g, '&lt;')
					.replace(/>/g, '&gt;')
					.replace(/&/g, '&amp;')
					.replace(/\n$/, '<br/>&nbsp;')
					.replace(/\n/g, '<br/>')
					.replace(/ {2,}/g, function(space){ return times('&nbsp;', space.length - 1) + ' ' });

				shadow.css('width', $self.width());
				shadow.html(val + (noFlickerPad === 0 ? '...' : '')); // Append '...' to resize pre-emptively.
				$self.height(Math.max(shadow.height() + noFlickerPad, minHeight));

				return true;
			}
		}
	}
});
