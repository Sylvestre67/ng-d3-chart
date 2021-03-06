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

	mod.factory('chartConfig',[function(){

		var chartConfig = function(config){

			this.chartType    = config.chartType || null;
			this.xMark        = config.xMark || 'x';
			this.yDimension   = config.yDimension || 'y';
			this.orderBy      = config.orderBy || null;

			this.markClickCallback  = config.markClickCallback || null;

			this.addLabelToMark     = config.addLabelToMark || false;
			this.markLabelFormat    = config.markLabelFormat  || false;

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

			var bubbleConfig = function(config){
				this.areaDimension  = config.areaDimension  || null;
				this.colorDimension = config.colorDimension || null;
			};

			this.xAxis =  new xAxisConst(config.xAxis);
			this.yAxis =  new yAxisConst(config.yAxis);

			(config.bubbleConfig)
				? this.bubbleConfig = new bubbleConfig(config.bubbleConfig)
				: false;

			//Basic style configuration
			/**** barChart specific ****/
			this.barColor = config.barColor || '#3498DB';
			this.bakcgroundColor = config.bakcgroundColor || 'white';

			//Animation configuration
			/**** barChart specific ****/
			this.delayedEntrance = config.delayedEntrance || 100;
		};

		return chartConfig;

	}]);

	var resizeTimer;

	mod.directive('resizeWindow',['$window','$timeout',function($window,$timeout) {
		return function (scope, element) {
				var onAir = false;

				$timeout(function(){ onAir = true; });

				scope.$watchCollection(function() {
					return angular.element($window)[0].innerWidth;
				},
				function() {
					clearTimeout(resizeTimer);
					resizeTimer = setTimeout(function() {
					(onAir) ? (scope.$root.$broadcast('windowReSize',{})) : false;
				}, 250);
			});
		}
	}]);

	mod.directive('ngBarChart', ['d3Loader','$timeout','$window', function(d3Loader,$timeout,$window) {

		return {
			restrict: 'E',
			scope: {
				dataset:'=',
				config:'='
			},
			link: function(scope,element,attrs){
				scope.waitForResize = false;
				var d3isReady = d3Loader.d3();
				$timeout(function(){
					scope.$watchCollection('[dataset,config]',function(newCollection,oldData){
						var newData = newCollection[0];
						var newConfig = newCollection[1];
						(newData && newConfig)
							? (d3isReady.then(function(){ $timeout(function(){
								var chartToDraw = eval(scope.config.chartType);
								(chartToDraw)
									? ( chartToDraw(newConfig,newData,element,attrs),
										scope.$on('windowReSize',function(){
											element.html(''),
											chartToDraw(newConfig,newData,element,attrs); }
										)
									)
									:  console.error('Invalid chart name. Please adjust the chartType parameter.');
								});
							}))
							: false;
						},true);
					}
				)
			}
		};



		/***********
		 * Chart functions
		 * **********/

		function barChartVertical(config,data,element,attrs){

			var margin = config.margin,
				full_width = attrs.$$element[0].parentNode.clientWidth,
				full_height= (attrs.$$element[0].parentNode.offsetHeight) * .95,
				width = full_width - margin.left - margin.right,
				height = full_height - margin.top - margin.bottom,
				barColor = config.barColor,
				backgroundColor = config.bakcgroundColor,
				colorScale;

			// Mark labels
			var bar_label_format = eval(config.markLabelFormat);

			//Support for full width ticks, grid on the whole width of chart.
			var xAxis_innerTickSize = (config.xAxis.innerTickSize === 'full_width') ? (- width) : config.xAxis.innerTickSize;
			var yAxis_innerTickSize = (config.yAxis.innerTickSize === 'full_width') ? (- width) : config.yAxis.innerTickSize;

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
				.innerTickSize(xAxis_innerTickSize)
				.tickPadding(config.xAxis.tickPadding)
				.tickFormat((config.xAxis.tickFormat) ? eval(config.xAxis.tickFormat) : null)
				.tickValues(eval(config.xAxis.tickValues));

			var y_axis = d3.svg.axis()
				.scale(y)
				.orient(config.yAxis.orient)
				.ticks(eval(config.yAxis.ticks))
				.tickSize(config.yAxis.tickSize)
				.outerTickSize(config.yAxis.outerTickSize)
				.innerTickSize(yAxis_innerTickSize)
				.tickPadding(config.yAxis.tickPadding)
				.tickFormat((config.yAxis.tickFormat) ? eval(config.yAxis.tickFormat) : null)
				.tickValues(eval(config.yAxis.tickValues));

			// Set up x_axis with non-numeric values.
			var x_domain = [];
			angular.forEach(data,function(d,i){	x_domain.push(d[config.xMark]); });
			x.domain(x_domain);

			//Set up y_axis
			var max_y = d3.max(data,function(d){ return d[config.yDimension]; });
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

			(initial) ? (
					y_axis_node = svg.append('g')
						.attr('class','axis y')
						.attr('transform', 'translate(' + 0 + ',' + 0 + ')'),
						initial=false
				)
				: false;

			var bars = svg.selectAll('.bar').data(data);

			bars.enter().append("rect")
				.attr("class", (config.markClickCallback) ? "bar clickable" : "bar")
				.attr("y", function(d) { return y(0); })
				.style('fill',function(d,i){ return (colorScale != undefined)
					? colorScale(i)
					: barColor;
				});

			bars.exit().remove();

			bars.transition().duration(300)
				.attr("x", function(d) { return x(d[config.xMark]); })
				.attr("y", function(d,i) { return y(d[config.yDimension]); })
				.attr("width", x.rangeBand())
				.attr("height", function(d) { return height - y(d[config.yDimension]); })
				.delay(function(d,i) { return i*config.delayedEntrance; });

			svg.selectAll('.label-node').remove();

			var label_nodes = svg.selectAll('.label-node').data(data);

			var label_node = label_nodes.enter().append('g')
				.attr("transform", function(d) {
					return "translate("
						+ (x(d[config.xMark]) + x.rangeBand()*.5) + ","
						+ (y(d[config.yDimension]) - 5) + ")" ;
				})
				.attr('class','label-node');

			(config.addLabelToMark)
				? label_node.append('text')
					.style('opacity',0)
					.attr('class','bar-label')
					.text(function(d){ return bar_label_format(d[config.yDimension])})
					.transition().duration(300).style('opacity',1).delay(function(d,i) { return i*config.delayedEntrance; })
				: false;

			//Remove and redraw x_axis because bottom to top animation.
			svg.select('.axis.x').remove();

			mask = svg.append('rect')
				.attr('class','mask')
				.attr("y",height)
				.attr("x",0)
				.attr("width",width)
				.attr("height",margin.bottom )
				.style("fill", backgroundColor);

			x_axis_node = svg.append('g')
				.attr('class','axis x')
				.attr('transform', 'translate(' + 0 + ',' + height + ')');

			(config.xAxis.showAxis) ? svg.select('.x.axis').transition().duration(300).call(x_axis)
					.selectAll('.tick text').call(wrap, x.rangeBand() * 1.1)
				: false;
			(config.yAxis.showAxis) ? svg.select('.y.axis').transition().duration(300).call(y_axis)
				: false;

			/**
			 * Events
			 * ***/
			(config.markClickCallback)
				? bars.on('click',function(){ eval(config.markClickCallback) })
				: false;

		}

		function barChartHorizontal(config,data,element,attrs){

			var margin = config.margin,
				full_width = attrs.$$element[0].parentNode.clientWidth,
				full_height = attrs.$$element[0].parentNode.offsetHeight,
				width = full_width - margin.left - margin.right,
				height = full_height - margin.top - margin.bottom;

			// Mark labels
			var bar_label_format = eval(config.markLabelFormat);

			var x = eval(config.xAxis.scale);
			x.domain([0,d3.max(data, function (d) { return d[config.xMark]; })]);

			var y = d3.scale.ordinal()
				.rangeRoundBands([0,height],config.yAxis.barPadding,config.yAxis.barOuterPadding);

			var y_domain = [];
			data.map(function(d,i){y_domain.push(i)});
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

			var colorScale;
			//If color_scale is provided
			(config.barColor.indexOf('d3.scale') > -1)
				? colorScale = eval(config.barColor)
				: false;

			var svgNotExist = d3.select(element[0]).select('svg')
					.select('g')[0][0] == null;

			var x_axis_node, y_axis_node, initial, svg;

			(svgNotExist)
				? (svg = d3.select(element[0])
						.append("svg:svg")
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

			var bar_nodes = svg.selectAll(".bar-node")
				.data(data.sort(function(a, b){ return b.y - a.y; }));

			bar_nodes.exit().remove();

			var bar_node = bar_nodes.enter().append('g')
				.attr('class','bar-node')
				.attr('transform',function(d,i) { return 'translate(0,' + y(i) + ')'});

			var bar = bar_node.append("rect")
				.attr("class", "bar")
				.attr("height", y.rangeBand());

			bar.style('fill',function(d,i){ return (colorScale != undefined)
				? colorScale(d[config.xMark])
				: barColor;
			});

			bar.transition().duration(300)
				.attr("width", function(d) { return x(d[config.xMark]); })
				.delay(function(d,i) { return i * config.delayedEntrance; });

			(config.addLabelToMark)
				? bar_node.append('text')
					.style('opacity',0)
					.style('font-size','12px')
					.attr('class','bar-label')
					.attr("y", function(d) { return y.rangeBand() * .5 + 6; })
					.attr("x", width + 5)
					.text(function(d){ return bar_label_format(d[config.xMark])})
					.transition().duration(300).style('opacity',1).delay(function(d,i) { return i*config.delayedEntrance; })
				: false;

			// Labelling to use cat instead of i
			var labels = svg.selectAll(".label")
				.data(data.sort(function(a, b){ return b.y - a.y; }));

			labels.exit().remove();

			labels.enter()
				.append('g').attr('class','label')
				.attr('transform', function(d,i) { return 'translate(' + -5 + ',' + (y(i) + y.rangeBand() *.5 + 3 ) + ')' });

			labels.transition().duration(300)
				.attr('transform', function(d,i) { return 'translate(' + -5 + ',' + (y(i) + y.rangeBand() *.5 + 3 ) + ')' });

			svg.selectAll('.label text').remove();

			labels.append('text').style('text-anchor','end');

			svg.selectAll('.label text').transition().text(function(d,i){ return d[config.yDimension] });

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
			var max_y = d3.max(data,function(d){ return d[config.yDimension]; });
			y.domain([0,max_y * 1.1]);

			var max_x = d3.max(data,function(d){ return d[config.xMark]; });
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
				.attr('transform',function(d){ return 'translate(' + x(d[config.xMark]) + ',' + height + ')' })
				.attr('class','dot')
				.append('circle').attr('r',2).attr('fill',function(d){ return color_scale(d.cat) });

			dot.exit().transition().duration(100)
				.remove();

			dot.transition().duration(500)
				.attr('transform',function(d){ return 'translate(' + x(d[config.xMark]) + ',' + y(d[config.yDimension]) + ')' });

			(svg.selectAll('.x')[0].length === 0 && (config.xAxis.showAxis))
				? svg.append('g').attr('transform','translate(0,' + height + ')').attr('class','x axis').transition().duration(250).call(x_axis)
				: svg.selectAll('.x').transition().duration(250).call(x_axis);

			(svg.selectAll('.y')[0].length === 0 && (config.yAxis.showAxis))
				? svg.append('g').attr('class','y axis').transition().duration(250).call(y_axis)
				: svg.selectAll('.y').transition().duration(250).call(y_axis);

		}

		function bubbleChart(config,data,element,attrs){
			var margin = config.margin,
				full_width = attrs.$$element[0].parentNode.clientWidth,
				full_height= attrs.$$element[0].parentNode.offsetHeight,
				width = full_width - margin.left - margin.right,
				height = full_height - margin.top - margin.bottom;

			var x = d3.scale.ordinal().rangeRoundBands([0,width],config.xAxis.barPadding,config.xAxis.barOuterPadding);
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
			var max_y = d3.max(data,function(d){ return d[config.yDimension]; });
			y.domain([0,max_y * 1.1]);
			x.domain(data.map(function(object){ return object[config.xMark] } ));

			// Define this axis here as it takes x.rangeBand into its argument.
			var bubble_radius_scale = d3.scale.linear()
				.range([0,x.rangeBand() * .5])
				.domain([0,max_y]);

			var bubble_color_scale = (config.colorScale) ? eval(config.colorScale) : false;

			var svgNotExist =  d3.select(element[0])
					.select('svg')
					.select('g')[0][0] == null;

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

			//svg.append('circle').attr('r',10).attr('fill','rgb(73, 163, 223)');

			var mark_node = svg.selectAll('.mark_node').data(data);

			mark_node.exit().remove();

			mark_node.enter().append('g')
				.attr('transform',function(d,i) { return 'translate(' + (x(d[config.xMark]) + x.rangeBand()*.5) + ',' + y(d[config.yDimension]) + ')'} )
				.attr('class','mark_node');

			var bubble = mark_node.append('circle')
				.style('opacity', 0)
				.attr('r', function(d,i){ return bubble_radius_scale(d[config.bubbleConfig.areaDimension]) })
				.attr('fill',function(d,i){ return (bubble_color_scale) ? bubble_color_scale(config.colorDimension) : 'rgb(73, 163, 223)' });

			bubble.transition().duration(300).style('opacity', 1);

			y_axis_node = svg.append('g')
				.attr('class','axis y')
				.attr('transform', 'translate(' + 0 + ',' + 0 + ')');

			x_axis_node = svg.append('g')
				.attr('class','axis x')
				.attr('transform', 'translate(' + 0 + ',' + height + ')');

			(config.xAxis.showAxis) ? svg.select('.x.axis').transition().duration(300).call(x_axis)
				: false;
			(config.yAxis.showAxis) ? svg.select('.y.axis').transition().duration(300).call(y_axis)
				: false;


		}

		function donutChart(config,data,element,attrs){

			var margin = config.margin,
				full_width = attrs.$$element[0].parentNode.clientWidth,
				full_height= (attrs.$$element[0].parentNode.offsetHeight) * .95,
				width = full_width - margin.left - margin.right,
				height = full_height - margin.top - margin.bottom,
				radius = (Math.min(width, height) / 2) - 50,
				colorScale,arc,labelArc,labelCoord,percentFormat;

			//SETTING UP DATA
			var dataset = [
				{"gender":"male",
					"value":d3.sum(data.map(function(d){ return d.data[0].value})) * 0.01 },
				{"gender":"female",
					"value":d3.sum(data.map(function(d){ return d.data[1].value})) * 0.01},
			];

			colorScale = eval(config.colorScale);

			percentFormat = d3.format('%');

			arc = d3.svg.arc()
				.outerRadius(radius)
				.innerRadius(radius * .4);

			labelArc = d3.svg.arc()
				.outerRadius(radius * 2)
				.innerRadius(radius * .4);

			var pie = d3.layout.pie()
				.sort(null)
				.value(function(d) { return d[config.xMark]; });

			labelCoord = pie(dataset).map(function(obj){ return {data:obj.data,coord:labelArc.centroid(obj)}; });

			var svg = d3.select(element[0]).append("svg")
				.attr("width", width)
				.attr("height", height)
				.append("g")
				.attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

			var g = svg.selectAll(".arc")
				.data(pie(dataset))
				.enter().append("g")
				.attr("class", "arc");

			g.append("path")
				.attr("d", arc)
				.style("fill", function(d) { return colorScale(d.data[config.yDimension]); });

			var labels = svg.selectAll(".label")
				.data(labelCoord);

			labels.enter().append('g')
				.attr('class','label')
				.attr('transform',function(d,i){ return 'translate(' + d.coord[0] + ',' + d.coord[1] + ')'});

			labels.append('text')
				.attr('font-family', 'FontAwesome')
				.attr('font-size', function(d) { return '36px'} )
				.attr('fill',function(d,i){ return colorScale(d.data.gender) })
				.attr('dy',function(d,i){ return (d.data.value > .7) ? '23px' : '0';} )
				.style('text-anchor',function(d,i) {
					return (d.data.gender === 'male')
						? 'start'
						: 'end';
				})
				.text(function(d,i) {
					return (d.data.gender === 'female')
						? '\uf182'
						: '\uf183';
				})
				.style('opacity','0')
				.transition().duration(500)
				.style('opacity','1');

			labels.append('text')
				.attr('font-family', '"Open Sans",Helvetica,Arial,sans-serif;')
				.attr('font-size', function(d) { return '20px'} )
				.attr('font-weight', function(d) { return '400'} )
				.attr('fill',function(d,i){ return colorScale(d.data.gender) })
				.attr('dy',function(d,i){ return (d.data.value > .7) ? '15px' : '-5px';} )
				.attr('dx',function(d,i){ return (d.data.gender === 'female') ? '-30px' : '30px';} )
				.style('text-anchor',function(d,i) {
					return (d.data.gender === 'male')
						? 'start'
						: 'end';
				})
				.text(function(d,i) {
					return (d.data.gender === 'female')
						? percentFormat(d.data.value)
						: percentFormat(d.data.value);
				})
				.style('opacity','0')
				.transition().duration(500)
				.style('opacity','1');

		}

		function demoBarChart(config,data,element,attrs){

			var margin = config.margin,
				full_width = attrs.$$element[0].parentNode.clientWidth,
				full_height= (attrs.$$element[0].parentNode.offsetHeight) * .95,
				width = full_width - margin.left - margin.right,
				height = full_height - margin.top - margin.bottom,
				colorScale;

			var x = d3.scale.ordinal()
				.rangeRoundBands([0,width],config.xAxis.barPadding,config.xAxis.barOuterPadding);

			var y = d3.scale.linear().range([0,height*.5]);

			var x_axis_top = d3.svg.axis()
				.scale(x)
				.orient('top')
				.ticks(eval(config.xAxis.ticks))
				.tickSize(config.xAxis.tickSize)
				.outerTickSize(0)
				//.innerTickSize(config.xAxis_innerTickSize)
				.tickPadding(config.xAxis.tickPadding)
				.tickFormat((config.xAxis.tickFormat) ? eval(config.xAxis.tickFormat) : null)
				.tickValues(eval(config.xAxis.tickValues));

			var x_axis_bottom = d3.svg.axis()
				.scale(x)
				.orient(config.xAxis.orient)
				.ticks(eval(config.xAxis.ticks))
				.tickSize(config.xAxis.tickSize)
				.outerTickSize(0)
				//.innerTickSize(config.xAxis_innerTickSize)
				.tickPadding(config.xAxis.tickPadding)
				.tickFormat((config.xAxis.tickFormat) ? eval(config.xAxis.tickFormat) : null)
				.tickValues(eval(config.xAxis.tickValues));


			// Set up x_axis with non-numeric values.
			var x_domain = data.map(function(d,i){ return d[config.xMark]} );
			//angular.forEach(data,function(d,i){	x_domain.push(d[config.xMark]); });
			x.domain(x_domain);

			// Find female_max
			var female_max = d3.max(data,function(d,i){ return d.data[1].value});
			var male_max = d3.max(data,function(d,i){ return d.data[0].value});
			var max_y = d3.max([female_max,male_max]);
			y.domain([0,max_y * 1.2 ]);

			var tooltip = d3.select('body')
				.append('div')
				.style("opacity",0)
				.attr('class','t-tip');

			//tooltip.html('<p>ToolTip</p>');

			var svg = d3.select(element[0])
				.append("svg:svg")
				.attr("width", full_width)
				.attr("height", full_height)
				.attr("class","demo-bar-chart")
				.append("svg:g")
				.attr("transform", "translate(" + margin.left + "," + margin.top +")");

			var y_node = svg.selectAll('.y-ticks')
				.data([1,2,3,4,5,6]);

			y_node.enter().append('g')
				.attr('class','y-ticks')
				.attr('transform', function(d,i){ return 'translate(' + 10 + ',' + (height/6) * i + ')'} );

			y_node.append('line')
				.style('fill','none')
				.style('stroke', function(d,i){ return (i !== 0 ) ? '#eee' : false; })
				.attr('x1', -10).attr('y1',0).attr('x2',(width - margin.right)).attr('y2',0);


			var bar_node = svg.selectAll('.bar').data(data);

			bar_node.enter().append('g')
				.attr('class','bar')
				.attr('transform',function(d,i){ return 'translate(' + x(d[config.xMark]) + ',' + height/2 +')'; });

			//bar_node.append('circle').attr('fill','red').attr('r',5);

			var bar = bar_node.selectAll('.bar')
				.data(function(d){ return d.data; })

			var rect = bar.enter('rect')
				.append('rect')
				.attr('class','bar')
				.attr('width',x.rangeBand() + 'px')
				.style('fill',function(d,i){
					return (d.gender === 'male')
						?  "#00A1E4"
						:  "#0d233a";
				})
				.attr('transform',function(d,i){
					return (d.gender === 'male')
						?  'translate(0,0)'
						: 'translate(0,' + -y(d.value)  + ')';
				})
				.attr('height',function(d,i){ return y(d.value); });

			rect.on('mouseenter',function(d){
				d3.select('.t-tip').html('<span>' + d.value + '%' + '</span>')
					.style("opacity",1)
					.style("left", (d3.event.pageX) + "px")
					.style("top", (d3.event.pageY) - 20 + "px");
			});

			rect.on('mouseout',function(d){
				d3.select('.t-tip').style("opacity",0)
					.style("left", 1000 + "px")
					.style("top", 1000 + "px");
			});

			var x_node_top = svg.append('g')
				.attr('class','axis x')
				.attr('transform', 'translate(' + 0 + ',' + 0 + ')')
				.call(x_axis_top);

			var x_node_bottom = svg.append('g')
				.attr('class','axis x')
				.attr('transform', 'translate(' + 0 + ',' + height + ')')
				.call(x_axis_bottom);

		}

		/***********
		 * Utils
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

		/**
		 * From: http://bl.ocks.org/mbostock/7555321
		 * **/

		function wrap(text, width) {
			text.each(function() {
				var text = d3.select(this),
					words = text.text().split(/\s+/).reverse(),
					word,
					line = [],
					lineNumber = 0,
					lineHeight = 1.1, // ems
					y = text.attr("y"),
					dy = parseFloat(text.attr("dy")),
					tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");
				while (word = words.pop()) {
					line.push(word);
					tspan.text(line.join(" "));
					if (tspan.node().getComputedTextLength() > width) {
						line.pop();
						tspan.text(line.join(" "));
						line = [word];
						tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
					}
				}
			});
		}

	}]);
	return moduleName;
}));