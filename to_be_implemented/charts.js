//FUNCTIONS USED ACROSS THE DISPLAY D3 CHARTS

////////////////////////////////////////////////////////////////////
//
//				    DOES NOT DISPLAY REAL DATA
//
//////////////////////////////////////////////////////////////////

function render_social_reach(element_id,dataset){

	var margin = {top: 10, right: 10, bottom: 10, left: 10},
		full_width = parseInt($(element_id).parent().width(), 10),
		width = full_width - margin.left - margin.right,
		full_height = 60,
		height = full_height - margin.top - margin.bottom,
		bar_padding = 0,
		bar_height = 30;

	var max_dataset = (d3.max(dataset,function(d){ return d.value; }));

	var x = d3.scale.linear()
		.domain([0,max_dataset])
		.range([0,width]);

	var color = d3.scale.ordinal()
		.domain(['YouTube','Facebook','Twitter','Vine'])
		.range(['#bb0000','#3b5998','#00aced','#aad450']);


	var graph = d3.select(element_id)
			.append('svg')
			.attr('width',width)
			.attr('height',height)
				.append('g')
				.attr('transform','translate(' + (full_width) + ',' + margin.top + ')');

	var rectangle = graph.selectAll('rect')
		.data(dataset)
		.enter().append('rect')
			.attr('height',bar_height)
			.attr('width',width)
		.transition()
		.duration(1000)
			.attr('transform', function(d,i){ return 'translate(' + -(x(d.value)) + ',' + bar_padding + ')'})
			.attr('fill', function(d,i){ return color(d.network); });
}

function render_demographic_chart(element_id,url_api_call,reformat) {

	var categories = ['13-17', '18-24', '25-34', '35-44', '45-54', '55-64', '65+', ''],
		colors = [{female: '#3BB6E2', male: '#2B2F86'}],
		margin = {top: 30, right: 20, bottom: 40, left: 2},
		full_width = parseInt($(element_id).parent().width(), 10),
		width = full_width - margin.left - margin.right,
		full_height = 400,
		height = full_height - margin.top - margin.bottom,
		padding_top = 40,
		basis_padding = 3,
		barPadding = 20;

	var label_number_format = d3.format(".2n");

	var x = d3.scale.ordinal()
		.domain(categories)
		.rangePoints([0, width]);

	var y = d3.scale.linear()
		.range([0, height / 2]);

	var y_female = d3.scale.linear()
		.range([height / 2, 0]);

	var y_male = d3.scale.linear()
		.range([height * .5, height]);

	var x_axis = d3.svg.axis()
		.scale(x)
		.orient('bottom')
		.ticks(7);

	var x_axis_top = d3.svg.axis()
		.scale(x)
		.orient('top')
		.ticks(7);

	function draw(dataset,reformat) {

		var clean_dataset = [];

		if (reformat){
			//REFORMATING THE DATASET
			for (i = 0; i < (categories.length - 1); i++) {
				var values = {'male': dataset['male'][i], 'female': dataset['female'][i]};
				clean_dataset[i] = values;
				}

			var max_female = d3.max(clean_dataset, function (d) {
					return d['female'];
				});

			var max_male = d3.max(clean_dataset, function (d) {
					return d['male'];
				});
		}else{
			//DATSET ALREADY FORMATTED ON THE PYTHON SIDE
			clean_dataset = dataset;

			var max_female = d3.max(clean_dataset, function (d) {
				return d['female'];
			});

			var max_male = d3.max(clean_dataset, function (d) {
				return d['male'];
			});
		}

		//TODO:UNIFORMALIZE THE DEMOGRAPHIC DATA ON THE PYTHON SIDE

		var y_values = [];
		for (i = 0; i < clean_dataset.length; i++) {
			y_values.push(clean_dataset[i].male);
			y_values.push(clean_dataset[i].female);
		}

		var yMax = d3.max(y_values);

		y.domain([0, yMax * 1.1]);
		y_female.domain([0, yMax * 1.1]);
		y_male.domain([0, yMax * 1.1]);

		var horizontal_chart = d3.select(element_id).append('svg')
			.attr('width', full_width)
			.attr('height', full_height)
			.append('g')
			.attr('transform', 'translate(' + margin.left + ',' + -(height / 2 - (y(max_female) + padding_top)) + ')')
			.attr('class', 'd3-horizontal-chart');


		var category_node = horizontal_chart.append('g')
			.attr('class', 'category-node');

		var category = category_node.selectAll('g')
			.data(clean_dataset)
			.enter()
			.append('g')
			.attr('class', 'range-node')
			.attr('transform', function (d, i) {
				return 'translate(' + (x(categories[i]) + ((width / 6) * .5)) + ',' + (height / 2) + ')';
			});

		var male_rectangle = category.append('rect')
			.attr('class', 'male-fill male-bar')
			.attr('transform', function (d, i) {
				return 'translate(' + (-( (width / 6) * .5) + barPadding / 2) + ',' + basis_padding + ')';
			})
			.attr('height', function (d) {
				return y(d.male);
			})
			.attr('width', ((width / 7) - barPadding));

		var female_rectangle = category.append('rect')
			.attr('transform', function (d, i) {
				return 'translate(' + (-( (width / 6) * .5) + barPadding / 2) + ',' + -(y(d.female) + basis_padding) + ')';
			})
			.attr('class', 'female-fill female-bar')
			.attr('height', function (d) {
				return y(d.female);
			})
			.attr('width', ((width / 7) - barPadding));

		var x_axis_group_bottom = horizontal_chart.append('g')
			.attr('transform', 'translate(0,' + (height / 2 + (y(max_male) + 15)) + ')')
			.attr('class', 'axis')
			.call(x_axis);

		var x_axis_group_top = horizontal_chart.append('g')
			.attr('transform', 'translate(0,' + (height / 2 - (y(max_female) + 15)) + ')')
			.attr('class', 'axis')
			.call(x_axis_top);

		var axis_label = d3.selectAll('.tick text')
			.attr('transform', 'translate(' + (width / 7 * .5) + ',0)');

		var y_axis_group_male = horizontal_chart.append('g')
			.attr('class', 'axis y')
			.attr('transform', 'translate(0,' + 0 + ')');

		var y_axis_group_female = horizontal_chart.append('g')
			.attr('class', 'axis y')
			.attr('transform', 'translate(0,0)');

		var y_axis_label = d3.selectAll('.y > .tick > text').remove();

		var basis = horizontal_chart.append('g')
			.attr('transform', 'translate(0,' + (height / 2) + ')')
			.attr('class', 'axis');

		var base_line = basis.append('line')
			.attr('x1', 0)
			.attr('x2', width)
			.attr('y1', 0)
			.attr('y2', 0);

		$('.female-bar').tipsy({
			gravity: 'sw',
			html: true,
			title: function () {
				var d = this.__data__, n = label_number_format(d.female);
				return 'Female: ' + n + '%';
			}
		});

		$('.male-bar').tipsy({
			gravity: 'nw',
			html: true,
			title: function () {
				var d = this.__data__, n = label_number_format(d.male);
				return 'Male: ' + n + '%';
			}
		});

		//CROP THE SVG TO REMOVE WHITE SPACE
		var graph_height = $(element_id).children().children()[0].getBoundingClientRect().height;
		$(element_id).children().attr('height', graph_height * 1.05);

	}

	d3.json(url_api_call, function (error, dataset) {
			if (error || $.isEmptyObject(dataset)) {
				d3_throw_error(element_id,dataset,error);
			}
			else {
				$(element_id).removeClass('ajax-loader');
				draw(dataset,reformat);
			}
	});
}

