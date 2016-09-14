(function (root, factory) {
  'use strict';
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['angular'], factory);
  } else if (typeof module !== 'undefined' && typeof module.exports === 'object') {
    // CommonJS support (for us webpack/browserify/ComponentJS folks)
    module.exports = factory(require('angular'));
  } else {
    // in the case of no module loading system
    // then don't worry about creating a global
    // variable like you would in normal UMD.
    // It's not really helpful... Just call your factory
    return factory(root.angular);
  }
}(this, function (angular) {
	'use strict';

	var moduleName = 'ng-d3-charts';
	var mod = angular.module(moduleName, []);

	mod.service('d3Loader', ['$document', '$q', '$rootScope',
		function($document, $q, $rootScope) {

			var d = $q.defer();

			function onScriptLoad() {
				// Load client in the browser
				$rootScope.$apply(function() { d.resolve(window.d3); });
			}

			var scriptTag 		= $document[0].createElement('script');
			scriptTag.type 		= 'text/javascript';
			scriptTag.async 	= true;
			scriptTag.src 		= '/static/vendor/d3/d3.min.js';

			scriptTag.onreadystatechange = function () {
				if (this.readyState == 'complete') onScriptLoad();
			};
			scriptTag.onload 	= onScriptLoad;

			var s = $document[0].getElementsByTagName('body')[0];
			s.appendChild(scriptTag);

			return { d3: function() { return d.promise; } };

	}]);

	mod.directive('ngBarChart', ['d3Loader','$timeout', function(d3Loader,$timeout) {

		function drawBarChart(data,element,attrs,color){

			var margin = {top: 30, right: 30, bottom: 30, left: 30},
				full_width = attrs.$$element[0].parentElement.clientWidth,
				full_height = attrs.$$element[0].parentElement.clientHeight,
				width = full_width - margin.left - margin.right,
				height = full_height - margin.top - margin.bottom,
				bar_padding = .5,
				bar_outer_padding = .2,
				range;

			var x = d3.scale.ordinal()
				.rangeRoundBands([0,width],bar_padding,bar_outer_padding);

			var y = d3.scale.linear()
				.range([(height),0]);

			var x_axis = d3.svg.axis()
				.scale(x)
				.outerTickSize(0)
				.orient('bottom');

			var y_axis = d3.svg.axis()
				.scale(y)
				.tickSize(6)
				.outerTickSize(0)
				.orient("left");

			var svg = d3.select(element[0])
					.append("svg:svg")
				.attr("width", full_width)
				.attr("height", full_height)
					.append("svg:g")
				.attr("transform", "translate(" + margin.left + "," + margin.top +")");

			// Set up x_axis with non-numeric values.
			var x_domain = [];
			angular.forEach(data,function(d,i){	x_domain.push(d.x); });
			x.domain(x_domain);

			//Set up y_axis
			var max_y = d3.max(data,function(d){ return d.y; });
			y.domain([0,max_y]);

			var bar = svg.selectAll(".bar")
				.data(data)
				.enter().append("g")
				.attr("class","bar")
				.attr("transform", function(d) { return "translate(" + x(d.x) + "," + 0 + ")"; });

			bar.append("rect")
					.style('fill',function(d,i){ return color; })
					.attr("y", function(d) { return y(0); })
				.attr("height", function(d) { return height - y(d.y); })
				.attr("width", x.rangeBand())
					.transition().duration(500)
						.attr("y", function(d) { return y(d.y); })
							.delay(function(d,i) { return i*100; });

			var mask = svg.append('rect')
				.attr('class','mask')
				.attr("y",height)
				.attr("x",0)
				.attr("width",width)
				.attr("height",margin.bottom)
				.style("fill","white");

			var x_axis_node = svg.append('g')
				.attr('class','axis x')
				.attr('transform', 'translate(' + 0 + ',' + height + ')');

			x_axis_node.call(x_axis);

			var y_axis_node = svg.append('g')
				.attr('class','axis y')
				.attr('transform', 'translate(' + 0 + ',' + 0 + ')');

			 y_axis_node.call(y_axis);

			/*x_axis_node.selectAll('text')
				.attr('dx', '-.5em')
				.attr('y',4);

			// Adjusting the position of overlapping labels on x_axis
			/*x_axis_node.selectAll("g.x.axis g.tick line")
				.attr("y2", function(d,i){ return ( i % 2 === 0) ? 25 : 10; });

			x_axis_node.selectAll('text')
				.attr("transform", function(d,i){
					var y; ( i % 2 === 0) ? y = 15 : y = 0;
					return 'translate(0,'+ y  +')';
				});*/
		}

		return {
			restrict: 'E',
			scope: {
				dataset:'='
			},
			link: function(scope,element,attrs){
				var d3isReady = d3Loader.d3();
				d3isReady.then(function(){
					$timeout(
						drawBarChart(scope.dataset,element,attrs,'#3498DB')
					);
				})
			}
		};
	}]);
	return moduleName;
}));