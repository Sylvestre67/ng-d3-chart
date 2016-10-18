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
			scriptTag.src 		= 'https://cdnjs.cloudflare.com/ajax/libs/d3/3.5.17/d3.min.js';

			scriptTag.onreadystatechange = function () {
				if (this.readyState == 'complete') onScriptLoad();
			};
			scriptTag.onload 	= onScriptLoad;

			var s = $document[0].getElementsByTagName('body')[0];
			s.appendChild(scriptTag);

			return { d3: function() { return d.promise; } };

	}]);

	mod.factory('chartConfig',function(){

		var chartConfig = function(config){

			this.chartType = config.chartType || null;

			//Layout configuration
			this.margin = config.margin || {top: 30, right: 30, bottom: 30, left: 30};

			//Axis Configuration
			var xAxisConst = function(config){
				this.showAxis        = (config.showAxis == false) ? false : true;
				this.scale 	         = config.scale || 'd3.scale.linear().range([0, width])';
				this.orient  		 = config.orient || 'bottom';

				/**** Ticks configuration ****/
				this.ticks           = config.ticks || null;
				this.tickSize        = config.tickSize || 6;
				this.outerTickSize   = config.outerTickSize || 0;
				this.innerTickSize   = config.innerTickSize || 6;
				this.tickPadding 	 = config.tickPadding || 3;
				this.tickFormat      = config.tickFormat || null;
				this.tickValues      = config.tickValues|| null;

				/**** barChart specific ****/
				this.barPadding 	 = config.barPadding || .5;
				this.barOuterPadding = config.barOuterPadding || 0;
			};

			var yAxisConst = function(config){
				this.showAxis	     = (config.showAxis == false) ? false : true;
				this.scale 		     = config.scale || 'd3.scale.linear().range([height, 0])';
				this.orient  		 = config.orient || 'left';

				/**** Ticks configuration ****/
				this.ticks           = config.ticks || null;
				this.tickSize        = config.tickSize || 6;
				this.outerTickSize   = config.outerTickSize || 0;
				this.innerTickSize   = config.innerTickSize || 6;
				this.tickPadding 	 = config.tickPadding || 3;
				this.tickFormat      = config.tickFormat || null;
				this.tickValues      = config.tickValues|| null;

				/**** barChart specific ****/
				this.barPadding 	 = config.barPadding || .5;
				this.barOuterPadding = config.barOuterPadding || 0;
			};

			this.xAxis =  new xAxisConst(config.xAxis);
			this.yAxis =  new yAxisConst(config.yAxis);

			//Basic style configuration
			/**** barChart specific ****/
			this.barColor = config.barColor || '#3498DB';
			this.bakcgroundColor = config.bakcgroundColor || 'white';

			//Animation configuration
			/**** barChart specific ****/
			this.delayedEntrance = config.delayedEntrance || 100;
		};

		return chartConfig;

	});

	mod.directive('ngBarChart', ['d3Loader','$timeout', function(d3Loader,$timeout) {

		/***********
		*
		* Chart functions
		*
		* **********/

		function barChartVertical(config,data,element,attrs){

			var margin = config.margin,
				full_width = attrs.$$element[0].parentNode.clientWidth,
				full_height= attrs.$$element[0].parentNode.offsetHeight,
				width = full_width - margin.left - margin.right,
				height = full_height - margin.top - margin.bottom,
				barColor = config.barColor,
				backgroundColor = config.bakcgroundColor,
				colorScale;

			//If color_scale is provided
			(config.barColor.indexOf('d3.scale') > -1)
				? colorScale = eval(config.barColor)
				: false;

			/**** No custom x for now ****/
			var x = d3.scale.ordinal()
				.rangeRoundBands([0,width],config.xAxis.barPadding,config.xAxis.barOuterPadding);

			var y = eval(config.yAxis.scale);

			var x_axis = d3.svg.axis()
				.scale(x)
				.orient(config.xAxis.orient)
				.ticks(eval(config.xAxis.ticks))
				.tickSize(config.xAxis.tickSize)
				.outerTickSize(config.xAxis.outerTickSize)
				.innerTickSize(config.xAxis.innerTickSize)
				.tickPadding(config.xAxis.tickPadding)
				.tickFormat((config.xAxis.tickFormat) ? eval(config.xAxis.tickFormat) : null)
				.tickValues(eval(config.xAxis.tickValues));

			var y_axis = d3.svg.axis()
				.scale(y)
				.orient(config.yAxis.orient)
				.ticks(eval(config.yAxis.ticks))
				.tickSize(config.yAxis.tickSize)
				.outerTickSize(config.yAxis.outerTickSize)
				.innerTickSize(config.yAxis.innerTickSize)
				.tickPadding(config.yAxis.tickPadding)
				.tickFormat((config.yAxis.tickFormat) ? eval(config.yAxis.tickFormat) : null)
				.tickValues(eval(config.yAxis.tickValues));

			// Set up x_axis with non-numeric values.
			var x_domain = [];
			angular.forEach(data,function(d,i){	x_domain.push(d.x); });
			x.domain(x_domain);

			//Set up y_axis
			var max_y = d3.max(data,function(d){ return d.y; });
			y.domain([0,max_y * 1.1]);

			var svgNotExist =  d3.select(element[0])
					.select('svg')
					.select('g')[0][0] == null;

			(config.yAxis.showAxis)
				? margin = leftMarginToBiggestYLabelWidth(element,y_axis,margin)
				: false;

			var mask,x_axis_node,y_axis_node,initial,svg;

			(svgNotExist)
				? (svg = d3.select(element[0])
					.append("svg:svg")
					.attr("width", full_width)
					.attr("height", full_height)
					.attr("class","bar-chart")
						.append("svg:g")
					.attr("transform", "translate(" + margin.left + "," + margin.top +")"),
					initial = true
				)
				: svg = d3.select(element[0]).select('svg g');

			var bar_nodes = svg.selectAll(".bar")
				.data(data);

			bar_nodes.exit().remove();

			bar_nodes.enter().append("rect")
				.attr("class", "bar")
				.attr("y", function(d) { return y(0); });

			bar_nodes.style('fill',function(d,i){ return (colorScale != undefined)
						? colorScale(i)
						: barColor;
				});

			bar_nodes.transition().duration(300)
				.attr("x", function(d) { return x(d.x); })
				.attr("y", function(d,i) { return y(d.y); })
				.attr("width", x.rangeBand())
						.attr("height", function(d) { return height - y(d.y); })
						.delay(function(d,i) { return i*config.delayedEntrance; });

			//Remove and redraw x_axis because bottom to top animation.
			svg.select('.axis.x').remove();

			mask = svg.append('rect')
				.attr('class','mask')
				.attr("y",height)
				.attr("x",0)
				.attr("width",width)
				.attr("height",margin.bottom)
				.style("fill", backgroundColor);

			x_axis_node = svg.append('g')
				.attr('class','axis x')
				.attr('transform', 'translate(' + 0 + ',' + height + ')');

			(initial) ? (
				y_axis_node = svg.append('g')
					.attr('class','axis y')
					.attr('transform', 'translate(' + 0 + ',' + 0 + ')'),
					initial=false)
				: false;

			(config.xAxis.showAxis) ? svg.select('.x.axis').transition().duration(300).call(x_axis) : false;
			(config.yAxis.showAxis) ? svg.select('.y.axis').transition().duration(300).call(y_axis) : false;

		}

		function barChartHorizontal(config,data,element,attrs){

			var margin = config.margin,
				full_width = attrs.$$element[0].parentNode.clientWidth,
				full_height = attrs.$$element[0].parentNode.offsetHeight,
				width = full_width - margin.left - margin.right,
				height = full_height - margin.top - margin.bottom;

			var x = eval(config.xAxis.scale);
			x.domain([0,d3.max(data, function (d) { return d.x; })]);

			var y = d3.scale.ordinal()
				.rangeRoundBands([0,height],config.yAxis.barPadding,config.yAxis.barOuterPadding);

			var y_domain = [];
			data.map(function(d){y_domain.push(d.y)});
			y.domain(y_domain);

			var xAxis = d3.svg.axis()
				.scale(x)
				.orient(config.xAxis.orient)
				.ticks(eval(config.xAxis.ticks))
				.tickSize(config.xAxis.tickSize)
				.outerTickSize(config.xAxis.outerTickSize)
				.innerTickSize(config.xAxis.innerTickSize)
				.tickPadding(config.xAxis.tickPadding)
				.tickFormat((config.xAxis.tickFormat) ? eval(config.xAxis.tickFormat) : null)
				.tickValues(eval(config.xAxis.tickValues));

			var yAxis = d3.svg.axis()
				.scale(y)
				.orient(config.yAxis.orient)
				.ticks(eval(config.yAxis.ticks))
				.tickSize(config.yAxis.tickSize)
				.outerTickSize(config.yAxis.outerTickSize)
				.innerTickSize(config.yAxis.innerTickSize)
				.tickPadding(config.yAxis.tickPadding)
				.tickFormat((config.yAxis.tickFormat) ? eval(config.yAxis.tickFormat) : null)
				.tickValues(eval(config.yAxis.tickValues));

			var colorScale = d3.scale.category20();

			var svgNotExist = d3.select(element[0]).select('svg')
					.select('g')[0][0] == null;

			var x_axis_node, y_axis_node, initial, svg;

			/*(config.yAxis.showAxis)
				? margin = leftMarginToBiggestYLabelWidth(element, yAxis, margin)
				: false;*/

			(svgNotExist)
				? (svg = d3.select(element[0])
					.append("svg:svg")
					.attr("class", "line-chart")
					.attr("width", full_width)
					.attr("height", full_height)
					.append("svg:g")
					.attr("transform", "translate(" + margin.left + "," + margin.top + ")"),

					initial = true
			)
				: svg = d3.select(element[0]).select('svg g');

			(initial)
				? (
					x_axis_node = svg.append("g")
						.attr("class", "x axis")
						.attr("transform", "translate(0," + (height) + ")")
						.call(xAxis),

					x_axis_node.append("text")
						.style("text-anchor", "end")
						.style("font-size", ".6em")
						.attr("dx", (width - 5) + "px")
						.attr("dy", "1.5em")
						.text(config.XlabelText),

					y_axis_node = svg.append("g")
						.attr("class", "y axis")
						.call(yAxis),

					y_axis_node.append("text")
						.attr("class", "axis-label")
						.attr("transform", "rotate(-90)")
						.attr("y", 6)
						.attr("dy", ".6em")
						.style("text-anchor", "end")
						.style("font-size", ".6em")
						.text(config.YlabelText),

					initial = false
				)
				: (
					svg.select(".x.axis")
						.transition().duration(750)
						.call(xAxis),
					svg.select(".y.axis")
						.transition().duration(750)
						.call(yAxis)
				);

			var bar_nodes = svg.selectAll(".bar")
				.data(data);

			bar_nodes.exit().remove();

			bar_nodes.enter().append("rect")
				.attr("class", "bar")
				.attr("x", 0)
				.attr("y", function(d,i) { return y(d.y); });

			bar_nodes.style('fill',function(d,i){ return (colorScale != undefined)
				? colorScale(i)
				: barColor;
			});

			bar_nodes.transition().duration(300)
				.attr("height", y.rangeBand())
				.attr("width", function(d) { return x(d.x); })
				.attr("y", function(d,i) { return y(d.y); })
				.delay(function(d,i) { return i * config.delayedEntrance; });

		}

		function lineChart(config,data,element,attrs) {

			var margin = config.margin,
				full_width = attrs.$$element[0].parentNode.clientWidth,
				full_height = attrs.$$element[0].parentNode.offsetHeight,
				width = full_width - margin.left - margin.right,
				height = full_height - margin.top - margin.bottom;

			var x = eval(config.xAxis.scale);
			var y = eval(config.yAxis.scale);

			var xAxis = d3.svg.axis()
				.scale(x)
				.orient(config.xAxis.orient)
				.ticks(eval(config.xAxis.ticks))
				.tickSize(config.xAxis.tickSize)
				.outerTickSize(config.xAxis.outerTickSize)
				.innerTickSize(config.xAxis.innerTickSize)
				.tickPadding(config.xAxis.tickPadding)
				.tickFormat((config.xAxis.tickFormat) ? eval(config.xAxis.tickFormat) : null)
				.tickValues(eval(config.xAxis.tickValues));

			x.domain(d3.extent(data, function (d) { return d.x; }));

			var yAxis = d3.svg.axis()
				.scale(y)
				.orient(config.yAxis.orient)
				.ticks(eval(config.yAxis.ticks))
				.tickSize(config.yAxis.tickSize)
				.outerTickSize(config.yAxis.outerTickSize)
				.innerTickSize(config.yAxis.innerTickSize)
				.tickPadding(config.yAxis.tickPadding)
				.tickFormat((config.yAxis.tickFormat) ? eval(config.yAxis.tickFormat) : null)
				.tickValues(eval(config.yAxis.tickValues));

			y.domain(d3.extent(data, function (d) { return d.y;	}));

			var svgNotExist = d3.select(element[0]).select('svg')
					.select('g')[0][0] == null;

			var x_axis_node, y_axis_node, initial, svg;

			(config.yAxis.showAxis)
				? margin = leftMarginToBiggestYLabelWidth(element, yAxis, margin)
				: false;

			(svgNotExist)
				? (svg = d3.select(element[0])
					.append("svg:svg")
					.attr("class", "line-chart")
					.attr("width", full_width)
					.attr("height", full_height)
					.append("svg:g")
					.attr("transform", "translate(" + margin.left + "," + margin.top + ")"),

					initial = true
			)
				: svg = d3.select(element[0]).select('svg g');

			var line = d3.svg.line()
				.x(function (d) {
					return x(d.x);
				})
				.y(function (d) {
					return y(d.y);
				});

			(initial)
				? (
					((config.xAxis.showAxis) ?
						(x_axis_node = svg.append("g")
							.attr("class", "x axis")
							.attr("transform", "translate(0," + (height) + ")")
							.call(xAxis),

							x_axis_node.append("text")
								.style("text-anchor", "end")
								.style("font-size", ".6em")
								.attr("dx", (width - 5) + "px")
								.attr("dy", "1.5em")
								.text(config.XlabelText))
						: null),

					((config.yAxis.showAxis) ? (
						y_axis_node = svg.append("g")
							.attr("class", "y axis")
							.call(yAxis),
						y_axis_node.append("text")
							.attr("class", "axis-label")
							.attr("transform", "rotate(-90)")
							.attr("y", 6)
							.attr("dy", ".6em")
							.style("text-anchor", "end")
							.style("font-size", ".6em")
							.text(config.YlabelText))
						: null),

					svg.append("path")
						.attr("class", "line")
						.attr("d", line(data))
					)
				: (
					svg.select(".x.axis")
						.transition().duration(750)
						.call(xAxis),
					svg.select(".y.axis")
						.transition().duration(750)
						.call(yAxis),
					svg.select(".line")
						.transition().duration(750)
						.attr("d", line(data))
				)
		}

		function scatterPlot(config,data,element,attrs){

			var margin = config.margin,
				full_width = attrs.$$element[0].parentNode.clientWidth,
				full_height= attrs.$$element[0].parentNode.offsetHeight,
				width = full_width - margin.left - margin.right,
				height = full_height - margin.top - margin.bottom;

			var x = d3.scale.linear().range([0,width]);
			var y = d3.scale.linear().range([height,0]);
			var color_scale = d3.scale.category20();

			var x_axis = d3.svg.axis()
				.scale(x)
				.orient(config.xAxis.orient)
				.ticks(eval(config.xAxis.ticks))
				.tickSize(config.xAxis.tickSize)
				.outerTickSize(config.xAxis.outerTickSize)
				.innerTickSize(config.xAxis.innerTickSize)
				.tickPadding(config.xAxis.tickPadding)
				.tickFormat((config.xAxis.tickFormat) ? eval(config.xAxis.tickFormat) : null)
				.tickValues(eval(config.xAxis.tickValues));

			var y_axis = d3.svg.axis()
				.scale(y)
				.orient(config.yAxis.orient)
				.ticks(eval(config.yAxis.ticks))
				.tickSize(config.yAxis.tickSize)
				.outerTickSize(config.yAxis.outerTickSize)
				.innerTickSize(config.yAxis.innerTickSize)
				.tickPadding(config.yAxis.tickPadding)
				.tickFormat((config.yAxis.tickFormat) ? eval(config.yAxis.tickFormat) : null)
				.tickValues(eval(config.yAxis.tickValues));

			//Set up axis
			var max_y = d3.max(data,function(d){ return d.y; });
			y.domain([0,max_y * 1.1]);

			var max_x = d3.max(data,function(d){ return d.x; });
			x.domain([0,max_x * 1.1]);

			var svgNotExist =  d3.select(element[0])
					.select('svg')
					.select('g')[0][0] == null;

			(config.yAxis.showAxis)
				? margin = leftMarginToBiggestYLabelWidth(element,y_axis,margin)
				: false;

			var svg;

			(svgNotExist)
				? (svg = d3.select(element[0])
					.append("svg:svg")
					.attr("width", full_width)
					.attr("height", full_height)
					.attr("class","bar-chart")
						.append("svg:g")
					.attr("transform", "translate(" + margin.left + "," + margin.top +")")
				)
				: svg = d3.select(element[0]).select('svg g');

			var dot = svg.selectAll('.dot')
				.data(data);

			dot.enter().append('g')
				.attr('transform',function(d){ return 'translate(' + x(d.x) + ',' + height + ')' })
				.attr('class','dot')
					.append('circle').attr('r',2).attr('fill',function(d){ return color_scale(d.cat) });

			dot.exit().transition().duration(100)
				.remove();

			dot.transition().duration(500)
				.attr('transform',function(d){ return 'translate(' + x(d.x) + ',' + y(d.y) + ')' });

			(svg.selectAll('.x')[0].length === 0 && (config.xAxis.showAxis))
				? svg.append('g').attr('transform','translate(0,' + height + ')').attr('class','x axis').transition().duration(250).call(x_axis)
				: svg.selectAll('.x').transition().duration(250).call(x_axis);

			(svg.selectAll('.y')[0].length === 0 && (config.yAxis.showAxis))
				? svg.append('g').attr('class','y axis').transition().duration(250).call(y_axis)
				: svg.selectAll('.y').transition().duration(250).call(y_axis);

		}

		/***********
		*
		* Utils
		*
		* **********/

		function leftMarginToBiggestYLabelWidth(element,y_axis,margin){
				var y_format,widest_y_label;
				//Set the margin left to display the longest label on y axis.
				y_format = y_axis.scale().tickFormat(),
				widest_y_label = d3.select(element[0]).append('text')
					.text(y_format(y_axis.scale().ticks()[y_axis.scale().ticks().length -1])),
				//Only if the given margin.left on the config object is smaller than the biggest label.
				(margin.left < widest_y_label[0][0].offsetWidth * 1.5 )
					? (console.info('refactoring margin'),margin.left = (widest_y_label[0][0].offsetWidth * 1.5))
					: false;
				widest_y_label.remove();
				return margin;
			}

		/***********
		*
		* Directive
		*
		* **********/

		return {
			restrict: 'E',
			scope: {
				dataset:'=',
				config:'='
			},
			link: function(scope,element,attrs){
				var d3isReady = d3Loader.d3();
				scope.$watch('dataset',function(newData,oldData){
					(newData)
						? (d3isReady.then(function(){ $timeout(function(){
							var chartToDraw = eval(scope.config.chartType);
							(chartToDraw)
								? chartToDraw(scope.config,newData,element,attrs)
								: console.error('Invalid chart name. Please adjust your chartType parameter.');
						});}))
						: false;
				});
			}
		};
	}]);
	return moduleName;
}));