function render_total_demo_bar(element_id,url_api_call){

	var label_number_format = d3.format(".2n");

	var margin = {top: 0, right: 20, bottom: 0, left: 2},
		full_width = parseInt($(element_id).parent().width(), 10),
		width = full_width - margin.left - margin.right,
		full_height = 40,
		height = full_height - margin.top - margin.bottom,
		barHeight = 40;

	var x = d3.scale.linear()
		.domain([-30,130])
		.range([0,width ]);

	function draw(dataset){
		$(element_id).removeClass('ajax-loader');

		var cleaned_dataset = [{'male': label_number_format(dataset['total_male']), 'female': label_number_format(dataset['total_female'])}];

		var total_bar = d3.select(element_id)
			.append('svg')
			.attr('width',full_width)
			.attr('height',full_height)
				.append('g')
				.attr('transform','translate(' + margin.left + ',' + margin.top + ')');

		var bar = total_bar.append('g')
			.data(cleaned_dataset)
				.attr('transform', 'translate(0,' + margin.top + ')')
				.attr('class', 'total-bar');

		var female_bar = bar.append('rect')
			.attr('class','female-total-bar female-fill')
			.attr('width', width )
			.attr('height',barHeight);

		var male_bar = bar.append('rect')
			.attr('class','male-total-bar male-fill')
			.attr('width', width )
			.attr('height',barHeight)
				.transition()
				.duration(1000)
			.attr('transform',function(d) { return 'translate('+ x(d.female) + ',0)'; });

		var male_symbol = total_bar.append('g')
			.data(cleaned_dataset)
				.attr('class','male-total-symbol')
				.attr('transform', function(d,i) {
					//x_translate only if female icon won't be masked/
					if (x(d.female) <= 30){	var x_translate = x(30); }
					else{x_translate = x(d.female);}
					return 'translate('+ x_translate + ',' + ( margin.top + barHeight *.5 ) + ')';
				});

		var male_symbol_icon = male_symbol.append('text')
			.attr('transform','translate('+ 10 + ','+ 10 +')')
			.attr('font-family', 'FontAwesome')
			.attr('font-size', '30px')
			.style('fill','white')
			.text('\uf183');

		var male_value = male_symbol.append('text')
			.attr('transform','translate('+ 34 + ','+ 7.5 +')')
			.attr('class', 'total-value male-total-value')
			.style('fill','white')
			.text(function (d) {
				return 0 + ' %';
			})
				.transition()
				.duration(1000)
				.tween("text", function (d) {
					var currentValue = parseInt(d3.select('.male-total-value').text().substr(0, 2), 10);
					var interpolator = d3.interpolateRound(currentValue, d.male);
					return function (t) {
						this.textContent = interpolator(t) + ' %';
					}});

		var female_symbol = total_bar.append('g')
			.data(cleaned_dataset)
			.attr('class','female-total-symbol')
			.attr('transform','translate(0,' + ( margin.top + barHeight *.5 ) + ')');

		var female_symbol_icon = female_symbol.append('text')
			.attr('transform','translate(10,10)')
			.attr('font-family', 'FontAwesome')
			.attr('font-size', '30px')
			.style('fill','white')
			.text('\uf182');

		var female_value = female_symbol.append('text')
			.attr('transform', 'translate(35,7.5)')
			.attr('class', 'total-value female-total-value')
			.style('fill','white')
			.text(function (d) {
				return 0 + ' %';
			})
				.transition()
				.duration(1000)
				.tween("text", function (d) {
					var currentValue = parseInt(d3.select('.female-total-value').text().substr(0, 2), 10);
					var interpolator = d3.interpolateRound(currentValue, d.female);
					return function (t) {
						this.textContent = interpolator(t) + ' %';
					}});

	}

	d3.json(url_api_call, function (error, dataset) {

			if (error || $.isEmptyObject(dataset)) {
				console.log(error);
				console.log(dataset);
				$(element_id).removeClass('ajax-loader');
			}
			else {draw(dataset);}
	});
}

function render_growth_chart(element_id,url_api_call,color,metrics_name){

	$(element_id).empty();

	var margin = {top: 20, right: 10, bottom: 20, left: 40},
		full_width = parseInt($(element_id).parent().width(), 10),
		width = full_width - margin.left - margin.right,
		full_height = 250,
		height = full_height - margin.top - margin.bottom,
		dataset;

	var x = d3.time.scale()
		.range([0,width]);


	var y = d3.scale.linear()
		.range([height,0]);

	var line = d3.svg.line()
		.x(function(d) { return	x(d.date); })
		.y(function(d) { return y(d.value); });

	var area = d3.svg.area()
		.x(function(d) { return	x(d.date); })
		.y0(height)
		.y1(function(d) { return y(d.value); });


	var graph = d3.select(element_id)
			.append('svg')
			.attr('width',full_width)
			.attr('height',full_height)
			.append('g')
				.attr('class','growth-chart')
				.attr('transform','translate(' + margin.left + ',' + margin.top + ')');

	d3.json(url_api_call, function(error,dataset){

		$(element_id).removeClass('ajax-loader');

		if (error || dataset.length < 1){
			d3_throw_error(element_id,dataset,error);}
		else{
			var parse_date = d3.time.format('%Y-%m-%d');

			dataset.forEach(function(d){
				var data = d.date;
				d.date = new Date(data * 1000);
			});


			var first_day = new Date (d3.max(dataset, function(d){ return (d.date) }));
			// LAST 90 DAYS ONLY
			first_day = new Date(first_day.setDate(first_day.getDate() - 90));
			var last_day = new Date((d3.max(dataset, function(d){ return (d.date) })));

			dataset = dataset.filter(function(d){ return d.date > first_day });
			var max_value = d3.max(dataset,function(d){ return d.value });
			var min_value = d3.min(dataset,function(d){ return d.value });

			x.domain([first_day,last_day]);
			y.domain([min_value,max_value]);

			var x_axis = d3.svg.axis()
				.scale(x)
				.orient("bottom")
				.ticks(3)
				.tickSize(5)
				.outerTickSize(0)
				.tickFormat(d3.time.format('%B'));

			var y_axis = d3.svg.axis()
				.scale(y)
				.orient('left')
				.ticks(5)
				.tickSize(5)
				.outerTickSize(0)
				.tickFormat(d3.format('s'));

			var data_area = graph.append('path')
				.datum(dataset)
					.attr('class','data-area')
					.attr('fill',color)
					.attr('d',area);


			var axis_x = graph.append('g')
				.attr('class','x axis')
				.attr('transform', 'translate(0,' + (height) + ')')
				.call(x_axis);

			var axis_y = graph.append('g')
				.attr('class','y axis')
				.attr('transform', 'translate(0,' + 0 + ')')
				.call(y_axis);

			var y_legend = axis_y.append('text')
				.attr('class','axis_legend')
				.attr('transform','rotate(-90)')
				.attr('dy','10')
				.text(metrics_name);

			/*var data_line = graph.append('path')
				.attr('class','data-line')
				.attr('d',line(dataset))
				.attr('stroke',color);*/
		}
	});
}

function render_horizontal_compare_bar(element_id,url_api_call,color_scale){

	$(element_id).empty();


    var fullWidth = parseInt($(element_id).parent().width(), 10),
    	margin = {'top': 10, 'bottom': 10, 'left': 0, 'right': 20},
		width = (fullWidth - margin.left - margin.right),
   		svgHeight = 140,
    	height = (svgHeight - margin.top - margin.bottom),
    	barPadding = 12,
    	barHeight = (height / 3) - 2 * barPadding;


    var x = d3.scale.linear()
        .range([0, width]);

    var y = d3.scale.linear()
        .domain([0, 3])
        .range([0, height]);

    var yAxis = d3.svg.axis()
			.scale(y)
			.orient('left')
			.ticks(3);

    var svg = d3.select(element_id).append('svg')
        .attr('class','horizontal-compare-bar-chart')
        .attr('width', fullWidth)
        .attr('height', svgHeight);

	var xAxisGroup = d3.select(element_id + ' > svg').append('g')
		.attr('class', 'axis x')
		.attr('transform', 'translate(' + margin.left + ',' + (height + 5) + ')');

    /*var yAxisGroup = d3.select(element_id + ' > svg').append('g')
        .attr('class','axis y')
        .attr('transform', 'translate(' + margin.left + ',0)')
        .call(yAxis)
            .selectAll('text')
                .remove();*/

	var chart = svg.append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

	d3.json(url_api_call, function(error,dataset){

		$(element_id).removeClass('ajax-loader');

		if (error || dataset.length < 1){
			d3_throw_error(element_id)
		}

		else{
			var numberMin = d3.min(dataset, function(d) { return d.value; });
			var numberMax = d3.max(dataset, function(d) { return d.value; });

			x.domain([0, (numberMax*1.1) ]);

			var xAxis = d3.svg.axis()
				.scale(x)
				.orient('bottom')
				.ticks(6)
				.tickSize(-height)
				.tickFormat(d3.format('s'));

			xAxisGroup.call(xAxis);

			var point = chart.selectAll('g .chartPoint')
				.data(dataset)
				.enter().append('g')
				.attr('class', 'chartPoint')
				.attr('transform', function (d, i) {
					return 'translate(0,' + y(i) + ')'
				});

			var bar = point.append('rect')
				.attr('height', barHeight)
				.attr('width', function (d) {
				   return x(d.value);
				})
				.style('fill', function (d, i) {
						return color_scale[i];
					})
				.attr('transform','translate(0,' + ((height/3) *.5 - barHeight/2 ) + ')');

			var label = point.append('text')
				.attr('transform','translate(6,' + 5 + ')')
				.text(function (d){ return d.title;})
		}
	});
}

function render_cadence_chart(element_id,url_api_call,circle_radius,show_x_axis_value){

	$(element_id).empty();

	var margin = {top: 20, right: 10, bottom: 20, left: 40},
		full_width = parseInt($(element_id).parent().width(), 10),
		width = full_width - margin.left - margin.right,
		full_height = 250,
		height = full_height - margin.top - margin.bottom,
		color_scale = ["lightBlue", "blue", "darkblue"],
		week_days = ['Sun','Mon', 'Tue','Wed','Thu','Fri','Sat'];

	var week_number = d3.time.format('%U');
	var day_of_week = d3.time.format('%w');

	var x = d3.scale.linear()
		.range([0, width]);

	var day_correction = d3.scale.linear()
		.range([0, width]);

	var colors = d3.scale.ordinal()
    	.range(color_scale);

	var x_axis = d3.svg.axis()
		.scale(x)
		.orient("bottom")
		.tickSize(-height);

	var y = d3.scale.linear()
		.domain([0,6])
		.range([(height - 20),0]);

	var y_axis = d3.svg.axis()
		.scale(y)
		.orient('left')
		.ticks(7)
		.tickSize(10)
		.tickFormat(function(d,i){
			return week_days[i];
		});

	var graph = d3.select(element_id)
			.append('svg')
			.attr('width',full_width)
			.attr('height',full_height)
			.append('g')
				.attr('class','cadence-chart')
				.attr('transform','translate(' + margin.left + ',' + margin.top + ')');

	d3.json(url_api_call, function(error,dataset){

		if (error || dataset.length < 1){
			d3_throw_error(element_id,dataset,error);
		}
		else{
			$(element_id).removeClass('ajax-loader');

			var parse_date = d3.time.format('%Y-%m-%d');
			var day_number = d3.time.format('%w');
			var week_number = d3.time.format('%W');

			dataset.forEach(function(d){
				d.date = parse_date.parse(d.date);
			});

			var max_value = d3.max(dataset,function(d){ return d.value; });
			var first_week = week_number(d3.min(dataset, function(d){ return (d.date); }));
			var last_week =  week_number(d3.max(dataset, function(d){ return (d.date); }));

			x.domain([first_week,last_week]);
			colors.domain([0, max_value *.5 , max_value]);

			x_axis.ticks((last_week-first_week));

			var axis_x = graph.append('g')
				.attr('class','x axis')
				.attr('transform', 'translate(0,' + (height - margin.top) + ')')
				.call(x_axis);

			//REMOVE THE AXIS VALUE ON SMALL PANEL
			if (!show_x_axis_value){
				d3.selectAll(element_id + ' .cadence-chart .x > .tick > text').remove();
			}

			var x_legend = axis_x.append('g')
				.attr('class','x_legend')
				.attr('transform','translate(' + width + ',' + 40 + ')');

			x_legend.append('text')
				.text('weeks');

			var axis_y = graph.append('g')
				.attr('class','y axis')
				.attr('transform', 'translate(0,' + 0 + ')')
				.call(y_axis);

			//ADD EMPTY CIRCLE TO ACT LIKE A PRINT MARK IF d.value = 0
			var empty_circle = d3.selectAll('.cadence-chart .x > .tick');

			for (i = 0; i < 7 ; i++){
				empty_circle.append('circle')
					.attr('transform','translate(0,' + - (y(i)) + ')')
					.attr('r',circle_radius);
			}


			//REMOVE THE X VARIATION TO ALIGN ALL POINTS WITH THE FIRST DAY OF THE WEEK (DAY = 0)
			//TAG THE CIRCLE OUT OF RANGE
			var weeks = graph.selectAll('g')
					.data(dataset)
				.enter().append('g')
					.attr('class','week')
					.attr('transform',function(d,i){
						return 'translate(' + x(week_number(d.date)) + ',' + y(day_number(d.date)) + ')'
					});

			//ADD THE VALUE CIRCLE
			weeks.append('circle')
				.attr('r',circle_radius)
				.attr('fill',function(d){ return colors(d.value); });

		}
	});
	}

function render_video_category_bar_chart(element_id,data){
		var margin = {top: 10, right: 10, bottom: 0, left: 25},
		full_width = parseInt($(element_id).width(), 10),
		width = full_width - margin.left - margin.right,
		full_height = 250,
		height = full_height - margin.top - margin.bottom;

		var category_color = d3.scale.category10();

		var x_max = d3.max(data,function(d){ return d[1]; });
		var x_total = d3.sum(data,function(d){ return d[1]; })

		var y_max = data.length + 1;

		var y = d3.scale.linear()
				.range([0,height])
				.domain([0,y_max]);

		var x = d3.scale.linear()
				.range([0,width])
				.domain([0,100]);

		var bar_height = (height/y_max - (height/y_max *.25));

		var graph = d3.select(element_id)
			.append('svg')
			.attr('width',full_width)
			.attr('height',full_height)
				.append('g')
					.attr('class','category-bar-chart')
					.attr('transform','translate(' + margin.left + ',' + margin.top + ')')

		var x_axis = d3.svg.axis()
			.scale(x)
			.orient("bottom")
			.ticks(10)
			.tickSize(5);

		var y_axis = d3.svg.axis()
			.scale(y)
			.orient("left")
			.ticks(10)
			.tickSize(5);

		/*var axis_x = graph.append('g')
			.attr('class','x axis')
			.attr('transform', 'translate(0,' + (height) + ')')
			.call(x_axis);*/

		/*var axis_y = graph.append('g')
			.attr('class','y axis')
			.attr('transform', 'translate(0,' + 0 + ')')
			.call(y_axis);*/

		var bar = graph.selectAll('g .chartPoint')
			.data(data)
				.enter().append('g')
			.attr('class', 'chartPoint')
			.attr('transform', function (d,i) {
				return 'translate(' + 0 + ',' + (y(i + 1)) + ')'
			});

		bar.append('rect')
			.attr('height', (height/y_max -(height/y_max *.25)))
			.attr('fill',function(d){ return category_color(d[0]); })
			.attr('transform','translate(' + 0 + ',' + -(height/y_max *.25 + bar_height *.5) + ')')
				.attr('width',0)
				.transition()
				.duration(500)
				.ease("exp")
					.attr('width',function(d){ return x(d[1]*100/x_total); });

		var label_node = bar.append('g')
			.attr('transform',function(d){ return 'translate(' + (x(x_max*100/x_total) + 10) + ',' + -(height/y_max *.25) + ')' });

		var label = label_node.append('text')
				.attr('fill',function(d){
					return category_color(d[0]);
				})
				.attr('stroke','none')
				.attr('alignment-baseline','central')
				.text(function(d){return d[0] + ': ' + (d[1]*100/x_total).toFixed(0) + '%' ;});
					/*.transition()
					.duration(1000)
					.tween("text", function (d) {
						var interpolator = d3.interpolateRound(0, d[1]);
						return function (t) {
							this.textContent = interpolator(t) + ' %';
						}});*/



		//label_node.append('circle').attr('r',3).attr('fill','blue');
	}

function render_radar_chart(element_id,url_api_call){

	function RadarChart(id, data, options) {

	/////////////////////////////////////////////////////////
	/////////////// The Radar Chart Function ////////////////
	/////////////// Written by Nadieh Bremer ////////////////
	////////////////// VisualCinnamon.com ///////////////////
	/////////// Inspired by the code of alangrafu ///////////
	/////////////////////////////////////////////////////////

	var cfg = {
	 w: 600,				//Width of the circle
	 h: 600,				//Height of the circle
	 margin: {top: 20, right: 20, bottom: 20, left: 20}, //The margins of the SVG
	 levels: 5,				//How many levels or inner circles should there be drawn
	 maxValue: 5, 			//What is the value that the biggest circle will represent
	 labelFactor: 1.35, 	//How much farther than the radius of the outer circle should the labels be placed
	 wrapWidth: 60, 		//The number of pixels after which a label needs to be given a new line
	 opacityArea: 0.5, 	//The opacity of the area of the blob
	 dotRadius: 0, 			//The size of the colored circles of each blog
	 opacityCircles: 0, 	//The opacity of the circles of each blob
	 strokeWidth: 0, 		//The width of the stroke around each blob
	 roundStrokes: false,	//If true the area and stroke will follow a round path (cardinal-closed)
	 color: d3.scale.category10()	//Color function
	};

	var label_position = ['middle','start','middle','middle','end'];

	//Put all of the options into a variable called cfg
	if('undefined' !== typeof options){
	  for(var i in options){
		if('undefined' !== typeof options[i]){ cfg[i] = options[i]; }
	  }//for i
	}//if

	//If the supplied maxValue is smaller than the actual one, replace by the max in the data
	var maxValue = Math.max(cfg.maxValue, d3.max(data, function(i){return d3.max(i.map(function(o){return o.value;}))}));

	var allAxis = (data[0].map(function(i, j){return i.axis})),	//Names of each axis
		total = allAxis.length,					//The number of different axes
		radius = Math.min(cfg.w/2, cfg.h/2), 	//Radius of the outermost circle
		Format = d3.format('d'),			 	//Integer formatting
		angleSlice = Math.PI * 2 / total;		//The width in radians of each "slice"

	//Scale for the radius
	var rScale = d3.scale.linear()
		.range([0, radius])
		.domain([0, maxValue]);

	/////////////////////////////////////////////////////////
	//////////// Create the container SVG and g /////////////
	/////////////////////////////////////////////////////////

	//Remove whatever chart with the same id/class was present before
	d3.select(id).select("svg").remove();

	//Initiate the radar chart SVG
	var svg = d3.select(id).append("svg")
			.attr("width",  cfg.w + cfg.margin.left + cfg.margin.right)
			.attr("height", cfg.h + cfg.margin.top + cfg.margin.bottom);
	//Append a g element
	var g = svg.append("g")
			.attr("transform", "translate(" + (cfg.w/2 + cfg.margin.left) + "," + (cfg.h/2 + cfg.margin.top) + ")");

	/////////////////////////////////////////////////////////
	////////// Glow filter for some extra pizzazz ///////////
	/////////////////////////////////////////////////////////

	//Filter for the outside glow
	var filter = g.append('defs').append('filter').attr('id','glow'),
		feGaussianBlur = filter.append('feGaussianBlur').attr('stdDeviation','2.5').attr('result','coloredBlur'),
		feMerge = filter.append('feMerge'),
		feMergeNode_1 = feMerge.append('feMergeNode').attr('in','coloredBlur'),
		feMergeNode_2 = feMerge.append('feMergeNode').attr('in','SourceGraphic');

	/////////////////////////////////////////////////////////
	/////////////// Draw the Circular grid //////////////////
	/////////////////////////////////////////////////////////

	//Wrapper for the grid & axes
	var axisGrid = g.append("g").attr("class", "axisWrapper");

	//Draw the background circles
	axisGrid.selectAll(".levels")
	   .data(d3.range(1,(cfg.levels+1)).reverse())
	   .enter()
		.append("circle")
		.attr("class", "gridCircle")
		.attr("r", function(d, i){return radius/cfg.levels*d;})
			.style("fill", "#CDCDCD")
			.style("stroke", "#CDCDCD")
			.style("fill-opacity", cfg.opacityCircles);

	//Text indicating at what % each level is
	/*axisGrid.selectAll(".axisLabel")
	   .data(d3.range(1,(cfg.levels+1)).reverse())
	   .enter().append("text")
		   .attr("class", "axisLabel")
		   .attr("x", 4)
		   .attr("y", function(d){return -d*radius/cfg.levels;})
		   .attr("dy", "0.4em")
		   .style("font-size", "10px")
		   .attr("fill", "#737373")
		   .text(function(d,i) { return Format(maxValue * d/cfg.levels); });*/

	/////////////////////////////////////////////////////////
	//////////////////// Draw the axes //////////////////////
	/////////////////////////////////////////////////////////

	//Create the straight lines radiating outward from the center
	var axis = axisGrid.selectAll(".axis")
		.data(allAxis)
		.enter()
		.append("g")
		.attr("class", "axis");
	//Append the lines
	axis.append("line")
		.attr("x1", 0)
		.attr("y1", 0)
		.attr("x2", function(d, i){ return rScale(maxValue*1.1) * Math.cos(angleSlice*i - Math.PI/2); })
		.attr("y2", function(d, i){ return rScale(maxValue*1.1) * Math.sin(angleSlice*i - Math.PI/2); });

	//Append the labels at each axis

	axis.append("text")
		.attr("text-anchor", function(d,i){
			return label_position[i];})
		.attr("dy", "0.35em")
		.attr("x", function(d, i){ return rScale(maxValue * cfg.labelFactor) * Math.cos(angleSlice*i - Math.PI/2); })
		.attr("y", function(d, i){ return rScale(maxValue * cfg.labelFactor) * Math.sin(angleSlice*i - Math.PI/2); })
		.text(function(d){return d; });

	/////////////////////////////////////////////////////////
	///////////// Draw the radar chart blobs ////////////////
	/////////////////////////////////////////////////////////

	//The radial line function
	var radarLine = d3.svg.line.radial()
		.interpolate("linear-closed")
		.radius(function(d) { return rScale(d.value); })
		.angle(function(d,i) {	return i*angleSlice; });

	if(cfg.roundStrokes) {
		radarLine.interpolate("cardinal-closed");
	}

	//Create a wrapper for the blobs
	var blobWrapper = g.selectAll(".radarWrapper")
		.data(data)
		.enter().append("g")
		.attr("class", "radarWrapper");

	//Append the backgrounds
	blobWrapper
		.append("path")
		.attr("class", "radarArea")
		.attr("d", function(d,i) { return radarLine(d); })
		.style("fill", function(d,i) { return cfg.color(i); })
		.style("fill-opacity", cfg.opacityArea)
		.on('mouseover', function (d,i){
			//Dim all blobs
			d3.selectAll(".radarArea")
				.transition().duration(200)
				.style("fill-opacity", 0.1);
			//Bring back the hovered over blob
			d3.select(this)
				.transition().duration(200)
				.style("fill-opacity", 0.7);
		})
		.on('mouseout', function(){
			//Bring back all blobs
			d3.selectAll(".radarArea")
				.transition().duration(200)
				.style("fill-opacity", cfg.opacityArea);
		});

	//Create the outlines
	blobWrapper.append("path")
		.attr("class", "radarStroke")
		.attr("d", function(d,i) { return radarLine(d); })
		.style("stroke-width", cfg.strokeWidth + "px")
		.style("stroke", function(d,i) { return cfg.color(i); })
		.style("fill", "none")
		.style("filter" , "url(#glow)");

	//Append the circles
	blobWrapper.selectAll(".radarCircle")
		.data(function(d,i) { return d; })
		.enter().append("circle")
		.attr("class", "radarCircle")
		.attr("r", cfg.dotRadius)
		.attr("cx", function(d,i){ return rScale(d.value) * Math.cos(angleSlice*i - Math.PI/2); })
		.attr("cy", function(d,i){ return rScale(d.value) * Math.sin(angleSlice*i - Math.PI/2); })
		.style("fill", function(d,i,j) { return cfg.color(j); })
		.style("fill-opacity", 0.8);

	/////////////////////////////////////////////////////////
	//////// Append invisible circles for tooltip ///////////
	/////////////////////////////////////////////////////////

	//Wrapper for the invisible circles on top
	var blobCircleWrapper = g.selectAll(".radarCircleWrapper")
		.data(data)
		.enter().append("g")
		.attr("class", "radarCircleWrapper");

	//Append a set of invisible circles on top for the mouseover pop-up
	blobCircleWrapper.selectAll(".radarInvisibleCircle")
		.data(function(d,i) { return d; })
		.enter().append("circle")
		.attr("class", "radarInvisibleCircle")
		.attr("r", cfg.dotRadius*1.5)
		.attr("cx", function(d,i){ return rScale(d.value) * Math.cos(angleSlice*i - Math.PI/2); })
		.attr("cy", function(d,i){ return rScale(d.value) * Math.sin(angleSlice*i - Math.PI/2); })
		.style("fill", "none")
		.style("pointer-events", "all")
		.on("mouseover", function(d,i) {
			newX =  parseFloat(d3.select(this).attr('cx')) - 10;
			newY =  parseFloat(d3.select(this).attr('cy')) - 10;

			tooltip
				.attr('x', newX)
				.attr('y', newY)
				.text(Format(d.value))
				.transition().duration(200)
				.style('opacity', 1);
		})
		.on("mouseout", function(){
			tooltip.transition().duration(200)
				.style("opacity", 0);
		});

	//Set up the small tooltip for when you hover over a circle
	var tooltip = g.append("text")
		.attr("class", "tooltip")
		.style("opacity", 0);

	/////////////////////////////////////////////////////////
	/////////////////// Helper Function /////////////////////
	/////////////////////////////////////////////////////////

	//Taken from http://bl.ocks.org/mbostock/7555321
	//Wraps SVG text
	/*function wrap(text, width) {
	  text.each(function() {
		var text = d3.select(this),
			words = text.text().split(/\s+/).reverse(),
			word,
			line = [],
			lineNumber = 0,
			lineHeight = 1.4, // ems
			y = text.attr("y"),
			x = text.attr("x"),
			dy = parseFloat(text.attr("dy")),
			tspan = text.text(null).append("tspan").attr("x", x).attr("y", y).attr("dy", dy + "em");

		while (word = words.pop()) {
		  line.push(word);
		  tspan.text(line.join(" "));
		  if (tspan.node().getComputedTextLength() > width) {
			line.pop();
			tspan.text(line.join(" "));
			line = [word];
			tspan = text.append("tspan").attr("x", x).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
		  }
		}
	  });
	}//wrap*/

}//RadarChart

	var margin = {top: 50, right: 50, bottom: 50, left: 50},
		full_width = parseInt($(element_id).parent().width(), 10),
		width = full_width - margin.left - margin.right,
		full_height = 250,
		height = full_height - margin.top - margin.bottom;

	//////////////////////////////////////////////////////////////
	//////////////////// Draw the Chart //////////////////////////
	//////////////////////////////////////////////////////////////
	var color = d3.scale.ordinal()
		.range(["#BF4E19"]);

	d3.json(url_api_call,function(errors,dataset){
		if (errors || dataset.length < 0){
			d3_throw_error(element_id,dataset,errors)
		} else {
			$(element_id).removeClass('ajax-loader');
			var radar_chart_options = {
				w: width,
				h: height,
				margin: margin,
				maxValue: 5,
				levels: 5,
				roundStrokes: false,
				color: color
			};
			RadarChart(element_id, dataset, radar_chart_options);
		}
	})
}

function render_social_growth_chart(element_id,url_api_call,color,metrics_name){

	$(element_id).empty();

	var margin = {top: 20, right: 10, bottom: 20, left: 5},
		full_width = parseInt($(element_id).parent().width(), 10),
		width = full_width - margin.left - margin.right,
		full_height = 250,
		height = full_height - margin.top - margin.bottom,
		dataset;

	var x = d3.time.scale()
		.range([0,width]);

	var y = d3.scale.linear()
		.range([height,0]);

	var line = d3.svg.line()
		.x(function(d) { return	x(d.date); })
		.y(function(d) { return y(d.value); });

	var area = d3.svg.area()
		.x(function(d) { return	x(d.date); })
		.y0(height)
		.y1(function(d) { return y(d.value); });


	var graph = d3.select(element_id)
			.append('svg')
			.attr('width',full_width)
			.attr('height',full_height)
			.append('g')
				.attr('class','social-growth-chart')
				.attr('transform','translate(' + margin.left + ',' + margin.top + ')');

	d3.json(url_api_call, function(error,dataset){

		$(element_id).removeClass('ajax-loader');

		if (error || dataset.length < 1){
			d3_throw_error(element_id,dataset,error);}
		else{
			var parse_date = d3.time.format('%Y-%m-%d');

			dataset.forEach(function(d){
				var data = d.date;
				d.date = new Date(data * 1000);
			});


			var first_day = new Date (d3.max(dataset, function(d){ return (d.date) }));
			// LAST 90 DAYS ONLY
			first_day = new Date(first_day.setDate(first_day.getDate() - 90));
			var last_day = new Date((d3.max(dataset, function(d){ return (d.date) })));

			dataset = dataset.filter(function(d){ return d.date > first_day });
			var max_value = d3.max(dataset,function(d){ return d.value });
			var min_value = d3.min(dataset,function(d){ return d.value });

			x.domain([first_day,last_day]);
			y.domain([min_value,max_value]);

			var x_axis = d3.svg.axis()
				.scale(x)
				.orient("bottom")
				.ticks(3)
				.tickSize(5)
				.tickFormat(d3.time.format('%B'));

			var y_axis = d3.svg.axis()
				.scale(y)
				.orient('right')
				.ticks(5)
				.tickSize(5)
				.outerTickSize(0)
				.tickFormat(d3.format('s'));

			var data_area = graph.append('path')
				.datum(dataset)
					.attr('class','data-area')
					.attr('fill',color)
					.attr('d',area);


			var axis_x = graph.append('g')
				.attr('class','x axis')
				.attr('transform', 'translate(0,' + (height) + ')')
				.call(x_axis);

			var axis_y = graph.append('g')
				.attr('class','y axis')
				.attr('transform', 'translate(0,' + 0 + ')')
				.call(y_axis);

			/*var y_legend = axis_y.append('text')
				.attr('class','axis_legend')
				.attr('transform','rotate(-90)')
				.attr('dy','10')
				.text(metrics_name);*/

			/*var data_line = graph.append('path')
				.attr('class','data-line')
				.attr('d',line(dataset))
				.attr('stroke',color);*/
		}
	});
}

function render_world_map(element_id,url_api_call,channel_subscribers) {

	var margin = {top: 10, right: 0, bottom: 0, left: 0},
		full_width = parseInt($(element_id).width(), 10),
		width = full_width - margin.left - margin.right,
		full_height = 500,
		height = full_height - margin.top - margin.bottom;


	var projection = d3.geo.mercator().translate([(width / 2), 320]).scale(width/2/Math.PI).precision(.1);

	var map = d3.select(element_id).append('svg')
        .attr('width', full_width)
        .attr('height', full_height)
			.append('g')
		.attr('class','world-map')
		.attr('transform','translate(' + margin.top + ',' + margin.left + ')');

	var path = d3.geo.path()
		.projection(projection);

	d3.json(url_api_call, function(error, dataset) {

		var countries_data = [];
		var countries_table_data = [];
		var thousands = d3.format('0,000');
		var percentage = d3.format('.2p');

		for (i = 0; i < 50; i++) {
			countries_data[dataset['country_engagement90day']['rows'][i][0]] = (
				{
					'number_of_views': dataset['country_engagement90day']['rows'][i][1],
					'number_of_share': dataset['country_engagement90day']['rows'][i][2],
					'sub_gained': dataset['country_engagement90day']['rows'][i][3],
					'sub_lost': dataset['country_engagement90day']['rows'][i][4]
				}
			);

			countries_table_data.push(
				{
					'Country': dataset['country_engagement90day']['rows'][i][0],
					'Views': dataset['country_engagement90day']['rows'][i][1],
					'Shares': dataset['country_engagement90day']['rows'][i][2],
					'Subscriber Evolution':
						((dataset['country_engagement90day']['rows'][i][3] - dataset['country_engagement90day']['rows'][i][4])*100/channel_subscribers)

				}
			);


		}

		var max_value = [dataset['country_engagement90day']['rows'][0][1]];
		var min_value = [dataset['country_engagement90day']['rows'][49][1]];

		var color_scale = d3.scale.linear()
			.domain([0, max_value *.5, max_value])
			.range(['#eeeeee', 'orange', 'red']);

		//DRAW THE LEGEND
		var legend = map.append('g')
			.attr('transform','translate(0,'+ (height - 100) +')');

		var legend_high = legend.append('g');

			legend_high.append('text')
				.attr('transform','translate(15,5)')
				.style('text-anchor','start')
				.text(thousands(Math.ceil(max_value/100000)*100000));

			legend_high.append('circle')
				.attr('r',10)
				.attr('fill',function(){ return color_scale(max_value) });

		var legend_middle = legend.append('g')
			.attr('transform','translate(0,30)');

			legend_middle.append('circle')
				.attr('r',10)
				.attr('fill',function(){ return color_scale(max_value *.5) });

			legend_middle.append('text')
				.attr('transform','translate(15,5)')
				.style('text-anchor','start')
				.text(thousands(Math.ceil(max_value *.5/100000)*100000));

		var legend_min = legend.append('g')
			.attr('transform','translate(0,60)');

			legend_min.append('text')
				.attr('transform','translate(15,5)')
				.style('text-anchor','start')
				.text('< ' + thousands(Math.ceil(min_value *.5/100)*100));

			legend_min.append('circle')
				.attr('r',10)
				.attr('transform','translate(0,0)')
				.attr('fill',function(){ return color_scale(0) });

		//DRAW THE MAP
		d3.json('/media/social/js/chart_data/world_iso_2.json', function(error, topology) {

			$(element_id).removeClass('ajax-loader');

			if (error) return console.error(error);

			var subunits = topology.objects.iso_world;

			map.selectAll('.subunit')
				.data(topojson.feature(topology, subunits).features)
			  .enter().append("path")
				.attr("class",'subunit')
				.attr('id',function(d){ return d.id; })
				.attr('fill', function(d) {
					if(typeof countries_data[d.id] !== "undefined") {
						return color_scale(countries_data[d.id].number_of_views);
					}else{ return 'white'; }
				})
				.attr("d", path);
	    	});

		//DRAW THE TABLE
		function value_formatting (d,i){
			if( i == 1 || i == 2){ return thousands(d); }
			if (i == 3)
				{ return percentage(d);}
			else
				{ return d; }
		}
		function color_formatting(d,i){
			if (i == 3) { if (d > 0) { return 'green'; } else { return 'red'; } }
			else{ return 'black'; }}

		var table = d3.select('#world-table').append('table').attr('class','table table-striped');

		table.append('thead').append('tr')
		    .selectAll('th')
				.data(d3.keys(countries_table_data[0])).enter()
		    .append('th')
		    .text(function(d){
				return d;
			});

		table.append('tbody').selectAll('tr')
				.data(countries_table_data).enter()
			.append('tr').selectAll('td')
				.data(function(d){return d3.values(d);}).enter()
			.append('td').style('color', function(d,i){return color_formatting(d,i);})
			.text(function(d,i){
					return value_formatting(d,i);
				});
		})

}

function render_90_day_evolution(element_id,url_api_call,series){

	var margin = {top: 10, right: 20, bottom: 20, left: 25},
		full_width = parseInt($(element_id).width(), 10),
		width = full_width - margin.left - margin.right,
		full_height = 250,
		height = full_height - margin.top - margin.bottom;

	var x = d3.time.scale()
		.range([0,width]);

	var y = d3.scale.linear()
		.range([height,0]);

	var line_values = d3.svg.line()
		.x(function(d) { return	x(d.date); })
		.y(function(d) { return y(d.values); });

	var graph = d3.select(element_id)
			.append('svg')
			.attr('width',full_width)
			.attr('height',full_height)
				.append('g')
					.attr('class','social-growth-chart')
					.attr('transform','translate(' + margin.left + ',' + margin.top + ')');

	d3.json(url_api_call, function(error,dataset){

		$(element_id).removeClass('ajax-loader');

		var format = d3.time.format("%Y-%m-%d");
		dataset.rows.forEach(function(d){
			d.date = format.parse(d[0]);
			d.values = d[series];
		});

		var first_day = new Date (d3.min(dataset.rows, function(d){ return (d.date) }));
		var last_day = new Date (d3.max(dataset.rows, function(d){ return (d.date) }));

		var max_value = d3.max(dataset.rows,function(d){ return d.values });
		var min_value = d3.min(dataset.rows,function(d){ return d.values });

		x.domain([first_day,last_day]);
		y.domain([0,max_value]);

		var x_axis = d3.svg.axis()
			.scale(x)
			.orient("bottom")
			.ticks(90/7)
			.tickSize(5)
			.tickFormat(d3.time.format('%U'));

		var y_axis = d3.svg.axis()
			.scale(y)
			.orient('left')
			.tickSize(5)
			.outerTickSize(0)
			.tickFormat(d3.format('s'));

		var axis_x = graph.append('g')
			.attr('class','x axis')
			.attr('transform', 'translate(0,' + (height) + ')')
			.call(x_axis);

		var axis_y = graph.append('g')
			.attr('class','y axis')
			.attr('transform', 'translate(0,' + 0 + ')')
			.call(y_axis);

		var line = graph.append('path')
			.attr('class','data-line')
			.attr('d',line_values(dataset.rows))
			.attr('stroke','#2980B9');

	})
}

function render_90_day_bar_differential(element_id,url_api_call,serie_a,serie_b) {
	var margin = {top: 10, right: 25, bottom: 20, left: 25},
		full_width = parseInt($(element_id).width(), 10),
		width = full_width - margin.left - margin.right,
		full_height = 250,
		height = full_height - margin.top - margin.bottom;

	var x = d3.time.scale()
		.range([0, width]);

	var y = d3.scale.linear()
		.range([height, 0]);

	var graph = d3.select(element_id)
		.append('svg')
		.attr('width', full_width)
		.attr('height', full_height)
		.append('g')
		.attr('class', 'social-growth-chart')
		.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

	d3.json(url_api_call, function (error, dataset) {

		$(element_id).removeClass('ajax-loader');

		var format = d3.time.format("%Y-%m-%d");
		dataset.rows.forEach(function (d) {
			d.date = format.parse(d[0]);
			d.diff_a_b = d[serie_a] - d[serie_b];
		});

		var first_day = new Date(d3.min(dataset.rows, function (d) {
			return (d.date)
		}));
		var last_day = new Date(d3.max(dataset.rows, function (d) {
			return (d.date)
		}));

		var max_value = d3.max(dataset.rows, function (d) {
			return d.diff_a_b
		});
		var min_value = d3.min(dataset.rows, function (d) {
			return d.diff_a_b
		});
		var y_scaled = d3.max([Math.abs(max_value), Math.abs(min_value)]);

		x.domain([first_day, last_day]);
		y.domain([-y_scaled, y_scaled]);

		var x_axis = d3.svg.axis()
			.scale(x)
			.orient("bottom")
			.ticks(0)
			.tickSize(5)
			.tickFormat(d3.time.format('%d'));

		var y_axis = d3.svg.axis()
			.scale(y)
			.orient('left')
			.tickSize(5)
			.outerTickSize(0)
			.tickFormat(d3.format('s'));

		var axis_x = graph.append('g')
			.attr('class', 'x axis')
			.attr('transform', 'translate(0,' + (height) + ')')
			.call(x_axis);

		var axis_y = graph.append('g')
			.attr('class', 'y axis')
			.attr('transform', 'translate(0,' + 0 + ')')
			.call(y_axis);

		var point = graph.selectAll('g .chartPoint')
			.data(dataset.rows)
			.enter().append('g')
			.attr('class', 'chartPoint')
			.attr('transform', function (d, i) {
				return 'translate(' + x(d.date) + ',' + y(0) + ')'
			});

		var bar = point.append('rect')
			.attr('height', function (d, i) {
				return (height/2 -y(Math.abs(d.diff_a_b)));
			})
			.attr('width', width / 90)
			.style('fill', function(d,i){
				if (d.diff_a_b > 0) {return '#00a478'; }else{return '#dd4b39'; }
			})
			.attr('transform', function (d, i) {
				if (d.diff_a_b > 0) {
					return 'translate(0,' + -(height/2 - y(d.diff_a_b)) + ')';
				} else {
					return 'translate(0,' + 0 + ')';
				}
			});


	});

}

function render_scores_bar_chart(element_id, dataset, initial){

	var margin = {top: 10, right: 25, bottom: 20, left: 25},
		full_width = parseInt($(element_id).width(), 10),
		width = full_width - margin.left - margin.right,
		full_height = 350,
		height = full_height - margin.top - margin.bottom,
		ticks_values = ['SlateScore','Engagement','Influence','Consistency',''];

	var color = d3.scale.category20();

	var x = d3.scale.linear()
		.domain([-.3,3.3])
		.range([0,width]);

	var y = d3.scale.linear()
		.domain([0,10])
		.range([height, 6]);

	var draw_graph = function(dataset){

		debugger;

		var legend_label = d3.select('#current_selection').selectAll('.item')
			.data(dataset)
			.enter().append('div')
				.attr('class','item');

		legend_label.append('div')
			.attr('class','color-node')
			.style('background-color',function(d,i){return color(d.id)});

		legend_label.append('p')
			.html(function(d,i){ return d.id +'<sup><i class="fa fa-close pull-right"></i></sup>'});

		var graph = d3.select(element_id)
			.append('svg')
				.attr('width', full_width)
				.attr('height', full_height)
			.append('g')
				.attr('class', 'scores_bar_chart')
				.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

		var x_axis = d3.svg.axis()
			.scale(x)
			.orient("bottom")
				.ticks(5)
			.tickSize(5)
			.tickFormat(function(d,i){ return ticks_values[d]} );

		var y_axis = d3.svg.axis()
			.scale(y)
			.orient('left')
			.tickSize(5)
			.outerTickSize(0)
			.tickFormat(d3.format('s'));

		var axis_x = graph.append('g')
			.attr('class', 'x axis')
			.attr('transform', 'translate(0,' + (height) + ')')
			.call(x_axis);

		var axis_y = graph.append('g')
			.attr('class', 'y axis')
			.attr('transform', 'translate(0,' + 0 + ')')
			.call(y_axis);

		var engagement_node = graph.selectAll('g.engagement-node')
				.data(dataset)
			.enter().append('g')
			.attr('class','engagement-node')
			.attr('transform',function(d,i){ return 'translate(' + (x(0)) + ',' +  y(d.engagement) +')'; });
		engagement_node.append('circle').attr('r',5).attr('fill',function(d,i){ return color(d.id) });

		var influence_node = graph.selectAll('g.influence-node')
				.data(dataset)
			.enter().append('g')
			.attr('class','influence-node')
			.attr('transform',function(d,i){ return 'translate(' + (x(1)) + ',' +  y(d.influence) +')'; });
		influence_node.append('circle').attr('r',5).attr('fill',function(d,i){ return color(d.id) });

		var consistency_node = graph.selectAll('g.consistency-node')
				.data(dataset)
			.enter().append('g')
			.attr('class','consistency-node')
			.attr('transform',function(d,i){ return 'translate(' + (x(2)) + ',' +  y(d.consistency) +')'; });
		consistency_node.append('circle').attr('r',5).attr('fill',function(d,i){ return color(d.id) });

		var slatescore_node = graph.selectAll('g.slatescore-node')
				.data(dataset)
			.enter().append('g')
			.attr('class','slatescore-node')
			.attr('transform',function(d,i){ return 'translate(' + (x(3)) + ',' +  y(d.slatescore/100) +')'; });
		slatescore_node.append('circle').attr('r',5).attr('fill',function(d,i){ return color(d.id) });

	};

	var update_graph = function(dataset){

		var dataset_length = dataset.length;

		var legend_label = d3.select('#current_selection').selectAll('.item')
			.data(dataset.id);

		var new_label_legend = legend_label.enter().append('div')
				.attr('class','item');

			new_label_legend.append('div')
				.attr('class','color-node')
				.style('background-color',function(d,i){return color(d.id)});

			new_label_legend.append('p')
				.html(function(d,i){ return  d +'<sup><i class="fa fa-close pull-right"></i></sup>'});

		legend_label.select('.color-node')
			.style('background-color',function(d,i){return color(d.id)});

		legend_label.exit()
			.transition()
				.duration(750)
				.attr("y", 60)
				.style("fill-opacity", 1e-6)
				.remove();

		// DATA JOIN
  		// Join new data with old elements, if any.
		var engagement_node = d3.select('g.scores_bar_chart').selectAll('g.engagement-node')
			.data(dataset);

		var influence_node = d3.select('g.scores_bar_chart').selectAll('g.influence-node')
			.data(dataset);

		var consistency_node = d3.select('g.scores_bar_chart').selectAll('g.consistency-node')
			.data(dataset);

		var slatescore_node = d3.select('g.scores_bar_chart').selectAll('g.slatescore-node')
			.data(dataset);

		// UPDATE
  		// Update old elements as needed.
		engagement_node
			.transition()
			.duration(750)
				.attr('transform',function(d,i){ return 'translate(' + (x(0) + i*(x(0)/dataset_length))  + ',' +   y(d) +')'; });

		influence_node
			.transition()
			.duration(750)
				.attr('transform',function(d,i){ return 'translate(' + (x(1) + i*(x(0)/dataset_length))  + ',' +   y(d) +')'; });

		consistency_node
			.transition()
			.duration(750)
				.attr('transform',function(d,i){ return 'translate(' + (x(2) + i*(x(0)/dataset_length))  + ',' +   y(d) +')'; });

		slatescore_node
			.transition()
			.duration(750)
				.attr('transform',function(d,i){ return 'translate(' + (x(3) + i*(x(0)/dataset_length))  + ',' +   y(d/100) +')'; });

		// ENTER
  		// Create new elements as needed.
		engagement_node.enter().append('g').attr('class','engagement-node')
			.transition()
			.duration(750)
				.attr('transform',function(d,i){ return 'translate(' + (x(0) + i*(x(0)/dataset_length)) + ',' +   y(d.engagement) +')'; });

		influence_node.enter().append('g').attr('class','influence-node')
			.transition()
			.duration(750)
				.attr('transform',function(d,i){ return 'translate(' + (x(1) + i*(x(0)/dataset_length)) + ',' +   y(d.influence) +')'; });

		consistency_node.enter().append('g').attr('class','consistency-node')
			.transition()
			.duration(750)
				.attr('transform',function(d,i){ return 'translate(' + (x(2) + i*(x(0)/dataset_length)) + ',' +   y(d.consistency) +')'; });

		slatescore_node.enter().append('g').attr('class','slatescore-node')
			.transition()
			.duration(750)
				.attr('transform',function(d,i){ return 'translate(' + (x(3) + i*(x(0)/dataset_length)) + ',' +   y(d.slatescore/100) +')'; });

		// EXIT
  		// Remove old elements as needed.
		engagement_node.exit()
			.transition()
				.duration(750)
				.attr("y", 60)
				.style("fill-opacity", 1e-6)
				.remove();

		slatescore_node.exit()
			.transition()
				.duration(750)
				.attr("y", 60)
				.style("fill-opacity", 1e-6)
				.remove();

		consistency_node.exit()
			.transition()
				.duration(750)
				.attr("y", 60)
				.style("fill-opacity", 1e-6)
				.remove();

		influence_node.exit()
			.transition()
				.duration(750)
				.attr("y", 60)
				.style("fill-opacity", 1e-6)
				.remove();


		d3.selectAll('.engagement-node')
			.append('circle').attr('r',5).attr('fill',function(d,i){return color(i);});
		d3.selectAll('.slatescore-node')
			.append('circle').attr('r',5).attr('fill',function(d,i){return color(i);});
		d3.selectAll('.consistency-node')
			.append('circle').attr('r',5).attr('fill',function(d,i){return color(i);});
		d3.selectAll('.influence-node')
			.append('circle').attr('r',5).attr('fill',function(d,i){return color(i);});
		d3.selectAll('.slatescore-node')
			.append('circle').attr('r',5).attr('fill',function(d,i){return color(i);});

	};

	initial ? draw_graph(dataset) : update_graph(dataset);

	}

function render_home_heatmap(element_id,dataset) {

	var big_int_format = d3.format(",.0f");

	var margin = {top: 20, right:0, bottom: 20, left: 0},
		full_width = parseInt($(element_id).parent().width(), 10),
		w = full_width - margin.left - margin.right,
		full_height = 500,
		h = full_height - margin.top - margin.bottom,
		xPosition,
		yPosition,

		x = d3.scale.linear().range([0, w]),
		y = d3.scale.linear().range([0, h]),

		color = d3.scale.category20(),
		root,
		node;

	var treemap = d3.layout.treemap()
		.round(false)
		.size([w, h])
		.sticky(true)
		.value(function (d) {
			return d.videos;
		});

	var mouse_position = function(){
	  xPosition = d3.mouse(this)[0] + 35;
	  yPosition = d3.mouse(this)[1] + 5;
	};

	var mousemove = function(d) {
		d3.select("#tooltip")
			.style("left", xPosition + "px")
			.style("top", yPosition + "px");
		d3.select("#tooltip #name")
			.text(d["name"]);
		d3.select("#tooltip #metric")
			.text('(' + $('.heatmap_input:checked').val() + ')');
		d3.select("#tooltip #size")
			.text(big_int_format(d.value));
		d3.select("#tooltip")
			.classed("hidden", false);
	};

	var mouseout = function() {
	    d3.select("#tooltip").classed("hidden", true);
	};

	var add_to_legend = function(d){
		return d.depth > 0 ? d3.select('#heatmap-legend').append("li")
					.attr('class','legend-label')
				.style('background-color', color(d.name))
					.text(d.name) : null;
	};

	var svg = d3.select(element_id).append("div")
		.attr("class", "chart")
			.style("width", w + "px")
			.style("height", h + "px")
		.append("svg:svg")
			.attr("width", w)
			.attr("height", h)
		.append("svg:g")
			.attr("transform", "translate(.5,.5)");

	svg.on('mousemove', mouse_position);

	d3.json(dataset, function (data) {
		node = root = data;

		var nodes = treemap.nodes(root)
			.filter(function (d) {
				return !d.children;
			});

		var parent = treemap.nodes(root)
			.filter(function (d) {
				return d.children;
			});

		$.each(parent,function(){
			add_to_legend(this);
		});


		var cell = svg.selectAll("g")
			.data(nodes)
			.enter().append("svg:g")
			.attr("class", "cell")
			.attr("transform", function (d) {
				return "translate(" + d.x + "," + d.y + ")";
			})
			.on("click", function (d) {
				return zoom(node == d.parent ? root : d.parent);
			});

		cell.append("svg:rect")
			.attr("width", function (d) {
				return d.dx;
			})
			.attr("height", function (d) {
				return d.dy;
			})
			.style("fill", function (d) {
				return color(d.parent.name);
			})
			.attr('class','filter-rect')
			.on("mousemove", mousemove)
      		.on("mouseout", mouseout);

		cell.append("svg:text")
			.attr("x", function (d) {
				return d.dx / 2;
			})
			.attr("y", function (d) {
				return d.dy / 2;
			})
			.attr("dy", ".5em")
			.attr("text-anchor", "middle")
			.text(function (d) {
				return d.name;
			})
			.style("opacity", function (d) {
				d.w = this.getComputedTextLength();
				return d.dy > 15 && d.dx > d.w ? 1 : 0;
			});

		d3.select(window).on("click", function () {
			zoom(root);
		});

		d3.selectAll(".heatmap_input").on("change", function () {
			var selected_value = this.value;
			var values = function(d){ return d[selected_value]};
			treemap.value(values).nodes(root);
			zoom(node);
		});

	});

	function size(d) {
		return d.size;
	}

	function zoom(d) {
		var kx = w / d.dx, ky = h / d.dy;
		x.domain([d.x, d.x + d.dx]);
		y.domain([d.y, d.y + d.dy]);

		var t = svg.selectAll("g.cell").transition()
			.duration(d3.event.altKey ? 7500 : 750)
			.attr("transform", function (d) {
				return "translate(" + x(d.x) + "," + y(d.y) + ")";
			});

		t.select("rect")
			.attr("width", function (d) {
				return kx * d.dx;
			})
			.attr("height", function (d) {
				return ky * d.dy;
			});

		t.select("text")
			.attr("x", function (d) {
				return kx * d.dx / 2;
			})
			.attr("y", function (d) {
				return ky * d.dy / 2;
			})
			.style("opacity", function (d) {
				return ky * d.dy > 15 && kx * d.dx > d.w ? 1 : 0;
			});

		node = d;
		d3.event.stopPropagation();
	}
}

function render_topic_cluster(element_id,root_topic_index){

	var margin = {top: 0, right:10, bottom: 20, left: 10},
		full_width = parseInt($(element_id).parent().width(), 10),
		width = full_width - margin.left - margin.right,
		full_height = 1200,
		height = full_height - margin.top - margin.bottom;

	var i = 0,
		duration = 750,
		root;

	var tree = d3.layout.tree()
		.size([height, width]);

	var diagonal = d3.svg.diagonal()
		.projection(function(d) { return [d.y, d.x]; });

	// Clear the previous tree from svg
	d3.select("svg").remove();

	var svg = d3.select(element_id).append("svg")
			.attr("width", width + margin.right + margin.left)
			.attr("height", height + margin.top + margin.bottom)
		.append("g")
			.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	d3.json('/media/social/js/chart_data/rtb.json',function(error,data){

		if (error) throw error;

		//SetUp root topic selector
		d3.select('#topic_selector').selectAll('option')
			.data(data)
			.enter().append('option')
				.attr('value',function(d,i){ return i})
				.attr(function(d,i){ return i == 0 ? 'selected': ''; })
			.html(function(d){ return d.name});

		// Position of parent_node
		var root_topic = function(root_topic_index) { return root_topic_index == undefined ? data[0] : data[root_topic_index]; }

		root = root_topic(root_topic_index);
		root.x0 = height / 2;
		root.y0 = 0;

		function collapse(d) {
			if (d.children) {
				d._children = d.children;
				d._children.forEach(collapse);
				d.children = null;
			}
		}

		root.children.forEach(collapse);
		update(root);

	});

	d3.select(self.frameElement).style("height", "500px");

	function update(source) {

	  // Compute the new tree layout.
	  var nodes = tree.nodes(root).reverse(),
		  links = tree.links(nodes);

	  // Normalize for fixed-depth.
	  nodes.forEach(function(d) { d.y = d.depth * 180; });

	  // Update the nodes…
	  var node = svg.selectAll("g.node")
		  .data(nodes, function(d) { return d.id || (d.id = ++i); });

	  // Enter any new nodes at the parent's previous position.
	  var nodeEnter = node.enter().append("g")
		  .attr("class", "node")
		  .attr("transform", function(d) { return "translate(" + source.y0 + "," + source.x0 + ")"; })
		  .on("click", click);

	  nodeEnter.append("circle")
		  .attr("r", 1e-6)
		  .style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; });

	  nodeEnter.append("text")
		  .attr("x", function(d) { return d.children || d._children ? -10 : 10; })
		  .attr("dy", ".35em")
		  .attr("text-anchor", function(d) { return d.children || d._children ? "end" : "start"; })
		  .text(function(d) { return d.name; })
		  .style("fill-opacity", 1e-6);

	  // Transition nodes to their new position.
	  var nodeUpdate = node.transition()
		  .duration(duration)
		  .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; });

	  nodeUpdate.select("circle")
		  .attr("r", 4.5)
		  .style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; });

	  nodeUpdate.select("text")
		  .style("fill-opacity", 1);

	  // Transition exiting nodes to the parent's new position.
	  var nodeExit = node.exit().transition()
		  .duration(duration)
		  .attr("transform", function(d) { return "translate(" + source.y + "," + source.x + ")"; })
		  .remove();

	  nodeExit.select("circle")
		  .attr("r", 1e-6);

	  nodeExit.select("text")
		  .style("fill-opacity", 1e-6);

	  // Update the links…
	  var link = svg.selectAll("path.link")
		  .data(links, function(d) { return d.target.id; });

	  // Enter any new links at the parent's previous position.
	  link.enter().insert("path", "g")
		  .attr("class", "link")
		  .attr("d", function(d) {
			var o = {x: source.x0, y: source.y0};
			return diagonal({source: o, target: o});
		  });

	  // Transition links to their new position.
	  link.transition()
		  .duration(duration)
		  .attr("d", diagonal);

	  // Transition exiting nodes to the parent's new position.
	  link.exit().transition()
		  .duration(duration)
		  .attr("d", function(d) {
			var o = {x: source.x, y: source.y};
			return diagonal({source: o, target: o});
		  })
		  .remove();

	  // Stash the old positions for transition.
	  nodes.forEach(function(d) {
		d.x0 = d.x;
		d.y0 = d.y;
	  });
	}

	// Toggle children on click.
	function click(d) {
	  if (d.children) {
		d._children = d.children;
		d.children = null;
	  } else {
		d.children = d._children;
		d._children = null;
	  }
	  update(d);
	}


}

function render_influencers_bubble_chart(element_id,root){

	var margin = {top: 10, right:10, bottom: 10, left: 10},
		full_width = parseInt($(element_id).parent().width(), 10),
		width = full_width - margin.left - margin.right,
		full_height = 500,
		height = full_height - margin.top - margin.bottom;

	var color = d3.scale.category20();

	var list_of_categories = ['All'];

	root.children.forEach(function(child){
		list_of_categories.indexOf(child.category) == -1 ?  list_of_categories.push(child.category) : false;
	});

	var y = d3.scale.linear()
		.domain([0, list_of_categories.length])
		.range([0,height *.5]);

	var bubble = d3.layout.pack()
		.sort(null)
		.size([width, height])
		.padding(1.5);

	var svg = d3.select(element_id).append("svg")
			.attr("width", width + margin.right + margin.left)
			.attr("height", height + margin.top + margin.bottom)
		.append("g")
			.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	var legend = svg.append('g')
		.attr('class','legend');

	var category = legend.selectAll('.category')
			.data(list_of_categories)
		.enter().append('g')
			.attr('class','category')
		.attr('transform', function(d,i) { return 'translate('+ 10 +','+  y(i) +')'})
		.on('click',function(d,i){
			filter_and_render(root,d, $('input[type=radio][name=metric]:checked').val())
		});

	var category_label = category.append('text')
		.text(function(d,i){ return d })
			.style('stroke','none')
			.style('fill', function(d,i){ return color(d) })
			.style('font-size','12')
			.style('cursor','pointer')
		.attr('transform', function(d,i) { return 'translate('+ 10 +','+ 3 +')'});

	category.append('circle')
		.attr('r',5)
		.attr('fill',function(d,i){
			return color(d);
		});

	d3.selectAll('input[type=radio][name=metric]').on('change',function(){
		return filter_and_render(root,'All',this.value);
	});

	function filter_and_render(data,category,metric = 'slatescore'){

		var min_size = d3.min(root.children,function(d){ return d[metric] });
		bubble.value(function(d) { return (d.size - (min_size - min_size*.05)) });

		var node = svg.selectAll(".node")
			.data(bubble.nodes(classes(data,metric))
                  .filter(function(d){ return category == 'All' ? !d.children : !d.children && d.category == category;}));

		/*node
			.transition().duration(1000)
			.attr("transform", function(d) { return "translate(" + d.x + "," + (d.y + margin.left) + ")"; });*/

		node.select("title")
			.text(function(d) { return d.className + ": " + d.value; });

		node.select("circle")
			.style("fill", function(d) { return color(d.category); })
				.transition().duration(250)
				.attr("r", function(d) { return d.r; });

		node.select("text")
			.attr("dy", ".3em")
			.style("text-anchor", "middle")
			.text(function(d) { return d.size.toString().substring(0, d.r / 3); });

		var new_node = node.enter().append("g")
				.attr("class", "node")
				.attr("transform", function(d) { return "translate(" + d.x + "," + (d.y + margin.left) + ")"; });

		new_node.append("title")
			.text(function(d) { return d.className + ": " + d.value; });

		new_node.append("circle")
			.style("fill", function(d) { return color(d.category); })
				.attr("r", function(d) { return d.r; });


		new_node.append("text")
			.attr("dy", ".3em")
			.style("text-anchor", "middle")
			.text(function(d) { return d.size.toString().substring(0, d.r / 3); });

		var old_nodes = node.exit().remove();

		// Returns a flattened hierarchy containing all leaf nodes under the root.
		function classes(root,metric) {
			var classes = [];
			function recurse(name, node) {
				if (node.children) node.children.forEach(function(child) { recurse(node.name, child); });
				else classes.push({packageName: name, className: node.name, size: node[metric], category:node.category});
			}
			recurse(null, root);
			return {children: classes};
		}

	}

	filter_and_render(root,'All');
}

////////////////////////////////////////////////////////////////////
//
//						Colors Scale
//
//////////////////////////////////////////////////////////////////

vpv_colors = ['green','blue','yellow'];
video_length_colors = ['#56C5B8','#0096C8','#00507D'];

////////////////////////////////////////////////////////////////////
//
//						D3 utils
//
//////////////////////////////////////////////////////////////////

function d3_throw_error(element_id,json,error){
	console.log(error);
	console.log(json);

	$(element_id).removeClass('ajax-loader');
	$(element_id).html('<p><em>No data to display</em></p>');
}